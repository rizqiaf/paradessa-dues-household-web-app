'use client';

import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { formatRupiah, formatNumber } from '@/lib/format';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRunImport = async (useExistingSample = false) => {
    setImporting(true);
    setError('');
    setResult(null);

    try {
      let res;
      if (useExistingSample) {
        res = await fetch('/api/import', { method: 'POST' });
      } else {
        if (!file) {
          setError('Silakan pilih file Excel (.xlsx) terlebih dahulu.');
          setImporting(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', file);
        res = await fetch('/api/import', {
          method: 'POST',
          body: formData,
        });
      }

      const json = await res.json();
      if (json.success) {
        setResult(json.stats);
      } else {
        setError(json.error || 'Gagal memproses impor workbook');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold mb-2">
          <FileCheck className="w-3.5 h-3.5" />
          <span>Migrasi Data Excel</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Alat Impor Excel & Rekonsiliasi Saldo
        </h1>
        <p className="text-sm text-stone-500 mt-1 max-w-2xl">
          Impor master workbook lama bendahara. Sistem otomatis menormalisasi kode rumah, mengonversi tanggal teks/serial, mendeteksi baris pengeluaran salah kolom, dan merekonsiliasi saldo terhadap laporan bulanan.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box & Sample Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Custom File */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-1">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Unggah File Excel Baru (.xlsx)</span>
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Pilih file Excel buku kas master dengan sheet '2026', 'Rekap Iuran Tahunan', dan 'rekapan iuran dari awal'.
            </p>

            <div className="border-2 border-dashed border-stone-300 hover:border-orange-500 bg-stone-50/50 rounded-xl p-6 text-center transition-colors">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                id="file-upload"
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer block space-y-2">
                <Upload className="w-8 h-8 text-orange-500 mx-auto" />
                <span className="text-xs font-semibold text-stone-800 block">
                  {file ? file.name : 'Klik untuk memilih file Excel dari komputer'}
                </span>
                <span className="text-[11px] text-stone-500 block">Mendukung format .xlsx dan .xls</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            disabled={!file || importing}
            onClick={() => handleRunImport(false)}
            className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-orange-600/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {importing ? 'Memproses File...' : 'Mulai Impor File Ini'}
          </button>
        </div>

        {/* Use Existing Workbook */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-stone-900">Workbook Master Paradessa Tersedia</h3>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              File workbook asli Paradessa Habitat telah tersedia di sistem (<code className="text-orange-700 bg-orange-50 px-1 py-0.5 rounded font-mono text-[11px]">data/paradessa_existing_workbook.xlsx</code>). Anda dapat langsung menjalankan impor dan rekonsiliasi satu klik.
            </p>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>Nama File:</span>
                <strong className="text-stone-900">paradessa_existing_workbook.xlsx</strong>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Sheet Master:</span>
                <strong className="text-stone-900">2026 (Transaksional Lengkap)</strong>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Sheet Data Warga:</span>
                <strong className="text-stone-900">rekapan iuran dari awal</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={importing}
            onClick={() => handleRunImport(true)}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {importing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Menjalankan Impor & Rekonsiliasi...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Impor & Verifikasi Master Workbook</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Post-Import Statistics & Reconciliation Results */}
      {result && (
        <div className="space-y-6 pt-4 animate-fade-in">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase text-stone-500">Rumah Terdaftar</span>
              <div className="text-2xl font-black text-stone-900 mt-1">{result.housesParsed}</div>
            </div>
            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase text-stone-500">Total Transaksi</span>
              <div className="text-2xl font-black text-orange-600 mt-1">{result.transactionsParsed}</div>
            </div>
            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase text-emerald-600">Pembayaran Iuran</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{result.paymentsCount}</div>
            </div>
            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase text-rose-600">Biaya / Pengeluaran</span>
              <div className="text-2xl font-black text-rose-600 mt-1">{result.expensesCount}</div>
            </div>
          </div>

          {/* Reconciliation Table with Benchmarks */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Hasil Pengecekan Rekonsiliasi Saldo Bulanan</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Perbandingan saldo akhir buku kas kontinyu hasil impor terhadap Laporan Bulanan (Okt 2025 s/d Sep 2026).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="px-3 py-2.5">Periode Bulan</th>
                    <th className="px-3 py-2.5 text-right">Saldo Akhir Buku Kas</th>
                    <th className="px-3 py-2.5 text-right">Saldo Akhir Laporan Asli</th>
                    <th className="px-3 py-2.5 text-right">Selisih (Diff)</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {result.reconciliation?.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      <td className="px-3 py-2.5 font-bold text-stone-900">{r.periodLabel}</td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-orange-600">
                        {formatRupiah(r.computedSaldoAkhir)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-stone-600">
                        {formatRupiah(r.expectedSaldoAkhir)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold">
                        {r.diff === 0 ? (
                          <span className="text-stone-400">0</span>
                        ) : (
                          <span className="text-amber-600">{r.diff > 0 ? `+${r.diff}` : r.diff}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {r.isMatch ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Cocok (Match)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Terdapat penyesuaian catatan manual di Excel lama">
                            Selisih Catatan
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-stone-500 pt-2 border-t border-stone-100 italic">
              Selisih pada catatan lama disebabkan oleh transaksi debit card charge (Rp 5.000) dan offset liwetan/talangan Pak Robi & Pak Agung yang dicatat di catatan samping Excel lama tanpa memasukkan baris resmi di laporan bulanan sebelumnya.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
