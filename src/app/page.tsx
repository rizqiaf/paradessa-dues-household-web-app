'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardPage() {
  const { role, selectedHouseCode, isAdmin } = useRole();
  const { language, t } = useLanguage();
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

  const pathname = usePathname();

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

    // Live auto-refresh polling every 8s to guarantee latest transactions are always rendered
    const interval = setInterval(() => {
      loadDashboard(false);
    }, 8000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [loadDashboard, pathname]);

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
              <span>{t('dash.badge')}</span>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-stone-950 tracking-tight leading-tight">
              {t('dash.title')}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600">
              <span>{t('dash.address')}</span>
              {lastUpdated && (
                <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 font-medium bg-stone-100/80 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>{language === 'en' ? 'Updated:' : 'Diperbarui:'} {lastUpdated}</span>
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
                title={language === 'en' ? 'Reload latest cash data directly from server' : 'Muat ulang data kas terbaru langsung dari server'}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs sm:text-sm border border-stone-200/90 shadow-xs active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-stone-500 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
                <span>{refreshing ? (language === 'en' ? 'Loading...' : 'Memuat...') : (language === 'en' ? 'Refresh' : 'Segarkan')}</span>
              </button>
              <Link
                href="/pembayaran"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/25 active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{t('dash.btn_pay')}</span>
              </Link>
              <Link
                href="/pengeluaran"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs sm:text-sm border border-stone-200/90 shadow-xs active:scale-[0.98] transition-all"
              >
                <TrendingDown className="w-4 h-4 text-rose-500" />
                <span>{t('dash.btn_expense')}</span>
              </Link>
            </div>
          ) : (
            <Link
              href={`/rumah/${selectedHouseCode}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all"
            >
              <Building className="w-4 h-4" />
              <span>{language === 'en' ? `House Status Unit ${selectedHouseCode}` : `Status Rumah Blok ${selectedHouseCode}`}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Top Metric Cards - Crisp White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Cash Balance */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:border-orange-200 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{t('dash.balance')}</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-50 border border-orange-200/70 flex items-center justify-center text-orange-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 tracking-tight">
            {formatRupiah(currentBalance)}
          </div>
          <div className="mt-2 text-xs text-stone-500 flex items-center justify-between gap-1.5 font-medium">
            <span className="text-stone-400">{t('dash.opening')}:</span>
            <span className="font-bold text-stone-700">{formatRupiah(thisMonth.saldoAwal)}</span>
          </div>
        </div>

        {/* This Month's Income */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{t('dash.income')} {thisMonth.monthName}</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 tracking-tight">
            +{formatRupiah(thisMonth.pemasukan)}
          </div>
          <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>
              {thisMonth.pemasukanCount !== undefined
                ? (language === 'en' ? `${thisMonth.pemasukanCount} dues receipts recorded` : `${thisMonth.pemasukanCount} penerimaan iuran tercatat`)
                : t('dash.income_sub')}
            </span>
          </div>
        </div>

        {/* This Month's Expenses */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:border-rose-200 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{t('dash.expense')} {thisMonth.monthName}</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-600 tracking-tight">
            -{formatRupiah(thisMonth.pengeluaran)}
          </div>
          <div className="mt-2 text-xs text-rose-700 flex items-center gap-1 font-semibold">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>
              {thisMonth.pengeluaranCount !== undefined
                ? (language === 'en' ? `${thisMonth.pengeluaranCount} operational expenses` : `${thisMonth.pengeluaranCount} pengeluaran operasional`)
                : t('dash.expense_sub')}
            </span>
          </div>
        </div>

        {/* Collection Rate */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between text-stone-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{t('dash.rate')}</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-orange-600">
              {collectionRate.percentage}%
            </span>
            <span className="text-xs text-stone-500 font-medium">
              ({collectionRate.paid} / {collectionRate.billed} {t('dash.houses_unit')})
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

      {/* Last Transaction Live Indicator */}
      {thisMonth.lastTransaction && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2.5 rounded-2xl bg-white border border-stone-200/90 shadow-[0_1px_4px_rgba(0,0,0,0.02)] gap-2 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="shrink-0 px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider border border-orange-200">
              Transaksi Terakhir {thisMonth.monthName}
            </span>
            <span className="font-semibold text-stone-800 truncate">
              {thisMonth.lastTransaction.date} • {thisMonth.lastTransaction.description}
            </span>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <span className="text-stone-400 text-[11px]">Nominal:</span>
            <span className={`font-black text-xs ${thisMonth.lastTransaction.type === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {thisMonth.lastTransaction.type === 'masuk' ? '+' : '-'}{formatRupiah(thisMonth.lastTransaction.amount)}
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: 12-Month Bar Chart & Arrears Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* 12-Month Chart */}
        <div className="lg:col-span-2 bg-white border border-stone-200/80 rounded-3xl p-5 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                <span>{t('dash.chart_title')}</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">{t('dash.chart_sub')}</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500"></div>
                <span className="text-stone-700 text-xs">{t('dash.in')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-rose-500"></div>
                <span className="text-stone-700 text-xs">{t('dash.out')}</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization with Y-Axis Grid Lines & Generous Height */}
          {(() => {
            const rawMax = chartData.length > 0
              ? Math.max(...chartData.map((c: any) => Math.max(c.pemasukan, c.pengeluaran)), 1000000)
              : 1000000;
            const step = rawMax > 2500000 ? 1000000 : 500000;
            const chartMaxVal = Math.max(1000000, Math.ceil(rawMax / step) * step);
            const gridLevels = [
              { label: formatRupiah(chartMaxVal), percent: 100 },
              { label: formatRupiah(Math.round(chartMaxVal * 0.75)), percent: 75 },
              { label: formatRupiah(Math.round(chartMaxVal * 0.5)), percent: 50 },
              { label: formatRupiah(Math.round(chartMaxVal * 0.25)), percent: 25 },
            ];

            return (
              <div className="overflow-x-auto pb-2 scrollbar-none">
                <div className="min-w-[540px] sm:min-w-0 relative">
                  {/* Horizontal Background Guide Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-12">
                    {gridLevels.map((lvl, gIdx) => (
                      <div key={gIdx} className="w-full flex items-center gap-2">
                        <span className="text-[10px] text-stone-300 font-medium w-16 shrink-0 text-right">
                          {lvl.label}
                        </span>
                        <div className="w-full border-b border-dashed border-stone-200/60"></div>
                      </div>
                    ))}
                    <div className="w-full flex items-center gap-2">
                      <span className="text-[10px] text-stone-300 font-medium w-16 shrink-0 text-right">Rp 0</span>
                      <div className="w-full border-b border-stone-200"></div>
                    </div>
                  </div>

                  {/* Responsive Bars Plot Area (Taller & spacious) */}
                  <div className="h-72 sm:h-80 lg:h-[320px] pl-18 flex items-end gap-1 sm:gap-2.5 pt-16 pb-8">
                    {chartData.map((item: any, idx: number) => {
                      const masukPct = Math.max(3, Math.min(100, Math.round((item.pemasukan / chartMaxVal) * 100)));
                      const keluarPct = Math.max(3, Math.min(100, Math.round((item.pengeluaran / chartMaxVal) * 100)));
                      const isCurrentMonth = item.monthNum === currentMonth;

                      return (
                        <div
                          key={idx}
                          className={`flex-1 flex flex-col items-center justify-end h-full relative group rounded-xl p-1 transition-all ${
                            isCurrentMonth ? 'bg-orange-50/50 border border-orange-200/60' : 'hover:bg-stone-50/80'
                          }`}
                        >
                          {/* Tooltip positioned safely above without clipping */}
                          <div className="absolute -top-16 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-stone-900/95 backdrop-blur-md text-[11px] text-white py-2 px-3 rounded-xl shadow-2xl z-30 pointer-events-none border border-stone-700/60 min-w-[135px]">
                            <div className="font-extrabold text-stone-200 border-b border-stone-800 pb-1 mb-1 flex items-center justify-between gap-2">
                              <span>{item.month} {currentYear}</span>
                              {isCurrentMonth && <span className="text-[10px] text-orange-400 font-bold">(Bulan Ini)</span>}
                            </div>
                            <div className="flex items-center justify-between text-emerald-400 font-bold">
                              <span>Masuk:</span>
                              <span>+{formatRupiah(item.pemasukan)}</span>
                            </div>
                            <div className="flex items-center justify-between text-rose-400 font-bold">
                              <span>Keluar:</span>
                              <span>-{formatRupiah(item.pengeluaran)}</span>
                            </div>
                            <div className="flex items-center justify-between text-stone-300 font-semibold border-t border-stone-800 pt-1 mt-1 text-[10px]">
                              <span>Saldo Kas:</span>
                              <span>{formatRupiah(item.saldo)}</span>
                            </div>
                            {/* Little Down Arrow */}
                            <div className="w-2 h-2 bg-stone-900/95 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-stone-700/60"></div>
                          </div>

                          {/* Dual Bars Container */}
                          <div className="w-full h-full flex items-end justify-center gap-1 sm:gap-1.5">
                            {/* Pemasukan (Hijau) */}
                            <div
                              className="w-1/2 max-w-[18px] bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all shadow-xs"
                              style={{ height: `${masukPct}%` }}
                              title={`${item.month} Masuk: ${formatRupiah(item.pemasukan)}`}
                            ></div>
                            {/* Pengeluaran (Merah) */}
                            <div
                              className="w-1/2 max-w-[18px] bg-rose-500 hover:bg-rose-600 rounded-t-md transition-all shadow-xs"
                              style={{ height: `${keluarPct}%` }}
                              title={`${item.month} Keluar: ${formatRupiah(item.pengeluaran)}`}
                            ></div>
                          </div>

                          {/* Month Label */}
                          <span className={`text-[10px] sm:text-xs font-bold mt-2 truncate ${
                            isCurrentMonth ? 'text-orange-600 font-black' : 'text-stone-500'
                          }`}>
                            {item.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
            <span>{t('dash.source_info')}</span>
            <Link href="/buku-kas" className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1">
              <span>{t('dash.view_ledger')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Houses in Arrears Watchlist */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-5 sm:p-7 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span>{t('dash.arrears_title')}</span>
              </h2>
              <span className="text-xs font-bold text-orange-700 bg-orange-100/80 px-2.5 py-0.5 rounded-full border border-orange-200">
                {arrears.length} {t('dash.houses_unit')}
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-4">{language === 'en' ? 'Houses with outstanding unpaid dues' : 'Rumah yang memiliki tagihan belum lunas'}</p>

            <div className="overflow-y-auto max-h-[360px] space-y-2 pr-1">
              {arrears.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-8 text-stone-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="text-sm font-bold text-stone-700">{t('dash.all_paid')}</p>
                  <p className="text-xs text-stone-400 mt-1">{t('dash.no_arrears')}</p>
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
              <span>{t('dash.view_matrix')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
