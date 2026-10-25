'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  MinusCircle,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import {
  formatRupiah,
  BULAN_INDONESIA_SHORT,
  formatBulanTahun,
} from '@/lib/format';
import { exportMatrixToExcel } from '@/lib/export-excel';

export default function RekapIuranPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchHouse, setSearchHouse] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('ALL');

  // Expanded cell modal/drawer state
  const [activeCellModal, setActiveCellModal] = useState<any>(null);

  useEffect(() => {
    fetchMatrix();
  }, [selectedYear]);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dues?year=${selectedYear}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const matrix = data?.matrix || [];

  const filteredMatrix = matrix.filter((h: any) => {
    const matchSearch = h.houseCode.toLowerCase().includes(searchHouse.toLowerCase()) ||
      h.residentName.toLowerCase().includes(searchHouse.toLowerCase());
    const matchBlock = selectedBlock === 'ALL' || h.block === selectedBlock;
    return matchSearch && matchBlock;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lunas':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs';
      case 'sebagian':
        return 'bg-amber-400 hover:bg-amber-500 text-stone-950 font-black shadow-xs';
      case 'belum bayar':
        return 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100';
      case 'tidak ikut':
        return 'bg-stone-100 text-stone-400';
      case 'sebelum serah terima':
        return 'bg-stone-50 text-stone-300';
      default:
        return 'bg-stone-100 text-stone-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'lunas': return 'Lunas';
      case 'sebagian': return 'Sebagian';
      case 'belum bayar': return 'Belum';
      case 'tidak ikut': return 'Tidak';
      case 'sebelum serah terima': return '-';
      default: return '-';
    }
  };

  const handleExportExcel = () => {
    if (matrix.length > 0) {
      exportMatrixToExcel(selectedYear, matrix);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-950 flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-orange-600" />
            <span>Rekap Iuran Tahunan Paradessa</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Matriks pembayaran bulanan warga per rumah. Klik kotak status untuk melihat rincian pembayaran.
          </p>
        </div>

        {/* Year Selector & Export */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-stone-200/90 p-1.5 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-600 hover:text-stone-950 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-black text-stone-900 px-3 text-sm">
              Tahun {selectedYear}
            </span>
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-600 hover:text-stone-950 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-bold text-stone-700 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Legend & Filter Controls */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-emerald-500"></div>
            <span className="text-stone-700">Lunas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-amber-400"></div>
            <span className="text-stone-700">Sebagian</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-rose-50 border border-rose-300"></div>
            <span className="text-stone-700">Belum Bayar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-stone-200"></div>
            <span className="text-stone-500">Tidak Ikut / Kosong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-stone-100 border border-stone-200"></div>
            <span className="text-stone-400">Sebelum Serah Terima</span>
          </div>
        </div>

        {/* Filter inputs */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari blok/warga..."
              value={searchHouse}
              onChange={(e) => setSearchHouse(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
          >
            <option value="ALL">Semua Blok</option>
            <option value="A">Blok A</option>
            <option value="B">Blok B</option>
            <option value="C">Blok C</option>
          </select>
        </div>
      </div>

      {/* The Matrix Table */}
      <div className="bg-white border border-stone-200/80 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-600 uppercase tracking-wider text-[10px] border-b border-stone-200">
              <tr>
                <th className="px-3.5 py-3 sticky left-0 z-10 bg-stone-50 shadow-r">Rumah</th>
                <th className="px-3.5 py-3 min-w-[130px]">Penghuni</th>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <th key={m} className="px-1.5 py-3 text-center min-w-[55px]">
                    {BULAN_INDONESIA_SHORT[m]}
                  </th>
                ))}
                <th className="px-3.5 py-3 text-right">Tunggakan Lalu</th>
                <th className="px-3.5 py-3 text-right">Total Tagihan</th>
                <th className="px-3.5 py-3 text-right">Total Terbayar</th>
                <th className="px-3.5 py-3 text-right text-rose-600 font-black">Sisa Tunggakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={18} className="px-4 py-16 text-center text-stone-400">
                    Memuat matriks rekap iuran...
                  </td>
                </tr>
              ) : filteredMatrix.length === 0 ? (
                <tr>
                  <td colSpan={18} className="px-4 py-16 text-center text-stone-400">
                    Tidak ada data rumah yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((house: any) => (
                  <tr key={house.houseCode} className="hover:bg-orange-50/25 transition-colors">
                    {/* Sticky House Code */}
                    <td className="px-3.5 py-2.5 font-black text-stone-900 sticky left-0 z-10 bg-white shadow-r">
                      <Link
                        href={`/rumah/${house.houseCode}`}
                        className="text-orange-600 hover:text-orange-700 hover:underline font-black"
                      >
                        Blok {house.houseCode}
                      </Link>
                    </td>

                    {/* Resident */}
                    <td className="px-3.5 py-2.5 text-stone-700 truncate max-w-[140px] font-semibold" title={house.residentName}>
                      {house.residentName}
                    </td>

                    {/* 12 Months Cells */}
                    {house.months.map((m: any) => (
                      <td key={m.month} className="px-1 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveCellModal({ house, monthData: m })}
                          className={`w-full py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all ${getStatusColor(
                            m.status
                          )}`}
                          title={`Klik untuk rincian ${house.houseCode} - ${m.year_month}`}
                        >
                          {getStatusLabel(m.status)}
                        </button>
                      </td>
                    ))}

                    {/* Arrears From Earlier Years */}
                    <td className="px-3.5 py-2.5 text-right font-medium text-stone-500 whitespace-nowrap">
                      {house.tagihanSebelumnya > 0 ? formatRupiah(house.tagihanSebelumnya) : '-'}
                    </td>

                    {/* Total Billed This Year */}
                    <td className="px-3.5 py-2.5 text-right font-bold text-stone-800 whitespace-nowrap">
                      {formatRupiah(house.totalTagihanTahunIni)}
                    </td>

                    {/* Total Paid This Year */}
                    <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600 whitespace-nowrap">
                      {formatRupiah(house.totalTerbayarTahunIni)}
                    </td>

                    {/* Total Outstanding */}
                    <td className="px-3.5 py-2.5 text-right font-black text-rose-600 whitespace-nowrap">
                      {house.totalTunggakan > 0 ? formatRupiah(house.totalTunggakan) : (
                        <span className="text-emerald-600 font-bold">Lunas</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Cell Modal: Components & Payment Allocations */}
      {activeCellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900">
                  Rincian Iuran Blok {activeCellModal.house.houseCode}
                </h3>
                <p className="text-xs text-stone-500">
                  Periode {formatBulanTahun(activeCellModal.monthData.year_month)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCellModal(null)}
                className="p-1.5 rounded-xl bg-stone-100 text-stone-500 hover:text-stone-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs bg-stone-50 p-3 rounded-2xl border border-stone-100">
                <span className="text-stone-500">Status Pembayaran:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${getStatusColor(activeCellModal.monthData.status)}`}>
                  {getStatusLabel(activeCellModal.monthData.status)}
                </span>
              </div>

              {/* Components breakdown */}
              <div>
                <span className="text-[11px] font-bold uppercase text-stone-400 tracking-wider">
                  Rincian Komponen Tagihan
                </span>
                <div className="mt-1.5 space-y-1.5">
                  {activeCellModal.monthData.components?.length > 0 ? (
                    activeCellModal.monthData.components.map((c: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                        <span className="text-stone-700 font-semibold">{c.component_name}</span>
                        <span className="text-stone-900 font-bold">{formatRupiah(c.amount)} (Bayar: {formatRupiah(c.paid_amount)})</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-stone-500 italic p-2.5 rounded-xl bg-stone-50">
                      {activeCellModal.monthData.status === 'sebelum serah terima'
                        ? 'Rumah belum serah terima pada bulan ini.'
                        : 'Standar iuran 3 komponen (Pokok, Air, Sampah): Rp 120.000'}
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Payment Allocations */}
              {activeCellModal.monthData.allocations?.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider">
                    Alokasi Pembayaran Diterima
                  </span>
                  <div className="mt-1.5 space-y-1.5">
                    {activeCellModal.monthData.allocations.map((a: any, idx: number) => (
                      <div key={idx} className="text-xs p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5">
                        <div className="flex justify-between font-bold text-emerald-800">
                          <span>{a.payer_name}</span>
                          <span>+{formatRupiah(a.amount)}</span>
                        </div>
                        <div className="text-[10px] text-stone-500">
                          Tgl Bayar: {a.payment_date} ({a.payment_number})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveCellModal(null)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
