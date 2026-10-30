import { NextRequest, NextResponse } from 'next/server';
import { getDb, recordAuditLog } from '@/lib/db';
import { getSessionUser, hashPassword, seedDefaultUsers } from '@/lib/auth';
import { normalizeHouseCode } from '@/lib/format';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    await seedDefaultUsers(db);

    const token = req.cookies.get('paradessa_session')?.value;
    const currentUser = token ? await getSessionUser(token, db) : null;

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Fitur ini hanya untuk Bendahara/Admin.' },
        { status: 403 }
      );
    }

    const rows = (await db.prepare(`
      SELECT id, username, name, role, house_code, phone, email, is_active, created_at, updated_at
      FROM users
      ORDER BY role ASC, house_code ASC, username ASC
    `).all()) as any[];

    const users = rows.map((u: any) => ({
      ...u,
      is_active: Boolean(u.is_active),
    }));

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    await seedDefaultUsers(db);

    const token = req.cookies.get('paradessa_session')?.value;
    const currentUser = token ? await getSessionUser(token, db) : null;

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Fitur ini hanya untuk Bendahara/Admin.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { username, name, password, role, house_code, phone, email } = body;

    if (!username || !name || !password) {
      return NextResponse.json(
        { success: false, error: 'Username, Nama Lengkap, dan Password wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanHouse = house_code ? normalizeHouseCode(String(house_code)) : null;
    const userRole = role === 'admin' ? 'admin' : 'warga';

    // Check unique username
    const existing = await db.prepare('SELECT id FROM users WHERE lower(username) = ?').get(cleanUsername);
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Username "${cleanUsername}" sudah digunakan.` },
        { status: 400 }
      );
    }

    const userId = `USR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO users (id, username, name, role, house_code, password_hash, phone, email, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      userId,
      cleanUsername,
      String(name).trim(),
      userRole,
      cleanHouse,
      passwordHash,
      phone ? String(phone).trim() : null,
      email ? String(email).trim().toLowerCase() : null,
      now,
      now
    );

    await recordAuditLog(currentUser.name, 'CREATE', 'user', userId, null, {
      username: cleanUsername,
      name,
      role: userRole,
      house_code: cleanHouse,
    }, db);

    return NextResponse.json({
      success: true,
      message: `Pengguna "${name}" berhasil dibuat.`,
      userId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
