'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Home,
} from 'lucide-react';
import { useRole } from '@/context/RoleContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get('from') || '/';
  const { login } = useRole();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Silakan isi username dan password.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(username.trim(), password);
    if (res.success) {
      router.push(fromUrl);
      router.refresh();
    } else {
      setError(res.error || 'Login gagal.');
      setLoading(false);
    }
  };

  const handleFillDemo = (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
    setError('');
  };

  return (
    <div className="bg-white border border-stone-200/80 rounded-3xl p-7 sm:p-8 shadow-sm space-y-5">
      <div className="border-b border-stone-100 pb-3">
        <h2 className="text-base font-bold text-stone-900">Masuk ke Akun Anda</h2>
        <p className="text-xs text-stone-400 mt-0.5">
          Hanya pengguna terdaftar (Bendahara atau Warga) yang dapat mengakses sistem ini.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Username / Phone / Email */}
        <div>
          <label className="block text-stone-700 font-bold mb-1.5">
            Username / Nomor WhatsApp / Email
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              autoFocus
              placeholder="Contoh: bendahara atau 0812..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white text-xs font-medium transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-stone-700 font-bold mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Masukkan password Anda"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white text-xs font-medium transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Memverifikasi Akun...</span>
            </>
          ) : (
            <>
              <span>Masuk ke Sistem</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Credentials */}
      <div className="pt-4 border-t border-stone-100 space-y-2.5">
        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
          Pilihan Akun Cepat (Testing):
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleFillDemo('bendahara', 'paradessa2026')}
            className="p-2.5 rounded-xl bg-stone-50 hover:bg-orange-50/60 border border-stone-200 hover:border-orange-300 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-stone-900 font-bold text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              <span>Bendahara</span>
            </div>
            <span className="text-[10px] text-stone-500 block mt-0.5">Admin (Full Akses)</span>
          </button>

          <button
            type="button"
            onClick={() => handleFillDemo('warga', 'warga2026')}
            className="p-2.5 rounded-xl bg-stone-50 hover:bg-orange-50/60 border border-stone-200 hover:border-orange-300 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-stone-900 font-bold text-xs">
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              <span>Warga (A1)</span>
            </div>
            <span className="text-[10px] text-stone-500 block mt-0.5">Warga (Read-Only)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#fbfbfa]">
      <div className="max-w-md w-full space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-600 text-white shadow-md shadow-orange-600/20 mb-2">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Paradessa Household Dues
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
            Sistem Pengelolaan Iuran Bulanan & Buku Kas Warga Paradessa Habitat
          </p>
        </div>

        {/* Card Form inside Suspense boundary */}
        <Suspense fallback={
          <div className="bg-white border border-stone-200/80 rounded-3xl p-8 text-center text-stone-400 text-xs">
            Memuat formulir login...
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* Footer Info */}
        <p className="text-center text-[11px] text-stone-400">
          Jl. Desa Banda Asri RT.02/RW.09, Desa Pananjung, Kec. Cangkuang, Kab. Bandung, Jawa Barat 40238
        </p>
      </div>
    </div>
  );
}
