import { NextResponse } from 'next/server';
import { getDb, recordAuditLog } from '@/lib/db';
import { normalizeHouseCode, formatRupiah, formatTanggal, formatBulanTahun } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { code: string } }) {
  try {
    const db = getDb();
    const code = normalizeHouseCode(params.code);

    const house = (await db.prepare('SELECT * FROM houses WHERE code = ?').get(code)) as any;
    if (!house) {
      return NextResponse.json({ success: false, error: 'Rumah tidak ditemukan' }, { status: 404 });
    }

    // Residents history
    const residents = (await db.prepare('SELECT * FROM residents WHERE house_code = ? ORDER BY start_date ASC').all(code)) as any[];

    // Subscriptions
    const subscriptions = (await db.prepare(`
      SELECT s.*, f.amount
      FROM house_subscriptions s
      JOIN fee_components f ON s.component_id = f.id
      WHERE s.house_code = ?
    `).all(code)) as any[];

    // Dues history
    const dues = (await db.prepare(`
      SELECT * FROM dues
      WHERE house_code = ?
      ORDER BY year_month ASC
    `).all(code)) as any[];

    // Payments history
    const payments = (await db.prepare(`
      SELECT * FROM payments
      WHERE house_code = ?
      ORDER BY date DESC, created_at DESC
    `).all(code)) as any[];

    // Payment allocations
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

    // Credits
    const credits = (await db.prepare('SELECT * FROM house_credits WHERE house_code = ? ORDER BY created_at DESC').all(code)) as any[];
    const totalCredit = credits.reduce((sum, c) => sum + c.amount, 0);

    // Advances associated with this house
    const advances = (await db.prepare('SELECT * FROM advances WHERE house_code = ? ORDER BY date DESC').all(code)) as any[];

    // Outstanding unpaid dues list
    const unpaidDues = dues.filter((d) => (d.amount - d.paid_amount) > 0);
    const totalOwed = unpaidDues.reduce((sum, d) => sum + (d.amount - d.paid_amount), 0);

    // Current active resident
    const activeResident = residents.find((r) => r.is_active) || residents[residents.length - 1] || null;

    // Printable Statement (Surat Tagihan) Data
    const statement = {
      title: 'SURAT TAGIHAN IURAN WARGA',
      clusterName: 'Paradessa Habitat',
      clusterAddress: 'Jl. Desa Banda Asri RT.02/RW.09, Desa Pananjung, Kec. Cangkuang, Kab. Bandung, Jawa Barat 40238',
      statementNumber: `TAG-${code}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
      date: formatTanggal(new Date().toISOString().slice(0, 10), false),
      houseCode: code,
      recipientName: activeResident ? activeResident.name : `Penghuni Blok ${code}`,
      recipientPhone: activeResident?.phone || '-',
      handoverDate: house.handover_date ? formatTanggal(house.handover_date, false) : '-',
      totalOutstanding: totalOwed,
      totalCredit,
      netPayable: Math.max(0, totalOwed - totalCredit),
      unpaidItems: unpaidDues.map((d) => ({
        yearMonth: d.year_month,
        periodLabel: formatBulanTahun(d.year_month),
        component: d.component_name,
        amount: d.amount,
        paid: d.paid_amount,
        remaining: d.amount - d.paid_amount,
      })),
      bankInfo: {
        bankName: 'BCA',
        accountNumber: '123-456-7890',
        accountHolder: 'Bendahara Paradessa Habitat',
      },
    };

    return NextResponse.json({
      success: true,
      house,
      residents,
      activeResident,
      subscriptions,
      totalOwed,
      totalCredit,
      netOutstanding: Math.max(0, totalOwed - totalCredit),
      timeline: {
        payments: payments.map((p) => ({ ...p, allocations: allocationsByPayment[p.id] || [] })),
        dues,
        unpaidDues,
        credits,
        advances,
      },
      statement,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { code: string } }) {
  try {
    const db = getDb();
    const code = normalizeHouseCode(params.code);
    const body = await request.json();
    const { status, handover_date, is_merged, merged_with, notes } = body;

    await db.prepare(`
      UPDATE houses
      SET status = coalesce(?, status),
          handover_date = ?,
          is_merged = coalesce(?, is_merged),
          merged_with = ?,
          notes = ?,
          updated_at = datetime('now')
      WHERE code = ?
    `).run(status, handover_date || null, is_merged !== undefined ? (is_merged ? 1 : 0) : null, merged_with || null, notes || null, code);

    await recordAuditLog('Bendahara', 'UPDATE', 'house', `H-${code}`, null, body, db);
    return NextResponse.json({ success: true, code });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
