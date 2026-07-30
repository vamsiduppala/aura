# Vimshottari — Enterprise Architecture & Build Plan

**Scope:** Web (responsive + PWA), Android, iOS
**Status:** Pre-implementation. This document supersedes the Figma copy spec and build spec as the engineering source of truth.
**Audience:** Whoever writes the first line of code, and whoever has to maintain it in year three.

---

## 0. The one architectural principle everything else follows from

> **The astrology is computed. The prose is generated. Never the other way around.**

Every number in this app — dasha boundaries, remaining time, ring fill percentage, plan phase edges — comes out of a deterministic engine with test vectors. The AI writes *about* those numbers; it never produces them. The moment an LLM is allowed to say "your Venus Antardasha ends in March," you have a product that lies to users at a 3–8% rate and you cannot debug it.

Second principle, which falls out of the first: **the engine is a library, not a service call.** It ships inside the clients so rings animate offline and instantly, and it also runs on the server so notifications can be scheduled. Same logic, two homes, one set of golden vectors proving they agree.

---

## 1. Product surface → module map

| Surface | Module | Owner-ish |
|---|---|---|
| Signup / login / OTP | **Auth** | Backend + all clients |
| DOB, time, place capture | **Birth Data Capture** | All clients |
| Planner (home) | **Planner** | Full-stack |
| Plan questionnaire → phases | **Plan Composer** (rules engine) | Backend |
| DevOps-style pipeline rail | **Pipeline Renderer** | Clients |
| Timeline (5 rings + court table) | **Timeline** | Clients + Engine |
| Dasha Detail (In the Kingdom / Advantage / Obstacle) | **Interpretation** | Backend content + clients |
| Task Detail | **Interpretation** (reused) | Clients |
| Biggest Change Ahead countdown | **Handover** | Clients |
| Mentor chat + threads | **Mentor** | Backend AI gateway |
| Reminders (email / in-app / SMS) | **Notification Engine** | Backend |
| Account | **Profile & Entitlements** | Full-stack |

Bottom nav is three items — **Planner · Timeline · Mentor** — with Account behind the avatar in the top bar. Three is the right number; a fourth tab dilutes the Mentor, which is the retention driver.

---

## 2. Stack decisions, and what I rejected

| Layer | Choice | Rejected | Why |
|---|---|---|---|
| Mobile | **Flutter 3.3x**, single codebase iOS + Android | React Native | The rings are custom-painted animated geometry with a fragment shader for Saturn. Flutter's `CustomPainter` + Impeller gives you one implementation at 120fps on both platforms. RN would mean Skia-via-bridge or two native ring implementations. |
| Web | **Next.js 15 (App Router) + TypeScript** | Flutter Web | Flutter Web ships a ~1.5MB+ canvas renderer, has poor SEO and text selection, and breaks browser-native scroll. The web build's job is acquisition and shareable chart pages — that needs real DOM and SSR. Accept the second codebase; it's ~30% of the surface. |
| Web styling | **Tailwind v4 + CSS custom properties for the neumorphic tokens** | CSS-in-JS | Tokens generated from Figma need to land as CSS vars so the same JSON drives Dart and CSS. |
| Web animation | **Motion (framer-motion)** for layout/transitions, raw `requestAnimationFrame` + SVG for rings | GSAP | Rings need per-frame stroke-dashoffset control; Motion handles everything else. |
| Backend | **NestJS (TypeScript) as BFF** + **Dart Frog** microservice for the engine | Monolith in Python | NestJS gives DI, guards, interceptors, OpenAPI generation for free. The engine service is Dart so it's literally the same code the app runs. |
| Astrology math | Existing partner API **behind an adapter**, plus own Vimshottari engine | Trusting the partner API for dashas | You already found that 1 minute of birth-time error moves boundaries ~5 days. You cannot outsource that and still debug it. Use the partner API for planetary longitudes / natal chart; compute dashas yourself. |
| DB | **PostgreSQL 16** + `pgvector` + **Redis 7** | Mongo | Everything here is relational and temporal — periods, plans, revisions, entitlements. Range types and exclusion constraints are worth the whole migration story. |
| Object storage | S3 (or R2) for share cards, exports | — | |
| Jobs / scheduling | **Temporal** for plan + reminder workflows | Bare cron | Reminders are long-lived, timezone-sensitive, cancellable workflows that survive a DOB edit. That's Temporal's exact shape. |
| AI | **Claude via server-side gateway**, tool use against own API | Client-side API key | Never. |
| Auth | **Ory Kratos** self-hosted, or Auth0 if you want to buy it | Rolling your own | See M1. |
| Monorepo | **Turborepo** (JS) + **Melos** (Dart), one git repo | Polyrepo | The token pipeline and the golden vectors have to be shared. |
| CI | **GitHub Actions** + **Codemagic** for signed mobile builds | Jenkins | |

```
/vimshottari
  /apps
    /mobile          Flutter — iOS + Android
    /web             Next.js
    /api             NestJS BFF
    /engine-svc      Dart Frog — engine over HTTP for server-side use
    /admin           Next.js — astrologer console
  /packages
    /dasha-engine    pure Dart, zero deps, the crown jewel
    /engine-js       dart compile js output + TS typings, consumed by web
    /tokens          design tokens JSON → Style Dictionary → dart/css/swift/kt
    /vectors         golden test fixtures, language-agnostic JSON
    /contracts       OpenAPI + generated clients
```

---

## 3. The Dasha Engine

**Concept.** Vimshottari is a 120-year cycle subdivided nine ways, recursively, five levels deep. Every screen in this app is a view onto one function: `periodsAt(birthMoment, now, depth)`. Get this wrong and nothing else matters.

**Implementation.**

```dart
// packages/dasha_engine — pure Dart, no Flutter, no HTTP, no clock access.
DashaStack resolve({
  required double moonLongitudeSidereal,  // from partner API, ayanamsa-corrected
  required DateTime birthUtc,             // exact UTC instant
  required DateTime atUtc,
  int depth = 5,
});
```

Rules I'm hard-committing to:

