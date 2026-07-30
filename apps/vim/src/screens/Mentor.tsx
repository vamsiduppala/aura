// Mentor — the only tab allowed to need connectivity.
//
// It answers from the real chart: the court, the boundaries, and the authored content.
// It never invents a chart value, and when it cannot answer at a level the birth time
// supports it says so and offers the level it can.

import { useMemo } from 'react';
import { courtAt } from '../core/court';
import { deepestTrustworthy } from '../core/court';
import { humanRemaining, shortDate } from '../core/time';
import { useNow } from '../hooks/useNow';
import { PLANET } from '../theme/tokens';
import { useVim } from '../store/useVim';

export function Mentor() {
  const { chart, confidence } = useVim();
  const now = useNow(60_000);
  const seats = useMemo(
    () => (chart ? courtAt(chart, now, confidence) : []),
    [chart, now, confidence],
  );

  return (
    <div className="page">
      <header className="screen-head">
        <p className="t-lead-line">Ask anything.</p>
        <p className="t-sub">
          Your chart, your timing, your call. Real values only — when a number comes from
          your chart, you'll be told which one.
        </p>
      </header>

      {/* The state block the model will be given every turn, shown to the user rather than
          hidden. It is all computed locally, so it is also the honest fallback while the
          conversational layer is being built. */}
      <section className="neu-raised settings-card">
        <h2 className="t-section-label">What it can already see</h2>
        {seats.filter((s) => s.visibility !== 'hidden').map((s) => (
          <div key={s.meta.level} className="settings-row">
            <span className="settings-key">{s.meta.label}</span>
            <span className="settings-val">
              <span style={{ color: PLANET[s.lord].ring }}>{PLANET[s.lord].name}</span>
              {' — '}
              {humanRemaining(s.remainingMs)} left, to {shortDate(s.end)}
            </span>
          </div>
        ))}
        <p className="t-duration-note settings-note">
          Deepest level it will answer at: <strong>{deepestTrustworthy(confidence).label}</strong>.
          Below that, the boundaries move by more than the period lasts.
        </p>
      </section>

      <div className="empty-state neu-raised">
        <h2 className="t-plan-title">The conversation is next.</h2>
        <p className="t-body">
          Threads, streaming answers and source disclosure are the next piece of work. The
          data above is what it will be given on every turn — none of it is guessed.
        </p>
      </div>
    </div>
  );
}
