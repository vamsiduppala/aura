// ─────────────────────────────────────────────────────────────────────────────
// Vimshottari Dasha engine (SPEC §4.4) — the spine of all "when" logic.
//
// Given the Moon's sidereal longitude and the birth moment, produce the 5-level
// period tree (Maha → Antar → Pratyantar → Sookshma → Prana). The arithmetic is
// exact and golden-tested independent of any ephemeris.
// ─────────────────────────────────────────────────────────────────────────────

import {
  NAKSHATRAS, NAKSHATRA_ARC, VIMSHOTTARI_ORDER, VIMSHOTTARI_YEARS,
  VIMSHOTTARI_TOTAL,
} from '../constants.js';
import { norm360 } from '../astro/angles.js';
import type { DashaLevel, DashaNode, DashaPeriod, DashaStack, Graha } from '../types.js';

const LEVELS: DashaLevel[] = ['maha', 'antar', 'pratyantar', 'sookshma', 'prana'];

export interface DashaOptions {
  /** Days per dasha-year (SPEC §4.4). Default 365.25. */
  yearLengthDays: number;
}

const DEFAULT_OPTS: DashaOptions = { yearLengthDays: 365.25 };

// ─────────────────────────────────────────────────────────────────────────────
// Integer microsecond arithmetic
//
// All internal arithmetic is INTEGER MICROSECONDS since the epoch. Float days or
// float milliseconds accumulate error through five levels of nesting, and the
// symptom is an off-by-hours prana dasha that no test written at the maha level
// will ever catch.
//
// A JS `number` holds integers exactly to 2^53 ≈ 9.0e15. Microseconds since epoch
// reach 4.1e15 in the year 2100 and 9.0e15 only in 2255, so a plain number is exact
// across every date this app can represent — BigInt would cost speed for nothing.
// `US_SAFE_LIMIT` is asserted against in `spanContaining` so the day that stops
// being true is a loud failure rather than a silent rounding.
// ─────────────────────────────────────────────────────────────────────────────

const US_PER_MS = 1000;
const US_PER_DAY = 86_400_000_000;

/** Beyond this, integer microseconds stop being exactly representable. */
export const US_SAFE_LIMIT = Number.MAX_SAFE_INTEGER;

/** Integer microseconds per dasha-year. 365.25 × 86_400_000_000 is exact. */
function yearUs(opts: DashaOptions): number {
  return Math.round(opts.yearLengthDays * US_PER_DAY);
}

const msToUs = (ms: number): number => Math.round(ms * US_PER_MS);
/** Microseconds back to a Date. Dates carry milliseconds, so this is the one
 *  deliberate narrowing — the exact value stays available as `startUs`/`endUs`. */
const usToDate = (us: number): Date => new Date(Math.round(us / US_PER_MS));

/** Vimshottari order rotated to start at `lord`. */
function orderFrom(lord: Graha): Graha[] {
  const i = VIMSHOTTARI_ORDER.indexOf(lord);
  return [...VIMSHOTTARI_ORDER.slice(i), ...VIMSHOTTARI_ORDER.slice(0, i)];
}

/** Nakshatra index 0..26 of a sidereal longitude. */
export function nakshatraOf(moonLong: number): number {
  return Math.floor(norm360(moonLong) / NAKSHATRA_ARC);
}

/** Pada 1..4 within the nakshatra. */
export function padaOf(moonLong: number): number {
  const within = norm360(moonLong) % NAKSHATRA_ARC;
  return Math.floor(within / (NAKSHATRA_ARC / 4)) + 1;
}

/** Fraction [0,1) already elapsed through the Moon's nakshatra at birth. */
export function nakshatraElapsedFraction(moonLong: number): number {
  const within = norm360(moonLong) % NAKSHATRA_ARC;
  return within / NAKSHATRA_ARC;
}

/** The starting Mahadasha lord = lord of the Moon's nakshatra. */
export function startingMahaLord(moonLong: number): Graha {
  return NAKSHATRAS[nakshatraOf(moonLong)]!.lord;
}

/** Start instant (µs) of the first Mahadasha — birth minus the elapsed portion. */
function firstMahaStartUs(moonLong: number, birthUs: number, opts: DashaOptions): number {
  const lord = startingMahaLord(moonLong);
  const elapsedYears = VIMSHOTTARI_YEARS[lord] * nakshatraElapsedFraction(moonLong);
  return birthUs - Math.round(elapsedYears * yearUs(opts));
}

