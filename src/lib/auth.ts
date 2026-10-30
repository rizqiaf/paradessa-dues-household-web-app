import crypto from 'crypto';
import { getDb, DatabaseClient } from './db';
import { UserAccount } from './types';

const SESSION_EXPIRY_DAYS = 30;

/**
 * Hash a password using scrypt with random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against salt:hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Create a new user session
 */
export async function createSession(userId: string, db: DatabaseClient = getDb()): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomBytes(32).toString('hex');
  const id = `SESS-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_EXPIRY_DAYS);
  const expiresAt = expires.toISOString();
  const createdAt = new Date().toISOString();

  await db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, token, expiresAt, createdAt);

  return { token, expiresAt };
}

/**
 * Get active user from session token
 */
export async function getSessionUser(token: string, db: DatabaseClient = getDb()): Promise<UserAccount | null> {
  if (!token) return null;

  const now = new Date().toISOString();
  const row = (await db.prepare(`
    SELECT u.id, u.username, u.name, u.role, u.house_code, u.phone, u.email, u.is_active, u.created_at, u.updated_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ? AND u.is_active = 1
  `).get(token, now)) as any;

  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role as 'admin' | 'warga',
    house_code: row.house_code,
    phone: row.phone,
    email: row.email,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Destroy a session
 */
export async function destroySession(token: string, db: DatabaseClient = getDb()): Promise<void> {
  if (!token) return;
  await db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

/**
 * Seed default admin and sample resident user if users table is empty
 */
export async function seedDefaultUsers(db: DatabaseClient = getDb()): Promise<void> {
  const countRow = (await db.prepare('SELECT count(*) as count FROM users').get()) as { count: number } | undefined;
  if (countRow && countRow.count > 0) return;

  const now = new Date().toISOString();

  // 1. Admin / Bendahara account
  const adminId = 'USR-ADMIN-1';
  const adminPassHash = hashPassword('paradessa2026');
  await db.prepare(`
    INSERT INTO users (id, username, name, role, house_code, password_hash, phone, email, is_active, created_at, updated_at)
    VALUES (?, ?, ?, 'admin', NULL, ?, '08123456789', 'bendahara@paradessa.id', 1, ?, ?)
  `).run(adminId, 'bendahara', 'Rizqi Ahmad Fauzi (Bendahara)', adminPassHash, now, now);

  // 2. Sample Warga account (Blok A1)
  const wargaId = 'USR-WARGA-A1';
  const wargaPassHash = hashPassword('warga2026');
  await db.prepare(`
    INSERT INTO users (id, username, name, role, house_code, password_hash, phone, email, is_active, created_at, updated_at)
    VALUES (?, ?, ?, 'warga', 'A1', ?, '08129876543', 'eko.a1@paradessa.id', 1, ?, ?)
  `).run(wargaId, 'warga', 'Eko (Warga Blok A1)', wargaPassHash, now, now);
}
