import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateAutoAllocation } from '@/lib/allocation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { house_code, amount, date } = body;

    if (!house_code) {
      return NextResponse.json({ success: false, error: 'Kode rumah wajib diisi' }, { status: 400 });
    }

    const txDate = date || new Date().toISOString().slice(0, 10);
    const txYearMonth = txDate.slice(0, 7);

    // 1. Get house subscriptions
    const subRows = (await db.prepare(`
      SELECT s.component_name, f.amount
      FROM house_subscriptions s
      JOIN fee_components f ON s.component_id = f.id
      WHERE s.house_code = ? AND s.is_active = 1
    `).all(house_code)) as any[];

    // Fallback if not explicitly subscribed in table: default to 3 components (Pokok, Air, Sampah)
    const subscriptions = subRows.length > 0 ? subRows : [
      { component_name: 'Pokok', amount: 50000 },
      { component_name: 'Air', amount: 20000 },
      { component_name: 'Sampah', amount: 50000 },
    ];

    // 2. Get existing unpaid dues for this house
    const duesRows = (await db.prepare(`
      SELECT id, year_month, component_name, amount, paid_amount, (amount - paid_amount) as remaining
      FROM dues
      WHERE house_code = ? AND (amount - paid_amount) > 0
      ORDER BY year_month ASC
    `).all(house_code)) as any[];

    // 3. Quick lunas calculation: how much is needed to pay all unpaid dues up to current month
    let quickLunasAmount = 0;
    for (const d of duesRows) {
      if (d.year_month <= txYearMonth) {
        quickLunasAmount += d.remaining;
      }
    }
    // If no unpaid dues recorded up to current month, calculate standard 1 month fee
    if (quickLunasAmount === 0) {
      quickLunasAmount = subscriptions.reduce((s, c) => s + c.amount, 0);
    }

    // 4. Calculate auto allocation for the requested amount
    const payAmount = parseInt(String(amount || 0), 10);
    const allocationResult = calculateAutoAllocation(payAmount, duesRows, subscriptions, txYearMonth);

    // 5. Existing house credit
    const creditRow = (await db.prepare('SELECT sum(amount) as total_credit FROM house_credits WHERE house_code = ?').get(house_code)) as any;

    return NextResponse.json({
      success: true,
      house_code,
      subscriptions,
      unpaidDues: duesRows,
      quickLunasAmount,
      existingCredit: creditRow?.total_credit || 0,
      preview: allocationResult,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
