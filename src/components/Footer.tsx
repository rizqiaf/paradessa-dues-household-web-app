'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building,
  BookOpen,
  CalendarCheck,
  FileText,
  Home,
  ShieldCheck,
  CreditCard,
  MapPin,
  Sparkles,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

export default function Footer() {
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();

  // Hide footer on login page
  if (pathname === '/login') {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-stone-200/90 dark:border-stone-800 bg-white/90 dark:bg-[#12141a]/95 backdrop-blur-xs text-stone-600 dark:text-stone-400 text-xs transition-colors duration-200">
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: Brand & Cluster Info */}
          <div className="space-y-3.5 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/80 p-1.5 flex items-center justify-center shrink-0 group-hover:border-orange-400 transition-colors">
                <img
                  src="/images/paradessa-emblem.png"
                  alt="Paradessa Habitat"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight block group-hover:text-orange-600 transition-colors">
                  Paradessa Household Dues
                </span>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
                  Paradessa Habitat
                </span>
              </div>
            </Link>

            <p className="text-stone-500 dark:text-stone-400 text-xs leading-relaxed font-normal">
              {t('footer.desc')}
            </p>

            <div className="pt-1 flex items-start gap-2 text-[11px] text-stone-500 dark:text-stone-400">
              <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
              <span>
                Jl. Desa Banda Asri RT.02/RW.09, Desa Pananjung, Kec. Cangkuang, Kab. Bandung, Jawa Barat 40238
              </span>
            </div>
          </div>

          {/* Column 2: Navigasi Menu */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>{t('footer.main_menu')}</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1.5 font-medium">
                  <Home className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t('nav.dashboard')}</span>
                </Link>
              </li>
              <li>
                <Link href="/buku-kas" className="text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1.5 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t('nav.ledger')}</span>
                </Link>
              </li>
              <li>
                <Link href="/rekap-iuran" className="text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1.5 font-medium">
                  <CalendarCheck className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t('nav.dues')}</span>
                </Link>
              </li>
              <li>
                <Link href="/laporan" className="text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t('nav.reports')}</span>
                </Link>
              </li>
              <li>
                <Link href="/rumah" className="text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1.5 font-medium">
                  <Building className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t('nav.houses')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Transaksi & Pengelolaan */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-orange-600" />
              <span>{t('footer.admin_kas')}</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/pembayaran" className="text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium">
                  {t('footer.pay_dues')}
                </Link>
              </li>
              <li>
                <Link href="/pengeluaran" className="text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium">
                  {t('footer.pay_expense')}
                </Link>
              </li>
              <li>
                <Link href="/rekap-sampah" className="text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium">
                  {t('footer.garbage_summary')}
                </Link>
              </li>
              <li>
                <Link href="/talangan" className="text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium">
                  {t('footer.advances')}
                </Link>
              </li>
              <li>
                <Link href="/pengaturan" className="text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium">
                  {t('footer.system_settings')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Pengurus & Info Lingkungan */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              <span>{t('footer.board')}</span>
            </h4>
            <div className="space-y-2 text-[11px] text-stone-500 font-medium">
              {/* Pengurus 1: Rizqi Ahmad Fauzi */}
              <div className="p-2 rounded-xl bg-stone-50/90 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 space-y-0.5 hover:border-orange-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 dark:text-white text-xs">
                    Rizqi Ahmad Fauzi
                  </span>
                  <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 bg-orange-100/70 dark:bg-orange-950/70 px-1.5 py-0.5 rounded">
                    Blok A18
                  </span>
                </div>
                <span className="text-orange-600 dark:text-orange-400 font-bold block text-[10px] uppercase tracking-wider">
                  {t('footer.bendahara_title')}
                </span>
              </div>

              {/* Pengurus 2: Yanwar Yusuf Rukmana */}
              <div className="p-2 rounded-xl bg-stone-50/90 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 space-y-0.5 hover:border-orange-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 dark:text-white text-xs">
                    Yanwar Yusuf Rukmana
                  </span>
                  <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300 bg-stone-200/70 dark:bg-stone-700/70 px-1.5 py-0.5 rounded">
                    Blok A5
                  </span>
                </div>
                <span className="text-stone-600 dark:text-stone-400 font-semibold block text-[10px] uppercase tracking-wider">
                  {t('footer.pengurus_title')}
                </span>
              </div>

              {/* Pengurus 3: Eko Agung Prabowo */}
              <div className="p-2 rounded-xl bg-stone-50/90 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/70 space-y-0.5 hover:border-orange-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 dark:text-white text-xs">
                    Eko Agung Prabowo
                  </span>
                  <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300 bg-stone-200/70 dark:bg-stone-700/70 px-1.5 py-0.5 rounded">
                    Blok A1
                  </span>
                </div>
                <span className="text-stone-600 dark:text-stone-400 font-semibold block text-[10px] uppercase tracking-wider">
                  {t('footer.pengurus_title')}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="text-[10px]">{t('footer.db_connected')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Credit & Quick Switchers */}
        <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-400 dark:text-stone-500">
          <p>© {currentYear} {t('footer.rights')}</p>
          <div className="flex items-center gap-3">
            {/* Quick Switchers in Footer */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="hover:text-orange-600 transition-colors flex items-center gap-1 font-bold"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'id' ? 'English (EN)' : 'Bahasa Indonesia (ID)'}</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="hover:text-orange-600 transition-colors flex items-center gap-1 font-bold"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold text-[10px]">
              v1.3.0 • Production
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

