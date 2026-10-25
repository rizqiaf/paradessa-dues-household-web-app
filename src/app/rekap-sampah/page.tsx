'use client';

import React, { useState, useEffect } from 'react';
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { formatRupiah, BULAN_INDONESIA } from '@/lib/format';

export default function RekapSampahPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(now.getMonth());

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/garbage?year=${selectedYear}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const months = data?.months || [];
  const currentMonthData = months[selectedMonthIndex] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-950 flex items-center gap-2">
            <Trash2 className="w-7 h-7 text-orange-600" />
            <span>Rekap Pengelolaan Sampah Warga</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Monitoring iuran sampah per rumah (Rp 50.000) dan pembayaran ke Pak Udin.
          </p>
        </div>

        {/* Year Selector */}
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
      </div>

      {/* 12 Month Selector Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {months.map((m: any, idx: number) => {
          const isSelected = selectedMonthIndex === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedMonthIndex(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                  : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              {m.monthName}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center text-stone-400 text-sm">Memuat data rekap sampah...</div>
      ) : currentMonthData ? (
        <div className="space-y-6">
          {/* Month Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Collected */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
              <span className="text-[11px] font-bold uppercase text-stone-400">Total Iuran Terkumpul</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {formatRupiah(currentMonthData.totalCollected)}
              </div>
              <div className="text-xs text-stone-500 mt-2 font-medium">
                {currentMonthData.paidHousesCount} dari {currentMonthData.totalParticipating} rumah membayar
              </div>
            </div>

            {/* Owed to Pak Udin */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
              <span className="text-[11px] font-bold uppercase text-stone-400">Kewajiban ke Pak Udin</span>
              <div className="text-2xl font-black text-stone-900 mt-1">
                {formatRupiah(currentMonthData.owedToCollector)}
              </div>
              <div className="text-xs text-stone-500 mt-2 font-medium">
                50.000 × {currentMonthData.totalParticipating} rumah ikut sampah
              </div>
            </div>

            {/* Actual Payment Recorded in Expenses */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
              <span className="text-[11px] font-bold uppercase text-stone-400">Kas Keluar ke Pak Udin</span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {formatRupiah(currentMonthData.actualPaidToCollector)}
              </div>
              <div className="text-xs text-stone-500 mt-2 font-medium">Tercatat di pengeluaran bulan ini</div>
            </div>

            {/* Difference / Balance */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
              <span className="text-[11px] font-bold uppercase text-stone-400">Selisih Kas / Subsidi</span>
              <div
                className={`text-2xl font-black mt-1 ${
                  currentMonthData.difference >= 0 ? 'text-emerald-600' : 'text-orange-600'
                }`}
              >
                {currentMonthData.difference >= 0 ? '+' : ''}
                {formatRupiah(currentMonthData.difference)}
              </div>
              <div className="text-xs text-stone-500 mt-2 font-medium">
                {currentMonthData.difference === 0
                  ? 'Pas dengan kewajiban'
                  : currentMonthData.difference > 0
                  ? 'Kelebihan / Kas lingkungan'
                  : 'Disubsidi dari kas'}
              </div>
            </div>
          </div>

          {/* Breakdown of Participating Houses in this Month */}
          <div className="bg-white border border-stone-200/80 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-orange-600" />
                  <span>Daftar Rumah Ikut Sampah ({currentMonthData.monthName} {selectedYear})</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Status pembayaran iuran sampah per rumah
                </p>
              </div>
              <span className="text-xs font-bold text-orange-800 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 self-start sm:self-auto">
                {currentMonthData.paidHousesCount} Lunas / {currentMonthData.totalParticipating} Total
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {currentMonthData.houses?.map((h: any, idx: number) => {
                const isPaid = h.paid_amount > 0 || h.status === 'lunas';
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      isPaid
                        ? 'bg-stone-50/70 border-stone-200/70 text-stone-800'
                        : 'bg-rose-50/50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-stone-900">Blok {h.house_code}</div>
                      <div className="text-[11px] text-stone-500 font-medium truncate max-w-[120px]">
                        {h.resident_name || '-'}
                      </div>
                    </div>
                    <div>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Lunas</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          <span>Belum</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
