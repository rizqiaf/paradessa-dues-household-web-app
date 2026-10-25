'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Building,
  User,
  CreditCard,
  Printer,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Coins,
  History,
  Send,
  Home,
} from 'lucide-react';
import {
  formatRupiah,
  formatTanggal,
  formatBulanTahun,
} from '@/lib/format';
import { exportStatementToPdf } from '@/lib/export-pdf';
import { useRole } from '@/context/RoleContext';

export default function DetailRumahPage() {
  const params = useParams();
  const router = useRouter();
  const { role, isAdmin } = useRole();

  const houseCode = String(params.code || '').toUpperCase();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'tagihan'>('timeline');

  useEffect(() => {
    fetchHouseDetail();
  }, [houseCode]);

  const fetchHouseDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/houses/${houseCode}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-400 text-sm">
        Memuat data rumah Blok {houseCode}...
      </div>
    );
  }

  if (!data || !data.house) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-stone-900">Rumah Blok {houseCode} Tidak Ditemukan</h2>
        <button
          type="button"
          onClick={() => router.push('/rumah')}
          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold"
        >
          Kembali ke Daftar Rumah
        </button>
      </div>
    );
  }

  const { house, residents, activeResident, subscriptions, timeline, statement } = data;

  const handlePrintStatement = () => {
    if (statement) {
      exportStatementToPdf(statement);
    }
  };

  const handleSendStatementWA = () => {
    if (statement && activeResident?.phone) {
      const text = `*SURAT TAGIHAN IURAN PARADESSA HABITAT*\n` +
        `Yth. ${statement.recipientName} (Blok ${statement.houseCode})\n\n` +
        `Total Tunggakan: ${formatRupiah(statement.totalOutstanding)}\n` +
        (statement.totalCredit > 0 ? `Saldo Lebih Bayar: -${formatRupiah(statement.totalCredit)}\n` : '') +
        `*Total Yang Harus Dibayar: ${formatRupiah(statement.netPayable)}*\n\n` +
        `Silakan transfer ke Rekening ${statement.bankInfo.bankName} ${statement.bankInfo.accountNumber} a/n ${statement.bankInfo.accountHolder}.\n` +
        `Terima kasih atas kerjasamanya.\n_Bendahara Paradessa Habitat_`;

      const encoded = encodeURIComponent(text);
      window.open(`https://api.whatsapp.com/send?phone=${activeResident.phone.replace(/[^0-9]/g, '')}&text=${encoded}`, '_blank');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-stone-900">Blok {house.code}</h1>
              {house.is_merged && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  Unit Gabungan
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              Penghuni: <strong className="text-stone-800">{activeResident?.name || 'Kosong / Developer'}</strong> • Serah Terima: {house.handover_date ? formatTanggal(house.handover_date) : '-'}
            </p>
          </div>
        </div>

        {/* Tab Switcher: Timeline vs Surat Tagihan */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Riwayat & Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tagihan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tagihan'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Surat Tagihan (Printable)
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold uppercase text-stone-500">Total Tunggakan Belum Bayar</span>
          <div className="text-xl font-black text-rose-600 mt-1">
            {formatRupiah(data.totalOwed)}
          </div>
        </div>
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold uppercase text-stone-500">Saldo Kredit (Lebih Bayar)</span>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {formatRupiah(data.totalCredit)}
          </div>
        </div>
        <div className="bg-white border border-orange-200 bg-orange-50/40 p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold uppercase text-orange-700">Kewajiban Bersih</span>
          <div className="text-xl font-black text-stone-900 mt-1">
            {formatRupiah(data.netOutstanding)}
          </div>
        </div>
      </div>

      {/* TAB 1: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Occupant History Section */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <History className="w-4 h-4 text-orange-600" />
              <span>Riwayat Penghuni (Occupancy History)</span>
            </h3>
            <div className="divide-y divide-stone-100">
              {residents.map((r: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900">{r.name}</span>
                    {r.phone && <span className="text-stone-500 ml-2">({r.phone})</span>}
                  </div>
                  <div className="text-stone-500 flex items-center gap-2">
                    <span>Mulai: {formatTanggal(r.start_date)}</span>
                    {r.is_active ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[10px]">
                        Terdahulu
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment History Timeline */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Riwayat Pembayaran Diterima</span>
            </h3>

            {timeline.payments.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">Belum ada riwayat pembayaran tercatat.</p>
            ) : (
              <div className="space-y-3">
                {timeline.payments.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-stone-900">{formatTanggal(p.date)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-medium">
                          {p.method.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-extrabold text-emerald-600">
                        +{formatRupiah(p.amount)}
                      </span>
                    </div>

                    <div className="text-stone-600">
                      Pembayar: <strong className="text-stone-900">{p.payer_name}</strong>
                      {p.note && <span className="ml-2 italic text-stone-500">• {p.note}</span>}
                    </div>

                    {/* Breakdown of allocations */}
                    {p.allocations?.length > 0 && (
                      <div className="pt-2 border-t border-stone-200 flex flex-wrap gap-1.5">
                        {p.allocations.map((a: any, aIdx: number) => (
                          <span
                            key={aIdx}
                            className="inline-flex items-center gap-1 text-[10px] bg-white text-stone-700 px-2 py-1 rounded-md border border-stone-200 shadow-2xs"
                          >
                            <span>{formatBulanTahun(a.year_month, true)} ({a.component_name}):</span>
                            <strong className="text-emerald-700">{formatRupiah(a.amount)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SURAT TAGIHAN (PRINTABLE STATEMENT) */}
      {activeTab === 'tagihan' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            {activeResident?.phone && (
              <button
                type="button"
                onClick={handleSendStatementWA}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Kirim via WhatsApp</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrintStatement}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm shadow-orange-600/20 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Unduh PDF Tagihan</span>
            </button>
          </div>

          {/* Printable Statement Sheet */}
          <div className="bg-white text-stone-900 rounded-2xl p-8 shadow-sm space-y-6 border border-stone-200">
            {/* Header */}
            <div className="text-center space-y-1 border-b-2 border-stone-800 pb-4">
              <h2 className="text-xl font-black text-stone-900 tracking-wide uppercase">
                {statement.clusterName}
              </h2>
              <p className="text-xs text-stone-600 max-w-lg mx-auto">
                {statement.clusterAddress}
              </p>
            </div>

            <div className="text-center pt-1">
              <h3 className="text-lg font-black text-stone-900 underline">
                SURAT TAGIHAN IURAN WARGA
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">Nomor: {statement.statementNumber}</p>
            </div>

            {/* Recipient details */}
            <div className="grid grid-cols-2 gap-4 text-xs py-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="space-y-1">
                <div>
                  <span className="text-stone-500">Nama Warga:</span>
                  <span className="font-bold text-stone-900 ml-2">{statement.recipientName}</span>
                </div>
                <div>
                  <span className="text-stone-500">Nomor Rumah:</span>
                  <span className="font-extrabold text-stone-900 ml-2">Blok {statement.houseCode}</span>
                </div>
              </div>
              <div className="space-y-1 text-right">
                <div>
                  <span className="text-stone-500">Tanggal Tagihan:</span>
                  <span className="font-bold text-stone-900 ml-2">{statement.date}</span>
                </div>
                <div>
                  <span className="text-stone-500">No. WhatsApp:</span>
                  <span className="font-medium text-stone-900 ml-2">{statement.recipientPhone}</span>
                </div>
              </div>
            </div>

            {/* Unpaid table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-stone-700 tracking-wider">
                Rincian Iuran Yang Belum Dibayar
              </h4>
              <table className="w-full text-xs text-left border-collapse border border-stone-300">
                <thead className="bg-stone-100 font-bold text-stone-800">
                  <tr>
                    <th className="border border-stone-300 px-3 py-2 text-center w-8">No</th>
                    <th className="border border-stone-300 px-3 py-2">Periode Dues</th>
                    <th className="border border-stone-300 px-3 py-2">Komponen</th>
                    <th className="border border-stone-300 px-3 py-2 text-right">Tagihan</th>
                    <th className="border border-stone-300 px-3 py-2 text-right">Terbayar</th>
                    <th className="border border-stone-300 px-3 py-2 text-right">Sisa Tagihan</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.unpaidItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-stone-300 px-3 py-6 text-center text-emerald-700 font-bold">
                        Alhamdulillah, semua iuran sampai saat ini telah lunas!
                      </td>
                    </tr>
                  ) : (
                    statement.unpaidItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="border border-stone-300 px-3 py-2 text-center">{idx + 1}</td>
                        <td className="border border-stone-300 px-3 py-2 font-bold text-stone-900">{item.periodLabel}</td>
                        <td className="border border-stone-300 px-3 py-2 text-stone-700">{item.component}</td>
                        <td className="border border-stone-300 px-3 py-2 text-right font-medium">{formatRupiah(item.amount)}</td>
                        <td className="border border-stone-300 px-3 py-2 text-right text-stone-500">{formatRupiah(item.paid)}</td>
                        <td className="border border-stone-300 px-3 py-2 text-right font-extrabold text-rose-600">{formatRupiah(item.remaining)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs gap-3">
              <div>
                <span className="text-stone-500 block">Metode Pembayaran Transfer:</span>
                <span className="font-extrabold text-stone-900 block mt-0.5">
                  Bank {statement.bankInfo.bankName}: {statement.bankInfo.accountNumber}
                </span>
                <span className="text-[11px] text-stone-500 block">
                  a/n {statement.bankInfo.accountHolder}
                </span>
              </div>
              <div className="text-right">
                <span className="text-stone-500 text-xs">Total Yang Harus Dibayar:</span>
                <div className="text-2xl font-black text-stone-900 mt-0.5">
                  {formatRupiah(statement.netPayable)}
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="flex justify-between items-end pt-6">
              <div className="text-[10px] text-stone-400 italic">
                Paradessa Household Dues
              </div>
              <div className="text-center space-y-12 text-xs">
                <div className="text-stone-600">Bendahara Paradessa Habitat,</div>
                <div className="font-bold text-stone-900 underline">Rizqi Ahmad Fauzi</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
