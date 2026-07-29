import '@testing-library/jest-dom/vitest';

// jsdom has no matchMedia. The app reads it for prefers-reduced-motion, so provide a
// real (non-matching) implementation rather than letting the hook swallow an exception —
// a swallowed error there would silently disable every animation in the tests too.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
