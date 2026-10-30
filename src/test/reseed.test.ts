import { describe, it, expect } from 'vitest';
import { runSeed } from '../lib/seed';
import { getDb, createTestDb } from '../lib/db';
import { getMonthLedger } from '../lib/ledger';

describe('Reseed and verify October 2026 saldo', () => {
  it('reseeds database and checks 01 October 2026 balance is 5.270.840', async () => {
    const testDb = createTestDb();
    const res = await runSeed(true, testDb);
    expect(res.status).toBe('seeded');

    // Check 30 September 2026 balance
    const l9 = await getMonthLedger(2026, 9, undefined, testDb);
    expect(l9.closing_balance).toBe(6272840);

    // Check October 2026 Ledger
    const l10 = await getMonthLedger(2026, 10, undefined, testDb);
    expect(l10.opening_balance).toBe(6272840);
    expect(l10.total_keluar).toBe(1002000);
    expect(l10.closing_balance).toBe(5270840);

    // Verify Row 282 is present in October 2026
    const expRow = (await testDb.prepare("SELECT * FROM expenses WHERE date = '2026-10-01'").get()) as any;
    expect(expRow).toBeDefined();
    expect(expRow.amount).toBe(1002000);
    expect(expRow.description).toContain('Pasang lampu');
  });
});
