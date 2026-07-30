// Task detail — one stage of one plan.
//
// Same structure as the daśā detail page, deliberately: the user learns one layout. The
// difference is that this one is written for the task rather than for the term, and it has a
// checklist that belongs to them.

import { useMemo } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Inset, Pressable, ProgressTrack } from '../components/neu';
import { DISCLAIMER, HEALTH_NOTE, advantageSections, kingdomLine, obstacleSections } from '../content/court';
import { categoryDef } from '../content/plans';
import { courtAt } from '../core/court';
import { derivePlan, stageMode } from '../core/plan';
import { dateRange, humanRemaining, humanTotal } from '../core/time';
import { useNow } from '../hooks/useNow';
import { PLANET } from '../theme/tokens';
import { useVim } from '../store/useVim';

export function StageDetail({ id, ordinal }: { id: string; ordinal: number }) {
  const { chart, confidence, plans, go, setTab, toggleCheck } = useVim();
  const now = useNow(1000);
  const plan = plans.find((p) => p.id === id);

  const derived = useMemo(
    () => (plan && chart ? derivePlan(plan, chart, confidence, now) : null),
    [plan, chart, confidence, now],
  );
  const stage = derived?.stages.find((s) => s.ordinal === ordinal);

  // Which office actually rules this stage right now — used for the "inside your…" crumb.
  const seats = useMemo(
    () => (chart ? courtAt(chart, now, confidence) : []),
    [chart, now, confidence],
  );

  if (!plan || !derived || !stage) return null;

  const p = PLANET[stage.lord];
  const mode = stageMode(stage.lord);
  const parent = seats[stage.office.level - 2];
  // Push stages lead with what works; Pause stages lead with what backfires. Same two
  // tabs everywhere in the app — the ruling planet just decides which one opens first.
  const sections = mode === 'push'
    ? advantageSections(stage.lord, stage.office.office)
    : obstacleSections(stage.lord, stage.office.office);
  const other = mode === 'push'
    ? obstacleSections(stage.lord, stage.office.office)
    : advantageSections(stage.lord, stage.office.office);

  return (
    <div className="page detail">
      <div className="detail-band" style={{ background: p.ring }} aria-hidden />

      <header className="detail-head">
        <button
          type="button" className="tap detail-back" aria-label="Back to the plan"
          onClick={() => go({ kind: 'plan', id: plan.id })}
        >
          <ArrowLeft size={20} aria-hidden />
        </button>
        <p className="detail-crumb">
          <span className="t-eyebrow" style={{ color: p.ring }}>
            Stage {stage.ordinal} of {derived.stages.length}
            {stage.state === 'now' && ' · running now'}
            {stage.state === 'done' && ' · finished'}
            {stage.state === 'next' && ' · not started'}
          </span>
        </p>
      </header>

      <h1 className="t-page-title">{stage.heading}</h1>
      <p className="detail-lord" style={{ color: p.ring }}>
        {p.name} as {stage.office.label}
        {parent && (
          <span className="detail-sanskrit">
            {' '}· inside your {PLANET[parent.lord].name} {parent.meta.label}
          </span>
        )}
      </p>
      <p className="t-duration-note" style={{ marginTop: 4 }}>{plan.title}</p>

      <Inset soft className="detail-dates">
        <p className="detail-range">{dateRange(stage.start, stage.end)}</p>
        <p className="t-duration-note">{humanTotal(stage.totalMs)}</p>
      </Inset>

      {stage.state === 'now' && (
        <div className="detail-progress">
          <ProgressTrack
            value={stage.progress}
            tint={p.ring}
            label={`Stage ${stage.ordinal}, ${Math.round(stage.progress * 100)} percent elapsed`}
          />
          <span className="time-pill">{humanRemaining(stage.remainingMs)} left</span>
        </div>
      )}

      <p className="t-section-label detail-kingdom-label">In the kingdom</p>
      <p className="t-kingdom">{kingdomLine(stage.lord, stage.office.office)}</p>

      <section className="checklist">
        <h2 className="detail-section-head">
          {mode === 'push' ? 'Do this now' : "Don't force this now"}
        </h2>
        <ul className="check-list">
          {stage.checklist.map((item, i) => {
            const key = `${stage.ordinal}:${i}`;
            const on = !!plan.checked[key];
            return (
              <li key={item}>
                <label className="check-row">
                  <input
                    type="checkbox"
                    className="check-box"
                    checked={on}
                    onChange={() => toggleCheck(plan.id, stage.ordinal, i)}
                  />
                  <span className="check-label" data-on={on}>{item}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="detail-sections">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="detail-section-head">{s.heading}</h2>
            <p className="t-body">{s.body}</p>
          </section>
        ))}
        {/* The other side is always available, never hidden — a stage that only tells you
            what works is a horoscope. */}
        {other.slice(0, 2).map((s) => (
          <section key={s.heading}>
            <h2 className="detail-section-head">{s.heading}</h2>
            <p className="t-body">{s.body}</p>
          </section>
        ))}
      </div>

      {plan.category === 'health' && (
        <Inset soft className="effect-note">
          <p className="t-sub" style={{ margin: 0 }}>{HEALTH_NOTE}</p>
        </Inset>
      )}

      {plan.notes && (
        <>
          <p className="t-section-label" style={{ marginTop: 26 }}>What you told us</p>
          <Inset soft className="effect-note" style={{ marginTop: 8 }}>
            <p className="t-sub" style={{ margin: 0 }}>{plan.notes}</p>
            <p className="t-duration-note" style={{ margin: '8px 0 0' }}>
              {categoryDef(plan.category).label} · {plan.situation}
            </p>
          </Inset>
        </>
      )}

      <Pressable variant="flat" className="detail-ask" onClick={() => setTab('mentor')}>
        Ask Mentor about this stage <ChevronRight size={15} aria-hidden />
      </Pressable>

      <p className="disclaimer">{DISCLAIMER}</p>
    </div>
  );
}
