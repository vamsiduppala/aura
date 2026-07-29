// The court: who rules the chart right now, at all five speeds, and how much of
// each term has run. Everything here is derived from the real chart — the Moon's
// sidereal longitude and the birth instant — by the golden-tested arithmetic in
// @aura/engine. Nothing on this path is authored, sampled or approximated.

import { getCourtAt, nextPeriodAt, getPeriodsAt } from '@aura/engine';
import type { BirthData, Chart, DashaLevel, DashaPeriod, Graha } from '@aura/engine';
import { OFFICES, officeByLevel, type OfficeMeta } from '../theme/tokens';

// ---------------------------------------------------------------------------
// Birth-time confidence — the gate on everything the app is allowed to claim
// ---------------------------------------------------------------------------

/**
 * One minute of birth-time error offsets EVERY boundary in the 120-year tree by up
 * to five days, and the error never averages out — it does not shrink as you go
 * deeper, it stays the same absolute size while the periods get shorter. Hence the
 * gate below. It is arithmetic, not caution.
 *
 * | uncertainty | shift in every boundary (Venus 20y) | (Sun 6y) |
 * | ±1 min      | ±5.0 days                           | ±1.5 d   |
 * | ±15 min     | ±75 days                            | ±23 d    |
 * | ±1 hour     | ±301 days                           | ±90 d    |
 */
export type BirthTimeConfidence = 'exact' | 'within15min' | 'within1hour' | 'unknown';

export type RingVisibility = 'solid' | 'approximate' | 'hidden';

export const CONFIDENCE_LABEL: Record<BirthTimeConfidence, string> = {
  exact: 'To the minute — I have a certificate',
  within15min: 'Within about 15 minutes',
  within1hour: 'Within about an hour',
  unknown: "I don't know",
};

/** The live preview line under the confidence selector, so the trade-off is visible. */
export const CONFIDENCE_EFFECT: Record<BirthTimeConfidence, string> = {
  exact: "You'll see all five rulers. The Messenger stays marked approximate.",
  within15min: 'The Messenger stays hidden; the Magistrate is marked approximate.',
  within1hour: 'Messenger and Magistrate stay hidden; the Governor is approximate.',
  unknown: "We'll show the King, and mark your Prime Minister approximate.",
};

/**
 * What each office may claim, given how well we know the birth time. Enforced in the
 * UI, in notifications, and in the mentor's system prompt — one function, everywhere.
 *
 * The Messenger is never solid: even a to-the-minute certificate carries ±5 days of
 * drift, which is longer than a Messenger term. Ship the ring, never build on it.
 */
export function visibilityFor(level: number, c: BirthTimeConfidence): RingVisibility {
  switch (c) {
    case 'exact':
      return level <= 4 ? 'solid' : 'approximate';
    case 'within15min':
      if (level <= 3) return 'solid';
      return level === 4 ? 'approximate' : 'hidden';
    case 'within1hour':
      if (level <= 2) return 'solid';
      return level === 3 ? 'approximate' : 'hidden';
    case 'unknown':
      if (level === 1) return 'solid';
      return level === 2 ? 'approximate' : 'hidden';
  }
}

/** The deepest office we may state as fact. Commercially safe layer: 1 and 2. */
export function deepestTrustworthy(c: BirthTimeConfidence): OfficeMeta {
  const level = c === 'exact' ? 4 : c === 'within15min' ? 3 : c === 'within1hour' ? 2 : 1;
  return officeByLevel(level);
}

/** Why a ring is dimmed, in the user's words. */
export function approximateNote(c: BirthTimeConfidence): string {
  switch (c) {
    case 'exact': return 'Even an exact birth time drifts by days at this speed.';
    case 'within15min': return 'Based on a birth time accurate to about 15 minutes.';
    case 'within1hour': return 'Based on a birth time accurate to about an hour.';
    case 'unknown': return 'Based on a placeholder birth time of noon.';
  }
}

// ---------------------------------------------------------------------------
// The birth instant
// ---------------------------------------------------------------------------

/**
 * The birth moment as a real UTC instant. The stored offset is the one that was in
 * force at the birthplace *on the birth date* — India ran wartime DST 1942–45, and
 * using today's offset instead costs up to ten months of drift.
 *
 * An unknown time resolves to local noon: the King and Prime Minister survive that,
 * which is exactly what the confidence gate then permits.
 */
