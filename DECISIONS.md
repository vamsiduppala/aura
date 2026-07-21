# Decisions log

Autonomous decisions taken during the build. The owner (vamsi) reviews at manual
intervention and can revert any of these. Each entry: what was decided, why, and how to
undo if the owner disagrees.

Format: `[YYYY-MM-DD] D-NN — title`

---

## [2026-07-21] D-01 — TypeScript-first monorepo, no Python backend for v1
**Decided:** Build the whole engine in pure TypeScript inside an npm-workspaces monorepo
(`packages/engine` = engine, `apps/mobile` = Expo app). No FastAPI/pyswisseph backend for v1.
**Why:** SPEC §10 offers this as an explicit option ("on-device Swiss Ephemeris WASM + TS dasha
engine, for a fully offline, no-server app"). It best serves the privacy/offline principle
(§1.7, §11.6), is fully unit-testable under node without spinning up a server, and keeps one
language across engine + app. A backend can be added later behind the same engine API without
rework.
**Undo:** Extract `packages/engine/src/{dasha,chart,transit}` logic into a FastAPI service;
the interfaces are pure functions so this is mechanical.

## [2026-07-21] D-02 — Ephemeris behind a pluggable interface; Moshier default; math tested independently
**Decided:** Define an `Ephemeris` interface. Dasha/house/nakshatra math is tested with
**hardcoded reference longitudes** (golden files), independent of any ephemeris library, so
correctness-critical math is validated regardless of ephemeris choice. Default runtime
ephemeris = a Moshier-based pure-JS implementation (no native build on Windows). Swiss
Ephemeris (WASM/native) can be swapped in later for precision.
**Why:** SPEC §4.2 explicitly allows Moshier for v1. Native Swiss Ephemeris addons are fragile
to build autonomously on Windows. Decoupling the tested math from the ephemeris means Phase 1
acceptance ("dasha timelines match 3 known charts") doesn't depend on a specific ephemeris lib.
**Undo:** Implement `SwissEphemeris` against the same interface; swap the default.

## [2026-07-21] D-03 — Real mockup FOUND; it is the visual source of truth (RESOLVED)
**Update:** Owner pointed me to `C:\Users\vamsi\Downloads\files` mid-session. It contains the
real `aura_app_screens.html` + 7 screen PNGs. Copied into `docs/mockups/`. The HTML is a
complete, high-fidelity reference: exact CSS tokens, component structure, and copy for all 7
screens. The RN app in Phase 3 mirrors this 1:1.
**Design token reconciliation:** Mockup uses evocative CSS var names; hex identical to SPEC §2:
Sun/Main→`--radiance` #FFD070 · Moon/Feel→`--tide` #8FB7FF · Mars/Fire→`--forge` #FF6E58 ·
Mercury/Mind→`--signal` #5FE0C0 · Jupiter/Grow→`--bloom` #7ED69B · Venus/Love→`--velvet` #F49CC9 ·
Saturn/Build→`--slate` #8E93C8 · Rahu/Crave→`--smoke` #AE8FE6 · Ketu/Let→`--ash` #A6ABB8.
Stored in engine `ENERGY_META.uiVar`. Screens: 01 Onboarding · 02 Today · 03 Reading ·
04 Check-in · 05 Forecast/"The Arc" · 06 Expanded · 07 Blueprint. Tagline: "Your mystical right
hand for building an empire."
**Note:** PNGs not opened individually — the HTML is the rendered truth and more precise.

## [2026-07-21] D-04 — npm workspaces + vitest + strict TS
**Decided:** Package manager = npm workspaces (built-in). Test runner = vitest (fast, TS-native,
no transpile config). TypeScript `strict: true`.
**Why:** Zero extra global installs; vitest runs the engine tests directly; strict mode catches
the kind of sign/index bugs that would corrupt dasha math.
**Undo:** Swap to pnpm/jest if desired; test files are framework-light.

## [2026-07-21] D-09 — Phase 3 UI built as a Vite web app (apps/web), not Expo mobile (yet)
**Decided:** Built the 7 screens as a Vite + React + TypeScript web app wired to `@aura/engine`,
porting the mockup's exact CSS. Not the spec's React Native + Expo (§10) — yet.
**Why:** (1) Verifiability — I can actually build, render, and screenshot a web app autonomously
to confirm it looks right; an Expo build needs a simulator/device I can't drive here, so RN
screens would be write-only/unverified. (2) De-risks bundling the astronomia dependency (Vite
handles the ESM + VSOP87 subpath imports cleanly; Metro/RN config is uncertain). (3) Gives the
owner a clickable real-data prototype to review immediately (`cd apps/web && npm run dev`).
**Result:** All 7 screens render faithfully with REAL engine data — verified via screenshots in
docs/screens/. The signature two-tone aura orb works. Readings are honest, goal-specialized,
jargon-free.
**Undo / follow-up:** Port these components to Expo/React-Native for the mobile target; the CSS
→ RN StyleSheet and the engine API stay the same. Provide the ephemeris via a Metro-friendly
build or the FastAPI backend if astronomia doesn't bundle in RN.

## [2026-07-21] D-07 — Lattice: separate signal INTENSITY (magnitude) from QUALITY (polarity)
**Decided:** In the 108-cell scoring I compute cell MAGNITUDE (always ≥ 0) using |dignity| as
"loudness" with a floor, rather than the literal `influence × strength × polarity` of SPEC §5.1
(which would zero any neutral-dignity planet and make energyScore/houseScore go negative).
Polarity + dignity are carried separately for the synthesis layer to colour gift-vs-trap tone.
**Why:** A neutral-dignity planet (e.g. Jupiter dignity ≈ 0 in the Einstein chart) still occupies
/rules/aspects houses and must contribute signal; multiplying by 0 erased it. Non-negative
intensities also make "hottest life areas" ranking well-defined. Exalted AND debilitated planets
both read as "loud" (|dignity|), which is astrologically sound — a debilitated planet in its
dasha is strongly (difficultly) felt.
**Undo:** Swap `cellStatic` back to the signed product if a future tuning wants signed scores;
the aggregation and synthesis interfaces don't change.

## [2026-07-21] D-08 — Dasha timeline spans 2 Vimshottari cycles (240 years)
**Decided:** Generate 2 full 120-year cycles of Mahadashas from the first maha (not 1).
**Why:** Vimshottari is cyclic; one cycle (120y) falls off for old charts (e.g. a 1879 birth
viewed in 2026) and long-range forecasts, breaking getStackAt/getPeriodsAt. 240y covers any
realistic case. `buildDashaTree('prana')` on 2 cycles is large (~118k leaves) but it's an
optional cache path; the hot paths (getStackAt/getPeriodsAt) walk only what they need.
**Undo:** Change `MAHA_CYCLES` in vimshottari.ts.

## [2026-07-21] D-06 — Phase-1 validation strategy: exact arithmetic goldens + calendar anchors
**Decided:** Validate the engine with (a) hand-computed dasha goldens (exact, not just "within
a day"), (b) real-world calendar anchors that need no external source — Makara Sankranti (Sun →
sidereal Capricorn ~14 Jan) and Meena Sankranti consistency validate the ayanamsa+Sun+time
pipeline; ascendant validated against pure-trig anchors; dignity validated by known exaltations
(Einstein's Mars in Capricorn, Venus in Pisces both come out exalted). A hard external golden
vs a trusted Jyotish source's *dasha dates* is left as a follow-up.
**Why:** Offline, I can't fetch a trusted external dasha table without risking locking in a
WRONG reference (many free sources disagree by days due to ayanamsa/year-length conventions).
The arithmetic is proven exact; the astronomy is anchored to real calendar events. This is a
stronger, more honest validation than an unverified external golden.
**Undo / follow-up:** Owner drops a trusted chart (birth data + that source's maha/antar dates)
into `test/fixtures/`; I assert against it. Or I WebSearch a reputable source when online.

## [2026-07-21] D-05 — True node default for Rahu; Ketu = Rahu + 180°; Lahiri ayanamsa
**Decided:** Rahu = true node (configurable to mean), Ketu = Rahu + 180°, sidereal via Lahiri
(Chitrapaksha) ayanamsa. Year length constant = 365.25 days.
**Why:** Directly per SPEC §4.2 / §4.4 defaults.
**Undo:** Config flags `nodeType: 'true'|'mean'`, `ayanamsa`, `yearLengthDays` in engine config.
