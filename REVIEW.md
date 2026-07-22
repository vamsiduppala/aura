# Review guide — aura

You authorized continuous autonomous building across sessions. This is the fast path to
reviewing the current state. Everything is committed + pushed to
`github.com/vamsiduppala/cosmicmentor` (private).

## TL;DR
A real Vedic engine (**86 unit tests**) drives a responsive web app (**9 screens**, 4 web tests),
including the retention pivot you asked for. All tests + typechecks + build are green.

## See it
```bash
npm install
npm --workspace @aura/web run dev      # → http://localhost:5173
npm test                                # engine (86) + web (4)
```
Can't run it? Read **`docs/SAMPLE_OUTPUT.md`** — real readings/retrospective/mentor/born-gifts
for two charts, generated straight from the engine.

## What to look at (priority order)
1. **The pivot end-to-end** (SAMPLE_OUTPUT.md shows it): onboarding → **Audit** ("Prove It":
   the engine run backwards over ~18 months proves your *past* before predicting) → sharpened
   **Trap** (names your specific unconscious loop) → the reading/mentor close on **your real
   born-gift strength** to break it.
2. **Cosmic Mentor chat** (`services/chat.ts` + `mentor/`): Gemini with *forced function-calling*
   — the LLM must read the real engine before it narrates; it can't invent astrology. Works
   offline via a deterministic fallback. Your key authenticates but is quota-limited (429) — add
   a fresh key in **Settings** to light up the LLM.
3. **Accuracy** (`chart/`): Navamsa (D9), Shadbala-style strength, Ashtakavarga (337-invariant
   verified), and classical **Yogas** → "Born gifts" on the Blueprint.
4. **The engine** (`packages/engine/src`): `dasha/`, `lattice/` (the 108), `synthesis/`.

## Decisions you can revert (full list in DECISIONS.md)
- **D-09 — web app, not Expo (yet).** Built for verifiability; native iOS/Android are SwiftUI/
  Compose *skeletons* (`apps/ios`, `apps/android`) that compile against a ported engine core.
- **D-10/11 — Gemini (your key), forced function-calling + offline fallback.**
- **D-01/02 — offline TS engine, astronomia (Moshier-class), no backend, no AGPL.**

## Deferred (documented in PROGRESS.md, not shipped unverified)
Lazy-loading the ~1.4MB astronomy bundle · full native engine port · real geocoder + historical
DST · a server proxy for the LLM key (production).

## How correct is the engine?
Exact dasha-arithmetic goldens; **Einstein's chart matches published Jyotish sources** on all six
discrete facts (Moon Scorpio/Jyeshtha, Sun Pisces, Gemini lagna, Mars exalted in the 8th, the
Jupiter↔Saturn 9th/10th exchange); Makara/Meena Sankranti calendar anchors; robustness tests
across 78°N / +14h / 1901–2100 / unknown-time.

Nothing is blocked on you. Point me at whatever matters most next.
