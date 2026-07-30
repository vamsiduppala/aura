// Daśā detail — one office, opened from a ring or a court row.
//
// The eye should get, in order: where am I in the hierarchy → what is it → how long →
// how much is left → what it feels like → what to do about it.

import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { naturalRelation } from '@aura/knowledge';
import { interpret } from '@vim/rules';
import type { DashaPeriod, Graha } from '@aura/engine';
import { Inset, ProgressTrack } from '../components/neu';
import {
  DISCLAIMER, advantageSections, kingdomLine, obstacleSections,
} from '../content/court';
import { courtAt, periodsBetween } from '../core/court';
import { dateRange, humanTotal, timeLeft } from '../core/time';
import { useNow } from '../hooks/useNow';
import { OFFICES, PLANET, officeByLevel } from '../theme/tokens';
import { useVim } from '../store/useVim';

interface Props { level: number }

export function OfficeDetail({ level }: Props) {
  const { chart, confidence, prefs, go, setTab } = useVim();
  const now = useNow(1000);
  const [tab, setTab_] = useState<'advantage' | 'obstacle'>('advantage');

  const seats = useMemo(
    () => (chart ? courtAt(chart, now, confidence) : []),
    // The court is re-derived on the second here because this screen shows a live
    // "time left"; one extra walk per second on a single open page is affordable.
    [chart, now, confidence],
  );
  const seat = seats[level - 1];
  const parent = level > 1 ? seats[level - 2] : undefined;

  // Sub-periods of this term, one level down, graded by the classical natural-relations
  // rule between the ruling planet and each sub-ruler. Real boundaries, real grading —
  // no window is invented, and none is labelled good or bad, only easier or rougher.
  const windows = useMemo(() => {
    if (!chart || !seat || level >= 5) return { easier: [], rougher: [] };
    const childLevel = OFFICES[level]!.dashaLevel;
    const subs = periodsBetween(chart, childLevel, seat.start, seat.end);
    const easier: DashaPeriod[] = [];
    const rougher: DashaPeriod[] = [];
    for (const s of subs) {
      const grade = gradeWindow(seat.lord, s.lord);
      if (grade === 'easier') easier.push(s);
      else if (grade === 'rougher') rougher.push(s);
    }
    return { easier: easier.slice(0, 3), rougher: rougher.slice(0, 2) };
  }, [chart, seat, level]);

  if (!chart || !seat) return null;

  // §4.6: the reading is assembled, not looked up. The base layer is this planet's own
  // character; the relation layer says what THIS pairing does; the house layer says where it
  // lands for THIS person. Two people in the same Venus Governor get different middle and
  // bottom layers, which is the difference between a reading and a horoscope.
  const layers = interpret({
    planet: seat.lord,
    level,
    parentPlanet: parent?.lord,
    chart,
  });

  const p = PLANET[seat.lord];
  const meta = officeByLevel(level);
  const sections = tab === 'advantage'
    ? advantageSections(seat.lord, meta.office)
    : obstacleSections(seat.lord, meta.office);

  return (
    <div className="page detail">
      <div className="detail-band" style={{ background: p.ring }} aria-hidden />

      <header className="detail-head">
        <button type="button" className="tap detail-back" aria-label="Back" onClick={() => go({ kind: 'tabs' })}>
          <ArrowLeft size={20} aria-hidden />
        </button>
        {parent ? (
          <p className="detail-crumb">
            inside your {PLANET[parent.lord].name} {parent.meta.label}
          </p>
        ) : (
          <p className="detail-crumb">the slowest ruler in your chart</p>
        )}
      </header>

      <h1 className="t-page-title">{meta.label}</h1>
      <p className="detail-lord" style={{ color: p.ring }}>
        {p.name}
        {prefs.showSanskrit && <span className="detail-sanskrit"> · {meta.sanskrit}</span>}
      </p>

      <Inset soft className="detail-dates">
        <p className="detail-range">{dateRange(seat.start, seat.end)}</p>
        <p className="t-duration-note">{humanTotal(seat.totalMs)}</p>
      </Inset>

      <div className="detail-progress">
        <ProgressTrack
          value={seat.progress}
          tint={p.ring}
          label={`${meta.label} term, ${Math.round(seat.progress * 100)} percent elapsed`}
        />
        <span className="time-pill">{timeLeft(seat.remainingMs)}</span>
      </div>

      {seat.visibility === 'approximate' && (
        <Inset soft className="effect-note">
          <p className="t-sub" style={{ margin: 0 }}>
            Marked approximate. At this speed the boundaries move by more than the term
            lasts unless your birth time is exact — read it as texture, not as a date.
          </p>
        </Inset>
      )}

      <p className="t-section-label detail-kingdom-label">In the kingdom</p>
      <p className="t-kingdom">{kingdomLine(seat.lord, meta.office)}</p>

      {/* The assembled layers. Each is authored prose, and each is only shown when it has
          something real to say — no filler when there is no ruler above or no chart. */}
      {(layers.relation || layers.houseFlavour) && (
        <div className="layers">
          {layers.relation && parent && (
            <p className="layer">
              <span className="layer-label" style={{ color: p.ring }}>
                Under {PLANET[parent.lord].name}
              </span>
              {layers.relation}
            </p>
          )}
          {layers.houseFlavour && (
            <p className="layer">
              <span className="layer-label" style={{ color: p.ring }}>
                For you
              </span>
              {layers.houseFlavour}
            </p>
          )}
        </div>
      )}

      <div className="seg" role="tablist" aria-label="How this period reads">
        {(['advantage', 'obstacle'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className="seg-btn"
            data-on={tab === t}
            onClick={() => setTab_(t)}
          >
            {t === 'advantage' ? 'Advantage' : 'Obstacle'}
          </button>
        ))}
      </div>

      <div className="detail-sections">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="detail-section-head">{s.heading}</h2>
            <p className="t-body">{s.body}</p>
          </section>
        ))}

        {/* Windows are computed from the real sub-periods of this term. */}
        {tab === 'advantage' && windows.easier.length > 0 && (
          <section>
            <h2 className="detail-section-head">Easier windows inside this period</h2>
            {windows.easier.map((w) => (
              <WindowCard key={w.start.toISOString()} period={w} parentLord={seat.lord} onOpen={() => go({ kind: 'office', level: level + 1 })} />
            ))}
          </section>
        )}
        {tab === 'obstacle' && windows.rougher.length > 0 && (
          <section>
            <h2 className="detail-section-head">Rougher windows inside this period</h2>
            {windows.rougher.map((w) => (
              <WindowCard key={w.start.toISOString()} period={w} parentLord={seat.lord} onOpen={() => go({ kind: 'office', level: level + 1 })} />
            ))}
          </section>
        )}
      </div>

      <button type="button" className="btn-flat detail-ask" onClick={() => setTab('mentor')}>
        Ask Mentor about this period <ChevronRight size={15} aria-hidden />
      </button>

      <p className="disclaimer">{DISCLAIMER}</p>
    </div>
  );
}

