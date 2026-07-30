// Plan detail — the wheel, then The Path.
//
// The Path is a pipeline, not a numbered list: a rail of nodes with connectors between them,
// read top to bottom. A list can't carry direction, completion, and where-you-are-now at the
// same time; a deploy pipeline can, and everyone already knows how to read one.
//
// Stage states: done (solid node, heavy checkmark, solid connector in the stage colour),
// running now (halo, full-opacity tab, taller), not started (hollow node, dashed connector).

import { useMemo } from 'react';
import { ArrowLeft, Check, Trash2 } from 'lucide-react';
import { Inset, Pressable, ProgressTrack } from '../components/neu';
import { Wheel } from '../components/Wheel';
import { categoryDef } from '../content/plans';
import { DISCLAIMER } from '../content/court';
import { courtAt } from '../core/court';
import { derivePlan, stageArchetype, tickedCount, type PlanStage } from '../core/plan';
import { humanRemaining, shortDayMonth, shortDate } from '../core/time';
import { useNow } from '../hooks/useNow';
import { PLANET, WHEEL_PLAN } from '../theme/tokens';
import { useVim } from '../store/useVim';

export function PlanDetail({ id }: { id: string }) {
  const { chart, confidence, plans, go, removePlan } = useVim();
  const now = useNow(1000);
  const plan = plans.find((p) => p.id === id);

  const seats = useMemo(
    () => (chart ? courtAt(chart, now, confidence) : []),
    [chart, now, confidence],
  );
  const derived = useMemo(
    () => (plan && chart ? derivePlan(plan, chart, confidence, now) : null),
    [plan, chart, confidence, now],
  );

  if (!plan || !derived || !chart) return null;
  const current = derived.current;
  const currentPlanet = current ? PLANET[current.lord] : null;

  return (
    <div className="page detail">
      <header className="detail-head">
        <button type="button" className="tap detail-back" aria-label="Back to plans" onClick={() => go({ kind: 'tabs' })}>
          <ArrowLeft size={20} aria-hidden />
        </button>
        <p className="detail-crumb">
          {categoryDef(plan.category).label} · cut by {derived.cutOffice.label} terms
        </p>
      </header>

      <h1 className="t-plan-title">{plan.title}</h1>
      <p className="t-duration-note" style={{ marginTop: 4 }}>
        Target {shortDate(new Date(`${plan.horizonEnd}T12:00:00`))}
        {derived.daysLeft > 0 ? ` · ${derived.daysLeft} days left` : ' · target passed'}
      </p>

      <div className="detail-progress" style={{ marginTop: 12 }}>
        <ProgressTrack
          value={derived.overallProgress}
          tint={currentPlanet?.ring ?? 'var(--brass-base)'}
          label={`Overall, ${Math.round(derived.overallProgress * 100)} percent through the window`}
        />
        <span className="time-pill">{Math.round(derived.overallProgress * 100)}%</span>
      </div>

      {/* The plan wheel is the same component and the same live data as the Timeline's —
          the rings are the court, because the stages were cut from the court. */}
      <div className="panes">
        <div className="pane-lead">
      <div className="wheel-stage">
        <Wheel
          seats={seats}
          now={now}
          rings={WHEEL_PLAN}
          size="compact"
          onSelectLevel={(level) => go({ kind: 'office', level })}
          centre={
            current && currentPlanet ? (
              <>
                <span className="wheel-dot" style={{ background: currentPlanet.ring }} aria-hidden />
                <span className="wheel-eyebrow">
                  Stage {current.ordinal} · {stageArchetype(current.archetype).label}
                </span>
                <span className="wheel-readout">{humanRemaining(current.remainingMs)} left</span>
              </>
            ) : null
          }
        />
      </div>

        </div>

        <div>
      {derived.stages.length === 1 ? (
        <Inset soft className="effect-note">
          <p className="t-sub" style={{ margin: 0 }}>
            One ruler covers this whole window, so there's no pipeline — just the one set of
            conditions, below.
          </p>
        </Inset>
      ) : (
        <div className="path-head">
          <h2 className="t-screen-title">The Path</h2>
          <span className="court-head-right">
            {derived.stages.length} {derived.stages.length === 1 ? 'stage' : 'stages'}
          </span>
        </div>
      )}

      <ol className="pipeline">
        {derived.stages.map((stage, i) => (
          <PipelineStage
            key={stage.ordinal}
            stage={stage}
            last={i === derived.stages.length - 1}
            ticked={tickedCount(plan, stage)}
            onOpen={() => go({ kind: 'stage', id: plan.id, ordinal: stage.ordinal })}
          />
        ))}
      </ol>

        </div>
      </div>

      <button
        type="button"
        className="btn-flat"
        style={{ color: 'var(--status-danger-ink)', marginTop: 20 }}
        onClick={() => removePlan(plan.id)}
      >
        <Trash2 size={15} aria-hidden /> Delete this plan
      </button>

      <p className="disclaimer">{DISCLAIMER}</p>
    </div>
  );
}

function PipelineStage({
  stage, last, ticked, onOpen,
}: { stage: PlanStage; last: boolean; ticked: number; onOpen: () => void }) {
  const p = PLANET[stage.lord];
  const archetype = stageArchetype(stage.archetype);
  const isNow = stage.state === 'now';
  const done = stage.state === 'done';

  return (
    <li className="pipe-row" data-state={stage.state}>
      <span className="pipe-rail" aria-hidden>
        <span
          className="pipe-node"
          data-state={stage.state}
          style={done || isNow ? { background: p.ring, borderColor: p.ring } : undefined}
        >
          {done && <Check size={13} strokeWidth={3.4} className="pipe-check" />}
          {isNow && <span className="pipe-core" />}
          {/* One breathing halo. Two pulsing rings is a heart-rate monitor. */}
          {isNow && <span className="pipe-halo" style={{ borderColor: p.ring }} />}
        </span>
        {!last && (
          <span
            className="pipe-line"
            data-state={stage.state}
            style={done ? { background: p.ring } : undefined}
          />
        )}
      </span>

      <button
        type="button"
        className="stage-tab"
        data-state={stage.state}
        style={{
          background: isNow ? p.tabFillActive : p.tabFill,
          color: p.tabInk,
          ...(isNow ? { borderColor: p.ring, boxShadow: `0 0 18px ${p.ring}40` } : {}),
        }}
        onClick={onOpen}
      >
        {isNow && <span className="t-eyebrow stage-eyebrow">Running now</span>}
        <span className="stage-heading">{stage.heading}</span>
        <span className="stage-meta">
          {p.name} · {shortDayMonth(stage.start)} – {shortDayMonth(stage.end)}
          {done && <span className="stage-tag">DONE</span>}
        </span>
        {isNow && (
          <span className="stage-chip" style={{ borderColor: p.ring }}>
            {humanRemaining(stage.remainingMs)} left
          </span>
        )}
        {(isNow || done) && ticked > 0 && (
          <span className="stage-ticked">{ticked} of {stage.checklist.length} done</span>
        )}
        <span className="stage-mode" data-mode={stage.archetype} title={archetype.gloss}>
          {archetype.label}
        </span>
      </button>
    </li>
  );
}
