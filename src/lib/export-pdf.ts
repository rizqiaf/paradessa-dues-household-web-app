import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah, formatNumber } from './format';
import { MonthlyReportData } from './monthly-report';
import { MonthLedgerSummary } from './types';
import { PARADESSA_LOGO_DATA_URL } from './logo-data';

// Export official monthly report to PDF
export function exportMonthlyReportToPdf(report: MonthlyReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Official Logo
  try {
    doc.addImage(PARADESSA_LOGO_DATA_URL, 'PNG', (pageWidth - 52) / 2, 7, 52, 7);
  } catch {
    // fallback if image rendering fails
  }

  // Header: Cluster address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(report.addressHeader, pageWidth / 2, 18, { align: 'center', maxWidth: 180 });

  // Title: LAPORAN KEUANGAN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(report.title, pageWidth / 2, 26, { align: 'center' });

  // Periode
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Periode : ${report.periodText}`, 14, 33);

  // Table Body Rows
  const tableRows: any[] = [];

  // Section: PEMASUKAN
  tableRows.push([
    { content: 'PEMASUKAN', colSpan: 7, styles: { fontStyle: 'bold', fillColor: [240, 249, 255], textColor: [3, 105, 161] } }
  ]);

  // Opening balance row
  tableRows.push([
    '1',
    report.openingBalanceRow.bulan,
    report.openingBalanceRow.jenis_transaksi,
    report.openingBalanceRow.keterangan,
    '-',
    '-',
    formatNumber(report.openingBalanceRow.saldo),
  ]);

  // Pemasukan rows
  report.pemasukanRows.forEach((r) => {
    tableRows.push([
      String(r.no),
      r.bulan,
      r.jenis_transaksi,
      r.keterangan,
      formatNumber(r.masuk),
      '-',
      '-',
    ]);
  });

  // Subtotal Pemasukan
  tableRows.push([
    { content: 'Total Pemasukan Iuran', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right' } },
    { content: formatNumber(report.totalPemasukan), styles: { fontStyle: 'bold' } },
    '-',
    '-',
  ]);

  // Section: PENGELUARAN
  tableRows.push([
    { content: 'PENGELUARAN', colSpan: 7, styles: { fontStyle: 'bold', fillColor: [254, 242, 242], textColor: [185, 28, 28] } }
  ]);

  report.pengeluaranRows.forEach((r) => {
    tableRows.push([
      String(r.no),
      r.bulan,
      r.jenis_transaksi,
      r.keterangan,
      '-',
      formatNumber(r.keluar),
      '-',
    ]);
  });

  // Subtotal Pengeluaran
  tableRows.push([
    { content: 'Total Pengeluaran', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } },
    { content: formatNumber(report.totalPengeluaran), styles: { fontStyle: 'bold' } },
    '-',
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['NO', 'BULAN', 'JENIS TRANSAKSI', 'KETERANGAN', 'MASUK', 'KELUAR', 'SALDO']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [40, 40, 40],
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { cellWidth: 32 },
      3: { cellWidth: 55 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 24 },
      6: { halign: 'right', cellWidth: 24 },
    },
    margin: { left: 10, right: 10 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Summary Box & Signature Block
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(report.summary.prevDateLabel, 14, finalY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRupiah(report.summary.saldoAwal), 80, finalY);

  doc.setFont('helvetica', 'normal');
  doc.text(`TOTAL PEMASUKAN ${report.monthName.toUpperCase()} ${report.year}`, 14, finalY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRupiah(report.summary.totalMasuk), 80, finalY + 5);

  doc.setFont('helvetica', 'normal');
  doc.text(`TOTAL PENGELUARAN ${report.monthName.toUpperCase()} ${report.year}`, 14, finalY + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRupiah(report.summary.totalKeluar), 80, finalY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text(report.summary.currentDateLabel.toUpperCase(), 14, finalY + 16);
  doc.text(formatRupiah(report.summary.saldoAkhir), 80, finalY + 16);

  // Signature Block
  doc.setFont('helvetica', 'normal');
  doc.text(report.signature.title, pageWidth - 45, finalY);
  doc.setFont('helvetica', 'bold');
  doc.text(report.signature.signer, pageWidth - 45, finalY + 18);

  // REQUIRED APP NAME IN PDF FOOTER
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Paradessa Household Dues', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save PDF
  doc.save(`Laporan_Keuangan_Paradessa_${report.year}_${String(report.month).padStart(2, '0')}.pdf`);
}

// Export Surat Tagihan Warga
export function exportStatementToPdf(stmt: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Official Logo
  try {
    doc.addImage(PARADESSA_LOGO_DATA_URL, 'PNG', (pageWidth - 48) / 2, 7, 48, 6.5);
  } catch {
    // fallback
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(stmt.clusterAddress, pageWidth / 2, 18, { align: 'center', maxWidth: 170 });

  doc.setLineWidth(0.4);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 23, pageWidth - 14, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(stmt.title, pageWidth / 2, 31, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nomor : ${stmt.statementNumber}`, 14, 40);
  doc.text(`Tanggal : ${stmt.date}`, pageWidth - 14, 40, { align: 'right' });
  doc.text(`Nama Warga : ${stmt.recipientName}`, 14, 46);
  doc.text(`Nomor Rumah : Blok ${stmt.houseCode}`, 14, 52);

  const tableRows = stmt.unpaidItems.map((item: any, idx: number) => [
    idx + 1,
    item.periodLabel,
    item.component,
    formatRupiah(item.amount),
    formatRupiah(item.paid),
    formatRupiah(item.remaining),
  ]);

  autoTable(doc, {
    startY: 58,
    head: [['No', 'Periode', 'Komponen', 'Tagihan', 'Sudah Dibayar', 'Sisa Tagihan']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Tunggakan: ${formatRupiah(stmt.totalOutstanding)}`, 14, finalY);
  if (stmt.totalCredit > 0) {
    doc.text(`Saldo Kredit/Lebih Bayar: -${formatRupiah(stmt.totalCredit)}`, 14, finalY + 6);
    doc.text(`Total Yang Harus Dibayar: ${formatRupiah(stmt.netPayable)}`, 14, finalY + 12);
  }

  // Footer: App Name
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Paradessa Household Dues', pageWidth / 2, pageHeight - 10, { align: 'center' });

  doc.save(`Tagihan_Iuran_${stmt.houseCode}_${stmt.statementNumber}.pdf`);
}
