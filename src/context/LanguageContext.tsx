'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'id' | 'en';

export const translations: Record<Language, Record<string, string>> = {
  id: {
    // Navigation
    'nav.brand': 'Paradessa Household Dues',
    'nav.sub_cluster': 'Komplek Paradessa • Pananjung Cangkuang',
    'nav.dashboard': 'Beranda',
    'nav.ledger': 'Buku Kas',
    'nav.dues': 'Rekap Iuran',
    'nav.reports': 'Laporan',
    'nav.houses': 'Rumah & Warga',
    'nav.more': 'Menu Lainnya',
    'nav.pay': '+ Catat Bayar',
    'nav.expense': 'Pengeluaran',
    'nav.users': 'Kelola Pengguna',
    'nav.users_desc': 'Manajemen akun bendahara & warga',
    'nav.garbage': 'Rekap Sampah',
    'nav.garbage_desc': 'Iuran & bayar ke Pak Udin',
    'nav.advances': 'Talangan / Kasbon',
    'nav.advances_desc': 'Kompensasi dana warga',
    'nav.import': 'Alat Impor Excel',
    'nav.import_desc': 'Impor & rekonsiliasi master sheet',
    'nav.settings': 'Pengaturan Sistem',
    'nav.settings_desc': 'Tarif, kunci bulan, audit log',
    'nav.logout': 'Keluar',
    'nav.role_admin': 'Bendahara',
    'nav.role_warga': 'Warga',

    // Dashboard
    'dash.badge': 'Paradessa Household Dues',
    'dash.title': 'Buku Kas & Iuran Paradessa Habitat',
    'dash.address': 'Jl. Desa Banda Asri RT.02/RW.09, Desa Pananjung, Kec. Cangkuang, Kab. Bandung 40238',
    'dash.btn_pay': '+ Catat Pembayaran',
    'dash.btn_expense': 'Catat Pengeluaran',
    'dash.balance': 'SALDO KAS SAAT INI',
    'dash.opening': 'Saldo Awal Bulan',
    'dash.income': 'PEMASUKAN',
    'dash.income_sub': 'Iuran warga & kas masuk',
    'dash.expense': 'PENGELUARAN',
    'dash.expense_sub': 'Listrik, sampah, perbaikan',
    'dash.rate': 'TINGKAT PENAGIHAN',
    'dash.houses_unit': 'rumah',
    'dash.chart_title': 'Tren Arus Kas 12 Bulan (2026)',
    'dash.chart_sub': 'Perbandingan pemasukan vs pengeluaran per bulan',
    'dash.in': 'Masuk',
    'dash.out': 'Keluar',
    'dash.arrears_title': 'Daftar Tunggakan Iuran',
    'dash.all_paid': 'Semua Iuran Lunas!',
    'dash.no_arrears': 'Tidak ada tunggakan iuran tercatat.',
    'dash.source_info': 'Data bersumber dari buku kas kontinyu Paradessa.',
    'dash.view_ledger': 'Buka Buku Kas Lengkap',
    'dash.view_matrix': 'Buka Matriks Rekap Iuran Lengkap',

    // Footer
    'footer.desc': 'Sistem pencatatan iuran bulanan dan buku kas digital kontinyu untuk transparansi keuangan paguyuban warga yang akuntabel dan berkelanjutan.',
    'footer.main_menu': 'Menu Utama',
    'footer.admin_kas': 'Administrasi Kas',
    'footer.pay_dues': '+ Catat Penerimaan Iuran',
    'footer.pay_expense': '+ Catat Pengeluaran Kas',
    'footer.garbage_summary': 'Rekap Retribusi Sampah',
    'footer.advances': 'Pencatatan Talangan Warga',
    'footer.system_settings': 'Pengaturan Tarif & Sistem',
    'footer.board': 'Pengurus Paguyuban',
    'footer.bendahara_title': 'Bendahara Kas Paradessa',
    'footer.pengurus_title': 'Pengurus Paguyuban',
    'footer.db_connected': 'Database Terhubung: Turso Cloud LibSQL',
    'footer.rights': 'Paguyuban Warga Paradessa Habitat. Hak cipta dilindungi undang-undang.',
    'footer.transparency': 'Transparansi Kas RT.02/RW.09 Pananjung',

    // Theme & Lang
    'lang.switch': 'English',
    'theme.toggle_dark': 'Beralih ke Mode Gelap',
    'theme.toggle_light': 'Beralih ke Mode Terang',
  },
  en: {
    // Navigation
    'nav.brand': 'Paradessa Household Dues',
    'nav.sub_cluster': 'Paradessa Complex • Pananjung Cangkuang',
    'nav.dashboard': 'Dashboard',
    'nav.ledger': 'Cash Ledger',
    'nav.dues': 'Dues Summary',
    'nav.reports': 'Reports',
    'nav.houses': 'Houses & Residents',
    'nav.more': 'More Menu',
    'nav.pay': '+ Record Payment',
    'nav.expense': 'Expense',
    'nav.users': 'User Management',
    'nav.users_desc': 'Manage treasurer & resident accounts',
    'nav.garbage': 'Garbage Dues',
    'nav.garbage_desc': 'Dues & payments to waste collector',
    'nav.advances': 'Advances / Cash Advances',
    'nav.advances_desc': 'Resident fund reimbursements',
    'nav.import': 'Excel Import Tool',
    'nav.import_desc': 'Import & reconcile master sheet',
    'nav.settings': 'System Settings',
    'nav.settings_desc': 'Tariffs, month lock, audit log',
    'nav.logout': 'Sign Out',
    'nav.role_admin': 'Treasurer',
    'nav.role_warga': 'Resident',

    // Dashboard
    'dash.badge': 'Paradessa Household Dues',
    'dash.title': 'Paradessa Habitat Cash & Dues Ledger',
    'dash.address': 'Jl. Desa Banda Asri RT.02/RW.09, Pananjung, Cangkuang, Bandung 40238',
    'dash.btn_pay': '+ Record Payment',
    'dash.btn_expense': 'Record Expense',
    'dash.balance': 'CURRENT CASH BALANCE',
    'dash.opening': 'Opening Balance',
    'dash.income': 'INCOME',
    'dash.income_sub': 'Resident dues & cash receipts',
    'dash.expense': 'EXPENSES',
    'dash.expense_sub': 'Electricity, garbage, repairs',
    'dash.rate': 'COLLECTION RATE',
    'dash.houses_unit': 'houses',
    'dash.chart_title': '12-Month Cash Flow Trend (2026)',
    'dash.chart_sub': 'Comparison of income vs expenses per month',
    'dash.in': 'Income',
    'dash.out': 'Expense',
    'dash.arrears_title': 'Dues Arrears List',
    'dash.all_paid': 'All Dues Paid!',
    'dash.no_arrears': 'No outstanding dues recorded.',
    'dash.source_info': 'Data sourced from continuous cash ledger of Paradessa.',
    'dash.view_ledger': 'Open Full Cash Ledger',
    'dash.view_matrix': 'Open Dues Summary Matrix',

    // Footer
    'footer.desc': 'Digital continuous cash ledger and dues management system for accountable and sustainable neighborhood financial transparency.',
    'footer.main_menu': 'Main Menu',
    'footer.admin_kas': 'Cash Administration',
    'footer.pay_dues': '+ Record Dues Payment',
    'footer.pay_expense': '+ Record Expense',
    'footer.garbage_summary': 'Garbage Retribution Summary',
    'footer.advances': 'Resident Cash Advances',
    'footer.system_settings': 'Tariff & System Settings',
    'footer.board': 'Neighborhood Board',
    'footer.bendahara_title': 'Paradessa Treasurer',
    'footer.pengurus_title': 'Neighborhood Officer',
    'footer.db_connected': 'Connected Database: Turso Cloud LibSQL',
    'footer.rights': 'Paradessa Habitat Residents Association. All rights reserved.',
    'footer.transparency': 'Cash Transparency RT.02/RW.09 Pananjung',

    // Theme & Lang
    'lang.switch': 'Bahasa Indonesia',
    'theme.toggle_dark': 'Switch to Dark Mode',
    'theme.toggle_light': 'Switch to Light Mode',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    const saved = localStorage.getItem('paradessa_language') as Language | null;
    if (saved === 'id' || saved === 'en') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('paradessa_language', lang);
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === 'id' ? 'en' : 'id';
    setLanguage(nextLang);
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[language] || translations.id;
    if (dict[key]) return dict[key];
    const fallbackDict = translations.id;
    if (fallbackDict[key]) return fallbackDict[key];
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

