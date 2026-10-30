'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  CreditCard,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { formatRupiah, formatBulanTahun } from '@/lib/format';
import { useRole } from '@/context/RoleContext';

export default function DashboardPage() {
  const { role, selectedHouseCode, isAdmin } = useRole();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const loadDashboard = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    try {
      const res = await fetch(`/api/dashboard?year=${currentYear}&month=${currentMonth}&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
        const updateTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastUpdated(`${updateTime} WIB`);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadDashboard(false);

    // Auto-refresh when tab / browser window becomes active again
    const handleFocus = () => loadDashboard(false);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadDashboard(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-stone-500 font-medium">Memuat data kas Paradessa...</p>
        </div>
      </div>
    );
  }

  const thisMonth = data?.thisMonth || {};
  const currentBalance = data?.currentBalance || 0;
  const collectionRate = thisMonth.collectionRate || { billed: 0, paid: 0, percentage: 0 };
  const arrears = data?.arrears || [];
  const chartData = data?.chartData || [];

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Welcome Banner - White & Orange Aesthetic */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-orange-500/[0.08] via-amber-500/[0.04] to-white border border-orange-200/80 p-4 sm:p-6 lg:p-8 shadow-[0_2px_12px_rgba(249,115,22,0.06)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100/80 border border-orange-200 text-[11px] sm:text-xs font-bold text-orange-700">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Paradessa Household Dues</span>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-stone-950 tracking-tight leading-tight">
              Buku Kas & Iuran Paradessa Habitat
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600">
              <span>Jl. Desa Banda Asri RT.02/RW.09, Desa Pananjung, Kec. Cangkuang, Kab. Bandung 40238</span>
              {lastUpdated && (
                <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 font-medium bg-stone-100/80 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>Diperbarui: {lastUpdated}</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Buttons for Bendahara */}
          {isAdmin ? (
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                title="Muat ulang data kas terbaru langsung dari server"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs sm:text-sm border border-stone-200/90 shadow-xs active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-stone-500 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
                <span>{refreshing ? 'Memuat...' : 'Segarkan'}</span>
              </button>
              <Link
                href="/pembayaran"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/25 active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Catat Pembayaran</span>
              </Link>
              <Link
                href="/pengeluaran"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs sm:text-sm border border-stone-200/90 shadow-xs active:scale-[0.98] transition-all"
              >
                <TrendingDown className="w-4 h-4 text-rose-500" />
                <span>Catat Pengeluaran</span>
              </Link>
            </div>
          ) : (
            <Link
              href={`/rumah/${selectedHouseCode}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all"
            >
              <Building className="w-4 h-4" />
              <span>Status Rumah Blok {selectedHouseCode}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Top Metric Cards - Crisp White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Cash Balance */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:border-orange-200 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Saldo Kas Saat Ini</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-50 border border-orange-200/70 flex items-center justify-center text-orange-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 tracking-tight">
            {formatRupiah(currentBalance)}
          </div>
          <div className="mt-2 text-xs text-stone-500 flex items-center gap-1.5 font-medium">
            <span className="text-stone-400">Saldo Awal Bulan:</span>
            <span className="font-bold text-stone-700">{formatRupiah(thisMonth.saldoAwal)}</span>
          </div>
        </div>

        {/* This Month's Income */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Pemasukan {thisMonth.monthName}</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 tracking-tight">
            +{formatRupiah(thisMonth.pemasukan)}
          </div>
          <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Iuran warga & kas masuk</span>
          </div>
        </div>

        {/* This Month's Expenses */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:border-rose-200 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Pengeluaran {thisMonth.monthName}</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-600 tracking-tight">
            -{formatRupiah(thisMonth.pengeluaran)}
          </div>
          <div className="mt-2 text-xs text-rose-700 flex items-center gap-1 font-semibold">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Listrik, sampah, perbaikan</span>
          </div>
        </div>

        {/* Collection Rate */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Tingkat Penagihan</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-orange-600">
              {collectionRate.percentage}%
            </span>
            <span className="text-xs text-stone-500 font-medium">
              ({collectionRate.paid} / {collectionRate.billed} rumah)
            </span>
          </div>
          <div className="w-full bg-stone-100 h-2.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, collectionRate.percentage)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Grid: 12-Month Bar Chart & Arrears Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 12-Month Chart */}
        <div className="lg:col-span-2 bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Tren Arus Kas 12 Bulan ({currentYear})</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">Perbandingan pemasukan vs pengeluaran per bulan</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
                <span className="text-stone-700 text-xs">Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-rose-500"></div>
                <span className="text-stone-700 text-xs">Keluar</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="overflow-x-auto pb-1 scrollbar-none">
            <div className="min-w-[340px] sm:min-w-0 h-56 sm:h-64 flex items-end gap-1.5 sm:gap-3 pt-6 border-b border-stone-100">
              {chartData.map((item: any, idx: number) => {
                const maxVal = Math.max(
                  ...chartData.map((c: any) => Math.max(c.pemasukan, c.pengeluaran)),
                  1000000
                );
                const masukHeight = Math.max(4, Math.round((item.pemasukan / maxVal) * 190));
                const keluarHeight = Math.max(4, Math.round((item.pengeluaran / maxVal) * 190));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-stone-900 text-[11px] text-white p-2.5 rounded-xl shadow-xl z-20 whitespace-nowrap pointer-events-none">
                      <span className="font-bold border-b border-stone-800 pb-1 mb-1">{item.month} {currentYear}</span>
                      <span className="text-emerald-400">Masuk: {formatRupiah(item.pemasukan)}</span>
                      <span className="text-rose-400">Keluar: {formatRupiah(item.pengeluaran)}</span>
                      <span className="text-orange-300 font-semibold">Saldo: {formatRupiah(item.saldo)}</span>
                    </div>

                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1">
                      <div
                        className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition-all"
                        style={{ height: `${masukHeight}px` }}
                      ></div>
                      <div
                        className="w-1/2 bg-rose-500 hover:bg-rose-600 rounded-t-sm transition-all"
                        style={{ height: `${keluarHeight}px` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-stone-500 font-semibold mt-1.5">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
            <span>Data bersumber dari buku kas kontinyu Paradessa.</span>
            <Link href="/buku-kas" className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1">
              <span>Buka Buku Kas Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Houses in Arrears Watchlist */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span>Daftar Tunggakan Iuran</span>
              </h2>
              <span className="text-xs font-bold text-orange-700 bg-orange-100/80 px-2.5 py-0.5 rounded-full border border-orange-200">
                {arrears.length} Rumah
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-4">Rumah yang memiliki tagihan belum lunas</p>

            <div className="overflow-y-auto max-h-[300px] space-y-2 pr-1">
              {arrears.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-8 text-stone-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="text-sm font-bold text-stone-700">Semua Iuran Lunas!</p>
                  <p className="text-xs text-stone-400 mt-1">Tidak ada tunggakan iuran tercatat.</p>
                </div>
              ) : (
                arrears.map((item: any, idx: number) => (
                  <Link
                    key={idx}
                    href={`/rumah/${item.houseCode}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-orange-50/60 border border-stone-200/60 hover:border-orange-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center font-black text-orange-600 text-xs shadow-xs">
                        {item.houseCode}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 group-hover:text-orange-600 transition-colors">
                          Blok {item.houseCode}
                        </div>
                        <div className="text-[11px] text-stone-500 font-medium">
                          {item.monthsOwed.length} bulan: {item.monthsOwed.slice(0, 2).map((m: string) => formatBulanTahun(m, true)).join(', ')}
                          {item.monthsOwed.length > 2 && '...'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-rose-600">
                        {formatRupiah(item.totalOwed)}
                      </div>
                      <span className="text-[10px] text-orange-600 font-semibold group-hover:underline">Lihat Detail →</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100">
            <Link
              href="/rekap-iuran"
              className="w-full py-2.5 flex items-center justify-center text-xs font-bold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100/80 border border-orange-200 rounded-xl transition-colors"
            >
              <span>Buka Matriks Rekap Iuran Lengkap</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
