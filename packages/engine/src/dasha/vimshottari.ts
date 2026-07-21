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

/** The nine Mahadasha spans of one full 120-year cycle from the first maha. */
function mahaSpans(moonLong: number, birthMs: number, opts: DashaOptions): Span[] {
  const lord = startingMahaLord(moonLong);
  const order = orderFrom(lord);
  const spans: Span[] = [];
  let cursor = firstMahaStartMs(moonLong, birthMs, opts);
  for (const g of order) {
    const years = VIMSHOTTARI_YEARS[g];
    const len = years * yearMs(opts);
    spans.push({ lord: g, startMs: cursor, endMs: cursor + len, years });
    cursor += len;
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
