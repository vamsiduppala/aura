# aura — Product & Engineering Spec (owner's brief, verbatim source of truth)

> Mobile astrology app on a real Vedic (Jyotish) engine that never shows the user a
> planet name, chart, or piece of jargon. Simple surface (3–4 taps, one honest reading
> a day, one thing to do). Deep, accurate engine underneath.

## 1. Product principles (do not violate)
1. **Simple surface, deep core.** User sees 9 plain-language "energies" + a few screens.
   All astrology (planets, houses, dashas, degrees) stays under the hood. No jargon in UI.
2. **Resonant, not generic.** Readings computed from real birth data + tuned by an optional
   daily check-in. Never fortune-cookie. Specificity comes from the math.
3. **Honest, not flattering.** Every reading pairs a **gift** with a **trap** (a real
   thinking flaw for the period). The mix makes it trustworthy.
4. **Agency and an exit, never doom.** Tendencies/energies with a way through. Never predict
   disaster, death, illness, or dated catastrophe. Every heavy period shows its exit.
5. **Healthy remedies only.** Free, behavioral, good-for-you (sleep, light, movement,
   journaling, hydration, one honest conversation, single-tasking, nature). Never gems to
   buy, fear upsells, paid rituals, medical.
6. **No dark patterns.** One meaningful reading/day. No infinite scroll, streak-shaming,
   manipulative notifications. Retention from usefulness.
7. **Privacy first.** Birth data local, encrypted at rest, one-tap delete, never sold/shared.

## 2. The 9 Energies (ONLY vocabulary the user sees)
| # | Energy | Meaning shown | Graha (internal) | Color |
|---|--------|---------------|------------------|-------|
| 1 | Main Character | being seen · identity · recognition | Sun | `--main` #FFD070 |
| 2 | Big Feelings | your feelings · comfort · moods | Moon | `--feel` #8FB7FF |
| 3 | Fired Up | drive · courage · heat · action | Mars | `--fire` #FF6E58 |
| 4 | Busy Mind | thinking · talking · learning · deals | Mercury | `--mind` #5FE0C0 |
| 5 | Green Light | lucky growth · opportunity · expansion | Jupiter | `--grow` #7ED69B |
| 6 | Soft Spot | love · charm · beauty · pleasure | Venus | `--love` #F49CC9 |
| 7 | Heavy Lifting | discipline · pressure · the long build | Saturn | `--build` #8E93C8 |
| 8 | Never Enough | restless hunger · craving · overthinking | Rahu | `--crave` #AE8FE6 |
| 9 | Letting Go | detachment · endings · release | Ketu | `--let` #A6ABB8 |

App describes user as a **blend of two energies**: **Major** = current Mahadasha lord
(multi-year season); **Passing** = current Antardasha (finer) lord (weeks–months). The
aura orb is a gradient between the two energies' colors.

## 3. Sacred architecture — exactly 108 layers
108 = 27 nakshatras × 4 padas = 9 grahas × 12 bhavas. We implement the second:
**108-Layer Signal Lattice = 9 energies × 12 life-houses.** 108 scored signals collapse
upward into 9 energy scores + 12 life-area scores.

Tier stack:
- Tier 0 Astronomy core → sidereal positions (Swiss Ephemeris)
- Tier 1 Chart core → Lagna, whole-sign houses, nakshatra+pada, dignities, aspects
- Tier 2 Time core → Vimshottari dasha (5 levels) + transits (gochara)
- Tier 3 108 Signal Lattice → 9×12 scored signals (the heart)
- Tier 4 Aggregation → 108 → 9 energy scores + 12 area scores + current blend
- Tier 5 Synthesis → reading beats, forecasts, expanded readings, remedies
- Tier 6 Content & tone → template bank + variation + optional guarded LLM polish
- Tier 7 UI/UX → the 7 screens
- Tier 8 Safety/privacy → guardrails, disclaimers, data handling

