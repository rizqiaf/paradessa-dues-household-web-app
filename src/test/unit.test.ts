import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { calculateAutoAllocation } from '../lib/allocation';
import { initSchema } from '../lib/db';
import { getMonthLedger, calculateOpeningBalanceForMonth, getAllLedgerRawItems } from '../lib/ledger';
import { generateMonthlyReportData } from '../lib/monthly-report';

describe('1. Logika Alokasi Pembayaran (Allocation Logic)', () => {
  const subscriptions = [
    { component_name: 'Pokok', amount: 50000 },
    { component_name: 'Air', amount: 20000 },
    { component_name: 'Sampah', amount: 50000 },
  ]; // Total monthly standard = 120.000

  it('mengalokasikan pembayaran tepat 1 bulan ke 3 komponen (Pokok, Air, Sampah)', () => {
    const existingDues = [
      { id: 'due-1', year_month: '2026-03', component_name: 'Pokok', amount: 50000, paid_amount: 0, remaining: 50000 },
      { id: 'due-2', year_month: '2026-03', component_name: 'Air', amount: 20000, paid_amount: 0, remaining: 20000 },
      { id: 'due-3', year_month: '2026-03', component_name: 'Sampah', amount: 50000, paid_amount: 0, remaining: 50000 },
    ];

    const result = calculateAutoAllocation(120000, existingDues, subscriptions, '2026-03');

    expect(result.totalAllocated).toBe(120000);
    expect(result.houseCredit).toBe(0);
    expect(result.allocations.length).toBe(3);
    expect(result.allocations.find((a) => a.component_name === 'Pokok')?.amount).toBe(50000);
    expect(result.allocations.find((a) => a.component_name === 'Air')?.amount).toBe(20000);
    expect(result.allocations.find((a) => a.component_name === 'Sampah')?.amount).toBe(50000);
    expect(result.monthsCovered).toEqual(['2026-03']);
  });

  it('memprioritaskan tunggakan lama sebelum bulan berjalan / masa depan', () => {
    const existingDues = [
      // Tunggakan Jan 2026 (120.000)
      { id: 'd-jan-1', year_month: '2026-01', component_name: 'Pokok', amount: 50000, paid_amount: 0, remaining: 50000 },
      { id: 'd-jan-2', year_month: '2026-01', component_name: 'Air', amount: 20000, paid_amount: 0, remaining: 20000 },
      { id: 'd-jan-3', year_month: '2026-01', component_name: 'Sampah', amount: 50000, paid_amount: 0, remaining: 50000 },
      // Tunggakan Feb 2026 (120.000)
      { id: 'd-feb-1', year_month: '2026-02', component_name: 'Pokok', amount: 50000, paid_amount: 0, remaining: 50000 },
      { id: 'd-feb-2', year_month: '2026-02', component_name: 'Air', amount: 20000, paid_amount: 0, remaining: 20000 },
      { id: 'd-feb-3', year_month: '2026-02', component_name: 'Sampah', amount: 50000, paid_amount: 0, remaining: 50000 },
    ];

    // Warga bayar 150.000: harus melunasi Jan 2026 (120.000) dan mencicil Pokok Feb 2026 (30.000)
    const result = calculateAutoAllocation(150000, existingDues, subscriptions, '2026-02');

    expect(result.totalAllocated).toBe(150000);
    expect(result.houseCredit).toBe(0);
    // Jan lunas (3 alokasi)
    const janAllocs = result.allocations.filter((a) => a.year_month === '2026-01');
    expect(janAllocs.reduce((s, a) => s + a.amount, 0)).toBe(120000);

    // Feb terbayar sebagian (Pokok dapat 30.000)
    const febAllocs = result.allocations.filter((a) => a.year_month === '2026-02');
    expect(febAllocs.reduce((s, a) => s + a.amount, 0)).toBe(30000);
    expect(febAllocs[0].component_name).toBe('Pokok');
    expect(febAllocs[0].amount).toBe(30000);
  });

  it('mendukung pembayaran di muka (prepayment) beberapa bulan ke depan', () => {
    // Tidak ada tunggakan
    const existingDues: any[] = [];
    // Warga bayar 240.000 (2 bulan ke depan: April dan Mei)
    const result = calculateAutoAllocation(240000, existingDues, subscriptions, '2026-03');

    expect(result.totalAllocated).toBe(240000);
    expect(result.houseCredit).toBe(0);
    expect(result.monthsCovered).toEqual(['2026-04', '2026-05']);
    expect(result.allocations.length).toBe(6);
  });

  it('mengalihkan sisa kelebihan pembayaran ke saldo kredit rumah (house credit)', () => {
    // Warga bayar 150.000 untuk tagihan 120.000 (misal Fajar/Rahmat Blok A15 di data Excel)
    const existingDues = [
      { id: 'd-1', year_month: '2025-12', component_name: 'Pokok', amount: 50000, paid_amount: 0, remaining: 50000 },
      { id: 'd-2', year_month: '2025-12', component_name: 'Air', amount: 20000, paid_amount: 0, remaining: 20000 },
      { id: 'd-3', year_month: '2025-12', component_name: 'Sampah', amount: 50000, paid_amount: 0, remaining: 50000 },
    ];

    // Jika tidak diizinkan membuat tagihan masa depan tak terhingga dan ada sisa ganjil
    const result = calculateAutoAllocation(150000, existingDues, [], '2025-12');

    expect(result.totalAllocated).toBe(120000);
    expect(result.houseCredit).toBe(30000);
    expect(result.coverageSummary).toContain('Kelebihan Rp 30.000');
  });
});

