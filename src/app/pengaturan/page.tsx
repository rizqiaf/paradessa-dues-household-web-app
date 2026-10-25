'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldAlert,
  Lock,
  Unlock,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  History,
  Tag,
  DollarSign,
  Building,
  Sliders,
} from 'lucide-react';
import { formatRupiah, formatTanggal, formatBulanTahun } from '@/lib/format';
import { useRole } from '@/context/RoleContext';

export default function PengaturanPage() {
  const { isAdmin } = useRole();
  const [settings, setSettings] = useState<any[]>([]);
  const [feeComponents, setFeeComponents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [monthLocks, setMonthLocks] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [openingBalance, setOpeningBalance] = useState('0');
  const [openingBalanceDate, setOpeningBalanceDate] = useState('2025-06-01');
  const [newCategoryName, setNewCategoryName] = useState('');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchAuditLogs();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success) {
        setSettings(json.settings);
        setFeeComponents(json.feeComponents);
        setCategories(json.categories);
        setMonthLocks(json.monthLocks);

        const ob = json.settings.find((s: any) => s.key === 'opening_balance');
        if (ob) setOpeningBalance(ob.value);
        const obd = json.settings.find((s: any) => s.key === 'opening_balance_date');
        if (obd) setOpeningBalanceDate(obd.value);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs?limit=50');
      const json = await res.json();
      if (json.success) setAuditLogs(json.data);
    } catch {
      // ignore
    }
  };

  const handleSaveOpeningBalance = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_setting',
          key: 'opening_balance',
          value: openingBalance,
        }),
      });
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_setting',
          key: 'opening_balance_date',
          value: openingBalanceDate,
        }),
      });
      setMessage('Saldo awal berhasil diperbarui.');
      fetchSettings();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setNewCategoryName('');
        setMessage(`Kategori "${json.name}" berhasil ditambahkan.`);
        fetchSettings();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleMonthLock = async (yearMonth: string, currentStatus: string) => {
    const action = currentStatus === 'terkunci' ? 'unlock' : 'lock';
    const [y, m] = yearMonth.split('-');
    try {
      const res = await fetch('/api/reports/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: parseInt(y, 10),
          month: parseInt(m, 10),
          action,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchSettings();
        fetchAuditLogs();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold mb-2">
          <Sliders className="w-3.5 h-3.5" />
          <span>Konfigurasi & Pengawasan</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Pengaturan Sistem & Audit Log
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Konfigurasi besaran iuran dengan tanggal efektif, kategori biaya, saldo awal, kunci bulan, dan jejak audit.
        </p>
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

      {/* Grid: Fee Components & Opening Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Fee Components with Effective Dates */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <span>Komponen Iuran & Tanggal Efektif</span>
            </h3>
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
              Total Standar: Rp 120.000
            </span>
          </div>

          <div className="space-y-3">
            {feeComponents.map((fc) => (
              <div
                key={fc.id}
                className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-extrabold text-stone-900 text-sm block">Iuran {fc.name}</span>
                  <span className="text-stone-500 text-[11px] block mt-0.5">
                    Efektif sejak: {formatTanggal(fc.effective_from)}
                  </span>
                  {fc.description && (
                    <span className="text-stone-400 text-[10px] block mt-0.5">{fc.description}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-orange-600">
                    {formatRupiah(fc.amount)}
                  </span>
                  <span className="block text-[10px] text-stone-500">/ bulan / rumah</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-stone-500 italic">
            Catatan: Besaran iuran dinaikkan dari Rp 100.000 menjadi Rp 120.000 pada Oktober 2025.
          </p>
        </div>

        {/* 2. Opening Balance Settings */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                <span>Saldo Awal Pembukuan (Kas Awal)</span>
              </h3>
            </div>

            <div className="space-y-4 pt-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Nominal Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-black text-sm focus:outline-none focus:border-orange-500"
                />
                <span className="text-stone-500 text-[11px] mt-1 block">
                  Nilai saat ini: {formatRupiah(Number(openingBalance))}
                </span>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Tanggal Efektif Saldo Awal
                </label>
                <input
                  type="date"
                  value={openingBalanceDate}
                  onChange={(e) => setOpeningBalanceDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <button
              type="button"
              onClick={handleSaveOpeningBalance}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm shadow-orange-600/20 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Saldo Awal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expense Categories & Month Locks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <Tag className="w-5 h-5 text-orange-600" />
            <span>Kategori Pengeluaran & Biaya</span>
          </h3>

          <form onSubmit={handleAddCategory} className="flex gap-2 text-xs">
            <input
              type="text"
              placeholder="Nama kategori baru..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-bold text-xs cursor-pointer"
            >
              + Tambah
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((c) => (
              <span
                key={c.id}
                className="px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700"
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>

        {/* Month Lock / Unlock Manager */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <Lock className="w-5 h-5 text-orange-600" />
            <span>Status Kunci Bulan (Month Lock)</span>
          </h3>
          <p className="text-xs text-stone-500">
            Bulan yang terkunci tidak mengizinkan penambahan atau pengubahan transaksi tanpa dibuka terlebih dahulu.
          </p>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {monthLocks.map((ml) => {
              const isLocked = ml.status === 'terkunci';
              return (
                <div
                  key={ml.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-extrabold text-stone-900 text-sm">
                      {formatBulanTahun(ml.year_month)}
                    </span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">
                      {isLocked ? `Dikunci pada saldo ${formatRupiah(ml.closing_balance_at_lock)}` : 'Status: Draft Terbuka'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleMonthLock(ml.year_month, ml.status)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      isLocked
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Buka Kunci</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Kunci Bulan</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Immutable Audit Log Viewer */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <History className="w-5 h-5 text-orange-600" />
              <span>Jejak Audit Sistem (Immutable Audit Log)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Rekaman permanen setiap aksi pembuatan, pengubahan, penguncian, dan impor data.
            </p>
          </div>
          <span className="text-xs text-stone-700 font-bold bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
            {auditLogs.length} Aktivitas Terakhir
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200">
              <tr>
                <th className="px-3 py-2.5">Waktu</th>
                <th className="px-3 py-2.5">User</th>
                <th className="px-3 py-2.5">Aksi</th>
                <th className="px-3 py-2.5">Tipe Entitas</th>
                <th className="px-3 py-2.5">ID Entitas</th>
                <th className="px-3 py-2.5">Rincian Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {auditLogs.slice(0, 30).map((log) => (
                <tr key={log.id} className="hover:bg-stone-50">
                  <td className="px-3 py-2.5 text-stone-500 whitespace-nowrap">
                    {formatTanggal(log.timestamp)} {log.timestamp.slice(11, 16)}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-stone-900">{log.user_name}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        log.action === 'CREATE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.action === 'UPDATE'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : log.action === 'LOCK'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : log.action === 'IMPORT'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-stone-700 font-semibold">{log.entity_type}</td>
                  <td className="px-3 py-2.5 font-mono text-stone-500 text-[11px]">{log.entity_id}</td>
                  <td className="px-3 py-2.5 text-stone-600 truncate max-w-xs text-[11px]" title={log.after_value}>
                    {log.after_value || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
