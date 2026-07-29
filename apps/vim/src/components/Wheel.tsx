// The Wheel — five concentric progress rings, one per office. This is the product.
//
// Geometry facts that are load-bearing (all from theme/tokens.ts):
//  · Outermost ring = fastest (Messenger). The outer edge is the only thing on screen
//    that visibly moves in real time; that is the whole appeal.
//  · Fill = elapsed ÷ total FOR THAT PERIOD. A 6-year Sun King and a 20-year Venus
//    King both read 0→100% across their own length.
//  · Round caps on both ends of every arc. That is what sells the Activity-Ring look.
//  · Adjacent rings sharing a planet blur into one fat band, so the outer one loses
//    2pt of stroke and drops to 85% opacity.
//  · Hit-testing resolves by NEAREST RING-CENTRE DISTANCE, not by exact hit. At these
//    strokes with these gaps, exact testing loses about a fifth of taps.

import { useMemo, useRef } from 'react';
import type { CourtSeat } from '../core/court';
import { humanRemaining, timeLeft } from '../core/time';
import { MOTION, PLANET, WHEEL, WHEEL_TIMELINE, type RingSpec } from '../theme/tokens';

interface WheelProps {
  seats: CourtSeat[];
  /** 1-second clock. Progress is recomputed locally from each period's own
   *  boundaries, so the fastest ring animates without re-walking the tree. */
  now: Date;
  rings?: readonly RingSpec[];
  /** Diameter of the carved well, in px. */
  size?: number;
  onSelectLevel?: (level: number) => void;
  /** What the centre shows. Timeline shows the King; a plan shows its stage. */
  centre?: React.ReactNode;
}

interface Ring {
  spec: RingSpec;
  seat: CourtSeat;
  radius: number;
  stroke: number;
  circumference: number;
  progress: number;
  opacity: number;
  dashed: boolean;
}

