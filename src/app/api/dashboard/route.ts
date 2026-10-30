import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getMonthLedger, getYearLedgerSummary } from '@/lib/ledger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const now = new Date();

    // Default to the latest transaction month in the database or today's date
    const latestTxRow = (await db.prepare(`
      SELECT max(date) as max_date FROM (
        SELECT date FROM payments
        UNION ALL
        SELECT date FROM expenses
      )
    `).get()) as { max_date: string | null } | undefined;

    const defaultYearMonth = latestTxRow?.max_date ? latestTxRow.max_date.slice(0, 7) : now.toISOString().slice(0, 7);
    const [defY, defM] = defaultYearMonth.split('-').map(Number);

    const year = parseInt(searchParams.get('year') || String(defY), 10);
    const month = parseInt(searchParams.get('month') || String(defM), 10);

    // Current month ledger (calculates opening, masuk, keluar, and closing balance)
    const currentMonthLedger = await getMonthLedger(year, month, undefined, db);

    // Current cash balance across all transactions up to end of this month
    const allLedger = await getYearLedgerSummary(year, db);
    const currentBalance = currentMonthLedger.closing_balance;

    // Transaction counts and last transaction in this month
    const masukTxs = currentMonthLedger.items.filter((t) => t.type === 'masuk');
    const keluarTxs = currentMonthLedger.items.filter((t) => t.type === 'keluar');
    const lastTx = currentMonthLedger.items.length > 0
      ? currentMonthLedger.items[currentMonthLedger.items.length - 1]
      : null;

    // Collection rate & Arrears for this month
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

    // 1. Get all occupied houses (excluding kosong and kantor)
    const occupiedHouses = (await db.prepare(`
      SELECT code, handover_date
      FROM houses
      WHERE status NOT IN ('kosong', 'kantor')
      ORDER BY block ASC, length(code) ASC, code ASC
    `).all()) as Array<{ code: string; handover_date: string | null }>;

    // 2. Identify which houses have paid for this month (from payment_allocations or dues with status 'lunas')
    const paidAllocRows = (await db.prepare(`
      SELECT DISTINCT house_code
      FROM payment_allocations
      WHERE year_month = ?
    `).all(yearMonth)) as Array<{ house_code: string }>;

    const paidDuesRows = (await db.prepare(`
      SELECT DISTINCT house_code
      FROM dues
      WHERE year_month = ? AND status = 'lunas'
    `).all(yearMonth)) as Array<{ house_code: string }>;

    const paidHouseCodes = new Set([
      ...paidAllocRows.map((r) => r.house_code),
      ...paidDuesRows.map((r) => r.house_code),
    ]);

    // Filter billed houses based on handover date (must be on or before this month)
    const billedHouses = occupiedHouses.filter(
      (h) => !h.handover_date || h.handover_date.slice(0, 7) <= yearMonth
    );
    const totalBilled = billedHouses.length;
    const totalPaid = billedHouses.filter((h) => paidHouseCodes.has(h.code)).length;
    const percentage = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

    // 3. Arrears: houses in billedHouses that haven't paid for yearMonth or have earlier unpaid dues
    const duesDebtRows = (await db.prepare(`
      SELECT house_code, sum(amount - paid_amount) as debt, group_concat(DISTINCT year_month) as months
      FROM dues
      WHERE status != 'lunas' AND (amount - paid_amount) > 0
      GROUP BY house_code
    `).all()) as Array<{ house_code: string; debt: number; months: string }>;

    const arrearsMap = new Map<string, { houseCode: string; totalOwed: number; monthsOwed: string[] }>();

    for (const d of duesDebtRows) {
      arrearsMap.set(d.house_code, {
        houseCode: d.house_code,
        totalOwed: d.debt,
        monthsOwed: (d.months || '').split(','),
      });
    }

    const unpaidHousesThisMonth = billedHouses.filter((h) => !paidHouseCodes.has(h.code));
    for (const uh of unpaidHousesThisMonth) {
      const existing = arrearsMap.get(uh.code);
      if (existing) {
        if (!existing.monthsOwed.includes(yearMonth)) {
          existing.monthsOwed.push(yearMonth);
          existing.totalOwed += 120000;
        }
      } else {
        arrearsMap.set(uh.code, {
          houseCode: uh.code,
          totalOwed: 120000,
          monthsOwed: [yearMonth],
        });
      }
    }

    const arrears = Array.from(arrearsMap.values()).sort((a, b) => b.totalOwed - a.totalOwed);

    // 12-month bar chart data for selected year
    const chartData = allLedger.months.map((m) => ({
      month: m.month_name.slice(0, 3),
      monthNum: m.month,
      pemasukan: m.pemasukan,
      pengeluaran: m.pengeluaran,
      saldo: m.closing_balance,
    }));

    return NextResponse.json({
      success: true,
      currentBalance,
      thisMonth: {
        year,
        month,
        yearMonth,
        monthName: currentMonthLedger.month_name,
        pemasukan: currentMonthLedger.total_masuk,
        pengeluaran: currentMonthLedger.total_keluar,
        pemasukanCount: masukTxs.length,
        pengeluaranCount: keluarTxs.length,
        saldoAwal: currentMonthLedger.opening_balance,
        saldoAkhir: currentMonthLedger.closing_balance,
        lastTransaction: lastTx
          ? {
              date: lastTx.date,
              description: lastTx.description,
              type: lastTx.type,
              amount: lastTx.type === 'masuk' ? lastTx.masuk : lastTx.keluar,
            }
          : null,
        collectionRate: {
          billed: totalBilled,
          paid: totalPaid,
          percentage,
        },
      },
      arrears,
      chartData,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
