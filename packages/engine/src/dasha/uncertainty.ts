// ─────────────────────────────────────────────────────────────────────────────
// Boundary uncertainty (SPEC §3) — the birth-time precision finding, as arithmetic.
//
// The mechanism, stated once so nobody has to rederive it:
//
//   The Moon crosses one nakshatra (13°20') in ~24.29 hours. The FRACTION of that
//   nakshatra already traversed at the birth instant sets the balance of the first
//   mahadasha. Every later boundary is that balance plus a fixed sequence of whole
//   years — so an error in the fraction shifts EVERY boundary in the 120-year tree
//   by the SAME ABSOLUTE AMOUNT.
//
//   shift = (birthTimeError / nakshatraCrossingTime) × startingLordYears
//
// Two consequences that drive the whole product:
//
//   1. The error does not shrink as you go deeper. It stays the same size in days
//      while the periods get shorter — so at prana level (20 min to 5.5 days) the
//      uncertainty is routinely LONGER THAN THE PERIOD ITSELF.
//   2. It does not average out over time. There is no "mostly right" version of a
//      wrong birth time.
//
// This is why the app degrades depth instead of rendering false precision, and why
// the Messenger ring is decorative at every accuracy level including "exact".
// ─────────────────────────────────────────────────────────────────────────────

import {
  NAKSHATRA_CROSSING_DAYS, VIMSHOTTARI_YEARS,
} from '../constants.js';
import { startingMahaLord } from './vimshottari.js';
import type { BirthTimeAccuracy, DashaLevel, Graha } from '../types.js';

const MS_PER_MIN = 60_000;
const MS_PER_DAY = 86_400_000;

/**
 * Half-width of the birth-time error, in minutes, for each stated accuracy.
 *
 * `unknown` is ±12 hours because noon is a placeholder for "somewhere in that day" —
 * not a guess that happens to be central. Saying ±12h out loud is what stops a noon
 * default from being quietly treated as a real time.
 */
export const ACCURACY_MINUTES: Record<BirthTimeAccuracy, number> = {
  exact: 1,
  near_minute: 1,
  within_15m: 15,
  within_hour: 60,
  unknown: 720,
};

export interface UncertaintyInput {
  /** Sidereal longitude of the Moon at birth — this is what fixes the starting lord. */
  moonLong: number;
  accuracy: BirthTimeAccuracy;
  /** Days per dasha-year. Must match the value the tree was built with. */
  yearLengthDays?: number;
  /**
   * Override the half-width in minutes, ignoring `accuracy`. Exists so the published
   * drift table can be asserted at values the accuracy enum doesn't name (±4, ±30 min),
   * and so a rectification flow can search a custom window.
   */
  errorMinutes?: number;
}

/**
 * How far every boundary in the tree could be wrong, in milliseconds (half-width).
 *
 * Reproduces the published table exactly — see the tests, which assert against it:
 *   ±1 min,  Venus start (20y) → ±5.0 days      ±1 min,  Sun start (6y) → ±1.5 days
 *   ±15 min, Venus start       → ±75 days
 *   ±1 hour, Venus start       → ±301 days
 */
export function boundaryUncertaintyMs(input: UncertaintyInput): number {
  const { moonLong, accuracy, yearLengthDays = 365.25 } = input;
  const lord = startingMahaLord(moonLong);
  const lordYears = VIMSHOTTARI_YEARS[lord];
  const minutes = input.errorMinutes ?? ACCURACY_MINUTES[accuracy];
  const errorDays = (minutes * MS_PER_MIN) / MS_PER_DAY;
  // A fraction of the nakshatra crossing scales directly into a fraction of the
  // starting lord's whole term.
  const shiftYears = (errorDays / NAKSHATRA_CROSSING_DAYS) * lordYears;
  return shiftYears * yearLengthDays * MS_PER_DAY;
}

/** Same value in days, which is the unit humans actually reason about here. */
export const boundaryUncertaintyDays = (input: UncertaintyInput): number =>
  boundaryUncertaintyMs(input) / MS_PER_DAY;

/**
 * Is a period long enough to survive its own boundary uncertainty?
 *
 * The test is not "is the uncertainty small" but "is it small RELATIVE TO THIS PERIOD".
 * A ±5 day uncertainty is a rounding error on a 20-year mahadasha and complete fiction
 * on a 4-hour pranadasha. `ratio` is uncertainty ÷ period length:
 *
 *   < 0.1   trustworthy — state the dates
 *   < 0.5   approximate — state them with the ± attached
 *   >= 0.5  fiction     — the boundary could be anywhere in the period; do not show it
 */
export function boundaryConfidence(
  periodLengthMs: number, uncertaintyMs: number,
): { ratio: number; verdict: 'trustworthy' | 'approximate' | 'fiction' } {
  const ratio = periodLengthMs > 0 ? uncertaintyMs / periodLengthMs : Number.POSITIVE_INFINITY;
  const verdict = ratio < 0.1 ? 'trustworthy' : ratio < 0.5 ? 'approximate' : 'fiction';
  return { ratio, verdict };
}

/** "±3 days", "±5 hours", "±12 minutes" — for rendering next to a boundary date. */
export function formatUncertainty(ms: number): string {
  const days = ms / MS_PER_DAY;
  if (days >= 1.5) return `±${Math.round(days)} days`;
  const hours = ms / 3_600_000;
  if (hours >= 1.5) return `±${Math.round(hours)} hours`;
  const mins = Math.max(1, Math.round(ms / MS_PER_MIN));
  return `±${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// M19 — engine versioning and drift
// ─────────────────────────────────────────────────────────────────────────────

export interface BoundaryDrift {
  level: DashaLevel;
  lord: Graha;
  /** Signed shift of this period's start, in milliseconds. */
  shiftMs: number;
}

export interface DriftReport {
  /** The largest absolute shift found, in milliseconds. */
  maxShiftMs: number;
  /** Only the boundaries that moved past the threshold. */
  moved: BoundaryDrift[];
  /** True when a user should be told. Below the threshold, silence is correct. */
  notify: boolean;
}

/**
 * Diff two computations of the same chart — the M19 path for when the engine changes.
 *
 * Bump `ENGINE_VERSION`, recompute, call this, and notify **only** the users whose
 * boundaries actually moved. The default threshold is 6 hours because that is the
 * point at which a date can visibly change for someone in any timezone; below it the
 * shift is invisible and a notification would be noise about nothing.
 *
 * The two lists must describe the same levels in the same order — pass two
 * `getCourtAt` results, not two arbitrary period sets.
 */
export function boundaryDrift(
  before: readonly { level: DashaLevel; lord: Graha; start: Date }[],
  after: readonly { level: DashaLevel; lord: Graha; start: Date }[],
  thresholdMs = 6 * 3_600_000,
): DriftReport {
  const moved: BoundaryDrift[] = [];
  let maxShiftMs = 0;
  const n = Math.min(before.length, after.length);
  for (let i = 0; i < n; i++) {
    const b = before[i]!;
    const a = after[i]!;
    const shiftMs = a.start.getTime() - b.start.getTime();
    const abs = Math.abs(shiftMs);
    if (abs > maxShiftMs) maxShiftMs = abs;
    if (abs >= thresholdMs) moved.push({ level: a.level, lord: a.lord, shiftMs });
  }
  // A level appearing or disappearing is itself a change worth surfacing.
  const lengthChanged = before.length !== after.length;
  return { maxShiftMs, moved, notify: moved.length > 0 || lengthChanged };
}
