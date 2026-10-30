import { createClient, type Client } from '@libsql/client';
import path from 'path';

export interface DbStatement {
  all<T = any>(...args: any[]): Promise<T[]>;
  get<T = any>(...args: any[]): Promise<T | undefined>;
  run(...args: any[]): Promise<{ changes: number; lastInsertRowid: any }>;
}

export interface DatabaseClient {
  client: Client;
  prepare(sql: string): DbStatement;
  exec(sql: string): Promise<void>;
  transaction<T>(fn: (txDb: DatabaseClient) => Promise<T>): Promise<T>;
}

function normalizeArgs(args: any[]): any[] {
  if (args.length === 1 && Array.isArray(args[0])) {
    return args[0];
  }
  return args;
}

export function createDbWrapper(c: Client | any): DatabaseClient {
  return {
    client: c,
    prepare(sql: string): DbStatement {
      return {
        async all<T = any>(...args: any[]): Promise<T[]> {
          const res = await c.execute({ sql, args: normalizeArgs(args) });
          return (res.rows as unknown) as T[];
        },
        async get<T = any>(...args: any[]): Promise<T | undefined> {
          const res = await c.execute({ sql, args: normalizeArgs(args) });
          return (res.rows[0] as unknown) as (T | undefined);
        },
        async run(...args: any[]): Promise<{ changes: number; lastInsertRowid: any }> {
          const res = await c.execute({ sql, args: normalizeArgs(args) });
          return {
            changes: res.rowsAffected,
            lastInsertRowid: res.lastInsertRowid,
          };
        },
      };
    },
    async exec(sql: string): Promise<void> {
      await c.executeMultiple(sql);
    },
    async transaction<T>(fn: (txDb: DatabaseClient) => Promise<T>): Promise<T> {
      if (typeof c.transaction === 'function') {
        const tx = await c.transaction('write');
        try {
          const txDb = createDbWrapper(tx);
          const result = await fn(txDb);
          await tx.commit();
          return result;
        } catch (err) {
          try {
            await tx.rollback();
          } catch (_) {}
          throw err;
        }
      } else {
        return await fn(this);
      }
    },
  };
}

let dbInstance: DatabaseClient | null = null;

export function getDb(): DatabaseClient {
  if (!dbInstance) {
    const url =
      process.env.TURSO_DATABASE_URL ||
      (process.env.NODE_ENV === 'production'
        ? ':memory:'
        : `file:${path.join(process.cwd(), 'data', 'paradessa.db')}`);
    const authToken = process.env.TURSO_AUTH_TOKEN;

    const client = createClient({
      url,
      authToken,
    });

    dbInstance = createDbWrapper(client);
  }
  return dbInstance;
}

export function createTestDb(): DatabaseClient {
  const client = createClient({ url: ':memory:' });
  return createDbWrapper(client);
}

