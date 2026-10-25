import { NextResponse } from 'next/server';
import { getDb, recordAuditLog } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM settings').all();
    const feeComponents = db.prepare('SELECT * FROM fee_components ORDER BY effective_from DESC, name ASC').all();
    const categories = db.prepare('SELECT * FROM expense_categories ORDER BY is_default DESC, name ASC').all();
    const monthLocks = db.prepare('SELECT * FROM month_locks ORDER BY year_month DESC').all();

    return NextResponse.json({
      success: true,
      settings,
      feeComponents,
      categories,
      monthLocks,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { action, key, value, description, component_id, name, amount, effective_from } = body;

    if (action === 'update_setting') {
      if (!key) return NextResponse.json({ success: false, error: 'Key wajib diisi' }, { status: 400 });
      db.prepare(`
        INSERT INTO settings (key, value, description, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          description = coalesce(excluded.description, settings.description),
          updated_at = datetime('now')
      `).run(key, String(value), description || null);

      recordAuditLog('Bendahara', 'UPDATE', 'setting', key, null, { key, value });
      return NextResponse.json({ success: true, key, value });
    }

    if (action === 'save_fee_component') {
      const id = component_id || `FC-${Date.now()}`;
      db.prepare(`
        INSERT INTO fee_components (id, name, amount, effective_from, description)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          amount = excluded.amount,
          effective_from = excluded.effective_from,
          description = excluded.description
      `).run(id, name, amount, effective_from, description || null);

      recordAuditLog('Bendahara', 'UPDATE', 'fee_component', id, null, { name, amount, effective_from });
      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
