import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser, seedDefaultUsers } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    await seedDefaultUsers(db);

    const token = req.cookies.get('paradessa_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const user = await getSessionUser(token, db);
    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
