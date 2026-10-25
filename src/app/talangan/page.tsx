'use client';

import React, { useState, useEffect } from 'react';
import {
  Coins,
  Plus,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { useRole } from '@/context/RoleContext';

export default function TalanganPage() {
  const { isAdmin } = useRole();
  const [advances, setAdvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New advance modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    resident_name: '',
    house_code: '',
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  // Settlement modal
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);
  const [settleForm, setSettleForm] = useState({
    amount: '',
    settlement_type: 'dues_offset', // 'cash' | 'dues_offset'
    due_year_month: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdvances();
  }, []);

  const fetchAdvances = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/advances');
      const json = await res.json();
      if (json.success) setAdvances(json.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          resident_name: addForm.resident_name,
          house_code: addForm.house_code || null,
          description: addForm.description,
          amount: Number(addForm.amount),
          date: addForm.date,
          note: addForm.note,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setMessage('Talangan warga berhasil dicatat.');
        fetchAdvances();
      } else {
        setError(json.error || 'Gagal menyimpan');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleSettleAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvance) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settle',
          advance_id: selectedAdvance.id,
          amount: Number(settleForm.amount),
          settlement_type: settleForm.settlement_type,
          due_year_month: settleForm.due_year_month || null,
          date: settleForm.date,
          note: settleForm.note,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowSettleModal(false);
        setMessage(`Pelunasan talangan sebesar ${formatRupiah(Number(settleForm.amount))} berhasil dicatat.`);
        fetchAdvances();
      } else {
        setError(json.error || 'Gagal menyimpan pelunasan');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const totalOutstandingAdvances = advances
    .filter((a) => a.status === 'active')
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold mb-2">
            <Coins className="w-3.5 h-3.5" />
            <span>Kewajiban Kas Warga</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Talangan & Kasbon Warga
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Pencatatan dana talangan saat warga menalangi pengeluaran bersama (dapat diganti tunai atau potong iuran bulanan).
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-sm shadow-orange-600/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Talangan Baru</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase text-stone-500 tracking-wider">
            Total Kewajiban Talangan Komunitas Belum Lunas
          </span>
          <div className="text-2xl sm:text-3xl font-black text-orange-600 mt-1">
            {formatRupiah(totalOutstandingAdvances)}
          </div>
          <span className="text-xs text-stone-500 mt-1 block">
            Hutang kas warga ke penghuni yang menalangi biaya fasilitas
          </span>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
          <Coins className="w-6 h-6" />
        </div>
      </div>

      {/* Advances List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-stone-400">Memuat data talangan...</div>
        ) : advances.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-500">
            Tidak ada catatan talangan aktif.
          </div>
        ) : (
          advances.map((adv) => {
            const isSettled = adv.status === 'settled' || adv.balance <= 0;
            return (
              <div
                key={adv.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-stone-900">
                          {adv.resident_name}
                        </span>
                        {adv.house_code && (
                          <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                            Blok {adv.house_code}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500">
                        Tanggal: {formatTanggal(adv.date)} • {adv.advance_number}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        isSettled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isSettled ? 'Lunas / Selesai' : 'Aktif (Ada Sisa)'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-stone-800">
                    {adv.description}
                  </p>
                  {adv.note && (
                    <p className="text-[11px] text-stone-500 italic">Catatan: {adv.note}</p>
                  )}

                  {/* Amounts row */}
                  <div className="grid grid-cols-3 gap-2 bg-stone-50 p-3 rounded-xl text-xs border border-stone-100">
                    <div>
                      <span className="text-stone-500 block text-[10px]">Total Talang:</span>
                      <strong className="text-stone-900 font-bold">{formatRupiah(adv.total_amount)}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px]">Telah Diganti:</span>
                      <strong className="text-emerald-600 font-bold">{formatRupiah(adv.settled_amount)}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px]">Sisa Talangan:</span>
                      <strong className="text-orange-600 font-black">{formatRupiah(adv.balance)}</strong>
                    </div>
                  </div>

                  {/* Settlement history */}
                  {adv.settlements?.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Riwayat Pembayaran Penggantian:
                      </span>
                      {adv.settlements.map((s: any, sIdx: number) => (
                        <div key={sIdx} className="flex justify-between text-[11px] text-stone-700 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
                          <span>
                            {formatTanggal(s.date)} ({s.settlement_type === 'cash' ? 'Tunai' : 'Potong Iuran'})
                          </span>
                          <span className="font-bold text-emerald-700">+{formatRupiah(s.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Settle button */}
                {isAdmin && !isSettled && (
                  <div className="pt-2 border-t border-stone-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAdvance(adv);
                        setSettleForm({
                          amount: String(adv.balance),
                          settlement_type: 'dues_offset',
                          due_year_month: '',
                          date: new Date().toISOString().slice(0, 10),
                          note: '',
                        });
                        setShowSettleModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm shadow-orange-600/20 transition-colors cursor-pointer"
                    >
                      Lunasi / Potong Iuran
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add Advance */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">Catat Talangan Baru</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdvance} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Nama Warga Penalang</label>
                  <input
                    type="text"
                    required
                    placeholder="Pak Agung"
                    value={addForm.resident_name}
                    onChange={(e) => setAddForm({ ...addForm, resident_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Blok Rumah (Opsional)</label>
                  <input
                    type="text"
                    placeholder="B50"
                    value={addForm.house_code}
                    onChange={(e) => setAddForm({ ...addForm, house_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Nominal Talangan (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="1000000"
                  value={addForm.amount}
                  onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Tanggal</label>
                <input
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Rincian Pengeluaran yang Ditalangi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Talang perbaikan mesin pompa air"
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm"
                >
                  Simpan Talangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Settle Advance */}
      {showSettleModal && selectedAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">Pelunasan Talangan</h3>
                <p className="text-xs text-stone-500">
                  {selectedAdvance.resident_name} (Sisa: {formatRupiah(selectedAdvance.balance)})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSettleAdvance} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Cara Penggantian</label>
                <select
                  value={settleForm.settlement_type}
                  onChange={(e) => setSettleForm({ ...settleForm, settlement_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-semibold focus:outline-none focus:border-orange-500"
                >
                  <option value="dues_offset">Kompensasi / Potong Iuran Bulanan</option>
                  <option value="cash">Pengembalian Kas Tunai / Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  required
                  max={selectedAdvance.balance}
                  value={settleForm.amount}
                  onChange={(e) => setSettleForm({ ...settleForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Tanggal</label>
                <input
                  type="date"
                  value={settleForm.date}
                  onChange={(e) => setSettleForm({ ...settleForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kompensasi iuran bulan Desember 2025"
                  value={settleForm.note}
                  onChange={(e) => setSettleForm({ ...settleForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm"
                >
                  Simpan Pelunasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
