// Lightweight hash routing.
//
// The app previously kept the current screen purely in memory, which meant three things a user
// reasonably expects were simply broken: the browser Back button did nothing (or left the app),
// a refresh dumped you back on Today, and no screen could be bookmarked or shared. Hash routing
// fixes all three without a router dependency and without server config — which matters because
// the same build is served from a file:// native shell as well as a web host.

import type { Screen } from '../components/Chrome';

/** Screens a user can legitimately deep-link to. Transient flows are deliberately excluded. */
const ROUTABLE: Screen[] = ['today', 'forecast', 'chat', 'blueprint', 'settings', 'account', 'history'];

export const isRoutable = (s: Screen): boolean => ROUTABLE.includes(s);

/** Read the screen from the URL hash, or null when there isn't a valid one. */
export function screenFromHash(): Screen | null {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0]!.trim();
  return (ROUTABLE as string[]).includes(raw) ? (raw as Screen) : null;
}

/**
 * Reflect the current screen in the URL. `replace` avoids stacking history entries for
 * programmatic moves (e.g. the app deciding where to send you after sign-in), so Back stays
 * meaningful instead of walking through states the user never chose.
 */
export function writeHash(screen: Screen, replace = false): void {
  if (!isRoutable(screen)) return;
  const next = `#/${screen}`;
  if (window.location.hash === next) return;
  if (replace) window.history.replaceState(null, '', next);
  else window.history.pushState(null, '', next);
}

/** Subscribe to Back/Forward and manual hash edits. Returns an unsubscribe function. */
export function onRouteChange(fn: (s: Screen) => void): () => void {
  const handler = () => { const s = screenFromHash(); if (s) fn(s); };
  window.addEventListener('hashchange', handler);
  window.addEventListener('popstate', handler);
  return () => {
    window.removeEventListener('hashchange', handler);
    window.removeEventListener('popstate', handler);
  };
}
