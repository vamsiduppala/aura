// The Wheel — five concentric progress rings, one per office. This is the product.
//
// Geometry (§4.2, values in @vim/tokens): 360-unit canvas, uniform 22 stroke, radii
// 158/130/102/74/46, round caps, -90° start, clockwise.
//
// Load-bearing decisions:
//  · Outermost = fastest (Messenger). The outer ring has the most arc-length per pixel, so
//    the thing that visibly moves gets the most room to move in.
//  · Fill = elapsed ÷ total FOR THAT PERIOD. A 6-year Sun King and a 20-year Venus King both
//    read 0→100% across their own length.
//  · The track is the ring's own colour at 12%, not a grey — an empty ring still says WHICH
//    ring it is.
//  · Uniform 22 stroke: 22 + 11 slop clears 44pt on every ring, so all five are genuinely
//    tappable rather than three of them being aspirational.
//  · Identity never rests on hue alone (M9). Each planet carries a glyph tick at its 12
//    o'clock start AND a stroke texture, because ~8% of male users cannot reliably separate
//    Mars red from Mercury green, and Saturn against Rāhu is two greys at this weight.
//  · Hit-testing resolves by NEAREST RING-CENTRE DISTANCE. Exact annulus testing loses taps.
//
// SIZE IS NOT A PROP. The viewBox is fixed and the SVG scales to whatever box CSS gives it,
// so one component is 280px on a phone and 440px on a monitor with no second code path.

import { useMemo, useRef } from 'react';
import type { CourtSeat } from '../core/court';
import { humanRemaining, timeLeft } from '../core/time';
import { MOTION, PLANET, WHEEL, WHEEL_CANVAS, WHEEL_TIMELINE, type RingSpec } from '../theme/tokens';

