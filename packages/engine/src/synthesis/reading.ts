// ─────────────────────────────────────────────────────────────────────────────
// Five-beat synthesis (Tier 5, SPEC §6.1). Blends the two active energies the way
// the mockup does: gift + move from the MAJOR season (the enduring strength), trap
// + watch from the PASSING energy (the current friction), remedy for the strained
// energy. Variant choice is deterministic per (chart, day, beat) — stable within a
// day, fresh across days and across people. No jargon ever reaches these strings.
// ─────────────────────────────────────────────────────────────────────────────

import type { Energy, LifeArea, Reading, ReadingInput } from '../types.js';
import { CONTENT } from '../content/templates.js';
import { ENERGY_META } from '../constants.js';

/** FNV-1a string hash → non-negative int, for deterministic variant selection. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick<T>(arr: readonly T[], seed: string): T {
  return arr[hash(seed) % arr.length]!;
}

/** Best area-specialised move, falling back to the generic move line. */
function moveFor(energy: Energy, area: LifeArea | undefined, seed: string): string {
  const c = CONTENT[energy];
  if (area && c.moveByArea?.[area]?.length) return pick(c.moveByArea[area]!, seed);
  return pick(c.move, seed);
}

function blendNote(major: Energy, passing: Energy, seed: string): string {
  const M = ENERGY_META[major].label;
  const P = ENERGY_META[passing].label;
  const options = [
    `In your ${M} season, this ${P} stretch isn’t the whole story — it’s weather moving through a longer build.`,
    `Your ${M} season is the ground under this. The ${P} energy is passing through; let it inform you, not define you.`,
    `This sits inside your ${M} season — momentum, not a finish line. Read the ${P} pull as texture, not the verdict.`,
  ];
  return pick(options, seed);
}

export interface ReadingOptions {
  /** The user's stated goal area (from onboarding). Steers the "move". */
  goalArea?: LifeArea;
}

/**
 * The daily five-beat reading for a computed ReadingInput.
 * @param dateISO the day being read, for deterministic seeding + date stamping
 * @param chartSeed a per-chart stable value (e.g. lagnaLong) so different people differ
 */
/** A short signature of the optional check-in, so a check-in visibly re-tunes the copy. */
function checkinSig(input: ReadingInput): string {
  if (!input.checkin) return '';
  return `|${input.checkin.mood ?? ''}:${input.checkin.focus ?? ''}`;
}

export function generateReading(
  input: ReadingInput,
  dateISO: string,
  chartSeed: number,
  opts: ReadingOptions = {},
): Reading {
  const major = input.majorEnergy;
  const passing = input.passingEnergy;
  const base = `${Math.round(chartSeed * 1000)}|${dateISO}${checkinSig(input)}`;
  const area = input.checkin?.focus ?? opts.goalArea ?? input.dominantAreas[0];

  const gift = pick(CONTENT[major].gift, `${base}|gift`);
  const trap = pick(CONTENT[passing].trap, `${base}|trap`);
  const move = moveFor(major, area, `${base}|move`);
  const watch = pick(CONTENT[passing].watch, `${base}|watch`);
  const remedy = pick(CONTENT[passing].remedies, `${base}|remedy`);
  const headline = pick(CONTENT[major].headlines, `${base}|head`);

  return {
    headline,
    gift,
    trap,
    move,
    watch,
    remedy,
    blendNote: blendNote(major, passing, `${base}|blend`),
    energy: major,
    passingEnergy: passing,
  };
}

/** The one-liner for the Today/home screen — the passing energy's texture. */
export function generateTodayLine(input: ReadingInput, dateISO: string, chartSeed: number): string {
  return pick(CONTENT[input.passingEnergy].headlines, `${Math.round(chartSeed * 1000)}|${dateISO}${checkinSig(input)}|today`);
}

/** The Today-screen short remedy pill text. */
export function generateRemedyShort(input: ReadingInput, dateISO: string, chartSeed: number): string {
  return pick(CONTENT[input.passingEnergy].remedyShort, `${Math.round(chartSeed * 1000)}|${dateISO}${checkinSig(input)}|rem`);
}

/**
 * An expanded reading for a whole period (opens from a forecast shift, SPEC §6.2).
 * Centres on the shift's energy, framed inside the major season.
 */
export function generateExpandedReading(
  energy: Energy,
  major: Energy,
  startISO: string,
  endISO: string,
  chartSeed: number,
  opts: ReadingOptions = {},
): Reading {
  const base = `${Math.round(chartSeed * 1000)}|${startISO}|${energy}`;
  const c = CONTENT[energy];
  return {
    headline: pick(c.headlines, `${base}|head`),
    gift: pick(c.gift, `${base}|gift`),
    trap: pick(c.trap, `${base}|trap`),
    move: moveFor(energy, opts.goalArea, `${base}|move`),
    watch: pick(c.watch, `${base}|watch`),
    remedy: pick(c.remedies, `${base}|remedy`),
    blendNote: blendNote(major, energy, `${base}|blend`),
    startDate: startISO,
    endDate: endISO,
    energy,
  };
}
