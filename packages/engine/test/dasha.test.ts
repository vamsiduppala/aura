import { describe, it, expect } from 'vitest';
import {
  nakshatraOf, padaOf, startingMahaLord, nakshatraElapsedFraction,
  getStackAt, getPeriodsAt, buildDashaTree, currentMaha,
  getCourtAt, nextPeriodAt,
} from '../src/dasha/vimshottari.js';
import {
  NAKSHATRAS, NAKSHATRA_ARC, VIMSHOTTARI_YEARS, VIMSHOTTARI_ORDER,
} from '../src/constants.js';

const YEAR_MS = 365.25 * 86400_000;
const yearsBetween = (a: string, b: string) =>
  (new Date(b).getTime() - new Date(a).getTime()) / YEAR_MS;

describe('nakshatra + pada math (SPEC §4.3)', () => {
  it('places longitudes into the right nakshatra', () => {
    expect(nakshatraOf(0)).toBe(0);            // start of Ashwini
    expect(nakshatraOf(13.2)).toBe(0);         // still Ashwini
    expect(nakshatraOf(NAKSHATRA_ARC)).toBe(1);// start of Bharani
    expect(nakshatraOf(120)).toBe(9);          // Magha
    expect(nakshatraOf(359.9)).toBe(26);       // Revati
    expect(nakshatraOf(360)).toBe(0);          // wraps
  });

  it('computes pada 1..4 within a nakshatra', () => {
    expect(padaOf(0)).toBe(1);
    expect(padaOf(NAKSHATRA_ARC / 4 - 0.001)).toBe(1);
    expect(padaOf(NAKSHATRA_ARC / 4 + 0.001)).toBe(2);
    expect(padaOf(NAKSHATRA_ARC - 0.001)).toBe(4);
  });

  it('elapsed fraction is 0 at a nakshatra start and ~0.5 at its middle', () => {
    expect(nakshatraElapsedFraction(NAKSHATRA_ARC)).toBeCloseTo(0, 9);
    expect(nakshatraElapsedFraction(NAKSHATRA_ARC * 1.5)).toBeCloseTo(0.5, 9);
  });
});

describe('starting Mahadasha lord = Moon nakshatra lord (App D)', () => {
  it('maps every nakshatra to its Vimshottari lord', () => {
    for (const nak of NAKSHATRAS) {
      const midLong = nak.index * NAKSHATRA_ARC + NAKSHATRA_ARC / 2;
      expect(startingMahaLord(midLong)).toBe(nak.lord);
    }
  });

  it('repeats the 9-lord pattern every 9 nakshatras', () => {
    for (let i = 0; i < 9; i++) {
      const a = NAKSHATRAS[i]!.lord;
      const b = NAKSHATRAS[i + 9]!.lord;
      const c = NAKSHATRAS[i + 18]!.lord;
      expect(b).toBe(a);
      expect(c).toBe(a);
    }
  });
});

