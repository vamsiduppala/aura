import { useMemo, useState } from 'react';
import { loadHistory, setVerdict, historyStats, type SavedReading } from '../services/history';
import { energyColor, energyLabel, grahaColor, grahaLabel, grahaOfEnergy, fmtFull } from '../ui';
import { EmptyState } from '../components/States';

// Looking back is what makes a system like this checkable. Every past reading is here with the
// two energies that produced it, and the user can mark it right or off — which turns the app's
// accuracy from a marketing claim into a number they generated themselves.

export function History({ identity, onBack, onToday }: {
  identity: string; onBack: () => void; onToday: () => void;
}) {
  const [items, setItems] = useState<SavedReading[]>(() => loadHistory(identity));
  const stats = useMemo(() => historyStats(items), [items]);

  const rate = (day: string, verdict: 'right' | 'off') => {
    const current = items.find((i) => i.day === day)?.verdict;
    const next = current === verdict ? null : verdict; // tapping again clears it
    setVerdict(identity, day, next);
    setItems(loadHistory(identity));
  };

  if (items.length === 0) {
    return (
      <div className="view hist">
        <div className="s3-top" style={{ padding: 0, marginBottom: 18 }}>
          <button className="back" onClick={onBack}>‹</button>
          <h2 className="ttl">Your readings</h2><span style={{ width: 22 }} />
        </div>
        <EmptyState
          title="Nothing saved yet"
          body="Every reading you open gets kept here, so you can look back later and see whether it actually matched your week. That is the only honest way to judge this."
          actionLabel="Open today’s reading"
          onAction={onToday}
        />
      </div>
    );
  }

  return (
    <div className="view hist">
      <div className="s3-top" style={{ padding: 0, marginBottom: 18 }}>
        <button className="back" onClick={onBack}>‹</button>
        <h2 className="ttl">Your readings</h2><span style={{ width: 22 }} />
      </div>

      <div className="hist-stats">
        <div className="hist-stat"><b>{stats.total}</b><span>saved</span></div>
        <div className="hist-stat"><b>{stats.streakDays}</b><span>day streak</span></div>
        <div className="hist-stat">
          <b>{stats.accuracy == null ? '—' : `${stats.accuracy}%`}</b>
          <span>{stats.rated ? `you marked ${stats.rated} right or off` : 'rate one to start'}</span>
        </div>
      </div>

      <p className="hist-note">
        Mark each one <b>right</b> or <b>off</b>. Nobody sees this but you — it is here so the app has
        to earn your trust with its own track record rather than ask for it.
      </p>

      <div className="hist-list">
        {items.map((r) => {
          const mg = grahaOfEnergy(r.majorEnergy);
          const pg = grahaOfEnergy(r.passingEnergy);
          return (
            <article className="hist-item" key={r.day}>
              <div className="hist-day">{fmtFull(r.day)}</div>
              <p className="hist-head">{r.headline}</p>
              <div className="hist-energies">
                <span style={{ color: energyColor(r.majorEnergy) }}>{energyLabel(r.majorEnergy)}</span>
                <span className="hist-planet" style={{ color: grahaColor(mg) }}>{grahaLabel(mg)}</span>
                <span className="hist-sep">·</span>
                <span style={{ color: energyColor(r.passingEnergy) }}>{energyLabel(r.passingEnergy)}</span>
                <span className="hist-planet" style={{ color: grahaColor(pg) }}>{grahaLabel(pg)}</span>
              </div>
              {r.remedy ? <div className="hist-remedy">{r.remedy}</div> : null}
              <div className="hist-rate">
                <button className={`hist-btn${r.verdict === 'right' ? ' on right' : ''}`}
                  onClick={() => rate(r.day, 'right')} aria-pressed={r.verdict === 'right'}>
                  That was right
                </button>
                <button className={`hist-btn${r.verdict === 'off' ? ' on off' : ''}`}
                  onClick={() => rate(r.day, 'off')} aria-pressed={r.verdict === 'off'}>
                  That was off
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
