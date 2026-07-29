// Plans, and the stages derived from them.
//
// A plan stores its INPUTS only — category, situation, notes, horizon. Stages are recomputed
// from the daśā tree every time they are read. That is deliberate: store computed dates and
// an engine fix leaves you with rows that are wrong but indistinguishable from rows that are
// right. The one thing persisted about a stage is what the user themselves ticked.

import type { Chart, DashaLevel, Graha } from '@aura/engine';
import { chooseCutLevel, periodsBetween, type BirthTimeConfidence } from './court';
import { stageChecklist, stageHeading, type PlanCategory } from '../content/plans';
import { OFFICES, type OfficeMeta } from '../theme/tokens';

export interface Plan {
  id: string;
  title: string;
  category: PlanCategory;
  /** Where they said they were when the plan was made. */
  situation: string;
  /** Free text — the single biggest quality lever on the plan. */
  notes: string;
  /** ISO date the plan is aimed at. */
  horizonEnd: string;
  /** ISO timestamp. Also the start of the stage window, so history is preserved. */
  createdAt: string;
  archived: boolean;
  /** `${ordinal}:${itemIndex}` → ticked. The only user-owned state on a stage. */
  checked: Record<string, boolean>;
}

export type StageState = 'done' | 'now' | 'next';

export interface PlanStage {
  ordinal: number;
  lord: Graha;
  office: OfficeMeta;
  start: Date;
  end: Date;
  heading: string;
  checklist: string[];
  state: StageState;
  /** 0..1 through this stage. 0 before it starts, 1 once it has passed. */
  progress: number;
  remainingMs: number;
  totalMs: number;
}

export interface DerivedPlan {
  /** Which daśā level the stages were cut from. Shown to the user: "cut by Governor terms". */
  cutLevel: DashaLevel;
  cutOffice: OfficeMeta;
  stages: PlanStage[];
  /** 0..1 across the whole plan window. */
  overallProgress: number;
  /** The stage running right now, if the plan is live. */
  current: PlanStage | undefined;
  daysLeft: number;
}

/**
 * Cut a plan into stages along real daśā boundaries.
 *
 * The count is whatever falls inside the window — **2 to 9, never padded to five**. A
 * one-month plan may cross only two Governor terms; a one-year plan might produce seven.
 * Exactly one period means no pipeline at all: one ruler covers the whole window.
 */
export function derivePlan(
  plan: Plan, chart: Chart, confidence: BirthTimeConfidence, now: Date,
): DerivedPlan {
  const from = new Date(plan.createdAt);
  const to = new Date(`${plan.horizonEnd}T23:59:59`);
  const cutLevel = chooseCutLevel(chart, from, to, confidence);
  const cutOffice = OFFICES.find((o) => o.dashaLevel === cutLevel) ?? OFFICES[1]!;
  const periods = periodsBetween(chart, cutLevel, from, to);

  const nowMs = now.getTime();
  const stages: PlanStage[] = periods.map((p, i) => {
    // A stage is clipped to the plan's own window at both ends: the first stage began before
    // the plan did, and the last one runs past the target date. Showing the daśā period's
    // true dates there would be honest but useless — the user asked about their window.
    const start = new Date(Math.max(p.start.getTime(), from.getTime()));
    const end = new Date(Math.min(p.end.getTime(), to.getTime()));
    const totalMs = Math.max(1, end.getTime() - start.getTime());
    const elapsed = nowMs - start.getTime();
    const state: StageState =
      nowMs >= end.getTime() ? 'done' : nowMs >= start.getTime() ? 'now' : 'next';
    return {
      ordinal: i + 1,
      lord: p.lord,
      office: cutOffice,
      start,
      end,
      heading: stageHeading(plan.category, p.lord),
      checklist: stageChecklist(p.lord),
      state,
      progress: Math.min(1, Math.max(0, elapsed / totalMs)),
      remainingMs: Math.max(0, end.getTime() - nowMs),
      totalMs,
    };
  });

  const windowMs = Math.max(1, to.getTime() - from.getTime());
  return {
    cutLevel,
    cutOffice,
    stages,
    overallProgress: Math.min(1, Math.max(0, (nowMs - from.getTime()) / windowMs)),
    current: stages.find((s) => s.state === 'now'),
    daysLeft: Math.max(0, Math.ceil((to.getTime() - nowMs) / 86_400_000)),
  };
}

/**
 * Push or Pause, from the ruling planet alone. This is the only place the app gives a
 * directional call, and it is a statement about the *kind of effort* that gets traction —
 * not a prediction about the outcome.
 *
 * Push planets move things by acting: Mars, Sun, Jupiter, Mercury, Rahu.
 * Pause planets reward patience, consolidation or release: Saturn, Venus, Moon, Ketu.
 */
export function stageMode(lord: Graha): 'push' | 'pause' {
  return ({
    mars: 'push', sun: 'push', jupiter: 'push', mercury: 'push', rahu: 'push',
    saturn: 'pause', venus: 'pause', moon: 'pause', ketu: 'pause',
  } as const)[lord];
}

/** How many of a stage's checklist items the user has ticked. */
export function tickedCount(plan: Plan, stage: PlanStage): number {
  return stage.checklist.filter((_, i) => plan.checked[`${stage.ordinal}:${i}`]).length;
}

/** A new plan. `crypto.randomUUID` is available in every target browser and in Capacitor. */
export function newPlan(input: {
  title: string;
  category: PlanCategory;
  situation: string;
  notes: string;
  horizonEnd: string;
}): Plan {
  return {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    category: input.category,
    situation: input.situation,
    notes: input.notes.trim(),
    horizonEnd: input.horizonEnd,
    createdAt: new Date().toISOString(),
    archived: false,
    checked: {},
  };
}

/** The horizon presets, as real dates computed from today. */
export function horizonOptions(now: Date): { label: string; iso: string }[] {
  const add = (months: number): string => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + months);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  return [
    { label: '1 month', iso: add(1) },
    { label: '3 months', iso: add(3) },
    { label: '6 months', iso: add(6) },
    { label: '1 year', iso: add(12) },
  ];
}

/** Under about six weeks, a plan gets dense enough to warn about. */
export const isTightHorizon = (horizonEnd: string, now: Date): boolean =>
  new Date(`${horizonEnd}T23:59:59`).getTime() - now.getTime() < 45 * 86_400_000;