export function birthInstantUTC(birth: BirthData): Date {
  const time = birth.unknownTime || !birth.time ? '12:00' : birth.time;
  const wallAsUTC = Date.parse(`${birth.date}T${time}:00.000Z`);
  return new Date(wallAsUTC - birth.tzOffsetMinutes * 60_000);
}

// ---------------------------------------------------------------------------
// The court
// ---------------------------------------------------------------------------

export interface CourtSeat {
  meta: OfficeMeta;
  lord: Graha;
  start: Date;
  end: Date;
  /** 0..1 elapsed of THIS period — never of absolute time. The ring fill. */
  progress: number;
  remainingMs: number;
  totalMs: number;
  visibility: RingVisibility;
}

/** The five seats at `at`, King first. Empty only if `at` falls outside the tree. */
export function courtAt(chart: Chart, at: Date, confidence: BirthTimeConfidence): CourtSeat[] {
  const moonLong = chart.planets.moon.siderealLong;
  const birth = birthInstantUTC(chart.birth);
  const periods = getCourtAt(moonLong, birth, at);
  return periods.map((p, i) => toSeat(p, officeByLevel(i + 1), at, confidence));
}

function toSeat(
  p: DashaPeriod, meta: OfficeMeta, at: Date, confidence: BirthTimeConfidence,
): CourtSeat {
  const totalMs = p.end.getTime() - p.start.getTime();
  const elapsed = at.getTime() - p.start.getTime();
  return {
    meta,
    lord: p.lord,
    start: p.start,
    end: p.end,
    progress: totalMs > 0 ? Math.min(1, Math.max(0, elapsed / totalMs)) : 0,
    remainingMs: Math.max(0, p.end.getTime() - at.getTime()),
    totalMs,
    visibility: visibilityFor(meta.level, confidence),
  };
}

/**
 * The court ordered for display: fastest first (Messenger → King), matching the rings
 * read outside-in — so dragging a finger inward across the wheel and scanning the
 * table downward trace the same path. Hidden seats are dropped, not greyed.
 */
export function courtFastestFirst(seats: CourtSeat[]): CourtSeat[] {
  return [...seats].reverse().filter((s) => s.visibility !== 'hidden');
}

/**
 * The next handover at `level`, i.e. who takes office and when. Level 2 (Prime
 * Minister) is the one worth a countdown: the King's turn is a decade out and useless
 * as a clock, the Governor's is already inside the current stack.
 */
export function nextTurn(
  chart: Chart, at: Date, level: DashaLevel = 'antar',
): { outgoing: CourtSeat; incoming: DashaPeriod } | null {
  const moonLong = chart.planets.moon.siderealLong;
  const birth = birthInstantUTC(chart.birth);
  const periods = getCourtAt(moonLong, birth, at);
  const idx = OFFICES.findIndex((o) => o.dashaLevel === level);
  const current = periods[idx];
  if (!current) return null;
  const incoming = nextPeriodAt(moonLong, birth, level, at);
  if (!incoming) return null;
  return {
    outgoing: toSeat(current, officeByLevel(idx + 1), at, 'exact'),
    incoming,
  };
}

/**
 * Periods at `level` overlapping the window — this is what cuts a plan into stages.
 * The stage count is whatever this returns: 2 to 9, never padded to five.
 */
export function periodsBetween(
  chart: Chart, level: DashaLevel, from: Date, to: Date,
): DashaPeriod[] {
  return getPeriodsAt(
    chart.planets.moon.siderealLong, birthInstantUTC(chart.birth), level, from, to,
  );
}

/**
 * Picks the daśā level that cuts the window into 3–6 stages, so a pipeline reads
 * well, and never goes deeper than the birth time can support.
 */
export function chooseCutLevel(
  chart: Chart, from: Date, to: Date, confidence: BirthTimeConfidence,
): DashaLevel {
  const deepest = deepestTrustworthy(confidence).level;
  // Level 1 terms are 6–20 years — never a plan horizon. Start at Prime Minister.
  const candidates = OFFICES
    .filter((o) => o.level >= 2 && o.level <= Math.max(2, deepest))
    .map((o) => o.dashaLevel);
  let best = candidates[0]!;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const level of candidates) {
    const n = periodsBetween(chart, level, from, to).length;
    const score = n < 3 ? (3 - n) * 2 : n > 6 ? n - 6 : 0;
    if (score < bestScore) { bestScore = score; best = level; }
  }
  return best;
}
