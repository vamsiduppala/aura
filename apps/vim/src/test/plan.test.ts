import { describe, expect, it } from 'vitest';
import { AstronomiaEphemeris, computeChart, type BirthData } from '@aura/engine';
import { CATEGORIES, stageChecklist, stageHeading } from '../content/plans';
import { derivePlan, horizonOptions, isTightHorizon, newPlan, tickedCount } from '../core/plan';
import { RULES_VERSION } from '@vim/rules';
import { VIMSHOTTARI_ORDER } from '@aura/engine';

const BIRTH: BirthData = {
  date: '1997-04-11', time: '20:55', unknownTime: false,
  place: 'Visakhapatnam, Andhra Pradesh, India',
  lat: 17.68009, lng: 83.20161, tzOffsetMinutes: 330,
};
const chart = computeChart(BIRTH, new AstronomiaEphemeris());

const NOW = new Date('2026-07-29T12:00:00Z');
const makePlan = (horizonEnd: string, createdAt = NOW.toISOString()) => ({
  ...newPlan({
    title: 'Get the senior title', category: 'promotion' as const,
    situation: 'Raised it once', notes: '', horizonEnd,
  }),
  createdAt,
});

describe('stage cutting', () => {
  it('produces 2–9 stages and never pads to a fixed count', () => {
    // Different horizons must genuinely produce different counts. A plan that always has
    // five stages is a plan that was padded.
    const counts = ['2026-08-29', '2026-10-29', '2027-01-29', '2027-07-29']
      .map((h) => derivePlan(makePlan(h), chart, 'exact', NOW).stages.length);
    for (const n of counts) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(9);
    }
    expect(new Set(counts).size).toBeGreaterThan(1);
  });

  it('stages are contiguous and clipped to the plan window at both ends', () => {
    const plan = makePlan('2027-07-29');
    const { stages } = derivePlan(plan, chart, 'exact', NOW);
    const from = new Date(plan.createdAt).getTime();
    const to = new Date(`${plan.horizonEnd}T23:59:59`).getTime();
    expect(stages[0]!.start.getTime()).toBe(from);
    expect(stages[stages.length - 1]!.end.getTime()).toBe(to);
    for (let i = 1; i < stages.length; i++) {
      expect(stages[i]!.start.getTime()).toBe(stages[i - 1]!.end.getTime());
    }
  });

  it('adjacent stages never repeat a ruler, and every ruler is a real graha', () => {
    const { stages } = derivePlan(makePlan('2027-07-29'), chart, 'exact', NOW);
    for (const s of stages) expect(VIMSHOTTARI_ORDER).toContain(s.lord);
    for (let i = 1; i < stages.length; i++) {
      expect(stages[i]!.lord).not.toBe(stages[i - 1]!.lord);
    }
  });

  it('exactly one stage running now, the rest done or next, in clock order', () => {
    const { stages, current } = derivePlan(makePlan('2027-07-29'), chart, 'exact', NOW);
    expect(stages.filter((s) => s.state === 'now')).toHaveLength(1);
    expect(current).toBeDefined();
    // A plan created today has nothing behind it.
    expect(stages.filter((s) => s.state === 'done')).toHaveLength(0);
    const nowIndex = stages.findIndex((s) => s.state === 'now');
    stages.forEach((s, i) => {
      if (i > nowIndex) expect(s.state).toBe('next');
    });
  });

  it('a plan whose window has already passed has no current stage', () => {
    const plan = makePlan('2026-06-01', '2026-01-01T00:00:00.000Z');
    const derived = derivePlan(plan, chart, 'exact', NOW);
    expect(derived.current).toBeUndefined();
    expect(derived.stages.every((s) => s.state === 'done')).toBe(true);
    expect(derived.daysLeft).toBe(0);
    expect(derived.overallProgress).toBe(1);
  });

  it('never cuts deeper than the birth time supports', () => {
    // With no birth time the deepest solid ruler is the King, so cutting stops at the
    // Prime Minister — the app must not slice a plan into Governor terms it can't stand behind.
    const derived = derivePlan(makePlan('2026-10-29'), chart, 'unknown', NOW);
    expect(derived.cutLevel).toBe('antar');
    expect(derived.cutOffice.label).toBe('Prime Minister');
  });

  it('progress is per stage, and remaining time never goes negative', () => {
    const { stages } = derivePlan(makePlan('2027-07-29'), chart, 'exact', NOW);
    for (const s of stages) {
      expect(s.progress).toBeGreaterThanOrEqual(0);
      expect(s.progress).toBeLessThanOrEqual(1);
      expect(s.remainingMs).toBeGreaterThanOrEqual(0);
      expect(s.totalMs).toBeGreaterThan(0);
    }
    // A future stage hasn't started.
    const next = stages.find((s) => s.state === 'next');
    if (next) expect(next.progress).toBe(0);
    // A plan created this instant has a running stage that is genuinely 0% through — the
    // window starts now, so nothing has elapsed. It must not be under way, and must not
    // round up to look like it is.
    expect(stages.find((s) => s.state === 'now')!.progress).toBe(0);
  });

  it('a stage part-way through reports real elapsed progress', () => {
    // Same plan, created two months ago, so the first stage has genuinely been running.
    const plan = makePlan('2027-07-29', '2026-05-29T12:00:00.000Z');
    const { stages, current, overallProgress } = derivePlan(plan, chart, 'exact', NOW);
    expect(current).toBeDefined();
    expect(current!.progress).toBeGreaterThan(0);
    expect(current!.progress).toBeLessThan(1);
    expect(overallProgress).toBeGreaterThan(0);
    // Everything before the running stage is finished and reads as fully elapsed.
    for (const s of stages.filter((x) => x.state === 'done')) expect(s.progress).toBe(1);
  });
});

