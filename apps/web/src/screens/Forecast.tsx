import { useMemo, useState } from 'react';
import type { Aura, Chart, Energy, ForecastPeriod, LifeArea } from '@aura/engine';
import { energyColor, energyLabel, energyGloss, fmtFull, fmtShort, fmtMonthYear } from '../ui';

const FX_HEAD: Record<Energy, string> = {
  build: 'The heaviness has an exit.', crave: 'The noise settles into a shape.',
  main: 'Your visible season, mapped.', feel: 'The tides, and when they turn.',
  fire: 'Where the heat is heading.', mind: 'The next moves, in order.',
  grow: 'The open road ahead.', love: 'Where the warmth is heading.',
  let: 'What’s clearing, and when.',
};

type Tab = 'daily' | 'weekly' | 'monthly' | 'custom';

function PeriodRow({ p, onOpen }: { p: ForecastPeriod; onOpen: (p: ForecastPeriod) => void }) {
  const c = energyColor(p.energy);
  return (
    <div className="period" onClick={() => onOpen(p)}>
      <span className="bar" style={{ background: c }} />
      <div className="pbody">
        <div className="prow">
          <span className="en" style={{ color: c }}>{energyLabel(p.energy).toUpperCase()}</span>
          {p.isNow ? <span className="now">Now</span> : null}
        </div>
        <div className="gloss">{p.gloss}</div>
        <div className="daterow">
          <div className="dchip" style={{ borderColor: c }}><span className="dl">Starts</span><span className="dd">{fmtShort(p.start)}</span></div>
          <div className="dconn"><span>→</span></div>
          <div className="dchip"><span className="dl">Ends</span><span className="dd">{fmtShort(p.end)}</span></div>
        </div>
      </div>
    </div>
  );
}

export function Forecast({ aura, chart, now, goalArea, major }: {
  aura: Aura; chart: Chart; now: Date; goalArea?: LifeArea; major: Energy;
}) {
  const [tab, setTab] = useState<Tab>('monthly');
  const [detail, setDetail] = useState<ForecastPeriod | null>(null);
  const [from, setFrom] = useState(now.toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date(now.getTime() + 200 * 86400_000).toISOString().slice(0, 10));

  const fc = useMemo(() => aura.forecast(chart, now), [aura, chart, now]);
  const custom = useMemo(() => aura.customForecast(chart, new Date(from), new Date(to), now), [aura, chart, from, to, now]);
  const rows = tab === 'daily' ? fc.daily : tab === 'weekly' ? fc.weekly : tab === 'monthly' ? fc.monthly : custom.periods;

  return (
    <>
      <div className="fx-head">
        <h2>{FX_HEAD[fc.majorSeason.energy]}</h2>
        <div className="sub">Zoom with the tabs · tap any shift to open it.</div>
      </div>

      <div className="seasonbar">
        <div className="sb-top">
          <span className="label">Major season</span>
          <span className="nm" style={{ color: energyColor(fc.majorSeason.energy) }}>{energyLabel(fc.majorSeason.energy).toUpperCase()}</span>
        </div>
        <div className="sb-line">
          <span className="mini-date"><span className="l">Began</span><span className="d">{fmtMonthYear(fc.majorSeason.start)}</span></span>
          <span className="rail" />
          <span className="mini-date turn"><span className="l">Turns → {energyLabel(fc.majorSeason.nextEnergy)}</span><span className="d">{fmtFull(fc.majorSeason.nextStart)}</span></span>
        </div>
      </div>

      <div className="tabs">
        {(['daily', 'weekly', 'monthly', 'custom'] as Tab[]).map((t) => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t[0]!.toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'custom' ? (
        <>
          <div className="rangebar">
            <div className="range-pill"><div className="l">From</div><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <span style={{ color: 'var(--mist-3)' }}>→</span>
            <div className="range-pill"><div className="l">To</div><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          </div>
          <div className="range-count">{custom.count} energy shift{custom.count === 1 ? '' : 's'} in this window</div>
        </>
      ) : null}

      <div className="periods">
        {rows.map((p, i) => <PeriodRow key={i} p={p} onOpen={setDetail} />)}
      </div>

      {detail ? (
        <DetailOverlay p={detail} major={major} aura={aura} chart={chart} goalArea={goalArea} tab={tab} onClose={() => setDetail(null)} />
      ) : null}
    </>
  );
}

function DetailOverlay({ p, major, aura, chart, goalArea, tab, onClose }: {
  p: ForecastPeriod; major: Energy; aura: Aura; chart: Chart; goalArea?: LifeArea; tab: Tab; onClose: () => void;
}) {
  const r = aura.expanded(p.energy, major, p.start, p.end, chart, goalArea ? { goalArea } : {});
  const c = energyColor(p.energy);
  const beat = { gift: '#7ED69B', trap: '#AE8FE6', move: '#FFD070', watch: '#FF6E58' };
  return (
    <div className="detail" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="dtop">
          <button className="close" onClick={onClose}>‹</button>
          <span className="dctx">{tab} shift</span>
        </div>
        <div className="droll">
          <div className="dname" style={{ color: c }}>{energyLabel(p.energy).toUpperCase()}</div>
          <div className="dmean">{energyGloss(p.energy)}</div>
          <div className="ddates">
            <div className="dchip" style={{ borderColor: c }}><span className="dl">Starts</span><span className="dd">{fmtFull(p.start)}</span></div>
            <div className="dconn"><span>→</span></div>
            <div className="dchip"><span className="dl">Ends</span><span className="dd">{fmtFull(p.end)}</span></div>
          </div>
          <div className="dintro">{r.headline}</div>
          {([['What’s rising', r.gift, beat.gift], ['The trap', r.trap, beat.trap], ['The move', r.move, beat.move], ['Watch for', r.watch, beat.watch]] as const).map(([t, txt, col]) => (
            <div className="sect" key={t}>
              <span className="node" style={{ background: col, boxShadow: `0 0 10px -1px ${col}` }} />
              <div className="hl">{t}</div><p>{txt}</p>
            </div>
          ))}
          <div className="remedy-card" style={{ background: `linear-gradient(160deg, ${c}28, ${c}0d)`, borderColor: `${c}4d` }}>
            <div className="rh"><span className="label" style={{ color: c }}>✦ The remedy</span></div>
            <p>{r.remedy}</p>
          </div>
          {r.blendNote ? <div className="blend-note">{r.blendNote}</div> : null}
        </div>
      </div>
    </div>
  );
}