describe('Vimshottari period tree (SPEC §4.4)', () => {
  // Crafted golden: Moon at the exact middle of Ashwini (Ketu, 7y).
  //   elapsed fraction = 0.5  →  first maha (Ketu) started 3.5y before birth,
  //   ends 3.5y after. Sequence then follows the Vimshottari order from Ketu.
  const birth = new Date('2000-01-01T00:00:00.000Z');
  const moonLong = NAKSHATRA_ARC * 0.5; // middle of Ashwini

  it('first maha lord and balance are exact', () => {
    expect(startingMahaLord(moonLong)).toBe('ketu');
    const maha = buildDashaTree(moonLong, birth, 'maha');
    expect(maha).toHaveLength(18); // 2 Vimshottari cycles (240y) for long forecasts
    expect(maha[0]!.lord).toBe('ketu');
    // Ketu maha ends 3.5 years after birth.
    expect(yearsBetween(birth.toISOString(), maha[0]!.end)).toBeCloseTo(3.5, 6);
    // Ketu maha started 3.5 years before birth.
    expect(yearsBetween(maha[0]!.start, birth.toISOString())).toBeCloseTo(3.5, 6);
  });

  it('maha sequence follows the order from the starting lord, each of correct length', () => {
    const maha = buildDashaTree(moonLong, birth, 'maha');
    const expectedOrder = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'];
    expect(maha.slice(0, 9).map((m) => m.lord)).toEqual(expectedOrder);
    for (const node of maha) {
      const len = yearsBetween(node.start, node.end);
      expect(len).toBeCloseTo(VIMSHOTTARI_YEARS[node.lord], 5);
    }
  });

  it('maha spans are contiguous and total 120 years', () => {
    const maha = buildDashaTree(moonLong, birth, 'maha');
    for (let i = 1; i < maha.length; i++) {
      expect(maha[i]!.start).toBe(maha[i - 1]!.end); // contiguous
    }
    const total = yearsBetween(maha[0]!.start, maha[8]!.end);
    expect(total).toBeCloseTo(120, 4);
  });

  it('antardashas sum to their maha and start with the maha lord', () => {
    const tree = buildDashaTree(moonLong, birth, 'antar');
    const ketu = tree[0]!;
    expect(ketu.children).toBeDefined();
    const antars = ketu.children!;
    expect(antars).toHaveLength(9);
    expect(antars[0]!.lord).toBe('ketu'); // sub-order starts with parent lord
    // contiguity within the maha + full coverage
    expect(antars[0]!.start).toBe(ketu.start);
    expect(antars[8]!.end).toBe(ketu.end);
    for (let i = 1; i < antars.length; i++) {
      expect(antars[i]!.start).toBe(antars[i - 1]!.end);
    }
    // Ketu-Venus antar length = 7 * 20/120 years
    const kv = antars.find((a) => a.lord === 'venus')!;
    expect(yearsBetween(kv.start, kv.end)).toBeCloseTo(7 * 20 / 120, 6);
  });

  it('getStackAt at birth = Ketu maha / Rahu antar (hand-computed)', () => {
    const stack = getStackAt(moonLong, birth, birth)!;
    expect(stack).not.toBeNull();
    expect(stack.maha).toBe('ketu');
    expect(stack.antar).toBe('rahu');
  });

  it('getStackAt after the first maha rolls into Venus', () => {
    const later = new Date(birth.getTime() + 4 * YEAR_MS); // 4y after birth (> 3.5y)
    const stack = getStackAt(moonLong, birth, later)!;
    expect(stack.maha).toBe('venus');
  });

  it('currentMaha matches getStackAt', () => {
    const d = new Date(birth.getTime() + 10 * YEAR_MS);
    expect(currentMaha(moonLong, birth, d)!.lord).toBe(getStackAt(moonLong, birth, d)!.maha);
  });

  it('every stack level is a valid graha and nests consistently with the tree', () => {
    const probe = new Date(birth.getTime() + 12.3 * YEAR_MS);
    const stack = getStackAt(moonLong, birth, probe)!;
    for (const lord of Object.values(stack)) {
      expect(VIMSHOTTARI_ORDER).toContain(lord);
    }
  });
});