## 4. Computation core (Tiers 0–2) — deterministic & testable
### 4.1 Birth-data resolution
Inputs: date, time (or "unknown"), place. Geocode → lat/lng + historically-correct
tz/offset (DST matters). Compute Julian Day (UT). Unknown time → solar chart (12:00 local),
`precision: "solar"`: still compute Moon nakshatra + dasha from noon Moon (lower confidence);
don't show high-confidence house/life-area claims; user can add time later.

### 4.2 Ephemeris (Tier 0)
Swiss Ephemeris. Sidereal mode `SE_SIDM_LAHIRI` (Lahiri/Chitrapaksha ayanamsa). Sidereal
longitudes for Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, and node (Rahu = mean or
true; **Ketu = Rahu + 180°**; default true node, configurable). Capture retrograde and
optionally combustion (within ~8–12° of Sun). Moshier mode acceptable for v1.

### 4.3 Chart construction (Tier 1)
- Ascendant (Lagna): sidereal ascendant; its sign = 1st house.
- Houses = **whole sign**: `house = ((planet_sign − lagna_sign) mod 12) + 1`.
- Nakshatra + pada of Moon: nakshatra spans 13°20′, pada 3°20′.
  `nak = floor(moon_long / 13.3333)`; `pada = floor((moon_long mod 13.3333)/3.3333)+1`.
- Dignity/strength per planet (Appendix B): exaltation, own, moolatrikona, friend/enemy,
  debilitation, retro, combustion → scalar ∈ ~[−1,+1]. v1 dignity-based; v2 Shadbala.
- Aspects (graha drishti): all aspect the 7th; Mars +4th/8th; Jupiter +5th/9th; Saturn
  +3rd/10th; Rahu (optional) 5th/9th. Record aspected houses.
- Functional benefic/malefic for the Lagna: trine lords (1,5,9) benefic-leaning; dusthana
  lords (6,8,12) malefic-leaning; combine with natural nature. Store polarity per planet.

### 4.4 Vimshottari Dasha engine (Tier 2) — the spine (must be correct)
- Order & years: Ketu 7 · Venus 20 · Sun 6 · Moon 10 · Mars 7 · Rahu 18 · Jupiter 16 ·
  Saturn 19 · Mercury 17 (=120).
- Starting Mahadasha = lord of Moon's nakshatra (Appendix D).
- Balance at birth: elapsed fraction = `(moon_long − nak_start)/13.3333`; remaining first
  maha = `lord_years × (1 − elapsed)`; rest follow in order.
- Sub-periods (5 levels): Maha → Antar → Pratyantar → Sookshma → Prana. Each sub length =
  `parent_length × sub_lord_years / 120`. Sub-order starts from parent's own lord, cycles
  the 9 in Vimshottari order.
- Year length: 365.25-day solar year (config constant).
- API: `getStack(date)` → {maha,antar,pratyantar,sookshma,prana}; `getTransitions(from,to,
  level)` → ordered {lord,start,end}; precompute full 5-level tree at onboarding + cache.

### 4.5 Transit / Gochara engine (Tier 2) — daily novelty
Daily sidereal positions (recompute each day; cheap). Flag relative to natal Moon sign +
Lagna: **Sade Sati** (Saturn in 12th/1st/2nd from natal Moon, ~7.5y; flag rising/peak/
setting); Jupiter's house from Moon/Lagna; transiting Moon's sign each day (~2.25-day
texture). Output per-graha, per-house transit weight to modulate the lattice.

**Validation (mandatory):** unit-test dasha engine vs ≥3 known charts (maha/antar dates
within a day). Test whole-sign houses + nakshatra vs known charts.

