import { NextResponse } from 'next/server';
import { getDb, recordAuditLog } from '@/lib/db';
import { getHouseBlock, normalizeHouseCode } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const houses = (await db.prepare('SELECT * FROM houses ORDER BY block ASC, length(code) ASC, code ASC').all()) as any[];

    // Fetch residents for each house
    const residents = (await db.prepare('SELECT * FROM residents ORDER BY start_date DESC').all()) as any[];
    const residentsByHouse: Record<string, any[]> = {};
    for (const r of residents) {
      if (!residentsByHouse[r.house_code]) residentsByHouse[r.house_code] = [];
      residentsByHouse[r.house_code].push(r);
    }

    // Fetch subscriptions
    const subs = (await db.prepare(`
      SELECT s.*, f.amount
      FROM house_subscriptions s
      JOIN fee_components f ON s.component_id = f.id
      WHERE s.is_active = 1
    `).all()) as any[];
    const subsByHouse: Record<string, any[]> = {};
    for (const s of subs) {
      if (!subsByHouse[s.house_code]) subsByHouse[s.house_code] = [];
      subsByHouse[s.house_code].push(s);
    }

    // Outstanding balance per house
    const duesBalances = (await db.prepare(`
      SELECT house_code, sum(amount - paid_amount) as total_owed
      FROM dues
      WHERE (amount - paid_amount) > 0
      GROUP BY house_code
    `).all()) as any[];
    const owedByHouse: Record<string, number> = {};
    for (const d of duesBalances) {
      owedByHouse[d.house_code] = d.total_owed;
    }

    // Overpayment credit per house
    const creditRows = (await db.prepare('SELECT house_code, sum(amount) as credit FROM house_credits GROUP BY house_code').all()) as any[];
    const creditByHouse: Record<string, number> = {};
    for (const c of creditRows) {
      creditByHouse[c.house_code] = c.credit;
    }

    const data = houses.map((h) => ({
      ...h,
      residents: residentsByHouse[h.code] || [],
      currentResident: (residentsByHouse[h.code] || []).find((r) => r.is_active) || (residentsByHouse[h.code] || [])[0] || null,
      subscriptions: subsByHouse[h.code] || [],
      totalOwed: owedByHouse[h.code] || 0,
      creditBalance: creditByHouse[h.code] || 0,
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
    const { code, status = 'dihuni', handover_date, is_merged = false, merged_with, notes, resident_name, phone } = body;

    const normCode = normalizeHouseCode(code);
    if (!normCode) {
      return NextResponse.json({ success: false, error: 'Kode rumah wajib diisi (contoh: A1, B38)' }, { status: 400 });
    }

    const houseId = `H-${normCode}`;
    const block = getHouseBlock(normCode);

    await db.prepare(`
      INSERT INTO houses (id, code, block, status, handover_date, is_merged, merged_with, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(code) DO UPDATE SET
        status = excluded.status,
        handover_date = excluded.handover_date,
        is_merged = excluded.is_merged,
        merged_with = excluded.merged_with,
        notes = excluded.notes,
        updated_at = datetime('now')
    `).run(houseId, normCode, block, status, handover_date || null, is_merged ? 1 : 0, merged_with || null, notes || null);

    if (resident_name && resident_name.trim()) {
      const resId = `R-${normCode}-${Date.now()}`;
      await db.prepare(`
        INSERT INTO residents (id, house_id, house_code, name, phone, start_date, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, coalesce(?, date('now')), 1, datetime('now'))
      `).run(resId, houseId, normCode, resident_name.trim(), phone || null, handover_date || null);
    }

    await recordAuditLog('Bendahara', 'CREATE', 'house', houseId, null, { code: normCode, status, resident_name }, db);

    return NextResponse.json({ success: true, houseId, code: normCode });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
