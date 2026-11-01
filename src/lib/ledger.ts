import { getDb, DatabaseClient } from './db';
import { BULAN_INDONESIA, BULAN_INDONESIA_SHORT } from './format';
import { LedgerItem, MonthLedgerSummary, MonthLockStatus } from './types';

export interface LedgerFilterOptions {
  category?: string;
  houseCode?: string;
  type?: 'masuk' | 'keluar';
  search?: string;
}

export type RawLedgerItem = {
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
};

// Get system opening balance (from settings, defaults to 0)
export async function getInitialOpeningBalance(db: DatabaseClient = getDb()): Promise<{ balance: number; effectiveDate: string }> {
  const [row, dateRow] = await Promise.all([
    db.prepare('SELECT value FROM settings WHERE key = ?').get('opening_balance') as Promise<{ value: string } | undefined>,
    db.prepare('SELECT value FROM settings WHERE key = ?').get('opening_balance_date') as Promise<{ value: string } | undefined>,
  ]);
  return {
    balance: row ? parseInt(row.value, 10) || 0 : 0,
    effectiveDate: dateRow ? dateRow.value : '2025-06-01',
  };
}

// Fetch all chronological ledger items up to a specific end date (or all)
export async function getAllLedgerRawItems(db: DatabaseClient = getDb(), upToDate?: string): Promise<Array<RawLedgerItem>> {
  const items: Array<RawLedgerItem> = [];

  // Run all 4 table queries in parallel
  const [paymentsQuery, otherIncomeQuery, expensesQuery, advanceSettlementsQuery] = await Promise.all([
    upToDate
      ? db.prepare('SELECT * FROM payments WHERE date <= ? ORDER BY date ASC, created_at ASC').all(upToDate)
      : db.prepare('SELECT * FROM payments ORDER BY date ASC, created_at ASC').all(),
    upToDate
      ? db.prepare('SELECT * FROM other_income WHERE date <= ? ORDER BY date ASC, created_at ASC').all(upToDate)
      : db.prepare('SELECT * FROM other_income ORDER BY date ASC, created_at ASC').all(),
    upToDate
      ? db.prepare('SELECT * FROM expenses WHERE date <= ? ORDER BY date ASC, created_at ASC').all(upToDate)
      : db.prepare('SELECT * FROM expenses ORDER BY date ASC, created_at ASC').all(),
    upToDate
      ? db.prepare("SELECT * FROM advance_settlements WHERE settlement_type = 'cash' AND date <= ? ORDER BY date ASC, created_at ASC").all(upToDate)
      : db.prepare("SELECT * FROM advance_settlements WHERE settlement_type = 'cash' ORDER BY date ASC, created_at ASC").all(),
  ]);

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
export async function calculateOpeningBalanceForMonth(
  yearMonth: string,
  db: DatabaseClient = getDb(),
  preloadedAllItems?: Array<RawLedgerItem>,
  preloadedInitialBalance?: number
): Promise<number> {
  const initialBalance = preloadedInitialBalance !== undefined
    ? preloadedInitialBalance
    : (await getInitialOpeningBalance(db)).balance;

  const startOfMonth = `${yearMonth}-01`;
  const allItems = preloadedAllItems || (await getAllLedgerRawItems(db, `${yearMonth}-00`));

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
  db: DatabaseClient = getDb(),
  preloadedAllItems?: Array<RawLedgerItem>,
  preloadedInitialBalance?: number,
  preloadedLockRow?: any
): Promise<MonthLedgerSummary> {
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
  const startOfMonth = `${yearMonth}-01`;
  const endOfMonth = `${yearMonth}-31`;

  // Compute opening balance, lock status, and raw items concurrently
  const [openingBalance, lockRow, allRawItems] = await Promise.all([
    calculateOpeningBalanceForMonth(yearMonth, db, preloadedAllItems, preloadedInitialBalance),
    preloadedLockRow !== undefined
      ? Promise.resolve(preloadedLockRow)
      : (db.prepare('SELECT * FROM month_locks WHERE year_month = ?').get(yearMonth) as Promise<any>),
    preloadedAllItems ? Promise.resolve(preloadedAllItems) : getAllLedgerRawItems(db),
  ]);

  const status: MonthLockStatus = lockRow?.status === 'terkunci' ? 'terkunci' : 'draft';

  // Get raw items for this month
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
    year,
    month,
    year_month: yearMonth,
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
 * Returns 12-month summary for a selected year with blazing-fast single-pass memory execution
 */
export async function getYearLedgerSummary(
  year: number,
  db: DatabaseClient = getDb(),
  preloadedAllItems?: Array<RawLedgerItem>,
  preloadedInitialBalance?: number
): Promise<{
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
  // Pre-load all data in parallel!
  const [allRawItems, initialBalObj, lockRows] = await Promise.all([
    preloadedAllItems ? Promise.resolve(preloadedAllItems) : getAllLedgerRawItems(db),
    preloadedInitialBalance !== undefined
      ? Promise.resolve({ balance: preloadedInitialBalance })
      : getInitialOpeningBalance(db),
    db.prepare('SELECT * FROM month_locks WHERE year_month LIKE ?').all(`${year}-%`),
  ]);

  const initialBalance = initialBalObj.balance;
  const locksMap = new Map<string, any>((lockRows as any[]).map((r) => [r.year_month, r]));

  // Calculate opening balance at start of January (year-01-01)
  const startOfYear = `${year}-01-01`;
  let runningBalance = initialBalance;
  for (const item of allRawItems) {
    if (item.date < startOfYear) {
      runningBalance += item.masuk - item.keluar;
    }
  }

  // Pre-bucket items by month for O(1) retrieval
  const monthItemsMap = new Map<number, RawLedgerItem[]>();
  for (let m = 1; m <= 12; m++) {
    monthItemsMap.set(m, []);
  }

  for (const item of allRawItems) {
    if (item.date.startsWith(`${year}-`)) {
      const m = parseInt(item.date.slice(5, 7), 10);
      if (monthItemsMap.has(m)) {
        monthItemsMap.get(m)!.push(item);
      }
    }
  }

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

  // Single sequential in-memory pass for all 12 months
  for (let m = 1; m <= 12; m++) {
    const ym = `${year}-${String(m).padStart(2, '0')}`;
    const mItems = monthItemsMap.get(m) || [];
    const openingBal = runningBalance;

    let mPemasukan = 0;
    let mPengeluaran = 0;
    for (const it of mItems) {
      mPemasukan += it.masuk;
      mPengeluaran += it.keluar;
    }

    const closingBal = openingBal + mPemasukan - mPengeluaran;
    runningBalance = closingBal;

    const lock = locksMap.get(ym);
    const status: MonthLockStatus = lock?.status === 'terkunci' ? 'terkunci' : 'draft';

    months.push({
      month: m,
      month_name: BULAN_INDONESIA[m],
      year_month: ym,
      opening_balance: openingBal,
      pemasukan: mPemasukan,
      pengeluaran: mPengeluaran,
      closing_balance: closingBal,
      status,
    });

    yearPemasukan += mPemasukan;
    yearPengeluaran += mPengeluaran;
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
 * Multi-year overview: each recorded year's summary with preloaded items
 */
export async function getMultiYearLedgerSummary(db: DatabaseClient = getDb()): Promise<Array<{
  year: number;
  opening_balance: number;
  total_pemasukan: number;
  total_pengeluaran: number;
  closing_balance: number;
}>> {
  const [allRawItems, initialBalObj] = await Promise.all([
    getAllLedgerRawItems(db),
    getInitialOpeningBalance(db),
  ]);

  const yearsSet = new Set<number>();
  for (const item of allRawItems) {
    const y = parseInt(item.date.slice(0, 4), 10);
    if (!isNaN(y)) yearsSet.add(y);
  }
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
    const yr = await getYearLedgerSummary(y, db, allRawItems, initialBalObj.balance);
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