describe('2. Carry-over Saldo Antar Bulan & Lintas Tahun (Month-to-Month Carry-Over)', () => {
  let memDb: Database.Database;

  beforeEach(() => {
    memDb = new Database(':memory:');
    initSchema(memDb);
    // Insert test houses
    memDb.prepare(`
      INSERT INTO houses (id, code, block, status, created_at, updated_at)
      VALUES
        ('H-A1', 'A1', 'A', 'dihuni', datetime('now'), datetime('now')),
        ('H-A2', 'A2', 'A', 'dihuni', datetime('now'), datetime('now')),
        ('H-A3', 'A3', 'A', 'dihuni', datetime('now'), datetime('now'))
    `).run();

    // Set opening balance at start
    memDb.prepare(`
      INSERT INTO settings (key, value, description, updated_at)
      VALUES
        ('opening_balance', '1000000', 'Saldo awal', datetime('now')),
        ('opening_balance_date', '2025-11-01', 'Tanggal awal', datetime('now'))
    `).run();

    // Nov 2025: Masuk 500.000, Keluar 200.000 -> Closing Nov = 1.000.000 + 300.000 = 1.300.000
    memDb.prepare(`
      INSERT INTO payments (id, payment_number, date, house_id, house_code, payer_name, amount, created_at, updated_at)
      VALUES ('p-nov', 'PAY-NOV', '2025-11-10', 'H-A1', 'A1', 'Warga A', 500000, '2025-11-10 10:00:00', '2025-11-10 10:00:00')
    `).run();
    memDb.prepare(`
      INSERT INTO expenses (id, expense_number, date, category, description, amount, created_at, updated_at)
      VALUES ('e-nov', 'EXP-NOV', '2025-11-15', 'Listrik', 'Listrik', 200000, '2025-11-15 10:00:00', '2025-11-15 10:00:00')
    `).run();

    // Des 2025: Masuk 400.000, Keluar 100.000 -> Closing Des = 1.300.000 + 300.000 = 1.600.000
    memDb.prepare(`
      INSERT INTO payments (id, payment_number, date, house_id, house_code, payer_name, amount, created_at, updated_at)
      VALUES ('p-des', 'PAY-DES', '2025-12-05', 'H-A2', 'A2', 'Warga B', 400000, '2025-12-05 10:00:00', '2025-12-05 10:00:00')
    `).run();
    memDb.prepare(`
      INSERT INTO expenses (id, expense_number, date, category, description, amount, created_at, updated_at)
      VALUES ('e-des', 'EXP-DES', '2025-12-20', 'Sampah', 'Sampah', 100000, '2025-12-20 10:00:00', '2025-12-20 10:00:00')
    `).run();

    // Jan 2026 (lintas tahun): Masuk 300.000, Keluar 50.000 -> Closing Jan 2026 = 1.600.000 + 250.000 = 1.850.000
    memDb.prepare(`
      INSERT INTO payments (id, payment_number, date, house_id, house_code, payer_name, amount, created_at, updated_at)
      VALUES ('p-jan', 'PAY-JAN', '2026-01-05', 'H-A3', 'A3', 'Warga C', 300000, '2026-01-05 10:00:00', '2026-01-05 10:00:00')
    `).run();
    memDb.prepare(`
      INSERT INTO expenses (id, expense_number, date, category, description, amount, created_at, updated_at)
      VALUES ('e-jan', 'EXP-JAN', '2026-01-10', 'Token', 'Token', 50000, '2026-01-10 10:00:00', '2026-01-10 10:00:00')
    `).run();
  });

  it('membawa saldo akhir November 2025 secara otomatis menjadi saldo awal Desember 2025', () => {
    const nov = getMonthLedger(2025, 11, undefined, memDb);
    expect(nov.opening_balance).toBe(1000000);
    expect(nov.total_masuk).toBe(500000);
    expect(nov.total_keluar).toBe(200000);
    expect(nov.closing_balance).toBe(1300000);

    const des = getMonthLedger(2025, 12, undefined, memDb);
    expect(des.opening_balance).toBe(1300000);
    expect(des.closing_balance).toBe(1600000);
  });

  it('membawa saldo melintasi batas tahun (Desember 2025 -> Januari 2026)', () => {
    const des = getMonthLedger(2025, 12, undefined, memDb);
    const jan = getMonthLedger(2026, 1, undefined, memDb);

    expect(jan.opening_balance).toBe(des.closing_balance);
    expect(jan.opening_balance).toBe(1600000);
    expect(jan.closing_balance).toBe(1850000);
  });
});

