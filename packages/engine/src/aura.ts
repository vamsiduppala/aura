// ─────────────────────────────────────────────────────────────────────────────
// Aura — the engine facade. A single domain service the app layer talks to, so the
// UI never wires the ephemeris, config, and a dozen functions itself. Construct once
// with an Ephemeris (dependency-injected) and an optional config, then call intents.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  BirthData, Chart, Checkin, DashaLevel, Energy, Graha, LifeArea, Reading, ReadingInput,
} from './types.js';
import { DEFAULT_CONFIG, type EngineConfig } from './types.js';
import type { Ephemeris } from './astro/ephemeris.js';
import { computeChart } from './chart/chart.js';
import { computeReadingInput } from './engine.js';
import { getPeriodsAt } from './dasha/vimshottari.js';
import { dateFromJd } from './astro/julian.js';
import { GRAHA_TO_ENERGY } from './constants.js';
import { computeAshtakavarga, type Ashtakavarga } from './chart/ashtakavarga.js';
import {
  generateReading, generateExpandedReading, generateTodayLine, generateRemedyShort,
} from './synthesis/reading.js';
import { buildForecast, buildCustomForecast, type ForecastResult } from './synthesis/forecast.js';
import { buildBlueprint, standingStrength, type BlueprintRow } from './synthesis/blueprint.js';
import { detectYogas, type YogaResult } from './chart/yogas.js';
import { buildRetrospective, type RetroItem, type RetrospectiveOptions } from './synthesis/retrospective.js';
import { computeAnnualChart, currentVarshaYear, type AnnualChart } from './synthesis/varshaphal.js';
import { answerMentorQuery, type MentorQuery, type MentorAnswer } from './mentor/query.js';

const isoDay = (d: Date): string => d.toISOString().slice(0, 10);

export interface DailyBundle {
  input: ReadingInput;
  reading: Reading;
  todayLine: string;
  remedyShort: string;
  /** The user's real standing strength to lean on (a born gift), closing the reading. */
  edge: { name: string; note: string };
}

export interface AuraOptions {
  goalArea?: LifeArea;
  checkin?: Checkin;
}

export interface PhaseWindow { energy: Energy; lord: Graha; start: Date; end: Date }
export interface PhaseWindows { major: PhaseWindow; passing: PhaseWindow }

/** Facade over the whole engine. Inject an Ephemeris (offline astronomia by default). */
export class Aura {
  constructor(
    private readonly ephem: Ephemeris,
    private readonly config: EngineConfig = DEFAULT_CONFIG,
  ) {}

  /** Birth data → the full sidereal chart (compute once, cache in the app). */
  chart(birth: BirthData): Chart {
    return computeChart(birth, this.ephem);
  }

  /** The complete ReadingInput tuple for a chart on a date. */
  readingInput(chart: Chart, date: Date, opts: AuraOptions = {}): ReadingInput {
    return computeReadingInput(chart, date, this.ephem, {
      config: this.config,
      ...(opts.goalArea ? { goalArea: opts.goalArea } : {}),
      ...(opts.checkin ? { checkin: opts.checkin } : {}),
    });
  }

  /** Everything the Today + Reading screens need for one day, in one call. */
  daily(chart: Chart, date: Date, opts: AuraOptions = {}): DailyBundle {
    const input = this.readingInput(chart, date, opts);
    const seed = chart.lagnaLong;
    const iso = isoDay(date);
    return {
      input,
      reading: generateReading(input, iso, seed, opts.goalArea ? { goalArea: opts.goalArea } : {}),
      todayLine: generateTodayLine(input, iso, seed),
      remedyShort: generateRemedyShort(input, iso, seed),
      edge: standingStrength(chart),
    };
  }

  /** The from/to windows of the two energies the Today screen shows (major = maha,
   *  passing = the antar or pratyantar the reading actually chose). Dates are guaranteed
   *  consistent with `input.majorEnergy`/`input.passingEnergy` because they resolve the
   *  same stack. Returns null if `now` is outside the computed cycle. */
  phaseWindows(input: ReadingInput, chart: Chart, now: Date): PhaseWindows | null {
    const moonLong = chart.planets.moon.siderealLong;
    const birth = dateFromJd(chart.julianDayUT);
    const opts = { yearLengthDays: this.config.yearLengthDays };

    const windowFor = (level: DashaLevel): { start: Date; end: Date; lord: Graha } | null => {
      const ps = getPeriodsAt(moonLong, birth, level, now, now, opts);
      const hit = ps.find((p) => p.start.getTime() <= now.getTime() && now.getTime() < p.end.getTime()) ?? ps[0];
      return hit ? { start: hit.start, end: hit.end, lord: hit.lord } : null;
    };

    const major = windowFor('maha');
    if (!major) return null;
    // Major = mahadasha, Passing = antardasha (the two levels the Today screen names).
    const passing = windowFor('antar') ?? major;

    return {
      major: { energy: GRAHA_TO_ENERGY[major.lord], lord: major.lord, start: major.start, end: major.end },
      passing: { energy: GRAHA_TO_ENERGY[passing.lord], lord: passing.lord, start: passing.start, end: passing.end },
    };
  }

  /** Tabbed forecast (daily/weekly/monthly) + pinned major-season change. */
  forecast(chart: Chart, now: Date): ForecastResult {
    return buildForecast(chart, now, this.config);
  }

  /** The Tajaka annual (varshaphal) chart for a given solar-return year. */
  annualChart(chart: Chart, year: number): AnnualChart {
    return computeAnnualChart(chart, year, this.ephem);
  }

  /** The annual chart currently in effect for `now` (this year's solar return). */
  currentAnnualChart(chart: Chart, now: Date): AnnualChart {
    return computeAnnualChart(chart, currentVarshaYear(chart, now), this.ephem);
  }

  /** Custom-range forecast (every shift in [from,to] + count). */
  customForecast(chart: Chart, from: Date, to: Date, now: Date) {
    return buildCustomForecast(chart, from, to, now, 'pratyantar', this.config);
  }

  /** An expanded reading for a period, opened from a forecast shift. */
  expanded(
    energy: Energy, major: Energy, startISO: string, endISO: string, chart: Chart,
    opts: AuraOptions = {},
  ): Reading {
    return generateExpandedReading(
      energy, major, startISO, endISO, chart.lagnaLong,
      opts.goalArea ? { goalArea: opts.goalArea } : {},
    );
  }

  /** The user's standing "blueprint" energies. */
  blueprint(chart: Chart): BlueprintRow[] {
    return buildBlueprint(chart);
  }

  /** Notable natal yogas as plain "born gifts" (may be empty). */
  yogas(chart: Chart): YogaResult[] {
    return detectYogas(chart);
  }

  /** The "Prove It" retrospective — recent past shifts, stated in past tense. */
  retrospective(chart: Chart, now: Date, opts: RetrospectiveOptions = {}): RetroItem[] {
    return buildRetrospective(chart, now, this.ephem, opts);
  }

  /** Ashtakavarga (favourable-sign map) for the chart. */
  ashtakavarga(chart: Chart): Ashtakavarga {
    return computeAshtakavarga(chart);
  }

  /** Cosmic Mentor: the real engine data for a {focus, timeframe} query. The chat LLM
   *  is forced to call this and may only narrate the result — never invent astrology. */
  mentorAnswer(chart: Chart, query: MentorQuery, now: Date): MentorAnswer {
    return answerMentorQuery(chart, query, now, this.ephem, this.config);
  }
}
