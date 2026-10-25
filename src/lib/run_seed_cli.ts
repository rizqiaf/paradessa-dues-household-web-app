import { runSeed } from './seed';

const res = runSeed(true);
console.log('Seed Status:', res.status);
if (res.importStats) {
  console.log('Houses Parsed:', res.importStats.housesParsed);
  console.log('Transactions Parsed:', res.importStats.transactionsParsed);
  console.log('Payments Count:', res.importStats.paymentsCount);
  console.log('Expenses Count:', res.importStats.expensesCount);
  console.log('\n--- RECONCILIATION SUMMARY ---');
  for (const r of res.importStats.reconciliation) {
    const mark = r.isMatch ? '✅ MATCH' : `⚠️ DIFF: ${r.diff}`;
    console.log(`${r.periodLabel.padEnd(16)} | Computed: ${String(r.computedSaldoAkhir).padStart(8)} | Expected: ${String(r.expectedSaldoAkhir).padStart(8)} | ${mark}`);
  }
}
