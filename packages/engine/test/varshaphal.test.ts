import { describe, it, expect } from 'vitest';
import { Aura, AstronomiaEphemeris } from '../src/index.js';
import type { BirthData } from '../src/types.js';

const aura = new Aura(new AstronomiaEphemeris());
const birth: BirthData = {
  date: '1990-05-20', time: '08:30', unknownTime: false,
  place: 'Delhi', lat: 28.6, lng: 77.2, tzOffsetMinutes: 330,
};
const natal = aura.chart(birth);

describe('varshaphal (Tajaka annual chart)', () => {
  it('the annual chart puts the Sun back on its natal sidereal longitude', () => {
    const ann = aura.annualChart(natal, 2024);
    const d = Math.abs(((ann.chart.planets.sun.siderealLong - natal.planets.sun.siderealLong + 540) % 360) - 180);
    expect(d).toBeLessThan(0.01); // solar return: within ~0.01°
  });

  it('the solar return lands within a few days of the birthday', () => {
    const ann = aura.annualChart(natal, 2024);
    const md = ann.chart.birth.date.slice(5); // MM-DD
    // birthday is 05-20; the sidereal return is mid-to-late May
    expect(ann.chart.birth.date.startsWith('2024-05')).toBe(true);
    expect(Number(md.slice(3))).toBeGreaterThanOrEqual(18);
  });

  it('muntha = natal lagna progressed one rasi per year of life', () => {
    const ann = aura.annualChart(natal, 2024); // 35th year of life (2024 − 1990 + 1)
    const expected = ((natal.lagnaSign + (2024 - 1990)) % 12 + 12) % 12;
    expect(ann.muntha).toBe(expected);
    expect(ann.munthaHouse).toBeGreaterThanOrEqual(1);
    expect(ann.munthaHouse).toBeLessThanOrEqual(12);
  });

  it('currentAnnualChart picks a return year near now', () => {
    const now = new Date('2024-09-01T00:00:00Z');
    const ann = aura.currentAnnualChart(natal, now);
    expect(ann.year).toBe(2024); // birthday (May) already passed by September
  });
});
