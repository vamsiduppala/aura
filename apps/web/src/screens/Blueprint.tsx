import { useEffect, useMemo, useState } from 'react';
import type { Aura, Chart } from '@aura/engine';
import { energyColor, grahaColor, grahaLabel } from '../ui';
import { buildHouses, dignityChip, type HouseCard as HouseCardData } from '../kundali';
import { loadChartDashas, type DashaSnapshot } from '../services/liveData';
import { computeYearAhead, type YearAhead } from '../services/yearAhead';
import { buildPortrait, buildTechnicalFacts } from '../services/portrait';
import { readEmptyHouse } from '../services/emptyHouse';
import { SectionSkeleton } from '../components/States';
import { useAfterPaint } from '../hooks/useAfterPaint';

const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

export function Blueprint({ aura, chart, onDownload }: { aura: Aura; chart: Chart; goalName: string; onDownload?: () => void }) {
  const k = useMemo(() => buildHouses(chart), [chart]);
  // The engine's born-gift yogas, enriched with the knowledge-layer ones it doesn't emit. When the
  // specific Dharma-Karmadhipati is present we drop the engine's generic "raja" card so the rise
  // shows once, by its proper name.
  const yogas = useMemo(() => {
    const engine = aura.yogas(chart);
    const hasDK = k.extraGifts.some((g) => g.key === 'dharma-karmadhipati');
    const base = hasDK ? engine.filter((y) => y.key !== 'raja') : engine;
    return [...base, ...k.extraGifts];
  }, [aura, chart, k.extraGifts]);

  return (
    <div className="view s6 bp-wide">
      <div className="hd">
        <h2>Your chart</h2>
        <div className="sub">Your life read house by house — where each energy landed, and how it plays out.</div>
        {onDownload ? (
          <button className="bp-download" onClick={onDownload} title="Download your full chart report">
            ↓ Download full report
          </button>
        ) : null}
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

      {/* Who this chart describes, in plain language, before the house-by-house detail. */}
      <Portrait chart={chart} />

      {/* House cards — what each area of life is, and how your planets shape it. */}
      <div className="house-list">
        {k.houses.map((h) => <HouseCard key={h.house} h={h} chart={chart} />)}
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

        <div className="clock-row" style={{ borderTop: 'none', paddingTop: 0 }}>
          <span className="clock-dot" style={{ background: grahaColor(k.atmakaraka) }} />
          <div className="clock-txt">
            <b>Soul planet</b> (Atmakaraka) — <span style={{ color: grahaColor(k.atmakaraka) }}>{grahaLabel(k.atmakaraka)}</span>, your life’s core lesson.
            {' '}<b style={{ marginLeft: 6 }}>Partner planet</b> (Darakaraka) — <span style={{ color: grahaColor(k.darakaraka) }}>{grahaLabel(k.darakaraka)}</span>.
          </div>
        </div>

        <div className="clock-row">
          <span className="clock-dot" style={{ background: 'var(--smoke)' }} />
          <div className="clock-txt">
            <b>Chart shape</b> — <span style={{ color: 'var(--mist)' }}>{k.shape.name}</span> ({k.shape.means}): {k.shape.effect}
          </div>
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
        <TechnicalFacts chart={chart} />
      </div>
    </div>
  );
}

/** A plain-language read of the person — mind, decisions, lifestyle, environment, comfort. */
function Portrait({ chart }: { chart: Chart }) {
  const ready = useAfterPaint();
  const parts = useMemo(() => (ready ? buildPortrait(chart) : []), [chart, ready]);
  if (!ready) {
    return (
      <section className="portrait">
        <div className="label" style={{ marginBottom: 12 }}>Who this chart describes</div>
        <SectionSkeleton lines={4} label="Reading your temperament" />
      </section>
    );
  }
  return (
    <section className="portrait">
      <div className="label" style={{ marginBottom: 12 }}>Who this chart describes</div>
      {parts.map((s) => (
        <article className="portrait-item" key={s.title}>
          <h3>{s.title}</h3>
          <p>{s.body}</p>
        </article>
      ))}
    </section>
  );
}

/** The heavier classical machinery, for readers who want to see it. */
function TechnicalFacts({ chart }: { chart: Chart }) {
  const ready = useAfterPaint();
  const facts = useMemo(() => (ready ? buildTechnicalFacts(chart) : []), [chart, ready]);
  if (!ready) return <SectionSkeleton lines={3} label="Loading the deeper layers" />;
  return (
    <section style={{ marginTop: 26 }}>
      <div className="label" style={{ marginBottom: 6 }}>Deeper in the chart</div>
      <div className="bp-meta" style={{ marginBottom: 12 }}>the classical layers most readings never show you</div>
      {facts.map((f) => (
        <div className="techfact" key={f.label}>
          <div className="techfact-l">{f.label}</div>
          <p>{f.value}</p>
        </div>
      ))}
    </section>
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

  if (!d) {
    return (
      <div style={{ marginTop: 24 }}>
        <div className="label" style={{ marginBottom: 6 }}>Your timing clocks</div>
        <SectionSkeleton lines={3} label="Loading your timing systems" />
      </div>
    );
  }
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

function HouseCard({ h, chart }: { h: HouseCardData; chart: Chart }) {
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
        <EmptyHouse h={h} chart={chart} />
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

/** A house with no planets is read from its ruler — where it sits, how strong, and what it depends on. */
function EmptyHouse({ h, chart }: { h: HouseCardData; chart: Chart }) {
  const r = useMemo(() => readEmptyHouse(chart, h.house), [chart, h.house]);
  const c = grahaColor(h.lord);
  return (
    <div className="emptyh">
      <p className="chart-text">{r.headline}</p>
      <p className="chart-text emptyh-plays">{r.playsOut}</p>
      <div className="emptyh-dep" style={{ borderLeftColor: c }}>
        <span className="emptyh-tag">What it depends on</span>
        <p className="chart-text">{r.dependsOn}</p>
      </div>
    </div>
  );
}
