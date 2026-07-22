import type { Aura, Chart } from '@aura/engine';
import { energyColor, energyLabel } from '../ui';

export function Blueprint({ aura, chart, goalName }: { aura: Aura; chart: Chart; goalName: string }) {
  const rows = aura.blueprint(chart);
  const yogas = aura.yogas(chart);
  const who = goalName.split('’')[0]!.split("'")[0]!.trim() || 'you';

  return (
    <>
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

        {yogas.length > 0 ? (
          <div style={{ marginTop: 24 }}>
            <div className="label" style={{ marginBottom: 14 }}>Born gifts · rare in your chart</div>
            {yogas.map((y) => (
              <div key={y.key} style={{ display: 'flex', gap: 13, padding: '12px 0', borderTop: '1px solid var(--line)' }}>
                <span style={{ width: 30, height: 30, borderRadius: '50%', flex: 'none', marginTop: 2, background: `radial-gradient(circle at 35% 30%, ${energyColor(y.energy)}, #2a2c46 78%)`, boxShadow: 'inset 0 0 8px -2px rgba(255,255,255,.5)' }} />
                <div>
                  <div style={{ fontFamily: 'var(--grotesk)', fontWeight: 600, fontSize: 14, color: energyColor(y.energy), marginBottom: 3 }}>{y.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--mist-2)', lineHeight: 1.5 }}>{y.blurb}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
