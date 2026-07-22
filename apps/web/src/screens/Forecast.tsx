import { useMemo, useState } from 'react';
import type { Aura, Chart, Energy, ForecastPeriod, Graha, LifeArea } from '@aura/engine';
import {
  energyColor, energyLabel, grahaColor, grahaLabel, grahaOfEnergy,
  fmtFull, fmtMonYY,
} from '../ui';
import { PlanetTag } from '../components/PlanetTag';
import { SIMPLE_REMEDY, ADVANTAGE, MAHA_THEME } from '../insights';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';

const FX_HEAD: Record<Energy, string> = {
  build: 'The heaviness has an exit.', crave: 'The noise settles into a shape.',
  main: 'Your visible season, mapped.', feel: 'The tides, and when they turn.',
  fire: 'Where the heat is heading.', mind: 'The next moves, in order.',
  grow: 'The open road ahead.', love: 'Where the warmth is heading.',
  let: 'What’s clearing, and when.',
};

type Tab = 'daily' | 'weekly' | 'monthly' | 'custom';

/** A planet's natal strength as a 0–100%. */
function strengthPct(chart: Chart, e: Energy): number {
  return Math.round((chart.planets[grahaOfEnergy(e)].strength ?? 0) * 100);
}
/** Median planet strength % — the line between a "strong" and a "working-harder" energy. */
function medianPct(chart: Chart): number {
  const all = (Object.keys(chart.planets) as Graha[])
    .map((g) => Math.round((chart.planets[g].strength ?? 0) * 100))
    .sort((a, b) => a - b);
  return all[Math.floor(all.length / 2)] ?? 50;
}

// ── Live mahadasha progress bar ───────────────────────────────────────────────
function DashaProgress({ chart, fc, now }: {
  chart: Chart;
  fc: ReturnType<Aura['forecast']>;
  now: Date;
}) {
  const s = fc.majorSeason;
  const g = grahaOfEnergy(s.energy);
  const nextG = grahaOfEnergy(s.nextEnergy);
  const start = new Date(s.start).getTime();
  const end = new Date(s.nextStart).getTime();
  const pct = Math.max(2, Math.min(98, ((now.getTime() - start) / (end - start)) * 100));
  const c = grahaColor(g);
  const nc = grahaColor(nextG);

  return (
    <div className="dasha-prog" style={{ borderColor: `${c}55` }}>
      <div className="dp-head">
        <span className="dp-title" style={{ color: energyColor(s.energy) }}>
          {energyLabel(s.energy).toUpperCase()}
        </span>
        <PlanetTag graha={g} />
        <span className="dp-strength" style={{ marginLeft: 'auto', color: c }}>{strengthPct(chart, s.energy)}%</span>
      </div>
      <div className="dp-theme">{MAHA_THEME[s.energy]}</div>
      <div className="dp-track">
        <div className="dp-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c}aa, ${c})` }} />
        <span className="dp-dot" style={{ left: `${pct}%`, background: c, boxShadow: `0 0 8px -1px ${c}` }} />
        <div className="dp-nextseg" style={{ background: nc }} />
      </div>
      <div className="dp-foot">
        <span>{fmtMonYY(s.start)} · {Math.round(pct)}% through</span>
        <span className="dp-next">next → <span style={{ color: nc }}>{grahaLabel(nextG)}</span> · {fmtFull(s.nextStart)}</span>
      </div>
    </div>
  );
}

