# Knowledge-base extraction tracker

Source: `vedic-astrology-an-integrated-approach2.md` (PVR Narasimha Rao, ~21k lines).
Goal: encode **every concept** as structured data + a query/interpretation engine in
`packages/knowledge`, exposed via `apps/api` (local HTTP), for the Cosmic Mentor.

**Method:** extract the astrological RULES/FACTS (traditional knowledge) as our own concise
structured data — never copy the book's prose. Each chapter → typed data module(s) + tests.

**Legend:** [x] done · [~] in progress · [ ] not started. Line ranges are the source map so a
resuming session can pick up exactly where it left off.

---

## Part 1 — Chart Analysis
- [~] Ch 1 Basic Concepts (335–1313): nakshatras (Table 2) → `data/nakshatras.ts`;
      **panchanga** — tithi (30, shukla/krishna), nitya-yoga (27, Table 5), karana (11,
      fixed+movable), hora (Chaldean planetary hour) → `data/panchanga.ts`, verified vs the
      book (nitya-yoga Ganda; Wed-16th hora → Moon). API: /panchanga, /hora.
      TODO: chakras, solar/lunar calendar detail, ayanamsa background
- [x] Ch 2 Rasis (1315–1484): all 12 signs (lord, element, modality, gender, guna, dosha, direction,
      varna, body-part, indications) → `data/rasis.ts`
- [x] Ch 3 Planets (1485–1919): characteristics 3.2 (nature, governance, cabinet, deity, gender,
      element, varna, guna, dhatu, taste, season, digbala, colour) → `data/grahas.ts`;
      dignities 3.3 (exalt/debil/own/moolatrikona Table 6) → `data/dignities.ts` + `classifyDignity()`
      in `interpret.ts` (resolves any placement to exalted/debil/MT/own/friend/neutral/enemy);
      relationships 3.4 (natural Table 7 + temporary + compound) → `data/relationships.ts`.
      API: `/dignities`, `/classify?graha=&sign=`, and `/interpret` now auto-derives dignity.
- [x] Ch 4 Upagrahas (1920–2223): 5 Sun-based (Dhuma/Vyatipaata/Parivesha/Indrachaapa/
      Upaketu — full longitude formulas) + 6 time-based (Kaala/Mrityu/Arthaprahaara/
      Yamaghantaka/Gulika/Maandi — day/night part-lord table + rising fraction; caller finds
      the rising lagna) → `data/upagrahas.ts`. Verified vs Example 6 + the Yamaghantaka
      11:15pm case. API: /upagrahas/sun, /upagrahas/parts, /upagrahas/fraction.
