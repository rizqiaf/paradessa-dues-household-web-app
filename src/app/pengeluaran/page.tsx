'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Upload,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  User,
  Plus,
} from 'lucide-react';
import { formatRupiah } from '@/lib/format';

export default function CatatPengeluaranPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState('Token Listrik Mesin Air & Portal');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [payee, setPayee] = useState('');
  const [note, setNote] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.length > 0) {
          setCategories(json.data);
          setCategory(json.data[0].name);
        }
      });
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isCustomCategory ? customCategory.trim() : category;

    if (!finalCategory || !amount || amount <= 0 || !description) {
      setErrorMessage('Kategori, nominal, dan deskripsi pengeluaran wajib diisi.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: finalCategory,
          amount: Number(amount),
          date,
          description,
          payee: payee || null,
          receipt_photo: receiptPhoto || null,
          note: note || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMessage(`Pengeluaran ${formatRupiah(Number(amount))} untuk "${description}" berhasil dicatat!`);
        setAmount('');
        setDescription('');
        setPayee('');
        setNote('');
        setReceiptPhoto('');
        setTimeout(() => {
          router.push('/buku-kas');
        }, 1500);
      } else {
        setErrorMessage(json.error || 'Gagal menyimpan pengeluaran');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-3xl font-black text-stone-950 flex items-center gap-2">
          <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-rose-500 shrink-0" />
          <span>Catat Pengeluaran Kas</span>
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Pencatatan biaya operasional lingkungan Paradessa (listrik, sampah, perbaikan fasilitas).
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
          {/* Category Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                Kategori Pengeluaran
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
              >
                {isCustomCategory ? 'Pilih dari daftar kategori' : '+ Tambah kategori baru'}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                placeholder="Tulis nama kategori baru..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:bg-white font-semibold"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:bg-white font-bold cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Nominal Biaya (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold text-sm">Rp</span>
                <input
                  type="number"
                  placeholder="Contoh: 104100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  required
                  min={100}
                  step={100}
                  className="w-full pl-11 pr-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-black text-base focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>
              {amount !== '' && (
                <p className="text-xs text-rose-600 font-bold mt-1.5">
                  Nominal: {formatRupiah(Number(amount))}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Tanggal Pengeluaran
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

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              Keterangan / Rincian Pengeluaran
            </label>
            <input
              type="text"
              placeholder="Contoh: Beli token listrik pompa air & portal 100.000 + biaya admin"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
            />
          </div>

          {/* Payee / Penerima & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Penerima Pembayaran (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Pak Udin / PLN / Toko Besi"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Nomor struk, referensi..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Receipt Photo Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              Foto Nota / Kwitansi / Bukti Bayar (Opsional)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-orange-600" />
                <span>Unggah Foto Bukti</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {receiptPhoto && (
                <div className="flex items-center gap-2">
                  <img
                    src={receiptPhoto}
                    alt="Bukti nota"
                    className="w-10 h-10 object-cover rounded-xl border border-stone-300"
                  />
                  <span className="text-xs text-emerald-600 font-bold">Bukti siap diunggah</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
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
            disabled={saving || !amount || !description}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-md shadow-rose-600/25 transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4" />
                <span>Simpan Pengeluaran</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
