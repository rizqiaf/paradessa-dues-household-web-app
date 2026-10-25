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
} from 'lucide-react';
import { useRole } from '@/context/RoleContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, role, setRole, selectedHouseCode, setSelectedHouseCode, isAdmin, logout } = useRole();
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
    { label: 'Beranda', href: '/', icon: Home },
    { label: 'Buku Kas', href: '/buku-kas', icon: BookOpen },
    { label: 'Rekap Iuran', href: '/rekap-iuran', icon: CalendarCheck },
    { label: 'Laporan', href: '/laporan', icon: FileText },
    { label: 'Rumah & Warga', href: '/rumah', icon: Building },
  ];

  // Secondary items placed inside clean dropdown to prevent header wrapping
  const secondaryNavItems = [
    { label: 'Kelola Pengguna', href: '/pengguna', icon: Users, desc: 'Manajemen akun bendahara & warga' },
    { label: 'Rekap Sampah', href: '/rekap-sampah', icon: Trash2, desc: 'Iuran & bayar ke Pak Udin' },
    { label: 'Talangan / Kasbon', href: '/talangan', icon: Coins, desc: 'Kompensasi dana warga' },
    { label: 'Alat Impor Excel', href: '/import', icon: Upload, desc: 'Impor & rekonsiliasi master sheet' },
    { label: 'Pengaturan Sistem', href: '/pengaturan', icon: Settings, desc: 'Tarif, kunci bulan, audit log' },
  ];

  const wargaNavItems = [
    { label: 'Beranda', href: '/', icon: Home },
    { label: `Iuran Rumah Blok ${selectedHouseCode}`, href: `/rumah/${selectedHouseCode}`, icon: Building },
    { label: 'Laporan Publik', href: '/laporan', icon: FileText },
    { label: 'Buku Kas Warga', href: '/buku-kas', icon: BookOpen },
  ];

  const isSecondaryActive = secondaryNavItems.some((item) => pathname === item.href);

  // If on login page, render minimal header
  if (pathname === '/login') {
    return null;
  }

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Brand Logo & Cluster Name */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-stone-950 text-base tracking-tight leading-snug group-hover:text-orange-600 transition-colors">
                  Paradessa Household Dues
                </span>
                <div className="text-[11px] text-stone-500 flex items-center gap-1.5 font-medium leading-tight">
                  <span className="text-orange-600 font-semibold">Paradessa Habitat</span>
                  <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                  <span className="truncate max-w-[150px] sm:max-w-none">Pananjung, Cangkuang</span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {isAdmin ? (
                <>
                  {primaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-orange-50 text-orange-600 shadow-sm'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
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
                          ? 'bg-orange-50 text-orange-600 font-bold'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                    >
                      <span>Menu Lainnya</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 mb-1">
                          Alat Tambahan & Pengaturan
                        </div>
                        {secondaryNavItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setDropdownOpen(false)}
                              className={`flex items-start gap-3 px-3 py-2 hover:bg-stone-50 transition-colors ${
                                isActive ? 'bg-orange-50/70 text-orange-600' : 'text-stone-700'
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg mt-0.5 ${isActive ? 'bg-orange-100 text-orange-600' : 'bg-stone-100 text-stone-600'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-xs block">{item.label}</span>
                                <span className="text-[11px] text-stone-400 leading-tight block">{item.desc}</span>
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
                          ? 'bg-orange-50 text-orange-600 shadow-sm'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })
              )}
            </nav>

            {/* Right Controls: User Pill & Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Quick Transaction Action for Bendahara on Desktop */}
              {isAdmin && (
                <div className="hidden sm:flex items-center gap-1.5 mr-1">
                  <Link
                    href="/pembayaran"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm shadow-orange-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Catat Bayar</span>
                  </Link>
                  <Link
                    href="/pengeluaran"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs border border-stone-200 transition-colors cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-stone-500" />
                    <span>Pengeluaran</span>
                  </Link>
                </div>
              )}

              {/* User Account Info & Logout */}
              {user ? (
                <div className="flex items-center gap-1.5 bg-stone-100 pl-2.5 pr-1 py-1 rounded-xl border border-stone-200/80">
                  <div className="flex items-center gap-1.5 text-xs">
                    {user.role === 'admin' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                    ) : (
                      <Home className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span className="font-extrabold text-stone-900 max-w-[100px] truncate">
                      {user.username}
                    </span>
                    {user.house_code && (
                      <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-stone-200 font-bold text-stone-700">
                        {user.house_code}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    title="Keluar (Logout)"
                    className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer ml-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors"
                >
                  Masuk
                </Link>
              )}

              {/* Mobile hamburger menu button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200 cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Full Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/98 backdrop-blur-xl border-b border-stone-200 px-4 pt-3 pb-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto animate-fade-in">
            {/* User Profile on Mobile */}
            {user && (
              <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-extrabold text-stone-900">{user.name}</div>
                    <div className="text-[11px] text-stone-500">
                      @{user.username} {user.house_code ? `• Blok ${user.house_code}` : '• Pengurus'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold"
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
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-200"
                >
                  <Receipt className="w-4 h-4 text-stone-600" />
                  <span>+ Pengeluaran</span>
                </Link>
              </div>
            )}

            {/* Navigation Groups */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block px-2 mb-1">
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
                        ? 'bg-orange-50 text-orange-600 font-extrabold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {isAdmin && (
              <div className="space-y-1 pt-2 border-t border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block px-2 mb-1">
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
                          ? 'bg-orange-50 text-orange-600 font-extrabold'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-stone-500" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-normal">{item.desc}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Floating Bottom Navigation Bar for Mobile */}
      <div className="lg:hidden fixed bottom-3 left-0 right-0 z-40 px-3 max-w-md mx-auto pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-2xl rounded-2xl flex items-center justify-around py-2 px-1 text-[11px] text-stone-500 pointer-events-auto">
          <Link
            href="/"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              pathname === '/' ? 'text-orange-600 font-bold' : 'hover:text-stone-900'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Beranda</span>
          </Link>

          <Link
            href="/buku-kas"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              pathname === '/buku-kas' ? 'text-orange-600 font-bold' : 'hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Buku Kas</span>
          </Link>

          {/* Quick Pay Center Button */}
          {isAdmin ? (
            <Link
              href="/pembayaran"
              className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-600/35 border-2 border-white hover:scale-105 active:scale-95 transition-all"
              title="Catat Pembayaran"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </Link>
          ) : null}

          <Link
            href="/rekap-iuran"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              pathname === '/rekap-iuran' ? 'text-orange-600 font-bold' : 'hover:text-stone-900'
            }`}
          >
            <CalendarCheck className="w-5 h-5" />
            <span>Rekap</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors cursor-pointer ${
              mobileMenuOpen ? 'text-orange-600 font-bold' : 'hover:text-stone-900'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span>Menu</span>
          </button>
        </div>
      </div>
    </>
  );
}
