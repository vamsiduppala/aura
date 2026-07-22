import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement layout APIs the app uses.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
// Never hit the network from tests (the chat service falls back to the engine anyway).
globalThis.fetch = (() => Promise.reject(new Error('network disabled in tests'))) as typeof fetch;