## 5. 108 Signal Lattice (Tier 3) — the heart
9×12 matrix `L[energy][house]`, each cell "what this energy is doing in this area now."
### 5.1 Static cell (natal)
```
influence(P,H) = w_occupy if P in H (1.0) + w_lordship if P rules H (0.7) + w_aspect if P aspects H (0.4)
strength(P)    = dignity/combustion/retro scalar
polarity(P)    = functional benefic(+)/malefic(−) for Lagna
cell_static(P,H) = influence × strength × polarity × house_nature_weight(H)  // 6/8/12 weighted for challenge
```
### 5.2 Temporal modulation (dasha + transit + check-in)
```
dasha_weight(P)   = m1 maha + m2 antar + m3 pratyantar + m4 sookshma + m5 prana  (1.0,.6,.35,.2,.1)
transit_weight(P,H)= t1×(P transiting H from Moon/Lagna) + t_sadesati if SadeSati & P==Saturn
checkin_weight(P) = small nudge from optional check-in
signal(P,H) = cell_static(P,H) × (1 + α·dasha_weight + β·transit_weight) × (1 + γ·checkin_weight)
```
α=1.5, β=0.8, γ=0.3 (global knobs, tune).
### 5.3 Aggregation (Tier 4)
```
energyScore[P] = Σ_H signal(P,H)          // 9 numbers
houseScore[H]  = Σ_P signal(P,H)          // 12 numbers
majorEnergy    = maha lord
passingEnergy  = argmax over {antar,pratyantar} energies, or antar lord by default
dominantAreas  = top houseScore houses → life areas
```
Tuple (majorEnergy, passingEnergy, dominantAreas, dashaStack, transitFlags, checkin) = full
synthesis input. `computeReading(chart, date, checkin?) → ReadingInput`.

## 6. Synthesis (Tier 5)
### 6.1 Five reading beats
1. **Gift** — real opportunity in this energy (validating, true).
2. **Trap** — specific thinking flaw this energy/period produces (honest).
3. **Move** — single best action toward user's goal given hot life-area(s).
4. **Watch for** — likely friction (person/pattern/temptation), navigable.
5. **Remedy** — one free healthy behavioral action (Appendix E).
Select beats from template bank keyed by graha (multiple variants/beat), then specialize by
(a) hottest house/area, (b) user goal, (c) transit flags. Deterministic, specific, non-generic.

### 6.2 Forecasts (tabbed)
Four zoom levels with highlighted start/end dates:
- Daily → day-scale (Sookshma/Prana) ~next week.
- Weekly → Pratyantar-scale over ~2 months.
- Monthly → Antar-scale over coming months.
- Custom → user From/To; list every shift + count.
Major season change (Mahadasha flip) pinned at top across tabs. Tapping a shift → expanded
reading for that stretch, with dates + note on how it lands in the major season.

### 6.3 Content system & freshness
Base = deterministic template bank (JSON): quality, offline, free. Freshness = daily
transiting-Moon layer + optional check-in. Optional server LLM polish (Claude API) rewrites
selected beats under strict guardrail prompt (§11); never invents predictions. Ship
template-only first.

## 7. Data model (TypeScript) — see engine `src/types.ts`
Graha, Energy, BirthData, PlanetPos, Chart, DashaNode, DashaStack, TransitState, SignalCell,
ReadingInput, LifeArea, Checkin, Reading, ForecastPeriod. (Exact interfaces reproduced in code.)

## 8. Screens (Tier 7) — 7 screens
1. **Onboarding** — birth date, time (+ "I don't know my time" toggle), place search; "What
   are you building?" (Career/Wealth/Love/Health/Self) + name-your-goal; reassurance line;
   CTA "Read my energy". Chart computed + cached here.
2. **Today (home)** — aura orb (major+passing gradient), two energy labels + glosses, one
   headline, today's remedy pill, CTA "Open today's reading".
3. **The reading** — five beats with colored markers; remedy = highlighted card w/ "mark done".
4. **Daily check-in** — one-tap mood chips + one focus chip; tunes reading; "skip — read cold".
5. **Forecast** — tabbed timeline (Daily/Weekly/Monthly/Custom), pinned major change +
   start/end chips; rows tappable → expanded.
6. **Expanded reading** — full period reading (from any shift), start/end dates + "how it
   lands in your season" note.
7. **Blueprint** — core/standing energies as a clean shareable card (identity + quiet growth
   loop). Derive from strongest natal placements (Lagna lord, Moon-sign lord, most-dignified),
   rendered as energies.
Nav: Today = home; Forecast + Blueprint peers; Reading/Expanded pushed; Check-in optional.

