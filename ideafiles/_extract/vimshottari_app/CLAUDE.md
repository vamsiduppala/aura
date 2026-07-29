# Vimshottari — project context

Vedic daśā timing app for iOS + Android. Dark neumorphic UI. Four tabs:
**Planner** (default), **Timeline**, **Mentor**, **You**.

Read `docs/copy-spec.md` for every user-facing string and `docs/build-spec.md`
for screen-by-screen behaviour and data origins. Those two are the source of
truth for *what*; this file is the source of truth for *how*.

## Stack

**Flutter.** Chosen for one reason that dominates everything else: the wheel is
the product. `Canvas.drawArc` with `StrokeCap.round` gives the Apple Activity
Ring look natively, and five staggered ring animations plus a breathing halo
plus a crawling connector plus a 1Hz countdown all need to run together at
60fps on mid-range Android. Custom painting with exact control beats a
component library here.

The tradeoff: Flutter has **no native inner shadow**, and this design is
neumorphic — carved wells are half the visual language. Implement `NeuInset` as
a `CustomPainter` that strokes the inverse path with a blur. Do it once,
properly, early. Do not fake it with a border.

If you switch to React Native later, the swap points are the painters in
`lib/widgets/neu/` and `lib/widgets/wheel/`. Everything in `lib/core/` is
portable as-is.

**No ephemeris on device.** The server computes the chart and levels 1–2 and
returns 90 rows. The client computes levels 3–5 by arithmetic. This is why the
whole Timeline works offline and why there's no native C dependency.

## Non-negotiables

These are conclusions already reached and verified. Do not relitigate them
without reading the reasoning in the specs.

1. **Birth-time error propagates and never shrinks.** One minute of error
   offsets *every* boundary in the tree by up to five days; fifteen minutes by
   seventy-five. Full table in `docs/build-spec.md` §1.1.
   → The **Messenger** ring is decorative. Ship it (it's the only thing that
   visibly moves) but never base a notification, a plan stage, or a Mentor
   claim on it. `visibilityFor()` in `vimshottari.dart` enforces the gate;
   respect it everywhere including the AI system prompt.

2. **Ayanāṁśa is frozen per chart.** Lahiri default. Changing it is destructive
   and recalculates everything. Store `engine_version` alongside it.

3. **`kDaysPerYear = 365.2425`.** Client and server must match exactly.

4. **Historical timezones.** Resolve the birth place's UTC offset *on the date
   of birth*, not today's. India ran wartime DST 1942–45. Using the modern
   offset costs up to ten months of drift.

5. **The daśā tree is a pure function** of (birth UTC, moon sidereal longitude,
   ayanāṁśa). Store those inputs, never computed dates, as the source of truth.

6. **Never materialise all five levels.** 9⁵ = 59,049 leaves. Walk down from a
   timestamp in five steps — `courtAt()`.

## Vocabulary — use exactly these words

The royal court replaces the earlier Era/Chapter/Season/Phase/Pulse ladder.
Grep for the old words and delete any survivors.

| Level | Office | Sanskrit | Rules for |
|---|---|---|---|
| 1 | **King** | Mahādaśā | several years — typically 6 to 20 |
| 2 | **Prime Minister** | Antardaśā | months up to a few years — usually 1 to 3 |
| 3 | **Governor** | Pratyantardaśā | weeks to a few months |
| 4 | **Magistrate** | Sūkṣma daśā | days to a few weeks |
| 5 | **Messenger** | Prāṇa daśā | hours to a few days |

Office is primary, planet secondary, Sanskrit tertiary. Detail-page tabs are
**Advantage** / **Obstacle** — never Tailwind/Headwind, never Push/Pause as a
tab (Push/Pause survives only as a state pill on a plan card).

**Banned from the UI:** malefic, benefic, auspicious, inauspicious, remedies,
doshas, cursed, lucky, unlucky, destiny. Say what's happening instead.

## Layout facts

