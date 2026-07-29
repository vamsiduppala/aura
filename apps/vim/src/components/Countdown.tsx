// Biggest change ahead — the next Prime-Minister-level handover.
//
// One thing only. The King's turn is a decade away and useless as a clock; the Governor's
// is days away and already sitting in the stack above. Prime Minister is the only level
// where a countdown changes what someone actually does.
//
// The countdown is a segmented clock, not a text label: four brass blocks with the seconds
// visibly moving. Under 24h the DAYS block drops and the rest grow; under an hour the set
// turns Mars red and the line above reads "Handover today."

import { ChevronRight } from 'lucide-react';
import type { DashaPeriod } from '@aura/engine';
import type { CourtSeat } from '../core/court';
import { countdownParts, pad2, shortDate } from '../core/time';
import { PLANET } from '../theme/tokens';

interface CountdownProps {
  outgoing: CourtSeat;
  incoming: DashaPeriod;
  now: Date;
  onOpen: () => void;
}

export function BiggestChangeAhead({ outgoing, incoming, now, onOpen }: CountdownProps) {
  const remaining = outgoing.end.getTime() - now.getTime();
  const t = countdownParts(remaining);
  const out = PLANET[outgoing.lord];
  const inc = PLANET[incoming.lord];

  const blocks: { value: string; label: string }[] = [
    ...(t.showDays ? [{ value: String(t.days), label: 'DAYS' }] : []),
    { value: pad2(t.hours), label: 'HOURS' },
    { value: pad2(t.mins), label: 'MINS' },
    { value: pad2(t.secs), label: 'SECS' },
  ];

  return (
    <section className="change-card neu-raised" aria-labelledby="change-head">
      <p className="t-section-label" id="change-head">Biggest change ahead</p>
      <p className="change-title">
        {t.urgent ? 'Handover today.' : `Your ${outgoing.meta.label} changes`}
      </p>

      <div className="countdown" data-urgent={t.urgent} role="timer" aria-live="off">
        {blocks.map((b) => (
          <div key={b.label} className="cd-block neu-inset-soft" data-wide={!t.showDays}>
            <span className="cd-value">{b.value}</span>
            <span className="cd-label">{b.label}</span>
          </div>
        ))}
      </div>
      {/* The digits tick every second; a screen reader gets one calm sentence instead. */}
      <p className="sr-only" aria-live="polite">
        {t.showDays ? `${t.days} days, ` : ''}{t.hours} hours until {inc.name} takes office.
      </p>

      <div className="handover-rule" aria-hidden />

      <button type="button" className="handover" onClick={onOpen}>
        <span className="hand-pill" data-outgoing style={{ background: out.tabFill, color: out.tabInk }}>
          <span className="hand-dot" style={{ background: out.ring, opacity: 0.6 }} aria-hidden />
          {out.name}
        </span>
        <span className="hand-chevrons" aria-hidden>
          {[0.3, 0.6, 1].map((o, i) => (
            <ChevronRight
              key={o}
              size={15}
              style={{ color: inc.ring, opacity: o, animationDelay: `${i * 0.4}s` }}
              className="hand-chevron"
            />
          ))}
        </span>
        <span
          className="hand-pill"
          style={{
            background: inc.tabFillActive,
            color: inc.tabInk,
            boxShadow: `0 0 14px ${inc.ring}59`,
            border: `1.3px solid ${inc.ring}`,
          }}
        >
          <span className="hand-dot" style={{ background: inc.ring, boxShadow: `0 0 6px ${inc.ring}` }} aria-hidden />
          {inc.name}
        </span>
      </button>
      <p className="handover-date">takes office {shortDate(incoming.start)}</p>
    </section>
  );
}