1. **No `DateTime.now()` inside the package.** The clock is injected. Otherwise you cannot test and cannot render "state at date X" for the Timeline scrubber.
2. **All arithmetic in microseconds since epoch as `int`**, not `Duration` chains and never `double` days. Floating-point drift across five levels of nesting is how you get an off-by-two-hours Pranadasha.
3. **Boundaries are half-open** `[start, end)`. Level *n+1* sub-periods must sum *exactly* to the parent, with the last child absorbing the remainder microsecond. This is a property test, not a hope.
4. **Ayanamsa is a stored parameter, not a constant.** Lahiri by default; the value used is written onto the chart row. If you ever support Raman or KP, existing charts must not silently shift.
5. **`engineVersion` semver is stamped on every persisted computation.** When the engine changes, a background job recomputes and diffs; users whose boundaries moved more than 6 hours get a quiet in-app notice. This is the module nobody builds and everybody needs.

**Golden vectors.** `/packages/vectors/*.json` — 40 charts (edge cases: born at midnight, born during a DST transition, born in a pre-1970 timezone offset, born at 23:59:59.9, southern hemisphere, high latitude) each with all five levels of expected boundaries to the second. Every implementation — Dart, the compiled JS, and any future Swift/Kotlin port — runs the same fixtures in CI. A vector mismatch fails the build.

**Birth-time precision, surfaced not hidden.** Your earlier finding is a product feature. The engine returns a `confidence` envelope:

```dart
class DashaPeriod {
  DateTime start, end;
  Duration boundaryUncertainty;  // derived from profile.birthTimeAccuracy
}
```

If the user said "around 6 AM," accuracy is ±30 min, and the UI renders the Pranadasha ring with a **feathered leading edge** and the text "±3 days" next to boundary dates rather than a false-precise timestamp. If they said "6:04 AM, from the certificate," accuracy is ±1 min and edges are crisp. This single decision is what separates a credible product from a toy.

---

## 4. Module implementation, one by one

Each module below gets: **Concept** (why it exists), **Data**, **Logic**, then **Web / Android / iOS** rendering notes.

### 4.1 Birth Data Capture

**Concept.** This is the highest-stakes form in the app and it's three fields. Everything downstream is a function of it.

**Data.** `profiles(birth_date, birth_time, birth_time_accuracy_enum, place_id, lat, lng, tz_id, utc_offset_used, ayanamsa)`