describe('3. Rekalkulasi Otomatis Setelah Edit Transaksi Masa Lalu (Past Transaction Recalculation)', () => {
  let memDb: Database.Database;

  beforeEach(() => {
    memDb = new Database(':memory:');
    initSchema(memDb);

    memDb.prepare(`
      INSERT INTO houses (id, code, block, status, created_at, updated_at)
      VALUES ('H-A1', 'A1', 'A', 'dihuni', datetime('now'), datetime('now'))
    `).run();

    memDb.prepare(`
      INSERT INTO settings (key, value, description, updated_at)
      VALUES ('opening_balance', '500000', 'Saldo awal', datetime('now'))
    `).run();

    // Okt 2025
    memDb.prepare(`
      INSERT INTO payments (id, payment_number, date, house_id, house_code, payer_name, amount, created_at, updated_at)
      VALUES ('tx-1', 'PAY-1', '2025-10-10', 'H-A1', 'A1', 'Warga', 200000, '2025-10-10 10:00:00', '2025-10-10 10:00:00')
    `).run();

    // Nov 2025
    memDb.prepare(`
      INSERT INTO payments (id, payment_number, date, house_id, house_code, payer_name, amount, created_at, updated_at)
      VALUES ('tx-2', 'PAY-2', '2025-11-10', 'H-A1', 'A1', 'Warga', 100000, '2025-11-10 10:00:00', '2025-11-10 10:00:00')
    `).run();

    // Des 2025
    memDb.prepare(`
      INSERT INTO payments (id, payment_number, date, house_id, house_code, payer_name, amount, created_at, updated_at)
      VALUES ('tx-3', 'PAY-3', '2025-12-10', 'H-A1', 'A1', 'Warga', 100000, '2025-12-10 10:00:00', '2025-12-10 10:00:00')
    `).run();
  });

  it('memperbarui saldo semua bulan berikutnya secara instan ketika transaksi masa lalu diubah', () => {
    // Kondisi awal:
    // Okt closing: 500k + 200k = 700k
    // Nov opening: 700k, closing: 800k
    // Des opening: 800k, closing: 900k
    expect(getMonthLedger(2025, 10, undefined, memDb).closing_balance).toBe(700000);
    expect(getMonthLedger(2025, 11, undefined, memDb).opening_balance).toBe(700000);
    expect(getMonthLedger(2025, 12, undefined, memDb).closing_balance).toBe(900000);

    // Edit transaksi Oktober: dari 200.000 menjadi 350.000 (+150.000)
    memDb.prepare(`UPDATE payments SET amount = 350000 WHERE id = 'tx-1'`).run();

    // Cek ulang: Oktober closing harus 850k (+150k)
    const oktUpdated = getMonthLedger(2025, 10, undefined, memDb);
    expect(oktUpdated.closing_balance).toBe(850000);

    // November opening harus ikut berubah jadi 850k
    const novUpdated = getMonthLedger(2025, 11, undefined, memDb);
    expect(novUpdated.opening_balance).toBe(850000);
    expect(novUpdated.closing_balance).toBe(950000);

    // Desember opening dan closing juga harus ikut berubah (+150k)
    const desUpdated = getMonthLedger(2025, 12, undefined, memDb);
    expect(desUpdated.opening_balance).toBe(950000);
    expect(desUpdated.closing_balance).toBe(1050000);
  });
});

