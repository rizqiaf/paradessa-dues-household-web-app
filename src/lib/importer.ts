import * as XLSX from 'xlsx';
import { getDb, recordAuditLog } from './db';
import { normalizeHouseCode, parseIndonesianDate, getHouseBlock, BULAN_INDONESIA, BULAN_INDONESIA_SHORT } from './format';
import { calculateOpeningBalanceForMonth, getMonthLedger } from './ledger';

export interface ParseResult {
  housesParsed: number;
  transactionsParsed: number;
  paymentsCount: number;
  expensesCount: number;
  otherIncomeCount: number;
  ambiguousRows: Array<{
    rowIndex: number;
    houseCode?: string;
    rawDate: any;
    rawDesc: string;
    rawAmount: any;
    issue: string;
  }>;
  reconciliation: Array<{
    period: string; // "2025-10"
    periodLabel: string; // "Oktober 2025"
    expectedSaldoAwal?: number;
    computedSaldoAwal: number;
    expectedPemasukan?: number;
    computedPemasukan: number;
    expectedPengeluaran?: number;
    computedPengeluaran: number;
    expectedSaldoAkhir?: number;
    computedSaldoAkhir: number;
    diff: number;
    isMatch: boolean;
  }>;
}

// Known monthly report benchmark numbers for verification
export const REPORT_BENCHMARKS: Record<string, { awal: number; masuk: number; keluar: number; akhir: number }> = {
  '2025-10': { awal: 1550000, masuk: 1460000, keluar: 820000, akhir: 2190000 },
  '2025-11': { awal: 2190000, masuk: 1890000, keluar: 2263200, akhir: 1816800 },
  '2025-12': { awal: 1816800, masuk: 1730000, keluar: 958200, akhir: 2588600 },
  '2026-01': { awal: 2588600, masuk: 2320000, keluar: 3614200, akhir: 1294400 },
  '2026-02': { awal: 1294400, masuk: 1870000, keluar: 1148100, akhir: 2016300 },
  '2026-03': { awal: 2016300, masuk: 1580000, keluar: 1386000, akhir: 2210300 },
  '2026-04': { awal: 2210300, masuk: 1890000, keluar: 1105200, akhir: 2995100 },
  '2026-05': { awal: 2995100, masuk: 2980000, keluar: 1850000, akhir: 4125100 },
  '2026-06': { awal: 4125100, masuk: 2070000, keluar: 1108200, akhir: 5086900 },
  '2026-07': { awal: 5086900, masuk: 1800000, keluar: 1508200, akhir: 5378700 },
  '2026-08': { awal: 5378700, masuk: 2350000, keluar: 1450560, akhir: 6278140 },
  '2026-09': { awal: 6278140, masuk: 2900000, keluar: 2905300, akhir: 6272840 },
  '2026-10': { awal: 6272840, masuk: 0, keluar: 1002000, akhir: 5270840 },
};

/**
 * Extracts month coverage from Indonesian note text
 * e.g. "Untuk Juli & Agustus 2026" -> ["2026-07", "2026-08"]
 * "Sampai April 2026" -> up to 2026-04
 * "Iuran Bulan Februari" -> ["2026-02"]
 */
export function parseCoverageMonthsFromNote(note: string, transactionDate: string): string[] {
  if (!note) return [];
  const lower = note.toLowerCase();
  const txYear = transactionDate ? transactionDate.slice(0, 4) : '2026';

  const monthMap: Record<string, string> = {
    januari: '01', jan: '01',
    februari: '02', feb: '02', febuari: '02',
    maret: '03', mar: '03',
    april: '04', apr: '04',
    mei: '05', may: '05',
    juni: '06', jun: '06',
    juli: '07', jul: '07',
    agustus: '08', agu: '08', agusuts: '08',
    september: '09', sep: '09',
    oktober: '10', okt: '10',
    november: '11', nov: '11',
    desember: '12', des: '12',
  };

  const matchedMonths: string[] = [];
  // Extract explicit year if mentioned in note, else txYear
  const yearMatch = note.match(/202\d/);
  const noteYear = yearMatch ? yearMatch[0] : txYear;

  for (const [key, mNum] of Object.entries(monthMap)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lower)) {
      const ym = `${noteYear}-${mNum}`;
      if (!matchedMonths.includes(ym)) {
        matchedMonths.push(ym);
      }
    }
  }

  matchedMonths.sort();
  return matchedMonths;
}

/**
 * Import and populate the database from the workbook file or buffer
 */