Canvas is 393 × 852 (iPhone 15/16 Pro). Tab bar top at y=762, floating, 24pt
inset. Card width 353 with a 20pt gutter. On Android, drive everything off
`MediaQuery` — do not hardcode 852.

- Rings: outermost = fastest. Stroke **tapers inward-to-outward** so weight
  reads inward and speed reads outward. Geometry in `kWheelTimeline`.
- Ring fill = elapsed / total *for that period*, never absolute time.
- Ring hit-testing: resolve by **nearest ring-centre distance**, not exact
  hit-test. At these strokes exact testing loses ~20% of taps.
- Adjacent rings sharing a planet need a 2pt gap and 85% outer opacity or they
  blur into one band.
- Planet identity never rests on hue alone: hue + icon + motion signature.
  Saturn's stars drift *with* the fill, Rāhu's haze drifts *against* it.

## Stage count is variable

A plan has however many daśā periods fall inside the chosen window — 2 to 9,
never padded to five. `chooseCutLevel()` picks the level that yields 3–6.
Pipeline must render that range without redesign. Exactly 1 period → no
pipeline, a single card: *"One ruler covers this whole window."*

## Figma

File key `mP16YA7x9BH1Ee0qPoSwDN`. Nine screens:

```
01 Planner (Home)      02 New Plan — Step 1     03 Plan Detail
04 Timeline            05 Dasha Detail          06 Mentor
07 Mentor — Threads    09 Timeline — The Court   10 Task Detail
```

Use the Figma MCP (`get_design_context`, `get_screenshot`) to read exact
values, but **prefer `lib/theme/tokens.dart`** — tokens are already extracted
and reconciled. If Figma and tokens disagree, tokens win and Figma is stale.

Motion is *not* in Figma. Halo breathing, connector crawl, chevron crawl,
checkmark draw-in, ring stagger — all specced in `Motion` and in
`docs/copy-spec.md` §4.4.

## Build order

1. **`lib/core/dasha/`** — done and invariant-verified. Before trusting it,
   hand-check three known charts against Jagannatha Hora or similar. Every
   number in the app is downstream of this.
2. **`lib/widgets/neu/`** — `NeuRaised`, `NeuInset`, `NeuPill`. Half the UI.
3. **`lib/widgets/wheel/`** — `WheelPainter` + the staggered load animation.
4. **Onboarding + Timeline** — a complete, shippable app on its own.
5. **Content** — 45 authored blocks (9 planets × 5 offices). Slow, unglamorous,
   blocks everything that reads well.
6. **Planner** — pipeline, generation, Course Correct with the diff view.
7. **Mentor** — tools, state injection, threads, safety pre-check.
8. **Notifications, widget, Live Activity, subscription.**

Ship step 4 to a small group before building step 6. If the Timeline alone
doesn't hold attention for two weeks, the Planner won't rescue it.

## Conventions

- `lib/core/` is pure Dart — no Flutter imports, no I/O, fully unit-tested.
- All times stored and computed in **UTC**; convert to local only at render.
- "Time left" renders in the user's *current* timezone; boundaries never move.
- Offline-first: Timeline and Planner read from local cache and never block on
  network. Mentor is the only tab allowed to require connectivity.
- Every ring, row and pill needs a semantics label. Wheel example:
  *"Prime Minister ring. Venus. 62 percent elapsed. 1 year 2 months remaining."*
- Never log or send birth date/time/place to analytics or crash reporting. It's
  effectively identifying data.

## Things to get right that are easy to miss

- **Turn while the app is open** — detect boundary crossing on the 60s tick and
  play the colour bleed. Don't let values change silently.
- **Cold-launch deep links** — `vim://plan/{id}/stage/{n}`,
  `vim://timeline/office/{level}`. Most commonly broken path in any app.
- **Live Activity / Dynamic Island** for the handover countdown. Probably the
  best retention feature available here and roughly three days of work.
- **Multiple charts** (spouse, child, parent). Cheapest paid tier you'll build.
- Test airplane mode before every release.
