'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Share2,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Printer,
  Copy,
} from 'lucide-react';
import {
  formatRupiah,
  formatNumber,
  BULAN_INDONESIA,
} from '@/lib/format';
import { exportMonthlyReportToPdf } from '@/lib/export-pdf';
import { useRole } from '@/context/RoleContext';

export default function LaporanBulananPage() {
  const { isAdmin } = useRole();
  const now = new Date();

  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [reportData, setReportData] = useState<any>(null);
  const [whatsAppText, setWhatsAppText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [selectedYear, selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json.report);
        setWhatsAppText(json.whatsAppText);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleToggleLock = async (action: 'publish' | 'unlock') => {
    if (!isAdmin) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/reports/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          action,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchReport();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (reportData) {
      exportMonthlyReportToPdf(reportData);
    }
  };

  const handleShareWhatsApp = () => {
    if (whatsAppText) {
      const encoded = encodeURIComponent(whatsAppText);
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    }
  };

  const handleCopySummary = () => {
    if (whatsAppText) {
      navigator.clipboard.writeText(whatsAppText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Month & Year Navigation */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 shadow-xs transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-2">
            <span className="text-lg sm:text-xl font-black text-stone-900">
              {BULAN_INDONESIA[selectedMonth]} {selectedYear}
            </span>
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 shadow-xs transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons: PDF, WhatsApp, Publish/Lock */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span className="truncate">Kirim WA</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold text-xs shadow-xs transition-colors"
          >
            <Copy className="w-4 h-4 text-stone-500" />
            <span className="truncate">{copySuccess ? 'Tersalin!' : 'Salin Teks'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs shadow-orange-500/25 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="truncate">Unduh PDF</span>
          </button>

          {/* Admin Publish / Lock button */}
          {isAdmin && (
            reportData?.isLocked ? (
              <button
                type="button"
                onClick={() => handleToggleLock('unlock')}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs transition-colors"
              >
                <Unlock className="w-4 h-4 text-amber-700" />
                <span className="truncate">Buka Kunci</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleLock('publish')}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span className="truncate">Publikasikan</span>
              </button>
            )
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-stone-400">Memuat laporan bulanan...</div>
      ) : reportData ? (
        /* The Official Report Paper (A4 / Document Style) */
        <div className="bg-white text-stone-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.06)] space-y-4 sm:space-y-6 font-sans border border-stone-200/90">
          {/* Header */}
          <div className="text-center space-y-2 border-b-2 border-stone-100 pb-5">
            <div className="flex justify-center mb-1">
              <img
                src="/images/paradessa-logo.png"
                alt="Paradessa Habitat"
                className="h-9 sm:h-11 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-stone-500 font-medium max-w-xl mx-auto leading-relaxed">
              {reportData.addressHeader}
            </p>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight pt-1">
              {reportData.title}
            </h2>
            <p className="text-xs font-bold text-orange-600">
              Periode : {reportData.periodText}
            </p>
          </div>

          {/* Numbered Table Matching Excel Exactly */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-stone-300">
              <thead>
                <tr className="bg-stone-100 text-stone-800 font-bold uppercase text-[10px]">
                  <th className="border border-stone-300 px-2 py-2 text-center w-8">NO</th>
                  <th className="border border-stone-300 px-3 py-2 w-24">BULAN</th>
                  <th className="border border-stone-300 px-3 py-2 w-36">JENIS TRANSAKSI</th>
                  <th className="border border-stone-300 px-3 py-2">KETERANGAN</th>
                  <th className="border border-stone-300 px-3 py-2 text-right w-24">MASUK</th>
                  <th className="border border-stone-300 px-3 py-2 text-right w-24">KELUAR</th>
                  <th className="border border-stone-300 px-3 py-2 text-right w-24">SALDO</th>
                </tr>
              </thead>
              <tbody>
                {/* PEMASUKAN Section Header */}
                <tr className="bg-orange-50/80 font-bold text-orange-950">
                  <td colSpan={7} className="border border-stone-300 px-3 py-1.5 uppercase tracking-wider">
                    PEMASUKAN
                  </td>
                </tr>

                {/* Opening Balance Row */}
                <tr className="font-semibold text-stone-700 bg-stone-50/50">
                  <td className="border border-stone-300 px-2 py-1.5 text-center">1</td>
                  <td className="border border-stone-300 px-3 py-1.5">{reportData.openingBalanceRow.bulan}</td>
                  <td className="border border-stone-300 px-3 py-1.5 font-bold">Saldo Awal</td>
                  <td className="border border-stone-300 px-3 py-1.5 italic text-stone-500">{reportData.openingBalanceRow.keterangan}</td>
                  <td className="border border-stone-300 px-3 py-1.5 text-right">-</td>
                  <td className="border border-stone-300 px-3 py-1.5 text-right">-</td>
                  <td className="border border-stone-300 px-3 py-1.5 text-right font-black text-stone-900">
                    {formatNumber(reportData.openingBalanceRow.saldo)}
                  </td>
                </tr>

                {/* Pemasukan Rows */}
                {reportData.pemasukanRows.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-stone-50/80">
                    <td className="border border-stone-300 px-2 py-1.5 text-center font-medium">{r.no}</td>
                    <td className="border border-stone-300 px-3 py-1.5 text-stone-600">{r.bulan}</td>
                    <td className="border border-stone-300 px-3 py-1.5 font-semibold text-stone-700">{r.jenis_transaksi}</td>
                    <td className="border border-stone-300 px-3 py-1.5 font-bold text-stone-900">{r.keterangan}</td>
                    <td className="border border-stone-300 px-3 py-1.5 text-right font-black text-emerald-600">
                      {formatNumber(r.masuk)}
                    </td>
                    <td className="border border-stone-300 px-3 py-1.5 text-right text-stone-400">-</td>
                    <td className="border border-stone-300 px-3 py-1.5 text-right text-stone-400">-</td>
                  </tr>
                ))}

                {/* Subtotal Pemasukan */}
                <tr className="bg-orange-50/60 font-bold text-orange-950">
                  <td colSpan={4} className="border border-stone-300 px-3 py-2 text-right">
                    Total Pemasukan Iuran
                  </td>
                  <td className="border border-stone-300 px-3 py-2 text-right font-black text-emerald-600">
                    {formatNumber(reportData.totalPemasukan)}
                  </td>
                  <td className="border border-stone-300 px-3 py-2 text-right">-</td>
                  <td className="border border-stone-300 px-3 py-2 text-right">-</td>
                </tr>

                {/* PENGELUARAN Section Header */}
                <tr className="bg-rose-50/80 font-bold text-rose-950">
                  <td colSpan={7} className="border border-stone-300 px-3 py-1.5 uppercase tracking-wider">
                    PENGELUARAN
                  </td>
                </tr>

                {/* Pengeluaran Rows */}
                {reportData.pengeluaranRows.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-stone-50/80">
                    <td className="border border-stone-300 px-2 py-1.5 text-center font-medium">{r.no}</td>
                    <td className="border border-stone-300 px-3 py-1.5 text-stone-600">{r.bulan}</td>
                    <td className="border border-stone-300 px-3 py-1.5 font-semibold text-stone-700">{r.jenis_transaksi}</td>
                    <td className="border border-stone-300 px-3 py-1.5 text-stone-800">{r.keterangan}</td>
                    <td className="border border-stone-300 px-3 py-1.5 text-right text-stone-400">-</td>
                    <td className="border border-stone-300 px-3 py-1.5 text-right font-black text-rose-600">
                      {formatNumber(r.keluar)}
                    </td>
                    <td className="border border-stone-300 px-3 py-1.5 text-right text-stone-400">-</td>
                  </tr>
                ))}

                {/* Subtotal Pengeluaran */}
                <tr className="bg-rose-50/60 font-bold text-rose-950">
                  <td colSpan={5} className="border border-stone-300 px-3 py-2 text-right">
                    Total Pengeluaran
                  </td>
                  <td className="border border-stone-300 px-3 py-2 text-right font-black text-rose-600">
                    {formatNumber(reportData.totalPengeluaran)}
                  </td>
                  <td className="border border-stone-300 px-3 py-2 text-right">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Box & Signature Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t-2 border-stone-100">
            {/* Left Summary Box */}
            <div className="space-y-1.5 text-xs text-stone-800">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="font-medium text-stone-600">{reportData.summary.prevDateLabel}</span>
                <span className="font-black text-stone-900">{formatRupiah(reportData.summary.saldoAwal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="font-medium text-stone-600">TOTAL PEMASUKAN {reportData.monthName.toUpperCase()} {reportData.year}</span>
                <span className="font-black text-emerald-600">+{formatRupiah(reportData.summary.totalMasuk)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="font-medium text-stone-600">TOTAL PENGELUARAN {reportData.monthName.toUpperCase()} {reportData.year}</span>
                <span className="font-black text-rose-600">-{formatRupiah(reportData.summary.totalKeluar)}</span>
              </div>
              <div className="flex justify-between py-2.5 font-black text-sm text-stone-900 bg-orange-50/80 border border-orange-200 px-3.5 rounded-xl mt-2">
                <span>{reportData.summary.currentDateLabel.toUpperCase()}</span>
                <span className="text-orange-600">{formatRupiah(reportData.summary.saldoAkhir)}</span>
              </div>
            </div>

            {/* Right Signature Block */}
            <div className="flex flex-col items-center justify-center text-center space-y-12">
              <div className="text-xs font-semibold text-stone-500">
                {reportData.signature.title}
              </div>
              <div className="text-xs font-black text-stone-900 underline tracking-wide">
                {reportData.signature.signer}
              </div>
            </div>
          </div>

          {/* App Name Footer */}
          <div className="pt-4 border-t border-stone-100 text-center text-[10px] text-stone-400 font-semibold tracking-wider uppercase">
            {reportData.footerNote}
          </div>
        </div>
      ) : null}
    </div>
  );
}
