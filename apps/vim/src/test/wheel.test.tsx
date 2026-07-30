// The Wheel is a live graph, not a picture: each arc is filled to elapsed ÷ that period's
// own length, exactly like an Activity Ring. These tests pin the two properties that make
// that true, both of which were broken once.

import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { AstronomiaEphemeris, computeChart, type BirthData } from '@aura/engine';
import { Wheel } from '../components/Wheel';
import { courtAt } from '../core/court';

const BIRTH: BirthData = {
  date: '1994-03-14', time: '06:12', unknownTime: false,
  place: 'Hyderabad, Telangana, India', lat: 17.384, lng: 78.456, tzOffsetMinutes: 330,
};
const chart = computeChart(BIRTH, new AstronomiaEphemeris());

/** The fraction an arc is actually filled to, read back out of the DOM. */
function filledFractions(): number[] {
  return [...document.querySelectorAll('.ring-arc[data-arc]')].map((el) => {
    const style = (el as SVGElement).style;
    const circumference = parseFloat(style.strokeDasharray);
    const offset = parseFloat(style.strokeDashoffset);
    return 1 - offset / circumference;
  });
}

describe('the Wheel renders live progress', () => {
  afterEach(cleanup);

  it('fills each arc to its own period\'s elapsed fraction, with no frame callback', () => {
    // Regression: the entrance sweep used to be driven by a React state flip inside
    // requestAnimationFrame. rAF is throttled to zero in a background tab, so a wheel
    // rendered there sat at 0% for every ring — the app silently showed empty rings.
    // The arc's resting value must be the true one; animation is decoration on top.
    const now = new Date('2026-07-29T12:00:00Z');
    const seats = courtAt(chart, now, 'exact');
    render(<Wheel seats={seats} now={now} />);

    const fractions = filledFractions();
    expect(fractions).toHaveLength(5);
    for (const f of fractions) {
      expect(Number.isFinite(f)).toBe(true);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
    // Not all zero, and not all identical — five independent clocks, five different fills.
    expect(fractions.some((f) => f > 0.001)).toBe(true);
    expect(new Set(fractions.map((f) => f.toFixed(4))).size).toBeGreaterThan(1);
  });

  it('each arc matches the seat it is drawn for, to the fourth decimal', () => {
    const now = new Date('2026-07-29T12:00:00Z');
    const seats = courtAt(chart, now, 'exact');
    render(<Wheel seats={seats} now={now} />);

    // Arcs are drawn outermost-first (Messenger → King); seats are King → Messenger.
    const drawnOrder = [...document.querySelectorAll('.ring-arc[data-arc]')]
      .map((el) => Number((el as HTMLElement).dataset.arc));
    expect(drawnOrder).toEqual([5, 4, 3, 2, 1]);

    const fractions = filledFractions();
    drawnOrder.forEach((level, i) => {
      const seat = seats[level - 1]!;
      expect(fractions[i]).toBeCloseTo(seat.progress, 4);
    });
  });

  it('advances as the clock does — the same seats at a later instant read higher', () => {
    const t1 = new Date('2026-07-29T12:00:00Z');
    const seats = courtAt(chart, t1, 'exact');
    render(<Wheel seats={seats} now={t1} />);
    const before = filledFractions();
    cleanup();

    // Six hours later, against the SAME period boundaries: every ring must have moved on.
    const t2 = new Date(t1.getTime() + 6 * 3600_000);
    render(<Wheel seats={seats} now={t2} />);
    const after = filledFractions();

    after.forEach((f, i) => expect(f).toBeGreaterThan(before[i]!));
    // The fastest ring moves most: six hours is a large slice of a Messenger term and a
    // rounding error of a King's.
    expect(after[0]! - before[0]!).toBeGreaterThan(after[4]! - before[4]!);
  });

  it('renders correct values with no Web Animations API at all', () => {
    // jsdom has no Element.animate, which is exactly the environment this asserts: with the
    // entrance sweep unavailable the arcs must still show the truth. The sweep is decoration;
    // if it were load-bearing, an engine without WAAPI would render an empty wheel.
    expect(typeof (document.createElement('div') as Element & { animate?: unknown }).animate)
      .not.toBe('function');

    const now = new Date('2026-07-29T12:00:00Z');
    const seats = courtAt(chart, now, 'exact');
    render(<Wheel seats={seats} now={now} />);
    const fractions = filledFractions();
    expect(fractions).toHaveLength(5);
    expect(fractions.some((f) => f > 0.001)).toBe(true);
    seats.forEach((seat, i) => {
      // Arcs are drawn outermost-first, seats King-first.
      expect(fractions[4 - i]).toBeCloseTo(seat.progress, 4);
    });
  });

  it('does not draw hidden rings, so a low-confidence chart shows fewer arcs', () => {
    const now = new Date('2026-07-29T12:00:00Z');
    render(<Wheel seats={courtAt(chart, now, 'unknown')} now={now} />);
    // Unknown birth time: King solid, Prime Minister approximate, the rest hidden.
    expect(filledFractions()).toHaveLength(2);
  });

  it('labels every ring for a screen reader with role, planet, percent and time left', () => {
    const now = new Date('2026-07-29T12:00:00Z');
    render(<Wheel seats={courtAt(chart, now, 'exact')} now={now} />);
    const labels = [...document.querySelectorAll('circle[role="button"]')]
      .map((el) => el.getAttribute('aria-label') ?? '');
    expect(labels).toHaveLength(5);
    expect(labels[4]).toMatch(/^King ring\. \w+\. \d+ percent elapsed\. .+ remaining\./);
    // The Messenger is never stated as fact, so its label always says so.
    expect(labels[0]).toMatch(/Marked approximate/);
  });
});
