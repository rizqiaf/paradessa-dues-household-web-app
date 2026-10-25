import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const categories = db.prepare('SELECT * FROM expense_categories ORDER BY is_default DESC, name ASC').all();
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Nama kategori wajib diisi' }, { status: 400 });
    }
    const id = `CAT-${Date.now()}`;
    db.prepare('INSERT OR IGNORE INTO expense_categories (id, name, is_default) VALUES (?, ?, 0)').run(id, name.trim());
    return NextResponse.json({ success: true, id, name: name.trim() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
