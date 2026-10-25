import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getInitialOpeningBalance, getMonthLedger, getYearLedgerSummary } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);

    // Current month ledger
    const currentMonthLedger = getMonthLedger(year, month, undefined, db);

    // Current cash balance across all transactions to date
    const allLedger = getYearLedgerSummary(year, db);
    const currentBalance = currentMonthLedger.closing_balance;

    // Collection rate for this month
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const totalDuesRow = db.prepare(`
      SELECT count(DISTINCT house_code) as total_billed,
             count(DISTINCT CASE WHEN status = 'lunas' THEN house_code END) as total_paid
      FROM dues
      WHERE year_month = ?
    `).get(yearMonth) as any;

    // Arrears: houses that haven't paid or have unpaid dues
    const arrearsRows = db.prepare(`
      SELECT house_code,
             sum(amount - paid_amount) as total_owed,
             group_concat(DISTINCT year_month) as months_owed
      FROM dues
      WHERE status != 'lunas' AND (amount - paid_amount) > 0
      GROUP BY house_code
      ORDER BY total_owed DESC
    `).all() as any[];

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
        saldoAwal: currentMonthLedger.opening_balance,
        saldoAkhir: currentMonthLedger.closing_balance,
        collectionRate: {
          billed: totalDuesRow?.total_billed || 0,
          paid: totalDuesRow?.total_paid || 0,
          percentage: totalDuesRow?.total_billed ? Math.round((totalDuesRow.total_paid / totalDuesRow.total_billed) * 100) : 0,
        },
      },
      arrears: arrearsRows.map((r) => ({
        houseCode: r.house_code,
        totalOwed: r.total_owed,
        monthsOwed: (r.months_owed || '').split(','),
      })),
      chartData,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
