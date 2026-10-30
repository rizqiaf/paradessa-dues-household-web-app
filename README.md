# Paradessa Household Dues

Aplikasi web manajemen iuran bulanan warga dan buku kas komunitas untuk **"Paradessa Habitat"**, perumahan di **Jl. Desa Banda Asri RT.02/RW.09, Desa Pananjung, Kec. Cangkuang, Kab. Bandung, Jawa Barat 40238**.

Aplikasi ini menggantikan buku kerja Excel manual bendahara dengan sistem buku kas kontinyu otomatis, alokasi pembayaran multi-bulan/sebagian, rekap iuran dan sampah, serta laporan keuangan bulanan berformat resmi.

---

## Fitur Utama

### 1. Konsep Inti Alokasi Pembayaran
* Pembayaran uang masuk dicatat independen dari bulan tagihan.
* Sistem otomatis mengalokasikan uang pembayaran:
  1. Prioritas ke tunggakan tertua.
  2. Jika berlebih, dialokasikan ke bulan-bulan masa depan (*prepayment*).
  3. Kelebihan di luar tagihan otomatis masuk ke saldo kredit rumah (*house credit*).
* Preview alokasi dapat ditinjau dan disesuaikan bendahara sebelum disimpan.
* Tombol cepat **"Lunas Bulan Ini"** untuk mempermudah bendahara saat mencatat iuran.

### 2. Buku Kas Kontinyu Dinamis (*Dynamic Ledger*)
* Buku kas terhubung sepanjang waktu tanpa setup lembar tahunan manual.
* Navigasi tahun dan tab 12 bulan (Jan–Des) dengan tombol panah lintas tahun (Des 2025 ↔ Jan 2026).
* Saldo awal otomatis terbawa dari saldo akhir bulan sebelumnya.
* Rekalkulasi otomatis: jika ada transaksi masa lalu yang ditambahkan, diedit, atau dihapus, seluruh saldo bulan berikutnya langsung terbarukan.
* Tampilan 1 Tahun (Tabel 12 baris + visualisasi) & Tampilan Multi-Tahun.
* Filter kategori, blok rumah, jenis masuk/keluar, pencarian teks, serta ekspor Excel dan PDF.

### 3. Matriks Rekap Iuran
* Matriks rumah (baris) × 12 bulan (kolom).
* Status warna interaktif: hijau (*lunas*), kuning (*sebagian*), merah (*belum bayar*), abu-abu (*tidak ikut/kosong*), dan strip (*sebelum serah terima*).
* Klik kotak untuk melihat rincian alokasi dan komponen biaya.
* Kolom tunggakan tahun lalu dan total sisa tagihan.

### 4. Rekap Sampah Warga
* Monitoring bulanan jumlah rumah yang ikut iuran sampah (Rp 50.000).
* Membandingkan kewajiban ke petugas sampah (Pak Udin) dengan pengeluaran aktual yang tercatat.

### 5. Laporan Bulanan Resmi
* Layout presisi sesuai dokumen resmi bendahara:
  * Alamat Paradessa Habitat, judul "LAPORAN KEUANGAN", dan Periode.
  * Tabel berurutan: NO, BULAN, JENIS TRANSAKSI, KETERANGAN, MASUK, KELUAR, SALDO.
  * Subtotal PEMASUKAN dan PENGELUARAN.
  * Ringkasan saldo awal, pemasukan, pengeluaran, saldo akhir.
  * Blok tanda tangan "Ttd Bendahara Paradessa" dan catatan kaki "Paradessa Household Dues".
* Publikasikan laporan untuk mengunci bulan (*Month Lock*).
* Ekspor ke PDF, salin teks, dan tombol **"Bagikan ke WhatsApp"**.

### 6. Rumah & Warga (Occupancy History)
* Manajemen unit rumah, status (dihuni / kosong / kantor), tanggal serah terima, unit gabungan (misal A9 & A10).
* Riwayat penghuni lengkap (misal A7: Yana → Wendy → Eka).
* Surat Tagihan Iuran Warga yang dapat dicetak atau dikirim via WhatsApp.

### 7. Talangan / Kasbon Warga (*Advances*)
* Pencatatan dana talangan fasilitas oleh warga.
* Penggantian dapat dilakukan via tunai/transfer atau kompensasi potong iuran bulanan.

### 8. Alat Impor Excel & Rekonsiliasi
* Impor workbook Excel master (sheet `2026`, `rekapan iuran dari awal`).
* Normalisasi kode rumah otomatis ("Blok A12" → A12, "Blok 38" → B38, "Blok A9&A10" → A9&A10).
* Deteksi baris pengeluaran yang salah kolom (tercatat di kolom Masuk).
* Rekonsiliasi otomatis membandingkan saldo akhir buku kas terhadap laporan bulanan historis.

---

## Teknologi yang Digunakan
* **Framework:** Next.js 14 (App Router) + TypeScript
* **Styling:** Tailwind CSS (Dark Mode modern & mobile-first)
* **Database:** SQLite dengan `better-sqlite3` (WAL mode, foreign keys on, file lokal di `data/paradessa.db`)
* **Icons:** Lucide React
* **Dokumen & Ekspor:** SheetJS (`xlsx`), `jspdf`, `jspdf-autotable`
* **Testing:** Vitest

---

## Cara Menjalankan

### 1. Menjalankan Server Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

### 2. Menjalankan Unit Tests
```bash
npm test
```
Menjalankan 8 pengujian unit untuk:
1. Logika alokasi pembayaran (tepat 1 bulan, tunggakan lama, prepayment, overpayment/house credit).
2. Carry-over saldo antar bulan dan melintasi batas tahun.
3. Rekalkulasi otomatis setelah transaksi masa lalu diedit.
4. Total dan integritas laporan bulanan.

### 3. Build Production
```bash
npm run build
npm start
```

### 4. Database Setup (Turso & Vercel)
Untuk deployment cloud di Vercel:
Tambahkan Environment Variables di **Vercel Project Settings > Environment Variables**:
- `TURSO_DATABASE_URL`: URL database Turso (contoh: `libsql://paradessa-db-rizqi537.aws-ap-southeast-1.turso.io`)
- `TURSO_AUTH_TOKEN`: Token autentikasi database Turso

---

## Akun Pengguna Bawaan (Default Credentials)

Untuk masuk ke aplikasi pada halaman `/login`:

| Peran (Role) | Username / ID | Alternatif (WA / Email) | Password |
| :--- | :--- | :--- | :--- |
| **Bendahara (Admin)** | `bendahara` | `08123456789`<br>`bendahara@paradessa.id` | `paradessa2026` |
| **Warga (Blok A1)** | `warga` | `08129876543`<br>`eko.a1@paradessa.id` | `warga2026` |

Panduan lengkap penggunaan fitur dan alur kerja aplikasi tersedia di [PANDUAN_PENGGUNAAN.md](file:///home/rizqi537/paradessa_habitat_ledge_app/PANDUAN_PENGGUNAAN.md).
