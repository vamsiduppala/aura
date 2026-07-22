import { describe, it, expect } from 'vitest';
import { Aura, AstronomiaEphemeris, type BirthData } from '@aura/engine';
import { computeYearAhead } from './yearAhead';

const aura = new Aura(new AstronomiaEphemeris());
const chart = aura.chart({
  date: '1990-05-20', time: '08:30', unknownTime: false,
  place: 'Delhi', lat: 28.6, lng: 77.2, tzOffsetMinutes: 330,
} as BirthData);
const SIGNS = /Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces/;

describe('computeYearAhead — Tajaka annual summary', () => {
  it('produces muntha, strongest planet and the Punya saham for the current year', () => {
    const y = computeYearAhead(aura, chart, new Date('2024-09-01T00:00:00Z'));
    expect(y.year).toBe(2024);
    expect(y.munthaHouse).toBeGreaterThanOrEqual(1);
    expect(y.munthaHouse).toBeLessThanOrEqual(12);
    expect(y.munthaSignName).toMatch(SIGNS);
    expect(y.munthaMeaning.length).toBeGreaterThan(0);
    expect(['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn']).toContain(y.strongestPlanet);
    expect(y.strongestUnits).toBeGreaterThanOrEqual(0);
    expect(y.strongestUnits).toBeLessThanOrEqual(20);
    expect(y.punyaSahamSign).toMatch(SIGNS);
  });
});
