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
  Phone,
  MapPin,
  Heart,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on login page
  if (pathname === '/login') {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-stone-200/90 bg-white/90 backdrop-blur-xs text-stone-600 text-xs">
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: Brand & Cluster Info */}
          <div className="space-y-3.5 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200/80 p-1.5 flex items-center justify-center shrink-0 group-hover:border-orange-400 transition-colors">
                <img
                  src="/images/paradessa-emblem.png"
                  alt="Paradessa Habitat"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-black text-stone-900 text-sm tracking-tight leading-tight block group-hover:text-orange-600 transition-colors">
                  Paradessa Household Dues
                </span>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
                  Paradessa Habitat
                </span>
              </div>
            </Link>

            <p className="text-stone-500 text-xs leading-relaxed font-normal">
              Sistem pencatatan iuran bulanan dan buku kas digital kontinyu untuk transparansi keuangan paguyuban warga yang akuntabel dan berkelanjutan.
            </p>

            <div className="pt-1 flex items-start gap-2 text-[11px] text-stone-500">
              <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
              <span>
                Jl. Desa Banda Asri RT.02/RW.09, Desa Pananjung, Kec. Cangkuang, Kab. Bandung, Jawa Barat 40238
              </span>
            </div>
          </div>

          {/* Column 2: Navigasi Menu */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Menu Utama</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="text-stone-600 hover:text-orange-600 transition-colors flex items-center gap-1.5 font-medium">
                  <Home className="w-3.5 h-3.5 text-stone-400" />
                  <span>Beranda (Dashboard)</span>
                </Link>
              </li>
              <li>
                <Link href="/buku-kas" className="text-stone-600 hover:text-orange-600 transition-colors flex items-center gap-1.5 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                  <span>Buku Kas Kontinyu</span>
                </Link>
              </li>
              <li>
                <Link href="/rekap-iuran" className="text-stone-600 hover:text-orange-600 transition-colors flex items-center gap-1.5 font-medium">
                  <CalendarCheck className="w-3.5 h-3.5 text-stone-400" />
                  <span>Matriks Rekap Iuran</span>
                </Link>
              </li>
              <li>
                <Link href="/laporan" className="text-stone-600 hover:text-orange-600 transition-colors flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  <span>Laporan Kas Bulanan</span>
                </Link>
              </li>
              <li>
                <Link href="/rumah" className="text-stone-600 hover:text-orange-600 transition-colors flex items-center gap-1.5 font-medium">
                  <Building className="w-3.5 h-3.5 text-stone-400" />
                  <span>Katalog Rumah & Warga</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Transaksi & Pengelolaan */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-orange-600" />
              <span>Administrasi Kas</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/pembayaran" className="text-stone-600 hover:text-orange-600 transition-colors font-medium">
                  + Catat Penerimaan Iuran
                </Link>
              </li>
              <li>
                <Link href="/pengeluaran" className="text-stone-600 hover:text-orange-600 transition-colors font-medium">
                  + Catat Pengeluaran Kas
                </Link>
              </li>
              <li>
                <Link href="/rekap-sampah" className="text-stone-600 hover:text-orange-600 transition-colors font-medium">
                  Rekap Retribusi Sampah
                </Link>
              </li>
              <li>
                <Link href="/talangan" className="text-stone-600 hover:text-orange-600 transition-colors font-medium">
                  Pencatatan Talangan Warga
                </Link>
              </li>
              <li>
                <Link href="/pengaturan" className="text-stone-600 hover:text-orange-600 transition-colors font-medium">
                  Pengaturan Tarif & Sistem
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Pengurus & Info Lingkungan */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              <span>Pengurus Paguyuban</span>
            </h4>
            <div className="space-y-2 text-[11px] text-stone-500 font-medium">
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 space-y-1">
                <span className="font-bold text-stone-900 block text-xs">
                  Rizqi Ahmad Fauzi
                </span>
                <span className="text-orange-600 font-bold block text-[10px] uppercase">
                  Bendahara Kas Paradessa
                </span>
                <span className="text-stone-500 block">
                  Unit: Blok A18
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-stone-500 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Database Terhubung: Turso Cloud LibSQL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Credit */}
        <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-400">
          <p>© {currentYear} Paguyuban Warga Paradessa Habitat. Hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-bold text-[10px]">
              v1.2.0 • Production
            </span>
            <span>•</span>
            <span className="text-stone-500 font-medium">
              Transparansi Kas RT.02/RW.09 Pananjung
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

