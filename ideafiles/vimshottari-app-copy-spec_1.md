# Vimshottari App — Structure, Naming & UI Copy Spec

Everything below is written as **shippable strings**. Where I changed your wording, the reason is in the margin note. Sanskrit terms stay in the app — as the *second* line, not the first.

---

## 0. Decisions & fixes — read this first

These are the things I'd change before you build. Ordered by how much damage they cause if ignored.

**0.1 — Birth-time confidence gates the inner levels. This is the big one.**
Prana dasha runs ~20 minutes to ~5.5 days. Sookshma runs ~6 hours to ~33 days. If someone's birth time is "around 6 in the morning," the two outermost rings are fiction dressed as precision. Add a required setting:

> **How exact is your birth time?**
> ‣ To the minute (from a certificate) ‣ To ~15 minutes ‣ To the hour ‣ I'm not sure

Behaviour: *To the minute* → all 5 rings live. *~15 min* → Pulse ring shows as a dashed, dimmed ring with the label `approximate`. *To the hour* → Phase and Pulse both dashed. *Not sure* → hide Phase and Pulse entirely, show a single card: **"Two rings are hidden."** / *"Your fastest cycles change every few minutes. We need a tighter birth time before we'll show them."* → `Fix birth time`
This one decision is the difference between a credible product and a toy.

**0.2 — "Good side / bad side" is the wrong frame.**
It reads as verdict. Everything the user does afterwards is coloured by "I'm in a bad one." Use **Advantage / Obstacle** on every detail page — Timeline and Planner both. One pair everywhere: the user learns it once. (An earlier draft split these into Tailwind/Headwind for Timeline and Push/Pause for Planner; that was a distinction only a designer would notice, and it doubled the vocabulary for no gain.) **Push / Pause** survives only as the *state* label on a plan card, never as a tab.

