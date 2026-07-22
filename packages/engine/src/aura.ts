// ─────────────────────────────────────────────────────────────────────────────
// Aura — the engine facade. A single domain service the app layer talks to, so the
// UI never wires the ephemeris, config, and a dozen functions itself. Construct once
// with an Ephemeris (dependency-injected) and an optional config, then call intents.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  BirthData, Chart, Checkin, Energy, LifeArea, Reading, ReadingInput,
} from './types.js';
import { DEFAULT_CONFIG, type EngineConfig } from './types.js';
import type { Ephemeris } from './astro/ephemeris.js';
import { computeChart } from './chart/chart.js';
import { computeReadingInput } from './engine.js';
import { computeAshtakavarga, type Ashtakavarga } from './chart/ashtakavarga.js';
import {
  generateReading, generateExpandedReading, generateTodayLine, generateRemedyShort,
} from './synthesis/reading.js';
import { buildForecast, buildCustomForecast, type ForecastResult } from './synthesis/forecast.js';
import { buildBlueprint, type BlueprintRow } from './synthesis/blueprint.js';
import { buildRetrospective, type RetroItem, type RetrospectiveOptions } from './synthesis/retrospective.js';
import { answerMentorQuery, type MentorQuery, type MentorAnswer } from './mentor/query.js';

const isoDay = (d: Date): string => d.toISOString().slice(0, 10);

export interface DailyBundle {
  input: ReadingInput;
  reading: Reading;
  todayLine: string;
  remedyShort: string;
}

export interface AuraOptions {
  goalArea?: LifeArea;
  checkin?: Checkin;
}

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
    };
  }

  /** Tabbed forecast (daily/weekly/monthly) + pinned major-season change. */
  forecast(chart: Chart, now: Date): ForecastResult {
    return buildForecast(chart, now, this.config);
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
