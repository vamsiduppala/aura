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

## [2026-07-21] D-05 — True node default for Rahu; Ketu = Rahu + 180°; Lahiri ayanamsa
**Decided:** Rahu = true node (configurable to mean), Ketu = Rahu + 180°, sidereal via Lahiri
(Chitrapaksha) ayanamsa. Year length constant = 365.25 days.
**Why:** Directly per SPEC §4.2 / §4.4 defaults.
**Undo:** Config flags `nodeType: 'true'|'mean'`, `ayanamsa`, `yearLengthDays` in engine config.
