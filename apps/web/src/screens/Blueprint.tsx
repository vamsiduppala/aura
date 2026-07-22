import { useMemo, useState } from 'react';
import type { Aura, Chart } from '@aura/engine';
import { energyColor, energyLabel, grahaColor, grahaLabel } from '../ui';
import { PlanetTag } from '../components/PlanetTag';
import { buildKundali, dignityChip, type KundaliRow } from '../kundali';

export function Blueprint({ aura, chart, goalName }: { aura: Aura; chart: Chart; goalName: string }) {
  const rows = aura.blueprint(chart);
  const yogas = aura.yogas(chart);
  const kundali = useMemo(() => buildKundali(chart), [chart]);
  const who = goalName.split('’')[0]!.split("'")[0]!.trim() || 'you';
  const [shared, setShared] = useState<'idle' | 'copied'>('idle');
  const [openChart, setOpenChart] = useState(false);

  const shareText = [
    '✦ My aura blueprint',
    rows.map((r) => `${r.role} ${energyLabel(r.energy)}`).join(' · '),
    yogas.length ? `Born gifts: ${yogas.map((y) => y.name).join(', ')}` : '',
    '— one honest reading a day, no charts to learn.',
  ].filter(Boolean).join('\n');

  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'My aura blueprint', text: shareText }); return; }
      await navigator.clipboard.writeText(shareText);
      setShared('copied'); setTimeout(() => setShared('idle'), 2000);
    } catch { /* user cancelled or blocked — no-op */ }
  };

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
                  <div className="en-nm" style={{ color: c }}>
                    {energyLabel(row.energy).toUpperCase()}
                    <PlanetTag energy={row.energy} nameStyle={{ fontWeight: 500 }} />
                  </div>
                  <div className="desc">{row.desc}</div>
                </div>
              </div>
            );
          })}
          <div className="share">
            <button className="share-btn" onClick={share} style={{ width: '100%', cursor: 'pointer' }}>
              {shared === 'copied' ? 'Copied to clipboard ✓' : 'Share your blueprint ↗'}
            </button>
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

        {/* Full chart — the whole kundali, read out in plain language. */}
        <div className="chart-block" style={{ marginTop: 26 }}>
          <button
            className="chart-toggle"
            onClick={() => setOpenChart((o) => !o)}
            aria-expanded={openChart}
          >
            <span className="label" style={{ margin: 0 }}>Your whole chart · read out</span>
            <span className="chev">{openChart ? '−' : '+'}</span>
          </button>

          {openChart ? (
            <div className="chart-body">
              <p className="chart-lede">
                Everything below is your real birth chart, translated. You never need to learn it —
                but it’s all here.
              </p>

              <div className="lagna-row">
                <div className="lagna-head">
                  Rising sign — <strong>{kundali.lagnaSignName}</strong>
                  <span className="lagna-lord">
                    ruled by <PlanetTag graha={kundali.lagnaLord} />
                  </span>
                </div>
                <p className="chart-text">{kundali.lagnaLordText}</p>
              </div>

              {kundali.rows.map((r) => <ChartRow key={r.graha} r={r} />)}

              <p className="chart-foot">
                Nine planets, twelve houses — that’s the whole map. The daily reading is this,
                run forward in time.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

function ChartRow({ r }: { r: KundaliRow }) {
  const c = grahaColor(r.graha);
  const chip = dignityChip(r.dignity);
  return (
    <div className="chart-row">
      <span className="chart-dot" style={{ background: c, boxShadow: `0 0 7px -1px ${c}` }} />
      <div className="chart-row-txt">
        <div className="chart-row-head">
          <span className="chart-planet" style={{ color: c }}>{grahaLabel(r.graha)}</span>
          <span className="chart-loc">in your {ORD[r.house]} house · {r.signName}</span>
          {r.vargottama ? <span className="chart-flag flag-strong">vargottama</span> : null}
          {r.retrograde ? <span className="chart-flag">retrograde</span> : null}
          {r.combust ? <span className="chart-flag">combust</span> : null}
          {chip ? <span className={`chart-flag ${r.dignity === 'exalted' || r.dignity === 'own' || r.dignity === 'moolatrikona' ? 'flag-strong' : r.dignity === 'debilitated' ? 'flag-weak' : ''}`}>{chip}</span> : null}
        </div>
        <p className="chart-text">{r.text}</p>
      </div>
    </div>
  );
}
