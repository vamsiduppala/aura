import { describe, it, expect } from 'vitest';
import { buildRetrospective } from '../src/synthesis/retrospective.js';
import { computeChart } from '../src/chart/chart.js';
import { AstronomiaEphemeris } from '../src/astro/ephemeris.js';
import { ENERGIES } from '../src/constants.js';
import { checkNoDoom } from '../src/safety/guardrails.js';
import type { BirthData } from '../src/types.js';

const ephem = new AstronomiaEphemeris();
const birth: BirthData = {
  date: '1992-11-07', time: '08:15', unknownTime: false,
  place: 'Bengaluru', lat: 12.97, lng: 77.59, tzOffsetMinutes: 330,
};
const now = new Date('2026-07-21T00:00:00Z');

describe('Retrospective ("Prove It")', () => {
  it('returns up to 3 chronological past shifts inside the window', () => {
    const chart = computeChart(birth, ephem);
    const retro = buildRetrospective(chart, now, ephem, { focusArea: 'career', months: 18, count: 3 });
    expect(retro.length).toBeGreaterThan(0);
    expect(retro.length).toBeLessThanOrEqual(3);
    for (const r of retro) {
      expect(ENERGIES).toContain(r.energy);
      expect(new Date(r.start).getTime()).toBeLessThan(now.getTime());
      expect(new Date(r.start).getTime()).toBeGreaterThan(now.getTime() - 19 * 30 * 86400_000);
      expect(r.statement.length).toBeGreaterThan(20);
    }
    // chronological
    for (let i = 1; i < retro.length; i++) {
      expect(new Date(retro[i]!.start).getTime()).toBeGreaterThanOrEqual(new Date(retro[i - 1]!.start).getTime());
    }
  });

  it('names the focus area and stays doom-free', () => {
    const chart = computeChart(birth, ephem);
    const retro = buildRetrospective(chart, now, ephem, { focusArea: 'partnership' });
    for (const r of retro) {
      expect(r.area).toBe('partnership');
      expect(checkNoDoom(r.statement).ok).toBe(true);
    }
  });

  it('is deterministic for the same inputs', () => {
    const chart = computeChart(birth, ephem);
    const a = buildRetrospective(chart, now, ephem, { focusArea: 'money' });
    const b = buildRetrospective(chart, now, ephem, { focusArea: 'money' });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
