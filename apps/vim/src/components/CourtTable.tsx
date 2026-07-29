// Your Court — one table, not two.
//
// An earlier draft had a "right now" stack (who's ruling, how long left) and a separate
// legend (what each role means, how long each rules). They were the same five rows twice.
// Merged: every row carries the role, the planet, the fixed duration note, and the live
// time left. The note never changes; the pill always does — that contrast is the point.
//
// Fastest first. Messenger at the top, King at the bottom: the same order the rings read
// outside-in, so dragging a finger inward across the wheel and scanning the table downward
// trace the same path.

import { ChevronRight, ClipboardList, Crown, Flag, Scale, Send } from 'lucide-react';
import type { CourtSeat } from '../core/court';
import { approximateNote, type BirthTimeConfidence } from '../core/court';
import { timeLeft } from '../core/time';
import { PLANET, type Office } from '../theme/tokens';

/** The icon carries the role; its colour carries who currently holds it. */
const OFFICE_ICON: Record<Office, typeof Send> = {
  messenger: Send,
  magistrate: Scale,
  governor: Flag,
  primeMinister: ClipboardList,
  king: Crown,
};

interface CourtTableProps {
  /** Already ordered fastest-first, hidden seats removed. */
  seats: CourtSeat[];
  confidence: BirthTimeConfidence;
  showSanskrit: boolean;
  onOpen: (level: number) => void;
  /** An approximate row opens the birth-time fix, not the detail page. */
  onFixBirthTime: () => void;
}

export function CourtTable({
  seats, confidence, showSanskrit, onOpen, onFixBirthTime,
}: CourtTableProps) {
  return (
    <ul className="court" aria-label="Your court, fastest first">
      {seats.map((seat) => {
        const Icon = OFFICE_ICON[seat.meta.office];
        const p = PLANET[seat.lord];
        const approx = seat.visibility === 'approximate';
        return (
          <li key={seat.meta.level} className="court-row-wrap">
            <button
              type="button"
              className="court-row"
              data-approx={approx}
              onClick={() => (approx ? onFixBirthTime() : onOpen(seat.meta.level))}
              aria-label={
                `${seat.meta.label}. ${p.name}. ${timeLeft(seat.remainingMs)}.` +
                (approx ? ' Approximate — tap to fix your birth time.' : '')
              }
            >
              <Icon
                size={20}
                strokeWidth={1.8}
                className="court-icon"
                style={{ color: approx ? 'var(--ink-faint)' : p.ring }}
                aria-hidden
              />
              <span className="court-main">
                <span className="t-office">{seat.meta.label}</span>
                <span className="t-lord-line" style={{ color: approx ? 'var(--ink-faint)' : p.ring }}>
                  {p.name}
                  {showSanskrit && <span className="court-sanskrit"> · {seat.meta.sanskrit}</span>}
                </span>
                <span className="t-duration-note">
                  {approx ? approximateNote(confidence) : seat.meta.rules}
                </span>
              </span>
              <span className="court-right">
                {approx ? (
                  <span className="court-approx-tag">approximate</span>
                ) : (
                  <span className="time-pill">{timeLeft(seat.remainingMs)}</span>
                )}
                <ChevronRight size={16} className="court-chevron" aria-hidden />
              </span>
            </button>
            {approx && (
              <button type="button" className="court-fix" onClick={onFixBirthTime}>
                Fix birth time
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
