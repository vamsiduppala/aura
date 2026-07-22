import { useMemo } from 'react';
import type { Aura, Chart, LifeArea } from '@aura/engine';
import { Button } from '@/components/ui/button';
import { energyColor, energyLabel, fmtMonthYear } from '../ui';

/** "Prove It" — shown after onboarding, before Today. The engine, run backwards. */
export function Audit({ aura, chart, now, goalArea, onContinue }: {
  aura: Aura; chart: Chart; now: Date; goalArea?: LifeArea; onContinue: () => void;
}) {
  const retro = useMemo(
    () => aura.retrospective(chart, now, goalArea ? { focusArea: goalArea } : {}),
    [aura, chart, now, goalArea],
  );

  return (
    <div className="view" style={{ maxWidth: 640, margin: '0 auto', width: '100%', paddingTop: 8 }}>
      <div className="label" style={{ textAlign: 'center' }}>Before we look ahead</div>
      <h2 className="serif-h" style={{ fontSize: 30, textAlign: 'center', margin: '10px 0 10px' }}>
        First, let me tell you<br />about your past.
      </h2>
      <p className="body" style={{ textAlign: 'center', marginBottom: 30 }}>
        You didn’t tell me any of this. It’s read straight from your timing — the same math that
        will read your today.
      </p>

      <div>
        {retro.map((r, i) => {
          const c = energyColor(r.energy);
          return (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '18px 0', borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
              <span style={{ width: 3, borderRadius: 3, background: c, alignSelf: 'stretch', boxShadow: `0 0 10px -2px ${c}` }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--grotesk)', fontWeight: 600, fontSize: 14, letterSpacing: '.03em', color: c }}>
                    {energyLabel(r.energy).toUpperCase()}
                  </span>
                  <span style={{ fontFamily: 'var(--grotesk)', fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--mist-3)' }}>
                    {fmtMonthYear(r.start)} – {fmtMonthYear(r.end)}
                  </span>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.62, color: 'var(--mist)' }}>{r.statement}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cta-zone" style={{ marginTop: 30 }}>
        <Button onClick={onContinue}>That’s me. Show me today <span>→</span></Button>
        <div className="fineprint" style={{ marginTop: 12 }}>
          If that landed, your daily reading will feel the same way.
        </div>
      </div>
    </div>
  );
}
