import { useEffect, useRef, type RefObject } from 'react';
import { MOTION } from '../theme/tokens';

/**
 * The activity-ring entrance sweep: every arc wipes from empty to its real value ONCE, when
 * the view appears, and never again.
 *
 * Why this is imperative rather than a CSS keyframe. The first version was
 * `.ring-arc { animation: ring-sweep … }`, and a CSS animation restarts whenever the element
 * it is attached to is re-created. Plan Detail recomputes its whole tree on a one-second
 * clock, so the sweep was being restarted every second and never advanced past its first
 * frame — measured as twelve arcs stuck at `currentTime: 0`. On screen that reads as a
 * shutter flicking closed and open, which is exactly what it was.
 *
 * Running it from an effect with no dependencies makes a restart impossible: the effect fires
 * once per mount, so no amount of re-rendering can retrigger it. A ref guard also covers
 * StrictMode's deliberate double-invoke in development.
 *
 * The invariant from the CSS version still holds, and it is the important one: an arc's
 * RESTING value is always the truth. This animates *from* empty *to* whatever the element
 * already declares, with `fill: 'backwards'` and no forwards fill — so if the animation is
 * skipped entirely (reduced motion, an unsupported engine, a background tab at mount) the
 * arc simply shows its correct value immediately. Animation may be skipped; the value may not.
 */
export function useRingSweep(root: RefObject<Element | null>): void {
  const swept = useRef(false);

  useEffect(() => {
    if (swept.current) return;
    swept.current = true;

    const el = root.current;
    if (!el) return;

    // Reduced motion renders final ring states instantly (M9). Nothing is lost: every
    // animated value is also rendered as text.
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const arcs = el.querySelectorAll<SVGCircleElement>('.ring-arc');
    for (const arc of arcs) {
      // Feature-detect rather than assume. jsdom has no Element.animate at all, and this is
      // the line where "animation is optional, the value is not" stops being a comment and
      // starts being true: with no WAAPI the arcs simply render at their real values.
      if (typeof arc.animate !== 'function') return;
      // The circumference and the stagger travel on the element as custom properties, set
      // where the geometry is known. Without a circumference there is nothing to sweep from.
      const circumference = arc.style.getPropertyValue('--ring-c').trim();
      if (!circumference) continue;
      const delay = Number.parseFloat(arc.style.getPropertyValue('--ring-delay')) || 0;
      const target = arc.style.strokeDashoffset;

      arc.animate(
        [{ strokeDashoffset: circumference }, { strokeDashoffset: target }],
        {
          duration: MOTION.ringSweepMs,
          delay,
          easing: MOTION.ringEase,
          // backwards only: hold the empty state through the stagger delay, then hand the
          // element back to its own declared value when the sweep finishes.
          fill: 'backwards',
        },
      );
    }
  }, [root]);
}
