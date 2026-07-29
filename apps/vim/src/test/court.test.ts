import { describe, expect, it } from 'vitest';
import { AstronomiaEphemeris, computeChart, type BirthData } from '@aura/engine';
import {
  approximateNote, birthInstantUTC, chooseCutLevel, courtAt, courtFastestFirst,
  deepestTrustworthy, nextTurn, periodsBetween, visibilityFor,
  type BirthTimeConfidence,
} from '../core/court';
import { OFFICES } from '../theme/tokens';

// A fixture birth, used only inside tests. Every user-facing path computes from what the
// person actually entered — there is no shipped chart anywhere in src/.
const BIRTH: BirthData = {
  date: '1994-03-14',
  time: '06:12',
  unknownTime: false,
  place: 'Chennai, Tamil Nadu, India',
  lat: 13.0827,
  lng: 80.2707,
  tzOffsetMinutes: 330, // IST, in force at Chennai on that date
};

const chart = computeChart(BIRTH, new AstronomiaEphemeris());

describe('birth-time confidence gate', () => {
  // The gate exists because one minute of error offsets every boundary by up to five days
  // and never shrinks. The Messenger is therefore never solid, at any confidence.
  it('never marks the Messenger solid, even for an exact birth time', () => {
    const confidences: BirthTimeConfidence[] = ['exact', 'within15min', 'within1hour', 'unknown'];
    for (const c of confidences) {
      expect(visibilityFor(5, c)).not.toBe('solid');
    }
  });

  it('matches the published gate table exactly', () => {
    const table: Record<BirthTimeConfidence, string[]> = {
      //            King      PM        Governor  Magistrate  Messenger
      exact: ['solid', 'solid', 'solid', 'solid', 'approximate'],
      within15min: ['solid', 'solid', 'solid', 'approximate', 'hidden'],
      within1hour: ['solid', 'solid', 'approximate', 'hidden', 'hidden'],
      unknown: ['solid', 'approximate', 'hidden', 'hidden', 'hidden'],
    };
    for (const [c, expected] of Object.entries(table)) {
      for (let level = 1; level <= 5; level++) {
        expect(visibilityFor(level, c as BirthTimeConfidence)).toBe(expected[level - 1]);
      }
    }
  });

  it('degrades monotonically — less certainty never reveals more', () => {
    const rank = { solid: 2, approximate: 1, hidden: 0 } as const;
    const order: BirthTimeConfidence[] = ['exact', 'within15min', 'within1hour', 'unknown'];
    for (let level = 1; level <= 5; level++) {
      for (let i = 1; i < order.length; i++) {
        expect(rank[visibilityFor(level, order[i]!)])
          .toBeLessThanOrEqual(rank[visibilityFor(level, order[i - 1]!)]);
      }
    }
  });

  it('deepestTrustworthy never exceeds the deepest solid ring', () => {
    for (const c of ['exact', 'within15min', 'within1hour', 'unknown'] as BirthTimeConfidence[]) {
      const deepest = deepestTrustworthy(c).level;
      expect(visibilityFor(deepest, c)).toBe('solid');
      if (deepest < 5) expect(visibilityFor(deepest + 1, c)).not.toBe('solid');
    }
  });

  it('explains every confidence level in the user\'s own terms', () => {
    for (const c of ['exact', 'within15min', 'within1hour', 'unknown'] as BirthTimeConfidence[]) {
      expect(approximateNote(c).length).toBeGreaterThan(10);
    }
  });
});

describe('birthInstantUTC', () => {
  it('subtracts the offset that was in force at the birthplace', () => {
    // 06:12 IST = 00:42 UTC the same day.
    expect(birthInstantUTC(BIRTH).toISOString()).toBe('1994-03-14T00:42:00.000Z');
  });

  it('uses local noon when the time is unknown, not midnight', () => {
    // Noon is the placeholder that keeps the King and PM right; midnight would bias the
    // chart to one edge of the day for no reason.
    const b: BirthData = { ...BIRTH, unknownTime: true };
    delete (b as { time?: string }).time;
    expect(birthInstantUTC(b).toISOString()).toBe('1994-03-14T06:30:00.000Z');
  });
});

describe('courtAt on a real computed chart', () => {
  const at = new Date('2026-07-29T12:00:00Z');

  it('returns five seats, King first, each nested inside the last', () => {
    const seats = courtAt(chart, at, 'exact');
    expect(seats).toHaveLength(5);
    expect(seats.map((s) => s.meta.label)).toEqual(
      OFFICES.map((o) => o.label),
    );
    for (let i = 1; i < seats.length; i++) {
      expect(seats[i]!.start.getTime()).toBeGreaterThanOrEqual(seats[i - 1]!.start.getTime());
      expect(seats[i]!.end.getTime()).toBeLessThanOrEqual(seats[i - 1]!.end.getTime());
    }
  });

  it('progress is elapsed over THAT period, in 0..1, and terms shorten inward-out', () => {
    const seats = courtAt(chart, at, 'exact');
    for (const s of seats) {
      expect(s.progress).toBeGreaterThanOrEqual(0);
      expect(s.progress).toBeLessThanOrEqual(1);
      expect(s.remainingMs).toBeGreaterThan(0);
      expect(s.totalMs).toBeGreaterThan(0);
    }
    for (let i = 1; i < seats.length; i++) {
      expect(seats[i]!.totalMs).toBeLessThan(seats[i - 1]!.totalMs);
    }
  });

  it('the King runs for years and the Messenger for hours or days', () => {
    const seats = courtAt(chart, at, 'exact');
    const DAY = 86_400_000;
    expect(seats[0]!.totalMs / DAY).toBeGreaterThan(6 * 365); // shortest maha is Sun, 6y
    expect(seats[4]!.totalMs / DAY).toBeLessThan(6);          // longest prana is ~5.5 days
  });

  it('drops hidden seats and reverses to fastest-first for display', () => {
    const seats = courtAt(chart, at, 'within1hour'); // Magistrate + Messenger hidden
    const shown = courtFastestFirst(seats);
    expect(shown).toHaveLength(3);
    expect(shown[0]!.meta.office).toBe('governor'); // fastest still visible
    expect(shown[2]!.meta.office).toBe('king');
  });
});

describe('nextTurn', () => {
  const at = new Date('2026-07-29T12:00:00Z');

  it('hands over exactly where the current Prime Minister term ends', () => {
    const turn = nextTurn(chart, at, 'antar')!;
    expect(turn).not.toBeNull();
    expect(turn.incoming.start.getTime()).toBe(turn.outgoing.end.getTime());
    expect(turn.incoming.lord).not.toBe(turn.outgoing.lord);
    expect(turn.outgoing.meta.office).toBe('primeMinister');
  });
});

describe('chooseCutLevel', () => {
  it('picks a level that yields a readable number of stages', () => {
    const from = new Date('2026-08-01T00:00:00Z');
    const to = new Date('2027-08-01T00:00:00Z');
    const level = chooseCutLevel(chart, from, to, 'exact');
    const n = periodsBetween(chart, level, from, to).length;
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(9);
  });

  it('never cuts deeper than the birth time can support', () => {
    const from = new Date('2026-08-01T00:00:00Z');
    const to = new Date('2026-09-01T00:00:00Z'); // a month — deep levels would fit
    const level = chooseCutLevel(chart, from, to, 'unknown');
    // With no birth time only the King is solid, so cutting stops at Prime Minister.
    expect(level).toBe('antar');
  });
});
