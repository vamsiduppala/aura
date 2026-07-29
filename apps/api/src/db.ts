// ─────────────────────────────────────────────────────────────────────────────
// Local SQLite database for aura (Phase 2). Uses Node's built-in `node:sqlite`
// (DatabaseSync) — no native build step. Stores user accounts, sessions and birth
// profiles. Local-only, no cloud; the DB file lives under apps/api/data/ (gitignored).
// ─────────────────────────────────────────────────────────────────────────────

import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Load node:sqlite via createRequire so Vite/Vitest's static resolver (which doesn't yet
// know this newer builtin) doesn't try to bundle it. Types still come from @types/node.
type SqliteModule = typeof import('node:sqlite');
type DatabaseSync = InstanceType<SqliteModule['DatabaseSync']>;
const require = createRequire(import.meta.url);
const sqliteId = 'node:sqlite';
let DatabaseSync: SqliteModule['DatabaseSync'];
try {
  ({ DatabaseSync } = require(sqliteId) as SqliteModule);
} catch {
  // node:sqlite is a built-in from Node 22.5 (flagless in Node 24+). Give a clear, actionable
  // message instead of a cryptic module-resolution throw when someone runs an older Node.
  throw new Error(
    `aura-api needs Node's built-in "node:sqlite" (DatabaseSync), which isn't available in ${process.version}. ` +
    'Please use Node 24 or newer (Node 22.5–23.x may need the --experimental-sqlite flag).',
  );
}

const DEFAULT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../data/aura.db');

export interface UserRow { id: number; email: string; password_hash: string; salt: string; created_at: string }
export interface ProfileRow {
  user_id: number; birth_date: string; birth_time: string | null; unknown_time: number;
  place: string; lat: number; lng: number; tz_offset: number;
  goal_area: string; goal_name: string; display_name: string;
  /** How well the birth time is known: exact | within15min | within1hour | unknown.
   *  Load-bearing, not a preference — it decides which dasha levels the app is allowed
   *  to state as fact, because one minute of error offsets every boundary in the tree
   *  by up to five days and that error never shrinks. */
  birth_time_confidence: string;
  updated_at: string;
}

let db: DatabaseSync;

/** Open (and migrate) the local database. Call once at startup. */
export function openDb(path = process.env.AURA_DB_PATH ?? DEFAULT_PATH): DatabaseSync {
  if (db) return db;
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      birth_date TEXT NOT NULL,
      birth_time TEXT,
      unknown_time INTEGER NOT NULL DEFAULT 0,
      place TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      tz_offset INTEGER NOT NULL,
      goal_area TEXT NOT NULL DEFAULT 'career',
      goal_name TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  // Migrations. SQLite has no "ADD COLUMN IF NOT EXISTS", so check the table info first —
  // keeps older DBs working across upgrades.
  const cols = db.prepare('PRAGMA table_info(profiles)').all() as unknown as { name: string }[];
  const has = (name: string) => cols.some((c) => c.name === name);
  // display_name: the person's own name, shown in the app chrome.
  if (!has('display_name')) {
    db.exec("ALTER TABLE profiles ADD COLUMN display_name TEXT NOT NULL DEFAULT ''");
  }
  // birth_time_confidence: gates which dasha levels may be stated as fact. Existing rows
  // default to 'unknown' — the most conservative value, so an un-migrated profile can never
  // silently claim precision it was never asked about.
  if (!has('birth_time_confidence')) {
    db.exec("ALTER TABLE profiles ADD COLUMN birth_time_confidence TEXT NOT NULL DEFAULT 'unknown'");
  }
  return db;
}

export const getDb = (): DatabaseSync => db ?? openDb();

// ── Users ─────────────────────────────────────────────────────────────────────
export function findUserByEmail(email: string): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as UserRow | undefined;
}
export function findUserById(id: number): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}
export function createUser(email: string, passwordHash: string, salt: string): UserRow {
  const info = getDb().prepare('INSERT INTO users (email, password_hash, salt) VALUES (?, ?, ?)')
    .run(email.toLowerCase(), passwordHash, salt);
  return findUserById(Number(info.lastInsertRowid))!;
}

// ── Sessions ────────────────────────────────────────────────────────────────
export function createSession(token: string, userId: number): void {
  getDb().prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
}
export function userIdForToken(token: string): number | undefined {
  const row = getDb().prepare('SELECT user_id FROM sessions WHERE token = ?').get(token) as { user_id: number } | undefined;
  return row?.user_id;
}
export function deleteSession(token: string): void {
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// ── Profiles ──────────────────────────────────────────────────────────────────
export function getProfile(userId: number): ProfileRow | undefined {
  return getDb().prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId) as ProfileRow | undefined;
}
export function upsertProfile(p: ProfileRow): void {
  const { updated_at: _ignored, ...params } = p; // updated_at is set by datetime('now'), not bound
  void _ignored;
  getDb().prepare(`
    INSERT INTO profiles (user_id, birth_date, birth_time, unknown_time, place, lat, lng, tz_offset, goal_area, goal_name, display_name, birth_time_confidence, updated_at)
    VALUES (@user_id, @birth_date, @birth_time, @unknown_time, @place, @lat, @lng, @tz_offset, @goal_area, @goal_name, @display_name, @birth_time_confidence, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      birth_date=@birth_date, birth_time=@birth_time, unknown_time=@unknown_time, place=@place,
      lat=@lat, lng=@lng, tz_offset=@tz_offset, goal_area=@goal_area, goal_name=@goal_name,
      display_name=@display_name, birth_time_confidence=@birth_time_confidence,
      updated_at=datetime('now')
  `).run(params as unknown as Record<string, string | number | null>);
}

/** Set a new password hash + salt for a user (used by the change-password flow). */
export function updateUserPassword(userId: number, passwordHash: string, salt: string): void {
  getDb().prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(passwordHash, salt, userId);
}

/** Drop every session except `keepToken` — used after a password change so other devices sign out. */
export function deleteOtherSessions(userId: number, keepToken: string): void {
  getDb().prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').run(userId, keepToken);
}

/**
 * Permanently delete a user and everything belonging to them (profile, all sessions, the account
 * row). Done explicitly rather than relying on ON DELETE CASCADE, which needs PRAGMA foreign_keys=ON
 * (off by default). Backs the app's "Delete everything / yours only" promise for signed-in users.
 */
export function deleteUser(userId: number): void {
  const d = getDb();
  d.prepare('DELETE FROM profiles WHERE user_id = ?').run(userId);
  d.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  d.prepare('DELETE FROM users WHERE id = ?').run(userId);
}
