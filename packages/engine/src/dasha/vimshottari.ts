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

/** ms per dasha-year. */
function yearMs(opts: DashaOptions): number {
  return opts.yearLengthDays * 86400_000;
}

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

/** Start instant (ms) of the first Mahadasha — birth minus the elapsed portion. */
function firstMahaStartMs(moonLong: number, birthMs: number, opts: DashaOptions): number {
  const lord = startingMahaLord(moonLong);
  const elapsedYears = VIMSHOTTARI_YEARS[lord] * nakshatraElapsedFraction(moonLong);
  return birthMs - elapsedYears * yearMs(opts);
}

interface Span { lord: Graha; startMs: number; endMs: number; years: number; }

/** Vimshottari repeats every 120 years; generate this many cycles so forecasts and
 *  old charts never fall off the end of the timeline. 2 cycles = 240 years. */
const MAHA_CYCLES = 2;

/** The Mahadasha spans from the first maha, across MAHA_CYCLES full 120-year cycles. */
function mahaSpans(moonLong: number, birthMs: number, opts: DashaOptions): Span[] {
  const lord = startingMahaLord(moonLong);
  const order = orderFrom(lord);
  const spans: Span[] = [];
  let cursor = firstMahaStartMs(moonLong, birthMs, opts);
  for (let cycle = 0; cycle < MAHA_CYCLES; cycle++) {
    for (const g of order) {
      const years = VIMSHOTTARI_YEARS[g];
      const len = years * yearMs(opts);
      spans.push({ lord: g, startMs: cursor, endMs: cursor + len, years });
      cursor += len;
    }
  }
  return spans;
}

/** Sub-spans of a parent span at the next level. */
function subSpans(parent: Span, opts: DashaOptions): Span[] {
  const order = orderFrom(parent.lord);
  const parentLen = parent.endMs - parent.startMs;
  const out: Span[] = [];
  let cursor = parent.startMs;
  for (const g of order) {
    const frac = VIMSHOTTARI_YEARS[g] / VIMSHOTTARI_TOTAL;
    const len = parentLen * frac;
    out.push({
      lord: g,
      startMs: cursor,
      endMs: cursor + len,
      years: parent.years * frac,
    });
    cursor += len;
  }
  return out;
}

/** Span at `spans` containing `ms` (assumes contiguous ordered spans). */
function spanContaining(spans: Span[], ms: number): Span | undefined {
  return spans.find((s) => ms >= s.startMs && ms < s.endMs);
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
  const ms = date.getTime();
  let level = mahaSpans(moonLong, birth.getTime(), opts);
  let span = spanContaining(level, ms);
  if (!span) return null; // outside the computed 120-year cycle
  const lords: Graha[] = [span.lord];
  for (let i = 1; i < LEVELS.length; i++) {
    level = subSpans(span, opts);
    const next = spanContaining(level, ms);
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
  const ms = at.getTime();
  let spans = mahaSpans(moonLong, birth.getTime(), opts);
  let span = spanContaining(spans, ms);
  if (!span) return [];
  const toPeriod = (s: Span, level: DashaLevel): DashaPeriod => ({
    lord: s.lord, level, start: new Date(s.startMs), end: new Date(s.endMs),
  });
  const out: DashaPeriod[] = [toPeriod(span, 'maha')];
  for (let i = 1; i < LEVELS.length; i++) {
    spans = subSpans(span, opts);
    const next = spanContaining(spans, ms);
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
  const fromMs = from.getTime();
  const toMs = to.getTime();
  const out: DashaPeriod[] = [];

  const walk = (span: Span, d: number) => {
    if (span.endMs <= fromMs || span.startMs >= toMs) return; // no overlap
    if (d === depth) {
      out.push({
        lord: span.lord, level,
        start: new Date(span.startMs), end: new Date(span.endMs),
      });
      return;
    }
    for (const child of subSpans(span, opts)) walk(child, d + 1);
  };

  for (const m of mahaSpans(moonLong, birth.getTime(), opts)) walk(m, 0);
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
      start: new Date(span.startMs).toISOString(),
      end: new Date(span.endMs).toISOString(),
    };
    if (depth < maxDepth) {
      node.children = subSpans(span, opts).map((c) => toNode(c, depth + 1));
    }
    return node;
  };
  return mahaSpans(moonLong, birth.getTime(), opts).map((m) => toNode(m, 0));
}

/** Convenience: the current Mahadasha span (lord + start/end) at a date. */
export function currentMaha(
  moonLong: number, birth: Date, date: Date, opts: DashaOptions = DEFAULT_OPTS,
): DashaPeriod | null {
  const span = spanContaining(mahaSpans(moonLong, birth.getTime(), opts), date.getTime());
  if (!span) return null;
  return { lord: span.lord, level: 'maha', start: new Date(span.startMs), end: new Date(span.endMs) };
}
