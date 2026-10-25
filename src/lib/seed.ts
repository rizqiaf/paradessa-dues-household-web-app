import path from 'path';
import fs from 'fs';
import { getDb, initSchema } from './db';
import { importExcelWorkbook } from './importer';

export function runSeed(force = false) {
  const db = getDb();
  initSchema(db);

  const housesCount = (db.prepare('SELECT count(*) as count FROM houses').get() as any).count;
  if (housesCount > 0 && !force) {
    return { status: 'already_seeded', housesCount };
  }

  // Clear existing if force
  if (force) {
    db.exec(`
      DELETE FROM payment_allocations;
      DELETE FROM payments;
      DELETE FROM expenses;
      DELETE FROM other_income;
      DELETE FROM dues;
      DELETE FROM house_subscriptions;
      DELETE FROM house_credits;
      DELETE FROM advance_settlements;
      DELETE FROM advances;
      DELETE FROM residents;
      DELETE FROM houses;
      DELETE FROM fee_components;
      DELETE FROM expense_categories;
      DELETE FROM month_locks;
      DELETE FROM settings;
    `);
  }

  // 1. Settings
  db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, description, updated_at)
    VALUES
      ('opening_balance', '0', 'Saldo awal pembukuan Paradessa Habitat', datetime('now')),
      ('opening_balance_date', '2025-06-01', 'Tanggal awal pembukuan', datetime('now')),
      ('app_name', 'Paradessa Household Dues', 'Nama resmi aplikasi', datetime('now')),
      ('cluster_name', 'Paradessa Habitat', 'Nama cluster perumahan', datetime('now')),
      ('cluster_address', 'Jl. Desa Banda Asri RT.02/RW.09, Desa Pananjung, Kec. Cangkuang, Kab. Bandung, Jawa Barat 40238', 'Alamat resmi', datetime('now')),
      ('bendahara_name', 'Rizqi Ahmad Fauzi', 'Nama Bendahara', datetime('now')),
      ('bendahara_phone', '08123456789', 'Nomor WhatsApp Bendahara', datetime('now'))
  `).run();

  // 2. Fee Components
  db.prepare(`
    INSERT OR REPLACE INTO fee_components (id, name, amount, effective_from, description)
    VALUES
      ('FC-POKOK', 'Pokok', 50000, '2025-10-01', 'Iuran Pokok / Kas Lingkungan RT'),
      ('FC-AIR', 'Air', 20000, '2025-10-01', 'Iuran Perawatan Mesin Air & Pompa Bersama'),
      ('FC-SAMPAH', 'Sampah', 50000, '2025-10-01', 'Iuran Pengangkutan Sampah Mingguan')
  `).run();

  // 3. Default Expense Categories
  const categories = [
    'Token Listrik Mesin Air & Portal',
    'Pengelolaan Sampah (Pak Udin)',
    'Perbaikan/Maintenance',
    'Kebersihan & Potong Rumput',
    'Keamanan (CCTV, portal)',
    'Sosial (jenguk, hampers, THR, donasi)',
    'Biaya Bank',
    'Lain-lain',
  ];

  const insertCat = db.prepare('INSERT OR IGNORE INTO expense_categories (id, name, is_default) VALUES (?, ?, 1)');
  categories.forEach((cat, idx) => {
    insertCat.run(`CAT-${idx + 1}`, cat);
  });

  // 4. Import the real workbook from data/paradessa_existing_workbook.xlsx
  const workbookPath = path.join(process.cwd(), 'data', 'paradessa_existing_workbook.xlsx');
  let importStats = null;
  if (fs.existsSync(workbookPath)) {
    importStats = importExcelWorkbook(workbookPath, true);
  }

  // 5. Seed default month locks based on benchmarks
  const lockedMonths = [
    '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'
  ];
  const insertLock = db.prepare(`
    INSERT OR REPLACE INTO month_locks (id, year_month, status, locked_by, locked_at, closing_balance_at_lock, notes, created_at)
    VALUES (?, ?, 'terkunci', 'Bendahara', datetime('now'), ?, 'Laporan resmi telah dipublikasikan', datetime('now'))
  `);

  for (const ym of lockedMonths) {
    const b = (importStats?.reconciliation || []).find((r) => r.period === ym);
    const closing = b ? b.expectedSaldoAkhir || b.computedSaldoAkhir : null;
    insertLock.run(`LOCK-${ym}`, ym, closing);
  }

  return {
    status: 'seeded',
    importStats,
  };
}
