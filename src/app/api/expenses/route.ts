import { NextResponse } from 'next/server';
import { getDb, recordAuditLog } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let query = 'SELECT * FROM expenses';
    const params: any[] = [];
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    query += ' ORDER BY date DESC, created_at DESC LIMIT ?';
    params.push(limit);

    const expenses = db.prepare(query).all(...params);
    return NextResponse.json({ success: true, data: expenses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { category, amount, date, description, payee, receipt_photo, note } = body;

    if (!category || !amount || amount <= 0 || !description) {
      return NextResponse.json({ success: false, error: 'Kategori, nominal, dan deskripsi wajib diisi' }, { status: 400 });
    }

    const txDate = date || new Date().toISOString().slice(0, 10);
    const txYearMonth = txDate.slice(0, 7);

    // Check month lock
    const lock = db.prepare("SELECT status FROM month_locks WHERE year_month = ? AND status = 'terkunci'").get(txYearMonth) as any;
    if (lock) {
      return NextResponse.json({
        success: false,
        error: `Bulan ${txYearMonth} telah dikunci (laporan dipublikasikan). Buka kunci bulan terlebih dahulu di menu Pengaturan.`,
      }, { status: 403 });
    }

    const id = `EXP-${Date.now()}`;
    const expenseNumber = `EXP-${txDate.replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;

    db.prepare(`
      INSERT INTO expenses (id, expense_number, date, category, description, amount, payee, receipt_photo, note, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(id, expenseNumber, txDate, category, description, amount, payee || null, receipt_photo || null, note || null);

    // Ensure category exists
    db.prepare('INSERT OR IGNORE INTO expense_categories (id, name, is_default) VALUES (?, ?, 0)')
      .run(`CAT-${Date.now()}`, category);

    recordAuditLog('Bendahara', 'CREATE', 'expense', id, null, {
      expenseNumber,
      category,
      amount,
      date: txDate,
      description,
    });

    return NextResponse.json({ success: true, id, expenseNumber });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
