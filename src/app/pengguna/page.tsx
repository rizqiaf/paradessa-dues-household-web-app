'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  Home,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  KeyRound,
  AlertCircle,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { formatTanggal } from '@/lib/format';

export default function PenggunaPage() {
  const { user: currentUser, isAdmin } = useRole();
  const [users, setUsers] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal create
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    username: '',
    name: '',
    password: '',
    role: 'warga',
    house_code: '',
    phone: '',
    email: '',
  });

  // Modal edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'warga',
    house_code: '',
    phone: '',
    email: '',
    is_active: true,
    newPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchHouses();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchHouses = async () => {
    try {
      const res = await fetch('/api/houses');
      const json = await res.json();
      if (json.success) setHouses(json.data);
    } catch {
      // ignore
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setMessage(json.message);
        setAddForm({
          username: '',
          name: '',
          password: '',
          role: 'warga',
          house_code: '',
          phone: '',
          email: '',
        });
        fetchUsers();
      } else {
        setError(json.error || 'Gagal menambahkan pengguna.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          role: editForm.role,
          house_code: editForm.house_code,
          phone: editForm.phone,
          email: editForm.email,
          is_active: editForm.is_active,
          password: editForm.newPassword || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowEditModal(false);
        setMessage(json.message);
        fetchUsers();
      } else {
        setError(json.error || 'Gagal memperbarui pengguna.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${u.name}" (${u.username})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMessage(json.message);
        fetchUsers();
      } else {
        setError(json.error || 'Gagal menghapus pengguna.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    }
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      role: u.role,
      house_code: u.house_code || '',
      phone: u.phone || '',
      email: u.email || '',
      is_active: u.is_active,
      newPassword: '',
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.house_code && u.house_code.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-stone-900">Akses Dibatasi</h2>
        <p className="text-xs text-stone-500">
          Halaman manajemen pengguna hanya dapat diakses oleh Bendahara / Admin cluster.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Hak Akses & Pengguna</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Manajemen Akun Pengguna
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Kelola akun Bendahara dan Warga untuk memastikan aplikasi hanya diakses oleh penghuni sah Paradessa Habitat.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-sm shadow-orange-600/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, username, atau nomor blok..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-orange-500 font-bold"
        >
          <option value="ALL">Semua Peran (Role)</option>
          <option value="admin">Admin / Bendahara</option>
          <option value="warga">Warga</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">Nama Pengguna</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Peran (Role)</th>
                <th className="px-4 py-3">Kavling / Blok</th>
                <th className="px-4 py-3">Kontak</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-stone-400">
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-stone-400">
                    Tidak ada pengguna yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-stone-900">{u.name}</div>
                        {isCurrent && (
                          <span className="text-[10px] text-orange-600 font-bold">
                            (Akun Anda Saat Ini)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-stone-700">{u.username}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.role === 'admin'
                              ? 'bg-orange-50 text-orange-800 border-orange-200'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {u.role === 'admin' ? (
                            <>
                              <ShieldCheck className="w-3 h-3 text-orange-600" />
                              <span>Bendahara</span>
                            </>
                          ) : (
                            <>
                              <Home className="w-3 h-3 text-stone-500" />
                              <span>Warga</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.house_code ? (
                          <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px] border border-stone-200">
                            Blok {u.house_code}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">Semua / Pengurus</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-500">
                        {u.phone && <div>{u.phone}</div>}
                        {u.email && <div className="text-[11px] text-stone-400">{u.email}</div>}
                        {!u.phone && !u.email && <span className="text-stone-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {u.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                            title="Edit Pengguna / Reset Password"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-500 transition-colors"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-600" />
                <span>Tambah Pengguna Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: agus_a12"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Peran (Role) *</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value="warga">Warga (Read-Only)</option>
                    <option value="admin">Bendahara (Admin Full)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Agus Setiawan"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              {addForm.role === 'warga' && (
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Blok Rumah Warga</label>
                  <select
                    value={addForm.house_code}
                    onChange={(e) => setAddForm({ ...addForm, house_code: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Pilih Blok Rumah --</option>
                    {houses.map((h) => (
                      <option key={h.code} value={h.code}>
                        Blok {h.code} ({h.currentResident?.name || 'Tanpa Nama'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">No. WhatsApp / Telepon</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Email (Opsional)</label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Password Awal * (Min 6 karakter)</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit User */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">Edit Akun Pengguna</h3>
                <p className="text-xs text-stone-400">Username: @{editingUser.username}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Peran (Role)</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value="warga">Warga</option>
                    <option value="admin">Bendahara (Admin)</option>
                  </select>
                </div>
              </div>

              {editForm.role === 'warga' && (
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Blok Rumah Warga</label>
                  <select
                    value={editForm.house_code}
                    onChange={(e) => setEditForm({ ...editForm, house_code: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Pilih Blok Rumah --</option>
                    {houses.map((h) => (
                      <option key={h.code} value={h.code}>
                        Blok {h.code} ({h.currentResident?.name || 'Tanpa Nama'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userActive"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="userActive" className="text-stone-700 font-bold cursor-pointer">
                  Akun Aktif (Bisa Login ke Aplikasi)
                </label>
              </div>

              {/* Reset Password */}
              <div className="pt-2 border-t border-stone-100">
                <label className="block text-stone-700 font-bold mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                  <span>Reset Password Baru (Kosongkan jika tidak ingin mengubah)</span>
                </label>
                <input
                  type="password"
                  placeholder="Masukkan password baru..."
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Perbarui Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
