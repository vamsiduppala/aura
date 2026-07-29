// New plan — four steps, then the plan exists.
//
// The cut level is chosen from the real tree the moment a horizon is picked, and shown before
// the user commits: "We'll cut this into Governor terms — 4 stages." No plan is created from
// a number the app hasn't already computed.

import { useMemo, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Inset, Pressable } from '../components/neu';
import { CATEGORIES, categoryDef, suggestedTitle, tightHorizonWarning, type PlanCategory } from '../content/plans';
import { periodsBetween, chooseCutLevel } from '../core/court';
import { horizonOptions, isTightHorizon, newPlan } from '../core/plan';
import { shortDate } from '../core/time';
import { OFFICES } from '../theme/tokens';
import { useVim } from '../store/useVim';

type Step = 'category' | 'situation' | 'horizon' | 'confirm';
const ORDER: Step[] = ['category', 'situation', 'horizon', 'confirm'];

export function NewPlan() {
  const { chart, confidence, addPlan, go } = useVim();
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<PlanCategory | null>(null);
  const [situation, setSituation] = useState('');
  const [notes, setNotes] = useState('');
  const [horizon, setHorizon] = useState('');
  const [title, setTitle] = useState('');

  const now = useMemo(() => new Date(), []);
  const horizons = useMemo(() => horizonOptions(now), [now]);

  // The real cut, computed from the chart before anything is saved.
  const cut = useMemo(() => {
    if (!chart || !horizon) return null;
    const to = new Date(`${horizon}T23:59:59`);
    const level = chooseCutLevel(chart, now, to, confidence);
    const count = periodsBetween(chart, level, now, to).length;
    const office = OFFICES.find((o) => o.dashaLevel === level) ?? OFFICES[1]!;
    return { level, count, office };
  }, [chart, horizon, confidence, now]);

  const idx = ORDER.indexOf(step);
  const back = () => (idx === 0 ? go({ kind: 'tabs' }) : setStep(ORDER[idx - 1]!));

  const create = () => {
    if (!category || !horizon) return;
    addPlan(newPlan({
      title: title.trim() || suggestedTitle(category),
      category,
      situation,
      notes,
      horizonEnd: horizon,
    }));
  };

  return (
    <div className="screen-scroll onboard">
      <header className="onboard-head">
        <Pressable variant="flat" aria-label="Back" onClick={back}>
          <ArrowLeft size={20} aria-hidden />
        </Pressable>
        <div className="onboard-dots" aria-hidden>
          {ORDER.map((s, i) => (
            <span key={s} className="onboard-dot" data-on={i <= idx} />
          ))}
        </div>
      </header>

      {step === 'category' && (
        <section className="onboard-step">
          <h1 className="t-page-title">What are you working on?</h1>
          <p className="t-sub onboard-hint">
            Pick the one that fits closest. You can change it later.
          </p>
          <div className="stack" style={{ gap: 8 }}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.key}
                className="choice"
                aria-pressed={category === c.key}
                onClick={() => { setCategory(c.key); setSituation(''); }}
              >
                <span className="choice-radio" data-on={category === c.key} aria-hidden>
                  {category === c.key && <Check size={13} strokeWidth={3} />}
                </span>
                <span className="choice-stack">
                  <span className="choice-label">{c.label}</span>
                  <span className="t-duration-note">{c.sub}</span>
                </span>
              </Pressable>
            ))}
          </div>
          <Pressable variant="primary" disabled={!category} onClick={() => setStep('situation')}>
            Continue
          </Pressable>
        </section>
      )}

      {step === 'situation' && category && (
        <section className="onboard-step">
          <h1 className="t-page-title">Where are you right now?</h1>
          <p className="t-sub onboard-hint">
            Be honest about the starting line — the plan is only as good as this answer.
          </p>
          <div className="stack" style={{ gap: 8 }}>
            {categoryDef(category).situations.map((s) => (
              <Pressable
                key={s}
                className="choice"
                aria-pressed={situation === s}
                onClick={() => setSituation(s)}
              >
                <span className="choice-radio" data-on={situation === s} aria-hidden>
                  {situation === s && <Check size={13} strokeWidth={3} />}
                </span>
                <span className="choice-label">{s}</span>
              </Pressable>
            ))}
          </div>

          <h2 className="t-section-label" style={{ marginTop: 22 }}>
            Anything we should know? (optional)
          </h2>
          <Inset className="field field-multiline">
            <textarea
              className="field-input"
              rows={3}
              value={notes}
              placeholder="Constraints, deadlines, people involved, what you've already tried…"
              onChange={(e) => setNotes(e.target.value)}
              aria-label="Anything we should know"
            />
          </Inset>

          <Pressable variant="primary" disabled={!situation} onClick={() => setStep('horizon')}>
            Continue
          </Pressable>
        </section>
      )}

      {step === 'horizon' && (
        <section className="onboard-step">
          <h1 className="t-page-title">By when?</h1>
          <p className="t-sub onboard-hint">A real date makes the stages real.</p>

          <div className="chip-row">
            {horizons.map((h) => (
              <Pressable
                key={h.label}
                className="chip"
                aria-pressed={horizon === h.iso}
                onClick={() => setHorizon(h.iso)}
              >
                {h.label}
              </Pressable>
            ))}
          </div>

          <Inset className="field">
            <input
              className="field-input"
              type="date"
              value={horizon}
              min={horizons[0]!.iso}
              onChange={(e) => setHorizon(e.target.value)}
              aria-label="Target date"
            />
          </Inset>

          {horizon && isTightHorizon(horizon, now) && (
            <Inset soft className="effect-note">
              <p className="t-sub" style={{ margin: 0 }}>{tightHorizonWarning}</p>
            </Inset>
          )}

          {/* The real cut, shown before it is committed. */}
          {cut && (
            <Inset soft className="effect-note">
              <p className="t-sub" style={{ margin: 0 }}>
                We'll cut this into <strong style={{ color: 'var(--ink-primary)' }}>
                  {cut.office.label} terms</strong> — {cut.count}{' '}
                {cut.count === 1 ? 'stage' : 'stages'} between today and{' '}
                {shortDate(new Date(`${horizon}T12:00:00`))}.
              </p>
              {cut.count === 1 && (
                <p className="t-sub" style={{ margin: '8px 0 0' }}>
                  One ruler covers this whole window, so there's no pipeline to draw — just the
                  one set of conditions.
                </p>
              )}
            </Inset>
          )}

          <Pressable variant="primary" disabled={!horizon || !cut} onClick={() => setStep('confirm')}>
            Continue
          </Pressable>
        </section>
      )}

      {step === 'confirm' && category && (
        <section className="onboard-step">
          <h1 className="t-page-title">Name it.</h1>
          <p className="t-sub onboard-hint">
            Something you'd recognise in a list. We've suggested one.
          </p>
          <Inset className="field">
            <input
              className="field-input"
              type="text"
              value={title}
              placeholder={suggestedTitle(category)}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Plan name"
            />
          </Inset>
          <Inset soft className="effect-note">
            <p className="t-sub" style={{ margin: 0 }}>
              {categoryDef(category).label} · {situation}
              {cut && ` · ${cut.count} ${cut.office.label} stages`}
            </p>
          </Inset>
          <Pressable variant="primary" onClick={create}>Create the plan</Pressable>
        </section>
      )}
    </div>
  );
}
