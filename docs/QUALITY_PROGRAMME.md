# The quality programme — 5 rounds to top-tier

Benchmarks: Linear (consistency + motion discipline), Stripe (density/clarity, skeletons),
Vercel (restraint), Perplexity/ChatGPT (streaming, citations, follow-ups), Co-Star (making a
complex system feel effortless for people who know nothing about it).

## Baseline measured before Round 1

| Signal | aura (before) | Top-tier norm | Verdict |
|---|---|---|---|
| Distinct font sizes | **31** | 8–10 (a scale) | every screen tuned by hand |
| Distinct border radii | **16** | 4–5 | no shape language |
| Distinct padding values | **66** | ~8 (a scale) | no rhythm |
| `transition`/`animation` rules | **4** in 647 lines | motion on every state change | UI snaps, feels static |
| Loading states | **0** | skeletons matching content shape | blank screens while computing |
| Empty states | generic text | teach the next action | dead ends |
| Streaming AI | none (wait, then dump) | first token < 1s | feels broken on slow replies |
| AI citations | none | non-negotiable for trust | user can't tell what's real |

The single biggest finding: **no design tokens**. Values were chosen per-component, so nothing
lines up. Everything in Round 1 follows from fixing that.

---

## Round 1 — Foundation: tokens, states, motion
1. Define the scales: type, space, radius, motion, easing, elevation.
2. Snap every existing value to its nearest token (consistency without a redesign).
3. Skeletons shaped like the real content for Blueprint, Forecast, Today, timing systems.
4. Empty states that teach the next action instead of dead-ending.
5. Error states with a real recovery path.
6. Micro-interactions: press, hover, focus, enter/exit — 150–250ms, one easing curve.
7. Respect `prefers-reduced-motion`.

## Round 2 — Mentor: streaming, memory, citations, follow-ups
1. Stream tokens (first paint < 1s) instead of a 15s blank wait.
2. Show which chart tools ran — our version of citations, so answers are auditable.
3. Follow-up suggestion chips generated from the answer.
4. Conversation persistence per user, resumable.
5. Stop/regenerate controls.

## Round 3 — Information architecture
1. Command palette (Cmd/Ctrl-K) across screens, chart facts and concepts.
2. Search the encoded book from anywhere.
3. Progressive disclosure — summary first, depth on demand.
4. Deep-linkable screens (URL routing) so a reading can be shared/bookmarked.

## Round 4 — Depth and personalisation
1. Saved readings + history, so yesterday's reading is still there.
2. A "why this?" trace on every claim, back to the chart fact.
3. More insight surfaces from the encoded book that nothing currently shows.
4. Compare two dates / two people (synastry groundwork).

## Round 5 — Performance, accessibility, final polish
1. Real a11y audit: roles, labels, contrast, focus order, screen-reader flow.
2. Full keyboard operability.
3. Performance: bundle, first paint, chart-compute cost.
4. Copy pass: every string in one voice.

Each round ends green: `tsc` clean on every touched package, all tests passing, committed and
pushed to both remotes.