- [x] Ch 5 Special Lagnas (2224–2397): Bhava/Hora/Ghati (from Sun's sunrise longitude) +
      Sree lagna (Moon's nakshatra fraction) → `data/lagnas.ts`, verified against the book's
      worked examples (BL 10°17'Pi, HL 17°17'Aq, GL 21°47'Vi, SL 18°47'Pi). API: /lagnas/special
- [x] Ch 6 Divisional Charts (2398–2848): significations (Table 11) → `data/divisionals.ts`;
      **computation of all 20 vargas** (D-1..D-60, incl. unequal D-30 Trimsamsa & D-60) →
      `data/varga.ts` `vargaSign(longitude, divisor)` / `allVargas()`, verified against the
      book's worked examples (one D-27 book erratum documented). API: /varga, /vargas.
- [~] Ch 7 Houses (2849–3113): significations 7.2 + categories (kendra/trikona/dusthana/upachaya/
      maraka) + natural karakas + body-parts → `data/bhavas.ts` DONE. TODO: reference lagnas 7.3
      + interpretation engine (`interpret.ts`: interpretPlacement/interpretLagnaLord) DONE + API service
- [x] Ch 8 Karakas (3114–3551): chara (8, AK..DK) — now with `charaKarakas(longitudes)` that
      assigns them by descending karaka-degree (Rahu reversed), verified against the book's
      Chart 34 (Reagan) — plus sthira (relatives) & naisargika (per-house) → `data/karakas.ts`.
      API: POST /karakas/chara
- [x] Ch 9 Arudha Padas (3552–4042): bhava arudha computation (verified against the book's
      Chart 1 — all 12 padas incl. 1st/7th→10th exception + dual-lord Aq/Sc handling),
      Table 18 names, AL/UL use → `data/arudhas.ts` (arudhaOf/allArudhas/arudhaTable).
      API: /arudhas (POST lagna+signs), /arudhas/names, /arudhas/graha. Graha arudhas (9.5,
      Example 30) → grahaArudhas() also done.
- [x] Ch 10 Aspects & Argalas (4043–4620): graha drishti (7th + Mars/Jup/Sat specials),
      rasi drishti (modality rules), argala (2/4/11 primary + 5 secondary) & virodhargala
      (12/10/3/9) with meanings + Ketu/3rd-malefic notes → `data/aspects.ts` + compute
      helpers (grahaAspectsFrom, rasiDrishti, argalaOn). API: /aspects/graha, /aspects/rasi,
      /aspects/notes, /argala.
- [~] Ch 11 Yogas (4621–5363): Ravi (Vesi/Vosi/Ubhayachara/Budha-Aditya), Chandra (Sunapha/Anapha/
      Duradhara/Kemadruma/Chandra-Mangala/Adhi/Gajakesari), 5 Mahapurusha, Raja/Dhana/Vipareeta/
      Neechabhanga → `data/yogas.ts` (20 yogas, rule+effect); **Sankhya Naabhasa yogas (7)** —
      Gola/Yuga/Soola/Kedaara/Paasa/Daama/Veenaa by distinct-sign count → `data/naabhasa.ts`
      `sankhyaYoga()`, verified vs the Sri Rama example (6→Daama). API: /yogas/sankhya.
      TODO: 20 Aakriti (shape) Naabhasa yogas + more Raja variants
- [~] Ch 12 Ashtakavarga (5364–7833): Bhinnashtakavarga (per-planet bindus, BPHS benefic-
      point tables) + Sarvashtakavarga (sum, 337 invariant) → `data/ashtakavarga.ts`
      (standalone from the engine's copy). API: POST /ashtakavarga. TODO: prastaara,
      trikona/ekadhipatya sodhana, sodhya pindas.
- [~] Ch 13 Interpreting Charts (7834–8433): functional nature per lagna (Table 30) + yogakaraka
      + baadhaka rule → `data/functional.ts` DONE. TODO: analysis method (13.4) + examples
- [~] Ch 14 Longevity (8434–8656): marakas (2nd/7th houses + their lords), Rudra special
      8th house (Table 32), three-pairs longevity range (Table 33/34: short/middle/long)
      → `data/longevity.ts`. API: /longevity/marakas, /longevity/estimate. TODO: full
      strength-based Rudra/Maheswara selection (needs chart strengths + chara karakas)
- [~] Ch 15 Strength of Planets/Rasis (8657–9318): avasthas — Baladi (age, Table 35,
      verified), Jagradi (alertness) + Deeptadi (mood, dignity part) → `data/avasthas.ts`.
      API: /avastha. TODO: shadbala detail (engine has composite), Vimsopaka, co-lord/rasi
      strength, conjunction-based mood states (Vikala/Khala/Kopita/Lajjita)

## Part 2 — Dasa Analysis
- [x] Ch 16 Vimsottari Dasa (9345–9925): 120y, order+years (Table 38), nakshatra lords,
      birth-balance from Moon, dasa sequence, proportional antardasas (any depth) →
      `data/vimshottari.ts`, verified vs Example 50. API: /dasha/vimshottari
- [x] Ch 17 Ashtottari Dasa (9926–10082): 108y over 8 lords (no Ketu), unequal arcs
      (Table 39, Rahu wrap), birth balance, antardasas start AFTER the maha lord →
      `data/ashtottari.ts`, verified vs Example 59. API: /dasha/ashtottari
- [~] Ch 18 Narayana Dasa (10083–11339): full rasi-dasa progression (Brahma/Shiva/Vishnu
      motion, 9th-foot direction, Saturn/Ketu exceptions), dasa length (lord distance −1,
      count-1→12, exalt+1/debil−1), 2nd-cycle (12−len), equal antardasas → `data/narayana.ts`,
      verified vs Examples 63–67. API: /dasha/narayana/{progression,length,antardashas}.
      Caller supplies strength-based seed + dual-lord picks. TODO: varga Narayana (18.5)
- [x] Ch 19 Lagna Kendradi Rasi Dasa (11340–11462): quadrant-based (kendra/panaphara/
      apoklima) progression, direction by lagna sign parity (+Saturn/Ketu) → `data/rasidasha.ts`
      `lagnaKendradiDasa`, verified vs Example 76. API: /dasha/kendradi
- [x] Ch 20 Sudasa (11463–11564): Kendradi from Sree Lagna + first-dasa balance
      (30−SLdeg)/30 → `sudasa`, verified vs Example 77. API: /dasha/sudasa
- [x] Ch 21 Drigdasa (11565–11727): aspect-based from the 9th house (rasi drishti walk,
      foot-direction per house) → `drigdasa`, verified vs Example 80. API: /dasha/drigdasa
- [x] Ch 22 Niryaana Shoola Dasa (11728–11993): from the stronger 2nd/8th house (seed),
      forward/backward by seed sign parity, dasa years by modality (movable 7, fixed 8,
      dual 9); antardasas via Narayana rule → `data/rasidasha.ts` `niryaanaShoolaDasa`,
      verified vs Examples 84/85. API: /dasha/niryaana-shoola
- [x] Ch 23 Shoola Dasa (11994–12195): from the seed (stronger of lagna/7th), always
      zodiacal, 9 years each (gestation-based); 12 equal antardasas of 9 months →
      `data/rasidasha.ts` `shoolaDasa`/`shoolaAntardashas`, verified vs Examples 89/91.
      API: /dasha/shoola. (Death-timing; never surfaced as a prediction — ethics §37.)
- [x] Ch 24 Kalachakra Dasa (12196–13163): nakshatra-pada → 9-rasi run from the savya/
      apasavya 24-rasi wheel (main+mirrored, +9 per pada), fixed per-rasi years
      [7,16,9,21,5,9,16,7,10,4,4,10], Deha/Jeeva (reversed for apasavya), paramayush →
      `data/kalachakra.ts` `kalachakraPada`, verified vs Aswini pada 1 (Ar..Sg, 100y) &
      pada 2 (Table 43/44). API: /dasha/kalachakra. **Part 2 dasa systems COMPLETE.**

## Part 3 — Transit Analysis
- [~] Ch 25 Transits & Natal References (13172–15364): gochara favourable houses per planet from
      Moon + Sade Sati phase → `data/transits.ts` DONE. TODO: full result tables, vedha, ashtakavarga transit
- [~] Ch 26 Transits: Miscellaneous (15365–16282): 9-fold taras (Table 64), special
      nakshatras (karma/jaati/naidhana… 26.4.2), nakshatra-based aspects (26.5) → `data/taras.ts`
      (taraOf/specialNakshatra/nakshatraAspectsFrom), verified vs the Bill Gates example.
      API: /transit/{tara,special-nakshatras,nakshatra-aspects}. TODO: murthis, rasi-vedha,
      latta, body-part tables, sarvatobhadra chakra

## Part 4 — Tajaka Analysis
- [~] Ch 27 Tajaka Chart Basics (16295–16620): annual-chart concept (solar return). Muntha
      computation lives in Ch 28 module. TODO: exact solar-return time (engine territory)
- [~] Ch 28 Techniques of Tajaka (16621–17264): muntha (progressed lagna 1 rasi/yr), the six
      Tajaka aspects (trine/sextile/square/conjunction/opposition/semi-sextile) + deeptamsa
      orbs, and Harsha Bala (4×5-unit sources) → `data/tajaka.ts`, verified vs Example 119.
      API: /tajaka/{muntha,harsha,aspects}. Sahams (28.8): saham() point calc (A−B+C with
      day/night + 30° rule) + Table 74 subset (Punya/Vidya/Yasas/Mitra/…) → `data/sahams.ts`,
      verified vs the artha-saham example. API: /tajaka/saham, /tajaka/sahams. TODO: panchavargeeya bala
- [x] Ch 29 Tajaka Yogas (17265–17434): Ithasala (applying, faster-behind → fulfilment) vs
      Eesarpha (separating), poorna check, Nakta; Ishkavala/Induvara (house distribution);
      planet speed order → `data/tajakayoga.ts`, verified vs the Moon/Venus examples.
      API: /tajaka/{ithasala,distribution-yoga,yogas}
- [~] Ch 30 Annual Dasas (17435–18098): Mudda / Varsha Vimsottari dasa (Vimsottari
      compressed to 360 solar days — days = years × 3; first dasa from the Mudda number of
      the Moon-nakshatra lord + completed years) → `data/annualdasha.ts` `muddaDasa`,
      verified vs Example 122 (Rahu first, 42.66-day balance). API: /dasha/mudda.
      TODO: Patyayini dasa (patyamsa-based), Varsha Narayana
- [x] Ch 31 Sudarsana Chakra Dasa (18099–18366): one house per solar year, cycling every 12,
      judged from all three references (lagna/Moon/Sun); 12 one-month antardasas from the dasa
      sign → `data/sudarsana.ts`, verified vs 45th-year (9th house) & Example 126 (18th → 6th
      → Scorpio). API: /dasha/sudarsana, /dasha/sudarsana/all. **Part 4 Tajaka COMPLETE.**

## Part 5 — Special Topics
- [~] Ch 32 Birthtime Error (18385–19046): concept + rectification methods (event-based,
      special-lagna-based) → `data/reference.ts` BIRTHTIME_RECTIFICATION. API: /reference.
      (Exact rectification math is engine/ephemeris territory.)
- [x] Ch 33 Rational Thinking (19047–19182): principles (free will, data quality, discriminating
      techniques, cross-checking) → `data/reference.ts` RATIONAL_PRINCIPLES. API: /reference
- [~] Ch 34 Remedial Measures (19183–19468): behavioural "good deeds" per planet (product-approved,
      healthy) + gemstone/deity as flagged REFERENCE-ONLY → `data/remedies.ts` DONE. Mantras
      (Devanagari) intentionally NOT encoded; product never recommends gems/fasting/rituals (§11.4).
- [x] Ch 35 Mundane Astrology (19469–19798): principles (ingress/eclipse/founding charts,
      compressed dasas) → `data/reference.ts` MUNDANE_PRINCIPLES. API: /reference
- [x] Ch 36 Muhurta (19799–20090): per-task guidelines (Table 79 subset: tithi/weekday/
      nakshatra) + a computable quality check (guideline match + good tara + rikta flag) →
      `data/muhurta.ts` `muhurtaCheck`. API: /muhurta, /muhurta/guidelines
- [x] Ch 37 Ethics of a Jyotishi (20091–20118): encoded as ETHICS_PRINCIPLES (always positive;
      never scare; negatives only with a remedy) — directly backs aura's no-doom guardrail →
      `data/reference.ts`. API: /reference. **Part 5 essentially COMPLETE (Part 6 = examples).**

## Part 6 — Real-life Examples (20119–21029)
- [ ] Example chart walk-throughs (reference only — not encoded as rules)

---

## Session log (append each session)
- **2026-07-22 S1:** Mapped the book (37 ch / 6 parts). Scaffolding `packages/knowledge` +
  `apps/api`. Starting Part 1 foundational data (grahas, rasis, bhavas, nakshatras).
