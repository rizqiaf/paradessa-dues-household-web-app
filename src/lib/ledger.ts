import { getDb, DatabaseClient } from './db';
import { BULAN_INDONESIA, BULAN_INDONESIA_SHORT } from './format';
import { LedgerItem, MonthLedgerSummary, MonthLockStatus } from './types';

export interface LedgerFilterOptions {
  category?: string;
  houseCode?: string;
  type?: 'masuk' | 'keluar';
  search?: string;
}

// Get system opening balance (from settings, defaults to 0)
export async function getInitialOpeningBalance(db: DatabaseClient = getDb()): Promise<{ balance: number; effectiveDate: string }> {
  const row = (await db.prepare('SELECT value FROM settings WHERE key = ?').get('opening_balance')) as { value: string } | undefined;
  const dateRow = (await db.prepare('SELECT value FROM settings WHERE key = ?').get('opening_balance_date')) as { value: string } | undefined;
  return {
    balance: row ? parseInt(row.value, 10) || 0 : 0,
    effectiveDate: dateRow ? dateRow.value : '2025-06-01',
  };
}

// Fetch all chronological ledger items up to a specific end date (or all)
export async function getAllLedgerRawItems(db: DatabaseClient = getDb(), upToDate?: string): Promise<Array<{
  id: string;
  date: string;
  type: 'masuk' | 'keluar';
  category: string;
  description: string;
  house_code: string | null;
  masuk: number;
  keluar: number;
  source_table: 'payment' | 'other_income' | 'expense' | 'advance_settlement';
  source_id: string;
  note: string | null;
  created_at: string;
}>> {
  const items: Array<{
    id: string;
    date: string;
    type: 'masuk' | 'keluar';
    category: string;
    description: string;
    house_code: string | null;
    masuk: number;
    keluar: number;
    source_table: 'payment' | 'other_income' | 'expense' | 'advance_settlement';
    source_id: string;
    note: string | null;
    created_at: string;
  }> = [];

  // Payments
  const paymentsQuery = upToDate
    ? await db.prepare('SELECT * FROM payments WHERE date <= ? ORDER BY date ASC, created_at ASC').all(upToDate)
    : await db.prepare('SELECT * FROM payments ORDER BY date ASC, created_at ASC').all();

  for (const p of paymentsQuery as any[]) {
    let desc = p.note ? `${p.payer_name} - ${p.note}` : `${p.payer_name} (${p.house_code})`;
    if (p.house_code && !desc.includes(p.house_code)) {
      desc = `Blok ${p.house_code} - ${desc}`;
    }
    items.push({
      id: `PAY-${p.id}`,
      date: p.date,
      type: 'masuk',
      category: 'Iuran Warga',
      description: desc,
      house_code: p.house_code,
      masuk: p.amount,
      keluar: 0,
      source_table: 'payment',
      source_id: p.id,
      note: p.note,
      created_at: p.created_at,
    });
  }

  // Other Income
  const otherIncomeQuery = upToDate
    ? await db.prepare('SELECT * FROM other_income WHERE date <= ? ORDER BY date ASC, created_at ASC').all(upToDate)
    : await db.prepare('SELECT * FROM other_income ORDER BY date ASC, created_at ASC').all();

  for (const oi of otherIncomeQuery as any[]) {
    items.push({
      id: `INC-${oi.id}`,
      date: oi.date,
      type: 'masuk',
      category: oi.category || 'Pemasukan Lain',
      description: oi.description,
      house_code: null,
      masuk: oi.amount,
      keluar: 0,
      source_table: 'other_income',
      source_id: oi.id,
      note: oi.note,
      created_at: oi.created_at,
    });
  }

  // Expenses
  const expensesQuery = upToDate
    ? await db.prepare('SELECT * FROM expenses WHERE date <= ? ORDER BY date ASC, created_at ASC').all(upToDate)
    : await db.prepare('SELECT * FROM expenses ORDER BY date ASC, created_at ASC').all();

  for (const exp of expensesQuery as any[]) {
    items.push({
      id: `EXP-${exp.id}`,
      date: exp.date,
      type: 'keluar',
      category: exp.category,
      description: exp.description,
      house_code: null,
      masuk: 0,
      keluar: exp.amount,
      source_table: 'expense',
      source_id: exp.id,
      note: exp.note,
      created_at: exp.created_at,
    });
  }

  // Cash Advance Settlements (Community paying back resident in cash)
  const advanceSettlementsQuery = upToDate
    ? await db.prepare("SELECT * FROM advance_settlements WHERE settlement_type = 'cash' AND date <= ? ORDER BY date ASC, created_at ASC").all(upToDate)
    : await db.prepare("SELECT * FROM advance_settlements WHERE settlement_type = 'cash' ORDER BY date ASC, created_at ASC").all();

  for (const as of advanceSettlementsQuery as any[]) {
    items.push({
      id: `ADV-${as.id}`,
      date: as.date,
      type: 'keluar',
      category: 'Pelunasan Talangan',
      description: as.note || 'Pengembalian Kasbon / Talangan Warga (Tunai)',
      house_code: null,
      masuk: 0,
      keluar: as.amount,
      source_table: 'advance_settlement',
      source_id: as.id,
      note: as.note,
      created_at: as.created_at,
    });
  }

  // Sort strictly by date ASC, then created_at ASC
  items.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.created_at.localeCompare(b.created_at);
  });

  return items;
}

