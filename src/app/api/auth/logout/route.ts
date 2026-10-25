import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { destroySession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const token = req.cookies.get('paradessa_session')?.value;

    if (token) {
      destroySession(token, db);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Berhasil logout.',
    });

    response.cookies.set('paradessa_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

