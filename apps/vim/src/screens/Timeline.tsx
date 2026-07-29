// Timeline — the Wheel, the court, and the next handover. Everything on this screen is
// computed on this device from the birth details, so it works with no network at all.
//
// Two clocks: 60s to re-walk the daśā tree, 1s for the countdown and the outermost arc.

import { useMemo } from 'react';
import { CourtTable } from '../components/CourtTable';
import { BiggestChangeAhead } from '../components/Countdown';
import { Wheel, WheelCentreKing } from '../components/Wheel';
import { courtAt, courtFastestFirst, nextTurn } from '../core/court';
import { useNow } from '../hooks/useNow';
import { MOTION } from '../theme/tokens';
import { useVim } from '../store/useVim';

export function Timeline() {
  const { chart, chartError, confidence, prefs, go, setTab } = useVim();
  // Recompute the tree on the minute; animate on the second.
  const courtClock = useNow(MOTION.courtRefreshMs);
  const tick = useNow(MOTION.countdownTickMs);

  const seats = useMemo(
    () => (chart ? courtAt(chart, courtClock, confidence) : []),
    [chart, courtClock, confidence],
  );
  const turn = useMemo(
    () => (chart ? nextTurn(chart, courtClock, 'antar') : null),
    [chart, courtClock],
  );

  if (chartError) {
    return (
      <div className="screen-scroll">
        <h1 className="t-page-title">Timeline</h1>
        <p className="field-error" role="alert">
          Your chart couldn't be built from the details on file. {chartError}
        </p>
        <button type="button" className="btn-flat" onClick={() => setTab('you')}>
          Check your birth details
        </button>
      </div>
    );
  }

  if (!chart || seats.length === 0) return null;

  const king = seats[0];
  const visible = courtFastestFirst(seats);

  return (
    <div className="screen-scroll">
      <header className="screen-head">
        <h1 className="t-page-title">Timeline</h1>
        <p className="t-sub">Tap any ring — or any character below.</p>
      </header>

      <div className="wheel-stage">
        <Wheel
          seats={seats}
          now={tick}
          centre={<WheelCentreKing seat={king} />}
          onSelectLevel={(level) => go({ kind: 'office', level })}
        />
      </div>

      <div className="court-head">
        <span className="t-section-label">Your court</span>
        <span className="court-head-right">fastest first</span>
      </div>
      <p className="t-sub court-lede">
        Five rulers, five speeds — all in office at once. The faster ones just change
        hands more often.
      </p>

      <CourtTable
        seats={visible}
        confidence={confidence}
        showSanskrit={prefs.showSanskrit}
        onOpen={(level) => go({ kind: 'office', level })}
        onFixBirthTime={() => setTab('you')}
      />

      {turn && (
        <div className="deferred">
          <BiggestChangeAhead
            outgoing={turn.outgoing}
            incoming={turn.incoming}
            now={tick}
            onOpen={() => go({ kind: 'office', level: 2 })}
          />
        </div>
      )}

      <p className="disclaimer">
        This describes conditions, not outcomes. What you do with them is yours.
      </p>
    </div>
  );
}
