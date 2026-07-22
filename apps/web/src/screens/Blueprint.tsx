import { useEffect, useMemo, useState } from 'react';
import type { Aura, Chart } from '@aura/engine';
import { energyColor, grahaColor, grahaLabel } from '../ui';
import { buildHouses, dignityChip, type HouseCard as HouseCardData } from '../kundali';
import { loadChartDashas, type DashaSnapshot } from '../services/liveData';
import { computeYearAhead, type YearAhead } from '../services/yearAhead';

const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

export function Blueprint({ aura, chart }: { aura: Aura; chart: Chart; goalName: string }) {
  const yogas = aura.yogas(chart);
  const k = useMemo(() => buildHouses(chart), [chart]);

  return (
    <div className="view s6 bp-wide">
      <div className="hd">
        <h2>Your chart</h2>
        <div className="sub">Your life read house by house — where each energy landed, and how it plays out.</div>
      </div>

      {/* Planet strengths — a short, plain list, no cards. */}
      <div className="pstrip">
        {k.strengths.map(({ graha, pct }) => (
          <span className="pstrip-item" key={graha}>
            <span className="pstrip-dot" style={{ background: grahaColor(graha) }} />
            <span className="pstrip-nm">{grahaLabel(graha)}</span>
            <b style={{ color: grahaColor(graha) }}>{pct}%</b>
          </span>
        ))}
      </div>

      {/* House cards — what each area of life is, and how your planets shape it. */}
      <div className="house-list">
        {k.houses.map((h) => <HouseCard key={h.house} h={h} />)}
      </div>

      {/* The rest of the chart, below. */}
      <div className="kundli-more">
        <div className="label" style={{ margin: '0 0 14px' }}>The foundations</div>

        <div className="ruler-hero" style={{ borderColor: `${grahaColor(k.lagnaLord)}55` }}>
          <span className="ruler-orb" style={{ background: `radial-gradient(circle at 34% 30%, ${grahaColor(k.lagnaLord)}, #23263f 76%)`, boxShadow: `0 0 22px -6px ${grahaColor(k.lagnaLord)}` }} />
          <div className="ruler-txt">
            <div className="ruler-kicker">Your ruler · lagnadhipathi</div>
            <div className="ruler-name" style={{ color: grahaColor(k.lagnaLord) }}>{grahaLabel(k.lagnaLord)}</div>
            <p className="chart-text" style={{ marginTop: 6 }}>{k.lagnaLordText}</p>
          </div>
        </div>

        <div className="lagna-card">
          <div className="lagna-kicker">Your rising sign · lagna</div>
          <div className="lagna-name">{k.lagnaSignName}</div>
          <p className="chart-text" style={{ marginTop: 6 }}>You meet the world with a {k.lagnaSignNote} quality — it’s the doorway everyone enters you through.</p>
        </div>

        {yogas.length > 0 ? (
          <div style={{ marginTop: 20 }}>
            <div className="label" style={{ marginBottom: 12 }}>Born gifts · rare in your chart</div>
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

        <TimingSystems chart={chart} />
        <YearAhead aura={aura} chart={chart} />
      </div>
    </div>
  );
}

// Tajaka "year ahead" — the solar-return chart's muntha + the year's strongest planet + fortune point.
function YearAhead({ aura, chart }: { aura: Aura; chart: Chart }) {
  const y = useMemo<YearAhead | null>(() => {
    try { return computeYearAhead(aura, chart, new Date()); } catch { return null; }
  }, [aura, chart]);
  if (!y) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <div className="label" style={{ marginBottom: 6 }}>Your year ahead · {y.year}</div>
      <div className="bp-meta" style={{ marginBottom: 12 }}>the Tajaka annual chart — cast for the Sun’s return to its birth spot</div>
      <div className="clock-row">
        <span className="clock-dot" style={{ background: 'var(--smoke)' }} />
        <div className="clock-txt">
          <b>Muntha</b> sits in your {y.munthaHouse}th house ({y.munthaSignName}) — the year leans toward {y.munthaMeaning}.
        </div>
      </div>
      <div className="clock-row">
        <span className="clock-dot" style={{ background: grahaColor(y.strongestPlanet) }} />
        <div className="clock-txt">
          <b>Strongest this year</b> — <span style={{ color: grahaColor(y.strongestPlanet) }}>{grahaLabel(y.strongestPlanet)}</span> (Harsha bala {y.strongestUnits}/20). Lean on it.
        </div>
      </div>
      <div className="clock-row">
        <span className="clock-dot" style={{ background: 'var(--bloom)' }} />
        <div className="clock-txt"><b>Fortune point</b> (Punya saham) falls in {y.punyaSahamSign} this year.</div>
      </div>
    </div>
  );
}

// Surfaces the multi-system dasha backend (via apps/api when running, else on-device).
function TimingSystems({ chart }: { chart: Chart }) {
  const [d, setD] = useState<DashaSnapshot | null>(null);
  useEffect(() => {
    let alive = true;
    loadChartDashas(chart).then((snap) => { if (alive) setD(snap); });
    return () => { alive = false; };
  }, [chart]);

  if (!d) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <div className="label" style={{ marginBottom: 6 }}>Your timing clocks</div>
      <div className="bp-meta" style={{ marginBottom: 12 }}>
        the traditional dasha systems your chart runs on · {d.source === 'server' ? 'live from your aura server' : 'computed on-device'}
      </div>

      <div className="clock-row">
        <span className="clock-dot" style={{ background: grahaColor(d.vimshottariNow.lord) }} />
        <div className="clock-txt">
          <b>Vimshottari</b> — right now you’re in <span style={{ color: grahaColor(d.vimshottariNow.lord) }}>{grahaLabel(d.vimshottariNow.lord)}</span>’s
          great period ({Math.round(d.vimshottariNow.pct)}% through).
          <span className="clock-birth"> Born in {grahaLabel(d.vimshottari.lord)}’s, with {d.vimshottari.yearsLeft.toFixed(1)} yrs left.</span>
        </div>
      </div>
      <div className="clock-row">
        <span className="clock-dot" style={{ background: grahaColor(d.ashtottariNow.lord) }} />
        <div className="clock-txt">
          <b>Ashtottari</b> (108-yr clock) — currently <span style={{ color: grahaColor(d.ashtottariNow.lord) }}>{grahaLabel(d.ashtottariNow.lord)}</span>’s
          period ({Math.round(d.ashtottariNow.pct)}% through).
          <span className="clock-birth"> Opened in {grahaLabel(d.ashtottari.lord)}’s.</span>
        </div>
      </div>
      <div className="clock-row">
        <span className="clock-dot" style={{ background: 'var(--slate)' }} />
        <div className="clock-txt">
          <b>Narayana</b> (rasi dasa) runs your signs in the order: {d.narayanaNames.slice(0, 6).join(' → ')} →…
        </div>
      </div>
    </div>
  );
}

