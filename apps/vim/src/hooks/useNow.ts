import { useEffect, useState } from 'react';

/**
 * A clock that ticks every `intervalMs`, stops while the tab is hidden, and
 * re-reads immediately on becoming visible again — so a phone left in a pocket
 * for an hour shows the right time the instant it's unlocked, and burns nothing
 * while it isn't being looked at.
 *
 * Two cadences are in use, deliberately:
 *   60_000 — recompute the daśā tree. Walking five levels at 1Hz is waste.
 *    1_000 — the countdown and the Messenger arc, which are pure arithmetic on
 *            boundaries the 60s clock already resolved.
 */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: number | undefined;

    const stop = () => {
      if (timer !== undefined) { clearInterval(timer); timer = undefined; }
    };
    const start = () => {
      stop();
      setNow(new Date());
      timer = setInterval(() => setNow(new Date()), intervalMs) as unknown as number;
    };
    const onVisibility = () => {
      if (document.hidden) stop(); else start();
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [intervalMs]);

  return now;
}
