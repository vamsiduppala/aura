import type { Chart } from '@aura/engine';
import { buildBlueprint } from '@aura/engine';
import { StatusBar } from '../components/Chrome';
import { energyColor, energyLabel } from '../ui';

export function Blueprint({ chart, goalName }: { chart: Chart; goalName: string }) {
  const rows = buildBlueprint(chart);
  const who = goalName.split('’')[0]!.split("'")[0]!.trim() || 'you';

  return (
    <>
      <StatusBar />
      <div className="view s6">
        <div className="hd">
          <h2>Your blueprint</h2>
          <div className="sub">The energies you were born carrying.</div>
        </div>
        <div className="bpcard">
          <div className="cardmark"><span className="glyph" /> aura · {who}</div>
          {rows.map((row) => {
            const c = energyColor(row.energy);
            return (
              <div className="bprow" key={row.role}>
                <span className="en-dot" style={{ background: `radial-gradient(circle at 35% 30%, ${c}, #2a2c46 78%)` }} />
                <div className="txt">
                  <div className="rel">{row.role}</div>
                  <div className="en-nm" style={{ color: c }}>{energyLabel(row.energy).toUpperCase()}</div>
                  <div className="desc">{row.desc}</div>
                </div>
              </div>
            );
          })}
          <div className="share">
            <div className="share-btn">Share your blueprint ↗</div>
          </div>
        </div>
      </div>
    </>
  );
}
