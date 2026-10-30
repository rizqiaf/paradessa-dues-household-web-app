'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Search,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileText,
  RotateCcw,
} from 'lucide-react';
import {
  formatRupiah,
  formatNumber,
  formatTanggal,
  BULAN_INDONESIA,
  BULAN_INDONESIA_SHORT,
} from '@/lib/format';
import { exportLedgerToExcel } from '@/lib/export-excel';
import { useRole } from '@/context/RoleContext';

export default function BukuKasPage() {
  const { isAdmin } = useRole();
  const now = new Date();

  const [viewMode, setViewMode] = useState<'month' | 'year' | 'multi-year'>('month');
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterHouse, setFilterHouse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);

  // Ledger state
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [yearData, setYearData] = useState<any>(null);
  const [multiYearData, setMultiYearData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Available years
  const availableYears = [2025, 2026, 2027];

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCategories(json.data);
      });
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [viewMode, selectedYear, selectedMonth, filterType, filterCategory, filterHouse, searchQuery]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        view: viewMode,
        year: String(selectedYear),
        month: String(selectedMonth),
      });
      if (filterType) params.append('type', filterType);
      if (filterCategory) params.append('category', filterCategory);
      if (filterHouse) params.append('house_code', filterHouse);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/ledger?${params.toString()}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      const json = await res.json();
      if (json.success) {
        if (viewMode === 'month') setLedgerData(json.data);
        else if (viewMode === 'year') setYearData(json.data);
        else if (viewMode === 'multi-year') setMultiYearData(json.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Previous month arrow across year boundary
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  // Next month arrow across year boundary
  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleExportExcel = () => {
    if (ledgerData && viewMode === 'month') {
      exportLedgerToExcel(ledgerData);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-stone-950 flex items-center gap-2">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600 shrink-0" />
            <span>Buku Kas Kontinyu Paradessa</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Buku kas digital dinamis. Saldo awal dan berjalan dihitung secara otomatis antar bulan & lintas tahun.
          </p>
        </div>

        {/* View Switcher: Bulan / Tahun / Multi-Tahun */}
        <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto overflow-x-auto p-1 sm:p-1.5 bg-stone-100 rounded-xl sm:rounded-2xl border border-stone-200 scrollbar-none">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              viewMode === 'month'
                ? 'bg-white text-orange-600 shadow-sm border border-stone-200/60'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Bulanan
          </button>
          <button
            type="button"
            onClick={() => setViewMode('year')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              viewMode === 'year'
                ? 'bg-white text-orange-600 shadow-sm border border-stone-200/60'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            1 Tahun
          </button>
          <button
            type="button"
            onClick={() => setViewMode('multi-year')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              viewMode === 'multi-year'
                ? 'bg-white text-orange-600 shadow-sm border border-stone-200/60'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Multi-Tahun
          </button>
        </div>
      </div>

      {/* Navigation Bar: Year Picker & 12 Month Tabs */}
      {viewMode === 'month' && (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Year Selector with Prev/Next buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                title="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-base font-black text-stone-900">
                  {BULAN_INDONESIA[selectedMonth]}
                </span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="bg-stone-100 border border-stone-200 text-orange-600 font-extrabold text-sm px-2.5 py-1 rounded-xl cursor-pointer focus:outline-none"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                title="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Status Badge & Actions */}
            <div className="flex items-center gap-2">
              {ledgerData?.status === 'terkunci' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Terkunci (Laporan Terbit)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-600 text-xs font-bold">
                  <Unlock className="w-3.5 h-3.5 text-stone-500" />
                  <span>Draft (Buka)</span>
                </span>
              )}

              <button
                type="button"
                onClick={fetchLedger}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-bold text-stone-700 shadow-xs transition-colors cursor-pointer"
                title="Segarkan data transaksi terbaru"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-stone-500 ${loading ? 'animate-spin text-orange-600' : ''}`} />
                <span>Segarkan</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-bold text-stone-700 shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* 12 Month Tabs (Jan - Des) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-2 border-t border-stone-100 scrollbar-none">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const isSelected = selectedMonth === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMonth(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {BULAN_INDONESIA_SHORT[m]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning Alert if numbers changed after report was locked */}
      {viewMode === 'month' && ledgerData?.has_warning && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="font-bold">Peringatan Integritas Pembukuan</div>
            <div className="text-xs text-amber-800 mt-0.5">{ledgerData.warning_message}</div>
          </div>
        </div>
      )}

      {/* Filter Toolbar (Category, House, Type, Search) */}
      {viewMode === 'month' && (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari transaksi / keterangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:border-orange-500 font-semibold cursor-pointer"
          >
            <option value="">Semua Jenis (Masuk & Keluar)</option>
            <option value="masuk">Hanya Pemasukan</option>
            <option value="keluar">Hanya Pengeluaran</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:border-orange-500 font-semibold cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filter blok rumah (contoh: A15, B38)..."
            value={filterHouse}
            onChange={(e) => setFilterHouse(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 uppercase font-semibold"
          />
        </div>
      )}

      {/* VIEW MODE 1: BULANAN (MONTH VIEW) */}
      {viewMode === 'month' && (
        <div className="space-y-4">
          {/* Summary Strip for Selected Month */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-stone-200/80 p-4 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase text-stone-400">Saldo Awal</span>
              <div className="text-lg sm:text-xl font-black text-stone-800 mt-1">
                {formatRupiah(ledgerData?.opening_balance || 0)}
              </div>
            </div>
            <div className="bg-white border border-emerald-100 p-4 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase text-emerald-600">Total Pemasukan</span>
              <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1">
                +{formatRupiah(ledgerData?.total_masuk || 0)}
              </div>
            </div>
            <div className="bg-white border border-rose-100 p-4 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase text-rose-600">Total Pengeluaran</span>
              <div className="text-lg sm:text-xl font-black text-rose-600 mt-1">
                -{formatRupiah(ledgerData?.total_keluar || 0)}
              </div>
            </div>
            <div className="bg-white border border-orange-200 p-4 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase text-orange-600">Saldo Akhir</span>
              <div className="text-lg sm:text-xl font-black text-orange-600 mt-1">
                {formatRupiah(ledgerData?.closing_balance || 0)}
              </div>
            </div>
          </div>

          {/* Transactions Ledger Table */}
          <div className="bg-white border border-stone-200/80 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 uppercase tracking-wider text-[11px] border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Jenis / Kategori</th>
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3">Rumah</th>
                    <th className="px-4 py-3 text-right">Masuk (Rp)</th>
                    <th className="px-4 py-3 text-right">Keluar (Rp)</th>
                    <th className="px-4 py-3 text-right">Saldo Berjalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {/* Saldo Awal Row */}
                  <tr className="bg-stone-50/70 font-semibold text-stone-600">
                    <td className="px-4 py-3">
                      {selectedYear}-{String(selectedMonth).padStart(2, '0')}-01
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
                        Saldo Awal
                      </span>
                    </td>
                    <td className="px-4 py-3 italic text-stone-500">
                      Saldo dibawa dari akhir bulan sebelumnya
                    </td>
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3 text-right">-</td>
                    <td className="px-4 py-3 text-right">-</td>
                    <td className="px-4 py-3 text-right font-extrabold text-stone-900">
                      {formatRupiah(ledgerData?.opening_balance || 0)}
                    </td>
                  </tr>

                  {/* Transaction Rows */}
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-stone-400">
                        Memuat data buku kas...
                      </td>
                    </tr>
                  ) : ledgerData?.items?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-stone-400">
                        Tidak ada transaksi tercatat untuk bulan {BULAN_INDONESIA[selectedMonth]} {selectedYear}.
                      </td>
                    </tr>
                  ) : (
                    ledgerData?.items?.map((item: any, idx: number) => {
                      const isMasuk = item.type === 'masuk';
                      return (
                        <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                          <td className="px-4 py-3.5 font-medium text-stone-600 whitespace-nowrap">
                            {formatTanggal(item.date)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isMasuk
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-stone-800">
                            {item.description}
                            {item.note && (
                              <span className="block text-[11px] text-stone-400 font-normal italic mt-0.5">
                                Catatan: {item.note}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-black text-orange-600 whitespace-nowrap">
                            {item.house_code ? `Blok ${item.house_code}` : '-'}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-emerald-600 whitespace-nowrap">
                            {item.masuk > 0 ? formatRupiah(item.masuk) : '-'}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-rose-600 whitespace-nowrap">
                            {item.keluar > 0 ? formatRupiah(item.keluar) : '-'}
                          </td>
                          <td className="px-4 py-3.5 text-right font-extrabold text-stone-900 whitespace-nowrap">
                            {formatRupiah(item.running_balance)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* Footer Subtotals */}
                <tfoot className="bg-stone-50 font-black text-stone-800 border-t-2 border-stone-200">
                  <tr>
                    <td colSpan={4} className="px-4 py-3.5 text-right uppercase tracking-wider text-xs">
                      Total Periode Ini:
                    </td>
                    <td className="px-4 py-3.5 text-right text-emerald-600 text-sm">
                      +{formatRupiah(ledgerData?.total_masuk || 0)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-rose-600 text-sm">
                      -{formatRupiah(ledgerData?.total_keluar || 0)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-orange-600 text-sm font-black">
                      {formatRupiah(ledgerData?.closing_balance || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: TAHUNAN (12-ROW SUMMARY TABLE) */}
      {viewMode === 'year' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-stone-200/80 p-4 rounded-2xl shadow-xs">
            <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span>Ringkasan 12 Bulan Tahun {selectedYear}</span>
            </h2>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-stone-50 border border-stone-200 text-orange-600 font-extrabold text-sm px-3 py-1.5 rounded-xl cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-stone-200/80 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 uppercase tracking-wider text-[11px] border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3">Bulan</th>
                    <th className="px-4 py-3 text-right">Saldo Awal</th>
                    <th className="px-4 py-3 text-right">Pemasukan</th>
                    <th className="px-4 py-3 text-right">Pengeluaran</th>
                    <th className="px-4 py-3 text-right">Saldo Akhir</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {yearData?.months?.map((m: any) => (
                    <tr
                      key={m.month}
                      onClick={() => {
                        setSelectedMonth(m.month);
                        setViewMode('month');
                      }}
                      className="hover:bg-orange-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5 font-bold text-stone-900">
                        {m.month_name} {selectedYear}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-stone-600">
                        {formatRupiah(m.opening_balance)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                        +{formatRupiah(m.pemasukan)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-rose-600">
                        -{formatRupiah(m.pengeluaran)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-orange-600">
                        {formatRupiah(m.closing_balance)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {m.status === 'terkunci' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Terkunci
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[10px] font-bold">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center text-orange-600 font-bold hover:underline">
                        Buka Bulan →
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: MULTI-YEAR VIEW */}
      {viewMode === 'multi-year' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200/80 p-4 rounded-2xl shadow-xs">
            <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              <span>Ringkasan Multi-Tahun Sejak Awal Pembukuan</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">Akumulasi total per tahun sejak rekam data pertama</p>
          </div>

          <div className="bg-white border border-stone-200/80 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 text-stone-600 uppercase tracking-wider text-[11px] border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">Tahun</th>
                  <th className="px-4 py-3 text-right">Saldo Awal Tahun</th>
                  <th className="px-4 py-3 text-right">Total Pemasukan</th>
                  <th className="px-4 py-3 text-right">Total Pengeluaran</th>
                  <th className="px-4 py-3 text-right">Saldo Akhir Tahun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {multiYearData.map((yItem: any) => (
                  <tr key={yItem.year} className="hover:bg-orange-50/40">
                    <td className="px-4 py-4 font-black text-stone-900 text-sm">
                      Tahun {yItem.year}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-stone-600">
                      {formatRupiah(yItem.opening_balance)}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-emerald-600">
                      +{formatRupiah(yItem.total_pemasukan)}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-rose-600">
                      -{formatRupiah(yItem.total_pengeluaran)}
                    </td>
                    <td className="px-4 py-4 text-right font-black text-orange-600 text-sm">
                      {formatRupiah(yItem.closing_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
