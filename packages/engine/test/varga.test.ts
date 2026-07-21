import { describe, it, expect } from 'vitest';
import { navamsaSign, dasamsaSign, isVargottama, rasiSign } from '../src/chart/varga.js';
import { planetStrength, moonIllumination } from '../src/chart/shadbala.js';
import type { StrengthInput } from '../src/chart/shadbala.js';

describe('Navamsa (D9) — movable/fixed/dual start rule', () => {
  it('movable sign starts navamsa from the same sign', () => {
    expect(navamsaSign(0)).toBe(0);        // Aries 0° → Aries
    expect(navamsaSign(90)).toBe(3);       // Cancer 0° → Cancer (movable)
  });
  it('fixed sign starts navamsa from the 9th sign', () => {
    expect(navamsaSign(30)).toBe(9);       // Taurus 0° → Capricorn (9th from Taurus)
    expect(navamsaSign(120)).toBe(0);      // Leo 0° → Aries (9th from Leo)
  });
  it('dual sign starts navamsa from the 5th sign', () => {
    expect(navamsaSign(60)).toBe(6);       // Gemini 0° → Libra (5th from Gemini)
  });
  it('covers exactly 108 navamsas around the circle', () => {
    const arc = 360 / 108;
    expect(navamsaSign(arc - 0.001)).toBe(0);
    expect(navamsaSign(arc + 0.001)).toBe(1);
    expect(navamsaSign(360 - 0.001)).toBe(11); // last navamsa → Pisces
  });
  it('detects vargottama (same sign D1 & D9)', () => {
    // Aries 0..3°20′ is navamsa Aries → vargottama within Aries.
    expect(isVargottama(1)).toBe(true);
    expect(rasiSign(1)).toBe(navamsaSign(1));
    expect(isVargottama(30)).toBe(false); // Taurus 0° → Capricorn navamsa
  });
});

describe('Dasamsa (D10) — odd/even start rule', () => {
  it('odd sign starts from same sign; even sign from the 9th', () => {
    expect(dasamsaSign(0)).toBe(0);   // Aries (odd) part 0 → Aries
    expect(dasamsaSign(30)).toBe(9);  // Taurus (even) part 0 → 9th = Capricorn
  });
});

describe('planetStrength (Shadbala-inspired)', () => {
  const base: StrengthInput = {
    graha: 'mars', sign: 9, degInSign: 28, navamsaSign: 9, house: 10,
    retrograde: false, combust: false, isBenefic: false, moonIllumination: 0.5,
  };

  it('returns a total in [0,1] with all components present', () => {
    const s = planetStrength(base);
    expect(s.total).toBeGreaterThanOrEqual(0);
    expect(s.total).toBeLessThanOrEqual(1);
    for (const k of ['sthana', 'dig', 'cheshta', 'naisargika', 'paksha'] as const) {
      expect(s[k]).toBeGreaterThanOrEqual(0);
      expect(s[k]).toBeLessThanOrEqual(1.01);
    }
  });

  it('exalted + vargottama + dig-strong is much stronger than debilitated', () => {
    // Mars exalted in Capricorn (9), vargottama, in its dig-strong 10th house.
    const strong = planetStrength(base);
    // Mars debilitated in Cancer (3), not vargottama, in its weak 4th house.
    const weak = planetStrength({ ...base, sign: 3, navamsaSign: 6, house: 4 });
    expect(strong.total).toBeGreaterThan(weak.total + 0.2);
    expect(strong.vargottama).toBe(true);
  });

  it('paksha: benefics gain with a full Moon, malefics with a new Moon', () => {
    const beneficFull = planetStrength({ ...base, isBenefic: true, moonIllumination: 1 });
    const beneficNew = planetStrength({ ...base, isBenefic: true, moonIllumination: 0 });
    expect(beneficFull.paksha).toBeGreaterThan(beneficNew.paksha);
  });

  it('moonIllumination is 0 at new moon and 1 at full moon', () => {
    expect(moonIllumination(0)).toBeCloseTo(0, 6);
    expect(moonIllumination(180)).toBeCloseTo(1, 6);
    expect(moonIllumination(90)).toBeCloseTo(0.5, 6);
  });
});
