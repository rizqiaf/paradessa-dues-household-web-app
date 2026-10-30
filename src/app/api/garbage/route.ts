import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { BULAN_INDONESIA } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const ym = `${year}-${String(m).padStart(2, '0')}`;

      // Houses with dues for Sampah in this month
      const garbageDues = (await db.prepare(`
        SELECT d.house_code, d.amount, d.paid_amount, d.status, r.name as resident_name
        FROM dues d
        LEFT JOIN residents r ON d.house_code = r.house_code AND r.is_active = 1
        WHERE d.year_month = ? AND d.component_name = 'Sampah'
      `).all(ym)) as any[];

      // In case explicit component was not split in old data, fallback to active houses in that month
      let participatingHouses = garbageDues;
      if (participatingHouses.length === 0) {
        participatingHouses = (await db.prepare(`
          SELECT h.code as house_code, 50000 as amount,
                 coalesce(p.amount, 0) as paid_amount,
                 CASE WHEN p.id IS NOT NULL THEN 'lunas' ELSE 'belum bayar' END as status,
                 r.name as resident_name
          FROM houses h
          LEFT JOIN residents r ON h.code = r.house_code AND r.is_active = 1
          LEFT JOIN payments p ON h.code = p.house_code AND p.date LIKE ?
          WHERE h.status = 'dihuni'
        `).all(`${ym}%`)) as any[];
      }

      const totalParticipating = participatingHouses.length;
      const totalCollected = participatingHouses.reduce((sum, h) => sum + (h.paid_amount > 0 ? 50000 : 0), 0);
      const paidHousesCount = participatingHouses.filter((h) => h.paid_amount > 0).length;

      // Amount owed to collector: 50.000 * participating houses
      const owedToCollector = totalParticipating * 50000;

      // Actual payment recorded to Pak Udin in expenses for this month
      const actualPaidRow = (await db.prepare(`
        SELECT sum(amount) as total_paid
        FROM expenses
        WHERE date LIKE ? AND (category LIKE '%Sampah%' OR description LIKE '%Sampah%')
      `).get(`${ym}%`)) as any;
      const actualPaidToCollector = actualPaidRow?.total_paid || 0;

      const difference = actualPaidToCollector - owedToCollector;

      months.push({
        month: m,
        monthName: BULAN_INDONESIA[m],
        yearMonth: ym,
        totalParticipating,
        paidHousesCount,
        unpaidHousesCount: totalParticipating - paidHousesCount,
        totalCollected,
        owedToCollector,
        actualPaidToCollector,
        difference,
        houses: participatingHouses,
      });
    }

    return NextResponse.json({
      success: true,
      year,
      feePerHouse: 50000,
      collectorName: 'Pak Udin',
      months,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
