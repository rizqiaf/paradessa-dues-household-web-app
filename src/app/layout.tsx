import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RoleProvider } from '@/context/RoleContext';
import Navbar from '@/components/Navbar';

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
    <html lang="id" className="h-full bg-[#fbfbfa]">
      <body className="min-h-full flex flex-col bg-[#fbfbfa] text-stone-900 antialiased font-sans">
        <RoleProvider>
          <Navbar />
          <main className="flex-1 pb-28 sm:pb-24 lg:pb-10">{children}</main>
        </RoleProvider>
      </body>
    </html>
  );
}