describe('4. Total & Integritas Laporan Bulanan (Monthly Report Totals)', () => {
  let memDb: Database.Database;

  beforeEach(() => {
    memDb = new Database(':memory:');
    initSchema(memDb);

    memDb.prepare(`
      INSERT INTO houses (id, code, block, status, created_at, updated_at)
      VALUES
        ('H-A1', 'A1', 'A', 'dihuni', datetime('now'), datetime('now')),
        ('H-A3', 'A3', 'A', 'dihuni', datetime('now'), datetime('now'))
    `).run();

    memDb.prepare(`
      INSERT INTO settings (key, value, description, updated_at)
      VALUES ('opening_balance', '2000000', 'Saldo awal', datetime('now'))
    `).run();

    // Pemasukan Sept 2026
    memDb.prepare(`
      INSERT INTO payments (id, payment_number, date, house_id, house_code, payer_name, amount, note, created_at, updated_at)
      VALUES
        ('p-1', 'PAY-1', '2026-09-01', 'H-A1', 'A1', 'Pak Eko', 120000, 'Iuran Sept', datetime('now'), datetime('now')),
        ('p-2', 'PAY-2', '2026-09-02', 'H-A3', 'A3', 'Pak Robi', 240000, 'Iuran 2 bulan: Sep, Okt', datetime('now'), datetime('now'))
    `).run();

    // Pengeluaran Sept 2026
    memDb.prepare(`
      INSERT INTO expenses (id, expense_number, date, category, description, amount, created_at, updated_at)
      VALUES
        ('e-1', 'EXP-1', '2026-09-10', 'Listrik', 'Token Air', 100000, datetime('now'), datetime('now')),
        ('e-2', 'EXP-2', '2026-09-25', 'Sampah', 'Pak Udin', 800000, datetime('now'), datetime('now'))
    `).run();
  });

  it('menghasilkan laporan keuangan yang matematis dan konsisten dengan buku kas', () => {
    const report = generateMonthlyReportData(2026, 9, memDb);

    expect(report.title).toBe('LAPORAN KEUANGAN');
    expect(report.addressHeader).toContain('Jl. Desa Banda Asri');
    expect(report.footerNote).toBe('Paradessa Household Dues');

    expect(report.summary.saldoAwal).toBe(2000000);
    expect(report.totalPemasukan).toBe(360000); // 120k + 240k
    expect(report.totalPengeluaran).toBe(900000); // 100k + 800k
    expect(report.summary.saldoAkhir).toBe(2000000 + 360000 - 900000); // 1.460.000

    expect(report.pemasukanRows.length).toBe(2);
    expect(report.pengeluaranRows.length).toBe(2);
  });
});
