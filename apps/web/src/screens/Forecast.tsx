import { useMemo, useState } from 'react';
import type { Aura, Chart, Energy, ForecastPeriod, Graha, LifeArea } from '@aura/engine';
import { energyColor, energyLabel, grahaColor, grahaLabel, grahaOfEnergy, fmtFull, fmtMonYY } from '../ui';
import { SIMPLE_REMEDY, ADVANTAGE, MAHA_THEME } from '../insights';
import {
  WHAT_IS_MAHADASHA, WHAT_IS_ANTARDASHA, HOW_THEY_COMBINE,
  CADENCE_MEANING, PERIOD_FEEL, PLANET_ROLE,
} from '../content/dashaText';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Tab = 'daily' | 'weekly' | 'monthly' | 'custom';

const strengthPct = (chart: Chart, e: Energy): number =>
  Math.round((chart.planets[grahaOfEnergy(e)].strength ?? 0) * 100);

function medianPct(chart: Chart): number {
  const all = (Object.keys(chart.planets) as Graha[])
    .map((g) => Math.round((chart.planets[g].strength ?? 0) * 100)).sort((a, b) => a - b);
  return all[Math.floor(all.length / 2)] ?? 50;
}

/** A planet named inline and coloured, so the vocabulary is learnable without a glossary. */
function Planet({ g }: { g: Graha }) {
  return <b style={{ color: grahaColor(g), fontWeight: 600 }}>{grahaLabel(g)}</b>;
}

/** The two evergreen explainers — identical for every user, because they explain the system. */
function Explainers({ majorG, passingG }: { majorG: Graha; passingG: Graha }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="fx-explain">
      <p className="fx-lead">
        Your timing runs on two clocks at once: a long <b>season</b> you live inside — yours is
        governed by <Planet g={majorG} /> — and a shorter <b>chapter</b> within it, currently{' '}
        <Planet g={passingG} />. Everything below is read from those two.
      </p>

      {open ? (
        <div className="fx-explain-body">
          {[WHAT_IS_MAHADASHA, WHAT_IS_ANTARDASHA].map((x) => (
            <article key={x.title} className="fx-art">
              <h3>{x.title}</h3>
              <div className="fx-art-sub">{x.sub}</div>
              {x.body.map((para, i) => <p key={i}>{para}</p>)}
            </article>
          ))}
          <p className="fx-combine">{HOW_THEY_COMBINE}</p>
        </div>
      ) : null}

      <button className="fx-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide the explanation' : 'What are a season and a chapter?'}
      </button>
    </section>
  );
}

/** Where you are in the long season, as sentences plus a quiet progress line. */
function SeasonNow({ chart, fc, now }: { chart: Chart; fc: ReturnType<Aura['forecast']>; now: Date }) {
  const s = fc.majorSeason;
  const g = grahaOfEnergy(s.energy);
  const nextG = grahaOfEnergy(s.nextEnergy);
  const start = new Date(s.start).getTime();
  const end = new Date(s.nextStart).getTime();
  const pct = Math.max(1, Math.min(99, ((now.getTime() - start) / (end - start)) * 100));
  const c = grahaColor(g);
  const pctStrength = strengthPct(chart, s.energy);

  return (
    <section className="fx-season">
      <div className="fx-season-head">
        <span className="fx-kicker">Your season right now</span>
        <span className="fx-season-name" style={{ color: energyColor(s.energy) }}>{energyLabel(s.energy)}</span>
      </div>
      <p>
        You are about <b>{Math.round(pct)}% of the way</b> through a <Planet g={g} /> season that began
        in {fmtMonYY(s.start)} and runs to {fmtFull(s.nextStart)}. {MAHA_THEME[s.energy]}
      </p>
      <p>
        <Planet g={g} /> governs {PLANET_ROLE[g]}, and in your chart it carries{' '}
        <b style={{ color: c }}>{pctStrength}% strength</b> —{' '}
        {pctStrength >= medianPct(chart)
          ? 'one of the stronger forces you have, so this season tends to give back what you put in.'
          : 'not one of your loudest planets, so this season asks for more deliberate effort than it hands back on its own.'}
      </p>
      <div className="fx-track">
        <div className="fx-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c}88, ${c})` }} />
      </div>
      <p className="fx-next">
        After this the ground shifts to a <Planet g={nextG} /> season — {PLANET_ROLE[nextG]} — from {fmtFull(s.nextStart)}.
      </p>
    </section>
  );
}

