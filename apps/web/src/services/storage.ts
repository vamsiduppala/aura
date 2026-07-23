// Storage service — the single boundary for persistence. Keeps the UI free of
// localStorage details and makes it trivial to swap for encrypted secure-store in the
// native apps (SPEC §11.6). All birth data stays on-device.

import type { BirthData, LifeArea } from '@aura/engine';

const PROFILE_KEY = 'aura.v1';
const READS_KEY = 'aura.reads';

export interface Profile { birth: BirthData; goalArea: LifeArea; goalName: string; displayName?: string; }
export interface ReadsState { count: number; lastDay: string }

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; }
  catch { return fallback; }
}
function write(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / private mode */ }
}

export function loadProfile(): Profile | null { return read<Profile | null>(PROFILE_KEY, null); }
export function saveProfile(p: Profile): void { write(PROFILE_KEY, p); }

export function loadReads(): ReadsState { return read<ReadsState>(READS_KEY, { count: 0, lastDay: '' }); }

/** Increment the lifetime count once per distinct day (never resets — Q-09). */
export function bumpReads(r: ReadsState): ReadsState {
  const today = new Date().toISOString().slice(0, 10);
  if (r.lastDay === today) return r;
  const next = { count: r.count + 1, lastDay: today };
  write(READS_KEY, next);
  return next;
}

export function clearAll(): void {
  try { localStorage.removeItem(PROFILE_KEY); localStorage.removeItem(READS_KEY); } catch { /* ignore */ }
}
