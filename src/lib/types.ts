export type HouseStatus = 'dihuni' | 'kosong' | 'kantor';
export type PaymentMethod = 'cash' | 'transfer';
export type DueStatus = 'lunas' | 'sebagian' | 'belum bayar';
export type MonthLockStatus = 'draft' | 'terkunci';
export type UserRole = 'admin' | 'warga';

export interface House {
  id: string;
  code: string; // e.g. "A1", "A9&A10", "B38", "C01"
  block: string; // e.g. "A", "B", "C"
  status: HouseStatus;
  handover_date: string | null; // YYYY-MM-DD
  is_merged: boolean;
  merged_with?: string | null; // e.g. "A10" if primary is "A9"
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resident {
  id: string;
  house_id: string;
  house_code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
  is_active: boolean;
  notes?: string | null;
  created_at: string;
}

export interface FeeComponent {
  id: string;
  name: string; // "Pokok", "Air", "Sampah"
  amount: number; // in IDR
  effective_from: string; // YYYY-MM-DD
  effective_until?: string | null;
  description?: string | null;
}

export interface HouseSubscription {
  id: string;
  house_id: string;
  house_code: string;
  component_id: string;
  component_name: string;
  effective_from: string;
  effective_until?: string | null;
  is_active: boolean;
}

export interface Due {
  id: string;
  house_id: string;
  house_code: string;
  year_month: string; // "YYYY-MM"
  component_id: string;
  component_name: string;
  amount: number; // standard dues amount
  paid_amount: number; // accumulated amount allocated to this due
  status: DueStatus;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  payment_number: string; // e.g. "PAY-202609-001"
  date: string; // YYYY-MM-DD
  house_id: string;
  house_code: string;
  payer_name: string;
  amount: number; // Total money received
  method: PaymentMethod;
  proof_photo?: string | null;
  note?: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  due_id?: string | null;
  house_id: string;
  house_code: string;
  year_month: string; // "YYYY-MM"
  component_name: string;
  amount: number; // allocated amount
  created_at: string;
}

export interface HouseCredit {
  id: string;
  house_id: string;
  house_code: string;
  payment_id?: string | null;
  amount: number; // remaining overpayment credit
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  is_default: boolean;
}

export interface Expense {
  id: string;
  expense_number: string;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  amount: number;
  payee?: string | null;
  receipt_photo?: string | null;
  note?: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OtherIncome {
  id: string;
  income_number: string;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  amount: number;
  payer?: string | null;
  note?: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Advance {
  id: string;
  advance_number: string;
  date: string;
  resident_name: string;
  house_code?: string | null;
  description: string;
  total_amount: number;
  settled_amount: number;
  balance: number; // total_amount - settled_amount
  status: 'active' | 'settled';
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdvanceSettlement {
  id: string;
  advance_id: string;
  date: string;
  amount: number;
  settlement_type: 'cash' | 'dues_offset';
  due_year_month?: string | null;
  note?: string | null;
  created_at: string;
}

export interface MonthLock {
  id: string;
  year_month: string; // "YYYY-MM"
  status: MonthLockStatus;
  locked_by?: string | null;
  locked_at?: string | null;
  closing_balance_at_lock?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_name: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOCK' | 'UNLOCK' | 'IMPORT';
  entity_type: string;
  entity_id: string;
  before_value?: string | null;
  after_value?: string | null;
  ip_address?: string | null;
}

export interface SystemSetting {
  key: string;
  value: string;
  description?: string | null;
  updated_at: string;
}

export interface LedgerItem {
  id: string;
  date: string;
  type: 'masuk' | 'keluar';
  category: string;
  description: string;
  reference_code?: string;
  house_code?: string | null;
  masuk: number;
  keluar: number;
  running_balance: number;
  source_table: 'payment' | 'other_income' | 'expense' | 'advance_settlement';
  source_id: string;
  note?: string | null;
}

export interface MonthLedgerSummary {
  year_month: string;
  year: number;
  month: number;
  month_name: string;
  opening_balance: number;
  total_masuk: number;
  total_keluar: number;
  closing_balance: number;
  status: MonthLockStatus;
  has_warning?: boolean;
  warning_message?: string;
  items: LedgerItem[];
}