/** One period, written as a short paragraph rather than a dense card. */
function PeriodParagraph({ p, chart, aura, major, goalArea }: {
  p: ForecastPeriod; chart: Chart; aura: Aura; major: Energy; goalArea?: LifeArea;
}) {
  const [open, setOpen] = useState(false);
  const g = grahaOfEnergy(p.energy);
  const c = grahaColor(g);
  const pct = strengthPct(chart, p.energy);
  const strong = pct >= medianPct(chart);
  const r = useMemo(
    () => (open ? aura.expanded(p.energy, major, p.start, p.end, chart, goalArea ? { goalArea } : {}) : null),
    [open, aura, p, major, chart, goalArea],
  );

  return (
    <article className={`fx-period${p.isNow ? ' now' : ''}`} style={{ borderLeftColor: c }}>
      <header className="fx-period-head">
        <span className="fx-period-when">{fmtMonYY(p.start)} → {fmtMonYY(p.end)}</span>
        {p.isNow ? <span className="fx-now">happening now</span> : null}
      </header>
      <h4 style={{ color: energyColor(p.energy) }}>{energyLabel(p.energy)} · <Planet g={g} /></h4>
      <p>{PERIOD_FEEL[p.energy]}</p>
      <p className="fx-period-you">
        For you specifically, <Planet g={g} /> sits at <b style={{ color: c }}>{pct}%</b> strength —{' '}
        {strong
          ? `so this is a stretch to lean into. ${ADVANTAGE[p.energy]}`
          : `so it works you harder than it works most people. One thing that genuinely helps: ${SIMPLE_REMEDY[g].toLowerCase()}`}
      </p>

      {open && r ? (
        <div className="fx-period-more">
          <p><span className="fx-tag">The gift</span>{r.gift}</p>
          <p><span className="fx-tag">The trap</span>{r.trap}</p>
          <p><span className="fx-tag">The move</span>{r.move}</p>
          {r.blendNote ? <p className="fx-blend">{r.blendNote}</p> : null}
        </div>
      ) : null}
      <button className="fx-more-btn" onClick={() => setOpen((v) => !v)}>
        {open ? 'Show less' : 'Read this period in full'}
      </button>
    </article>
  );
}

export function Forecast({ aura, chart, now, goalArea, major, passing }: {
  aura: Aura; chart: Chart; now: Date; goalArea?: LifeArea; major: Energy; passing: Energy;
}) {
  const [tab, setTab] = useState<Tab>('monthly');
  const [from, setFrom] = useState(now.toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date(now.getTime() + 200 * 86400_000).toISOString().slice(0, 10));

  const fc = useMemo(() => aura.forecast(chart, now), [aura, chart, now]);
  const custom = useMemo(
    () => aura.customForecast(chart, new Date(from), new Date(to), now),
    [aura, chart, from, to, now],
  );
  const rows = tab === 'daily' ? fc.daily : tab === 'weekly' ? fc.weekly : tab === 'monthly' ? fc.monthly : custom.periods;

  // Chronological: a forecast people plan around has to read forwards in time.
  const ordered = useMemo(
    () => [...rows].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [rows],
  );

  const majorG = grahaOfEnergy(fc.majorSeason.energy);
  const passingG = grahaOfEnergy(passing);
  const cadence = CADENCE_MEANING[tab];

  return (
    <div className="fx">
      <div className="fx-head">
        <h2>What’s coming, and how it will feel.</h2>
        <div className="sub">Written in plain language — no chart-reading required.</div>
      </div>

      <Explainers majorG={majorG} passingG={passingG} />
      <SeasonNow chart={chart} fc={fc} now={now} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="mt-[26px] w-full">
          {(['daily', 'weekly', 'monthly', 'custom'] as Tab[]).map((t) => (
            <TabsTrigger key={t} value={t}>{t[0]!.toUpperCase() + t.slice(1)}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <section className="fx-cadence">
        <h3>{cadence.title}</h3>
        <p>{cadence.body}</p>
      </section>

      {tab === 'custom' ? (
        <div className="fx-range">
          <label className="fx-range-pill"><span>From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Range start" /></label>
          <span className="fx-range-arrow">→</span>
          <label className="fx-range-pill"><span>To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Range end" /></label>
          <span className="fx-range-count">{custom.count} shift{custom.count === 1 ? '' : 's'}</span>
        </div>
      ) : null}

      <div className="fx-periods">
        {ordered.length === 0
          ? <p className="fx-empty">No shifts in this window — a steady stretch. Widen the dates to see the next change.</p>
          : ordered.map((p, i) => (
            <PeriodParagraph key={`${p.start}-${i}`} p={p} chart={chart} aura={aura} major={major} goalArea={goalArea} />
          ))}
      </div>
    </div>
  );
}
