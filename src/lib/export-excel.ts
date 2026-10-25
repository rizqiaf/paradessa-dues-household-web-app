import * as XLSX from 'xlsx';
import { MonthLedgerSummary } from './types';

export function exportLedgerToExcel(summary: MonthLedgerSummary) {
  const wb = XLSX.utils.book_new();

  const data = [
    ['BUKU KAS PARADESSA HABITAT'],
    [`Bulan: ${summary.month_name} ${summary.year}`],
    [`Saldo Awal: ${summary.opening_balance}`],
    [],
    ['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Rumah', 'Masuk', 'Keluar', 'Saldo Berjalan'],
  ];

  summary.items.forEach((item) => {
    data.push([
      item.date,
      item.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
      item.category,
      item.description,
      item.house_code || '-',
      item.masuk ? String(item.masuk) : '0',
      item.keluar ? String(item.keluar) : '0',
      String(item.running_balance),
    ]);
  });

  data.push([]);
  data.push(['Total Pemasukan', '', '', '', '', String(summary.total_masuk), '', '']);
  data.push(['Total Pengeluaran', '', '', '', '', '', String(summary.total_keluar), '']);
  data.push(['Saldo Akhir', '', '', '', '', '', '', String(summary.closing_balance)]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, `${summary.month_name}_${summary.year}`);
  XLSX.writeFile(wb, `Buku_Kas_Paradessa_${summary.year}_${String(summary.month).padStart(2, '0')}.xlsx`);
}

export function exportMatrixToExcel(year: number, matrix: any[]) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'No. Rumah', 'Blok', 'Penghuni',
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    'Tunggakan Lalu', 'Total Tagihan', 'Total Terbayar', 'Sisa Tunggakan'
  ];

  const rows = [headers];

  matrix.forEach((h) => {
    const row = [
      h.houseCode,
      h.block,
      h.residentName,
      ...h.months.map((m: any) => m.status),
      h.tagihanSebelumnya,
      h.totalTagihanTahunIni,
      h.totalTerbayarTahunIni,
      h.totalTunggakan,
    ];
    rows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, `Rekap_${year}`);
  XLSX.writeFile(wb, `Rekap_Iuran_Paradessa_${year}.xlsx`);
}