/**
 * Calculates the exact opening balance at the start of a year-month (e.g. "2026-09").
 * Carries over continuously from all transactions before the first day of that month.
 */
export async function calculateOpeningBalanceForMonth(yearMonth: string, db: DatabaseClient = getDb()): Promise<number> {
  const { balance: initialBalance } = await getInitialOpeningBalance(db);
  const startOfMonth = `${yearMonth}-01`;

  // All transactions strictly before startOfMonth
  const allItems = await getAllLedgerRawItems(db, `${yearMonth}-00`);

  let running = initialBalance;
  for (const item of allItems) {
    if (item.date < startOfMonth) {
      running += item.masuk - item.keluar;
    }
  }

  return running;
}

/**
 * Returns dynamic ledger summary for a specific year and month (e.g. 2026, 9)
 */
export async function getMonthLedger(
  year: number,
  month: number,
  filters?: LedgerFilterOptions,
  db: DatabaseClient = getDb()
): Promise<MonthLedgerSummary> {
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
  const startOfMonth = `${yearMonth}-01`;
  const endOfMonth = `${yearMonth}-31`;

  // Compute opening balance
  const openingBalance = await calculateOpeningBalanceForMonth(yearMonth, db);

  // Month lock status
  const lockRow = (await db.prepare('SELECT * FROM month_locks WHERE year_month = ?').get(yearMonth)) as any;
  const status: MonthLockStatus = lockRow?.status === 'terkunci' ? 'terkunci' : 'draft';

  // Get raw items for this month
  const allRawItems = await getAllLedgerRawItems(db);
  const rawItems = allRawItems.filter((i) => i.date >= startOfMonth && i.date <= endOfMonth);

  // Apply filters if provided
  let filteredItems = rawItems;
  if (filters) {
    if (filters.category) {
      filteredItems = filteredItems.filter((i) => i.category.toLowerCase().includes(filters.category!.toLowerCase()));
    }
    if (filters.houseCode) {
      filteredItems = filteredItems.filter((i) => i.house_code === filters.houseCode);
    }
    if (filters.type) {
      filteredItems = filteredItems.filter((i) => i.type === filters.type);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filteredItems = filteredItems.filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.house_code && i.house_code.toLowerCase().includes(q))
      );
    }
  }

  // Calculate chronological running balance
  let currentRunning = openingBalance;
  const itemsWithRunningBalance: LedgerItem[] = [];

  for (const item of filteredItems) {
    currentRunning += item.masuk - item.keluar;
    itemsWithRunningBalance.push({
      ...item,
      running_balance: currentRunning,
    });
  }

  // Subtotals without filters for accurate ledger closing balance
  let totalMasuk = 0;
  let totalKeluar = 0;
  for (const item of rawItems) {
    totalMasuk += item.masuk;
    totalKeluar += item.keluar;
  }
  const closingBalance = openingBalance + totalMasuk - totalKeluar;

  // Warning check if numbers changed after lock
  let hasWarning = false;
  let warningMessage = '';
  if (status === 'terkunci' && lockRow && lockRow.closing_balance_at_lock !== null) {
    if (closingBalance !== lockRow.closing_balance_at_lock) {
      hasWarning = true;
      warningMessage = `Perhatian: Saldo akhir saat ini (${closingBalance}) berbeda dengan saat laporan dikunci (${lockRow.closing_balance_at_lock}). Ada transaksi masa lalu yang telah diubah!`;
    }
  }

  return {
    year_month: yearMonth,
    year,
    month,
    month_name: BULAN_INDONESIA[month],
    opening_balance: openingBalance,
    total_masuk: totalMasuk,
    total_keluar: totalKeluar,
    closing_balance: closingBalance,
    status,
    has_warning: hasWarning,
    warning_message: warningMessage,
    items: itemsWithRunningBalance,
  };
}