function HouseCard({ h }: { h: HouseCardData }) {
  const empty = h.occupants.length === 0;
  return (
    <div className={`hcard${empty ? ' empty' : ''}`}>
      <div className="hcard-head">
        <span className="hcard-num">{ORD[h.house]}</span>
        <div className="hcard-id">
          <span className="hcard-name">{h.name}</span>
          <span className="hcard-sign">{h.signName}</span>
        </div>
        {!empty ? (
          <span className="hcard-count">{h.occupants.length} {h.occupants.length > 1 ? 'energies' : 'energy'}</span>
        ) : null}
      </div>
      <div className="hcard-governs">Shapes your {h.governs}.</div>

      {empty ? (
        <p className="chart-text hcard-empty">No energy sits here directly — this area takes its cue from its ruler,{' '}
          <span style={{ color: grahaColor(h.lord) }}>{grahaLabel(h.lord)}</span>, placed in your {ORD[h.lordHouse]} house.</p>
      ) : (
        h.occupants.map((o) => {
          const c = grahaColor(o.graha);
          const chip = dignityChip(o.dignity);
          const strong = o.dignity === 'exalted' || o.dignity === 'own' || o.dignity === 'moolatrikona';
          return (
            <div className="hocc" key={o.graha}>
              <span className="hocc-dot" style={{ background: c, boxShadow: `0 0 8px -1px ${c}` }} />
              <div className="hocc-txt">
                <div className="hocc-head">
                  <span className="hocc-name" style={{ color: c }}>{grahaLabel(o.graha)}</span>
                  <span className="hocc-str" style={{ color: c }}>{o.strength}%</span>
                  {o.vargottama ? <span className="chart-flag flag-strong">vargottama</span> : null}
                  {o.retrograde ? <span className="chart-flag">retrograde</span> : null}
                  {chip ? <span className={`chart-flag ${strong ? 'flag-strong' : o.dignity === 'debilitated' ? 'flag-weak' : ''}`}>{chip}</span> : null}
                </div>
                <p className="chart-text">{o.text}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
