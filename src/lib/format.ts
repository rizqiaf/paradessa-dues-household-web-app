// Format Rupiah: "Rp 1.250.000"
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-Rp ' : 'Rp '}${formatted}`;
}

// Plain number with dot separator: "1.250.000"
export function formatNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-' : ''}${formatted}`;
}

// Indonesian month names
export const BULAN_INDONESIA: Record<number, string> = {
  1: 'Januari',
  2: 'Februari',
  3: 'Maret',
  4: 'April',
  5: 'Mei',
  6: 'Juni',
  7: 'Juli',
  8: 'Agustus',
  9: 'September',
  10: 'Oktober',
  11: 'November',
  12: 'Desember',
};

export const BULAN_INDONESIA_SHORT: Record<number, string> = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'Mei',
  6: 'Jun',
  7: 'Jul',
  8: 'Agu',
  9: 'Sep',
  10: 'Okt',
  11: 'Nov',
  12: 'Des',
};

// Format date to "23 Sep 2026" or "23 September 2026"
export function formatTanggal(dateStr: string | Date | null | undefined, short = true): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return String(dateStr);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const monthName = short ? BULAN_INDONESIA_SHORT[month] : BULAN_INDONESIA[month];
  return `${day} ${monthName} ${year}`;
}

// Format year-month "2026-09" to "September 2026"
export function formatBulanTahun(yearMonth: string, short = false): string {
  if (!yearMonth) return '';
  const parts = yearMonth.split('-');
  if (parts.length < 2) return yearMonth;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const monthName = short ? BULAN_INDONESIA_SHORT[m] : BULAN_INDONESIA[m];
  return `${monthName} ${y}`;
}

// Normalize house codes:
// "Blok A12" -> "A12"
// "Blok 38" -> "B38"
// "Blok A9&A10" -> "A9&A10"
// "Blok A9 & A10" -> "A9&A10"
// "A 12" -> "A12"
// "B 38" -> "B38"
export function normalizeHouseCode(raw: string | null | undefined): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  // Strip common prefixes
  cleaned = cleaned.replace(/^blok\s+/i, '');
  cleaned = cleaned.replace(/^rumah\s+/i, '');
  cleaned = cleaned.replace(/^no\.?\s*/i, '');
  
  // Clean whitespace inside merged expressions like "A9 & A10" or "A9&A10"
  cleaned = cleaned.replace(/\s*&\s*/g, '&');
  cleaned = cleaned.replace(/\s*\/\s*/g, '&');
  cleaned = cleaned.replace(/\s*dan\s*/i, '&');

  // Handle special case where block prefix was omitted in sheet: e.g. "38" or "Blok 38" -> "B38"
  if (/^\d+$/.test(cleaned)) {
    const num = parseInt(cleaned, 10);
    if (num >= 38 && num <= 52) {
      cleaned = `B${cleaned}`;
    }
  }

  // Remove internal spaces: "A 12" -> "A12"
  cleaned = cleaned.replace(/([A-Z])\s+(\d+)/gi, '$1$2').toUpperCase();

  return cleaned;
}

// Extract block letter (A, B, C)
export function getHouseBlock(code: string): string {
  const norm = normalizeHouseCode(code);
  const match = norm.match(/^([A-Z])/i);
  return match ? match[1].toUpperCase() : 'A';
}

// Validate house code format: block (A-Z) + number (optional merged &)
export function isValidHouseCode(code: string): boolean {
  const norm = normalizeHouseCode(code);
  if (!norm) return false;
  // Single: A1, A12, B38, C01
  // Merged: A9&A10, A9-A10
  const singleRegex = /^[A-Z]\d{1,3}$/;
  const mergedRegex = /^[A-Z]\d{1,3}&[A-Z]\d{1,3}$/;
  return singleRegex.test(norm) || mergedRegex.test(norm);
}

// Parse Indonesian dates from text or Excel
// e.g. "20 Agustus 2025", "2025-06-05", "22/05/2025", "2025-12-04"
export function parseIndonesianDate(input: any): string | null {
  if (!input) return null;
  if (typeof input === 'number') {
    // Excel serial date to JS Date (base: 1899-12-30)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + input * 86400000);
    return jsDate.toISOString().slice(0, 10);
  }

  const str = String(input).trim();
  if (!str) return null;

  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Format DD/MM/YYYY or D/M/YYYY
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, '0');
    const m = slashMatch[2].padStart(2, '0');
    const y = slashMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Format Indonesian text date: e.g. "20 Agustus 2025" or "20-Agu-2025"
  const indonesianMonths: Record<string, string> = {
    januari: '01', jan: '01',
    februari: '02', feb: '02',
    maret: '03', mar: '03',
    april: '04', apr: '04',
    mei: '05', may: '05',
    juni: '06', jun: '06',
    juli: '07', jul: '07',
    agustus: '08', agu: '08', agt: '08', aug: '08',
    september: '09', sep: '09',
    oktober: '10', okt: '10', oct: '10',
    november: '11', nov: '11',
    desember: '12', des: '12', dec: '12',
  };

  const textMatch = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (textMatch) {
    const d = textMatch[1].padStart(2, '0');
    const mWord = textMatch[2].toLowerCase();
    const m = indonesianMonths[mWord];
    const y = textMatch[3];
    if (m) {
      return `${y}-${m}-${d}`;
    }
  }

  // Fallback to JS Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}