/**
 * Grade a sub-period against its parent by the classical natural-relations rule.
 * Same lord doubles the term's own character, so it reads strongest. Rāhu and Ketu are
 * absent from the natural-relations table, so any pairing involving them falls through
 * to neutral and is simply not called out — better silent than invented.
 */
function gradeWindow(parent: Graha, child: Graha): 'easier' | 'rougher' | 'neutral' {
  if (parent === child) return 'easier';
  const rel = naturalRelation(parent, child);
  if (rel === 'friend') return 'easier';
  if (rel === 'enemy') return 'rougher';
  return 'neutral';
}

function WindowCard({
  period, parentLord, onOpen,
}: { period: DashaPeriod; parentLord: Graha; onOpen: () => void }) {
  const p = PLANET[period.lord];
  const doubled = period.lord === parentLord;
  return (
    <button type="button" className="window-card neu-raised-soft neu-press" onClick={onOpen}>
      <span className="window-dot" style={{ background: p.ring }} aria-hidden />
      <span className="window-body">
        <span className="window-title">
          {p.name} · {dateRange(period.start, period.end)}
        </span>
        <span className="t-duration-note">
          {doubled
            ? `Double ${p.name}. The most concentrated stretch in here.`
            : `${p.name} inside ${PLANET[parentLord].name} — ${p.keyword.toLowerCase()} on top of the wider term.`}
        </span>
      </span>
      <ChevronRight size={16} className="court-chevron" aria-hidden />
    </button>
  );
}