**Logic.**
- Place autocomplete → Google Places Autocomplete (session tokens, or Mapbox/Photon if you want the cheaper bill). You store `place_id` **and** frozen lat/lng/tz, because provider data mutates.
- **Timezone resolution is the trap.** You need the offset *that was in force at that place on that date* — not today's. Use IANA `tzdata` via `timezone` (Dart) / `luxon` (TS), and for pre-1970 births, know that tzdata's pre-1970 data is deliberately approximate. For India: pre-1955 Calcutta/Bombay local times, the 1942 DST experiment. Store `utc_offset_used` explicitly so a future tzdata update doesn't silently reinterpret existing charts.
- "I don't know my birth time" → route to a **rectification lane**: accept a time range, compute with the midpoint, mark accuracy `unknown`, degrade the UI to Pratyantardasha depth only (no Sukshma/Prana rings, because they'd be fiction), and offer a paid rectification consult later. Don't just default to 12:00 and pretend.

**Web.** Three-step wizard, one field per view, URL-addressable (`/onboarding/place`) so drop-off is measurable per step. Native `<input type="date">` on mobile web, custom picker on desktop.
**Android.** `MaterialDatePicker` + `MaterialTimePicker` via Flutter's Material widgets; time picker defaults to the 24h/12h format from system locale. Autocomplete in a `TypeAheadField` with 300ms debounce.
**iOS.** Cupertino wheel pickers — iOS users expect the drum, and it produces *more precise* time entry than a keypad, which matters here. Haptic `selectionClick` on each wheel detent.

### 4.2 Rings Renderer (shared across Timeline and Planner)

**Concept.** Apple's Activity Rings work because they encode "progress toward a bounded goal" in a shape you read in 200ms. Here the bound is a period's duration. Five concentric rings = five levels of governance, outermost = fastest-moving (Messenger/Prana), innermost = slowest (King/Maha). Fast on the outside is correct because the outer ring has the most arc-length per pixel, so the thing that changes visibly gets the most room.

**Geometry spec (single source, three implementations).**

```
canvas            360 × 360 dp/px @1x
ring stroke       22 dp   (tappable — Apple's 44pt min is met by 22 stroke + 11 slop either side)
inter-ring gap    8 dp
outer ring R      158 dp  → Prana (Messenger)
ring 2 R          130 dp  → Sukshma (Magistrate)
ring 3 R          102 dp  → Pratyantar (Governor)
ring 4 R           74 dp  → Antar (Prime Minister)
ring 5 R           46 dp  → Maha (King)
cap               round
start angle       -90°  (12 o'clock)
direction         clockwise
track             planetColor @ 12% opacity
fill              planetColor, linear sweep gradient 100% → 78% luminance
```

**Animation.** On every mount: all five rings sweep 0 → current progress. Stagger **80ms** from outer inward, duration **900ms**, curve `easeOutCubic`. A ring at >97% gets a 3px overshoot-and-settle so "almost done" is felt. Total choreography under 1.3s — past that it stops reading as "loading my life" and starts reading as slow.

**Saturn's star field.** Saturn's ring is near-black on a near-black background, which is a contrast failure unless the stars do the work.
- *Flutter:* GLSL fragment shader via `FragmentProgram` (Impeller), 40 stars, per-star phase offset, twinkle at 0.4–1.2Hz, driven by one `Ticker` at 30fps (not 60 — nobody perceives the difference on a twinkle and it halves the GPU cost). Plus a 1px `#3A3A42` outer stroke so the ring has an edge even when stars are dim.
- *Web:* single `<canvas>` overlay clipped to the ring annulus, same star algorithm in TS, `requestAnimationFrame`. Falls back to a static SVG star sprite when `prefers-reduced-motion` is set.
- *iOS-native widget:* `CAEmitterLayer` for the widget/Live Activity variant, since WidgetKit can't run a Flutter shader.

**Moon's off-white** on a `#17181C` surface reads as "no ring" at a glance — give it a `#0E0F12` inner shadow ring so it appears to sit *in* the surface.

**Interaction.** Hit-testing an annulus: compute `distance(touch, center)` and check against `[R - stroke/2 - slop, R + stroke/2 + slop]`. Do **not** use rectangular child hit-boxes. On tap: haptic `mediumImpact`, ring pulses scale 1.0→1.04→1.0 over 180ms, then push Detail.

**Web.** SVG `<circle>` per ring with `stroke-dasharray`/`stroke-dashoffset` animated via rAF (not CSS transitions — you need to interrupt mid-flight when the user scrubs). `pointer-events: stroke` gives you annulus hit-testing for free. Wrap each in `<g role="button" tabindex="0" aria-label="...">` so keyboard users can reach all five.
**Android.** `CustomPainter` + `RepaintBoundary` per ring so a twinkling Saturn doesn't invalidate the other four layers. Watch out: Android's `Choreographer` will drop frames if you rebuild the widget tree — animate with `AnimatedBuilder` reading a `ValueNotifier`, never `setState`.
**iOS.** Same Flutter code; additionally ship a **WidgetKit** small/medium widget and a **Live Activity** for the Messenger countdown — Dynamic Island showing the current Pranadasha planet glyph and time remaining is the single best platform-native feature this product can have, and Android has no equivalent.

### 4.3 Timeline

**Concept.** The royal court metaphor solves a real comprehension problem: five nested time-scales is genuinely confusing, but "the King reigns for years, the Messenger arrives for hours" is instantly legible and — importantly — conveys *authority weighting*. A Messenger's mood matters less than a King's.

**Structure, top to bottom:**
1. Header: "Timeline" + subhead "Tap any ring or character below."
2. Ring stack (§4.2), center shows the current King's glyph + planet name.
3. **The merged court table** — one table, five rows, columns: Role · Planet (colored dot + glyph) · Reign duration note · Time left (brass `#C8A44D` pill). Sorted fastest-first to match ring order outward-in. Each row is the tap target twin of its ring.
4. **Biggest Change Ahead** card (§4.4).

**Data.** Fully client-computed from the cached chart. Zero network on this screen after first load — this is why the engine ships in the client.

**Logic — "time left" formatting ladder.** `< 60s` → seconds; `< 60m` → "42m"; `< 48h` → "31h 12m"; `< 60d` → "18d"; `< 24mo` → "1y 4m"; else "6y 2m". Ticking `Timer.periodic(1s)` only for rows under 48h; everything else recomputes on resume. Don't run a 1Hz timer to update a 6-year countdown.

**Web.** Rings pinned left in a sticky column, court table right, on ≥1024px — a genuine two-pane layout, not a stretched phone. Below 1024px it collapses to the mobile stack. Also: `/timeline?at=2027-03-14` is a real URL that renders the state at that date, which makes the whole screen shareable and screenshot-able for marketing.
**Android.** Predictive-back gesture support (Android 14+) so the Detail sheet peels back under the user's thumb. `Material` bottom sheet for Detail.
**iOS.** Detail as a `CupertinoSheetRoute`-style sheet with a grabber, resizable to medium/large detents. Scroll-linked ring shrink into the nav bar (large title collapse behavior) — iOS users read that as native.

### 4.4 Handover / "Biggest Change Ahead"

**Concept.** A countdown creates a return reason. The pipeline animation makes an abstract transition physical.

**Logic.** Scan forward for the next boundary at Pratyantardasha level *or higher* (Prana boundaries are every few hours — counting down to those is noise), pick the highest-authority one within 180 days, and show it. Rank: King change > PM change > Governor change.

**Render.** A horizontal rail: left node = outgoing planet (dimmed, checkmark), animated dashed line with a travelling pulse, right node = incoming planet (pulsing glow). Live `HH:MM:SS` when under 48h, otherwise `Xd Yh`. One line of text only. No icon pair, no explanation paragraph — the card earns its space by being a clock.

### 4.5 Planner + Plan Composer

**Concept.** The Timeline tells you *what time it is*. The Planner tells you *what to do about it*. The whole value proposition is: your dasha sequence over the next N months is a fixed, known terrain, so sequence your effort to match the terrain instead of fighting it.

**Questionnaire flow:** Category → current stage (free text + chips) → target horizon (numeric + unit) → reminder channels. Eight categories: Love & Relationship, Job Search, Promotion, Startup / Business, Health & Recovery, Buying (Home / Vehicle), **Education & Exams**, **Debt & Money Repair**. The last two are the additions — both are enormous real-world planning categories in this market and both map cleanly onto dasha logic (Jupiter/Mercury for exams, Saturn/Ketu for debt discipline).

**Logic — Plan Composer, deterministic:**

```
1. window = [today, today + horizon]
2. segments = engine.periodsOverlapping(window, level=auto)
      level chosen so 3 ≤ segmentCount ≤ 7  — this is why "number of
      stages depends on the dashas in your window," exactly as specced.
3. for each segment:
     score = suitability[category][planet]              // -2..+2, DB table
             + relationshipModifier(parentPlanet, planet)  // friend/enemy matrix
             + houseLordshipModifier(chart, planet)
4. assign stage archetype by score:
     +2/+1 → PUSH   (launch, apply, propose, sign)
      0    → BUILD  (prepare, learn, network, save)
     -1/-2 → HOLD   (consolidate, repair, rest, audit)
5. render task verbs from category × archetype × planet template table
6. persist plan + stages + tasks with engineVersion + rulesVersion
```

The scoring tables live in Postgres, are versioned, and are editable by an astrologer in the admin console (M15). Engineers do not encode astrology in code.

**Stage tabs, not a numbered list.** Each stage is a full-width tab card tinted to a **lighter shade of that stage's planet colour** — spec it as `HSL(planetHue, planetSat × 0.55, planetLight + 22%)` at 14% fill with the pure planet colour as a 2px left border. Heading text is task-specific per stage (never "Phase 3"): "Put your name in front of people," "Close the loops you left open," "Say the thing you've been rehearsing."

**Pipeline rail** replaces the list: completed stages get a filled node + strikethrough + brass check; current stage gets a breathing outer glow (1.8s ease-in-out, opacity 0.35→0.8) *and* a travelling gradient along its inbound connector; future stages are hollow 1px nodes. Vertical on mobile, horizontal on web ≥1024px.

**Plan mutation.** "Add an event that changed things" → creates a `plan_events` row → Composer re-runs → produces a **diff view**: which stages moved, which tasks changed, what got dropped. User accepts or rejects. Every accepted replan writes a new `plan_revisions` row; nothing is destroyed. Delete is soft, 30-day recovery.

**Web.** Plan builder as a multi-step form with a persistent right-hand live preview of the pipeline updating as they answer. Desktop's extra pixels should show consequence, not just more fields.
**Android.** Stage tabs in a `PageView` with `TabBar`; system share sheet for plan export. Home-screen widget via **Jetpack Glance** through a platform channel showing current stage + task.
**iOS.** Same, plus **App Intents** so "Hey Siri, what's my stage today" works, and the plan's current task can appear in a Lock Screen widget.

### 4.6 Interpretation (Dasha Detail + Task Detail)

**Concept.** Same component, two data sources. Structure: big period heading → date range with uncertainty → **"In the Kingdom"** metaphor paragraph → two tabs, **Advantage** / **Obstacle**.

**The content problem nobody has costed yet.** Nine planets at five levels isn't 45 pieces of copy — the *interesting* content is combinatorial. Two levels = 81 pairs. Five levels = 59,049. You cannot hand-write that, and you shouldn't generate it live per-request either (nondeterministic, expensive, unauditable).

**Solution — composable content, cached:**

```
interpretation = base[planet][level]                       45 rows, hand-written
               + relation[parentPlanet][planet]            81 rows, hand-written
               + houseFlavour[planetHouseLordship]         12 rows
               + assembled by a template engine
               + optional LLM smoothing pass (batch, offline)
               + human approval flag
cache key: sha256(planet, level, parentPlanet, relationClass, chartFeatureHash, contentVersion)
```

So ~140 authored fragments cover the full space, assembled deterministically. The LLM smoothing runs as an offline batch job over the top-N most-hit combinations, results are reviewed by an astrologer in the admin console, and approved output is frozen into `interpretations`. Users never see unreviewed generated astrology.

**Task Detail** reuses the identical component: heading is the task title from the pipeline, "In the Kingdom" becomes the stage's terrain description, Advantage/Obstacle are drawn from `category × archetype × planet` copy rather than `planet × level`.

**Web.** Tabs are real anchored routes (`/timeline/antardasha/venus#obstacle`) so they're linkable and back-button-correct. Content is SSR'd → indexable → this is your organic acquisition channel.
**Android.** `TabBar` + `TabBarView`, swipeable.
**iOS.** Segmented control (`CupertinoSegmentedControl`) — iOS convention is segmented, not underlined tabs, and swipe-between-tabs conflicts with the back gesture, so disable horizontal swipe on iOS and keep it on Android.

### 4.7 Mentor

**Concept.** A chat that knows the user's chart. ChatGPT-shaped because that shape is now universally understood: thread list, new-chat button, resumable context.

**Architecture.**

```
Client ──SSE──► /v1/mentor/threads/:id/messages  (NestJS)
                        │
                        ├─ load thread history (last N, summarized beyond)
                        ├─ inject system prompt + chart facts block
                        ├─ Anthropic Messages API, streaming, tool_use loop
                        │     tools: get_dasha_stack(at)
                        │            get_period_range(level, from, to)
                        │            get_natal_chart()
                        │            get_transits(date)
                        │            get_user_plans()
                        │            search_knowledge_base(query)   → pgvector
                        ├─ tools execute against own engine + partner API adapter
                        └─ persist assistant message + tool trace
```

**Model routing** (verified against current Claude Platform docs):

| Path | Model ID | Why |
|---|---|---|
| Default conversation | `claude-sonnet-5` | Best cost/quality for the 80% case |
| Deep multi-step readings, plan reasoning | `claude-opus-5` | Docs recommend Opus 5 as the starting point for complex agentic and enterprise work |
| Maximum-capability tier (optional premium) | `claude-fable-5` | Currently the most capable widely released model |
| Thread titling, intent classification, moderation pre-check | `claude-haiku-4-5-20251001` | Cheap, fast, high-volume |

Pin exact model IDs in config, never hardcode; route via a `MentorModelPolicy` table so you can shift tiers without a deploy. Note IDs from the 4.6 generation onward are fixed snapshots, not evergreen pointers — so upgrades are a deliberate config change plus a prompt-regression run.

**Guardrails that are non-negotiable:**
- System prompt forbids medical diagnosis, prescription, legal advice, and specific financial/investment directives. Route those to a fixed "talk to a professional" response, with the astrological framing still offered.
- **The model never states a date or duration it didn't get from a tool call.** Enforced in the prompt *and* checked post-hoc by a validator that flags date-like tokens in responses with no preceding tool result. Log violations; they're your prompt-regression signal.
- Prompt-injection surface: tool results come from your own systems (low risk), but user-pasted text is untrusted — wrap it in delimiters and instruct the model to treat it as data.
- Per-user token budget with a soft cap → degrade to Haiku, hard cap → paywall. Redis sliding window.
- Streaming responses are persisted incrementally so a dropped connection doesn't lose the answer.

**Threads UI.** Not a full-page navigation — a **floating panel over ~90% of the Mentor surface**, as specced: slide-in from left, scrim behind, thread list with auto-generated titles, search, pin, delete. `Cmd/Ctrl+K` on web.

**Web.** Sidebar is persistent at ≥1280px (ChatGPT desktop pattern), overlay below that. Markdown rendering with a hard-sanitized pipeline (`rehype-sanitize`).
**Android.** Overlay panel via `showModalBottomSheet` variant or a custom `SlideTransition`; keyboard-aware scroll with `resizeToAvoidBottomInset`.
**iOS.** Same panel; watch the keyboard-avoidance + safe-area interaction, and disable the interactive pop gesture while the panel is open or you'll get gesture conflicts.

---

## 5. How the same product looks and behaves on each platform

### 5.1 Website

**Job:** acquisition, SEO, sharing, desktop-comfortable planning. Not a phone in a browser.

- **Layout.** ≥1280px: left icon rail (Planner / Timeline / Mentor / Account), 12-column content grid. Timeline becomes two-pane (rings sticky left, court table right). Planner becomes builder-left / live-pipeline-preview-right. Mentor becomes persistent-sidebar + chat column, max text measure 68ch.
- **Neumorphism on the web** is where dark neumorphism most often falls apart, because monitors are calibrated all over the place. Implementation: base `#17181C`, raised = `box-shadow: -6px -6px 16px rgba(255,255,255,.035), 8px 8px 20px rgba(0,0,0,.55)`, pressed = the same values as `inset`. Radius 24px. **No borders.** But bump all body text to `#E8E9EE` (≥7:1 on base) because soft shadows steal perceived contrast and the low-contrast look must never reach the text layer.
- **Rendering strategy.** Marketing + interpretation content pages are static/ISR. Authenticated app shell is client-rendered with server-fetched initial state. Chart-dependent pages are dynamic, no cache.
- **Share pages.** `/s/:token` renders a public, chart-anonymized "my current court" card, with an OG image generated at the edge (`@vercel/og`) showing the ring stack. This is the growth loop; build it in phase 2, not phase 5.
- **PWA.** Installable, service worker caches the engine bundle + tokens + last chart so Timeline works offline. Web Push via VAPID (works on iOS 16.4+ only when installed to home screen — plan email as the reliable web channel).
- **Engine reuse.** `dart compile js -O2` the engine package → ~40KB gzipped ESM with hand-written `.d.ts`. Same golden vectors run in Vitest against the JS build. This is the trick that keeps one engine across three platforms without a port.

### 5.2 Android

**Job:** the volume platform in this market. Must be excellent on a 3-year-old ₹15,000 device.

- Flutter, Material 3 widgets, **`dynamicColor` explicitly disabled** — Material You would repaint your planet palette, and the palette is the product's semantics.
- Edge-to-edge with `SystemUiOverlayStyle` transparent nav; handle `WindowInsets` properly for gesture-nav devices.
- **Notifications:** FCM for server-triggered, `flutter_local_notifications` + WorkManager for locally-scheduled phase shifts. Android 13+ requires runtime `POST_NOTIFICATIONS`; ask for it *after* the user opts into reminders in the Planner, never on first launch. Android 14 restricts exact alarms — you do **not** qualify for `SCHEDULE_EXACT_ALARM`, so use inexact windows and accept ±15min, which is fine for a dasha shift.
- **Widget:** Jetpack Glance widget (native Kotlin, driven by a shared prefs bridge the Flutter side writes to) showing current King + Messenger countdown. Updated by a periodic WorkManager job, not push.
- **Performance budget:** cold start < 2.2s on a Snapdragon 680; ring animation ≥ 55fps p95. Enable Impeller, ship split-per-ABI app bundles, `--split-debug-info` + obfuscation.
- Billing: Google Play Billing 7 via `in_app_purchase`, server-side receipt validation, Play Data Safety form declaring birth data collection.
- Testing matrix: Firebase Test Lab, 6 device profiles, including one 720p and one foldable.

### 5.3 iOS

**Job:** revenue per user, and the place where the product can feel *alive* rather than just present.

- Flutter with Cupertino overrides where convention demands: segmented controls over tabs, wheel pickers over keypads, sheet detents with grabbers, swipe-back everywhere.
- **Live Activity + Dynamic Island** for the current Pranadasha (Messenger): planet glyph, name, `Text(timerInterval:)` auto-counting remaining time. Written in SwiftUI/ActivityKit, started/updated from Flutter over a `MethodChannel`, refreshed via APNs push-to-start-and-update tokens. Nothing else in the product communicates "your life has a clock in it" this well.
- **WidgetKit** small (current King), medium (all five roles), Lock Screen circular (Messenger progress arc). `TimelineProvider` returns pre-computed entries at each upcoming boundary — you can compute the entire day's entry set in one pass, which is exactly what WidgetKit wants.
- **Sign in with Apple is mandatory** if you ship any third-party social login (App Review guideline 4.8). Build it from day one.
- **App Tracking Transparency** if you use any attribution SDK; otherwise skip the prompt entirely and keep the install flow clean.
- StoreKit 2 for subscriptions, `Transaction.currentEntitlements` as the client truth, server notifications V2 for the authoritative state.
- Core Haptics: `selection` on ring scrub, `medium` on ring tap, `success` pattern on completing a plan stage. Restrained.
- **App Review risk:** astrology apps get scrutinized under 4.3 (spam/duplication) and occasionally for "objectionable" fortune-telling claims. Mitigation: the Mentor's utility and the planning engine make this clearly not a template app; include an explicit "for reflection, not prediction" disclaimer in-app and in the listing.

---

## 6. The 21 modules and concerns that are missing from the current plan

These are ordered by *when they'll hurt you*, not importance.

### M1 — Auth & Identity
Phone-OTP-first (this market), plus Google, plus Apple (required on iOS). Don't hand-roll: **Ory Kratos** self-hosted or Auth0. Access token 15min JWT, refresh token 30d, rotating with reuse detection. Device registry table so users can see and revoke sessions. Rate-limit OTP by phone *and* IP *and* device, with exponential backoff — SMS pumping fraud is real and will cost you thousands in a weekend. Anonymous-first onboarding is worth considering: let users compute a chart before signup, then link the guest ID at signup. It typically lifts completion 20–35%.

### M2 — Account & Multi-Profile
Users will want charts for spouse, children, parents. Model it as `users 1—n profiles` from day one; retrofitting this is a schema migration plus a UI rewrite. Account page needs: profile switcher, edit birth data (with an explicit "this will recompute everything" confirmation + audit row), subscription status, notification preferences per channel, language, data export, delete account, legal links, app version + build for support triage.

### M3 — Database Architecture
See §7. The headline decision: **do not persist Sukshma or Prana periods.** Full 5-level expansion of a 120-year cycle is 9⁵ = 59,049 rows *per chart*. At a million charts that's 59 billion rows for data the client can recompute in under 3ms. Persist levels 1–3 for a rolling ±18-month window only, for notification scheduling and analytics. Everything deeper is computed.

### M4 — Content Management & Astrologer Console
The 140 authored fragments (§4.6) need an authoring tool with draft/review/publish, versioning, per-locale variants, and a preview that renders against a real chart. Build it as a Next.js admin app on the same DB. Without this, every copy change is a code deploy and your astrologer becomes a Jira ticket.

### M5 — Notification & Scheduling Engine
The hardest backend module. Requirements: schedule against *the user's* timezone; respect quiet hours (default 22:00–08:00 local); **default reminders to Pratyantardasha level and above** (Prana shifts every few hours — enabling those by default would get you uninstalled in a day); dedupe with idempotency keys; batch same-day notices into one digest; cancel and reschedule the entire future set when a DOB is edited or a plan is revised. Temporal workflows per plan, per profile. Channels: FCM/APNs, transactional email (Resend/SES), SMS (Twilio/MSG91) — SMS is expensive and should be paid-tier only.

### M6 — Entitlements & Monetization
Free: Timeline to Governor depth, 1 plan, 10 Mentor messages/month. Paid: full 5-level depth, unlimited plans, Opus-tier Mentor, SMS reminders, widgets. Implement with **RevenueCat** unless you have a reason not to — it collapses StoreKit 2, Play Billing, and Stripe (web) into one entitlement webhook, and cross-platform subscription reconciliation is a genuinely nasty problem to own. An `entitlements` table is the single authority the API checks; clients never decide.

### M7 — Privacy, Consent & Compliance
Birth date + exact time + birth place is a near-perfect identity fingerprint, and in an astrological context it's arguably belief-adjacent data — treat it as **special category under GDPR Art. 9** and as sensitive personal data under India's **DPDP Act 2023**. Concretely: explicit consent captured with a versioned consent ledger row; encryption at rest at the column level for birth fields (pgcrypto or app-level envelope encryption with KMS); DSAR endpoints for export and erasure with a 30-day SLA; a data map document; DPA with every subprocessor including Anthropic; retention policy (delete inactive accounts after 24 months with notice). Also: **age gate at 13+ / 18+ per your ToS**, because astrology apps attract teens and children's data is a different regulatory universe.

### M8 — Design Token Pipeline
Your Figma work is the design source of truth; make it literal. Figma Variables → export JSON → **Style Dictionary** → generates `tokens.dart`, `tokens.css`, `Tokens.swift`, `Tokens.kt`. The nine planet colours, the neumorphic shadow recipes, radii, type ramp, motion durations — all one file. A designer changing Venus pink should be a token PR, not three tickets.

### M9 — Accessibility
Currently a colour-coded, animation-dependent, dark-on-dark interface — i.e. three simultaneous accessibility failures. Fixes: every ring carries a semantic label (`"Messenger, Moon, 62 percent through, 4 hours remaining"`); every planet gets a **glyph and a distinct dash pattern** so colour is never the sole channel (~8% of your male users cannot reliably separate Mars red from Mercury green); honour `prefers-reduced-motion` / `disableAnimations` by rendering final ring states instantly; support Dynamic Type / `textScaleFactor` up to 200% without clipping — which means no fixed-height cards anywhere; contrast-audit the neumorphic surfaces and raise text to AA minimum. Target WCAG 2.2 AA. This is also a legal requirement for the web build in the EU (EAA, June 2025).

### M10 — Localization
English + Hindi at launch; Tamil, Telugu, Kannada, Marathi, Bengali next. Non-obvious problems: dasha and planet names have both Sanskrit and vernacular forms and users are opinionated about which; date formats and numeral systems vary; **string length grows 20–40% in Devanagari and Tamil**, which breaks the ring-centre labels and the court table unless designed for it. Use ICU messages, keep a locked glossary for the ~60 domain terms, and never concatenate translated fragments. Budget for the fact that your interpretation content (M4) multiplies by locale count.

### M11 — Analytics & Event Taxonomy
Define the schema before writing the first `track()`. Core events: `onboarding_step_completed{step}`, `chart_computed{accuracy}`, `ring_tapped{level,planet}`, `interpretation_tab_viewed{tab}`, `plan_created{category,horizon,stageCount}`, `plan_stage_completed`, `plan_replanned{trigger}`, `mentor_message_sent{model,tokens}`, `reminder_delivered/opened{channel,level}`, `paywall_viewed/converted{placement}`. Tool: PostHog (self-hostable, session replay, feature flags in one) or Amplitude. Hard rule: **no birth data in analytics payloads, ever** — send `accuracy` and `hasChart`, never the date.

### M12 — Feature Flags & Remote Config
Flag every risky surface: the Saturn shader, the Live Activity, model routing, paywall variants, reminder defaults. PostHog flags or Unleash. Non-negotiable for mobile because a bad ring animation shipped to the App Store takes 48h to fix without a kill switch.

### M13 — Observability
OpenTelemetry traces end-to-end (client span → BFF → engine svc → partner API → Anthropic). Sentry for web + Flutter with source maps and dSYMs uploaded in CI. Structured JSON logs with a trace ID, **birth data redacted at the logger**. Dashboards: p95 chart computation, partner API error rate and latency, Mentor tokens/day and cost/user, notification delivery rate by channel, engine-vector CI status. SLOs: 99.5% API availability, p95 chart compute < 400ms, Mentor first-token < 1.5s.

### M14 — Testing Strategy
Layered: (a) golden vectors for the engine, run in Dart *and* JS; (b) property tests — sub-periods sum exactly to parent, no gaps, no overlaps, monotonic boundaries, idempotent recomputation; (c) golden *image* tests for the ring stack via `golden_toolkit` (Flutter) and Playwright screenshots (web) so a shader tweak can't silently break geometry; (d) contract tests (Pact) between clients and BFF, and between BFF and the partner API adapter — the partner will change a field name without telling you; (e) E2E with Maestro (mobile) and Playwright (web) over the five critical flows; (f) LLM eval suite for the Mentor — a fixture set of ~120 questions with assertions on tool-call correctness and date-hallucination absence, run on every prompt or model change.

### M15 — Admin & Support Back-Office
Astrologer content console (M4) plus: user lookup, a **chart debugger** that shows raw partner-API response, engine inputs, computed boundaries and engine version side by side (you will need this weekly), subscription/refund tooling, notification resend, feature-flag panel, and an audit log of every admin action. Role-based: support / content / engineering / admin.

### M16 — Offline-First Sync
Timeline must work fully offline (engine is local). Plans are the sync problem. Implement an **outbox pattern**: local mutations queue with client-generated ULIDs, replayed on reconnect; server is authoritative on conflict with a last-writer-wins field-level merge, and any real conflict surfaces as a "your plan changed on another device" prompt rather than silent data loss. Drift (SQLite) locally, `updated_at` + version columns server-side.

### M17 — Security Hardening
API gateway with WAF; TLS 1.3; certificate pinning on mobile (with a backup pin and a remote kill switch, or you'll brick the app on cert rotation); root/jailbreak detection as signal, not a hard block; secrets in AWS Secrets Manager / Vault with rotation; **no API keys in the client, ever** — the Anthropic call is server-side only; column encryption for birth fields; rate limits per user/IP/endpoint; OWASP ASVS L2 for the API and MASVS-L1 for mobile; an annual third-party pentest once you're on paid plans.

### M18 — CI/CD & Release Engineering
GitHub Actions: lint → unit → engine vectors → golden images → build. Codemagic for signed iOS/Android artifacts, Fastlane for metadata and screenshots. Web deploys on merge to main. Mobile ships to internal → closed beta (TestFlight / Play internal testing) → **staged rollout at 5% / 20% / 50% / 100%** gated on Crashlytics crash-free rate ≥ 99.6%. Trunk-based, short-lived branches, semantic release, and a documented rollback: for mobile that's a feature flag, not a new build, which is exactly why M12 exists.

### M19 — Engine Versioning & Data Migration
When the engine changes: bump `engineVersion`, run a background recompute over cached periods, diff old vs new boundaries, and for any user whose boundaries shifted more than 6 hours, invalidate their cached interpretations, reschedule their notifications, and show a one-time in-app note. Store `engineVersion` and `rulesVersion` on every plan so an old plan can be explained by the logic that produced it. This module is invisible until the first math fix, and then it's the difference between a quiet patch and a support fire.

### M20 — Sharing, Deep Links & Referral
Universal Links (iOS, AASA file) + App Links (Android, `assetlinks.json`) + web fallback, all on one link format `vimshottari.app/s/:token` so a shared link opens the app if installed and the web card if not. Deferred deep linking for installs (Branch, or roll it with a fingerprint match). Share cards: server-rendered PNG of the ring stack with a caption. Referral: give both sides a month of paid; track with a `referrals` table, not a marketing tool.

### M21 — Legal, Disclaimers & Content Policy
A visible "for reflection and planning, not prediction; not medical, legal, or financial advice" disclaimer in onboarding, in the Mentor's first message of every thread, and in the footer. Terms, Privacy Policy, refund policy, subprocessor list. Mentor refusal policy documented and tested (M14e). Store-listing copy avoiding health or income claims — the most common rejection reason for apps in this category. And a moderation path: if a user's Mentor conversation indicates crisis or self-harm risk, the response must surface region-appropriate support resources and stop giving astrological framing. Specify that behaviour explicitly in the system prompt and test it.

---

## 7. Database architecture

PostgreSQL 16. Names are illustrative but the shapes are the recommendation.

```sql
-- identity
users(id ulid pk, phone_e164 unique, email unique, created_at, deleted_at,
      locale, tz_id, referral_code)
auth_identities(id, user_id fk, provider enum(phone|google|apple), subject, unique(provider,subject))
devices(id, user_id fk, platform, push_token, app_version, last_seen_at, revoked_at)

-- the sensitive core (column-encrypted)
profiles(id, user_id fk, label, relation enum(self|partner|child|other),
         birth_date_enc bytea, birth_time_enc bytea,
         birth_time_accuracy enum(exact|near_minute|within_15m|within_hour|unknown),
         place_id, lat numeric(9,6), lng numeric(9,6),
         tz_id text, utc_offset_used_minutes int,
         ayanamsa enum default 'lahiri',
         created_at, updated_at)
profile_audit(id, profile_id, changed_field, old_hash, new_hash, actor, at)

charts(id, profile_id fk unique, provider enum, provider_response jsonb,
       moon_long_sidereal numeric(12,8), engine_version text,
       computed_at, PRIMARY KEY(id))

-- periods: levels 1-3 only, rolling window
dasha_periods(
  id, profile_id fk, level smallint check (level between 1 and 3),
  planet enum(sun..ketu), parent_id fk null,
  span tstzrange NOT NULL,
  engine_version text,
  EXCLUDE USING gist (profile_id WITH =, level WITH =, span WITH &&)
) PARTITION BY HASH (profile_id);
-- the EXCLUDE constraint makes overlapping periods physically impossible.
-- Levels 4-5 are never stored. Computed client-side, sub-3ms.

-- content
content_fragments(id, kind enum(base|relation|house|task), keys jsonb, locale,
                  body_md text, version int, status enum(draft|review|published),
                  author_id, published_at)
interpretations(cache_key text pk, locale, level, planet, parent_planet,
                body_md, content_version, engine_version, approved_by, created_at)

-- rules (astrologer-editable)
suitability(category enum, planet enum, score smallint, rules_version int,
            PRIMARY KEY(category, planet, rules_version))
planet_relations(a enum, b enum, class enum(friend|neutral|enemy), rules_version)
stage_copy(category, archetype enum(push|build|hold), planet, locale,
           heading text, tasks jsonb, rules_version)

-- planner
plans(id, profile_id fk, category, current_stage_text, horizon_days int,
      starts_on date, ends_on date, status enum(active|done|archived),
      engine_version, rules_version, revision int, deleted_at)
plan_stages(id, plan_id fk, ord smallint, level smallint, planet,
            span tstzrange, archetype, heading, tint_hsl text)
plan_tasks(id, stage_id fk, ord, body, done_at null)
plan_events(id, plan_id fk, occurred_on date, body, applied_revision int null)
plan_revisions(id, plan_id fk, revision int, diff jsonb, created_at, accepted bool)

-- notifications
reminder_prefs(user_id pk, in_app bool, email bool, sms bool,
               min_level smallint default 3, quiet_start time, quiet_end time)
scheduled_notifications(id, user_id, profile_id, kind, level, channel,
                        fire_at timestamptz, idempotency_key unique,
                        status enum(pending|sent|failed|cancelled), workflow_id)
notification_log(id, user_id, channel, kind, sent_at, opened_at, provider_id)

-- mentor
threads(id, user_id fk, title, model_policy, pinned bool, archived_at)
messages(id, thread_id fk, role enum(user|assistant|system), content jsonb,
         model_id text, input_tokens int, output_tokens int, created_at)
tool_calls(id, message_id fk, tool_name, input jsonb, output jsonb, latency_ms, ok bool)
kb_chunks(id, source, locale, body text, embedding vector(1024))  -- pgvector, HNSW index

-- commerce & compliance
subscriptions(id, user_id, store enum(apple|google|stripe), product_id,
              status, current_period_end, revenuecat_id)
entitlements(user_id pk, tier enum(free|plus|pro), depth_limit smallint,
             mentor_monthly_quota int, valid_until)
consents(id, user_id, purpose, policy_version, granted bool, at, ip_hash)
audit_log(id, actor_id, actor_type, action, target, meta jsonb, at)
feature_flags(key, rules jsonb, updated_at)
```

**Redis:** session cache, Mentor rate-limit windows, computed-chart hot cache (TTL 1h), place-autocomplete result cache, Live Activity token registry.

**Backups:** PITR with 7-day window, nightly logical dump to cold storage, quarterly **restore drill** — an untested backup is not a backup.

---

## 8. API surface (BFF, versioned `/v1`)

```
POST   /auth/otp/request              {phone}
POST   /auth/otp/verify               → {access, refresh, user}
POST   /auth/oauth/:provider
POST   /auth/refresh
DELETE /auth/sessions/:deviceId

GET    /me                            → user + entitlements + prefs
PATCH  /me
DELETE /me                            → DSAR erasure workflow
GET    /me/export                     → signed URL, async

GET    /profiles
POST   /profiles                      {birthDate,birthTime,accuracy,placeId}
PATCH  /profiles/:id                  → triggers recompute + reschedule
GET    /places/autocomplete?q=&session=

GET    /profiles/:id/chart
GET    /profiles/:id/dashas?at=&depth= → server mirror of client engine (parity check)
GET    /profiles/:id/handover          → next significant boundary

GET    /interpretations?level=&planet=&parent=&locale=

POST   /plans                          {profileId,category,stage,horizonDays,channels}
GET    /plans  |  GET /plans/:id
PATCH  /plans/:id/tasks/:taskId        {done}
POST   /plans/:id/events               {occurredOn,body} → 202 + revision preview
POST   /plans/:id/revisions/:n/accept
DELETE /plans/:id

GET    /mentor/threads
POST   /mentor/threads
POST   /mentor/threads/:id/messages    → text/event-stream (SSE)
PATCH  /mentor/threads/:id             {title,pinned,archived}

PATCH  /notifications/prefs
POST   /notifications/test

POST   /share                          → {token,url,ogImageUrl}
GET    /config                         → flags + token version + min supported build
```

`GET /config` on launch returning `minSupportedBuild` gives you a force-upgrade gate. Add it now; you'll need it the first time the engine changes.

---

## 9. Delivery phasing

| Phase | Weeks | Ships |
|---|---|---|
| **0 — Foundations** | 1–3 | Monorepo, token pipeline (M8), engine + golden vectors, CI, DB migrations, partner API adapter |
| **1 — Core loop** | 4–9 | Auth (M1), birth capture, Timeline with rings + court table + handover, Dasha Detail, mobile only |
| **2 — Planner** | 10–15 | Plan Composer, pipeline rail, Task Detail, notification engine (M5), reminder prefs |
| **3 — Mentor** | 16–20 | AI gateway, tool use, threads panel, eval suite, guardrails, token budgets |
| **4 — Web** | 21–25 | Next.js app, SSR interpretation pages, share cards + OG, PWA |
| **5 — Commerce & polish** | 26–30 | Entitlements (M6), paywall, Live Activities + widgets, localization (M10), accessibility audit (M9), admin console (M15) |
| **6 — Hardening** | 31–34 | Pentest, load test, compliance review (M7), staged rollout, launch |

Phase 0 is not negotiable and cannot be compressed. Everything after it is a view onto what Phase 0 produces.

---

## 10. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Partner astrology API changes or dies | Medium | High | Adapter + contract tests + cache raw responses; own the dasha math so you only depend on them for longitudes, which are computable in-house later with Swiss Ephemeris |
| Users enter wrong birth time, blame the app | **High** | High | Accuracy enum, uncertainty rendered in UI, depth degradation, rectification lane (§3, §4.1) |
| Mentor hallucinates a date | Medium | High | Tools-only-for-facts rule + post-hoc date validator + eval suite (M14f) |
| Interpretation content cost/volume underestimated | **High** | Medium | Composable fragments, 140 authored pieces not 59,049 (§4.6) |
| Notification fatigue → uninstalls | High | High | Default min level = Governor, quiet hours, digest batching (M5) |
| Saturn shader jank on low-end Android | Medium | Low | Feature flag, 30fps cap, static fallback |
| App Store rejection (4.3 / claims) | Medium | Medium | Disclaimers, distinctive functionality, careful listing copy (M21) |
| Timezone/DST bug in historical births | Medium | High | Store `utc_offset_used`, golden vectors for DST-transition births |
| AI cost per active user exceeds ARPU | Medium | High | Model routing (Haiku for cheap paths), per-user budgets, Mentor gated to paid above a small free quota |
| Two codebases (Flutter + Next) diverge in behaviour | Medium | Medium | Shared engine via `dart compile js`, shared tokens, shared OpenAPI contracts |

---

## 11. What I'd want decided before writing code

1. **Which market first?** It determines OTP provider, SMS cost model, launch locales, and whether DPDP or GDPR is the primary compliance frame.
2. **Do you own the ephemeris or rent it?** Swiss Ephemeris (AGPL or commercial licence) in-house removes your single biggest external dependency. Worth pricing now.
3. **Free tier depth.** I've proposed Governor (level 3) free, Magistrate + Messenger paid. That's the main monetization lever and it should be a deliberate decision, not a default.
4. **Who writes and signs off the 140 content fragments, and by when?** This is the longest-lead, least-parallelizable item in the whole project and it is not an engineering task.