// ── One forecast period row (planet name + strength %, colour-coded) ───────────
function PeriodRow({ p, pct, onOpen }: { p: ForecastPeriod; pct: number; onOpen: (p: ForecastPeriod) => void }) {
  const g = grahaOfEnergy(p.energy);
  const c = grahaColor(g);
  return (
    <div className="period" onClick={() => onOpen(p)}>
      <span className="bar" style={{ background: c }} />
      <div className="pbody">
        <div className="prow">
          <span className="en" style={{ color: energyColor(p.energy) }}>{energyLabel(p.energy).toUpperCase()}</span>
          <PlanetTag graha={g} />
          {p.isNow ? <span className="now">Now</span> : null}
          <span className="pstrength" style={{ marginLeft: 'auto', color: c, borderColor: `${c}66` }}>{pct}%</span>
        </div>
        <div className="gloss">{p.gloss}</div>
        <div className="daterow">
          <div className="dchip" style={{ borderColor: c }}><span className="dl">From</span><span className="dd">{fmtMonYY(p.start)}</span></div>
          <div className="dconn"><span>→</span></div>
          <div className="dchip"><span className="dl">To</span><span className="dd">{fmtMonYY(p.end)}</span></div>
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
  const rawRows = tab === 'daily' ? fc.daily : tab === 'weekly' ? fc.weekly : tab === 'monthly' ? fc.monthly : custom.periods;

  // Rank by ruling-planet strength (strongest first); keep "Now" pinned at the top.
  const ranked = useMemo(() =>
    rawRows
      .map((p) => ({ p, pct: strengthPct(chart, p.energy) }))
      .sort((a, b) => (b.p.isNow ? 1 : 0) - (a.p.isNow ? 1 : 0) || b.pct - a.pct),
    [rawRows, chart]);

  return (
    <>
      <div className="fx-head">
        <h2>{FX_HEAD[fc.majorSeason.energy]}</h2>
        <div className="sub">Ranked by your strongest energy · tap any to open it.</div>
      </div>

      <DashaProgress chart={chart} fc={fc} now={now} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="mx-auto mt-[18px] w-full max-w-[720px]">
          {(['daily', 'weekly', 'monthly', 'custom'] as Tab[]).map((t) => (
            <TabsTrigger key={t} value={t}>{t[0]!.toUpperCase() + t.slice(1)}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
        {ranked.map(({ p, pct }, i) => <PeriodRow key={i} p={p} pct={pct} onOpen={setDetail} />)}
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent aria-describedby={undefined}>
          {detail ? <DetailPanel p={detail} major={major} aura={aura} chart={chart} goalArea={goalArea} tab={tab} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailPanel({ p, major, aura, chart, goalArea, tab }: {
  p: ForecastPeriod; major: Energy; aura: Aura; chart: Chart; goalArea?: LifeArea; tab: Tab;
}) {
  const r = aura.expanded(p.energy, major, p.start, p.end, chart, goalArea ? { goalArea } : {});
  const g = grahaOfEnergy(p.energy);
  const c = grahaColor(g);
  const pct = strengthPct(chart, p.energy);
  const strong = pct >= medianPct(chart);

  return (
    <>
      <DialogTitle className="sr-only">{energyLabel(p.energy)} — {tab} shift</DialogTitle>
      <div className="dtop">
        <DialogClose asChild><button className="close" aria-label="Close">‹</button></DialogClose>
        <span className="dctx">{tab} shift</span>
      </div>
      <div className="droll">
        <div className="dname" style={{ color: energyColor(p.energy) }}>{energyLabel(p.energy).toUpperCase()}</div>
        <div className="dmean">
          <PlanetTag graha={g} />
          <span className="dstrength" style={{ color: c, borderColor: `${c}66` }}>
            {pct}% strength · {strong ? 'a strong energy for you' : 'works harder for you'}
          </span>
        </div>
        <div className="ddates">
          <div className="dchip" style={{ borderColor: c }}><span className="dl">From</span><span className="dd">{fmtFull(p.start)}</span></div>
          <div className="dconn"><span>→</span></div>
          <div className="dchip"><span className="dl">To</span><span className="dd">{fmtFull(p.end)}</span></div>
        </div>

        {strong ? (
          <>
            <div className="sect">
              <span className="node" style={{ background: '#7ED69B', boxShadow: '0 0 10px -1px #7ED69B' }} />
              <div className="hl">How to take advantage</div><p>{ADVANTAGE[p.energy]}</p>
            </div>
            <div className="sect">
              <span className="node" style={{ background: '#FFD070', boxShadow: '0 0 10px -1px #FFD070' }} />
              <div className="hl">Your gift here</div><p>{r.gift}</p>
            </div>
          </>
        ) : (
          <>
            <div className="sect">
              <span className="node" style={{ background: '#AE8FE6', boxShadow: '0 0 10px -1px #AE8FE6' }} />
              <div className="hl">The challenge</div><p>{r.trap}</p>
            </div>
            <div className="remedy-card" style={{ background: `linear-gradient(160deg, ${c}28, ${c}0d)`, borderColor: `${c}4d` }}>
              <div className="rh"><span className="label" style={{ color: c }}>✦ One simple thing</span></div>
              <p>{SIMPLE_REMEDY[g]}</p>
            </div>
          </>
        )}

        {r.blendNote ? <div className="blend-note">{r.blendNote}</div> : null}
      </div>
    </>
  );
}
