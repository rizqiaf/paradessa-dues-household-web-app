import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RoleProvider } from '@/context/RoleContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Paradessa Household Dues',
  description: 'Aplikasi Pengelolaan Iuran Warga & Buku Kas Komunitas Paradessa Habitat, Desa Pananjung, Cangkuang, Kab. Bandung',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/images/paradessa-emblem.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Paradessa Household Dues',
  },
};

export const viewport: Viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full bg-[#fbfbfa] dark:bg-[#0f1115]">
      <body className="min-h-full flex flex-col bg-[#fbfbfa] dark:bg-[#0f1115] text-stone-900 dark:text-stone-100 antialiased font-sans transition-colors duration-200">
        <ThemeProvider>
          <LanguageProvider>
            <RoleProvider>
              <Navbar />
              <main className="flex-1 pb-16 sm:pb-12 lg:pb-8">{children}</main>
              <Footer />
            </RoleProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
