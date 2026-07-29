// The neumorphic primitives. Two rules decide which one to reach for:
//   · Anything the user TAPS is raised.
//   · Anything things are PUT INTO is inset — inputs, wells, progress tracks.
// Getting that backwards is the tell that someone applied the style without the logic.

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

const cx = (...parts: (string | false | undefined | null)[]): string =>
  parts.filter(Boolean).join(' ');

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Softer shadow, tighter radius — for cards nested inside other cards. */
  soft?: boolean;
}

/** A card, a pill, a tab bar: something standing off the surface. */
export function Raised({ soft, className, children, ...rest }: SurfaceProps) {
  return (
    <div className={cx(soft ? 'neu-raised-soft' : 'neu-raised', className)} {...rest}>
      {children}
    </div>
  );
}

/** A carved well: an input, a progress track, the wheel's recess. */
export function Inset({ soft, className, children, ...rest }: SurfaceProps) {
  return (
    <div className={cx(soft ? 'neu-inset-soft' : 'neu-inset', className)} {...rest}>
      {children}
    </div>
  );
}

interface PressableProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  /** Raised by default. `flat` for a text-only control that still needs a 44px target. */
  variant?: 'raised' | 'flat' | 'primary';
}

/**
 * A raised surface that is also a button. Pressing it sinks *toward* the base — the
 * shadow shrinks as well as the scale, because scale alone reads as a web hover
 * rather than as pressure on a physical surface.
 */
export function Pressable({
  variant = 'raised', className, children, ...rest
}: PressableProps) {
  return (
    <button
      type="button"
      className={cx(
        'neu-press', 'tap',
        variant === 'raised' && 'neu-raised-soft',
        variant === 'primary' && 'btn-primary',
        variant === 'flat' && 'btn-flat',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * A horizontal progress track. Inset, because progress is poured into a channel.
 * `tint` is the ruling planet's colour — progress is never a generic blue.
 */
export function ProgressTrack({
  value, tint, height = 6, label,
}: { value: number; tint: string; height?: number; label?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className="progress-track"
      style={{ height }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      {...(label ? { 'aria-label': label } : {})}
    >
      <div
        className="progress-fill"
        style={{ width: `${pct}%`, background: tint, boxShadow: `0 0 8px ${tint}66` }}
      />
    </div>
  );
}
