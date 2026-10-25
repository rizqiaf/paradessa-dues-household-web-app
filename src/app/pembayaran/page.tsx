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
} from 'lucide-react';
import { formatRupiah, formatBulanTahun, normalizeHouseCode } from '@/lib/format';
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

  useEffect(() => {
    fetch('/api/houses')
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
      return;
    }
    const h = houses.find((item) => item.code === selectedHouse);
    if (h && h.currentResident) {
      setPayerName(h.currentResident.name);
    }

    fetchPreview(selectedHouse, amount || 0, date);
  }, [selectedHouse]);

  // When amount or date changes, recalculate preview
  useEffect(() => {
    if (selectedHouse) {
      const timer = setTimeout(() => {
        fetchPreview(selectedHouse, amount || 0, date);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [amount, date]);

  const fetchPreview = async (houseCode: string, payAmount: number, payDate: string) => {
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/payments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          house_code: houseCode,
          amount: payAmount,
          date: payDate,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPreviewData(json.preview);
        setQuickLunasAmount(json.quickLunasAmount);
        setExistingCredit(json.existingCredit);
      }
    } catch {
      // ignore
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleQuickLunas = () => {
    if (quickLunasAmount > 0) {
      setAmount(quickLunasAmount);
    }
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
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMessage(`Pembayaran sebesar ${formatRupiah(Number(amount))} untuk Blok ${selectedHouse} berhasil disimpan!`);
        setAmount('');
        setNote('');
        setProofPhoto('');
        setTimeout(() => {
          router.push('/buku-kas');
        }, 1500);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-950 flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-orange-600" />
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-5">
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
                onChange={(e) => setSelectedHouse(e.target.value)}
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

            {/* Quick "Lunas Bulan Ini" Button */}
            {selectedHouse && quickLunasAmount > 0 && (
              <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200 gap-2 text-xs">
                <div className="flex items-center gap-2 text-orange-900">
                  <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>
                    Estimasi lunas sampai bulan ini: <strong className="text-orange-950 font-black">{formatRupiah(quickLunasAmount)}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickLunas}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold transition-colors shadow-xs self-start sm:self-auto"
                >
                  Lunas Bulan Ini
                </button>
              </div>
            )}
          </div>

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
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
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
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
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
              <div className="py-4 text-center text-xs text-stone-400">Menghitung alokasi otomatis...</div>
            ) : previewData?.allocations?.length > 0 ? (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-3.5 py-2.5 rounded-l-xl">Bulan Dues</th>
                        <th className="px-3.5 py-2.5">Komponen</th>
                        <th className="px-3.5 py-2.5">Jenis</th>
                        <th className="px-3.5 py-2.5 text-right rounded-r-xl">Nominal Alokasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {previewData.allocations.map((alloc: any, idx: number) => (
                        <tr key={idx} className="hover:bg-orange-50/20">
                          <td className="px-3.5 py-3 font-bold text-stone-900">
                            {formatBulanTahun(alloc.year_month)}
                          </td>
                          <td className="px-3.5 py-3 font-semibold text-stone-700">
                            {alloc.component_name}
                          </td>
                          <td className="px-3.5 py-3">
                            {alloc.is_future_prepayment ? (
                              <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                                Prepayment
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                Tagihan / Tunggakan
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-right font-black text-emerald-600">
                            {formatRupiah(alloc.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Overpayment House Credit Notice */}
                {previewData.houseCredit > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>
                      Kelebihan Pembayaran: <strong>{formatRupiah(previewData.houseCredit)}</strong>
                    </span>
                    <span className="text-[11px] text-amber-700 font-bold">
                      Disimpan otomatis sebagai Saldo Kredit Rumah
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-500 py-2">
                Tidak ada alokasi tagihan ditemukan. Seluruh pembayaran akan masuk ke saldo kredit rumah.
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving || !selectedHouse || !amount}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