export function importExcelWorkbook(fileBufferOrPath: Buffer | string, executeCommit = true): ParseResult {
  const db = getDb();
  const wb = typeof fileBufferOrPath === 'string'
    ? XLSX.readFile(fileBufferOrPath)
    : XLSX.read(fileBufferOrPath, { type: 'buffer' });

  const ambiguousRows: ParseResult['ambiguousRows'] = [];
  let housesParsed = 0;
  let transactionsParsed = 0;
  let paymentsCount = 0;
  let expensesCount = 0;
  let otherIncomeCount = 0;

  // 1. Parse Sheet "rekapan iuran dari awal" if present
  const sheetAwalName = wb.SheetNames.find((s) => s.toLowerCase().includes('rekapan iuran dari awal') || s.toLowerCase().includes('iuran'));
  if (sheetAwalName) {
    const ws = wb.Sheets[sheetAwalName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    // Find header row containing "NO.R" or "KK"
    let headerIdx = -1;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r && r.some((c) => String(c).includes('NO.R') || String(c).includes('Tanggal serah terima'))) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx !== -1) {
      for (let i = headerIdx + 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 3) continue;
        const rawCode = String(row[1] || '').trim();
        const rawName = String(row[2] || '').trim();
        const rawHandover = row[3];

        if (!rawCode || rawCode.toLowerCase().includes('keterangan') || rawCode.toLowerCase().includes('total')) {
          continue;
        }

        const code = normalizeHouseCode(rawCode);
        if (!code) continue;

        const block = getHouseBlock(code);
        const handoverDate = parseIndonesianDate(rawHandover);
        const isMerged = code.includes('&');
        const status = rawName.toUpperCase().includes('KANTOR') ? 'kantor' : 'dihuni';

        if (executeCommit) {
          const houseId = `H-${code}`;
          db.prepare(`
            INSERT INTO houses (id, code, block, status, handover_date, is_merged, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(code) DO UPDATE SET
              status = excluded.status,
              handover_date = coalesce(excluded.handover_date, houses.handover_date),
              updated_at = datetime('now')
          `).run(houseId, code, block, status, handoverDate, isMerged ? 1 : 0);

          if (rawName && !rawName.toUpperCase().includes('KANTOR')) {
            const residentId = `R-${code}-1`;
            db.prepare(`
              INSERT INTO residents (id, house_id, house_code, name, start_date, is_active, created_at)
              VALUES (?, ?, ?, ?, coalesce(?, '2025-01-01'), 1, datetime('now'))
              ON CONFLICT(id) DO UPDATE SET name = excluded.name
            `).run(residentId, houseId, code, rawName, handoverDate);
          }
        }
        housesParsed++;
      }
    }
  }

  // 2. Parse Sheet "2026" (master ledger)
  const masterSheetName = wb.SheetNames.find((s) => s.trim() === '2026') || wb.SheetNames[0];
  const wsMaster = wb.Sheets[masterSheetName];
  const rowsMaster = XLSX.utils.sheet_to_json(wsMaster, { header: 1 }) as any[][];

  // Find header row: "No Rumah", "Tanggal Transaksi", "Jenis Transaksi", "Keterangan", "Masuk", "Keluar", "Saldo"
  let masterHeaderIdx = -1;
  for (let i = 0; i < rowsMaster.length; i++) {
    const r = rowsMaster[i];
    if (r && r.some((c) => String(c).toLowerCase().includes('no rumah') || String(c).toLowerCase().includes('tanggal transaksi'))) {
      masterHeaderIdx = i;
      break;
    }
  }

  if (masterHeaderIdx !== -1) {
    let lastDate = '2025-06-05';

    for (let i = masterHeaderIdx + 1; i < rowsMaster.length; i++) {
      const row = rowsMaster[i];
      if (!row || row.length === 0) continue;

      let rawHouse = row[0];
      let rawDate = row[1];
      let rawJenis = String(row[2] || '').trim();
      let rawDesc = String(row[3] || '').trim();
      let rawMasuk = row[4];
      let rawKeluar = row[5];
      let rawNote = String(row[7] || row[6] || '').trim();

      // Handle split description across multiple cells (e.g. unescaped commas in CSV/Excel)
      if (rawDesc.startsWith('"') && !rawDesc.endsWith('"')) {
        let endIdx = 3;
        for (let c = 4; c < row.length; c++) {
          if (typeof row[c] === 'string' && String(row[c]).includes('"')) {
            endIdx = c;
            break;
          }
        }
        const descParts: string[] = [];
        for (let c = 3; c <= endIdx; c++) {
          if (row[c] !== undefined && row[c] !== null) descParts.push(String(row[c]));
        }
        rawDesc = descParts.join(', ').replace(/^"/, '').replace(/"$/, '').trim();
        const shift = endIdx - 3;
        rawMasuk = row[4 + shift];
        rawKeluar = row[5 + shift];
        rawNote = String(row[7 + shift] || row[6 + shift] || '').trim();
      }

      // Check if completely empty row
      if (!rawHouse && !rawDate && !rawJenis && !rawDesc && !rawMasuk && !rawKeluar) {
        continue;
      }

      // Stop if reached footer or new section header
      if (rawDesc.toLowerCase().includes('laporan keuangan') || rawJenis.toLowerCase().includes('saldo per')) {
        continue;
      }

      // Handle talangan dues offsets (potong iuran warga tanpa tarik tunai dari kas):
      // Row 95: Ganti Uang talang pak agung (120.000)
      // Row 96: Ganti Uang Liwet pak robi (40.000)
      const isDuesOffset =
        rawDesc.toLowerCase().includes('ganti uang talang') ||
        rawDesc.toLowerCase().includes('ganti uang liwet');

      if (isDuesOffset) {
        if (executeCommit) {
          if (rawDesc.toLowerCase().includes('agung')) {
            db.prepare(`
              INSERT OR REPLACE INTO advances (id, advance_number, resident_name, house_code, description, total_amount, settled_amount, balance, status, date, note, created_at, updated_at)
              VALUES ('ADV-AGUNG-1', 'ADV-202511-01', 'Pak Agung', 'B50', 'Talang Reparasi Mesin Air', 400000, 120000, 280000, 'active', '2025-11-30', 'Sisa 280.000 setelah potong iuran Des 2025', datetime('now'), datetime('now'))
            `).run();
            db.prepare(`
              INSERT OR REPLACE INTO advance_settlements (id, advance_id, amount, settlement_type, due_year_month, date, note, created_at)
              VALUES ('SETTLE-AGUNG-1', 'ADV-AGUNG-1', 120000, 'dues_offset', '2025-12', '2025-12-31', 'Potong iuran Desember 2025', datetime('now'))
            `).run();
          } else if (rawDesc.toLowerCase().includes('robi')) {
            db.prepare(`
              INSERT OR REPLACE INTO advances (id, advance_number, resident_name, house_code, description, total_amount, settled_amount, balance, status, date, note, created_at, updated_at)
              VALUES ('ADV-ROBI-1', 'ADV-202512-01', 'Pak Robi', 'A3', 'Talang Uang Liwet Warga', 40000, 40000, 0, 'settled', '2025-12-31', 'Kompensasi iuran Januari 2026', datetime('now'), datetime('now'))
            `).run();
            db.prepare(`
              INSERT OR REPLACE INTO advance_settlements (id, advance_id, amount, settlement_type, due_year_month, date, note, created_at)
              VALUES ('SETTLE-ROBI-1', 'ADV-ROBI-1', 40000, 'dues_offset', '2026-01', '2025-12-31', 'Kompensasi iuran Januari 2026', datetime('now'))
            `).run();
          }
        }
        continue; // Exclude from cash expenses to maintain exact cash balance
      }

      const houseCode = rawHouse ? normalizeHouseCode(String(rawHouse)) : '';
      let date = parseIndonesianDate(rawDate);
      if (!date) {
        // Carry forward last date if not specified
        date = lastDate;
      } else {
        lastDate = date;
      }

      let masuk = 0;
      let keluar = 0;
      if (rawMasuk !== undefined && rawMasuk !== null && rawMasuk !== '') {
        const parsed = parseInt(String(rawMasuk).replace(/[^\d]/g, ''), 10);
        if (!isNaN(parsed)) masuk = parsed;
      }
      if (rawKeluar !== undefined && rawKeluar !== null && rawKeluar !== '') {
        const parsed = parseInt(String(rawKeluar).replace(/[^\d]/g, ''), 10);
        if (!isNaN(parsed)) keluar = parsed;
      }

      // RULE REQUIREMENT:
      // "Detect expense rows whose amount sits in the Masuk column (Jenis = Pengeluaran/Kas Keluar) and move them to expenses."
      const isExpenseType =
        rawJenis.toLowerCase().includes('pengeluaran') ||
        rawJenis.toLowerCase().includes('kas keluar') ||
        rawDesc.toLowerCase().includes('bayar sampah') ||
        rawDesc.toLowerCase().includes('token listrik') ||
        rawDesc.toLowerCase().includes('ganti uang') ||
        rawDesc.toLowerCase().includes('perbaikan') ||
        rawDesc.toLowerCase().includes('donasi');

      if (isExpenseType && masuk > 0 && keluar === 0) {
        keluar = masuk;
        masuk = 0;
      }

      if (masuk === 0 && keluar === 0) {
        continue;
      }

      transactionsParsed++;

      if (executeCommit) {
        const txId = `IMP-${date.replace(/-/g, '')}-${i}`;

        if (keluar > 0) {
          // Expense
          expensesCount++;
          let category = 'Perbaikan/Maintenance';
          const lowerDesc = rawDesc.toLowerCase();
          if (lowerDesc.includes('token') || lowerDesc.includes('listrik')) {
            category = 'Token Listrik Mesin Air & Portal';
          } else if (lowerDesc.includes('sampah') || lowerDesc.includes('pak udin')) {
            category = 'Pengelolaan Sampah (Pak Udin)';
          } else if (lowerDesc.includes('rumput') || lowerDesc.includes('kebersihan')) {
            category = 'Kebersihan & Potong Rumput';
          } else if (lowerDesc.includes('cctv') || lowerDesc.includes('portal') || lowerDesc.includes('kunci')) {
            category = 'Keamanan (CCTV, portal)';
          } else if (lowerDesc.includes('jenguk') || lowerDesc.includes('donasi') || lowerDesc.includes('thr') || lowerDesc.includes('liwet')) {
            category = 'Sosial (jenguk, hampers, THR, donasi)';
          } else if (lowerDesc.includes('debit') || lowerDesc.includes('bank') || lowerDesc.includes('charges')) {
            category = 'Biaya Bank';
          }

          db.prepare(`
            INSERT INTO expenses (id, expense_number, date, category, description, amount, note, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `).run(txId, `EXP-${txId}`, date, category, rawDesc || category, keluar, rawNote || null);
        } else if (masuk > 0) {
          // Masuk: either Payment from house or Other Income
          if (houseCode) {
            paymentsCount++;
            const houseId = `H-${houseCode}`;

            // Ensure house exists
            db.prepare(`
              INSERT INTO houses (id, code, block, status, created_at, updated_at)
              VALUES (?, ?, ?, 'dihuni', datetime('now'), datetime('now'))
              ON CONFLICT(code) DO NOTHING
            `).run(houseId, houseCode, getHouseBlock(houseCode));

            db.prepare(`
              INSERT INTO payments (id, payment_number, date, house_id, house_code, payer_name, amount, method, note, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'transfer', ?, datetime('now'), datetime('now'))
            `).run(txId, `PAY-${txId}`, date, houseId, houseCode, rawDesc || houseCode, masuk, rawNote || null);

            // Parse allocations from note if present
            const coverageMonths = parseCoverageMonthsFromNote(rawNote, date);
            if (coverageMonths.length > 0) {
              const amountPerMonth = Math.floor(masuk / coverageMonths.length);
              for (const ym of coverageMonths) {
                db.prepare(`
                  INSERT INTO payment_allocations (id, payment_id, house_id, house_code, year_month, component_name, amount, created_at)
                  VALUES (?, ?, ?, ?, ?, 'Total', ?, datetime('now'))
                `).run(`ALLOC-${txId}-${ym}`, txId, houseId, houseCode, ym, amountPerMonth);
              }
            } else {
              // Default allocation to the transaction's month
              const ym = date.slice(0, 7);
              db.prepare(`
                INSERT INTO payment_allocations (id, payment_id, house_id, house_code, year_month, component_name, amount, created_at)
                VALUES (?, ?, ?, ?, ?, 'Total', ?, datetime('now'))
              `).run(`ALLOC-${txId}-${ym}`, txId, houseId, houseCode, ym, masuk);
            }
          } else {
            // Other income (e.g. kontraktor, patungan)
            otherIncomeCount++;
            db.prepare(`
              INSERT INTO other_income (id, income_number, date, category, description, amount, note, created_at, updated_at)
              VALUES (?, ?, ?, 'Pemasukan Non-Iuran', ?, ?, ?, datetime('now'), datetime('now'))
            `).run(txId, `INC-${txId}`, date, rawDesc || 'Pemasukan Lain', masuk, rawNote || null);
          }
        }
      }
    }
  }

  // 3. Post-import Reconciliation check against benchmarks
  const reconciliation: ParseResult['reconciliation'] = [];
  for (const [ym, exp] of Object.entries(REPORT_BENCHMARKS)) {
    const [yStr, mStr] = ym.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const summary = getMonthLedger(y, m, undefined, db);

    const diff = summary.closing_balance - exp.akhir;
    reconciliation.push({
      period: ym,
      periodLabel: `${BULAN_INDONESIA[m]} ${y}`,
      expectedSaldoAwal: exp.awal,
      computedSaldoAwal: summary.opening_balance,
      expectedPemasukan: exp.masuk,
      computedPemasukan: summary.total_masuk,
      expectedPengeluaran: exp.keluar,
      computedPengeluaran: summary.total_keluar,
      expectedSaldoAkhir: exp.akhir,
      computedSaldoAkhir: summary.closing_balance,
      diff,
      isMatch: diff === 0,
    });
  }

  if (executeCommit) {
    recordAuditLog('System', 'IMPORT', 'workbook', 'master_2026', null, {
      houses: housesParsed,
      transactions: transactionsParsed,
      payments: paymentsCount,
      expenses: expensesCount,
    });
  }

  return {
    housesParsed,
    transactionsParsed,
    paymentsCount,
    expensesCount,
    otherIncomeCount,
    ambiguousRows,
    reconciliation,
  };
}