/**
 * Returns 12-month summary for a selected year
 */
export async function getYearLedgerSummary(year: number, db: DatabaseClient = getDb()): Promise<{
  year: number;
  months: Array<{
    month: number;
    month_name: string;
    year_month: string;
    opening_balance: number;
    pemasukan: number;
    pengeluaran: number;
    closing_balance: number;
    status: MonthLockStatus;
  }>;
  total_pemasukan: number;
  total_pengeluaran: number;
  net_change: number;
  closing_balance_year: number;
}> {
  const months: Array<{
    month: number;
    month_name: string;
    year_month: string;
    opening_balance: number;
    pemasukan: number;
    pengeluaran: number;
    closing_balance: number;
    status: MonthLockStatus;
  }> = [];

  let yearPemasukan = 0;
  let yearPengeluaran = 0;

  for (let m = 1; m <= 12; m++) {
    const summary = await getMonthLedger(year, m, undefined, db);
    months.push({
      month: m,
      month_name: BULAN_INDONESIA[m],
      year_month: summary.year_month,
      opening_balance: summary.opening_balance,
      pemasukan: summary.total_masuk,
      pengeluaran: summary.total_keluar,
      closing_balance: summary.closing_balance,
      status: summary.status,
    });
    yearPemasukan += summary.total_masuk;
    yearPengeluaran += summary.total_keluar;
  }

  const finalMonth = months[11];
  return {
    year,
    months,
    total_pemasukan: yearPemasukan,
    total_pengeluaran: yearPengeluaran,
    net_change: yearPemasukan - yearPengeluaran,
    closing_balance_year: finalMonth ? finalMonth.closing_balance : 0,
  };
}

/**
 * Multi-year overview: each recorded year's summary
 */
export async function getMultiYearLedgerSummary(db: DatabaseClient = getDb()): Promise<Array<{
  year: number;
  opening_balance: number;
  total_pemasukan: number;
  total_pengeluaran: number;
  closing_balance: number;
}>> {
  // Find all distinct years in transactions
  const rawItems = await getAllLedgerRawItems(db);
  const yearsSet = new Set<number>();
  for (const item of rawItems) {
    const y = parseInt(item.date.slice(0, 4), 10);
    if (!isNaN(y)) yearsSet.add(y);
  }
  // If no transactions, add current year
  if (yearsSet.size === 0) {
    yearsSet.add(new Date().getFullYear());
  }

  const sortedYears = Array.from(yearsSet).sort();
  const results: Array<{
    year: number;
    opening_balance: number;
    total_pemasukan: number;
    total_pengeluaran: number;
    closing_balance: number;
  }> = [];

  for (const y of sortedYears) {
    const yr = await getYearLedgerSummary(y, db);
    const firstMonth = yr.months[0];
    const lastMonth = yr.months[11];
    results.push({
      year: y,
      opening_balance: firstMonth.opening_balance,
      total_pemasukan: yr.total_pemasukan,
      total_pengeluaran: yr.total_pengeluaran,
      closing_balance: lastMonth.closing_balance,
    });
  }

  return results;
}
