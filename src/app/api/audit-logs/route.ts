import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const action = searchParams.get('action');

    let query = 'SELECT * FROM audit_log';
    const params: any[] = [];
    if (action) {
      query += ' WHERE action = ?';
      params.push(action);
    }
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const logs = await db.prepare(query).all(...params);
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
