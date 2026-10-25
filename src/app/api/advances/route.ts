import { NextResponse } from 'next/server';
import { getDb, recordAuditLog } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const advances = db.prepare('SELECT * FROM advances ORDER BY date DESC').all() as any[];
    const settlements = db.prepare('SELECT * FROM advance_settlements ORDER BY date DESC').all() as any[];

    const settlementsByAdv: Record<string, any[]> = {};
    for (const s of settlements) {
      if (!settlementsByAdv[s.advance_id]) settlementsByAdv[s.advance_id] = [];
      settlementsByAdv[s.advance_id].push(s);
    }

    const data = advances.map((a) => ({
      ...a,
      settlements: settlementsByAdv[a.id] || [],
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { action = 'create', resident_name, house_code, description, amount, date, advance_id, settlement_type, due_year_month, note } = body;

    const txDate = date || new Date().toISOString().slice(0, 10);

    if (action === 'create') {
      if (!resident_name || !amount || amount <= 0 || !description) {
        return NextResponse.json({ success: false, error: 'Nama warga, nominal talangan, dan deskripsi wajib diisi' }, { status: 400 });
      }

      const id = `ADV-${Date.now()}`;
      const advanceNumber = `ADV-${txDate.replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;

      db.prepare(`
        INSERT INTO advances (id, advance_number, date, resident_name, house_code, description, total_amount, settled_amount, balance, status, note, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'active', ?, datetime('now'), datetime('now'))
      `).run(id, advanceNumber, txDate, resident_name, house_code || null, description, amount, amount, note || null);

      recordAuditLog('Bendahara', 'CREATE', 'advance', id, null, { resident_name, house_code, amount, description });

      return NextResponse.json({ success: true, id, advanceNumber });
    }

    if (action === 'settle') {
      if (!advance_id || !amount || amount <= 0) {
        return NextResponse.json({ success: false, error: 'ID talangan dan nominal pelunasan wajib diisi' }, { status: 400 });
      }

      const adv = db.prepare('SELECT * FROM advances WHERE id = ?').get(advance_id) as any;
      if (!adv) {
        return NextResponse.json({ success: false, error: 'Data talangan tidak ditemukan' }, { status: 404 });
      }

      if (amount > adv.balance) {
        return NextResponse.json({ success: false, error: `Nominal pelunasan (${amount}) melebihi sisa talangan (${adv.balance})` }, { status: 400 });
      }

      const settleId = `SETTLE-${Date.now()}`;
      const newSettled = adv.settled_amount + amount;
      const newBalance = adv.total_amount - newSettled;
      const newStatus = newBalance <= 0 ? 'settled' : 'active';

      db.transaction(() => {
        db.prepare(`
          INSERT INTO advance_settlements (id, advance_id, date, amount, settlement_type, due_year_month, note, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(settleId, advance_id, txDate, amount, settlement_type || 'dues_offset', due_year_month || null, note || null);

        db.prepare(`
          UPDATE advances
          SET settled_amount = ?, balance = ?, status = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(newSettled, newBalance, newStatus, advance_id);

        recordAuditLog('Bendahara', 'UPDATE', 'advance_settlement', settleId, null, {
          advance_id,
          amount,
          settlement_type,
          remainingBalance: newBalance,
        });
      })();

      return NextResponse.json({ success: true, settleId, remainingBalance: newBalance, status: newStatus });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
