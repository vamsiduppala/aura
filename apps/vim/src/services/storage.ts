// On-device persistence. The app is offline-first: the Timeline is computed locally from
// the birth details, so once they've been entered the app never needs the network again.
//
// Storage is namespaced per identity. A signed-in account reads and writes its own slot;
// a device-only ("guest") session uses a separate one. This is not tidiness — without it,
// the next person to open the browser inherits the last person's birth chart.

import type { BirthData } from '@aura/engine';
import type { BirthTimeConfidence } from '../core/court';

export interface StoredProfile {
  birth: BirthData;
  birthTimeConfidence: BirthTimeConfidence;
  displayName: string;
  /** IANA zone of the birthplace, e.g. "Asia/Kolkata". Kept so the offset can be
   *  re-derived if the birth date is later edited. */
  tzId?: string;
  /** Which ephemeris built the cached values, so a future engine upgrade is detectable. */
  engineVersion?: string;
}

const BASE = 'vim.profile';
let slot: string | null = null;

/** Point storage at an account's own slot (or null for device-only). */
export function setStorageIdentity(userId: number | null): void {
  slot = userId == null ? null : String(userId);
}

const key = (): string => (slot ? `${BASE}.u${slot}` : BASE);

export function loadProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(key());
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredProfile;
    // A profile without the fields the whole app is derived from is not a profile.
    if (!p?.birth?.date || p.birth.lat == null || p.birth.lng == null) return null;
    if (!p.birthTimeConfidence) p.birthTimeConfidence = 'unknown';
    return p;
  } catch {
    return null;
  }
}

export function saveProfile(p: StoredProfile): void {
  try { localStorage.setItem(key(), JSON.stringify(p)); } catch { /* storage full or blocked */ }
}

/** Erase this identity's profile. Used by "delete everything". */
export function clearProfile(): void {
  try { localStorage.removeItem(key()); } catch { /* ignore */ }
}

/** Erase every slot on this device, plus the session token. */
export function clearAll(): void {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(BASE) || k === 'vim.token') localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}

// ── Display preferences (local, instant, never synced) ───────────────────────

export interface Prefs {
  /** The Sanskrit second line under each office. On by default. */
  showSanskrit: boolean;
}

const PREFS_KEY = 'vim.prefs';
export const DEFAULT_PREFS: Prefs = { showSanskrit: true };

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(p: Prefs): void {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
