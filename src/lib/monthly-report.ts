import { getDb, DatabaseClient } from './db';
import { BULAN_INDONESIA, formatNumber, formatRupiah } from './format';
import { getMonthLedger } from './ledger';
import { LedgerItem, MonthLedgerSummary } from './types';

export interface MonthlyReportRow {
  no: number | string;
  bulan: string;
  jenis_transaksi: string;
  keterangan: string;
  masuk: number | null;
  keluar: number | null;
  saldo: number | null;
}

export interface MonthlyReportData {
  addressHeader: string;
  title: string;
  periodText: string;
  yearMonth: string;
  year: number;
  month: number;
  monthName: string;
  openingBalanceRow: MonthlyReportRow;
  pemasukanRows: MonthlyReportRow[];
  totalPemasukan: number;
  pengeluaranRows: MonthlyReportRow[];
  totalPengeluaran: number;
  summary: {
    prevDateLabel: string;
    saldoAwal: number;
    totalMasuk: number;
    totalKeluar: number;
    currentDateLabel: string;
    saldoAkhir: number;
  };
  signature: {
    title: string;
    signer: string;
  };
  footerNote: string;
  isLocked: boolean;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Generates the official report data matching the exact workbook layout
 */
export async function generateMonthlyReportData(
  year: number,
  month: number,
  db: DatabaseClient = getDb()
): Promise<MonthlyReportData> {
  const ledger = await getMonthLedger(year, month, undefined, db);
  const daysInCurMonth = getDaysInMonth(year, month);
  const prevMonthDate = new Date(year, month - 1, 0); // last day of prev month
  const prevDays = prevMonthDate.getDate();
  const prevMonthNum = prevMonthDate.getMonth() + 1;
  const prevYear = prevMonthDate.getFullYear();

  const prevDateLabel = `Saldo per ${prevDays} ${BULAN_INDONESIA[prevMonthNum]} ${prevYear}`;
  const currentDateLabel = `Saldo per ${daysInCurMonth} ${BULAN_INDONESIA[month]} ${year}`;

  const periodText = `1 ${BULAN_INDONESIA[month].slice(0, 3)} - ${daysInCurMonth} ${BULAN_INDONESIA[month].slice(0, 3)} ${year}`;

  // Opening balance row
  const openingBalanceRow: MonthlyReportRow = {
    no: 1,
    bulan: BULAN_INDONESIA[prevMonthNum],
    jenis_transaksi: 'Saldo Awal',
    keterangan: `Saldo sampai dengan tgl ${prevDays} ${BULAN_INDONESIA[prevMonthNum]} ${prevYear}`,
    masuk: null,
    keluar: null,
    saldo: ledger.opening_balance,
  };

  // PEMASUKAN rows
  const pemasukanItems = ledger.items.filter((i) => i.type === 'masuk');
  let pNo = 2;
  const pemasukanRows: MonthlyReportRow[] = pemasukanItems.map((item) => ({
    no: pNo++,
    bulan: BULAN_INDONESIA[month],
    jenis_transaksi: item.category === 'Iuran Warga' ? 'Iuran' : item.category,
    keterangan: item.description,
    masuk: item.masuk,
    keluar: null,
    saldo: null,
  }));

  // PENGELUARAN rows
  const pengeluaranItems = ledger.items.filter((i) => i.type === 'keluar');
  let expNo = 1;
  const pengeluaranRows: MonthlyReportRow[] = pengeluaranItems.map((item) => ({
    no: expNo++,
    bulan: BULAN_INDONESIA[month],
    jenis_transaksi: item.category,
    keterangan: item.description,
    masuk: null,
    keluar: item.keluar,
    saldo: null,
  }));

  return {
    addressHeader: 'Jl. Desa Banda Asri RT.02/RW.09, Desa Pananjung, Kec. Cangkuang, Kab. Bandung, Jawa Barat 40238',
    title: 'LAPORAN KEUANGAN',
    periodText,
    yearMonth: ledger.year_month,
    year,
    month,
    monthName: BULAN_INDONESIA[month],
    openingBalanceRow,
    pemasukanRows,
    totalPemasukan: ledger.total_masuk,
    pengeluaranRows,
    totalPengeluaran: ledger.total_keluar,
    summary: {
      prevDateLabel,
      saldoAwal: ledger.opening_balance,
      totalMasuk: ledger.total_masuk,
      totalKeluar: ledger.total_keluar,
      currentDateLabel,
      saldoAkhir: ledger.closing_balance,
    },
    signature: {
      title: 'Ttd',
      signer: 'Bendahara Paradessa',
    },
    footerNote: 'Paradessa Household Dues',
    isLocked: ledger.status === 'terkunci',
  };
}

/**
 * Generates WhatsApp broadcast text message
 */
export function generateWhatsAppReportSummary(report: MonthlyReportData): string {
  const lines = [
    `*LAPORAN KEUANGAN PARADESSA HABITAT*`,
    `Jl. Desa Banda Asri RT.02/RW.09, Desa Pananjung, Kec. Cangkuang`,
    `*Periode:* ${report.periodText}`,
    `----------------------------------------`,
    `*Saldo Awal:* ${formatRupiah(report.summary.saldoAwal)}`,
    `*Total Pemasukan:* ${formatRupiah(report.summary.totalMasuk)} (${report.pemasukanRows.length} transaksi)`,
    `*Total Pengeluaran:* ${formatRupiah(report.summary.totalKeluar)} (${report.pengeluaranRows.length} transaksi)`,
    `*Saldo Akhir:* *${formatRupiah(report.summary.saldoAkhir)}*`,
    `----------------------------------------`,
    `*Ringkasan Pengeluaran Utama:*`,
  ];

  // Group expenses by category
  const expByCategory: Record<string, number> = {};
  for (const r of report.pengeluaranRows) {
    const cat = r.jenis_transaksi || 'Lain-lain';
    expByCategory[cat] = (expByCategory[cat] || 0) + (r.keluar || 0);
  }

  for (const [cat, sum] of Object.entries(expByCategory)) {
    lines.push(`• ${cat}: ${formatRupiah(sum)}`);
  }

  lines.push('');
  lines.push(`Detail lengkap laporan dapat diakses melalui web aplikasi.`);
  lines.push(`_Ttd Bendahara Paradessa_`);
  lines.push(`_Paradessa Household Dues_`);

  return lines.join('\n');
}
