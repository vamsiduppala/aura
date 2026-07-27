// Reading history.
//
// The app computed a fresh reading every day and then threw the previous one away, which quietly
// destroyed the thing that actually builds trust in a system like this: being able to look back
// and see whether it was right. "You said March would be heavy — it was" is worth more than any
// amount of copy claiming accuracy.
//
// Stored per identity (never shared across users), capped, and entirely on-device.

import type { Energy } from '@aura/engine';

export interface SavedReading {
  /** ISO day the reading was for. One entry per day; re-opening the same day updates it. */
  day: string;
  savedAt: number;
  headline: string;
  majorEnergy: Energy;
  passingEnergy: Energy;
  remedy: string;
  /** What the user said about it afterwards — the honest feedback loop. */
  verdict?: 'right' | 'off' | null;
  note?: string;
}

const KEY = (identity: string): string => `aura.history.${identity}`;
const MAX = 120; // ~4 months of daily readings; plenty to spot a pattern, small enough to store

function read(identity: string): SavedReading[] {
  try {
    const raw = localStorage.getItem(KEY(identity));
    return raw ? (JSON.parse(raw) as SavedReading[]) : [];
  } catch { return []; }
}

function write(identity: string, list: SavedReading[]): void {
  try { localStorage.setItem(KEY(identity), JSON.stringify(list.slice(-MAX))); } catch { /* quota */ }
}

export function loadHistory(identity: string): SavedReading[] {
  return read(identity).sort((a, b) => b.day.localeCompare(a.day)); // newest first
}

/** Record today's reading. Idempotent per day, so opening the app twice doesn't duplicate it. */
export function recordReading(identity: string, r: Omit<SavedReading, 'savedAt' | 'verdict' | 'note'>): void {
  const list = read(identity);
  const existing = list.findIndex((x) => x.day === r.day);
  const entry: SavedReading = { ...r, savedAt: Date.now(), ...(existing >= 0 ? { verdict: list[existing]!.verdict, note: list[existing]!.note } : {}) };
  if (existing >= 0) list[existing] = entry; else list.push(entry);
  write(identity, list.sort((a, b) => a.day.localeCompare(b.day)));
}

/** Mark a past reading right or off. This is the only honest way to measure the thing. */
export function setVerdict(identity: string, day: string, verdict: 'right' | 'off' | null, note?: string): void {
  const list = read(identity);
  const i = list.findIndex((x) => x.day === day);
  if (i < 0) return;
  list[i] = { ...list[i]!, verdict, ...(note !== undefined ? { note } : {}) };
  write(identity, list);
}

export interface HistoryStats { total: number; rated: number; right: number; accuracy: number | null; streakDays: number }

/** Simple, honest numbers — no inflation, and null accuracy until there's something to measure. */
export function historyStats(list: SavedReading[]): HistoryStats {
  const rated = list.filter((r) => r.verdict === 'right' || r.verdict === 'off');
  const right = rated.filter((r) => r.verdict === 'right').length;

  // Consecutive days ending today (or yesterday, so an unopened today doesn't break a run).
  const days = new Set(list.map((r) => r.day));
  const oneDay = 86_400_000;
  let streak = 0;
  const start = new Date();
  if (!days.has(start.toISOString().slice(0, 10))) start.setTime(start.getTime() - oneDay);
  for (let t = start.getTime(); ; t -= oneDay) {
    if (!days.has(new Date(t).toISOString().slice(0, 10))) break;
    streak++;
  }

  return {
    total: list.length,
    rated: rated.length,
    right,
    accuracy: rated.length ? Math.round((right / rated.length) * 100) : null,
    streakDays: streak,
  };
}

export function clearHistory(identity: string): void {
  try { localStorage.removeItem(KEY(identity)); } catch { /* ignore */ }
}
