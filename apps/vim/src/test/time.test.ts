import { describe, expect, it } from 'vitest';
import { countdownParts, dateRange, humanRemaining, humanTotal, timeLeft } from '../core/time';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('humanRemaining', () => {
  it('shows at most two units, largest first', () => {
    expect(humanRemaining(4.2 * 365.2425 * DAY)).toBe('4y 2m');
    expect(humanRemaining(22 * DAY)).toBe('22d');
    expect(humanRemaining(3 * DAY + 4 * HOUR)).toBe('3d 4h');
    expect(humanRemaining(41 * MIN)).toBe('41m');
  });

  it('drops the smaller unit when it is zero rather than showing "4y 0m"', () => {
    expect(humanRemaining(4 * 365.2425 * DAY)).toBe('4y');
    expect(humanRemaining(3 * DAY)).toBe('3d');
  });

  it('never renders a negative or zero span as a duration', () => {
    expect(humanRemaining(0)).toBe('ending now');
    expect(humanRemaining(-5000)).toBe('ending now');
    expect(timeLeft(0)).toBe('handing over');
  });

  it('falls back to seconds under a minute, so a Messenger term never reads as 0m', () => {
    expect(humanRemaining(30_000)).toBe('30s');
  });
});

describe('humanTotal', () => {
  it('spells a long term out in words', () => {
    const ms = 1 * 365.2425 * DAY + 7 * 30.436875 * DAY + 30 * DAY;
    expect(humanTotal(ms)).toBe('1 year, 7 months, 30 days');
  });

  it('uses hours and minutes for a term shorter than a day', () => {
    expect(humanTotal(5 * HOUR + 20 * MIN)).toBe('5 hours, 20 minutes');
  });

  it('singularises', () => {
    expect(humanTotal(1 * DAY)).toBe('1 day');
  });
});

describe('countdownParts', () => {
  it('splits a span into days, hours, mins, secs', () => {
    const t = countdownParts(471 * DAY + 8 * HOUR + 42 * MIN + 17_000);
    expect(t).toMatchObject({ days: 471, hours: 8, mins: 42, secs: 17 });
    expect(t.showDays).toBe(true);
    expect(t.urgent).toBe(false);
  });

  it('drops the DAYS block under 24 hours', () => {
    expect(countdownParts(23 * HOUR).showDays).toBe(false);
    expect(countdownParts(25 * HOUR).showDays).toBe(true);
  });

  it('goes urgent under an hour', () => {
    expect(countdownParts(59 * MIN).urgent).toBe(true);
    expect(countdownParts(61 * MIN).urgent).toBe(false);
  });

  it('clamps a past handover to zero instead of counting backwards', () => {
    expect(countdownParts(-10 * DAY)).toMatchObject({ days: 0, hours: 0, mins: 0, secs: 0 });
  });
});

describe('dateRange', () => {
  it('collapses the year when both ends share one', () => {
    const a = new Date('2026-03-12T00:00:00Z');
    const b = new Date('2026-11-11T00:00:00Z');
    // The start omits the year; the end always carries it.
    expect(dateRange(a, b)).toMatch(/2026/);
    expect(dateRange(a, b).split('2026')).toHaveLength(2);
  });
});
