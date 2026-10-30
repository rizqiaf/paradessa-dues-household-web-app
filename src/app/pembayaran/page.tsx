'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Building,
  CheckCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Trash2,
  Clock,
} from 'lucide-react';
import { formatRupiah, formatBulanTahun, normalizeHouseCode, BULAN_INDONESIA } from '@/lib/format';
import { useRole } from '@/context/RoleContext';

export default function CatatPembayaranPage() {
  const router = useRouter();
  const { isAdmin } = useRole();

  const [houses, setHouses] = useState<any[]>([]);
  const [selectedHouse, setSelectedHouse] = useState('');
  const [payerName, setPayerName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<'transfer' | 'cash'>('transfer');
  const [note, setNote] = useState('');
  const [proofPhoto, setProofPhoto] = useState('');

  // Target month selection (default: 'auto')
  const [targetMonth, setTargetMonth] = useState<string>('auto');
  const [suggestedMonth, setSuggestedMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<any[]>([]);

  // Preview state
  const [previewData, setPreviewData] = useState<any>(null);
  const [quickLunasAmount, setQuickLunasAmount] = useState<number>(0);
  const [existingCredit, setExistingCredit] = useState<number>(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Search filter for house picker
  const [searchHouseQuery, setSearchHouseQuery] = useState('');

  // Current month & next month helpers
  const currentYearMonth = date ? date.slice(0, 7) : new Date().toISOString().slice(0, 7);
  const [currY, currM] = currentYearMonth.split('-').map(Number);
  const nextYearMonth = currM === 12 ? `${currY + 1}-01` : `${currY}-${String(currM + 1).padStart(2, '0')}`;

  useEffect(() => {
    fetch('/api/houses', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setHouses(json.data);
      });
  }, []);

  // When house changes, update payer name and fetch preview & quick lunas
  useEffect(() => {
    if (!selectedHouse) {
      setPreviewData(null);
      setQuickLunasAmount(0);
      setSuggestedMonth('');
      return;
    }
    const h = houses.find((item) => item.code === selectedHouse);
    if (h && h.currentResident) {
      setPayerName(h.currentResident.name);
    }

    fetchPreview(selectedHouse, amount || 0, date, targetMonth);
  }, [selectedHouse]);

  // When amount, date, or targetMonth changes, recalculate preview
  useEffect(() => {
    if (selectedHouse) {
      const timer = setTimeout(() => {
        fetchPreview(selectedHouse, amount || 0, date, targetMonth);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [amount, date, targetMonth]);

  const fetchPreview = async (houseCode: string, payAmount: number, payDate: string, tMonth: string) => {
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/payments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          house_code: houseCode,
          amount: payAmount,
          date: payDate,
          target_month: tMonth,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPreviewData(json.preview);
        setQuickLunasAmount(json.quickLunasAmount);
        setExistingCredit(json.existingCredit);
        setSuggestedMonth(json.suggestedMonth || '');
        if (json.availableMonths) {
          setAvailableMonths(json.availableMonths);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleQuickLunas = () => {
    setTargetMonth(currentYearMonth);
    if (quickLunasAmount > 0) {
      setAmount(quickLunasAmount);
    } else {
      setAmount(120000);
    }
    if (!note || note.startsWith('Iuran')) {
      setNote(`Iuran ${formatBulanTahun(currentYearMonth)}`);
    }
  };

  const handleQuickPayNextMonth = () => {
    setTargetMonth(nextYearMonth);
    setAmount(120000);
    setNote(`Iuran ${formatBulanTahun(nextYearMonth)} (Bayar di Muka)`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouse || !amount || amount <= 0) {
      setErrorMessage('Pilih rumah dan masukkan nominal pembayaran valid.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          house_code: selectedHouse,
          payer_name: payerName,
          amount: Number(amount),
          date,
          method,
          proof_photo: proofPhoto || null,
          note,
          custom_allocations: previewData?.allocations || null,
          target_month: targetMonth,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMessage(`Pembayaran sebesar ${formatRupiah(Number(amount))} untuk Blok ${selectedHouse} berhasil disimpan! Mengalihkan ke Buku Kas...`);
        setAmount('');
        setNote('');
        setProofPhoto('');
        setTimeout(() => {
          // Hard navigation to ensure no stale client cache
          window.location.href = '/buku-kas';
        }, 1200);
      } else {
        setErrorMessage(json.error || 'Gagal menyimpan pembayaran');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  const filteredHouses = houses.filter((h) =>
    h.code.toLowerCase().includes(searchHouseQuery.toLowerCase()) ||
    (h.currentResident && h.currentResident.name.toLowerCase().includes(searchHouseQuery.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-3xl font-black text-stone-950 flex items-center gap-2">
          <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600 shrink-0" />
          <span>Catat Pembayaran Iuran</span>
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Input penerimaan uang iuran warga. Sistem otomatis mengalokasikan ke bulan tertunggak & prepayment.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="bg-white border border-stone-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-4 sm:space-y-5">
          {/* House Picker (Searchable) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              Pilih Nomor Rumah Warga
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <input
                type="text"
                placeholder="Cari nomor blok atau nama warga..."
                value={searchHouseQuery}
                onChange={(e) => setSearchHouseQuery(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
              />
              <select
                value={selectedHouse}
                onChange={(e) => {
                  setSelectedHouse(e.target.value);
                  setTargetMonth('auto');
                }}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:bg-white font-bold cursor-pointer"
              >
                <option value="">-- Pilih Rumah ({filteredHouses.length} unit) --</option>
                {filteredHouses.map((h) => (
                  <option key={h.code} value={h.code}>
                    Blok {h.code} {h.currentResident ? `- ${h.currentResident.name}` : '(Kosong/Developer)'} {h.totalOwed > 0 ? `[Tunggakan: ${formatRupiah(h.totalOwed)}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action Buttons: Bulan Ini vs Bulan Depan (Bayar di Muka) */}
            {selectedHouse && (
              <div className="mt-2.5 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50/50 to-orange-50 border border-orange-200/90 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-orange-950 font-bold">
                  <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Pilihan Cepat Target Pembayaran:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleQuickLunas}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      targetMonth === currentYearMonth
                        ? 'bg-orange-500 text-white border-orange-600 shadow-sm'
                        : 'bg-white hover:bg-orange-50/70 text-stone-800 border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs">Lunas Bulan Ini ({formatBulanTahun(currentYearMonth)})</div>
                      <div className={`text-[11px] mt-0.5 ${targetMonth === currentYearMonth ? 'text-orange-100' : 'text-stone-500'}`}>
                        Estimasi tagihan: <strong>{formatRupiah(quickLunasAmount > 0 ? quickLunasAmount : 120000)}</strong>
                      </div>
                    </div>
                    {targetMonth === currentYearMonth && <CheckCircle className="w-4 h-4 text-white shrink-0 ml-2" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickPayNextMonth}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      targetMonth === nextYearMonth
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-white hover:bg-amber-50/70 text-stone-800 border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs flex items-center gap-1.5">
                        <span>Bayar Bulan Depan ({formatBulanTahun(nextYearMonth)})</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                          targetMonth === nextYearMonth ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Di Muka
                        </span>
                      </div>
                      <div className={`text-[11px] mt-0.5 ${targetMonth === nextYearMonth ? 'text-amber-100' : 'text-stone-500'}`}>
                        Iuran 1 bulan: <strong>Rp 120.000</strong> (bayar sekarang)
                      </div>
                    </div>
                    {targetMonth === nextYearMonth && <CheckCircle className="w-4 h-4 text-white shrink-0 ml-2" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Target Month Selector (Pilihan Pembayaran Untuk Bulan Apa) */}
          {selectedHouse && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50/80 border border-stone-200/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span>Periode Bulan Iuran Yang Dibayar</span>
                </label>
                {suggestedMonth && (
                  <span className="text-[11px] font-bold text-orange-700 bg-orange-100/70 px-2.5 py-0.5 rounded-lg border border-orange-200 self-start sm:self-auto">
                    Saran Sistem: {formatBulanTahun(suggestedMonth)}
                  </span>
                )}
              </div>

              {/* Informative alert when paying next month in current month */}
              {targetMonth === nextYearMonth && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Opsi Bayar di Muka Aktif:</strong> Warga membayar di periode sekarang ({formatBulanTahun(currentYearMonth)}), namun dialokasikan untuk iuran bulan <strong>{formatBulanTahun(nextYearMonth)}</strong>. Uang masuk akan tercatat di Buku Kas <strong>{formatBulanTahun(currentYearMonth)}</strong>.
                  </div>
                </div>
              )}

              {/* Quick Month Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetMonth(currentYearMonth);
                    if (!note || note.startsWith('Iuran')) setNote(`Iuran ${formatBulanTahun(currentYearMonth)}`);
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                    targetMonth === currentYearMonth
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span className="truncate">Bulan Ini ({formatBulanTahun(currentYearMonth)})</span>
                  {targetMonth === currentYearMonth && <CheckCircle className="w-3.5 h-3.5 shrink-0 ml-1" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetMonth(nextYearMonth);
                    if (!note || note.startsWith('Iuran')) setNote(`Iuran ${formatBulanTahun(nextYearMonth)} (Bayar di Muka)`);
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                    targetMonth === nextYearMonth
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <div className="truncate">
                    <span>Bulan Depan ({formatBulanTahun(nextYearMonth)})</span>
                    <span className="block text-[10px] opacity-85 font-normal">Bayar di Muka (Prepayment)</span>
                  </div>
                  {targetMonth === nextYearMonth && <CheckCircle className="w-3.5 h-3.5 shrink-0 ml-1" />}
                </button>

                {suggestedMonth && suggestedMonth !== currentYearMonth && suggestedMonth !== nextYearMonth ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetMonth(suggestedMonth);
                      if (!note || note.startsWith('Iuran')) setNote(`Iuran ${formatBulanTahun(suggestedMonth)}`);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                      targetMonth === suggestedMonth
                        ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="truncate">
                      <span>Saran ({formatBulanTahun(suggestedMonth)})</span>
                      <span className="block text-[10px] opacity-85 font-normal">Tertunggak</span>
                    </div>
                    {targetMonth === suggestedMonth && <CheckCircle className="w-3.5 h-3.5 shrink-0 ml-1" />}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTargetMonth('auto')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                      targetMonth === 'auto'
                        ? 'bg-stone-800 text-white border-stone-800 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span className="truncate">Otomatis Sesuai Tunggakan</span>
                    {targetMonth === 'auto' && <CheckCircle className="w-3.5 h-3.5 shrink-0 ml-1" />}
                  </button>
                )}
              </div>

              {/* Full Month Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-1">
                  Atau Pilih Bulan Spesifik Dari Daftar:
                </label>
                <div className="relative">
                  <select
                    value={targetMonth}
                    onChange={(e) => {
                      setTargetMonth(e.target.value);
                      if (e.target.value !== 'auto') {
                        if (!note || note.startsWith('Iuran')) setNote(`Iuran ${formatBulanTahun(e.target.value)}`);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-orange-500 font-semibold cursor-pointer"
                  >
                    <option value="auto">
                      -- Otomatis Sesuai Urutan Tunggakan ({suggestedMonth ? formatBulanTahun(suggestedMonth) : formatBulanTahun(currentYearMonth)}) --
                    </option>
                    {availableMonths.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Amount & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Nominal Pembayaran (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold text-sm">Rp</span>
                <input
                  type="number"
                  placeholder="Contoh: 120000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  required
                  min={1000}
                  step={1000}
                  className="w-full pl-11 pr-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-black text-base focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
              {amount !== '' && (
                <p className="text-xs text-orange-600 font-bold mt-1.5">
                  Terbaca: {formatRupiah(Number(amount))}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Tanggal Pembayaran Diterima
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:bg-white font-semibold cursor-pointer"
              />
            </div>
          </div>

          {/* Payer Name & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Nama Pembayar / Pengirim
              </label>
              <input
                type="text"
                placeholder="Nama warga..."
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('transfer')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    method === 'transfer'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Transfer Bank
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('cash')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    method === 'cash'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Tunai / Cash
                </button>
              </div>
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              Catatan / Keterangan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Iuran 2 bulan (Jan & Feb 2026)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
            />
          </div>
        </div>

        {/* Real-Time Auto-Allocation Preview Card */}
        {selectedHouse && amount !== '' && Number(amount) > 0 && (
          <div className="bg-white border border-orange-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-extrabold text-stone-900">Preview Alokasi Pembayaran</h3>
              </div>
              <span className="text-xs font-bold text-orange-800 bg-orange-100/80 px-3 py-1 rounded-full border border-orange-200 self-start sm:self-auto">
                {previewData?.coverageSummary || 'Menghitung...'}
              </span>
            </div>

            {loadingPreview ? (
              <div className="py-8 text-center text-xs text-stone-400 font-bold animate-pulse">
                Menghitung alokasi komponen iuran...
              </div>
            ) : previewData?.allocations && previewData.allocations.length > 0 ? (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-600 uppercase text-[10px] tracking-wider font-extrabold">
                        <th className="py-2 text-left">Bulan Dues</th>
                        <th className="py-2 text-left">Komponen</th>
                        <th className="py-2 text-left">Jenis</th>
                        <th className="py-2 text-right">Nominal Alokasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {previewData.allocations.map((alloc: any, idx: number) => (
                        <tr key={idx} className="hover:bg-stone-50/50">
                          <td className="py-2 font-bold text-stone-900">{formatBulanTahun(alloc.year_month)}</td>
                          <td className="py-2 font-medium text-stone-700">{alloc.component_name}</td>
                          <td className="py-2">
                            {alloc.is_future_prepayment || alloc.year_month > currentYearMonth ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                Bayar di Muka (Prepayment)
                              </span>
                            ) : alloc.year_month === currentYearMonth ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                Iuran Bulan Berjalan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                Pelunasan Tunggakan
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-right font-black text-stone-900">{formatRupiah(alloc.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Overpayment Credit Warning */}
                {previewData.houseCredit > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center justify-between">
                    <span>
                      Sisa lebih pembayaran akan dicatat sebagai <strong>Saldo Kredit Rumah</strong>:
                    </span>
                    <strong className="text-amber-950 font-black">{formatRupiah(previewData.houseCredit)}</strong>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400 py-4 text-center">
                Masukkan nominal pembayaran untuk melihat simulasi alokasi ke komponen Pokok, Air, dan Sampah.
              </p>
            )}
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/buku-kas')}
            className="px-5 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving || !selectedHouse || !amount || Number(amount) <= 0}
            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Pembayaran</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