export async function initSchema(db: DatabaseClient = getDb()) {
  await db.exec(`
    -- Houses
    CREATE TABLE IF NOT EXISTS houses (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      block TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'dihuni', -- dihuni, kosong, kantor
      handover_date TEXT, -- YYYY-MM-DD
      is_merged INTEGER NOT NULL DEFAULT 0,
      merged_with TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Residents with occupancy history
    CREATE TABLE IF NOT EXISTS residents (
      id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      house_code TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
    );

    -- Fee Components (versioned with effective_from)
    CREATE TABLE IF NOT EXISTS fee_components (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL, -- Pokok, Air, Sampah
      amount INTEGER NOT NULL,
      effective_from TEXT NOT NULL,
      effective_until TEXT,
      description TEXT
    );

    -- House Subscriptions
    CREATE TABLE IF NOT EXISTS house_subscriptions (
      id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      house_code TEXT NOT NULL,
      component_id TEXT NOT NULL,
      component_name TEXT NOT NULL,
      effective_from TEXT NOT NULL,
      effective_until TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
      FOREIGN KEY (component_id) REFERENCES fee_components(id)
    );

    -- Dues (generated monthly per house per subscribed component)
    CREATE TABLE IF NOT EXISTS dues (
      id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      house_code TEXT NOT NULL,
      year_month TEXT NOT NULL, -- YYYY-MM
      component_id TEXT NOT NULL,
      component_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      paid_amount INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'belum bayar', -- belum bayar, sebagian, lunas
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_dues_house_ym_comp ON dues(house_code, year_month, component_name);

    -- Payments (money received)
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      payment_number TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      house_id TEXT NOT NULL,
      house_code TEXT NOT NULL,
      payer_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      method TEXT NOT NULL DEFAULT 'transfer', -- transfer, cash
      proof_photo TEXT,
      note TEXT,
      created_by TEXT DEFAULT 'Bendahara',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (house_id) REFERENCES houses(id)
    );

    -- Payment Allocations (links payment to specific dues)
    CREATE TABLE IF NOT EXISTS payment_allocations (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL,
      due_id TEXT,
      house_id TEXT NOT NULL,
      house_code TEXT NOT NULL,
      year_month TEXT NOT NULL,
      component_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
    );

    -- House Overpayment Credits
    CREATE TABLE IF NOT EXISTS house_credits (
      id TEXT PRIMARY KEY,
      house_id TEXT NOT NULL,
      house_code TEXT NOT NULL,
      payment_id TEXT,
      amount INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (house_id) REFERENCES houses(id)
    );

    -- Expense Categories
    CREATE TABLE IF NOT EXISTS expense_categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 1
    );

    -- Expenses
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      expense_number TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount INTEGER NOT NULL,
      payee TEXT,
      receipt_photo TEXT,
      note TEXT,
      created_by TEXT DEFAULT 'Bendahara',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Other Income (sisa patungan, iuran listrik kontraktor, etc.)
    CREATE TABLE IF NOT EXISTS other_income (
      id TEXT PRIMARY KEY,
      income_number TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount INTEGER NOT NULL,
      payer TEXT,
      note TEXT,
      created_by TEXT DEFAULT 'Bendahara',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Advances (talangan/kasbon)
    CREATE TABLE IF NOT EXISTS advances (
      id TEXT PRIMARY KEY,
      advance_number TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      resident_name TEXT NOT NULL,
      house_code TEXT,
      description TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      settled_amount INTEGER NOT NULL DEFAULT 0,
      balance INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active', -- active, settled
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Advance Settlements (cash refund or dues offset)
    CREATE TABLE IF NOT EXISTS advance_settlements (
      id TEXT PRIMARY KEY,
      advance_id TEXT NOT NULL,
      date TEXT NOT NULL,
      amount INTEGER NOT NULL,
      settlement_type TEXT NOT NULL, -- cash, dues_offset
      due_year_month TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (advance_id) REFERENCES advances(id) ON DELETE CASCADE
    );

    -- Month Locks
    CREATE TABLE IF NOT EXISTS month_locks (
      id TEXT PRIMARY KEY,
      year_month TEXT UNIQUE NOT NULL, -- YYYY-MM
      status TEXT NOT NULL DEFAULT 'draft', -- draft, terkunci
      locked_by TEXT,
      locked_at TEXT,
      closing_balance_at_lock INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    -- Audit Log (immutable)
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, LOCK, UNLOCK, IMPORT
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      before_value TEXT,
      after_value TEXT,
      ip_address TEXT
    );

    -- System Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL
    );

    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'warga', -- admin, warga
      house_code TEXT,
      password_hash TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- User Sessions Table
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

// Log action to audit_log
export async function recordAuditLog(
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOCK' | 'UNLOCK' | 'IMPORT',
  entityType: string,
  entityId: string,
  beforeValue?: any,
  afterValue?: any,
  db: DatabaseClient = getDb()
) {
  try {
    const id = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();
    await db.prepare(`
      INSERT INTO audit_log (id, timestamp, user_name, action, entity_type, entity_id, before_value, after_value)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      timestamp,
      userName,
      action,
      entityType,
      entityId,
      beforeValue ? JSON.stringify(beforeValue) : null,
      afterValue ? JSON.stringify(afterValue) : null
    );
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}
