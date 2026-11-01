'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CreditCard,
  Receipt,
  BookOpen,
  CalendarCheck,
  Trash2,
  FileText,
  Building,
  Settings,
  Upload,
  UserCheck,
  Menu,
  X,
  Coins,
  ChevronDown,
  Sparkles,
  Plus,
  Users,
  LogOut,
  User,
  ShieldCheck,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, role, setRole, selectedHouseCode, setSelectedHouseCode, isAdmin, logout } = useRole();
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary desktop navigation links
  const primaryNavItems = [
    { label: t('nav.dashboard'), href: '/', icon: Home },
    { label: t('nav.ledger'), href: '/buku-kas', icon: BookOpen },
    { label: t('nav.dues'), href: '/rekap-iuran', icon: CalendarCheck },
    { label: t('nav.reports'), href: '/laporan', icon: FileText },
    { label: t('nav.houses'), href: '/rumah', icon: Building },
  ];

  // Secondary items placed inside clean dropdown to prevent header wrapping
  const secondaryNavItems = [
    { label: t('nav.users'), href: '/pengguna', icon: Users, desc: t('nav.users_desc') },
    { label: t('nav.garbage'), href: '/rekap-sampah', icon: Trash2, desc: t('nav.garbage_desc') },
    { label: t('nav.advances'), href: '/talangan', icon: Coins, desc: t('nav.advances_desc') },
    { label: t('nav.import'), href: '/import', icon: Upload, desc: t('nav.import_desc') },
    { label: t('nav.settings'), href: '/pengaturan', icon: Settings, desc: t('nav.settings_desc') },
  ];

  const wargaNavItems = [
    { label: t('nav.dashboard'), href: '/', icon: Home },
    { label: `${language === 'en' ? 'House' : 'Iuran Rumah'} Blok ${selectedHouseCode}`, href: `/rumah/${selectedHouseCode}`, icon: Building },
    { label: language === 'en' ? 'Public Reports' : 'Laporan Publik', href: '/laporan', icon: FileText },
    { label: language === 'en' ? 'Resident Ledger' : 'Buku Kas Warga', href: '/buku-kas', icon: BookOpen },
  ];

  const isSecondaryActive = secondaryNavItems.some((item) => pathname === item.href);

  // If on login page, render minimal header
  if (pathname === '/login') {
    return null;
  }

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#12141a]/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] w-full">
        <div className="w-full px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-4">
            {/* Brand Logo & Cluster Name - Ujung Kiri (Far Left) */}
            <Link href="/" prefetch={false} className="flex items-center gap-2 sm:gap-3 min-w-0 group shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-700 p-1 sm:p-1.5 flex items-center justify-center shadow-xs shrink-0 group-hover:border-orange-400 group-hover:shadow-sm transition-all">
                <img
                  src="/images/paradessa-emblem.png"
                  alt="Paradessa Habitat"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex flex-col min-w-0 max-w-[155px] xs:max-w-[200px] sm:max-w-none">
                <span className="font-extrabold text-stone-950 dark:text-white text-xs sm:text-base tracking-tight leading-tight truncate group-hover:text-orange-600 transition-colors">
                  Paradessa Household Dues
                </span>
                <div className="text-[9px] sm:text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 font-medium leading-none mt-0.5">
                  <span className="text-orange-600 dark:text-orange-400 font-bold truncate">Paradessa Habitat</span>
                  <span className="hidden sm:inline w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600 shrink-0"></span>
                  <span className="hidden sm:inline truncate text-stone-400 dark:text-stone-500">Pananjung, Cangkuang</span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 mx-2">
              {isAdmin ? (
                <>
                  {primaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={false}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-sm'
                            : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  {/* Dropdown "Lainnya" for secondary admin tools */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSecondaryActive || dropdownOpen
                          ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold'
                          : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span>{t('nav.more')}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#16181d] rounded-2xl shadow-xl border border-stone-200/90 dark:border-stone-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider border-b border-stone-100 dark:border-stone-800 mb-1">
                          {language === 'en' ? 'Additional Tools & Settings' : 'Alat Tambahan & Pengaturan'}
                        </div>
                        {secondaryNavItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setDropdownOpen(false)}
                              className={`flex items-start gap-3 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ${
                                isActive ? 'bg-orange-50/70 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400' : 'text-stone-700 dark:text-stone-300'
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg mt-0.5 ${isActive ? 'bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-400' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-xs block">{item.label}</span>
                                <span className="text-[11px] text-stone-400 dark:text-stone-500 leading-tight block">{item.desc}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                wargaNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-sm'
                          : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })
              )}
            </nav>

            {/* Right Controls: Theme, Language, Actions, & User Pill */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Language Switch Button (ID / EN) */}
              <button
                type="button"
                onClick={toggleLanguage}
                title={t('lang.switch')}
                className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs border border-stone-200/90 dark:border-stone-700 transition-all cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">{language}</span>
              </button>

              {/* Dark Mode Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? t('theme.toggle_light') : t('theme.toggle_dark')}
                className="p-1.5 sm:p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200/90 dark:border-stone-700 transition-all cursor-pointer"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 animate-in spin-in-180 duration-200" />
                ) : (
                  <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600 dark:text-stone-400 animate-in spin-in-180 duration-200" />
                )}
              </button>

              {/* Quick Transaction Action for Bendahara on Desktop */}
              {isAdmin && (
                <div className="hidden sm:flex items-center gap-1.5 ml-0.5 mr-1">
                  <Link
                    href="/pembayaran"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm shadow-orange-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('nav.pay')}</span>
                  </Link>
                  <Link
                    href="/pengeluaran"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                    <span>{t('nav.expense')}</span>
                  </Link>
                </div>
              )}

              {/* User Account Info & Logout (Desktop / Tablet only; mobile has it in drawer) */}
              {user ? (
                <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 bg-stone-100 dark:bg-stone-800 pl-2 pr-1.5 sm:pl-2.5 sm:pr-1 py-1 rounded-xl border border-stone-200/80 dark:border-stone-700">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-xs">
                    {user.role === 'admin' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    ) : (
                      <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                    <span className="font-bold text-stone-900 dark:text-stone-200 max-w-[65px] sm:max-w-[100px] truncate text-[11px] sm:text-xs">
                      {user.username}
                    </span>
                    {user.house_code && (
                      <span className="hidden sm:inline-block text-[10px] bg-white dark:bg-stone-900 px-1.5 py-0.5 rounded border border-stone-200 dark:border-stone-700 font-bold text-stone-700 dark:text-stone-300">
                        {user.house_code}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    title={t('nav.logout')}
                    className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-white dark:hover:bg-stone-700 transition-colors cursor-pointer ml-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors"
                >
                  Masuk
                </Link>
              )}

              {/* Mobile hamburger menu button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 cursor-pointer transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Full Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/98 dark:bg-[#161822]/98 backdrop-blur-xl border-b border-stone-200 dark:border-stone-800 px-4 pt-3 pb-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto animate-fade-in">
            {/* Quick Settings: Theme & Language on Mobile */}
            <div className="grid grid-cols-2 gap-2 p-2 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border border-stone-200/80 dark:border-stone-800">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs cursor-pointer"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-stone-600" />}
                <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
              </button>
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs cursor-pointer"
              >
                <Globe className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="uppercase">{language === 'id' ? 'English (EN)' : 'Indonesia (ID)'}</span>
              </button>
            </div>

            {/* User Profile on Mobile */}
            {user && (
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-extrabold text-stone-900 dark:text-white">{user.name}</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      @{user.username} {user.house_code ? `• Blok ${user.house_code}` : '• Pengurus'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-[11px] font-bold cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Keluar</span>
                </button>
              </div>
            )}

            {/* Quick Action Buttons on Mobile */}
            {isAdmin && (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/pembayaran"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm shadow-orange-600/20"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>+ Catat Bayar</span>
                </Link>
                <Link
                  href="/pengeluaran"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs border border-stone-200 dark:border-stone-700"
                >
                  <Receipt className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                  <span>+ Pengeluaran</span>
                </Link>
              </div>
            )}

            {/* Navigation Groups */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block px-2 mb-1">
                Menu Utama
              </span>
              {(isAdmin ? primaryNavItems : wargaNavItems).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-extrabold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {isAdmin && (
              <div className="space-y-1 pt-2 border-t border-stone-100 dark:border-stone-800">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block px-2 mb-1">
                  Alat Lainnya & Pengaturan
                </span>
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-extrabold'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-normal">{item.desc}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Floating Bottom Navigation Bar for Mobile */}
      <div className="lg:hidden fixed bottom-2 sm:bottom-3 left-0 right-0 z-40 px-3 max-w-md mx-auto pointer-events-none">
        <div className="bg-white/95 dark:bg-[#16181d]/95 backdrop-blur-xl border border-stone-200/90 dark:border-stone-800 shadow-2xl rounded-2xl flex items-center justify-around py-1.5 sm:py-2 px-1 text-[11px] text-stone-500 dark:text-stone-400 pointer-events-auto">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex flex-col items-center gap-0.5 px-2.5 sm:px-3 py-1 rounded-xl transition-colors ${
              pathname === '/' ? 'text-orange-600 dark:text-orange-400 font-extrabold' : 'hover:text-stone-900 dark:hover:text-stone-200 font-medium'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] sm:text-[11px]">{t('nav.dashboard')}</span>
          </Link>

          <Link
            href="/buku-kas"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex flex-col items-center gap-0.5 px-2.5 sm:px-3 py-1 rounded-xl transition-colors ${
              pathname === '/buku-kas' ? 'text-orange-600 dark:text-orange-400 font-extrabold' : 'hover:text-stone-900 dark:hover:text-stone-200 font-medium'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] sm:text-[11px]">{t('nav.ledger')}</span>
          </Link>

          {/* Quick Pay Center Button */}
          {isAdmin ? (
            <Link
              href="/pembayaran"
              onClick={() => setMobileMenuOpen(false)}
              className="flex flex-col items-center justify-center -mt-5 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-600/35 border-2 border-white dark:border-stone-900 hover:scale-105 active:scale-95 transition-all"
              title="Catat Pembayaran"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </Link>
          ) : null}

          <Link
            href="/rekap-iuran"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex flex-col items-center gap-0.5 px-2.5 sm:px-3 py-1 rounded-xl transition-colors ${
              pathname === '/rekap-iuran' ? 'text-orange-600 dark:text-orange-400 font-extrabold' : 'hover:text-stone-900 dark:hover:text-stone-200 font-medium'
            }`}
          >
            <CalendarCheck className="w-5 h-5" />
            <span className="text-[10px] sm:text-[11px]">{t('nav.dues')}</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center gap-0.5 px-2.5 sm:px-3 py-1 rounded-xl transition-colors cursor-pointer ${
              mobileMenuOpen ? 'text-orange-600 dark:text-orange-400 font-extrabold' : 'hover:text-stone-900 dark:hover:text-stone-200 font-medium'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] sm:text-[11px]">Menu</span>
          </button>
        </div>
      </div>
    </>
  );
}
