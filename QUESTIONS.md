# Open questions for the owner (vamsi) — answered with defaults, revert if wrong

Per standing orders I did NOT ask these. Each has a **chosen default** so the build proceeds.
Review at your convenience; change any and I'll adjust.

Format: `Q-NN — question` → **Default taken:** … → **Impact of changing:** …

---

## Q-01 — App name in UI: "aura" (lowercase)?
The brief titles the app **aura** (lowercase). Repo/folder is `cosmicmentor`.
**Default taken:** Product/display name = "aura" (lowercase wordmark). Repo stays `cosmicmentor`.
**Impact of changing:** One constant (`APP_NAME`) + wordmark component.

## Q-02 — Swiss Ephemeris licensing (AGPL vs commercial) for distribution?
SPEC §4.2 flags this as a decision to make early. Native Swiss Ephemeris is AGPL or paid.
**Default taken:** Use the **Moshier** ephemeris path (no Swiss data files, no AGPL obligation)
for v1, keeping the door open to license Swiss Ephemeris later for precision. Documented in
DECISIONS D-02.
**Impact of changing:** If you're fine with AGPL or will buy a license, swap the ephemeris impl;
no engine API change.

## Q-03 — Real ephemeris library vs. self-contained astronomy?
For v1 I need Sun–Saturn + node longitudes with arc-minute-ish accuracy.
**Default taken:** Evaluate/pick a pure-JS Moshier implementation; validate its output against
known positions for the reference charts. If no suitable maintained lib exists, ship a compact
self-contained solar/lunar theory (Moon accuracy is what matters most for nakshatra/dasha) and
flag reduced planetary precision. (Being resolved during Phase 1 — see PROGRESS.)
**Impact of changing:** Purely internal; behind the `Ephemeris` interface.

## Q-04 — Geocoding provider for place → lat/lng/timezone?
Onboarding needs place search → coordinates + historical tz offset (DST-correct).
**Default taken:** For the engine + tests, accept explicit lat/lng/tzOffset (no network). For the
app, plan to use a free/offline dataset (e.g. a bundled city list + `tz-lookup`/`@photostructure/tz-lookup`
for tz-by-coordinate). No paid geocoder. Historical DST via `luxon`/IANA tz. Wire in Phase 3.
**Impact of changing:** If you want Google/Mapbox geocoding, it's one adapter in the app layer.

## Q-05 — Optional Claude LLM polish now or later?
SPEC §6.3/§11.7 make LLM polish optional and "later."
**Default taken:** Ship **template-only** (deterministic) content first. Build the guardrail
system prompt + a stub polish adapter (off by default). No API key wired.
**Impact of changing:** Flip a config flag + provide an API key when you want live polish.

## Q-06 — Do you want a hosted backend at all for v1?
**Default taken:** No. Fully on-device/offline (D-01). This is the most privacy-preserving and
needs no infra/billing.
**Impact of changing:** Add the FastAPI service later; engine API is already the boundary.

## Q-07 — Store / distribution targets (iOS, Android, web)?
**Default taken:** Expo app targeting iOS + Android; Expo web left buildable but unpolished.
Also producing a static HTML mockup for quick visual review without a device/simulator.
**Impact of changing:** Adjust Expo config + testing targets.

## Q-09 — Streak counter (mockup) vs "no streak-shaming" (§11.5)?
The mockup's Today/Forecast brandbar shows a "🔥 7" streak. SPEC §11.5 forbids loss-framed
streak pressure and streak-shaming.
**Default taken:** Implement a **gentle, non-punitive** streak: it only ever counts up and is
shown as quiet ambient info. Never a loss-frame ("don't break your streak!"), never a
notification about it, never a shame state when it resets. If you'd rather drop it entirely,
it's one component to hide.
**Impact of changing:** Remove/keep the `StreakChip`; no engine impact.

## Q-08 — Reference charts for dasha validation — which birth records?
Phase 1 acceptance needs ≥3 charts with independently-known Vimshottari timelines.
**Default taken:** Use well-documented public birth data (e.g. public figures with widely
published birth date/time/place) and/or synthetic charts where I compute the Moon nakshatra by
hand and assert the dasha arithmetic. Primary guarantee = the dasha *arithmetic* is exact given a
Moon longitude (tested with hand-computed goldens); secondary = spot-check against an external
Jyotish source. Details recorded in the test files.
**Impact of changing:** If you have specific reference charts (with a trusted source's dasha
dates), drop them in `packages/engine/test/fixtures/` and I'll assert against them.
