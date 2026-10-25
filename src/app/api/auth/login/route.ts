import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, createSession, seedDefaultUsers } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    seedDefaultUsers(db);

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();

    // Find user by username, phone, or email
    const user = db.prepare(`
      SELECT * FROM users
      WHERE lower(username) = ? OR phone = ? OR lower(email) = ?
    `).get(cleanUsername, username, cleanUsername) as any;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Akun tidak ditemukan. Periksa kembali username atau password Anda.' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: 'Akun ini dinonaktifkan oleh Bendahara. Silakan hubungi pengurus.' },
        { status: 403 }
      );
    }

    const isValid = verifyPassword(String(password), user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Password salah. Silakan coba lagi.' },
        { status: 401 }
      );
    }

    // Create session
    const { token, expiresAt } = createSession(user.id, db);

    const safeUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      house_code: user.house_code,
      phone: user.phone,
      email: user.email,
    };

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      message: 'Login berhasil.',
    });

    const isHttps = req.headers.get('x-forwarded-proto') === 'https';

    response.cookies.set('paradessa_session', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan sistem saat login' },
      { status: 500 }
    );
  }
}