## 9. Design tokens (Tier 7)
Palette: ink `#09080F`, card `rgba(255,255,255,.035)`, hairline `rgba(255,255,255,.09)`,
text `#EDEAF6`, dim `#B4AFC6`, faint `#7C7791`. Energy hues per §2. Deep-space, soft luminous
gradients, subtle film grain, generous negative space — not clip-art cosmic, not black+acid-accent.
Two-tone aura orb is the signature; keep everything else quiet.
Type: display = *Instrument Serif* (oracle voice, sparing); UI/labels = *Space Grotesk* (caps
for MAJOR ENERGY/STARTS/ENDS); body = *Inter*.
Aura orb: circle, two radial gradients (energy1 top-left, energy2 bottom-right), soft outer
glow, inner rim highlight, faint rotating sheen, slow breathe scale. Respect `prefers-reduced-motion`.
Motion: restrained. Page-load settle, tab transitions, tap feedback.

## 10. Tech stack (recommended)
App: React Native + Expo, TS. Astronomy+dasha: (rec v1) thin FastAPI+pyswisseph backend OR
on-device Swiss Ephemeris WASM + TS dasha engine (offline). Storage: local-first, cache static
chart (expo-sqlite / encrypted AsyncStorage), no account for MVP. Content: JSON template bank +
optional Claude polish behind backend (never raw PII). State: Zustand/Context.

## 11. Safety/ethics/privacy (Tier 8) — built in
1. No medical/psych/financial/legal advice. Reflection + entertainment. Gentle disclaimer in
   onboarding + settings. Money/health energies are prompts, not directives.
2. No deterministic doom. Never guaranteed bad outcomes/illness/death/dated catastrophe.
   Generator rejects/softens. Every heavy period includes its exit + agency.
3. Mental-health guardrails. Crisis/self-harm signals → supportive message + region help
   resources; never "read" it, never imply stars caused it, never diagnose/replace care.
4. Remedy safety. Only approved behavioral library (Appendix E). No purchases/fasting/extreme/
   medical. Never present remedy as cure.
5. Anti-dark-pattern. One reading/day. No loss-framed streaks, doomscroll, manipulative push.
   Optional single calm daily nudge.
6. Privacy & deletion. Encrypt at rest; one-tap delete-everything; never sell/share; minimize
   what leaves device.
7. LLM polish guardrail: forbid inventing predictions, medical/financial/deterministic claims,
   new remedies; constrain to rephrasing pre-selected beats in warm grounded non-doom voice.

## 12. Build phases & acceptance
- **Phase 1 Engine core.** Birth resolution + ephemeris + chart + Vimshottari 5-level + transits.
  Accept: dasha timelines match 3 known charts within a day; whole-sign houses + Moon nakshatra
  verified.
- **Phase 2 Lattice + synthesis.** 9×12 lattice, temporal modulation, aggregation, five-beat
  generator + template bank. Accept: two different charts → clearly different coherent readings;
  same chart two days differs via transit.
- **Phase 3 UI.** All 7 screens + tokens; tabbed forecast w/ pinned major change + dates;
  tappable shifts → expanded; aura orb w/ reduced-motion. Accept: real birth date flows
  onboarding→today→reading→forecast→expanded→blueprint, no jargon.
- **Phase 4 Content depth + check-in.** Fill bank (9 energies × 5 beats × area specializations);
  wire check-in modulation; remedy library. Accept: readings specific + non-repeating across a week.
- **Phase 5 Safety/privacy/polish.** Disclaimers, crisis handling, encryption + delete, optional
  guarded LLM polish, performance. Accept: all §11 items pass review checklist.
Testing throughout: unit tests for dasha math + house/nakshatra (golden-file vs reference charts);
snapshot tests for synthesis given fixed ReadingInput; no-jargon lint (fails if any planet/house/
Sanskrit term appears in user-facing strings).

