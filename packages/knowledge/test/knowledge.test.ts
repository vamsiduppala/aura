import { describe, it, expect } from 'vitest';
import {
  GRAHAS, RASIS, BHAVAS, NAKSHATRAS, getGraha, getRasi, getBhava, search,
  interpretPlacement, interpretLagnaLord,
} from '../src/index.js';

describe('reference data completeness', () => {
  it('has all 9 grahas, 12 rasis, 12 bhavas, 27 nakshatras', () => {
    expect(Object.keys(GRAHAS)).toHaveLength(9);
    expect(RASIS).toHaveLength(12);
    expect(BHAVAS).toHaveLength(12);
    expect(NAKSHATRAS).toHaveLength(27);
  });
  it('rasi indices 0..11 and bhava numbers 1..12 are contiguous', () => {
    expect(RASIS.map((r) => r.index)).toEqual([...Array(12).keys()]);
    expect(BHAVAS.map((b) => b.number)).toEqual([...Array(12).keys()].map((n) => n + 1));
  });
  it('nakshatra lords cycle the Vimsottari order every 9', () => {
    for (let i = 0; i < 9; i++) {
      expect(NAKSHATRAS[i]!.lord).toBe(NAKSHATRAS[i + 9]!.lord);
      expect(NAKSHATRAS[i]!.lord).toBe(NAKSHATRAS[i + 18]!.lord);
    }
  });
  it('sign lords are the classical rulerships', () => {
    expect(getRasi(0).lord).toBe('mars');   // Aries
    expect(getRasi(4).lord).toBe('sun');    // Leo
    expect(getRasi(9).lord).toBe('saturn'); // Capricorn
    expect(getGraha('jupiter').naturalNature).toBe('benefic');
    expect(getGraha('saturn').naturalNature).toBe('malefic');
  });
});

describe('interpretation engine', () => {
  it('composes a readable, on-theme placement interpretation', () => {
    // Saturn in the 5th house in Pisces — the user's example.
    const r = interpretPlacement({ graha: 'saturn', house: 5, sign: 11, dignity: 'neutral' });
    expect(r.title).toMatch(/Saturn/);
    expect(r.title).toMatch(/5th house/);
    expect(r.title).toMatch(/Pisces/);
    expect(r.text.length).toBeGreaterThan(80);
    expect(r.text.toLowerCase()).toContain('discipline');
    expect(r.keywords.length).toBeGreaterThan(2);
  });

  it('a benefic in a trine reads supportive; a malefic in a dusthana reads demanding', () => {
    const good = interpretPlacement({ graha: 'jupiter', house: 9, sign: 8, dignity: 'own' });
    expect(good.text.toLowerCase()).toMatch(/bless|strong|favoured|reward/);
    const hard = interpretPlacement({ graha: 'saturn', house: 8, sign: 0, dignity: 'debilitated' });
    expect(hard.text.toLowerCase()).toMatch(/friction|challenge|delay|harder|grow/);
  });

  it('interprets the lagna lord', () => {
    const r = interpretLagnaLord('mars', 10, 9);
    expect(r.text).toMatch(/rules your rising sign|chart ruler|captain/i);
  });
});

describe('search', () => {
  it('finds concepts across kinds', () => {
    expect(search('wealth').some((h) => h.kind === 'bhava')).toBe(true);
    expect(search('courage').length).toBeGreaterThan(0);
    expect(search('').length).toBe(0);
  });
});
