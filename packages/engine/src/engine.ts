// ─────────────────────────────────────────────────────────────────────────────
// High-level orchestration (Tier 4). computeReadingInput() is the single call the
// app/synthesis layer makes: chart + date (+ optional check-in/goal) → the complete
// ReadingInput tuple. Everything the user sees derives from this — never raw planets.
// ─────────────────────────────────────────────────────────────────────────────

import type { Chart, Checkin, LifeArea, ReadingInput } from './types.js';
import { DEFAULT_CONFIG, type EngineConfig } from './types.js';
import { GRAHA_TO_ENERGY } from './constants.js';
import { dateFromJd } from './astro/julian.js';
import { getStackAt } from './dasha/vimshottari.js';
import { computeTransit } from './transit/gochara.js';
import type { Ephemeris } from './astro/ephemeris.js';
import { computeAshtakavarga } from './chart/ashtakavarga.js';
import {
  computeLattice, dominantAreas, pickPassingEnergy,
} from './lattice/compute.js';

export interface ReadingInputOptions {
  checkin?: Checkin;
  goalArea?: LifeArea;
  config?: EngineConfig;
}

export function computeReadingInput(
  chart: Chart,
  date: Date,
  ephem: Ephemeris,
  opts: ReadingInputOptions = {},
): ReadingInput {
  const cfg = opts.config ?? DEFAULT_CONFIG;
  const birthDate = dateFromJd(chart.julianDayUT);
  const moonLong = chart.planets.moon.siderealLong;

  const stack = getStackAt(moonLong, birthDate, date, { yearLengthDays: cfg.yearLengthDays });
  if (!stack) {
    throw new RangeError('Date is outside the computed 120-year dasha cycle for this chart.');
  }

  const transit = computeTransit(chart, date, ephem);
  const av = computeAshtakavarga(chart);
  const lattice = computeLattice(chart, stack, transit, opts.checkin, cfg, av);

  const input: ReadingInput = {
    majorEnergy: GRAHA_TO_ENERGY[stack.maha],
    passingEnergy: pickPassingEnergy(stack, lattice.energyScore),
    energyScore: lattice.energyScore,
    houseScore: lattice.houseScore,
    dominantAreas: dominantAreas(lattice.houseScore),
    stack,
    transit,
    precision: chart.precision,
  };
  if (opts.checkin) input.checkin = opts.checkin;
  if (opts.goalArea) input.goalArea = opts.goalArea;
  return input;
}
