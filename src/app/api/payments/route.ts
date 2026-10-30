import { NextResponse } from 'next/server';
import { getDb, recordAuditLog } from '@/lib/db';
import { calculateAutoAllocation, getNextYearMonth } from '@/lib/allocation';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const houseCode = searchParams.get('house_code');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let query = 'SELECT * FROM payments';
    const params: any[] = [];
    if (houseCode) {
      query += ' WHERE house_code = ?';
      params.push(houseCode);
    }
    query += ' ORDER BY date DESC, created_at DESC LIMIT ?';
    params.push(limit);

    const payments = (await db.prepare(query).all(...params)) as any[];

    // Fetch allocations for these payments
    const paymentIds = payments.map((p) => p.id);
    let allocationsByPayment: Record<string, any[]> = {};
    if (paymentIds.length > 0) {
      const placeholders = paymentIds.map(() => '?').join(',');
      const allocRows = (await db.prepare(`SELECT * FROM payment_allocations WHERE payment_id IN (${placeholders})`).all(...paymentIds)) as any[];
      for (const a of allocRows) {
        if (!allocationsByPayment[a.payment_id]) allocationsByPayment[a.payment_id] = [];
        allocationsByPayment[a.payment_id].push(a);
      }
    }

    const result = payments.map((p) => ({
      ...p,
      allocations: allocationsByPayment[p.id] || [],
    }));

    return NextResponse.json({ success: true, data: result }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      house_code,
      payer_name,
      amount,
      date,
      method = 'transfer',
      proof_photo,
      note,
      custom_allocations,
      target_month,
    } = body;

    if (!house_code || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Rumah dan nominal pembayaran valid wajib diisi' }, { status: 400 });
    }

    const txDate = date || new Date().toISOString().slice(0, 10);
    const txYearMonth = txDate.slice(0, 7);

    // Check month lock
    const lock = (await db.prepare("SELECT status FROM month_locks WHERE year_month = ? AND status = 'terkunci'").get(txYearMonth)) as any;
    if (lock) {
      return NextResponse.json({
        success: false,
        error: `Bulan ${txYearMonth} telah dikunci (laporan dipublikasikan). Buka kunci bulan terlebih dahulu di menu Pengaturan.`,
      }, { status: 403 });
    }

    // Get house
    const house = (await db.prepare('SELECT id, code FROM houses WHERE code = ?').get(house_code)) as any;
    const houseId = house ? house.id : `H-${house_code}`;
    if (!house) {
      await db.prepare(`
        INSERT INTO houses (id, code, block, status, created_at, updated_at)
        VALUES (?, ?, ?, 'dihuni', datetime('now'), datetime('now'))
      `).run(houseId, house_code, house_code.charAt(0));
    }

    const paymentId = `PAY-${Date.now()}`;
    const paymentNumber = `PAY-${txDate.replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;

    // 1. Insert payment record
    await db.prepare(`
      INSERT INTO payments (id, payment_number, date, house_id, house_code, payer_name, amount, method, proof_photo, note, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(paymentId, paymentNumber, txDate, houseId, house_code, payer_name || `Warga ${house_code}`, amount, method, proof_photo || null, note || null);

    let allocationsToSave = custom_allocations;
    let houseCreditAmount = 0;

    // 2. If no custom allocations provided, run auto-allocation
    if (!allocationsToSave || allocationsToSave.length === 0) {
      const subRows = (await db.prepare(`
        SELECT s.component_name, f.amount
        FROM house_subscriptions s
        JOIN fee_components f ON s.component_id = f.id
        WHERE s.house_code = ? AND s.is_active = 1
      `).all(house_code)) as any[];

      const subscriptions = subRows.length > 0 ? subRows : [
        { component_name: 'Pokok', amount: 50000 },
        { component_name: 'Air', amount: 20000 },
        { component_name: 'Sampah', amount: 50000 },
      ];

      const duesRows = (await db.prepare(`
        SELECT id, year_month, component_name, amount, paid_amount, (amount - paid_amount) as remaining
        FROM dues
        WHERE house_code = ? AND (amount - paid_amount) > 0
        ORDER BY year_month ASC
      `).all(house_code)) as any[];

      const lastPaidRow = (await db.prepare(`
        SELECT max(year_month) as last_paid
        FROM payment_allocations
        WHERE house_code = ?
      `).get(house_code)) as any;

      let suggestedMonth = txYearMonth;
      if (duesRows.length > 0) {
        suggestedMonth = duesRows[0].year_month;
      } else if (lastPaidRow?.last_paid) {
        suggestedMonth = getNextYearMonth(lastPaidRow.last_paid);
      }

      const effectiveTargetMonth = (target_month && target_month !== 'auto')
        ? target_month
        : suggestedMonth;

      const autoResult = calculateAutoAllocation(amount, duesRows, subscriptions, txYearMonth, effectiveTargetMonth);
      allocationsToSave = autoResult.allocations;
      houseCreditAmount = autoResult.houseCredit;
    }

    // 3. Save allocations and update dues
    for (const alloc of allocationsToSave) {
      const allocId = `AL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await db.prepare(`
        INSERT INTO payment_allocations (id, payment_id, due_id, house_id, house_code, year_month, component_name, amount, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(allocId, paymentId, alloc.due_id || null, houseId, house_code, alloc.year_month, alloc.component_name, alloc.amount);

      // Upsert due
      const existingDue = (await db.prepare(`
        SELECT id, amount, paid_amount FROM dues
        WHERE house_code = ? AND year_month = ? AND component_name = ?
      `).get(house_code, alloc.year_month, alloc.component_name)) as any;

      if (existingDue) {
        const newPaid = existingDue.paid_amount + alloc.amount;
        const newStatus = newPaid >= existingDue.amount ? 'lunas' : (newPaid > 0 ? 'sebagian' : 'belum bayar');
        await db.prepare(`
          UPDATE dues
          SET paid_amount = ?, status = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(newPaid, newStatus, existingDue.id);
      } else {
        // Create due
        const dueId = `DUE-${house_code}-${alloc.year_month}-${alloc.component_name}`;
        const dueStatus = alloc.amount >= 50000 ? 'lunas' : 'sebagian';
        await db.prepare(`
          INSERT INTO dues (id, house_id, house_code, year_month, component_id, component_name, amount, paid_amount, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'GEN', ?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(house_code, year_month, component_name) DO UPDATE SET
            paid_amount = dues.paid_amount + excluded.paid_amount,
            status = CASE WHEN (dues.paid_amount + excluded.paid_amount) >= dues.amount THEN 'lunas' ELSE 'sebagian' END,
            updated_at = datetime('now')
        `).run(dueId, houseId, house_code, alloc.year_month, alloc.component_name, alloc.amount, alloc.amount, dueStatus);
      }
    }

    // 4. Overpayment becomes house credit
    if (houseCreditAmount > 0) {
      await db.prepare(`
        INSERT INTO house_credits (id, house_id, house_code, payment_id, amount, note, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Kelebihan pembayaran', datetime('now'), datetime('now'))
      `).run(`CR-${paymentId}`, houseId, house_code, paymentId, houseCreditAmount);
    }

    // 5. Audit log
    await recordAuditLog('Bendahara', 'CREATE', 'payment', paymentId, null, {
      paymentNumber,
      house_code,
      amount,
      date: txDate,
      allocationsCount: allocationsToSave.length,
      credit: houseCreditAmount,
    }, db);

    return NextResponse.json({
      success: true,
      paymentId,
      paymentNumber,
      houseCreditAmount,
      allocationsCount: allocationsToSave.length,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
