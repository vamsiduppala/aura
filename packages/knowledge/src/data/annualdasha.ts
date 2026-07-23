// ─────────────────────────────────────────────────────────────────────────────
// Annual (Tajaka) dasas — Ch 30. Mudda dasa (Varsha Vimsottari): Vimsottari compressed to
// a 360-solar-day year (dasa years × 3 = days). The first dasa is set by the Mudda number
// of the natal Moon-nakshatra lord + completed years. Patyayini dasa (30.3): the year's days
// split between lagna + the 7 planets in the ratio of their "patyamsas" (gaps between their
// sorted degrees-within-sign). Both verified vs the book's Example 122 / Table 75.
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';
import { nakshatraLord, dashaSequence, VIMSHOTTARI_YEARS } from './vimshottari.js';
import { muntha } from './tajaka.js';
import { narayanaProgression } from './narayana.js';

/** Mudda numbering order (1=Sun … 9=Venus) used to pick the first Varsha Vimsottari dasa. */
export const MUDDA_ORDER: Graha[] = ['sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury', 'ketu', 'venus'];

/** Days of a planet's Mudda (Varsha Vimsottari) dasa = its Vimsottari years × 3 (120y → 360 days). */
export const muddaDays = (g: Graha): number => VIMSHOTTARI_YEARS[g] * 3;

export interface MuddaSpan { lord: Graha; days: number }
export interface MuddaResult {
  firstDasa: Graha;
  balanceDays: number;              // days of the first dasa remaining at the year's start
  sequence: MuddaSpan[];            // the 9 dasas in order, each with its day-length
}

/**
 * Mudda dasa for a solar-return year. `moonLong` = natal Moon's sidereal longitude,
 * `completedYears` = years of life completed at the year's start.
 */
export function muddaDasa(moonLong: number, completedYears: number): MuddaResult {
  const span = 360 / 27;
  const L = ((moonLong % 360) + 360) % 360;
  const nak = Math.floor(L / span);
  const num = MUDDA_ORDER.indexOf(nakshatraLord(nak)) + 1; // 1..9
  const n = ((num + completedYears - 1) % 9 + 9) % 9 + 1;   // 1..9 (0 → 9)
  const firstDasa = MUDDA_ORDER[n - 1]!;
  const fractionLeft = 1 - (L - nak * span) / span;
  return {
    firstDasa,
    balanceDays: fractionLeft * muddaDays(firstDasa),
    sequence: dashaSequence(firstDasa).map((lord) => ({ lord, days: muddaDays(lord) })),
  };
}

// ── Patyayini Dasa (30.3) ─────────────────────────────────────────────────────

/** The length of a tropical/solar year in days — the total Patyayini dasa splits. */
export const PATYAYINI_YEAR_DAYS = 365.2425;

/** The dasa "lords" in Patyayini: the seven classical planets and the lagna (no shadow points). */
export type PatyayiniToken = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn' | 'lagna';
const PATYAYINI_BODIES: PatyayiniToken[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'lagna'];

export interface PatyayiniSpan {
  lord: PatyayiniToken;
  krisamsa: number;   // degrees the body has advanced within its sign (0..30)
  patyamsa: number;   // its gap above the body just below it in sorted order
  fraction: number;   // patyamsa / (largest krisamsa)
  days: number;       // fraction × 365.2425
}

export interface PatyayiniAntar { lord: PatyayiniToken; days: number }

/**
 * Patyayini dasa (30.3) for a Tajaka chart. `longitudes` gives the sidereal longitude (0..360) of
 * the lagna and the seven planets. The bodies are sorted by their degree-within-sign (krisamsa);
 * each one's patyamsa is the gap to the body just below it (the lowest keeps its own krisamsa), and
 * the year's days are shared in the ratio of patyamsas. Returns the dasas in ascending-krisamsa order.
 */
export function patyayiniDasa(longitudes: Record<PatyayiniToken, number>): PatyayiniSpan[] {
  const entries = PATYAYINI_BODIES
    .map((t) => ({ lord: t, krisamsa: (((longitudes[t] % 30) + 30) % 30) }))
    .sort((a, b) => a.krisamsa - b.krisamsa);
  const sum = entries[entries.length - 1]!.krisamsa; // = the largest krisamsa (the patyamsas telescope)
  return entries.map((e, i) => {
    const patyamsa = i === 0 ? e.krisamsa : e.krisamsa - entries[i - 1]!.krisamsa;
    const fraction = sum === 0 ? 0 : patyamsa / sum;
    return { lord: e.lord, krisamsa: e.krisamsa, patyamsa, fraction, days: PATYAYINI_YEAR_DAYS * fraction };
  });
}

/**
 * Antardasas within a Patyayini dasa (30.3): the same cyclic order and ratios, beginning with the
 * dasa lord itself. Each antardasa's length is the dasa's length × that sub-lord's overall fraction.
 */
export function patyayiniAntardasas(spans: PatyayiniSpan[], dasaLord: PatyayiniToken): PatyayiniAntar[] {
  const idx = spans.findIndex((s) => s.lord === dasaLord);
  if (idx < 0) return [];
  const dasaDays = spans[idx]!.days;
  return spans.map((_, k) => {
    const sub = spans[(idx + k) % spans.length]!;
    return { lord: sub.lord, days: dasaDays * sub.fraction };
  });
}

// ── Varsha Narayana Dasa (30.5) ───────────────────────────────────────────────

export interface VarshaNarayanaResult {
  munthaLagna: number;   // the annual progressed ascendant (muntha), used as the chart's lagna
  progression: number[]; // the 12-rasi Varsha Narayana dasa order from the seed
}

/**
 * Varsha Narayana dasa (30.5) — the Narayana rasi-dasa of a Tajaka annual chart, "the best dasa
 * for annual charts". Its link to the natal chart is that the muntha (the natal lagna progressed
 * one rasi per year of life) is taken as the lagna; from there it runs as an ordinary Narayana
 * dasa from the strength-based `seedSign` the caller determines (the stronger of the relevant
 * lord's signs), with the same Saturn/Ketu seed exceptions. `yearNumber` = the year of life lived.
 */
export function varshaNarayanaDasa(
  natalLagnaSign: number, yearNumber: number, seedSign: number,
  opts: { hasSaturn?: boolean; hasKetu?: boolean } = {},
): VarshaNarayanaResult {
  return {
    munthaLagna: muntha(natalLagnaSign, yearNumber),
    progression: narayanaProgression(seedSign, opts.hasSaturn, opts.hasKetu),
  };
}
