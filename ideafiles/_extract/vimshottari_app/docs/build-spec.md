# Vimshottari — A→Z Build Specification

Companion to the copy spec. That one says *what the words are*. This one says *what happens when you touch it, and where every number on screen came from*.

---

## 0. How to read this

**Data origin codes.** Every value on every screen is tagged with where it comes from. If you can't tag it, you don't know how to build it yet.

| Code | Source | Notes |
|---|---|---|
| `USER` | Typed or selected by the person | The only truly authoritative input |
| `DEVICE` | The phone | Clock, current timezone, locale, push token, biometrics |
| `GEO` | Geocoding + historical timezone service | Birth place → lat/lon → tz offset *on the date of birth* |
| `EPH` | Ephemeris engine (Swiss Ephemeris) | Planetary positions at a moment |
| `TREE` | Computed daśā tree | Derived from `EPH`. Deterministic — same inputs, same output, forever |
| `CONTENT` | Authored interpretation library | Human-written, versioned, shipped with the app |
| `AI` | Model-generated at runtime | Mentor answers, plan stage wording, personalised interpretation |
| `SRV` | Your backend | Accounts, plans, threads, subscriptions, schedules |
| `LOCAL` | On-device cache/DB | Everything the app needs to run offline |

**A rule that saves you months:** `TREE` is a pure function of `(birth datetime UTC, lat, lon, ayanāṁśa)`. Never store computed daśā dates as the source of truth — store the four inputs and recompute. Otherwise a bug fix in the engine leaves you with millions of stale rows you can't distinguish from good ones.

---

## 1. Two findings that change your architecture

### 1.1 Birth-time error does not stay small

The Moon crosses one nakṣatra in **24.3 hours**. The fraction of that nakṣatra already traversed at birth sets the *balance* of the first mahādaśā — and every boundary in the entire 120-year tree is offset by that same amount. The error does not average out. It never shrinks.

| Birth-time uncertainty | Shift in every boundary (Venus 20y start) | (Sun 6y start) |
|---|---|---|
| ± 1 minute | ± 5.0 days | ± 1.5 days |
| ± 4 minutes | ± 20 days | ± 6 days |
| ± 15 minutes | ± 75 days | ± 23 days |
| ± 30 minutes | ± 150 days | ± 45 days |
| ± 1 hour | ± 301 days | ± 90 days |

**What this means for the product:**

- The **Messenger** (prāṇa, 20 min – 5.5 days) is *never* trustworthy from a self-reported birth time. Even a to-the-minute certificate carries ±5 days of drift, which is longer than the period itself. Ship the ring — it's the thing that visibly moves and it's genuinely beautiful — but label it honestly and never build a notification, a plan stage, or a Mentor claim on it.
- The **Magistrate** (sūkṣma, days–weeks) needs birth time to ~1 minute to mean anything.
- The **Governor** (pratyantara, weeks–months) needs ~15 minutes.
- **Prime Minister** and **King** survive an hour of error. These two are the commercially safe layer — build the paid features on them.

This is the hard justification for the birth-time confidence gate. It isn't caution, it's arithmetic.

**Therefore add, later:** a **rectification** flow. The user confirms 3–5 dated life events (marriage, job change, bereavement, relocation, illness); you search a ± window of birth times for the one whose daśā boundaries best align. This is the single highest-value premium feature you could build, and it's the honest answer to the table above.

### 1.2 Ayanāṁśa is load-bearing and must be frozen

Lahiri, Raman, KP and Fagan-Bradley disagree by up to ~1.2°. Against a 13.33° nakṣatra that's **9% of a mahādaśā** — years. If a user switches ayanāṁśa, every date they've ever seen changes, every plan re-cuts, and every past Mentor answer becomes wrong.

