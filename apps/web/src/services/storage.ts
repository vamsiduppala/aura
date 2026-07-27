// Storage service — the single boundary for persistence. Keeps the UI free of localStorage
// details and makes it trivial to swap for encrypted secure-store in the native apps (SPEC §11.6).
// All birth data stays on-device.
//
// IMPORTANT: storage is namespaced PER IDENTITY. Everything used to share one "aura.v1" key, so
// two people using the same browser saw each other's chart and name: signing out left the previous
// person's profile behind, and the next sign-in inherited it whenever that account had no profile
// of its own yet. Each account now writes to its own slot, and device-only ("guest") mode has its
// own slot too, so nothing bleeds across users.

import type { BirthData, LifeArea } from '@aura/engine';

const BASE = 'aura.v1';
const IDENTITY_KEY = 'aura.identity';
/** Pre-namespacing keys, migrated into the guest slot on first run. */
const LEGACY_PROFILE = 'aura.v1';
const LEGACY_READS = 'aura.reads';

export interface Profile { birth: BirthData; goalArea: LifeArea; goalName: string; displayName?: string; }
export interface ReadsState { count: number; lastDay: string }

/** Who the on-device data currently belongs to: an account slot, or the device-only guest. */
let identity = 'guest';

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; }
  catch { return fallback; }
}
function write(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / private mode */ }
}

const profileKey = (id = identity): string => `${BASE}.${id}.profile`;
const readsKey = (id = identity): string => `${BASE}.${id}.reads`;

/**
 * Point storage at an account (`u<id>`) or at device-only mode (`null` → guest). Call this on
 * sign-in, sign-up and sign-out BEFORE reading a profile, so you never read someone else's slot.
 */
export function setStorageIdentity(userId: number | null): void {
  identity = userId == null ? 'guest' : `u${userId}`;
  try { localStorage.setItem(IDENTITY_KEY, identity); } catch { /* ignore */ }
}

/** The identity storage currently points at (for diagnostics and tests). */
export function currentIdentity(): string { return identity; }

/** Move any pre-namespacing data into the guest slot once, then drop the old keys. */
function migrateLegacy(): void {
  try {
    const legacy = localStorage.getItem(LEGACY_PROFILE);
    // The legacy key equals BASE, so only migrate when it actually holds a profile object.
    if (legacy && legacy.trim().startsWith('{')) {
      if (!localStorage.getItem(profileKey('guest'))) localStorage.setItem(profileKey('guest'), legacy);
      localStorage.removeItem(LEGACY_PROFILE);
    }
    const reads = localStorage.getItem(LEGACY_READS);
    if (reads) {
      if (!localStorage.getItem(readsKey('guest'))) localStorage.setItem(readsKey('guest'), reads);
      localStorage.removeItem(LEGACY_READS);
    }
  } catch { /* ignore */ }
}
migrateLegacy();

// Restore the last identity so a refresh keeps showing the same person's data.
try {
  const saved = localStorage.getItem(IDENTITY_KEY);
  if (saved) identity = saved;
} catch { /* ignore */ }

export function loadProfile(): Profile | null { return read<Profile | null>(profileKey(), null); }
export function saveProfile(p: Profile): void { write(profileKey(), p); }

export function loadReads(): ReadsState { return read<ReadsState>(readsKey(), { count: 0, lastDay: '' }); }

/** Increment the lifetime count once per distinct day (never resets — Q-09). */
export function bumpReads(r: ReadsState): ReadsState {
  const today = new Date().toISOString().slice(0, 10);
  if (r.lastDay === today) return r;
  const next = { count: r.count + 1, lastDay: today };
  write(readsKey(), next);
  return next;
}

/** Erase the CURRENT identity's on-device data (used by "delete everything"). */
export function clearAll(): void {
  try { localStorage.removeItem(profileKey()); localStorage.removeItem(readsKey()); } catch { /* ignore */ }
}

/** Erase every identity's data on this device — for when a clean slate must be guaranteed. */
export function clearEveryIdentity(): void {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(`${BASE}.`) || k === LEGACY_PROFILE || k === LEGACY_READS) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}
