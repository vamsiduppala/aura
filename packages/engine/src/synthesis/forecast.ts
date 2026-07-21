// ─────────────────────────────────────────────────────────────────────────────
// Forecast builder (Tier 5, SPEC §6.2). Four zoom levels + the pinned major-season
// change. The tab "scale" maps to a dasha sub-level (matching the mockup's period
// lengths): Daily→Prana, Weekly→Sookshma, Monthly→Pratyantar, Custom→user range.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Chart, DashaLevel, Energy, ForecastPeriod,
} from '../types.js';
import { GRAHA_TO_ENERGY, ENERGY_META } from '../constants.js';
import { DEFAULT_CONFIG, type EngineConfig } from '../types.js';
import { dateFromJd } from '../astro/julian.js';
import { getPeriodsAt } from '../dasha/vimshottari.js';

/** Short forecast-row gloss per energy (concise, non-doom). */
const FORECAST_GLOSS: Record<Energy, string> = {
  main:  'You’re seen. Recognition and visibility.',
  feel:  'Softer and closer. Feelings, home, rest.',
  fire:  'Heat and drive. Good for hard starts.',
  mind:  'Quick and verbal. Deals, ideas, talk.',
  grow:  'Luck and momentum. Doors give — expand.',
  love:  'Warmth and charm. Connection and beauty.',
  build: 'Heavy and steady. The long, real build.',
  crave: 'Restless and hungry. Aim it at one thing.',
  let:   'Loosening. Endings that make room.',
};

export interface ForecastResult {
  majorSeason: {
    energy: Energy;
    start: string;
    end: string;
    /** The energy the season turns into next, and when. */
    nextEnergy: Energy;
    nextStart: string;
  };
  daily: ForecastPeriod[];
  weekly: ForecastPeriod[];
  monthly: ForecastPeriod[];
}

const ZOOM_LEVEL: Record<'daily' | 'weekly' | 'monthly', DashaLevel> = {
  daily: 'prana',
  weekly: 'sookshma',
  monthly: 'pratyantar',
};

function toPeriods(
  chart: Chart, level: DashaLevel, from: Date, to: Date, now: Date, cfg: EngineConfig, cap: number,
): ForecastPeriod[] {
  const birth = dateFromJd(chart.julianDayUT);
  const moonLong = chart.planets.moon.siderealLong;
  const raw = getPeriodsAt(moonLong, birth, level, from, to, { yearLengthDays: cfg.yearLengthDays });
  return raw.slice(0, cap).map((p) => {
    const energy = GRAHA_TO_ENERGY[p.lord];
    return {
      energy,
      start: p.start.toISOString(),
      end: p.end.toISOString(),
      gloss: FORECAST_GLOSS[energy],
      isNow: p.start.getTime() <= now.getTime() && now.getTime() < p.end.getTime(),
      level,
    };
  });
}

export function buildForecast(
  chart: Chart, now: Date, cfg: EngineConfig = DEFAULT_CONFIG,
): ForecastResult {
  const birth = dateFromJd(chart.julianDayUT);
  const moonLong = chart.planets.moon.siderealLong;
  const opts = { yearLengthDays: cfg.yearLengthDays };
  const day = 86400_000;

  // Pinned major season = the maha containing `now`, and the one after it. Reading
  // both from one getPeriodsAt call keeps the boundary exact (no Date round-trip).
  const mahas = getPeriodsAt(moonLong, birth, 'maha', now, new Date(now.getTime() + 130 * 365.25 * day), opts);
  const current = mahas[0]!;
  const next = mahas[1] ?? current;

  return {
    majorSeason: {
      energy: GRAHA_TO_ENERGY[current.lord],
      start: current.start.toISOString(),
      end: current.end.toISOString(),
      nextEnergy: GRAHA_TO_ENERGY[next.lord],
      nextStart: current.end.toISOString(),
    },
    daily: toPeriods(chart, ZOOM_LEVEL.daily, now, new Date(now.getTime() + 16 * day), now, cfg, 8),
    weekly: toPeriods(chart, ZOOM_LEVEL.weekly, now, new Date(now.getTime() + 75 * day), now, cfg, 8),
    monthly: toPeriods(chart, ZOOM_LEVEL.monthly, now, new Date(now.getTime() + 420 * day), now, cfg, 8),
  };
}

/** Custom range (SPEC §6.2 Custom tab): every shift in [from,to] + the count. */
export function buildCustomForecast(
  chart: Chart, from: Date, to: Date, now: Date,
  level: DashaLevel = 'pratyantar', cfg: EngineConfig = DEFAULT_CONFIG,
): { periods: ForecastPeriod[]; count: number } {
  const periods = toPeriods(chart, level, from, to, now, cfg, 200);
  return { periods, count: periods.length };
}

export { FORECAST_GLOSS, ENERGY_META };
