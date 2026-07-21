// @aura/engine — public API. UI/app code imports from here.

export * from './types.js';
export * from './constants.js';

// Astronomy / time
export * from './astro/angles.js';
export * from './astro/julian.js';
export * from './astro/ayanamsa.js';
export * from './astro/ascendant.js';
export {
  type Ephemeris, type EphemerisSample, AstronomiaEphemeris, FixedEphemeris,
} from './astro/ephemeris.js';

// Chart (Tier 1)
export { computeChart } from './chart/chart.js';
export { dignityScalar, functionalPolarity } from './chart/strength.js';
export { aspectedHouses } from './chart/aspects.js';

// Dasha (Tier 2)
export {
  nakshatraOf, padaOf, startingMahaLord, nakshatraElapsedFraction,
  getStackAt, getPeriodsAt, buildDashaTree, currentMaha,
  type DashaOptions,
} from './dasha/vimshottari.js';

// Transits (Tier 2)
export { computeTransit, sadeSatiPhase } from './transit/gochara.js';
