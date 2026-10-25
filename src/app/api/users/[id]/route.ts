import { NextRequest, NextResponse } from 'next/server';
import { getDb, recordAuditLog } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { normalizeHouseCode } from '@/lib/format';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const token = req.cookies.get('paradessa_session')?.value;
    const currentUser = token ? getSessionUser(token, db) : null;

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Fitur ini hanya untuk Bendahara/Admin.' },
        { status: 403 }
      );
    }

    const userId = params.id;
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, role, house_code, phone, email, is_active, password } = body;

    const now = new Date().toISOString();
    const cleanHouse = house_code !== undefined ? (house_code ? normalizeHouseCode(String(house_code)) : null) : existing.house_code;
    const userRole = role !== undefined ? (role === 'admin' ? 'admin' : 'warga') : existing.role;
    const activeStatus = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    let newPasswordHash = existing.password_hash;
    if (password && String(password).trim().length >= 6) {
      newPasswordHash = hashPassword(String(password).trim());
    }

    db.prepare(`
      UPDATE users SET
        name = coalesce(?, name),
        role = ?,
        house_code = ?,
        phone = coalesce(?, phone),
        email = coalesce(?, email),
        is_active = ?,
        password_hash = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      name ? String(name).trim() : null,
      userRole,
      cleanHouse,
      phone ? String(phone).trim() : null,
      email ? String(email).trim().toLowerCase() : null,
      activeStatus,
      newPasswordHash,
      now,
      userId
    );

    recordAuditLog(currentUser.name, 'UPDATE', 'user', userId, {
      name: existing.name,
      role: existing.role,
      is_active: existing.is_active,
    }, {
      name,
      role: userRole,
      is_active: activeStatus,
      password_reset: Boolean(password),
    });

    return NextResponse.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const token = req.cookies.get('paradessa_session')?.value;
    const currentUser = token ? getSessionUser(token, db) : null;

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Fitur ini hanya untuk Bendahara/Admin.' },
        { status: 403 }
      );
    }

    const userId = params.id;
    if (userId === currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.' },
        { status: 400 }
      );
    }

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Delete sessions and user
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    recordAuditLog(currentUser.name, 'DELETE', 'user', userId, {
      username: existing.username,
      name: existing.name,
    }, null);

    return NextResponse.json({
      success: true,
      message: `Pengguna "${existing.name}" berhasil dihapus.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
