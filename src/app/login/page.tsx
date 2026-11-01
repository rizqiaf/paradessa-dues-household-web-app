'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sun,
  Moon,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFrom = searchParams.get('from') || '/';
  // Sanitize target redirect to avoid redirecting to static assets or api
  const targetUrl =
    rawFrom &&
    !rawFrom.startsWith('/api') &&
    !rawFrom.startsWith('/images') &&
    !rawFrom.startsWith('/login') &&
    !rawFrom.endsWith('.png') &&
    !rawFrom.endsWith('.ico')
      ? rawFrom
      : '/';

  const { login } = useRole();
  const { language, t } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(
        language === 'en'
          ? 'Please enter your username and password.'
          : 'Silakan isi username dan password.'
      );
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(username.trim(), password);
    if (res.success) {
      // Force clean session re-hydration and middleware pass
      window.location.replace(targetUrl);
    } else {
      setError(res.error || (language === 'en' ? 'Sign in failed.' : 'Login gagal.'));
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#161822] border border-stone-200/90 dark:border-stone-800 rounded-3xl p-7 sm:p-8 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] space-y-5 transition-colors">
      <div className="border-b border-stone-100 dark:border-stone-800/80 pb-3">
        <h2 className="text-base font-bold text-stone-900 dark:text-white">
          {language === 'en' ? 'Sign in to Your Account' : 'Masuk ke Akun Anda'}
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          {language === 'en'
            ? 'Only registered residents or committee administrators can access the system.'
            : 'Hanya pengguna terdaftar (Bendahara atau Warga) yang dapat mengakses sistem ini.'}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Username / Phone / Email */}
        <div>
          <label className="block text-stone-700 dark:text-stone-200 font-bold mb-1.5">
            {language === 'en' ? 'Username / WhatsApp Phone / Email' : 'Username / Nomor WhatsApp / Email'}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              autoFocus
              placeholder={language === 'en' ? 'e.g. bendahara or 0812...' : 'Contoh: bendahara atau 0812...'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1e222d] border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-[#252a37] text-xs font-medium transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-stone-700 dark:text-stone-200 font-bold mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder={language === 'en' ? 'Enter your password' : 'Masukkan password Anda'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-50 dark:bg-[#1e222d] border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-[#252a37] text-xs font-medium transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-200 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-orange-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{language === 'en' ? 'Verifying Credentials...' : 'Memverifikasi Akun...'}</span>
            </>
          ) : (
            <>
              <span>{language === 'en' ? 'Sign In' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  const { isDark, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#fbfbfa] dark:bg-[#0c0d12] text-stone-900 dark:text-stone-100 transition-colors duration-200 relative">
      {/* Top Floating Controls: Language & Theme Toggles */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-20">
        <button
          type="button"
          onClick={toggleLanguage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#161822] text-stone-700 dark:text-stone-200 border border-stone-200/90 dark:border-stone-800 text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
          title={language === 'en' ? 'Switch to Indonesia' : 'Switch to English'}
        >
          <Globe className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          <span className="uppercase text-[11px]">{language === 'id' ? 'English (EN)' : 'Indonesia (ID)'}</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white dark:bg-[#161822] text-stone-700 dark:text-stone-200 border border-stone-200/90 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
          title={isDark ? 'Mode Terang' : 'Mode Gelap'}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-500 animate-in spin-in-180 duration-200" />
          ) : (
            <Moon className="w-4 h-4 text-stone-600 animate-in spin-in-180 duration-200" />
          )}
        </button>
      </div>

      <div className="max-w-md w-full space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <div className="p-2 rounded-2xl bg-white dark:bg-[#161822] border border-stone-200/80 dark:border-stone-800 shadow-xs inline-flex items-center justify-center">
              <img
                src="/images/paradessa-logo.png"
                alt="Paradessa Habitat"
                className="h-9 sm:h-11 w-auto object-contain dark:brightness-110"
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
              Paradessa Household Dues
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1">
              {language === 'en'
                ? 'Household Dues & Neighborhood Cash Ledger System'
                : 'Sistem Pengelolaan Iuran Bulanan & Buku Kas Warga'}
            </p>
          </div>
        </div>

        {/* Card Form inside Suspense boundary */}
        <Suspense
          fallback={
            <div className="bg-white dark:bg-[#161822] border border-stone-200/80 dark:border-stone-800 rounded-3xl p-8 text-center text-stone-400 text-xs">
              {language === 'en' ? 'Loading sign-in form...' : 'Memuat formulir login...'}
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Footer Info */}
        <p className="text-center text-[11px] text-stone-400 dark:text-stone-500 leading-relaxed px-4">
          Jl. Desa Banda Asri RT.02/RW.09, Desa Pananjung, Kec. Cangkuang, Kab. Bandung, Jawa Barat 40238
        </p>
      </div>
    </div>
  );
}
