'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building,
  User,
  Plus,
  Search,
  Calendar,
  Layers,
  ChevronRight,
  Edit,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Home,
  Users,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { useRole } from '@/context/RoleContext';

export default function RumahWargaPage() {
  const { isAdmin } = useRole();
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [blockFilter, setBlockFilter] = useState('ALL');

  // Modal create/edit house
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({
    code: '',
    status: 'dihuni',
    handover_date: '',
    is_merged: false,
    merged_with: '',
    resident_name: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/houses');
      const json = await res.json();
      if (json.success) setHouses(json.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/houses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchHouses();
      }
    } catch {
      // ignore
    }
  };

  const filteredHouses = houses.filter((h) => {
    const matchSearch =
      h.code.toLowerCase().includes(search.toLowerCase()) ||
      (h.currentResident && h.currentResident.name.toLowerCase().includes(search.toLowerCase()));
    const matchBlock = blockFilter === 'ALL' || h.block === blockFilter;
    return matchSearch && matchBlock;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold mb-2">
            <Home className="w-3.5 h-3.5" />
            <span>Master Kavling & Penghuni</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Data Rumah & Penghuni Warga
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Kelola kavling, riwayat penghuni (occupancy history), tanggal serah terima, dan unit gabungan.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setFormData({
                code: '',
                status: 'dihuni',
                handover_date: '',
                is_merged: false,
                merged_with: '',
                resident_name: '',
                phone: '',
                notes: '',
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-sm shadow-orange-600/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rumah Baru</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nomor blok atau nama penghuni..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
          />
        </div>

        <select
          value={blockFilter}
          onChange={(e) => setBlockFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-orange-500 font-bold"
        >
          <option value="ALL">Semua Blok</option>
          <option value="A">Blok A</option>
          <option value="B">Blok B</option>
          <option value="C">Blok C</option>
        </select>
      </div>

      {/* Houses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-stone-400">Memuat data rumah...</div>
        ) : filteredHouses.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-500">Tidak ada rumah yang sesuai.</div>
        ) : (
          filteredHouses.map((h) => {
            const hasArrears = h.totalOwed > 0;
            return (
              <div
                key={h.code}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-stone-900">Blok {h.code}</span>
                        {h.is_merged ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                            Unit Gabungan
                          </span>
                        ) : null}
                      </div>
                      <span className="text-xs font-semibold text-stone-500 block mt-0.5">
                        Status: <strong className="text-stone-700 capitalize">{h.status}</strong>
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        hasArrears
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {hasArrears ? `Tunggakan ${formatRupiah(h.totalOwed)}` : 'Iuran Lunas'}
                    </span>
                  </div>

                  {/* Occupant Info */}
                  <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Penghuni Aktif:</span>
                      <span className="font-bold text-stone-900">
                        {h.currentResident ? h.currentResident.name : (h.status === 'kantor' ? 'KANTOR' : 'Kosong')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Tanggal Serah Terima:</span>
                      <span className="font-medium text-stone-700">
                        {h.handover_date ? formatTanggal(h.handover_date) : '-'}
                      </span>
                    </div>
                    {h.residents?.length > 1 && (
                      <div className="flex items-center justify-between text-[11px] text-orange-600 font-medium">
                        <span>Riwayat Penghuni:</span>
                        <span>{h.residents.length} orang (pernah huni)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">
                    Saldo Lebih Bayar: <strong className="text-emerald-600 font-bold">{formatRupiah(h.creditBalance)}</strong>
                  </span>
                  <Link
                    href={`/rumah/${h.code}`}
                    className="inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700 group"
                  >
                    <span>Detail & Tagihan</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add House */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">Tambah Data Rumah Baru</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHouse} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Nomor Blok (Contoh: A1, B38)</label>
                  <input
                    type="text"
                    required
                    placeholder="A25"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Status Rumah</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="dihuni">Dihuni</option>
                    <option value="kosong">Kosong</option>
                    <option value="kantor">Kantor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Tanggal Serah Terima (Opsional)</label>
                <input
                  type="date"
                  value={formData.handover_date}
                  onChange={(e) => setFormData({ ...formData, handover_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Nama Kepala Keluarga / Penghuni</label>
                <input
                  type="text"
                  placeholder="Nama warga..."
                  value={formData.resident_name}
                  onChange={(e) => setFormData({ ...formData, resident_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="merged"
                  checked={formData.is_merged}
                  onChange={(e) => setFormData({ ...formData, is_merged: e.target.checked })}
                  className="rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="merged" className="text-stone-700 font-medium cursor-pointer">
                  Unit Gabungan (Merged Unit, misal A9 & A10)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm"
                >
                  Simpan Rumah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
