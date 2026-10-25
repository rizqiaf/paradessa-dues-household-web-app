import { NextResponse } from 'next/server';
import { getDb, recordAuditLog } from '@/lib/db';
import { generateMonthlyReportData, generateWhatsAppReportSummary } from '@/lib/monthly-report';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);

    const reportData = generateMonthlyReportData(year, month, db);
    const whatsAppText = generateWhatsAppReportSummary(reportData);

    return NextResponse.json({
      success: true,
      report: reportData,
      whatsAppText,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { year, month, action = 'publish', notes } = body;

    if (!year || !month) {
      return NextResponse.json({ success: false, error: 'Tahun dan bulan wajib diisi' }, { status: 400 });
    }

    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const reportData = generateMonthlyReportData(year, month, db);

    if (action === 'publish' || action === 'lock') {
      db.prepare(`
        INSERT INTO month_locks (id, year_month, status, locked_by, locked_at, closing_balance_at_lock, notes, created_at)
        VALUES (?, ?, 'terkunci', 'Bendahara', datetime('now'), ?, ?, datetime('now'))
        ON CONFLICT(year_month) DO UPDATE SET
          status = 'terkunci',
          locked_by = 'Bendahara',
          locked_at = datetime('now'),
          closing_balance_at_lock = excluded.closing_balance_at_lock,
          notes = excluded.notes
      `).run(`LOCK-${yearMonth}`, yearMonth, reportData.summary.saldoAkhir, notes || 'Laporan bulanan telah dipublikasikan');

      recordAuditLog('Bendahara', 'LOCK', 'month_report', yearMonth, null, {
        status: 'terkunci',
        closingBalance: reportData.summary.saldoAkhir,
      });

      return NextResponse.json({ success: true, message: `Laporan ${yearMonth} berhasil dipublikasikan dan dikunci.`, isLocked: true });
    } else if (action === 'unlock') {
      db.prepare(`
        UPDATE month_locks
        SET status = 'draft', locked_by = NULL, locked_at = NULL
        WHERE year_month = ?
      `).run(yearMonth);

      recordAuditLog('Bendahara', 'UNLOCK', 'month_report', yearMonth, { status: 'terkunci' }, { status: 'draft' });

      return NextResponse.json({ success: true, message: `Kunci laporan ${yearMonth} telah dibuka. Transaksi dapat diubah.`, isLocked: false });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