interface WheelProps {
  seats: CourtSeat[];
  /** 1-second clock. Progress is recomputed locally from each period's own boundaries, so
   *  the fastest ring animates without re-walking the tree. */
  now: Date;
  rings?: readonly RingSpec[];
  /** Display size band. CSS owns the pixels; this only says which band. */
  size?: 'hero' | 'compact';
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

/**
 * The non-colour texture channel. Each pattern tiles in user space, so it stays the same
 * physical size whatever the wheel scales to. Overlaid at low opacity on the filled arc
 * only — the track stays clean so the fill boundary is unambiguous.
 */
function TexturePatterns() {
  const stroke = { stroke: '#000', strokeWidth: 1.4, fill: 'none' } as const;
  return (
    <>
      <pattern id="tex-dots" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.15" fill="#000" />
      </pattern>
      <pattern id="tex-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" {...stroke} />
      </pattern>
      <pattern id="tex-crosshatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="7" {...stroke} />
        <line x1="0" y1="0" x2="7" y2="0" {...stroke} />
      </pattern>
      <pattern id="tex-chevron" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 6 L4 2 L8 6" {...stroke} />
      </pattern>
      <pattern id="tex-wide" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(90)">
        <line x1="0" y1="0" x2="0" y2="12" stroke="#000" strokeWidth="2.6" />
      </pattern>
      <pattern id="tex-wave" width="12" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 4 Q3 0 6 4 T12 4" {...stroke} />
      </pattern>
      {/* Saturn: a static star field. The animated shader version is feature-flagged for
          later; a static speckle is also the prefers-reduced-motion fallback, so this is
          the honest baseline rather than a placeholder. */}
      <pattern id="tex-stars" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="4" r="0.9" fill="#fff" opacity="0.75" />
        <circle cx="10" cy="2" r="0.6" fill="#fff" opacity="0.5" />
        <circle cx="7" cy="9" r="1" fill="#fff" opacity="0.85" />
        <circle cx="12" cy="11" r="0.65" fill="#fff" opacity="0.55" />
      </pattern>
      <pattern id="tex-grain" width="5" height="5" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.7" fill="#000" opacity="0.8" />
        <circle cx="4" cy="3.5" r="0.5" fill="#fff" opacity="0.35" />
      </pattern>
    </>
  );
}

export function Wheel({
  seats, now, rings = WHEEL_TIMELINE, size = 'hero', onSelectLevel, centre,
}: WheelProps) {
  const box = WHEEL_CANVAS;
  const c = box / 2;

  const drawn = useMemo<Ring[]>(() => {
    const byLevel = new Map(seats.map((s) => [s.meta.level, s]));
    const out: Ring[] = [];
    for (const spec of rings) {
      const seat = byLevel.get(spec.level);
      if (!seat || seat.visibility === 'hidden') continue; // hidden rings are not drawn
      const total = seat.end.getTime() - seat.start.getTime();
      const elapsed = now.getTime() - seat.start.getTime();
      const progress = total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 0;

      // Adjacent same-lord rings blur into one fat band: thin the outer one, dim it.
      const inner = byLevel.get((spec.level - 1) as 1 | 2 | 3 | 4 | 5);
      const sameAsInner = inner?.lord === seat.lord;
      const dashed = seat.visibility === 'approximate';
      const stroke = spec.stroke - (sameAsInner ? WHEEL.sameLordGap : 0);
      out.push({
        spec, seat, radius: spec.radius, stroke,
        circumference: 2 * Math.PI * spec.radius,
        progress,
        opacity: dashed ? 0.45 : sameAsInner ? WHEEL.sameLordOuterOpacity : 1,
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
    const scale = box / r.width; // canvas units per CSS px, whatever CSS chose
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
    <div className="wheel" data-size={size}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${box} ${box}`}
        className="wheel-svg"
        role="group"
        aria-label="Your court, as five progress rings"
        onClick={(e) => {
          const level = levelAtPoint(e.clientX, e.clientY);
          if (level != null) onSelectLevel?.(level);
        }}
      >
        <defs>
          {/* One blur reused by every glow layer — cheaper than five filters. */}
          <filter id="wheel-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <TexturePatterns />
          {/* §4.2: the fill is a sweep from full colour to 78% luminance. A true conic
              sweep isn't available in SVG, so this is a linear gradient across the arc —
              which is what reads as a sweep once the stroke is curved. */}
          {drawn.map((ring) => (
            <linearGradient
              key={ring.spec.level}
              id={`grad-${ring.spec.level}`}
              gradientUnits="userSpaceOnUse"
              x1={c - ring.radius} y1={c - ring.radius}
              x2={c + ring.radius} y2={c + ring.radius}
            >
              <stop offset="0%" stopColor={PLANET[ring.seat.lord].ring} />
              <stop
                offset="100%"
                stopColor={`color-mix(in srgb, ${PLANET[ring.seat.lord].ring} 78%, #000)`}
              />
            </linearGradient>
          ))}
        </defs>

        {/* Rotate so every arc starts at 12 o'clock and runs clockwise. */}
        <g transform={`rotate(${WHEEL.startAngleDeg} ${c} ${c})`}>
          {drawn.map((ring) => {
            const p = PLANET[ring.seat.lord];
            // The arc's RESTING value is always the true one. The entrance sweep is a CSS
            // animation whose only keyframe is `from: empty`, so the element returns to the
            // real value the moment the animation ends — and shows it even if the animation
            // never runs at all. An earlier version flipped a React state inside
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
            const textured = p.texture !== 'solid';
            return (
              <g key={ring.spec.level} opacity={ring.opacity}>
                {/* Track: this ring's own colour at 12%, so an empty ring still identifies
                    itself. Dashed when the birth time can't support this level. */}
                <circle
                  cx={c} cy={c} r={ring.radius}
                  fill="none"
                  stroke={p.ring}
                  strokeOpacity={WHEEL.trackOpacity}
                  strokeWidth={ring.stroke}
                  {...(ring.dashed ? { strokeDasharray: '6 10' } : {})}
                />
                {/* Rim, for planets whose own colour cannot carry an edge. Saturn is
                    near-black on a near-black surface; Moon is off-white and needs an inner
                    shadow ring so it appears to sit IN the surface rather than float. */}
                {p.rim && (
                  <circle
                    className="ring-arc"
                    cx={c} cy={c} r={ring.radius}
                    fill="none" stroke={p.rim} strokeWidth={ring.stroke + 2}
                    strokeLinecap="round" style={arc}
                  />
                )}
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
                  fill="none" stroke={`url(#grad-${ring.spec.level})`} strokeWidth={ring.stroke}
                  strokeLinecap="round"
                  style={arc}
                />
                {/* Texture overlay, on the filled portion only. */}
                {textured && (
                  <circle
                    className="ring-arc"
                    cx={c} cy={c} r={ring.radius}
                    fill="none"
                    stroke={`url(#tex-${p.texture})`}
                    strokeWidth={ring.stroke}
                    strokeLinecap="round"
                    opacity={0.4}
                    style={arc}
                  />
                )}
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

        {/* Glyph ticks sit OUTSIDE the rotation, at each ring's 12 o'clock start — the
            second non-colour identity channel. */}
        {drawn.map((ring) => (
          <text
            key={`glyph-${ring.spec.level}`}
            className="ring-glyph"
            x={c}
            y={c - ring.radius}
            textAnchor="middle"
            dominantBaseline="central"
            aria-hidden
          >
            {PLANET[ring.seat.lord].glyph}
          </text>
        ))}
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

/**
 * The legend under the wheel: dot, glyph, office, planet. This is how people learn the
 * vocabulary without a tutorial, and it is the third place identity is carried without
 * relying on colour.
 */
export function WheelLegend({
  seats, onSelectLevel,
}: { seats: CourtSeat[]; onSelectLevel?: (level: number) => void }) {
  const visible = seats.filter((s) => s.visibility !== 'hidden');
  return (
    <ul className="legend" aria-label="What each ring is">
      {visible.map((seat) => {
        const p = PLANET[seat.lord];
        return (
          <li key={seat.meta.level}>
            <button
              type="button"
              className="legend-item"
              onClick={() => onSelectLevel?.(seat.meta.level)}
              data-approx={seat.visibility === 'approximate'}
              aria-label={`${seat.meta.label}, ${p.name}`}
            >
              <span className="legend-dot" style={{ background: p.ring }} aria-hidden />
              <span className="legend-text">
                <span className="legend-office">{seat.meta.label}</span>
                <span className="legend-lord" style={{ color: p.ring }}>
                  {p.glyph} {p.name}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
