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
export { navamsaSign, rasiSign, dasamsaSign, isVargottama } from './chart/varga.js';
export {
  planetStrength, moonIllumination, type StrengthInput, type StrengthResult,
} from './chart/shadbala.js';
export { aspectedHouses } from './chart/aspects.js';
export {
  computeAshtakavarga, ashtakavargaTotal, AV_PLANETS, type Ashtakavarga,
} from './chart/ashtakavarga.js';

// Dasha (Tier 2)
export {
  nakshatraOf, padaOf, startingMahaLord, nakshatraElapsedFraction,
  getStackAt, getPeriodsAt, buildDashaTree, currentMaha,
  type DashaOptions,
} from './dasha/vimshottari.js';

// Transits (Tier 2)
export { computeTransit, sadeSatiPhase } from './transit/gochara.js';

// Lattice + aggregation (Tiers 3–4)
export {
  computeLattice, cellStatic, dominantAreas, pickPassingEnergy, type LatticeResult,
} from './lattice/compute.js';
export { computeReadingInput, type ReadingInputOptions } from './engine.js';

// Synthesis (Tier 5)
export {
  generateReading, generateTodayLine, generateRemedyShort, generateExpandedReading,
  type ReadingOptions,
} from './synthesis/reading.js';
export {
  buildForecast, buildCustomForecast, type ForecastResult, FORECAST_GLOSS,
} from './synthesis/forecast.js';
export { buildBlueprint, natalProminence, type BlueprintRow } from './synthesis/blueprint.js';

// Content (Tier 6)
export { CONTENT, type EnergyContent } from './content/templates.js';

// Safety / guardrails (Tier 8)
export {
  detectCrisis, checkNoDoom, SUPPORT_RESOURCES, SUPPORT_MESSAGE, DISCLAIMER,
  type SupportResource, type DoomCheck,
} from './safety/guardrails.js';

// Optional guarded LLM polish (Tier 6, off by default)
export {
  polishReading, POLISH_SYSTEM_PROMPT, NOOP_POLISH, type PolishAdapter,
} from './content/polish.js';
