import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { importExcelWorkbook } from '@/lib/importer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let buffer: Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ success: false, error: 'File Excel tidak ditemukan dalam request' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // Use existing sample workbook file
      const samplePath = path.join(process.cwd(), 'data', 'paradessa_existing_workbook.xlsx');
      if (fs.existsSync(samplePath)) {
        buffer = fs.readFileSync(samplePath);
      } else {
        return NextResponse.json({ success: false, error: 'File data/paradessa_existing_workbook.xlsx tidak ditemukan' }, { status: 404 });
      }
    }

    const result = importExcelWorkbook(buffer, true);
    return NextResponse.json({
      success: true,
      message: 'Impor buku kas Excel berhasil diproses.',
      stats: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