## Appendix A — 12 houses → life areas
1 Self (body, vitality, identity) · 2 Money (wealth, speech, food, family, values) ·
3 Communication (courage, skills, siblings, effort, short trips) · 4 Home (mother, roots,
property, peace, vehicles) · 5 Creativity (romance, children, speculation, expression,
intelligence) · 6 Health (illness, debt, enemies, daily work, service, routines) ·
7 Partnership (marriage, partners, deals, public) · 8 Transformation (crises, inheritance,
longevity, occult, sudden change, depth) · 9 Luck (dharma, fortune, teachers, higher learning,
travel, beliefs, father) · 10 Career (status, reputation, action, authority) · 11 Gains (income,
network, elder siblings, hopes) · 12 Release (loss, expenses, rest, foreign, spirituality,
isolation, moksha).
House-nature: 6/8/12 dusthanas (challenge); 1/4/7/10 kendras (angles, strong); 1/5/9 trikonas
(trines, auspicious).

## Appendix B — grahas: dignity & significations
| Graha | Exalted | Debilitated | Own | Signifies |
|---|---|---|---|---|
| Sun | Aries 10° | Libra | Leo | soul, ego, authority, father, vitality |
| Moon | Taurus 3° | Scorpio | Cancer | mind, emotions, mother, comfort, public |
| Mars | Capricorn 28° | Cancer | Aries, Scorpio | energy, courage, drive, conflict, siblings |
| Mercury | Virgo 15° | Pisces | Gemini, Virgo | intellect, speech, commerce, analysis |
| Jupiter | Cancer 5° | Capricorn | Sagittarius, Pisces | wisdom, luck, expansion, wealth, children, teachers |
| Venus | Pisces 27° | Virgo | Taurus, Libra | love, beauty, pleasure, art, spouse, luxury |
| Saturn | Libra 20° | Aries | Capricorn, Aquarius | discipline, time, delay, endurance, karma, labor |
| Rahu | (Taurus/Gemini) | (Scorpio/Sag) | — | craving, obsession, ambition, illusion, foreign |
| Ketu | (Scorpio/Sag) | (Taurus/Gemini) | — | detachment, release, spirituality, past-karma, loss |
Natural benefics: Jupiter, Venus, Mercury(w/ benefics), waxing Moon. Natural malefics: Saturn,
Mars, Sun, Rahu, Ketu, waning Moon. Rahu/Ketu dignities configurable; default neutral.

## Appendix C — the 108 cells (curated themes)
(9 energies × 12 houses; each cell = energy verb applied to house domain; generator derives
uncurated cells from A×B, uses these as overrides. Full text in engine `src/content/cells.ts`.)

## Appendix D — Vimshottari reference
Order/years as §4.4. Nakshatra→starting maha lord (repeats every 9): Ashwini/Magha/Mula=Ketu;
Bharani/P.Phalguni/P.Ashadha=Venus; Krittika/U.Phalguni/U.Ashadha=Sun; Rohini/Hasta/Shravana=Moon;
Mrigashira/Chitra/Dhanishta=Mars; Ardra/Swati/Shatabhisha=Rahu; Punarvasu/Vishakha/P.Bhadrapada=
Jupiter; Pushya/Anuradha/U.Bhadrapada=Saturn; Ashlesha/Jyeshtha/Revati=Mercury.

## Appendix E — remedy library (healthy behavioral only, rotate variants)
- Sun/Main Character: morning sunlight within 30 min of waking; do one thing for its own sake.
- Moon/Big Feelings: one-line mood note at night; steady meals + water.
- Mars/Fired Up: hard physical exercise to burn heat; 24-hour rule before angry messages.
- Mercury/Busy Mind: single-task blocks, phone in another room; write the decision down.
- Jupiter/Green Light: pick ONE opportunity, decline the rest; teach/help someone.
- Venus/Soft Spot: one honest slightly-uncomfortable conversation; make something with your hands.
- Saturn/Heavy Lifting: one small consistent daily action for the streak; get outside, don't isolate.
- Rahu/Never Enough: fix sleep window (up early/down early) 7 days; cut screens before bed.
- Ketu/Letting Go: daily grounding (breath/walk/journal); one small thing connecting you to a person.
