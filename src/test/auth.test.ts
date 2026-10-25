import { describe, it, expect, beforeEach } from 'vitest';
import { getDb, initSchema } from '../lib/db';
import {
  hashPassword,
  verifyPassword,
  createSession,
  getSessionUser,
  destroySession,
  seedDefaultUsers,
} from '../lib/auth';

describe('Auth & User Management System', () => {
  const db = getDb();

  beforeEach(() => {
    initSchema(db);
    db.exec(`
      DELETE FROM sessions;
      DELETE FROM users;
    `);
  });

  it('correctly hashes and verifies passwords with scrypt', () => {
    const password = 'mypassword123';
    const hash = hashPassword(password);
    expect(hash).toContain(':');
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('wrongpassword', hash)).toBe(false);
  });

  it('seeds default admin and resident accounts when empty', () => {
    seedDefaultUsers(db);
    const users = db.prepare('SELECT * FROM users').all() as any[];
    expect(users.length).toBe(2);

    const admin = users.find((u) => u.username === 'bendahara');
    expect(admin).toBeDefined();
    expect(admin.role).toBe('admin');
    expect(verifyPassword('paradessa2026', admin.password_hash)).toBe(true);

    const warga = users.find((u) => u.username === 'warga');
    expect(warga).toBeDefined();
    expect(warga.role).toBe('warga');
    expect(warga.house_code).toBe('A1');
    expect(verifyPassword('warga2026', warga.password_hash)).toBe(true);
  });

  it('creates, verifies and destroys sessions', () => {
    seedDefaultUsers(db);
    const admin = db.prepare("SELECT * FROM users WHERE username = 'bendahara'").get() as any;

    const { token, expiresAt } = createSession(admin.id, db);
    expect(token).toBeDefined();
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());

    // Retrieve active user by session token
    const user = getSessionUser(token, db);
    expect(user).toBeDefined();
    expect(user?.username).toBe('bendahara');
    expect(user?.role).toBe('admin');

    // Destroy session (Logout)
    destroySession(token, db);
    const userAfter = getSessionUser(token, db);
    expect(userAfter).toBeNull();
  });
});
