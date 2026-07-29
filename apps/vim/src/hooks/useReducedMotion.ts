import { useEffect, useState } from 'react';

/**
 * Honours the OS "reduce motion" setting, live. Under it: the halo stops breathing,
 * connectors stop crawling, the starfield stops drifting and rings snap to their final
 * values. Strokes, colours and glows stay — none of the motion carries information
 * that isn't also rendered as text.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof matchMedia !== 'function') return false;
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  return reduced;
}
