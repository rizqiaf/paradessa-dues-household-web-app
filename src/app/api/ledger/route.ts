import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getMonthLedger, getYearLedgerSummary, getMultiYearLedgerSummary } from '@/lib/ledger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'month'; // 'month' | 'year' | 'multi-year'

    const now = new Date();
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);

    const category = searchParams.get('category') || undefined;
    const houseCode = searchParams.get('house_code') || undefined;
    const type = (searchParams.get('type') as 'masuk' | 'keluar') || undefined;
    const search = searchParams.get('search') || undefined;

    const noCacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    if (view === 'multi-year') {
      const summary = await getMultiYearLedgerSummary(db);
      return NextResponse.json({ success: true, view: 'multi-year', data: summary }, { headers: noCacheHeaders });
    }

    if (view === 'year') {
      const summary = await getYearLedgerSummary(year, db);
      return NextResponse.json({ success: true, view: 'year', year, data: summary }, { headers: noCacheHeaders });
    }

    // Default: month view
    const summary = await getMonthLedger(year, month, { category, houseCode, type, search }, db);
    return NextResponse.json({ success: true, view: 'month', year, month, data: summary }, { headers: noCacheHeaders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