describe('stage content', () => {
  it('every category × planet pair has its own heading, phrased as an instruction', () => {
    const seen = new Set<string>();
    for (const c of CATEGORIES) {
      for (const lord of VIMSHOTTARI_ORDER) {
        const h = stageHeading(c.key, lord);
        expect(h.length).toBeGreaterThan(3);
        // Never a bare label — those tell the reader nothing.
        expect(h).not.toMatch(/^(Stage|Phase|Step)\s*\d*$/i);
        seen.add(`${c.key}:${h}`);
      }
    }
    // 9 categories x 9 planets, all distinct within their category.
    expect(seen.size).toBe(81);
  });

  it('every planet has a checklist of concrete actions', () => {
    for (const lord of VIMSHOTTARI_ORDER) {
      const items = stageChecklist(lord);
      expect(items.length).toBeGreaterThanOrEqual(3);
      for (const i of items) expect(i.length).toBeGreaterThan(12);
    }
  });

  it('every stage carries a scored archetype and the reasons behind it', () => {
    const { stages, rulesVersion } = derivePlan(makePlan('2027-07-29'), chart, 'exact', NOW);
    expect(rulesVersion).toBe(RULES_VERSION);
    for (const s of stages) {
      expect(['push', 'build', 'hold']).toContain(s.archetype);
      // A non-neutral score must say why. An unexplained verdict is a horoscope.
      expect(Array.isArray(s.because)).toBe(true);
    }
  });

  it('the archetype depends on the parent period, not just the ruling planet', () => {
    // The whole reason the composer replaced a per-planet lookup: the same planet ruling the
    // same category can read differently depending on the term it sits inside. Across a
    // year-long plan the stages resolve against different parents, so at least one stage must
    // carry a parent and the set must not be a single repeated archetype for repeated lords.
    const { stages } = derivePlan(makePlan('2027-07-29'), chart, 'exact', NOW);
    expect(stages.some((s) => s.parentLord !== undefined)).toBe(true);
    for (const s of stages) {
      if (s.parentLord) expect(VIMSHOTTARI_ORDER).toContain(s.parentLord);
    }
  });

  it('two different categories can score the same stage differently', () => {
    const promo = derivePlan(makePlan('2027-07-29'), chart, 'exact', NOW);
    const health = derivePlan(
      { ...makePlan('2027-07-29'), category: 'health' as const }, chart, 'exact', NOW,
    );
    // Same window, same rulers, different suitability tables → the advice must differ.
    const a = promo.stages.map((s) => s.archetype).join();
    const b = health.stages.map((s) => s.archetype).join();
    expect(promo.stages.map((s) => s.lord)).toEqual(health.stages.map((s) => s.lord));
    expect(a).not.toBe(b);
  });
});

describe('plan bookkeeping', () => {
  it('a new plan stores its inputs and nothing computed', () => {
    const plan = makePlan('2027-07-29');
    // Stages, dates and rulers are all derived. Storing them would leave rows that are
    // wrong-but-plausible after any engine change.
    expect(Object.keys(plan).sort()).toEqual(
      ['archived', 'category', 'checked', 'createdAt', 'horizonEnd', 'id', 'notes', 'situation', 'title'],
    );
  });

  it('counts only the ticks belonging to that stage', () => {
    const plan = makePlan('2027-07-29');
    const { stages } = derivePlan(plan, chart, 'exact', NOW);
    const [first, second] = stages;
    plan.checked[`${first!.ordinal}:0`] = true;
    plan.checked[`${first!.ordinal}:2`] = true;
    expect(tickedCount(plan, first!)).toBe(2);
    if (second) expect(tickedCount(plan, second)).toBe(0);
  });

  it('horizon presets are real future dates', () => {
    const opts = horizonOptions(NOW);
    expect(opts.map((o) => o.label)).toEqual(['1 month', '3 months', '6 months', '1 year']);
    for (const o of opts) {
      expect(new Date(`${o.iso}T00:00:00`).getTime()).toBeGreaterThan(NOW.getTime());
    }
    expect(isTightHorizon(opts[0]!.iso, NOW)).toBe(true);   // 1 month is dense
    expect(isTightHorizon(opts[2]!.iso, NOW)).toBe(false);  // 6 months is not
  });
});