interface Span { lord: Graha; startUs: number; endUs: number; years: number; }

/** Vimshottari repeats every 120 years; generate this many cycles so forecasts and
 *  old charts never fall off the end of the timeline. 2 cycles = 240 years. */
const MAHA_CYCLES = 2;

/** The Mahadasha spans from the first maha, across MAHA_CYCLES full 120-year cycles. */
function mahaSpans(moonLong: number, birthUs: number, opts: DashaOptions): Span[] {
  const lord = startingMahaLord(moonLong);
  const order = orderFrom(lord);
  const uy = yearUs(opts);
  const spans: Span[] = [];
  let cursor = firstMahaStartUs(moonLong, birthUs, opts);
  for (let cycle = 0; cycle < MAHA_CYCLES; cycle++) {
    for (const g of order) {
      const years = VIMSHOTTARI_YEARS[g];
      // Integer years × integer µs-per-year: exact, no rounding at this level.
      const len = years * uy;
      spans.push({ lord: g, startUs: cursor, endUs: cursor + len, years });
      cursor += len;
    }
  }
  return spans;
}

/**
 * Sub-spans of a parent span at the next level.
 *
 * Boundaries are computed from the parent's start against the CUMULATIVE year total,
 * not by accumulating nine child lengths. That matters: cumulative years reach exactly
 * 120 at the ninth child, so the last boundary lands on `parent.endUs` **by
 * construction**. Children therefore sum to the parent to the microsecond, with the
 * last one absorbing whatever rounding occurred, and there is no fix-up step that a
 * later refactor could quietly drop.
 *
 * Half-open `[startUs, endUs)` throughout: a boundary instant belongs to the period
 * that is starting, never to the one that is ending, so a timestamp resolves to
 * exactly one period at every level.
 */
function subSpans(parent: Span, opts: DashaOptions): Span[] {
  void opts; // sub-periods are pure ratios of the parent; the year length is already in it
  const order = orderFrom(parent.lord);
  const parentLen = parent.endUs - parent.startUs;
  const out: Span[] = [];
  let cumYears = 0;
  let boundary = parent.startUs;
  for (const g of order) {
    const startUs = boundary;
    cumYears += VIMSHOTTARI_YEARS[g];
    boundary = parent.startUs + Math.round((parentLen * cumYears) / VIMSHOTTARI_TOTAL);
    out.push({
      lord: g,
      startUs,
      endUs: boundary,
      years: (parent.years * VIMSHOTTARI_YEARS[g]) / VIMSHOTTARI_TOTAL,
    });
  }
  return out;
}

/** Span containing `us` (assumes contiguous ordered spans). Half-open on the right. */
function spanContaining(spans: Span[], us: number): Span | undefined {
  if (!Number.isFinite(us) || Math.abs(us) > US_SAFE_LIMIT) {
    throw new RangeError(
      `dasha: ${us} µs is outside the exactly-representable integer range; ` +
      'boundaries could not be computed without silent rounding.',
    );
  }
  return spans.find((s) => us >= s.startUs && us < s.endUs);
}

/**
 * Full stack {maha…prana} active at `date`. Efficient: walks only the containing
 * period at each level (no full-tree build).
 */
export function getStackAt(
  moonLong: number,
  birth: Date,
  date: Date,
  opts: DashaOptions = DEFAULT_OPTS,
): DashaStack | null {
  const us = msToUs(date.getTime());
  let level = mahaSpans(moonLong, msToUs(birth.getTime()), opts);
  let span = spanContaining(level, us);
  if (!span) return null; // outside the computed 120-year cycle
  const lords: Graha[] = [span.lord];
  for (let i = 1; i < LEVELS.length; i++) {
    level = subSpans(span, opts);
    const next = spanContaining(level, us);
    if (!next) return null;
    span = next;
    lords.push(span.lord);
  }
  return {
    maha: lords[0]!, antar: lords[1]!, pratyantar: lords[2]!,
    sookshma: lords[3]!, prana: lords[4]!,
  };
}

/**
 * A span as a public period. `start`/`end` are Dates for every existing caller;
 * `startUs`/`endUs` carry the exact integer microseconds, because a Date silently
 * truncates to milliseconds and a prana boundary deserves better than that.
 */