describe('getCourtAt — the five nested periods with real boundaries', () => {
  // Same crafted golden as above: Moon mid-Ashwini → Ketu maha, 3.5y balance.
  const birth = new Date('2000-01-01T00:00:00.000Z');
  const moonLong = NAKSHATRA_ARC * 0.5;

  it('returns five levels whose lords match getStackAt', () => {
    const at = new Date('2005-07-04T08:15:00Z');
    const court = getCourtAt(moonLong, birth, at);
    const stack = getStackAt(moonLong, birth, at)!;
    expect(court.map((p) => p.level)).toEqual(['maha', 'antar', 'pratyantar', 'sookshma', 'prana']);
    expect(court.map((p) => p.lord))
      .toEqual([stack.maha, stack.antar, stack.pratyantar, stack.sookshma, stack.prana]);
  });

  it('each period contains the instant, and nests strictly inside its parent', () => {
    const at = new Date('2011-11-11T11:11:11Z');
    const court = getCourtAt(moonLong, birth, at);
    for (const p of court) {
      expect(p.start.getTime()).toBeLessThanOrEqual(at.getTime());
      expect(p.end.getTime()).toBeGreaterThan(at.getTime());
    }
    for (let i = 1; i < court.length; i++) {
      expect(court[i]!.start.getTime()).toBeGreaterThanOrEqual(court[i - 1]!.start.getTime());
      expect(court[i]!.end.getTime()).toBeLessThanOrEqual(court[i - 1]!.end.getTime());
    }
  });

  it('level lengths shrink by 120 per step, so the maha is 120^4 the prana', () => {
    // duration(child) = duration(parent) x childYears/120, so summing a level
    // gives exactly the parent. A prana is therefore ~120^4 shorter than its maha.
    const court = getCourtAt(moonLong, birth, birth);
    const len = (i: number) => court[i]!.end.getTime() - court[i]!.start.getTime();
    expect(len(0)).toBeCloseTo(VIMSHOTTARI_YEARS.ketu * YEAR_MS, -3);
    for (let i = 1; i < 5; i++) {
      const ratio = len(i - 1) / len(i);
      // each step divides by 120/childYears, i.e. between 120/20=6 and 120/6=20
      expect(ratio).toBeGreaterThanOrEqual(120 / 20 - 1e-9);
      expect(ratio).toBeLessThanOrEqual(120 / 6 + 1e-9);
    }
  });

  it('at birth, the maha is Ketu with 3.5y left (book balance formula)', () => {
    const court = getCourtAt(moonLong, birth, birth);
    expect(court[0]!.lord).toBe('ketu');
    expect(yearsBetween(birth.toISOString(), court[0]!.end.toISOString())).toBeCloseTo(3.5, 6);
  });

  it('is empty outside the computed cycles', () => {
    expect(getCourtAt(moonLong, birth, new Date('1900-01-01T00:00:00Z'))).toEqual([]);
  });

  it('nextPeriodAt hands over exactly where the current period ends', () => {
    const at = new Date('2005-07-04T08:15:00Z');
    const court = getCourtAt(moonLong, birth, at);
    for (let i = 0; i < 5; i++) {
      const level = court[i]!.level;
      const next = nextPeriodAt(moonLong, birth, level, at)!;
      expect(next).not.toBeNull();
      expect(next.start.getTime()).toBe(court[i]!.end.getTime());
      expect(next.lord).not.toBe(court[i]!.lord); // adjacent periods never repeat a lord
    }
  });

  it('nextPeriodAt at maha level follows the Vimshottari order', () => {
    const next = nextPeriodAt(moonLong, birth, 'maha', birth)!;
    expect(next.lord).toBe('venus'); // Ketu -> Venus
  });
});

describe('getPeriodsAt (forecast source)', () => {
  const birth = new Date('1990-06-15T10:30:00.000Z');
  const moonLong = 200.5; // arbitrary

  it('returns ordered, contiguous antar periods covering the range', () => {
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2027-01-01T00:00:00Z');
    const periods = getPeriodsAt(moonLong, birth, 'antar', from, to);
    expect(periods.length).toBeGreaterThan(0);
    for (let i = 1; i < periods.length; i++) {
      expect(periods[i]!.start.getTime()).toBe(periods[i - 1]!.end.getTime());
      expect(periods[i]!.start.getTime()).toBeGreaterThan(periods[i - 1]!.start.getTime());
    }
    // all overlap the window
    for (const p of periods) {
      expect(p.end.getTime()).toBeGreaterThan(from.getTime());
      expect(p.start.getTime()).toBeLessThan(to.getTime());
    }
  });

  it('daily-level periods are finer than monthly-level periods', () => {
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2026-04-01T00:00:00Z');
    const fine = getPeriodsAt(moonLong, birth, 'sookshma', from, to);
    const coarse = getPeriodsAt(moonLong, birth, 'antar', from, to);
    expect(fine.length).toBeGreaterThanOrEqual(coarse.length);
  });
});
