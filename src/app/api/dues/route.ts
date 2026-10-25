import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);

    // Get all houses sorted by code
    const houses = db.prepare('SELECT * FROM houses ORDER BY block ASC, length(code) ASC, code ASC').all() as any[];

    // Get all residents active
    const residents = db.prepare('SELECT * FROM residents WHERE is_active = 1').all() as any[];
    const residentByHouse: Record<string, string> = {};
    for (const r of residents) {
      residentByHouse[r.house_code] = r.name;
    }

    // Get dues for the selected year
    const startYm = `${year}-01`;
    const endYm = `${year}-12`;
    const duesYear = db.prepare(`
      SELECT * FROM dues
      WHERE year_month >= ? AND year_month <= ?
    `).all(startYm, endYm) as any[];

    // Group dues by house_code -> year_month -> array of components
    const duesMap: Record<string, Record<string, any[]>> = {};
    for (const d of duesYear) {
      if (!duesMap[d.house_code]) duesMap[d.house_code] = {};
      if (!duesMap[d.house_code][d.year_month]) duesMap[d.house_code][d.year_month] = [];
      duesMap[d.house_code][d.year_month].push(d);
    }

    // Also get all payment allocations for the year to show which payment paid what
    const allocationsYear = db.prepare(`
      SELECT a.*, p.payer_name, p.payment_number, p.date as payment_date
      FROM payment_allocations a
      JOIN payments p ON a.payment_id = p.id
      WHERE a.year_month >= ? AND a.year_month <= ?
    `).all(startYm, endYm) as any[];

    const allocMap: Record<string, Record<string, any[]>> = {};
    for (const a of allocationsYear) {
      if (!allocMap[a.house_code]) allocMap[a.house_code] = {};
      if (!allocMap[a.house_code][a.year_month]) allocMap[a.house_code][a.year_month] = [];
      allocMap[a.house_code][a.year_month].push(a);
    }

    // Calculate arrears from earlier years (< year-01)
    const arrearsEarlierRows = db.prepare(`
      SELECT house_code, sum(amount - paid_amount) as arrears
      FROM dues
      WHERE year_month < ? AND (amount - paid_amount) > 0
      GROUP BY house_code
    `).all(startYm) as any[];
    const arrearsEarlierMap: Record<string, number> = {};
    for (const ar of arrearsEarlierRows) {
      arrearsEarlierMap[ar.house_code] = ar.arrears;
    }

    // Build house rows with 12 months
    const matrix = houses.map((h) => {
      const houseCode = h.code;
      const residentName = residentByHouse[houseCode] || (h.status === 'kantor' ? 'KANTOR' : '-');
      const handover = h.handover_date; // YYYY-MM-DD

      let totalTagihanTahunIni = 0;
      let totalTerbayarTahunIni = 0;

      const months = [];
      for (let m = 1; m <= 12; m++) {
        const ym = `${year}-${String(m).padStart(2, '0')}`;
        const comps = duesMap[houseCode]?.[ym] || [];
        const allocs = allocMap[houseCode]?.[ym] || [];

        // Check if month is prior to handover
        const isBeforeHandover = handover && ym < handover.slice(0, 7);

        let status: 'lunas' | 'sebagian' | 'belum bayar' | 'tidak ikut' | 'sebelum serah terima' = 'belum bayar';
        let totalDue = 0;
        let totalPaid = 0;

        if (isBeforeHandover) {
          status = 'sebelum serah terima';
        } else if (comps.length === 0 && allocs.length === 0) {
          if (h.status === 'kosong') {
            status = 'tidak ikut';
          } else {
            status = 'belum bayar';
          }
        } else {
          totalDue = comps.reduce((s, c) => s + c.amount, 0);
          totalPaid = comps.reduce((s, c) => s + c.paid_amount, 0);
          if (totalPaid === 0 && allocs.length > 0) {
            totalPaid = allocs.reduce((s, a) => s + a.amount, 0);
          }
          if (totalDue === 0 && totalPaid > 0) {
            totalDue = totalPaid;
          }

          if (totalPaid >= totalDue && totalDue > 0) {
            status = 'lunas';
          } else if (totalPaid > 0) {
            status = 'sebagian';
          } else {
            status = 'belum bayar';
          }
        }

        totalTagihanTahunIni += totalDue;
        totalTerbayarTahunIni += totalPaid;

        months.push({
          month: m,
          year_month: ym,
          status,
          totalDue,
          totalPaid,
          components: comps,
          allocations: allocs,
        });
      }

      const tagihanSebelumnya = arrearsEarlierMap[houseCode] || 0;
      const sisaTahunIni = Math.max(0, totalTagihanTahunIni - totalTerbayarTahunIni);
      const totalTunggakan = tagihanSebelumnya + sisaTahunIni;

      return {
        houseCode,
        block: h.block,
        status: h.status,
        handoverDate: handover,
        residentName,
        months,
        tagihanSebelumnya,
        totalTagihanTahunIni,
        totalTerbayarTahunIni,
        totalTunggakan,
      };
    });

    return NextResponse.json({
      success: true,
      year,
      housesCount: houses.length,
      matrix,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
