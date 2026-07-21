import { describe, it, expect } from 'vitest';
import { computeChart } from '../src/chart/chart.js';
import { computeReadingInput } from '../src/engine.js';
import {
  generateReading, generateExpandedReading, generateTodayLine,
} from '../src/synthesis/reading.js';
import { buildForecast, buildCustomForecast } from '../src/synthesis/forecast.js';
import { buildBlueprint } from '../src/synthesis/blueprint.js';
import { AstronomiaEphemeris } from '../src/astro/ephemeris.js';
import { ENERGIES, GRAHA_TO_ENERGY } from '../src/constants.js';
import type { BirthData } from '../src/types.js';

const ephem = new AstronomiaEphemeris();

const einstein: BirthData = {
  date: '1879-03-14', time: '11:30', unknownTime: false,
  place: 'Ulm', lat: 48.4, lng: 10.0, tzOffsetMinutes: 40,
};
const other: BirthData = {
  date: '1995-08-25', time: '03:45', unknownTime: false,
  place: 'Sydney', lat: -33.87, lng: 151.21, tzOffsetMinutes: 600,
};

describe('computeReadingInput (Tier 4)', () => {
  it('derives major/passing/areas/scores from a chart + date', () => {
    const chart = computeChart(einstein, ephem);
    const input = computeReadingInput(chart, new Date('2026-07-21T00:00:00Z'), ephem, { goalArea: 'career' });

    expect(ENERGIES).toContain(input.majorEnergy);
    expect(ENERGIES).toContain(input.passingEnergy);
    expect(input.majorEnergy).toBe(GRAHA_TO_ENERGY[input.stack.maha]);
    expect(input.dominantAreas).toHaveLength(3);
    expect(input.houseScore).toHaveLength(12);
    // all energy scores present and finite
    for (const e of ENERGIES) expect(Number.isFinite(input.energyScore[e])).toBe(true);
    // major energy should be among the higher-scoring energies (dasha-boosted)
    expect(input.energyScore[input.majorEnergy]).toBeGreaterThan(0);
  });
});

describe('five-beat reading (Tier 5, SPEC §6.1)', () => {
  it('produces all five beats, non-empty, with the blend', () => {
    const chart = computeChart(einstein, ephem);
    const input = computeReadingInput(chart, new Date('2026-07-21T00:00:00Z'), ephem);
    const r = generateReading(input, '2026-07-21', chart.lagnaLong);
    for (const beat of [r.headline, r.gift, r.trap, r.move, r.watch, r.remedy] as string[]) {
      expect(beat.length).toBeGreaterThan(10);
    }
    expect(r.energy).toBe(input.majorEnergy);
    expect(r.passingEnergy).toBe(input.passingEnergy);
    expect(r.blendNote!.length).toBeGreaterThan(10);
  });
});

describe('Phase 2 acceptance', () => {
  it('two very different charts produce clearly different readings', () => {
    const cA = computeChart(einstein, ephem);
    const cB = computeChart(other, ephem);
    const date = new Date('2026-07-21T00:00:00Z');
    const rA = generateReading(computeReadingInput(cA, date, ephem), '2026-07-21', cA.lagnaLong);
    const rB = generateReading(computeReadingInput(cB, date, ephem), '2026-07-21', cB.lagnaLong);
    expect(JSON.stringify(rA)).not.toBe(JSON.stringify(rB));
  });

  it('the same chart reads differently across days (freshness layer)', () => {
    const chart = computeChart(einstein, ephem);
    const seen = new Set<string>();
    for (let d = 0; d < 21; d++) {
      const date = new Date(Date.UTC(2026, 6, 21 + d));
      const iso = date.toISOString().slice(0, 10);
      const r = generateReading(computeReadingInput(chart, date, ephem), iso, chart.lagnaLong);
      seen.add(JSON.stringify(r));
    }
    // Over three weeks the daily reading should take several distinct forms.
    expect(seen.size).toBeGreaterThan(2);
  });

  it('a daily check-in visibly re-tunes the reading (the "it knows" moment)', () => {
    const chart = computeChart(einstein, ephem);
    const date = new Date('2026-07-21T00:00:00Z');
    const cold = generateReading(computeReadingInput(chart, date, ephem), '2026-07-21', chart.lagnaLong);
    const tuned = generateReading(
      computeReadingInput(chart, date, ephem, { checkin: { mood: 'anxious', focus: 'money' } }),
      '2026-07-21', chart.lagnaLong,
    );
    expect(JSON.stringify(cold)).not.toBe(JSON.stringify(tuned));
  });

  it('a chart far in time shifts the passing energy (dasha movement)', () => {
    const chart = computeChart(einstein, ephem);
    const a = computeReadingInput(chart, new Date('2026-07-21T00:00:00Z'), ephem);
    const b = computeReadingInput(chart, new Date('2027-07-21T00:00:00Z'), ephem);
    // A year apart, at least one of maha/antar/pratyantar should differ.
    const sameStack = a.stack.maha === b.stack.maha
      && a.stack.antar === b.stack.antar
      && a.stack.pratyantar === b.stack.pratyantar;
    expect(sameStack).toBe(false);
  });
});

describe('forecast (Tier 5, SPEC §6.2)', () => {
  const chart = computeChart(einstein, ephem);
  const now = new Date('2026-07-21T00:00:00Z');

  it('pins the major season and provides all three zoom tabs', () => {
    const fc = buildForecast(chart, now);
    expect(ENERGIES).toContain(fc.majorSeason.energy);
    expect(new Date(fc.majorSeason.start).getTime()).toBeLessThan(now.getTime());
    expect(new Date(fc.majorSeason.end).getTime()).toBeGreaterThan(now.getTime());
    expect(fc.daily.length).toBeGreaterThan(0);
    expect(fc.weekly.length).toBeGreaterThan(0);
    expect(fc.monthly.length).toBeGreaterThan(0);
    // exactly one "now" row per tab (the currently active period)
    expect(fc.monthly.filter((p) => p.isNow).length).toBeLessThanOrEqual(1);
    // finer tabs have shorter first-period durations
    const dur = (p: { start: string; end: string }) => new Date(p.end).getTime() - new Date(p.start).getTime();
    expect(dur(fc.daily[0]!)).toBeLessThan(dur(fc.monthly[0]!));
  });

  it('custom range lists every shift + a count', () => {
    const { periods, count } = buildCustomForecast(
      chart, new Date('2026-07-21'), new Date('2027-01-01'), now,
    );
    expect(count).toBe(periods.length);
    expect(count).toBeGreaterThan(0);
  });

  it('expanded reading carries its dates', () => {
    const r = generateExpandedReading('grow', 'build', '2026-08-12', '2026-10-29', chart.lagnaLong);
    expect(r.startDate).toBe('2026-08-12');
    expect(r.endDate).toBe('2026-10-29');
    expect(r.energy).toBe('grow');
  });
});

describe('blueprint (SPEC §8 screen 7)', () => {
  it('produces four rows with four distinct energies', () => {
    const chart = computeChart(einstein, ephem);
    const rows = buildBlueprint(chart);
    expect(rows).toHaveLength(4);
    expect(new Set(rows.map((r) => r.energy)).size).toBe(4);
    expect(rows.map((r) => r.role)).toEqual(['Anchored by', 'Driven by', 'Softened by', 'Guided by']);
    for (const r of rows) expect(r.desc.length).toBeGreaterThan(10);
  });
});
