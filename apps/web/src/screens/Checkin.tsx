import { useState } from 'react';
import type { Checkin, LifeArea } from '@aura/engine';
import { StatusBar } from '../components/Chrome';
import { OrbChip } from '../components/AuraOrb';
import { energyColor } from '../ui';
import type { Energy } from '@aura/engine';

const MOODS = [
  { key: 'focused', em: '◔', label: 'Focused' },
  { key: 'foggy', em: '◍', label: 'Foggy' },
  { key: 'anxious', em: '◌', label: 'Anxious' },
  { key: 'wired', em: '◉', label: 'Wired' },
  { key: 'drained', em: '○', label: 'Drained' },
  { key: 'restless', em: '◑', label: 'Restless' },
];

const FOCUS: { label: string; area: LifeArea }[] = [
  { label: 'Money', area: 'money' },
  { label: 'Work', area: 'career' },
  { label: 'Love', area: 'partnership' },
  { label: 'Self', area: 'self' },
  { label: 'Rest', area: 'release' },
];

export function Checkin({ major, passing, onDone, onSkip }: {
  major: Energy; passing: Energy;
  onDone: (c: Checkin) => void; onSkip: () => void;
}) {
  const [mood, setMood] = useState<string | undefined>();
  const [focus, setFocus] = useState<LifeArea | undefined>();

  return (
    <>
      <StatusBar />
      <div className="view s4">
        <OrbChip e1={energyColor(major)} e2={energyColor(passing)} size={44} />
        <h2>Before I read you —<br />where’s your head?</h2>
        <div className="sub">One tap. It tunes today’s reading to where you actually are.</div>

        <div className="qh">The mood</div>
        <div className="moodgrid">
          {MOODS.map((m) => (
            <div key={m.key} className={`mood${mood === m.key ? ' on' : ''}`} onClick={() => setMood((v) => v === m.key ? undefined : m.key)}>
              <span className="em">{m.em}</span>{m.label}
            </div>
          ))}
        </div>

        <div className="qh">What matters today</div>
        <div className="chips">
          {FOCUS.map((f) => (
            <span key={f.area} className={`chip${focus === f.area ? ' on' : ''}`} onClick={() => setFocus((v) => v === f.area ? undefined : f.area)}>{f.label}</span>
          ))}
        </div>

        <div className="cta-zone">
          <button className="btn" onClick={() => onDone({ ...(mood ? { mood } : {}), ...(focus ? { focus } : {}) })}>
            Tune my reading <span>→</span>
          </button>
          <button className="btn ghost" onClick={onSkip}>Skip — read me cold</button>
        </div>
      </div>
    </>
  );
}