**0.3 — Your ring order is right, but the visual weight is backwards.**
You want outermost = Pulse (fastest). Keep it — the outer edge *visibly moves*, which is the whole appeal. But that puts the single most important fact (which Era you're in, for the next 6–20 years) on the thinnest, innermost hairline. Two fixes:
- **Taper the stroke.** Era = thickest inner ring, each ring outward gets thinner, Pulse = hairline. Importance reads inward; speed reads outward.
- **The centre of the wheel always shows the Era.** Big glyph, planet name, time left. The centre is the headline; the rings are the detail.

**0.4 — Rahu and Saturn will be indistinguishable.** Dark grey next to black, on a dark background, in a 6px stroke. Lift Rahu to a mid-smoke and give each planet a *motion signature* (§2) so identity survives colour-blindness, glare, and small screens.

**0.5 — Same planet in adjacent rings will blur into one fat band.** Venus Era + Venus Chapter = a single pink blob. Rule: when neighbouring rings share a planet, insert a 2px background-coloured gap and drop the outer ring's opacity to 85%.

**0.6 — Don't celebrate ring completion.** Apple rings closing = you achieved something. A dasha closing = time passed. No confetti, no "You did it!" Use a **Turn** — a 900ms colour bleed from the old planet to the new one, plus one line: *"Venus Chapter closed. Sun Chapter begins."*

**0.7 — Add a fourth nav item.** Three tabs won't hold birth data, chart settings, ayanamsa, timezone, notification prefs, and export. Call it **You**.

**0.8 — Say what the app is, once, and never again.** A permanent, quiet footer line on every detail page: *"This describes conditions, not outcomes. What you do with them is yours."* No modal, no repeated disclaimers.

**0.9 — Health and money need one extra line.** In the Health category and anywhere the Obstacle tab mentions the body: *"Not medical advice. If something hurts, see a doctor — the timing conversation can wait."*

---

## 1. Product language

The whole app runs on one vocabulary. Plain English is primary; Sanskrit is the smaller second line. A toggle in **You → Display** called **"Show Sanskrit terms"** (default: on) controls the second line only.

| Level | App label | Sanskrit (second line) | Typical length |
|---|---|---|---|
| 1 | **King** | Mahādaśā | Rules for several years — typically 6 to 20 |
| 2 | **Prime Minister** | Antardaśā | Rules for months up to a few years — usually 1 to 3 |
| 3 | **Governor** | Pratyantardaśā | Rules for weeks to a few months |
| 4 | **Magistrate** | Sūkṣma daśā | Rules for days to a few weeks |
| 5 | **Messenger** | Prāṇa daśā | Rules for hours to a few days |

**King → Prime Minister → Governor → Magistrate → Messenger.** A royal court, not a calendar. It beats the earlier Era/Chapter/Season ladder on three counts: the roles imply *authority* (which is what a daśā actually is — who is ruling your chart), they imply *nesting* without being told (everyone knows a Governor answers to a King), and they carry the duration intuitively — nobody expects a Messenger to hold office for a decade.

Say it out loud and it works: *"Sun is my King, Venus is my Prime Minister."*

Rules for using it:
- **The role is primary, the planet is secondary, the Sanskrit is tertiary.** `Prime Minister` big, `Venus · Antardaśā` small underneath.
- Never mix ladders. If a screen says `Governor` it must not also say `Season` anywhere.
- The metaphor extends into the copy, but sparingly — *"the King appoints an auditor"* is good; *"lo, the royal decree"* is not. Court language sets the frame, then plain English does the work.

Other core nouns:

| Concept | Word | Use it like |
|---|---|---|
| The ring cluster | **the Wheel** | "Your Wheel" |
| A moment one level hands to the next | **a Turn** | "Next Turn: 14 Aug" |
| Favourable conditions | **Advantage** | tab label, Timeline + Planner detail |
| Difficult conditions | **Obstacle** | tab label, Timeline + Planner detail |
| The plain-language framing of a ruler's term | **In the Kingdom** | metaphor block above the tabs |
| Act-now conditions (plan context) | **Push** | tab label, Planner |
| Hold-off conditions (plan context) | **Pause** | tab label, Planner |
| A notification that the conditions changed | **Shift Alert** | settings label |
| Logging a real-world event into a plan | **Course Correct** | button |

**Words to ban from the UI:** *malefic, benefic, auspicious, inauspicious, remedies, doshas, cursed, lucky, unlucky, blessed, destiny.* They either scare people or make the app sound like a temple pamphlet. Say what's actually happening instead: *"This period resists speed"* beats *"Saturn is a malefic."*

---

## 2. Planet system

Your colours, with hex values, contrast fixes, and a motion signature so identity never rests on colour alone.

| Planet | Colour | Hex | Rim / fix | Motion signature | Glyph |
|---|---|---|---|---|---|
| **Sun** | Orange | `#FF7A18` | — | Steady warm glow, 4s pulse | ☉ |
| **Moon** | Pearl off-white | `#F2EDE4` | 1px `#B9BCC4` outline in light mode | Slow opacity swell, 6s | ☾ |
| **Mars** | Red | `#E2342B` | — | Sharp 2px flare at leading edge | ♂ |
| **Mercury** | Green | `#2FBF71` | — | Quick 1.5s shimmer travel | ☿ |
| **Jupiter** | Yellow | `#F5C518` | 1px `#C79A00` outline on white | Gentle outward bloom, 5s | ♃ |
| **Venus** | Pink | `#FF6FA5` | — | Soft breathing, 5s | ♀ |
| **Saturn** | Near-black | `#0E0E12` | `#3A3D45` rim always on; in dark mode lift base to `#16161D` | Tiny stars drifting along the stroke, ~12s loop | ♄ |
| **Rahu** | Mid-smoke | `#6B6F76` | — | Grainy haze drifting *against* the fill direction | ☊ |
| **Ketu** | Sky blue | `#61C7F0` | — | Wispy tail that fades behind the leading edge | ☋ |

**Saturn's starfield:** 8–14 particles, 1–1.5px, opacity 0.25–0.7, drifting along the arc at ~0.4× the fill rate. Cap it at 14 or the ring reads as noise on small screens. Respect `prefers-reduced-motion` — fall back to a static speckle texture.

**Rahu vs Saturn:** the smoke drifts *backwards* against the fill; Saturn's stars drift *with* it. Two greys, two opposite motions. That's the tell.

### 2.1 Planet one-liners

Every planet needs a **keyword**, an **Advantage line**, and an **Obstacle line**. These appear in the Your Court table, on plan stage tabs, in notifications, and in Mentor's summaries. Write once, reuse everywhere.

| Planet | Keyword | Advantage line | Obstacle line |
|---|---|---|---|
| Sun | **Authority** | Visibility works. Step forward and put your name on things. | Pride picks fights you don't need to win. |
| Moon | **Feel** | People respond to you. Move on instinct, not force. | Mood becomes the plan. A bad night reads as a bad life. |
| Mars | **Drive** | Force works now. Start it, cut it, ship it, say it. | Speed without aim. Anger burns the bridge you needed. |
| Mercury | **Exchange** | Words, deals and code move fast. Write it down, send it. | Too many tabs open. Cleverness stands in for commitment. |
| Jupiter | **Expansion** | Growth is cheap right now. Ask for more room. | Everything inflates — cost, weight, and promises included. |
| Venus | **Attraction** | Beauty, comfort and partnership open doors. | Comfort turns into drift. Pleasure spends the time you needed. |
| Saturn | **Weight** | Slow, boring, repeated work compounds hard here. | Delay reads as failure. It isn't — but quitting now is. |
| Rahu | **Hunger** | Unconventional bets land. Foreign, new and untested favour you. | Wanting outruns knowing. The shortcut arrives with a bill. |
| Ketu | **Release** | Depth over breadth. Finish it, master it, or let it go. | Detachment from the one thing that was actually working. |

---

## 3. The Wheel (shared component)

Used on both Planner and Timeline. Same physics, different labels.

**Anatomy, inside → out:** centre readout · Era (10px stroke) · Chapter (8px) · Season (6px) · Phase (4px) · Pulse (2.5px hairline).

**Fill = elapsed ÷ total for that specific period.** Not absolute time. A Sun Era (6 years) and a Venus Era (20 years) both read 0–100% across their own length.

**Centre readout (Timeline):**
```
        ☉
   Sun Era
 4 y 2 m left
```
Tap centre → Era detail page.

**Live edge:** a 3px dot rides the leading edge of the Pulse ring. It's the only thing on screen that visibly moves in real time. Update at 1s while the view is foregrounded; on-appear otherwise. Don't burn battery on a ring nobody's looking at.

**Ring labels:** on tap-and-hold, each ring surfaces a floating chip — `Season · Mercury · 22 d left`. Don't try to letter the arcs; at 4px it's unreadable.

**Accessibility:** every ring gets a glyph tick at its 12-o'clock start point, and VoiceOver reads: *"Chapter ring. Venus. Sixty-two percent elapsed. One year, two months remaining."*

**Legend strip** below the Wheel — 5 dots, colour + level name + planet name. Tappable. This is how people learn the vocabulary without a tutorial.

---

## 4. NAV 1 — **Planner** *(home)*

Tab icon: a route/path line. Not a calendar — calendars imply appointments, this is direction.

### 4.1 Plans list — empty state

> ## Plans
> **Nothing planned yet.**
> Pick something you actually want to move on. We'll time it against your chart and break it into phases.
>
> `Start a plan`

*Note: "Nothing planned yet" not "No plans found" — the second is a database talking.*

### 4.2 Plans list — populated

Header: **Plans** · right-side `+`

Card anatomy:
```
[mini Wheel]  Land a senior PM role
              Job Search · Phase 3 of 5
              ●  PUSH  ·  Mars  ·  12 days left
              ▓▓▓▓▓▓▓▓░░░░░░  Target 15 Mar 2027
```
Second row uses the phase's ruling-planet colour dot. `PUSH` / `PAUSE` as a small pill.

Section headers when there are several: **Active** · **Finishing soon** · **Archived**

Long-press / swipe actions: `Course correct` · `Edit` · `Archive` · `Delete`

### 4.3 New plan — the questionnaire

Five steps. Progress dots at top. Every step has a `Back`. Nothing is mandatory except step 1 and step 3.

---

**Step 1 of 5**
> ### What are you working on?
> Pick the one that fits closest. You can change it later.

| Chip | Sub-label |
|---|---|
| **Love & Relationship** | Finding someone, or fixing something |
| **Job Search** | New role, new company |
| **Promotion & Raise** | Moving up where you already are |
| **Startup & New Venture** | Building something of your own |
| **Health & Body** | Energy, weight, recovery, habits |
| **Big Purchase** | Home, land, vehicle |
| **Study & Exams** | A qualification with a deadline |
| **Money & Debt** | Getting clear, or getting ahead |
| **Something else** | Tell us in a line |

*Your original six plus **Study & Exams** and **Money & Debt** — the two people plan for most that weren't on your list. If you want swaps: **Relocation & Moving** and **Family & Children** are the next two.*

---

**Step 2 of 5**
> ### Where are you right now?
> Be honest about the starting line — the plan is only as good as this answer.

Stage chips change per category. Examples:

*Job Search:* `Just thinking about it` · `Updating my CV` · `Applying actively` · `In interviews` · `Have an offer, deciding`
*Love:* `Not looking yet` · `Open, not meeting anyone` · `Dating someone new` · `Long-term, needs work` · `Deciding whether to stay`
*Startup:* `Just an idea` · `Validating it` · `Building` · `Have users, no revenue` · `Raising`
*Health:* `Haven't started` · `On and off` · `Consistent, no results` · `Recovering from something`

Then a free-text field:
> **Anything we should know?** *(optional)*
> Placeholder: `Constraints, deadlines, people involved, what you've already tried…`

---

**Step 3 of 5**
> ### By when?
> A real date makes the phases real.

`1 month` `3 months` `6 months` `1 year` `Pick a date`

If they pick a horizon that's too tight for the goal:
> ⚠︎ **That's a fast one.**
> Six weeks for a career change is possible, but the plan will be dense and there's no slack for a bad window. Want to stretch it?
> `Keep 6 weeks` · `Try 3 months`

*Note: this warning is a trust-builder. An app that never pushes back feels like a horoscope.*

---

**Step 4 of 5**
> ### Should we tell you when the timing turns?
>
> Your chart hands off from one influence to the next on fixed dates. When it does, **the kind of effort that gets traction changes** — the same push that worked last month starts costing you double. We'll tell you the day it turns, so you switch approach instead of grinding.

☐ **In the app** — a card at the top of your plan
☐ **Email** — a short read on what changed and what to do
☐ **SMS** — one line, on the day *(carrier rates apply)*

☐ Also warn me **the day before**

*Feature is called **Shift Alerts** in settings. The explanation paragraph above is the one you asked me to write — it's the single most important piece of copy in the app, because it's the reason someone keeps the notifications on.*

---

**Step 5 of 5 — generating**
> ### Reading your chart against this goal…
Rotating lines (1.2s each): `Mapping your phases…` → `Finding your best windows…` → `Checking what to avoid…`

---

### 4.4 Plan detail

**Header**
```
Land a senior PM role                    ⋯
Job Search  ·  Target 15 Mar 2027  ·  7 m 12 d left
▓▓▓▓▓▓▓▓▓░░░░░░░░░░
```
`⋯` menu: `Rename` · `Edit goal` · `Course correct` · `Notification settings` · `Archive plan` · `Delete plan`

**The Wheel — plan version**
Same rings, same planet colours, but each ring is labelled by *the work due before it closes* rather than by the dasha level. Centre shows the plan's current headline phase.

Centre readout:
```
       ♂
 Phase 3 · Push
   12 days left
```

Tap-hold on any ring → `Season · Mercury · Get every document ready · 22 d`

**Below the Wheel — The Path**

> ### The Path        *5 stages*

Not a numbered list. A **pipeline** — the deploy-stage pattern from CI/CD, read top to bottom: a rail of nodes on the left, a colour-tinted **stage tab** on the right of each node, connectors running between them. It carries three things a list can't: direction, completion, and where you are right now.

```
 ✓ ━━━┓   ┌──────────────────────────────────┐   Saturn tint
       ┃   │ Build the boring assets           │
       ┃   │ Saturn · 12 Aug – 20 Sep    DONE  │
       ▼   └──────────────────────────────────┘
 ✓ ━━━┓   ┌──────────────────────────────────┐   Mercury tint
       ┃   │ Get the words right               │
       ▼   │ Mercury · 21 Sep – 04 Nov   DONE  │
           └──────────────────────────────────┘
(◉)  ┄┄┓   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   Mars tint, saturated
       ┋   ┃ RUNNING NOW           ┌─────────┐ ┃
       ┋   ┃ Apply hard, ask directly│12d left│ ┃
       ▼   ┃ Mars · 05 Nov – 17 Nov └─────────┘ ┃
           ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
 ○  ┄┄┄┓   ┌──────────────────────────────────┐   Sun tint
       ┋   │ Be seen by the decider            │
       ▼   │ Sun · 18 Nov – 09 Jan             │
           └──────────────────────────────────┘
 ○         ┌──────────────────────────────────┐   Venus tint
           │ Negotiate and sign                │
           │ Venus · 10 Jan – 15 Mar           │
           └──────────────────────────────────┘
```

**How many stages a plan has is not fixed.** The count is whatever number of daśā periods actually fall inside the window the user chose — the app does not pad to five or trim to five. A 1-month plan may cross only two Governor terms and produce **two** stages; a 1-year plan might produce **seven**. Consequences to build for:
- The pipeline must render 2–9 stages without redesign. Below 3, drop the connectors' dashes to keep it from looking sparse; above 6, the pipeline scrolls and the current stage auto-scrolls into view on open.
- If the chosen window contains only **one** period, don't draw a pipeline at all — show a single full-width card: *"One ruler covers this whole window."* plus the Advantage/Obstacle tabs directly.
- Which level drives the stages depends on the horizon: a 1-month plan is cut by **Magistrate** terms, 3–6 months by **Governor**, a year or more by **Prime Minister**. Pick the level that yields 3–6 stages and say which one in the plan header (*"cut by Governor terms"*).
- Changing the target date re-cuts the whole pipeline. Show that in the Course Correct diff (§4.6) as a stage-count change, not a silent redraw.

**Stage tab colour rule.** Each tab is filled with **its own ring's planet colour, deepened** so it survives on a dark surface; anything drawn *on* that tab — heading, status, countdown — uses a **lighter shade of the same hue**. One hue per stage, two values. Never introduce a colour that isn't already in that stage's ring.

| Stage planet | Ring (the wheel) | Tab fill (deepened) | Text on tab (lightened) |
|---|---|---|---|
| Saturn | `#8E94A4` * | `#282C36` | `#B6BCCA` |
| Mercury | `#2FBF71` | `#12301F` | `#79DDA6` |
| Mars | `#E2342B` | `#5E201B` | `#FFB3AC` |
| Sun | `#FF7A18` | `#31220F` | `#E5A264` |
| Venus | `#FF6FA5` | `#321D28` | `#E594B7` |
| Jupiter | `#F5C518` | `#332A0D` | `#EBCE6B` |
| Moon | `#F2EDE4` | `#2B2A27` | `#D8D3C9` |
| Rahu | `#6B6F76` | `#25272B` | `#A2A7AF` |
| Ketu | `#61C7F0` | `#0F2833` | `#96DBF5` |

\* Saturn's true `#0E0E12` is unusable as a tab fill on a dark base — the tab would vanish. In Planner only, Saturn's tab uses its **rim** value lightened to `#8E94A4` as the hue source. The wheel ring stays true black with the starfield.

Derivation, if you'd rather generate these than hardcode them: tab fill = hue at **18% mix over `#1B1D24`**; text = hue at **72% lightness**. Current stage overrides fill to **34% mix** and adds a 1.4px stroke in the pure ring colour.

**Stage headings are written for the task, not the phase.** The heading is the actual thing to do, phrased as a verb: *"Build the boring assets," "Get the words right," "Apply hard, ask directly," "Be seen by the decider," "Negotiate and sign."* Never `Phase 1`, never a bare noun like `Groundwork`. Every plan category generates its own wording — a Health plan under Mars reads *"Train heavy, eat properly,"* not *"Push."* The planet decides the **shape** of the instruction; the plan's category and stage decide the **words**.

Generator hint, per planet, as verb families to draw from: Saturn → build / endure / lay the base · Mercury → write / negotiate / get it in order · Mars → push / cut / confront · Sun → be seen / claim / present · Venus → close / charm / partner · Jupiter → expand / learn / ask for more · Moon → listen / gather / feel it out · Rahu → gamble / go wide / break format · Ketu → finish / strip back / let go.

**Stage states.**

*Completed* — node is a **solid filled circle in the ring colour with a heavy dark checkmark** (3.4px stroke, not a thin tick; it needs to read at a glance). Connector below it is a **solid 2.5px line in that stage's colour**. Tab drops to 72% opacity, gets a `DONE` tag in the lightened hue. The colour staying on completed connectors is deliberate — it shows the path already burned in.

*Running now* — the loud one. Solid node in the ring colour, white core dot, **two concentric halo rings** around it, tab at full opacity with a 1.4px stroke in the pure ring colour and an 18px outer glow. Tab carries a `RUNNING NOW` eyebrow, a larger heading (14px Bold, white), and a **countdown chip** on the right (`12d left`). The stage tab is also physically taller than the others — 74px against 57px.

*Not started* — hollow node, 1.6px `#454B57` stroke. Connector is a **dashed** `#3A3F4A` rail with a chevron at the join. Tab at 86% opacity, muted text. Dashed means "not run yet," exactly as it does in a deploy pipeline.

**Motion on the current stage** (the static `NOW` pill was doing nothing):
- Outer halo **breathes** — scale 1.0 → 1.12, opacity 0.4 → 0.1, 2.2s, `ease-in-out`, infinite. One ring only; two pulsing rings is a heart-rate monitor.
- Dashed connector *below* the current node **crawls** — dash offset animates 0 → 18px over 1.4s linear, infinite. It reads as "flow is heading here next."
- Countdown chip ticks live; at under 48 hours it switches to `hh:mm` and the chip border goes solid.
- On stage completion: the node fills, the checkmark **draws in** (stroke-dashoffset, 320ms), the connector above it fills top-to-bottom (400ms), then the next stage's halo starts breathing. Sequence it — don't cut.
- All of it off under `prefers-reduced-motion`; the current stage keeps only its stroke and glow.

**Tapping a stage tab** opens the Phase detail page (§4.5), inheriting that stage's tint as its header band.

**Footer buttons**
`Something changed` (Course Correct) · `Add a phase note`

### 4.5 Phase detail page

**Header block** *(identical structure to Timeline's dasha detail — deliberately)*
```
[Mars-red colour band]
Phase 3 of 5
# Push
Mars  ♂  ·  Season inside your Venus Chapter
05 Nov 2026  →  17 Nov 2026     13 days
▓▓▓▓▓▓▓░░░░░  12 days left
```

**Tabs: `Push` | `Pause`**

---

**PUSH tab**

> ### Do this now
> ☐ Send the five applications you've been sitting on
> ☐ Ask your last manager for the referral directly — not by email
> ☐ Take any interview offered, even for a role you're unsure about
> ☐ Say your salary number first

> ### Why now
> Mars windows reward the move you've been rehearsing. Force works here in a way it won't again for four months — directness reads as confidence rather than pressure. The cost of this window is that it's short and it doesn't reward patience.

> ### Daily rhythm
> Hard exercise early. Decisions before noon. One difficult conversation per day, not three. Sleep is the thing that goes first — protect it.

> ### Signals it's working
> Replies come faster than usual. People say yes to meetings. You feel slightly over-caffeinated even when you aren't.

---

**PAUSE tab**

> ### Don't force this now
> ✕ Don't redesign your CV again — that was last phase's job
> ✕ Don't quit before an offer is signed
> ✕ Don't send the angry follow-up to the recruiter who ghosted you

> ### What backfires in this window
> Mars turns friction into fights. The email you write at 11pm will land as an ultimatum. Anything requiring a slow, patient stakeholder will stall, and you'll read the stall as rejection.

> ### Early warning signs
> You're irritable about small things. You're drafting resignations. You're describing colleagues as obstacles.

> ### If you're already in it
> Move the energy into the body, not the inbox. Reply tomorrow, not tonight. Nothing in this window is as urgent as it feels.

---

Footer on both tabs, small, grey:
> *This describes conditions, not outcomes. What you do with them is yours.*

### 4.6 Course Correct

Button: **`Something changed`**

Sheet:
> ## What happened?
> Plans age fast. Tell us what shifted and we'll re-time the rest.
>
> **In a line or two**
> `Got laid off · offer came early · moved cities · someone left · health issue…`
>
> **When?** `[date picker — defaults to today]`
>
> **Does this change the goal itself?**
> ○ No, same goal, new situation
> ○ Yes — the goal has changed
>
> `Re-plan from here` · `Just log it`

After re-planning — a **diff view**, not a silent overwrite:
> ## Plan updated
> **3 phases moved.**
>
> `Push` moved earlier — 05 Nov → **22 Oct**
> `Go Public` shortened by 3 weeks
> `Close` unchanged
>
> Everything before today is kept as history.
>
> `Looks right` · `Undo`

*Never overwrite a plan without showing what moved. People lose trust the moment the app changes something they can't see.*

### 4.7 Destructive actions

**Archive:**
> **Archive this plan?**
> It moves out of your list but stays readable. Notifications stop.
> `Archive` · `Cancel`

**Delete:**
> **Delete "Land a senior PM role"?**
> This removes the plan, its phases, and its history. It can't be undone.
> `Delete` · `Cancel`

---

## 5. NAV 2 — **Timeline**

Tab icon: concentric rings.

### 5.1 Screen top

> # Timeline
> *Tap any ring — or any character below.*

Then **the Wheel** (§3), full-bleed, centre showing the King.

### 5.2 Your Court — one table, not two

**This was two blocks and is now one.** An earlier draft had a `Right Now` stack (who's ruling, how long left) and a separate `The Court` legend (what each role means, how long each rules). They were the same five rows twice. Merged: every row now carries the role, the planet, the duration note, and the live time left.

**Fastest first.** Messenger at the top, King at the bottom — the same order the rings read outside-in, so dragging a finger inward across the wheel and scanning the table downward trace the same path. Sort by speed, never by importance; the Wheel's centre carries the King as the anchor.

Section header: **YOUR COURT** left, *fastest first* right. One line under it: *"Five rulers, five speeds — all in office at once."* On the scrolled state it extends: *"…The faster ones just change hands more often."*

Row anatomy (78px):
```
┌─────────────────────────────────────────────────────┐
│ ✈  Messenger                          ( 41m left )  │
│    Moon · Prāṇa daśā                                │
│    Rules for hours to a few days.                 › │
├─────────────────────────────────────────────────────┤
│ ⚖  Magistrate                       ( 3d 4h left )  │
│    Ketu · Sūkṣma daśā                               │
│    Rules for days to a few weeks.                 › │
├─────────────────────────────────────────────────────┤
│ ⚑  Governor                           ( 22d left )  │
│    Mercury · Pratyantardaśā                         │
│    Rules for weeks to a few months.               › │
├─────────────────────────────────────────────────────┤
│ 📋 Prime Minister                   ( 1y 2m left )  │
│    Venus · Antardaśā                                │
│    Rules for months up to a few years — 1 to 3.   › │
├─────────────────────────────────────────────────────┤
│ ♔  King                             ( 4y 2m left )  │
│    Sun · Mahādaśā                                   │
│    Rules for several years — typically 6 to 20.   › │
└─────────────────────────────────────────────────────┘
```

- **Icons** carry the role: paper-plane (Messenger), scales (Magistrate), flag (Governor), clipboard (Prime Minister), crown (King). Each drawn in that ruler's current planet colour, so the icon does double duty — role *and* who holds it.
- **Time left is the one highlighted value** in the table. It sits in a brass pill (`#E8C889` on `#221E16`, 1px `#3D3320` border), top-right of each row. Everything else is greyscale except the planet line. Brass is the app's colour for *time*, used identically in the countdown block below — so a user learns "brass = a clock is running" once.
- The duration note is the permanent explainer. It never changes; the pill always does. That contrast is the whole point of merging the two blocks — the fixed fact and the live fact sit on the same row.
- Row taps open the Dasha detail (§5.5).

For dimmed/approximate rows (per §0.1):
```
◌  Messenger · Mercury                    approximate
   Based on a birth time accurate to ~15 min.
   `Fix birth time`
```

### 5.3 Biggest Change Ahead

The block at the bottom of Timeline, below the court table. **One thing only** — the next Prime-Minister-level (antardaśā) handover. No Governor turn, no CTA.

```
┌────────────────────────────────────────────────┐
│ BIGGEST CHANGE AHEAD                           │
│ Your Prime Minister changes                    │
│                                                │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ 471 │ │ 08  │ │ 42  │ │ 17  │               │
│  │DAYS │ │HOURS│ │MINS │ │SECS │               │
│  └─────┘ └─────┘ └─────┘ └─────┘               │
│ ───────────────────────────────────────────    │
│  ( ● Venus )  › › ›  ( ● Sun )                 │
│         takes office 11 Nov 2027               │
└────────────────────────────────────────────────┘
```

**The countdown is a New-Year-style clock, not a text label.** Four segmented brass blocks — DAYS / HOURS / MINS / SECS — with the seconds visibly ticking. It runs live whenever the view is on screen. Under 24 hours the DAYS block drops out and the remaining three grow; under one hour the block set turns from brass to Mars red and the row above reads *"Handover today."*

**The handover rail replaces the old sentence.** A deploy-style transition, read left to right:
- **Outgoing pill** — the departing planet, filled in its own deep tint, 75% opacity, its dot dimmed to 60%. It looks like it's draining.
- **Three chevrons** between the pills, in the *incoming* planet's colour at 0.3 / 0.6 / 1.0 opacity. They animate: opacity cycles left-to-right on a 1.2s loop so flow visibly runs toward the new ruler. Same crawl as the pipeline connector in §4.4 — one motion language for "this is heading there."
- **Incoming pill** — full opacity, 1.3px stroke in its planet colour, 14px outer glow, dot glowing. It looks live.
- Date sits centred underneath in small grey: *"takes office 11 Nov 2027."*

The two loose colour dots that used to sit before the sentence are gone; the pills carry the colour now.

- Why Chapter and not Era: the Era turn is a decade away and useless as a countdown; the Season turn is days away and already in the stack. Chapter is the only level where a countdown changes what someone does.

### 5.4 Look ahead / look back

A horizontal scrubber under the Wheel:
`◀ 1 y` `◀ 1 m` **`NOW`** `1 m ▶` `1 y ▶` · `Jump to date`

When scrubbed off "now," the Wheel dims slightly and a persistent pill appears at the top: **`Viewing 12 Mar 2029 — Return to now`**. Non-negotiable: people get lost in scrubbers.

### 5.5 Dasha detail page

Opened from a ring, a Right Now row, or the Wheel centre.

**Header**
```
[Venus-pink colour band]

‹ Chapter · inside your Sun Era

# Venus Chapter
Śukra Antardaśā  ·  ♀

12 Mar 2026  →  11 Nov 2027
1 year, 7 months, 30 days

▓▓▓▓▓▓▓▓▓▓░░░░░░   1 y 2 m left
```

*Your requested "start date, month, year and end date, month, year on top of the tabs, along with the heading" — arranged so the eye gets: where am I in the hierarchy → what is it → how long → how much is left.*

**In the Kingdom — the block above the tabs**

Before either tab, one short paragraph in **large bold type (17px)** answering: *what does it feel like across the whole kingdom while this one rules?* Not advice, not a list — the felt weather of the term. It is the biggest text on the page after the heading, and it is what the metaphor exists for.

> **IN THE KINGDOM**
> **The King appoints an auditor. Every request now passes a desk first — and whatever clears it is built to last.**

Rules: two to three lines, never more. Present tense. Name the ruler's *effect on the court*, not on the user. It must read true whether the user's day went well or badly. One image per block — an auditor, a war chief, a merchant, a messenger who never sits down — and don't mix them.

Reference images by planet: Sun → the King steps out in person · Moon → the court moves on mood · Mars → a war chief with a short commission · Mercury → the clerk who rewrites every contract · Jupiter → a patron who keeps expanding the budget · Venus → the court holds a long banquet · Saturn → the auditor · Rahu → a foreign envoy nobody can quite read · Ketu → a minister already packing to leave.

On the Task detail page (§4.5) the same block appears, but written for the *task*: *"Mars holds this province for twelve days. Force is legal here — the door that needed three polite emails opens to one direct ask."*

**Tabs: `Advantage` | `Obstacle`**

---

**TAILWIND tab** — five fixed sections, same order every time:

> ### What this period is good at
> Partnership, taste, negotiation, and anything where being liked does the work. Money arrives through people rather than effort. Design, art, and appearance-facing work land better than they should.

> ### Move on this
> Ask for the thing that requires someone to *want* to give it to you. Renegotiate. Repair a relationship you let go cold. Make the space you live in better — it pays back here in a way it doesn't in other periods.

> ### Lifestyle that turns it on
> Keep your surroundings pleasant — this period is unusually sensitive to environment. Eat well rather than cleanly. Spend time with people you find beautiful to be around. Sleep enough that you look rested; in a Venus window, that's not vanity, it's leverage.

> ### Best windows inside this period
> Small cards, tappable, each drilling one level down:
> `Venus Season · 12 Mar – 09 May` — *double Venus. The strongest stretch in here.*
> `Jupiter Season · 22 Aug – 30 Nov` — *expansion with charm. Ask big.*

> ### You'll know it's working when
> Things feel easier than they should. People offer before you ask. You stop having to convince.

---

**HEADWIND tab** — five fixed sections:

> ### How this period goes wrong
> Comfort quietly becomes avoidance. The hard conversation keeps getting postponed because the pleasant version of the day is always available. Nothing collapses — that's the trap. It just drifts.

> ### Lifestyle that triggers it
> Late nights that blur into late mornings. Spending as self-soothing. Staying in a relationship or a job because leaving would be unpleasant. Sugar, alcohol, and "I'll start Monday."

> ### Early warning signs
> Your calendar is full and nothing on it is difficult. You're buying things instead of deciding things. You've described a real problem as "fine" more than twice this week.

> ### Rough windows inside this period
> `Rahu Season · 10 May – 21 Aug` — *wanting outruns judgement. Don't sign anything glamorous.*

> ### If you're already in it
> Pick the smallest unpleasant task and do it before noon. Venus periods don't respond to force — they respond to one honest thing done early, which resets the day.

---

**Footer, both tabs:**
> *This describes conditions, not outcomes. What you do with them is yours.*
> `Ask Mentor about this period` →

*That last link is your best conversion into the Mentor tab, and it should pre-fill the thread with context.*

---

## 6. NAV 3 — **Mentor**

Tab icon: a speech mark, or a simple person-outline. Not a robot.

### 6.1 Empty state — new thread

> ## Ask anything.
> Your chart, your timing, your call. I'll pull your real data when it helps and tell you when I do.

Suggested prompt chips:
- `What's running for me right now?`
- `Is this a good month to switch jobs?`
- `Why do I keep stalling on the same thing?`
- `Explain my Saturn Chapter like I'm not into astrology`
- `When does my next good window open?`
- `What should I not do in the next two weeks?`

Input placeholder: `Ask about your timing, your chart, or what to do next…`

### 6.2 Thread list

Left drawer or top-sheet. Header: **Mentor** · `＋ New thread`

Groups: **Today** · **Yesterday** · **Previous 7 days** · **Previous 30 days** · **Older**

Threads auto-title after the first exchange (cheap model, 6 words max, no quotes): *"Timing on the Bangalore job offer"*

Row actions: `Rename` · `Pin` · `Export` · `Delete`

Empty thread list: **No threads yet.** / *"Start one — it'll remember everything you've discussed."*

### 6.3 In-conversation states

**While working**, show what it's actually doing — this is trust, not decoration:
`Checking your dasha timeline…` · `Reading your chart…` · `Looking at your plan…` · `Thinking it through…`

**Source disclosure** under each answer that used data — a small tappable chip:
`Used: your dasha timeline, natal chart` → expands to show exactly which values were read.

**Depth control** next to the input:
`Quick` / `Think it through` — the second routes to your top-tier model with a larger reasoning budget. Tooltip: *"Slower, but it checks its work."*

**Regenerate / Continue in a new thread from here** — the second one matters. It's how people fork a conversation without losing the original, and it's the thing you described wanting.

### 6.4 Guardrail copy

When someone asks for a guarantee:
> I can tell you what this period tends to favour and what it tends to punish. I can't tell you whether a specific thing will happen — nobody can, and an app that says otherwise is selling you something.

Medical / legal / financial:
> That one needs a doctor, not a chart. I can tell you when your energy tends to hold up better, but get the actual thing looked at.

Missing birth time:
> Your birth time isn't precise enough for me to answer at that level. I can answer at the Chapter level confidently — want that instead? `Yes` · `Fix my birth time`

---

## 7. NAV 4 — **You**

> # You
> **Sun Era · Venus Chapter** · born 14 Mar 1994, 06:12, Chennai

Sections:
- **Birth details** — date, time, place, `Birth time accuracy` *(the §0.1 setting, with the explanation)*
- **Your chart** — natal chart view, planet positions, whatever depth you support
- **Calculation** — Ayanamsa `Lahiri ▾` · House system `Whole Sign ▾` · Timezone. Sub-label: *"Change these only if you know why. Everything in the app recalculates."*
- **Display** — `Show Sanskrit terms` · `Reduce motion` · `Theme`
- **Shift Alerts** — channels, day-before toggle, quiet hours
- **Data** — `Export everything` · `Delete my account`

---

## 8. Shift Alerts — all channels

Same event, three lengths. The title you suggested is the right one and it should be identical everywhere so it becomes recognisable.

**Push**
> **What works for you just changed**
> Mars phase starts today. Push window — 12 days. Apply, ask, take the meeting.

**Push, day before**
> **Tomorrow, the timing turns**
> Your Mercury phase ends. Finish the writing today — tomorrow is for sending, not drafting.

**Email — subject:** `What works for you just changed`
**Preheader:** `Mars takes over today. Here's what to move on for the next 12 days.`
**Body:**
> **Your plan just entered its Push phase.**
> **05 Nov → 17 Nov · 12 days · Mars**
>
> Until yesterday, your chart favoured preparation — drafting, sharpening, getting the story right. That window closed. For the next twelve days, directness gets results that patience won't.
>
> **Move on this**
> · Send the applications you've been holding
> · Ask for the referral by voice, not email
> · Say your number first
>
> **Don't**
> · Redesign the CV again
> · Send anything written after 10pm
>
> `Open your plan →`
>
> *You're getting this because Shift Alerts are on for "Land a senior PM role." `Change` · `Turn off`*

**SMS**
> What works for you just changed. Push phase, 12 days: apply, ask, meet. Don't redraft. [link]

**In-app card** *(top of plan)*
> ● **New phase — Push**
> Mars · 12 days · started today
> `See what changed` · `Dismiss`

---

## 9. Microcopy library

**Loading**
`Reading your chart…` · `Calculating your periods…` · `Finding your windows…`

**Errors**
> **Couldn't reach your chart data.** Your timeline might be a few minutes stale. `Retry`

> **We need your birth place.** Timing calculations shift by hours without it. `Add it`

> **Mentor is thinking slowly right now.** High load. `Try again` · `Switch to Quick`

**Toasts**
`Plan archived` · `Phase note saved` · `Shift Alerts on for this plan` · `Copied`

**Confirms** — always name the thing being destroyed, always say whether it's reversible. (See §4.7 for the pattern.)

**First-run tooltip on the Wheel** — one time only:
> **Five rings, five speeds.**
> The inside ring is your Era — it lasts years. The outside hairline is your Pulse — it turns over in hours. Tap any ring to read it.
> `Got it`

---

## 10. Mentor — how to build the "smartest model" part

You want the model to reason, and to decide on its own which of your APIs to call. That's tool use. The architecture that gets you there:

**10.1 — Two models, not one.**
- **Top-tier reasoning model** for every user-facing answer, with tool use enabled and a generous thinking budget on `Think it through`.
- **Small fast model** for thread titles, category classification, and the safety pre-check. Never let the expensive model write a six-word title.

Current model IDs and capabilities change often — pull them from the docs rather than hardcoding from memory: https://docs.claude.com/en/docs/about-claude/models/overview and https://docs.claude.com/en/docs/build-with-claude/tool-use

**10.2 — Expose your backend as tools with tight schemas.**
Suggested surface:
```
get_natal_chart()
get_current_dashas(levels: 1..5)
get_dasha_at(date)
get_dasha_range(start, end, level)
get_next_turns(count, level)
get_transits(date)
list_plans() / get_plan(id)
search_knowledge(query)      ← your own interpretive corpus
```
Each tool description should say *when to use it*, not just what it returns. `get_dasha_at` → *"Use whenever the user names a specific date, month, or year, including 'next March' or 'my birthday.'"* Model routing quality lives almost entirely in tool descriptions.

**10.3 — Inject live state every turn.** Don't make the model call a tool to learn what today is. Prepend a compact context block to the system prompt on every request:
```
TODAY: 2026-07-29
USER: Era Sun (ends 2030-09-14) · Chapter Venus (ends 2027-11-11)
      Season Mercury (ends 2026-08-14) · Phase Ketu · Pulse Moon
BIRTH TIME CONFIDENCE: to the minute
ACTIVE PLANS: "Land a senior PM role" — Phase 3 Push, ends 2026-11-17
```
This alone removes most unnecessary tool calls and stops the "what year is it" failure mode.

**10.4 — System prompt rules that matter:**
1. Never invent chart values. If a tool didn't return it, say you don't have it.
2. Plain language first, Sanskrit second, and only if the user used it first.
3. Conditions, not predictions. Never guarantee an outcome.
4. Match the app's vocabulary exactly — King, Prime Minister, Governor, Magistrate, Messenger, Advantage, Obstacle, Turn. Never say Era/Chapter/Season/Phase/Pulse or Tailwind/Headwind; those were superseded.
5. If birth-time confidence is low, refuse Phase and Pulse level answers and offer the Chapter level instead.
6. No medical, legal, or financial directives. Redirect to a professional and answer only the timing question.
7. Short answers by default. Expand when asked.

**10.5 — Thread memory.** Send full history under ~30 turns. Beyond that, keep the last 15 verbatim and replace the earlier ones with a rolling summary generated by the small model. Always re-inject the §10.3 state block fresh — never let a stale copy from turn 2 survive to turn 40.

---

## 11. Open decisions for you

1. **Does the Wheel show *now* or the *plan*?** On Planner I've made the rings phases; on Timeline they're dashas. Same component, two data sources. Confirm you want that, because it doubles the component's spec.
2. **What happens when a plan outlives its Era?** A one-year plan can cross a Turn at Chapter level. Currently I've assumed you re-plan silently at generation time — you may want an explicit "this plan crosses a major turn" flag on the plan card.
3. **Chart-level nuance.** Everything above is dasha-only. Real interpretation depends on house placement, dignity, and aspects — same Venus Chapter reads very differently for two people. Decide now whether the Advantage/Obstacle content is (a) generic per planet, (b) generic per planet × house, or (c) generated per user by the model. (a) ships fastest; (c) is the actual product. You can ship (a) and swap in (c) behind the same strings.
4. **SMS is expensive and gets muted.** Consider shipping it as a paid-tier feature rather than a checkbox everyone ticks and then ignores.