function toPeriod(s: Span, level: DashaLevel): DashaPeriod {
  return {
    lord: s.lord,
    level,
    start: usToDate(s.startUs),
    end: usToDate(s.endUs),
    startUs: s.startUs,
    endUs: s.endUs,
  };
}

/**
 * The five nested periods active at `at` — maha…prana — each with its own real
 * start and end. `getStackAt` answers *who* rules; this answers *for how long*,
 * which is what a progress ring needs (fill = elapsed ÷ that period's own length).
 *
 * Five arithmetic descents, no full-tree build. Returns [] outside the computed
 * cycles, or a short array if a level can't be resolved.
 */
export function getCourtAt(
  moonLong: number,
  birth: Date,
  at: Date,
  opts: DashaOptions = DEFAULT_OPTS,
): DashaPeriod[] {
  const us = msToUs(at.getTime());
  let spans = mahaSpans(moonLong, msToUs(birth.getTime()), opts);
  let span = spanContaining(spans, us);
  if (!span) return [];
  const out: DashaPeriod[] = [toPeriod(span, 'maha')];
  for (let i = 1; i < LEVELS.length; i++) {
    spans = subSpans(span, opts);
    const next = spanContaining(spans, us);
    if (!next) return out;
    span = next;
    out.push(toPeriod(span, LEVELS[i]!));
  }
  return out;
}

/**
 * The period at `level` that takes over once the one running at `after` ends —
 * i.e. the next handover at that level. Powers "biggest change ahead" countdowns.
 */
export function nextPeriodAt(
  moonLong: number,
  birth: Date,
  level: DashaLevel,
  after: Date,
  opts: DashaOptions = DEFAULT_OPTS,
): DashaPeriod | null {
  const depth = LEVELS.indexOf(level);
  const now = getCourtAt(moonLong, birth, after, opts);
  const current = now[depth];
  if (!current) return null;
  // +1ms lands strictly inside the following period; boundaries are half-open.
  const nextCourt = getCourtAt(moonLong, birth, new Date(current.end.getTime() + 1), opts);
  return nextCourt[depth] ?? null;
}

/**
 * All periods at `level` overlapping [from,to], as DashaPeriod list (ordered).
 * Used to build forecasts.
 */
export function getPeriodsAt(
  moonLong: number,
  birth: Date,
  level: DashaLevel,
  from: Date,
  to: Date,
  opts: DashaOptions = DEFAULT_OPTS,
): DashaPeriod[] {
  const depth = LEVELS.indexOf(level);
  const fromUs = msToUs(from.getTime());
  const toUs = msToUs(to.getTime());
  const out: DashaPeriod[] = [];

  const walk = (span: Span, d: number) => {
    if (span.endUs <= fromUs || span.startUs >= toUs) return; // no overlap
    if (d === depth) {
      out.push(toPeriod(span, level));
      return;
    }
    for (const child of subSpans(span, opts)) walk(child, d + 1);
  };

  for (const m of mahaSpans(moonLong, msToUs(birth.getTime()), opts)) walk(m, 0);
  return out;
}

/** Build the full period tree to `maxLevel` (SPEC: precompute + cache at onboarding). */
export function buildDashaTree(
  moonLong: number,
  birth: Date,
  maxLevel: DashaLevel = 'prana',
  opts: DashaOptions = DEFAULT_OPTS,
): DashaNode[] {
  const maxDepth = LEVELS.indexOf(maxLevel);
  const toNode = (span: Span, depth: number): DashaNode => {
    const node: DashaNode = {
      lord: span.lord,
      level: LEVELS[depth]!,
      start: usToDate(span.startUs).toISOString(),
      end: usToDate(span.endUs).toISOString(),
    };
    if (depth < maxDepth) {
      node.children = subSpans(span, opts).map((c) => toNode(c, depth + 1));
    }
    return node;
  };
  return mahaSpans(moonLong, msToUs(birth.getTime()), opts).map((m) => toNode(m, 0));
}

/** Convenience: the current Mahadasha span (lord + start/end) at a date. */
export function currentMaha(
  moonLong: number, birth: Date, date: Date, opts: DashaOptions = DEFAULT_OPTS,
): DashaPeriod | null {
  const span = spanContaining(
    mahaSpans(moonLong, msToUs(birth.getTime()), opts), msToUs(date.getTime()),
  );
  if (!span) return null;
  return toPeriod(span, 'maha');
}
