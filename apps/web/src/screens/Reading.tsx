import { useState } from 'react';
import type { Reading } from '@aura/engine';
import { PlanetTag } from '../components/PlanetTag';
import { energyColor, energyLabel, fmtDow } from '../ui';

// Fixed beat-marker colors (mockup visual language, independent of the energy).
const BEAT = {
  gift: '#7ED69B', trap: '#AE8FE6', move: '#FFD070', watch: '#FF6E58',
};

function Sect({ color, title, text }: { color: string; title: string; text: string }) {
  return (
    <div className="sect">
      <span className="node" style={{ background: color, boxShadow: `0 0 10px -1px ${color}` }} />
      <div className="hl">{title}</div>
      <p>{text}</p>
    </div>
  );
}

export function Reading({ reading, edge, now, onBack }: {
  reading: Reading; edge?: { name: string; note: string }; now: Date; onBack: () => void;
}) {
  const [done, setDone] = useState(false);
  const major = reading.energy;
  const passing = reading.passingEnergy ?? reading.energy;

  return (
    <>
      <div className="s3-top">
        <button className="back" onClick={onBack}>‹</button>
        <span className="ttl">Today’s reading</span>
        <span className="date">{fmtDow(now)}</span>
      </div>
      <div className="roll">
        <h2>{reading.headline}</h2>
        <div className="tags">
          <span className="tag"><span className="d" style={{ background: energyColor(major) }} />{energyLabel(major).toUpperCase()}<PlanetTag energy={major} /></span>
          <span className="tag"><span className="d" style={{ background: energyColor(passing) }} />{energyLabel(passing).toUpperCase()}<PlanetTag energy={passing} /></span>
        </div>

        <Sect color={BEAT.gift} title="The gift" text={reading.gift} />
        <Sect color={BEAT.trap} title="The trap" text={reading.trap} />
        <Sect color={BEAT.move} title="The move" text={reading.move} />
        <Sect color={BEAT.watch} title="Watch for" text={reading.watch} />

        <div className="remedy-card">
          <div className="rh"><span className="label">✦ The remedy</span></div>
          <p>{reading.remedy}</p>
          <div className="done" onClick={() => setDone((v) => !v)}>
            <span className={`ring${done ? ' on' : ''}`} /> {done ? 'Done today ✓' : 'Mark done today'}
          </div>
        </div>

        {reading.blendNote ? <div className="blend-note">{reading.blendNote}</div> : null}

        {edge ? (
          <div className="edge-note">
            <div className="label" style={{ marginBottom: 6 }}>Your edge to break the loop</div>
            <p><b>{edge.name}.</b> {edge.note}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
