// Planner — the plans list. Home tab.
//
// Every number on a card is derived at render time: which stage is running, how far through
// the window you are, how many days are left. Nothing about a stage is stored except the
// checklist ticks, so a plan can never drift out of sync with the chart it was cut from.

import { useMemo, useRef } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { Pressable, ProgressTrack } from '../components/neu';
import { categoryDef } from '../content/plans';
import { courtAt } from '../core/court';
import { derivePlan, stageArchetype, type Plan } from '../core/plan';
import { humanRemaining, shortDate } from '../core/time';
import { useNow } from '../hooks/useNow';
import { useRingSweep } from '../hooks/useRingSweep';
import { PLANET } from '../theme/tokens';
import { useVim } from '../store/useVim';

export function Planner() {
  const { chart, confidence, plans, go } = useVim();
  const now = useNow(60_000);
  const seats = useMemo(
    () => (chart ? courtAt(chart, now, confidence) : []),
    [chart, now, confidence],
  );
  const king = seats[0];
  const pm = seats[1];

  const active = plans.filter((p) => !p.archived);
  const archived = plans.filter((p) => p.archived);

  return (
    <div className="page">
      <header className="screen-head screen-head-row">
        <div>
          {king && (
            <p className="t-sub">
              <span style={{ color: PLANET[king.lord].ring }}>{PLANET[king.lord].name}</span> King
              {pm && pm.visibility !== 'hidden' && (
                <>
                  {' · '}
                  <span style={{ color: PLANET[pm.lord].ring }}>{PLANET[pm.lord].name}</span> Prime Minister
                </>
              )}
            </p>
          )}
        </div>
        <Pressable
          aria-label="New plan"
          className="head-add"
          onClick={() => go({ kind: 'newPlan' })}
        >
          <Plus size={20} aria-hidden />
        </Pressable>
      </header>

      {active.length === 0 && (
        <div className="empty-state neu-raised">
          <h2 className="t-plan-title">Nothing planned yet.</h2>
          <p className="t-body">
            Pick something you actually want to move on. We'll time it against your chart and
            cut it into stages along your own daśā boundaries — so you know which stretch
            rewards pushing and which one doesn't.
          </p>
          <Pressable variant="primary" onClick={() => go({ kind: 'newPlan' })}>
            Start a plan
          </Pressable>
        </div>
      )}

      <div className="card-grid">
        {active.map((plan) => <PlanCard key={plan.id} plan={plan} now={now} />)}
      </div>

      {archived.length > 0 && (
        <>
          <h2 className="t-section-label" style={{ margin: '28px 0 10px 4px' }}>Archived</h2>
          <div className="card-grid">
            {archived.map((plan) => <PlanCard key={plan.id} plan={plan} now={now} archived />)}
          </div>
        </>
      )}
    </div>
  );
}

function PlanCard({ plan, now, archived }: { plan: Plan; now: Date; archived?: boolean }) {
  const { chart, confidence, go } = useVim();
  // The card's mini ring is the same activity ring at a smaller size, so it gets the same
  // one-shot sweep rather than a second, subtly different animation.
  const ringRef = useRef<HTMLSpanElement>(null);
  useRingSweep(ringRef);
  const derived = useMemo(
    () => (chart ? derivePlan(plan, chart, confidence, now) : null),
    [plan, chart, confidence, now],
  );
  if (!derived) return null;

  const stage = derived.current ?? derived.stages[derived.stages.length - 1];
  const p = stage ? PLANET[stage.lord] : null;
  const archetype = stage ? stageArchetype(stage.archetype) : null;

  return (
    <button
      type="button"
      className="plan-card neu-raised neu-press"
      data-archived={archived}
      onClick={() => go({ kind: 'plan', id: plan.id })}
    >
      {/* The mini wheel: one ring, this stage's own progress. Same rule as the big
          wheel — elapsed over THIS period, never absolute time. */}
      <span className="mini-ring" ref={ringRef} aria-hidden>
        <svg viewBox="0 0 64 64" width="64" height="64">
          <circle cx="32" cy="32" r="27" fill="none" stroke="var(--surface-track-deep)" strokeWidth="5" />
          {p && stage && (
            <circle
              className="ring-arc"
              cx="32" cy="32" r="27" fill="none" stroke={p.ring} strokeWidth="5"
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
              style={{
                strokeDasharray: 2 * Math.PI * 27,
                strokeDashoffset: 2 * Math.PI * 27 * (1 - stage.progress),
                ['--ring-c' as string]: `${2 * Math.PI * 27}`,
              }}
            />
          )}
        </svg>
        {stage && (
          <span className="mini-ring-label">
            <b>{stage.ordinal}</b>
            <em>of {derived.stages.length}</em>
          </span>
        )}
      </span>

      <span className="plan-body">
        <span className="t-plan-title plan-title">{plan.title}</span>
        <span className="t-duration-note">
          {categoryDef(plan.category).label} · cut by {derived.cutOffice.label} terms
        </span>
        {stage && p && archetype && (
          <span className="plan-meta">
            <span
              className="mode-pill"
              data-mode={stage.archetype}
              style={{ color: p.tabInk, background: p.tabFill }}
              title={archetype.gloss}
            >
              {archetype.label}
            </span>
            <span className="plan-meta-text">
              {p.name} · {humanRemaining(stage.remainingMs)} left
            </span>
          </span>
        )}
        <span className="plan-progress">
          <ProgressTrack
            value={derived.overallProgress}
            tint={p?.ring ?? 'var(--brass-base)'}
            label={`${plan.title}, ${Math.round(derived.overallProgress * 100)} percent through`}
          />
          <span className="plan-target">
            {derived.daysLeft > 0
              ? `${shortDate(new Date(`${plan.horizonEnd}T12:00:00`))}`
              : 'target passed'}
          </span>
        </span>
      </span>

      <ChevronRight size={16} className="court-chevron plan-chevron" aria-hidden />
    </button>
  );
}