Rules:
- Default **Lahiri** (Indian government standard, what most users' other apps use).
- Store the choice on the chart, not the account.
- Changing it is a destructive action with a confirm: *"This recalculates everything. Your 3 plans will be re-timed and past dates will move by up to a year."*
- Version it: `chart.ayanamsa = 'lahiri'`, `chart.engine_version = 'swe-2.10.03'`. When you upgrade the engine, you can identify affected charts.

---

## 2. System shape

```
 ┌────────────┐   birth data    ┌──────────────┐
 │   Client   │ ───────────────►│   SRV/API    │
 │  (iOS)     │                 │              │
 │            │◄─── chart id ───│  ┌────────┐  │
 │  LOCAL DB  │   + maha/antar  │  │  EPH   │  │ Swiss Ephemeris
 │  (SQLite)  │     rows        │  │  TREE  │  │ + daśā builder
 └─────┬──────┘                 │  └────────┘  │
       │                        │  ┌────────┐  │
       │ computes levels 3-5    │  │  GEO   │  │ geocode + historic tz
       │ locally from cache     │  └────────┘  │
       │                        └──────┬───────┘
       │                               │
       │                        ┌──────▼───────┐
       └───────── chat ────────►│  AI layer    │ tool-calling model
                                └──────────────┘
```

**Split of responsibility:**

- **Server computes** the chart and levels 1–2 (King + Prime Minister). That's 9 + 81 = **90 rows** for a full 120-year cycle. Small, cacheable, sent once.
- **Client computes** levels 3–5 on demand. Precomputing all five levels is 9⁵ = **59,049 leaf nodes** — pointless, because walking down from a given timestamp takes five arithmetic steps. Compute on demand, cache the current five, recompute on a timer.
- **Never** round-trip to the server to answer "what's running right now." That must work on a plane.

**The daśā maths, so nobody has to rediscover it:**

Planet years — Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rāhu 18, Jupiter 16, Saturn 19, Mercury 17. Total 120. Order cycles in exactly that sequence.

Starting lord = lord of the nakṣatra the Moon occupies at birth. Balance = `(1 − fraction_of_nakshatra_traversed) × lord_years`.

Any sub-period: `duration(child) = duration(parent) × child_years / 120`. Recurses identically to all five levels. Sub-periods start with the parent's own lord and then follow the fixed cycle.

Use **365.25-day years** throughout and be consistent — mixing 365 and 365.25 across levels produces boundary drift that will take you a week to find.

---

## 3. Data model

Minimum viable entities. Field-level origin in brackets.

**`user`** — `id`, `phone` `USER`, `email` `USER`, `display_name` `USER`, `auth_provider` `USER`, `locale` `DEVICE`, `created_at` `SRV`, `deleted_at` `SRV`

**`chart`** — one per person the user tracks (self, spouse, child)
`id`, `user_id`, `label` `USER`, `birth_date` `USER`, `birth_time` `USER`, `birth_time_confidence` `USER` *(enum: exact / ~15min / ~1hr / unknown)*, `place_name` `GEO`, `lat` `GEO`, `lon` `GEO`, `tz_id` `GEO`, `utc_offset_at_birth` `GEO`, `birth_datetime_utc` `SRV` *(derived, the canonical value)*, `ayanamsa` `USER` *(default lahiri)*, `house_system` `USER`, `moon_longitude` `EPH`, `nakshatra` `EPH`, `nakshatra_pada` `EPH`, `starting_lord` `TREE`, `balance_years` `TREE`, `engine_version` `SRV`, `is_primary` `USER`

**`dasha_period`** — levels 1–2 only, persisted
`chart_id`, `level` *(1–2)*, `lord`, `start_utc`, `end_utc`, `parent_id` — all `TREE`

**`plan`** — `id`, `chart_id`, `title` `AI` *(editable → `USER`)*, `category` `USER`, `current_stage_text` `USER`, `notes` `USER`, `horizon_end` `USER`, `cut_level` `TREE` *(which daśā level the stages come from)*, `status` *(active/archived)*, `reminder_channels` `USER`, `created_at`

**`plan_stage`** — `plan_id`, `ordinal`, `lord` `TREE`, `start_utc` `TREE`, `end_utc` `TREE`, `heading` `AI`, `advantage_body` `AI`, `obstacle_body` `AI`, `kingdom_line` `AI`, `checklist` `AI`, `checked_items` `USER`, `state` *(done/now/next — derived from clock)*

**`plan_event`** — Course Correct log. `plan_id`, `body` `USER`, `occurred_on` `USER`, `changed_goal` `USER`, `replan_applied` `SRV`, `diff` `SRV`

**`thread`** / **`message`** — `thread.title` `AI`, `message.role`, `message.body` `USER`|`AI`, `message.tool_calls` `SRV`, `message.sources` `SRV`, `created_at`

**`content_block`** — the authored library. `lord`, `level_role` *(king…messenger)*, `kingdom_line`, `advantage_sections[]`, `obstacle_sections[]`, `version` — all `CONTENT`

**`scheduled_alert`** — `chart_id`, `plan_id?`, `fire_at_utc` `TREE`, `channels` `USER`, `kind` *(stage_shift / dasha_turn / day_before)*, `sent_at`

---

## 4. Onboarding & auth (screens A1–A15)

**Design principle: chart before account.** Let people enter birth details and *see their court* before you ask for a password. Conversion on astrology apps roughly doubles when the value lands first. Hold the chart in `LOCAL` until they sign up, then upload.

### A1 · Splash
Logo, 600ms max. Behind it: restore session from Keychain, load cached chart from `LOCAL`, check `engine_version` against server.
→ Session valid **and** chart exists → **Planner (P0)**. No session, chart cached → **A10**. Neither → **A2**.

### A2 · Welcome
One screen, one promise. Headline: *"Know which way the wind is blowing."* Sub: *"Vedic timing, in plain English. Find out who's ruling your chart right now."*

| Element | Action | Result | Data |
|---|---|---|---|
| `Find out` (primary) | tap | → A6 (birth date). **No signup yet.** | — |
| `I already have an account` | tap | → A13 login | — |
| `Terms` / `Privacy` | tap | in-app browser | — |

### A3 · Sign up *(reached from A10, after the chart exists)*
Methods, in this order for an India-first audience:
1. **Phone + OTP** — primary. Most reliable, no password to forget.
2. **Sign in with Apple** — *mandatory* if you offer Google, per App Store rule 4.8. Handle the private-relay email.
3. **Google**
4. **Email + password** — last resort, needs verification + reset flow.

| Element | Action | Result | Data |
|---|---|---|---|
| Phone field | type | libphonenumber validation, country picker defaults from `DEVICE` SIM/locale | `USER` |
| `Send code` | tap | `POST /auth/otp` → A4. Rate-limit 3/hr/number, 5/hr/IP | `SRV` |
| Apple / Google | tap | native sheet → token → `POST /auth/oauth` → A11 | `SRV` |
| `Use email instead` | tap | swaps the form | — |

### A4 · OTP entry
6 boxes, autofill from SMS (`oneTimeCode` on iOS). Resend disabled 30s, then enabled with a countdown. After 3 wrong attempts, 15-min lockout.
→ Success: chart in `LOCAL` uploads to `SRV`, `chart.user_id` set → **A11**.

### A6 · Birth date
Wheel picker, no free text. Range: 120 years ago → today. Blocks future dates. Under-13 → hard stop with *"You need to be 13 or older to use this."* (COPPA/DPDP.)

### A7 · Birth time + confidence — **the most important screen in onboarding**

Time picker, plus the confidence selector. Do not bury the second one; it determines what the app is allowed to tell them.

> ### What time were you born?
> **How sure are you?**
> ○ To the minute — I have a certificate
> ○ Within about 15 minutes
> ○ Within about an hour
> ○ I don't know

| Element | Action | Result | Data |
|---|---|---|---|
| Time picker | scroll | sets `birth_time` | `USER` |
| Confidence options | tap | sets `birth_time_confidence`; **live preview line updates below**: *"You'll see all five rulers"* / *"Messenger will be marked approximate"* / *"Messenger and Magistrate stay hidden"* / *"We'll show King and Prime Minister only"* | `USER` |
| `I don't know` | tap | sets time to 12:00 local, confidence `unknown`, shows: *"We'll use noon as a placeholder. Your King and Prime Minister will still be right — the faster rulers need a real time."* | `USER` |

**Gate behaviour, applied everywhere thereafter:**

| Confidence | King | PM | Governor | Magistrate | Messenger |
|---|---|---|---|---|---|
| exact | ✓ | ✓ | ✓ | ✓ | dashed, `approximate` |
| ~15 min | ✓ | ✓ | ✓ | dashed | hidden |
| ~1 hour | ✓ | ✓ | dashed | hidden | hidden |
| unknown | ✓ | dashed | hidden | hidden | hidden |

Hidden rings are not drawn. Dashed rings render at 40% with a dash pattern and are non-tappable except to open the birth-time fix sheet.

### A8 · Birth place
Search field with debounced autocomplete (250ms). Results show `City, State, Country`.

| Element | Action | Result | Data |
|---|---|---|---|
| Search field | type | `GET /geo/search?q=` → list | `GEO` |
| Result row | tap | sets `lat`, `lon`, `tz_id`; **resolves `utc_offset_at_birth` using the tz rules in force on `birth_date`** | `GEO` |
| `Can't find my place` | tap | manual lat/lon + tz picker | `USER` |

**Do not use the modern UTC offset.** India was +05:30 from 1955 but ran wartime DST 1942–45; dozens of countries changed rules. Use IANA tzdb with a historical lookup. Getting this wrong shifts the chart by an hour, which per §1.1 is up to ten months of drift.

### A9 · Calculating
Full-screen, 1.5–3s. Rotating lines: *"Placing the planets…" → "Finding your Moon's nakṣatra…" → "Building your court…"*
Server: `POST /charts` → ephemeris → nakṣatra → starting lord + balance → levels 1–2 → returns chart + 90 periods. Client caches to `LOCAL`.
On failure: *"We couldn't build your chart. Your details are saved."* `Try again` / `Contact support`. Never lose the input.

### A10 · Meet your court — the reveal
The payoff screen. Wheel animates in from zero (§7.1). Below: *"Sun is your King. Venus is your Prime Minister."* Plus a one-line kingdom read from `CONTENT`.

| Element | Action | Result |
|---|---|---|
| `See what this means` | tap | → T2 dasha detail for the King |
| `Save my chart` (primary) | tap | → **A3 signup** |
| `×` | tap | soft prompt: *"Your chart lives only on this phone until you save it."* |

### A11 · Notification permission
**Never at launch.** Ask here, after value, with a reason: *"Your rulers change on fixed dates. Want us to tell you the day it turns?"* `Yes, tell me` triggers the OS prompt. `Not now` → skip; re-ask only when they enable Shift Alerts on a plan.

### A13 · Log in
Phone/email + method. `Forgot password` → A14 (email reset link, 15-min expiry, single use). Multi-device: session per device, listed in Y8, revocable.

**Deleted account:** App Store requires in-app deletion. `Y8 → Delete my account` → typed confirmation → 30-day soft delete → hard purge. Charts, plans, threads all go. Confirm email/SMS on request and on completion.

---

## 5. Nav shell

Four tabs: **Planner** (default), **Timeline**, **Mentor**, **You**. Floating neumorphic bar, 24pt inset from edges.

- Tab tap → switch, preserve each tab's scroll and navigation stack.
- Tab tap while already on that tab's root → scroll to top.
- Tab long-press → quick actions (Planner: *New plan*; Mentor: *New thread*).
- Badge on Planner when a stage has turned since last open.

---

## 6. Planner (P0–P12)

### P0 · Plans list
**Data:** `plan` rows `SRV`/`LOCAL`; current stage derived by comparing `DEVICE` clock against `plan_stage.start_utc/end_utc`.

| Element | Action | Result |
|---|---|---|
| `+` | tap | → P1 |
| Plan card | tap | → P6 |
| Plan card | swipe left | `Archive` / `Delete` |
| Plan card | long-press | context menu: Rename, Course correct, Notifications, Archive, Delete |
| `Start a plan` (empty state) | tap | → P1 |
| Archived section header | tap | expand/collapse |

Card shows: mini ring (single ring = current stage progress), title, category, `Stage 3 of 5`, state pill (`PUSH`/`PAUSE`), lord, days left, progress bar, target date. All `TREE` + `SRV`.

### P1–P4 · New plan questionnaire
Modal, tab bar hidden, 4 steps + generating.

**P1 category** — 8 chips + `Something else`. Icons are neutral line marks (heart, briefcase, trend, rocket, pulse, home, book, wallet). Selecting one enables `Continue` and pre-loads P2's stage chips for that category. `USER`

**P2 current stage** — category-specific chips + optional free-text. The free text is the single biggest quality lever on the generated plan; label it *"Anything we should know?"* and give a rich placeholder. `USER`

**P3 horizon** — `1 month` `3 months` `6 months` `1 year` `Pick a date`. On selection, the client computes which daśā level yields **3–6 periods** in that window and stores it as `cut_level`. Show it: *"We'll cut this into Governor terms."*

**P4 reminders** — three checkboxes (In-app / Email / SMS) + `Warn me the day before`. If push isn't granted and In-app is ticked, trigger the OS prompt here. SMS shows *"carrier rates apply"* and, if you gate it, a `PRO` tag.

**P5 generating** — 3–8s. `POST /plans` → server slices `TREE` at `cut_level` within the window → for each period calls `AI` with (category, stage text, lord, role, dates, chart summary) → returns headings, kingdom lines, Advantage/Obstacle bodies, checklists. Persist. → P6.

**Failure:** keep the questionnaire answers, show `Try again`. Never make them retype.

### P6 · Plan detail

**Data:** `plan` + `plan_stage` `SRV`; wheel fractions from `TREE`; stage states from `DEVICE` clock.

| Element | Action | Result |
|---|---|---|
| `‹` | tap | back to P0 |
| `···` | tap | menu → Rename, Edit goal, Course correct, Notification settings, Archive, Delete |
| Wheel ring | tap | → T2 dasha detail for that ruler |
| Wheel ring | long-press | floating chip: role, lord, time left |
| Wheel centre | tap | → P7 for the current stage |
| Stage tab (any) | tap | → **P7 Task detail** |
| Stage node | tap | same as tab |
| `Something changed` | tap | → P8 |
| `Add a phase note` | tap | text sheet → saved to `plan.notes` |
| Overall progress bar | — | not interactive |

**Stage count is variable.** However many `cut_level` periods fall in the window — 2 to 9. Below 3, drop the dashes on connectors so it doesn't look sparse. Above 6, the pipeline scrolls and auto-scrolls the current stage into view on open. Exactly 1 → no pipeline, a single full-width card: *"One ruler covers this whole window."*

### P7 · Task detail
Header band in the stage's lord colour. Eyebrow `STAGE 3 OF 5 · RUNNING NOW`, heading = the stage heading, sub = `Mars as Governor · <plan title>`, date well with countdown, **In the Kingdom** block, then tabs.

| Element | Action | Result |
|---|---|---|
| `Advantage` / `Obstacle` | tap | swap content, animate the pill. State is per-stage, not global |
| Checklist checkbox | tap | toggles `checked_items`, haptic, optimistic write + sync |
| `Ask Mentor about this` | tap | → M1 with a pre-filled thread seeded with plan + stage context |
| Date well | tap | → T2 for the underlying daśā period |

### P8 · Course Correct
Sheet. Fields: free text (`USER`), date (`USER`, defaults today), radio *"Does this change the goal itself?"*.

| Element | Action | Result |
|---|---|---|
| `Just log it` | tap | writes `plan_event`, no re-plan, dismiss |
| `Re-plan from here` | tap | `POST /plans/:id/replan` → regenerates stages **from today forward only**; history preserved → P9 |

### P9 · Plan diff — *do not skip this*
After any re-plan, show what moved before committing.
> **3 stages moved.** `Push` moved earlier — 05 Nov → **22 Oct** · `Go Public` shortened by 3 weeks · `Close` unchanged
> `Looks right` (commits) · `Undo` (rolls back, keeps the `plan_event`)

Silently rewriting someone's plan is the fastest way to lose their trust.

### P11 · Archive / Delete
Archive → status change, alerts cancelled, moves to Archived. Delete → typed-free confirm naming the plan, permanent, cascades stages + events + scheduled alerts.

---

## 7. Timeline (T0–T4)

### T0 · Timeline, top of scroll
**Data:** all `TREE`, computed on-device against the `DEVICE` clock. Works offline.

Header, subtitle *"Tap any ring — or any character below."*, the Wheel, then the **Your Court** table.

| Element | Action | Result |
|---|---|---|
| Ring (any of 5) | tap | → T2 for that ruler |
| Ring | long-press | floating chip, dims other rings |
| Wheel centre | tap | → T2 for the King |
| Court row | tap | → T2 for that ruler |
| Time-left pill | tap | same as row (it's not a separate target) |
| Dashed/approximate ring or row | tap | → birth-time fix sheet, **not** T2 |
| Scroll | — | → T1 |

**Refresh cadence.** Recompute the five current periods every 60s while foregrounded, and immediately on foreground. Only the Messenger ring's arc needs sub-minute updates — animate it locally at 1s, don't recompute the tree. On backgrounding, stop everything.

### T1 · Timeline, scrolled
Compact sticky header, the full Your Court table, then **Biggest Change Ahead**.

The countdown ticks live at 1s. Under 24h the DAYS block drops and the other three grow; under 1h the blocks turn Mars red and the line above reads *"Handover today."* The handover rail's chevrons crawl on a 1.2s loop toward the incoming ruler.

| Element | Action | Result |
|---|---|---|
| Countdown block | tap | → T2 for the incoming ruler |
| Outgoing / incoming pill | tap | → T2 for that planet's period |

### T2 · Dasha detail

**Data:** dates + progress `TREE`; kingdom line, Advantage/Obstacle sections `CONTENT` (optionally personalised by `AI` — see §10).

| Element | Action | Result |
|---|---|---|
| `‹` | tap | back, restoring scroll |
| `Advantage` / `Obstacle` | tap | swap sections |
| Best/rough window card | tap | → T2 one level deeper |
| `Ask Mentor about this period` | tap | → M1, thread pre-seeded |
| Colour band | — | decorative; carries the lord's colour |

### T3 · Scrubber *(build in v1.1, not v1)*
Horizontal control under the Wheel: `◀1y ◀1m NOW 1m▶ 1y▶` + `Jump to date`. When off "now," the Wheel dims and a persistent pill appears: **`Viewing 12 Mar 2029 — Return to now`**. Non-negotiable; people get lost in scrubbers. All values recompute from `TREE` at the scrubbed timestamp.

---

## 8. Mentor (M0–M5)

### M0 · New thread
Empty state, six suggested prompt chips. Tapping a chip sends it immediately — don't just fill the box.

### M1 · Active thread

| Element | Action | Result |
|---|---|---|
| `☰` | tap | → M2 threads panel |
| `+` | tap | new thread; current one is already saved |
| Input | type | grows to 5 lines then scrolls |
| Send `↑` | tap | streams the answer |
| `Quick` / `Think it through` | tap | switches model tier for **subsequent** messages; persists per thread |
| Source chip | tap | expands to show which tools ran and what they returned |
| Long-press a message | — | Copy, Regenerate, **Continue in a new thread from here** |

**Continue in a new thread from here** is the ChatGPT/Claude fork behaviour you asked for: copies history up to that message into a new thread, leaves the original intact.

### M2 · Threads panel
Floating panel, 353×690, over a 62% scrim, inside the tab bar so navigation still works.

| Element | Action | Result |
|---|---|---|
| Search | type | client-side filter on title + body |
| `New thread` | tap | closes panel → M0 |
| Thread row | tap | closes panel, loads that thread |
| Thread row swipe | — | Rename / Pin / Delete |
| `✕` or scrim tap | — | dismiss |

Grouping: Today / Yesterday / Previous 7 days / Previous 30 days / Older, by `updated_at`.

### M3 · How Mentor actually works

**Two models.** Top-tier reasoning model with tool use for every user-facing answer; a small fast model for thread titles, category classification, and the safety pre-check. Never let the expensive model write a six-word title. Current model IDs: https://docs.claude.com/en/docs/about-claude/models/overview

**Inject live state every turn** — don't make the model call a tool to learn what day it is:
```
TODAY: 2026-07-29T14:22Z  (user tz Asia/Kolkata)
CHART: born 1994-03-14 06:12 Chennai · Lahiri · confidence: ~15min
COURT: King Sun→2030-09-14 · PM Venus→2027-11-11 · Governor Mercury→2026-08-14
       Magistrate Ketu · Messenger (hidden — birth time confidence)
PLANS: "Land a senior PM role" — stage 3/5 Push, ends 2026-11-17
```

**Tools:** `get_natal_chart`, `get_current_court`, `get_ruler_at(date)`, `get_ruler_range(start,end,level)`, `get_next_turns(count,level)`, `list_plans`, `get_plan(id)`, `search_content(query)`. Write tool descriptions that say *when* to use them, not just what they return — routing quality lives almost entirely there.

**System prompt rules:** never invent chart values · plain English first, Sanskrit only if the user used it · conditions not predictions, never guarantee outcomes · use the court vocabulary exactly · **refuse Magistrate/Messenger-level answers when confidence is low and offer the Prime Minister level instead** · no medical/legal/financial directives · short by default.

**Memory:** full history under ~30 turns; beyond that keep the last 15 verbatim and summarise the rest with the small model. Always re-inject the state block fresh — never let a turn-2 copy survive to turn 40.

**Cost control:** cap tokens per message, rate-limit per user per day, cache `search_content` results. Log every call's token count against `user_id` from day one or you will not be able to price the product.

**Safety:** the pre-check classifier runs before the main model. Self-harm, crisis, or acute medical → bypass the astrology answer entirely and respond with support resources. This is not optional in a product that tells people what their future looks like.

---

## 9. You (Y0–Y9)

| Screen | Contents | Notable actions |
|---|---|---|
| **Y0 Profile** | name, current King/PM, chart switcher | Tap chart → switch active chart, whole app re-renders |
| **Y1 Birth details** | date, time, place | Any edit → confirm sheet: *"This rebuilds your chart and re-times your 3 plans."* → A9 recalculation |
| **Y2 Birth time confidence** | the §A7 selector + the drift table from §1.1 | Changing it shows/hides rings immediately |
| **Y3 Your chart** | natal positions, nakṣatra, balance at birth | Read-only in v1 |
| **Y4 Calculation** | ayanāṁśa, house system, timezone | Destructive-confirm per §1.2 |
| **Y5 Display** | Show Sanskrit terms, Reduce motion, Theme, Language | Instant, local |
| **Y6 Shift Alerts** | channels, day-before, quiet hours, per-plan overrides | Writes `scheduled_alert` rows |
| **Y7 Subscription** | plan, renewal, restore purchases | StoreKit |
| **Y8 Data & privacy** | active sessions, export everything, delete account | Export = JSON + PDF by email |
| **Y9 About** | version, engine version, terms, privacy, support | — |

**Multiple charts** (Y0 switcher) is worth building early. Users overwhelmingly want to add a spouse, child, or parent, and it's the cheapest path to a paid tier — free gets one chart, paid gets five.

---

## 10. Content: the part that's bigger than it looks

**Base layer, `CONTENT`, human-written.** 9 planets × 5 court roles = **45 blocks**, each containing a kingdom line, 3 Advantage sections, 3 Obstacle sections. Same planet reads differently as King (a decade of weather) versus Messenger (an afternoon). Budget this as real writing work — roughly 45 × 400 words = 18,000 words.

**Plan layer, `AI`.** 9 planets × 9 categories = 81 stage archetypes, personalised at generation time from the user's stage text.

**Personalisation ceiling.** Everything above is daśā-only. Two people with the same Venus PM read very differently once you account for house placement, dignity and aspects. Decide explicitly:
- (a) generic per planet × role — ships fastest, and is what most competing apps actually do
- (b) generic per planet × role × house — 12× the content
- (c) generated per user by the model, grounded in the chart

Ship (a) behind the same strings and swap in (c) later without touching the UI. Do not attempt (c) at launch; ungrounded model output about someone's marriage is a support nightmare.

---

## 11. Notifications & scheduling

**Schedule server-side, deliver via push.** Local notifications break the moment the user changes timezone or doesn't open the app for a week.

`scheduled_alert` rows are generated when a plan is created and when the daśā tree is rebuilt. A worker sweeps for `fire_at_utc <= now`, sends, marks `sent_at`.

| Kind | Fires | Title |
|---|---|---|
| `stage_shift` | plan stage boundary | *What works for you just changed* |
| `day_before` | −24h | *Tomorrow, the timing turns* |
| `dasha_turn` | PM-level turn | *Your Prime Minister changes today* |

All carry a deep link: `vim://plan/{id}/stage/{ordinal}` or `vim://timeline/ruler/{level}`. Cold-launch handling must route correctly — test this, it's the most commonly broken path in any app.

**Quiet hours** in the user's *current* timezone `DEVICE`, not birth timezone. A turn at 03:00 holds until 08:00.

---

## 12. Things you haven't asked about, that will bite

1. **Birth-time rectification** — §1.1. Highest-value premium feature; also the honest fix.
2. **Historical timezones** — §A8. Silent, catastrophic, and easy to get wrong.
3. **Live Activity / Dynamic Island** — your countdown is *made* for this. A ruler handover on the lock screen is the best retention feature in this product and it's maybe three days of work.
4. **Home screen widget** — current court, small + medium. Same data, zero new backend.
5. **Offline** — everything in §7 works with no network. Make sure it actually does, and test on airplane mode before launch.
6. **Timezone travel** — display "time left" in the user's current tz; the underlying UTC boundaries never move.
7. **The turn happening while the app is open** — you need the transition animation from the copy spec, not a silent value change. Detect boundary crossing on the 60s tick.
8. **Localization** — Hindi/Telugu/Tamil are your market. Court metaphor translates well; check that Sanskrit diacritics (ā, ś, ṣ, ṁ) render in your chosen font on all iOS versions. Inter handles them; many display faces don't.
9. **Accessibility** — VoiceOver labels on every ring (*"Prime Minister ring, Venus, 62 percent elapsed, 1 year 2 months remaining"*), Dynamic Type on all body copy, `prefers-reduced-motion` kills the breathing halo and crawling chevrons.
10. **Analytics** — instrument onboarding drop-off per step, plan creation completion, Mentor messages per user, notification open rate. You will need these to know what to fix.
11. **App Review** — position as guidance/entertainment, never medical or financial advice. Have the disclaimer visible. Apps in this category get rejected for outcome claims.
12. **Age gate** — 13+ minimum, stated at A6.
13. **Data sensitivity** — birth date, time and place is effectively a national ID in some contexts. Encrypt at rest, never log it, keep it out of analytics payloads and crash reports.
14. **Engine version migration** — when you upgrade Swiss Ephemeris, dates shift slightly. Have a plan: recompute in place, notify only if a boundary moved more than a day.
15. **Empty and error states for every screen** — enumerated in the copy spec §9. Build them at the same time as the happy path, not after.
16. **Support surface** — an in-app contact route that attaches chart id + engine version + app version. You cannot debug a timing complaint without those three.

---

## 13. Suggested build order

**M1 — Chart engine.** Ephemeris integration, nakṣatra, balance, levels 1–2, then 3–5 on demand. Verify against three known charts by hand before writing any UI. Everything downstream is wrong if this is wrong.

**M2 — Onboarding + Timeline.** A1–A11, T0–T2. This is a complete, shippable, useful app on its own.

**M3 — Content.** The 45 authored blocks. Slow, unglamorous, blocks everything that reads well.

**M4 — Planner.** P0–P9 plus plan generation. The most complex surface; don't start it before the tree is trusted.

**M5 — Mentor.** Tools, state injection, threads, safety.

**M6 — Notifications, widget, Live Activity, subscription.**

Ship M2 to a small group before building M4. If the Timeline alone doesn't hold attention for two weeks, the Planner won't rescue it.
