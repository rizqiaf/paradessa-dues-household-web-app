import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateAutoAllocation, getNextYearMonth } from '@/lib/allocation';
import { BULAN_INDONESIA } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { house_code, amount, date, target_month } = body;

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

    // 3. Find last paid month for this house from payment_allocations
    const lastPaidRow = (await db.prepare(`
      SELECT max(year_month) as last_paid
      FROM payment_allocations
      WHERE house_code = ?
    `).get(house_code)) as any;

    const lastPaidMonth = lastPaidRow?.last_paid || null;
    let suggestedMonth = txYearMonth; // Default to transaction month (e.g. 2026-10)

    if (duesRows.length > 0) {
      // If there are recorded unpaid dues, start from the oldest unpaid due
      suggestedMonth = duesRows[0].year_month;
    } else if (lastPaidMonth) {
      // If no recorded unpaid dues, start right after the last paid month!
      suggestedMonth = getNextYearMonth(lastPaidMonth);
    }

    // Determine the active target month
    const effectiveTargetMonth = (target_month && target_month !== 'auto')
      ? target_month
      : suggestedMonth;

    // 4. Quick lunas calculation: how much is needed to pay all unpaid dues up to current month
    let quickLunasAmount = 0;
    for (const d of duesRows) {
      if (d.year_month <= txYearMonth) {
        quickLunasAmount += d.remaining;
      }
    }
    if (quickLunasAmount === 0) {
      quickLunasAmount = subscriptions.reduce((s, c) => s + c.amount, 0);
    }

    // 5. Calculate allocation with target month
    const payAmount = parseInt(String(amount || 0), 10);
    const allocationResult = calculateAutoAllocation(
      payAmount,
      duesRows,
      subscriptions,
      txYearMonth,
      effectiveTargetMonth
    );

    // 6. Existing house credit
    const creditRow = (await db.prepare('SELECT sum(amount) as total_credit FROM house_credits WHERE house_code = ?').get(house_code)) as any;

    // 7. Generate a list of available months for user dropdown selection
    // Include: suggestedMonth, plus range from 2025-10 to 2027-12
    const availableMonths: Array<{ value: string; label: string; isSuggested: boolean; isCurrent: boolean }> = [];
    const [curY, curM] = txYearMonth.split('-').map(Number);

    // Build 24 months window around current year
    const startWindowYear = curY - 1;
    for (let y = startWindowYear; y <= curY + 1; y++) {
      for (let m = 1; m <= 12; m++) {
        const ym = `${y}-${String(m).padStart(2, '0')}`;
        const isCurrent = ym === txYearMonth;
        const isSuggested = ym === suggestedMonth;
        let suffix = '';
        if (isCurrent && isSuggested) suffix = ' (Bulan Ini & Tertunggak)';
        else if (isCurrent) suffix = ' (Bulan Ini)';
        else if (isSuggested) suffix = ' (Saran Sistem)';

        availableMonths.push({
          value: ym,
          label: `${BULAN_INDONESIA[m]} ${y}${suffix}`,
          isSuggested,
          isCurrent,
        });
      }
    }

    return NextResponse.json({
      success: true,
      house_code,
      subscriptions,
      unpaidDues: duesRows,
      quickLunasAmount,
      existingCredit: creditRow?.total_credit || 0,
      suggestedMonth,
      effectiveTargetMonth,
      lastPaidMonth,
      availableMonths,
      preview: allocationResult,
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
