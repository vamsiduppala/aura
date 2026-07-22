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
- [~] Ch 1 Basic Concepts (335–1313): nakshatras (Table 2) → `data/nakshatras.ts` DONE. TODO:
      chakras, vargas overview, solar/lunar calendar, nitya-yogas, karanas, hora, panchanga, ayanamsa
- [x] Ch 2 Rasis (1315–1484): all 12 signs (lord, element, modality, gender, guna, dosha, direction,
      varna, body-part, indications) → `data/rasis.ts`
- [x] Ch 3 Planets (1485–1919): characteristics 3.2 (nature, governance, cabinet, deity, gender,
      element, varna, guna, dhatu, taste, season, digbala, colour) → `data/grahas.ts`;
      dignities 3.3 (exalt/debil/own/moolatrikona Table 6) → `data/dignities.ts` + `classifyDignity()`
      in `interpret.ts` (resolves any placement to exalted/debil/MT/own/friend/neutral/enemy);
      relationships 3.4 (natural Table 7 + temporary + compound) → `data/relationships.ts`.
      API: `/dignities`, `/classify?graha=&sign=`, and `/interpret` now auto-derives dignity.
- [ ] Ch 4 Upagrahas (1920–2223): Sun-based + other upagrahas
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
- [x] Ch 8 Karakas (3114–3551): chara (8, AK..DK by longitude), sthira (relatives), naisargika
      (per-house significators) → `data/karakas.ts`
- [x] Ch 9 Arudha Padas (3552–4042): bhava arudha computation (verified against the book's
      Chart 1 — all 12 padas incl. 1st/7th→10th exception + dual-lord Aq/Sc handling),
      Table 18 names, AL/UL use → `data/arudhas.ts` (arudhaOf/allArudhas/arudhaTable).
      API: /arudhas (POST lagna+signs), /arudhas/names. TODO: graha arudhas (9.5)
- [x] Ch 10 Aspects & Argalas (4043–4620): graha drishti (7th + Mars/Jup/Sat specials),
      rasi drishti (modality rules), argala (2/4/11 primary + 5 secondary) & virodhargala
      (12/10/3/9) with meanings + Ketu/3rd-malefic notes → `data/aspects.ts` + compute
      helpers (grahaAspectsFrom, rasiDrishti, argalaOn). API: /aspects/graha, /aspects/rasi,
      /aspects/notes, /argala.
- [~] Ch 11 Yogas (4621–5363): Ravi (Vesi/Vosi/Ubhayachara/Budha-Aditya), Chandra (Sunapha/Anapha/
      Duradhara/Kemadruma/Chandra-Mangala/Adhi/Gajakesari), 5 Mahapurusha, Raja/Dhana/Vipareeta/
      Neechabhanga → `data/yogas.ts` (20 yogas, rule+effect). TODO: full Naabhasa (32) + more Raja variants
- [ ] Ch 12 Ashtakavarga (5364–7833): BAV/SAV/prastaara/sodhya pindas
- [~] Ch 13 Interpreting Charts (7834–8433): functional nature per lagna (Table 30) + yogakaraka
      + baadhaka rule → `data/functional.ts` DONE. TODO: analysis method (13.4) + examples
- [ ] Ch 14 Longevity (8434–8656): marakas, rudra/trishoola, three pairs, 8th-lord
- [ ] Ch 15 Strength of Planets/Rasis (8657–9318): avasthas, shadbala, co-lord/rasi strength

## Part 2 — Dasa Analysis
- [ ] Ch 16 Vimsottari Dasa (9345–9925)
- [ ] Ch 17 Ashtottari Dasa (9926–10082)
- [ ] Ch 18 Narayana Dasa (10083–11339)
- [ ] Ch 19 Lagna Kendradi Rasi Dasa (11340–11462)
- [ ] Ch 20 Sudasa (11463–11564)
- [ ] Ch 21 Drigdasa (11565–11727)
- [ ] Ch 22 Niryaana Shoola Dasa (11728–11993)
- [ ] Ch 23 Shoola Dasa (11994–12195)
- [ ] Ch 24 Kalachakra Dasa (12196–13163)

## Part 3 — Transit Analysis
- [~] Ch 25 Transits & Natal References (13172–15364): gochara favourable houses per planet from
      Moon + Sade Sati phase → `data/transits.ts` DONE. TODO: full result tables, vedha, ashtakavarga transit
- [ ] Ch 26 Transits: Miscellaneous (15365–16282): murthis, vedha, taras, latta, sarvatobhadra

## Part 4 — Tajaka Analysis
- [ ] Ch 27 Tajaka Chart Basics (16295–16620)
- [ ] Ch 28 Techniques of Tajaka (16621–17264): muntha, harsha/panchavargeeya bala, sahams
- [ ] Ch 29 Tajaka Yogas (17265–17434)
- [ ] Ch 30 Annual Dasas (17435–18098)
- [ ] Ch 31 Sudarsana Chakra Dasa (18099–18366)

## Part 5 — Special Topics
- [ ] Ch 32 Birthtime Error (18385–19046)
- [ ] Ch 33 Rational Thinking (19047–19182)
- [~] Ch 34 Remedial Measures (19183–19468): behavioural "good deeds" per planet (product-approved,
      healthy) + gemstone/deity as flagged REFERENCE-ONLY → `data/remedies.ts` DONE. Mantras
      (Devanagari) intentionally NOT encoded; product never recommends gems/fasting/rituals (§11.4).
- [ ] Ch 35 Mundane Astrology (19469–19798)
- [ ] Ch 36 Muhurta (19799–20090)
- [ ] Ch 37 Ethics of a Jyotishi (20091–20118)

## Part 6 — Real-life Examples (20119–21029)
- [ ] Example chart walk-throughs (reference only — not encoded as rules)

---

## Session log (append each session)
- **2026-07-22 S1:** Mapped the book (37 ch / 6 parts). Scaffolding `packages/knowledge` +
  `apps/api`. Starting Part 1 foundational data (grahas, rasis, bhavas, nakshatras).
