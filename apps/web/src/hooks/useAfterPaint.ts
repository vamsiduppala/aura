import { useEffect, useState } from 'react';

/**
 * True once the browser has painted and gone idle.
 *
 * The Blueprint computed its house grid, the portrait, the empty-house readings and the deeper
 * classical facts in a single synchronous render — a measured 371ms long task, meaning the UI was
 * frozen for a third of a second on open. Everything below the fold is now gated on this, so the
 * page paints immediately and the expensive parts fill in a frame later. The user sees content
 * sooner and the main thread never blocks long enough to drop input.
 *
 * requestIdleCallback where available (it waits for genuine idle), rAF + timeout elsewhere.
 */
export function useAfterPaint(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const done = () => { if (!cancelled) setReady(true); };

    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    }).requestIdleCallback;

    if (ric) {
      const id = ric(done, { timeout: 400 });
      return () => {
        cancelled = true;
        (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(id);
      };
    }
    // Safari has no requestIdleCallback: paint first, then yield once.
    const raf = requestAnimationFrame(() => { const t = setTimeout(done, 0); void t; });
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, []);

  return ready;
}