export function Wheel({
  seats, now, rings = WHEEL_TIMELINE, size = WHEEL.wellTimeline, onSelectLevel, centre,
}: WheelProps) {
  const box = size;
  const c = box / 2;

  const drawn = useMemo<Ring[]>(() => {
    const byLevel = new Map(seats.map((s) => [s.meta.level, s]));
    const out: Ring[] = [];
    for (const spec of rings) {
      const seat = byLevel.get(spec.level);
      if (!seat || seat.visibility === 'hidden') continue; // hidden rings are not drawn
      // Local progress from this period's own boundaries — no tree walk at 1Hz.
      const total = seat.end.getTime() - seat.start.getTime();
      const elapsed = now.getTime() - seat.start.getTime();
      const progress = total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 0;

      // Adjacent same-lord rings: thin the outer one and drop its opacity.
      const inner = byLevel.get((spec.level - 1) as 1 | 2 | 3 | 4 | 5);
      const sameAsInner = inner?.lord === seat.lord;
      const dashed = seat.visibility === 'approximate';
      const stroke = spec.stroke - (sameAsInner ? WHEEL.sameLordGap : 0);
      const radius = (spec.diameter - stroke) / 2;
      out.push({
        spec, seat, radius, stroke,
        circumference: 2 * Math.PI * radius,
        progress,
        opacity: dashed ? 0.4 : sameAsInner ? WHEEL.sameLordOuterOpacity : 1,
        dashed,
      });
    }
    return out;
  }, [seats, rings, now]);

  const svgRef = useRef<SVGSVGElement>(null);

  /** Nearest ring centre wins, within the slop. Returns null on a miss. */
  const levelAtPoint = (clientX: number, clientY: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    if (!r.width) return null;
    const scale = box / r.width; // viewBox units per CSS px
    const dx = (clientX - r.left) * scale - c;
    const dy = (clientY - r.top) * scale - c;
    const dist = Math.hypot(dx, dy);
    let best: Ring | null = null;
    let bestGap = Number.POSITIVE_INFINITY;
    for (const ring of drawn) {
      const gap = Math.abs(dist - ring.radius);
      if (gap < bestGap) { bestGap = gap; best = ring; }
    }
    if (!best || bestGap > best.stroke / 2 + WHEEL.hitSlop) return null;
    return best.spec.level;
  };

  return (
    <div className="wheel" style={{ width: box, height: box }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${box} ${box}`}
        width={box}
        height={box}
        className="wheel-svg"
        role="group"
        aria-label="Your court, as five progress rings"
        onClick={(e) => {
          const level = levelAtPoint(e.clientX, e.clientY);
          if (level != null) onSelectLevel?.(level);
        }}
      >
        <defs>
          {/* One blur reused by every arc's glow layer — cheaper than five filters. */}
          <filter id="wheel-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation={WHEEL.glowBlur / 3} />
          </filter>
        </defs>

        {/* Rotate so every arc starts at 12 o'clock. */}
        <g transform={`rotate(${WHEEL.startAngleDeg} ${c} ${c})`}>
          {drawn.map((ring) => {
            const p = PLANET[ring.seat.lord];
            // The arc's RESTING value is always the true one. The entrance sweep is a CSS
            // animation whose only keyframe is `from: empty`, so the element returns to the
            // real value the moment the animation ends — and shows it even if the animation
            // never runs at all. An earlier version flipped a React state in
            // requestAnimationFrame, which meant a ring rendered in a background tab (where
            // rAF is throttled to zero) sat at 0% indefinitely. Animation may be skipped;
            // the value may not.
            const arc = {
              strokeDasharray: ring.circumference,
              strokeDashoffset: ring.circumference * (1 - ring.progress),
              // Messenger first, King last — the load reads outward-in.
              ['--ring-c' as string]: `${ring.circumference}`,
              ['--ring-delay' as string]: `${(5 - ring.spec.level) * MOTION.ringStaggerMs}ms`,
            } as React.CSSProperties;
            return (
              <g key={ring.spec.level} opacity={ring.opacity}>
                {/* Unfilled track */}
                <circle
                  cx={c} cy={c} r={ring.radius}
                  fill="none"
                  stroke="var(--surf-ring-track)"
                  strokeWidth={ring.stroke}
                  {...(ring.dashed ? { strokeDasharray: '3 7' } : {})}
                />
                {/* Rim, for planets whose own colour can't carry an edge (Saturn,
                    Moon, Jupiter). Drawn wider and underneath. */}
                {p.rim && (
                  <circle
                    className="ring-arc"
                    cx={c} cy={c} r={ring.radius}
                    fill="none" stroke={p.rim} strokeWidth={ring.stroke + 1.6}
                    strokeLinecap="round" style={arc}
                  />
                )}
                {/* Glow, then the arc itself. */}
                <circle
                  className="ring-arc"
                  cx={c} cy={c} r={ring.radius}
                  fill="none" stroke={p.ring} strokeWidth={ring.stroke}
                  strokeLinecap="round"
                  opacity={WHEEL.glowOpacity}
                  filter="url(#wheel-glow)"
                  style={arc}
                />
                <circle
                  className="ring-arc"
                  data-arc={ring.spec.level}
                  cx={c} cy={c} r={ring.radius}
                  fill="none" stroke={p.ring} strokeWidth={ring.stroke}
                  strokeLinecap="round"
                  style={arc}
                />
                {/* The hit target: a fat invisible stroke, focusable, labelled. */}
                <circle
                  cx={c} cy={c} r={ring.radius}
                  fill="none" stroke="transparent"
                  strokeWidth={ring.stroke + 2 * WHEEL.hitSlop}
                  role="button"
                  tabIndex={0}
                  aria-label={ringLabel(ring)}
                  style={{ cursor: onSelectLevel ? 'pointer' : 'default' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectLevel?.(ring.spec.level);
                    }
                  }}
                />
              </g>
            );
          })}
        </g>
      </svg>

      <div className="wheel-centre">{centre}</div>
    </div>
  );
}

/** What a screen reader says for a ring: role, planet, how far through, how long left. */
function ringLabel(ring: Ring): string {
  const pct = Math.round(ring.progress * 100);
  const { meta, lord, remainingMs } = ring.seat;
  const approx = ring.dashed ? ' Marked approximate.' : '';
  return `${meta.label} ring. ${PLANET[lord].name}. ${pct} percent elapsed. ${humanRemaining(remainingMs)} remaining.${approx}`;
}

/** The Timeline centre readout: who the King is and how long he has left. */
export function WheelCentreKing({ seat }: { seat: CourtSeat | undefined }) {
  if (!seat) return null;
  const p = PLANET[seat.lord];
  return (
    <>
      <span className="wheel-dot" style={{ background: p.ring }} aria-hidden />
      <span className="wheel-eyebrow">
        The {seat.meta.label} · <span style={{ color: p.ring }}>{p.name}</span>
      </span>
      <span className="wheel-readout">{timeLeft(seat.remainingMs)}</span>
    </>
  );
}
