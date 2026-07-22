import { useMemo, useState } from 'react';
import type { Aura, Chart, Energy } from '@aura/engine';
import { energyColor, energyLabel, grahaColor, grahaLabel, grahaOfEnergy } from '../ui';
import { PlanetTag } from '../components/PlanetTag';
import { buildKundali, dignityChip, type KundaliRow } from '../kundali';

// A metaphor for each blueprint role — the user asked every section to be explained with one.
const ROLE_META: Record<string, string> = {
  'Anchored by': 'your keel — what keeps you upright when the seas get rough',
  'Driven by': 'your engine — the energy that actually gets you moving',
  'Softened by': 'your cushion — the grace that takes the edge off everything',
  'Guided by': 'your compass — the quiet inner needle you steer by',
};

function StrengthMeter({ pct, color }: { pct: number; color: string }) {
  return (
    <span className="strmeter" title={`${pct}% natal strength`}>
      <span className="strbar"><span className="strfill" style={{ width: `${pct}%`, background: color }} /></span>
      <span className="strpct" style={{ color }}>{pct}%</span>
    </span>
  );
}

export function Blueprint({ aura, chart, goalName }: { aura: Aura; chart: Chart; goalName: string }) {
  const rows = aura.blueprint(chart);
  const yogas = aura.yogas(chart);
  const kundali = useMemo(() => buildKundali(chart), [chart]);
  const who = goalName.split('’')[0]!.split("'")[0]!.trim() || 'you';
  const [shared, setShared] = useState<'idle' | 'copied'>('idle');
  const [openChart, setOpenChart] = useState(false);

  const strengthOf = (e: Energy) => Math.round((chart.planets[grahaOfEnergy(e)].strength ?? 0) * 100);

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
    <div className="view s6 bp-wide">
      <div className="hd">
        <h2>Your blueprint</h2>
        <div className="sub">The energies you were born carrying — with the real chart underneath.</div>
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
                <div className="bp-meta">{ROLE_META[row.role]}</div>
                <div className="desc">{row.desc}</div>
                <StrengthMeter pct={strengthOf(row.energy)} color={c} />
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
          <div className="label" style={{ marginBottom: 6 }}>Born gifts · rare in your chart</div>
          <div className="bp-meta" style={{ marginBottom: 12 }}>the aces you were dealt at birth — most charts don’t hold these</div>
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

      {/* Full chart — lagnadhipathi → lagna → the nine planets, read out. */}
      <div className="chart-block" style={{ marginTop: 26 }}>
        <button className="chart-toggle" onClick={() => setOpenChart((o) => !o)} aria-expanded={openChart}>
          <span className="label" style={{ margin: 0 }}>Your whole chart · read out</span>
          <span className="chev">{openChart ? '−' : '+'}</span>
        </button>

        {openChart ? (
          <div className="chart-body">
            <p className="chart-lede">Your real birth chart, translated — read top to bottom: your ruler, your rising sign, then the nine energies where they landed.</p>

            {/* 1 — Lagnadhipathi (the ruler) */}
            <div className="ruler-hero" style={{ borderColor: `${grahaColor(kundali.lagnaLord)}55` }}>
              <span className="ruler-orb" style={{ background: `radial-gradient(circle at 34% 30%, ${grahaColor(kundali.lagnaLord)}, #23263f 76%)`, boxShadow: `0 0 22px -6px ${grahaColor(kundali.lagnaLord)}` }} />
              <div className="ruler-txt">
                <div className="ruler-kicker">Your ruler · lagnadhipathi</div>
                <div className="ruler-name" style={{ color: grahaColor(kundali.lagnaLord) }}>{grahaLabel(kundali.lagnaLord)}</div>
                <div className="bp-meta">the captain every other energy reports to</div>
                <StrengthMeter pct={kundali.lagnaLordStrength} color={grahaColor(kundali.lagnaLord)} />
                <p className="chart-text" style={{ marginTop: 8 }}>{kundali.lagnaLordText}</p>
              </div>
            </div>

            {/* 2 — Lagna (rising sign) */}
            <div className="lagna-card">
              <div className="lagna-kicker">Your rising sign · lagna</div>
              <div className="lagna-name">{kundali.lagnaSignName}</div>
              <div className="bp-meta">the doorway everyone enters you through — your first impression</div>
              <p className="chart-text" style={{ marginTop: 6 }}>You meet the world with a {kundali.lagnaSignNote} quality.</p>
            </div>

            {/* 3 — The nine planets */}
            <div className="planet-grid-label label">The nine energies, placed</div>
            <div className="planet-grid">
              {kundali.rows.map((r) => <PlanetCard key={r.graha} r={r} />)}
            </div>

            <p className="chart-foot">Nine energies, twelve houses — the whole map. Your daily reading is this, run forward in time.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

function PlanetCard({ r }: { r: KundaliRow }) {
  const c = grahaColor(r.graha);
  const chip = dignityChip(r.dignity);
  const strongFlag = r.dignity === 'exalted' || r.dignity === 'own' || r.dignity === 'moolatrikona';
  return (
    <div className="pcard" style={{ borderColor: `${c}33` }}>
      <div className="pcard-head">
        <span className="pcard-orb" style={{ background: `radial-gradient(circle at 34% 30%, ${c}, #23263f 78%)`, boxShadow: `0 0 12px -3px ${c}` }} />
        <div className="pcard-id">
          <span className="pcard-name" style={{ color: c }}>{grahaLabel(r.graha)}</span>
          <span className="pcard-loc">{ORD[r.house]} house · {r.signName}</span>
        </div>
        <span className="pcard-pct" style={{ color: c }}>{r.strength}%</span>
      </div>
      <div className="strbar" style={{ margin: '2px 0 10px' }}><span className="strfill" style={{ width: `${r.strength}%`, background: c }} /></div>
      <div className="pcard-flags">
        {r.vargottama ? <span className="chart-flag flag-strong">vargottama</span> : null}
        {r.retrograde ? <span className="chart-flag">retrograde</span> : null}
        {r.combust ? <span className="chart-flag">combust</span> : null}
        {chip ? <span className={`chart-flag ${strongFlag ? 'flag-strong' : r.dignity === 'debilitated' ? 'flag-weak' : ''}`}>{chip}</span> : null}
      </div>
      <p className="chart-text">{r.text}</p>
    </div>
  );
}
