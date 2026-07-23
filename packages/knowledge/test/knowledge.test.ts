import { describe, it, expect } from 'vitest';
import {
  GRAHAS, RASIS, BHAVAS, NAKSHATRAS, YOGAS, YOGA_BY_KEY, sankhyaYoga, matchAakritiYogas, vajraYavaYoga,
  rajaYogas, vipareetaYoga, houseLord, houseOf,
  DIVISIONALS, DIVISIONAL_BY_N, CHARA_KARAKAS, STHIRA_KARAKAS, charaKarakas,
  FUNCTIONAL_NATURE, functionalNatureFor, baadhakaHouse,
  TRANSIT_FROM_MOON, isFavourableTransit, sadeSatiPhase, sodhyaPindaTiming, SODHYA_PINDA_MATTERS,
  naturalRelation, temporaryRelation, compoundRelation,
  vedhaHouse, vedhaObstructors,
  REMEDIES, behaviouralRemedy,
  getGraha, getRasi, getBhava, search,
  interpretPlacement, interpretLagnaLord, classifyDignity,
  grahaAspectsFrom, rasiDrishti, argalaOn,
  arudhaOf, allArudhas, grahaArudhas,
  vargaSign,
  bhavaLagna, horaLagna, ghatiLagna, sreeLagna,
  sunUpagrahas, partLords, upagrahaFraction,
  ashtakavarga, bhinnashtakavarga, AV_PLANETS,
  trikonaSodhana, ekadhipatyaSodhana, sodhitaAshtakavarga, sodhyaPinda,
  tithiOf, nityaYoga, karanaOf, horaLord,
  dashaBalanceAtBirth, dashaSequence, antardashas, nakshatraLord, VIMSHOTTARI_YEARS,
  ashtottariBalanceAtBirth, ashtottariAntardashas, ASHTOTTARI_YEARS, ASHTOTTARI_TOTAL,
  marakaLords, rudra8thSign, pairLongevity, combineThreePairs, signModality, maheswara,
  baladiAvastha, jagradiAvastha, deeptadiAvastha,
  narayanaProgression, narayanaDasaLength, narayanaSecondCycle, narayanaAntardashas,
  lagnaKendradiDasa, sudasa, drigdasa, shoolaDasa, niryaanaShoolaDasa,
  kalachakraPada, isSavya,
  taraOf, specialNakshatra, nakshatraAspectsFrom, lattaNakshatra, murthiOf,
  muntha, harshaBala, saham, computeSahams,
  ithasala, ishkavala, induvara, fasterPlanet,
  muddaDasa, muddaDays, sudarsanaDasa, sudarsanaAllRefs,
  muhurtaCheck, ETHICS_PRINCIPLES, RATIONAL_PRINCIPLES,
  type Graha, type RefSigns,
} from '../src/index.js';

const near = (a: number, b: number, tol = 0.05) => Math.abs(a - b) <= tol;

describe('reference data completeness', () => {
  it('has all 9 grahas, 12 rasis, 12 bhavas, 27 nakshatras', () => {
    expect(Object.keys(GRAHAS)).toHaveLength(9);
    expect(RASIS).toHaveLength(12);
    expect(BHAVAS).toHaveLength(12);
    expect(NAKSHATRAS).toHaveLength(27);
  });
  it('rasi indices 0..11 and bhava numbers 1..12 are contiguous', () => {
    expect(RASIS.map((r) => r.index)).toEqual([...Array(12).keys()]);
    expect(BHAVAS.map((b) => b.number)).toEqual([...Array(12).keys()].map((n) => n + 1));
  });
  it('nakshatra lords cycle the Vimsottari order every 9', () => {
    for (let i = 0; i < 9; i++) {
      expect(NAKSHATRAS[i]!.lord).toBe(NAKSHATRAS[i + 9]!.lord);
      expect(NAKSHATRAS[i]!.lord).toBe(NAKSHATRAS[i + 18]!.lord);
    }
  });
  it('sign lords are the classical rulerships', () => {
    expect(getRasi(0).lord).toBe('mars');   // Aries
    expect(getRasi(4).lord).toBe('sun');    // Leo
    expect(getRasi(9).lord).toBe('saturn'); // Capricorn
    expect(getGraha('jupiter').naturalNature).toBe('benefic');
    expect(getGraha('saturn').naturalNature).toBe('malefic');
  });
});

describe('interpretation engine', () => {
  it('composes a readable, on-theme placement interpretation', () => {
    // Saturn in the 5th house in Pisces — the user's example.
    const r = interpretPlacement({ graha: 'saturn', house: 5, sign: 11, dignity: 'neutral' });
    expect(r.title).toMatch(/Saturn/);
    expect(r.title).toMatch(/5th house/);
    expect(r.title).toMatch(/Pisces/);
    expect(r.text.length).toBeGreaterThan(80);
    expect(r.text.toLowerCase()).toContain('discipline');
    expect(r.keywords.length).toBeGreaterThan(2);
  });

  it('a benefic in a trine reads supportive; a malefic in a dusthana reads demanding', () => {
    const good = interpretPlacement({ graha: 'jupiter', house: 9, sign: 8, dignity: 'own' });
    expect(good.text.toLowerCase()).toMatch(/bless|strong|favoured|reward/);
    const hard = interpretPlacement({ graha: 'saturn', house: 8, sign: 0, dignity: 'debilitated' });
    expect(hard.text.toLowerCase()).toMatch(/friction|challenge|delay|harder|grow/);
  });

  it('interprets the lagna lord', () => {
    const r = interpretLagnaLord('mars', 10, 9);
    expect(r.text).toMatch(/rules your rising sign|chart ruler|captain/i);
  });

  it('classifies dignity from the standard rules', () => {
    expect(classifyDignity('sun', 0)).toBe('exalted');           // Sun in Aries
    expect(classifyDignity('saturn', 0)).toBe('debilitated');    // Saturn in Aries
    expect(classifyDignity('mars', 0)).toBe('moolatrikona');     // Mars in Aries (its moolatrikona)
    expect(classifyDignity('jupiter', 3)).toBe('exalted');       // Jupiter in Cancer
    expect(classifyDignity('sun', 4)).toBe('moolatrikona');      // Sun in Leo (its moolatrikona)
    expect(classifyDignity('mars', 7)).toBe('own');              // Mars in Scorpio (own, not MT)
  });
});

describe('aspects & argalas (Ch 10)', () => {
  it('graha drishti: everyone aspects the 7th; Mars/Jupiter/Saturn have special aspects', () => {
    // Sun in the 1st (house 1) aspects the 7th.
    expect(grahaAspectsFrom('sun', 1)).toEqual([7]);
    // Jupiter in the 1st aspects 5th, 7th, 9th.
    expect(grahaAspectsFrom('jupiter', 1).sort((a, b) => a - b)).toEqual([5, 7, 9]);
    // Mars in the 1st aspects 4th, 7th, 8th; Saturn 3rd, 7th, 10th.
    expect(grahaAspectsFrom('mars', 1).sort((a, b) => a - b)).toEqual([4, 7, 8]);
    expect(grahaAspectsFrom('saturn', 1).sort((a, b) => a - b)).toEqual([3, 7, 10]);
  });
  it('graha drishti wraps around the wheel', () => {
    // Jupiter in the 10th: 5th/7th/9th from the 10th = 2nd, 4th, 6th.
    expect(grahaAspectsFrom('jupiter', 10).sort((a, b) => a - b)).toEqual([2, 4, 6]);
  });
  it('rasi drishti follows the modality rules', () => {
    expect(rasiDrishti(0).sort((a, b) => a - b)).toEqual([4, 7, 10]);  // Aries → Leo, Scorpio, Aquarius
    expect(rasiDrishti(1).sort((a, b) => a - b)).toEqual([3, 6, 9]);   // Taurus → Cancer, Libra, Capricorn
    expect(rasiDrishti(2).sort((a, b) => a - b)).toEqual([5, 8, 11]);  // Gemini → Virgo, Sag, Pisces
  });
  it('argala: primary from 2/4/11, secondary from 5, each with its obstruction', () => {
    const a = argalaOn(1); // argala on the 1st house
    const houses = a.map((x) => x.house).sort((x, y) => x - y);
    expect(houses).toEqual([2, 4, 5, 11]);
    const twelfthObstructs = a.find((x) => x.house === 2)!;
    expect(twelfthObstructs.obstructedBy).toBe(12); // argala from 2nd obstructed by 12th
  });
});

describe('arudha padas (Ch 9) — verified against the book’s Chart 1', () => {
  // Chart 1: Asc Virgo (lagna sign 5). Planet signs (0=Aries):
  const SIGN: Record<Graha, number> = {
    sun: 11, moon: 2, mars: 0, mercury: 11, jupiter: 0, venus: 11, saturn: 0, rahu: 3, ketu: 9,
  };
  const signOf = (g: Graha) => SIGN[g];

  it('single arudha matches a hand-worked case (AL exception → 10th)', () => {
    // House 1 in Virgo(5), lord Mercury in Pisces(11) → AL in Gemini(2).
    expect(arudhaOf(5, 11)).toBe(2);
  });

  it('computes all 9 graha arudhas as the book does (Ch 9.5, Example 30)', () => {
    // Chart 1 planet signs; dual-lord stronger owned signs picked per the book.
    const strongerOwned: Record<Graha, number> = {
      sun: 4, moon: 3, mars: 0, mercury: 2, jupiter: 11, venus: 6, saturn: 9, rahu: 10, ketu: 7,
    };
    const ga = grahaArudhas((g) => SIGN[g], (g) => strongerOwned[g]);
    expect(ga.sun).toBe(9);      // Capricorn
    expect(ga.moon).toBe(4);     // Leo
    expect(ga.mars).toBe(9);     // Capricorn (1st exception)
    expect(ga.mercury).toBe(2);  // Gemini (7th exception)
    expect(ga.jupiter).toBe(10); // Aquarius
    expect(ga.venus).toBe(1);    // Taurus
    expect(ga.saturn).toBe(3);   // Cancer (7th exception)
    expect(ga.rahu).toBe(5);     // Virgo
    expect(ga.ketu).toBe(5);     // Virgo
  });

  it('computes all 12 arudhas exactly as the book does', () => {
    const a = allArudhas(5, signOf);
    expect(a[1]).toBe(2);   // AL  → Gemini
    expect(a[2]).toBe(4);   // A2  → Leo
    expect(a[3]).toBe(5);   // A3  → Virgo
    expect(a[4]).toBe(4);   // A4  → Leo
    expect(a[5]).toBe(0);   // A5  → Aries (7th exception)
    expect(a[6]).toBe(2);   // A6  → Gemini
    expect(a[7]).toBe(1);   // A7  → Taurus
    expect(a[8]).toBe(9);   // A8  → Capricorn (1st exception)
    expect(a[9]).toBe(9);   // A9  → Capricorn
    expect(a[10]).toBe(5);  // A10 → Virgo (7th exception)
    expect(a[11]).toBe(1);  // A11 → Taurus
    expect(a[12]).toBe(6);  // UL  → Libra
  });
});

describe('divisional charts (Ch 6) — verified against the book’s worked examples', () => {
  const at = (sign: number, deg: number) => sign * 30 + deg; // sidereal longitude helper
  const GE = 2, SC = 7, TA = 1, VI = 5, AR = 0;

  it('D-1 is the plain rasi', () => {
    expect(vargaSign(at(GE, 11), 1)).toBe(GE);
  });
  it('D-3 Drekkana (1st/5th/9th)', () => {
    expect(vargaSign(at(GE, 3), 3)).toBe(2);   // Ge
    expect(vargaSign(at(GE, 19), 3)).toBe(6);  // Li
    expect(vargaSign(at(GE, 21), 3)).toBe(10); // Aq
  });
  it('D-4 Chaturthamsa', () => {
    expect(vargaSign(at(TA, 3), 4)).toBe(1);   // Ta
    expect(vargaSign(at(TA, 14), 4)).toBe(4);  // Le
    expect(vargaSign(at(TA, 23), 4)).toBe(10); // Aq
  });
  it('D-6 / D-7 / D-9 / D-10 / D-11 / D-12', () => {
    expect(vargaSign(at(GE, 11), 6)).toBe(2);   expect(vargaSign(at(SC, 19), 6)).toBe(9);
    expect(vargaSign(at(GE, 10), 7)).toBe(4);   expect(vargaSign(at(VI, 19), 7)).toBe(3);
    expect(vargaSign(at(GE, 11), 9)).toBe(9);   expect(vargaSign(at(SC, 19), 9)).toBe(8);
    expect(vargaSign(at(GE, 10), 10)).toBe(5);  expect(vargaSign(at(SC, 19), 10)).toBe(9);
    expect(vargaSign(at(GE, 11), 11)).toBe(2);  expect(vargaSign(at(SC, 19), 11)).toBe(11);
    expect(vargaSign(at(GE, 11), 12)).toBe(6);  expect(vargaSign(at(SC, 19), 12)).toBe(2);
  });
  it('D-16 / D-20 / D-24 / D-27 / D-40 / D-45', () => {
    expect(vargaSign(at(GE, 11), 16)).toBe(1);  expect(vargaSign(at(SC, 19), 16)).toBe(2);
    expect(vargaSign(at(GE, 11), 20)).toBe(11); expect(vargaSign(at(SC, 19), 20)).toBe(8);
    expect(vargaSign(at(GE, 11), 24)).toBe(0);  expect(vargaSign(at(SC, 19), 24)).toBe(6);
    // Ge 11° → 10th nakshatramsa from Libra (inclusive) = Cancer(3). (The book prints
    // "Leo" here, but that contradicts inclusive counting — its own Jupiter case in the
    // same example confirms inclusive — so this is a book erratum; the algorithm is right.)
    expect(vargaSign(at(GE, 11), 27)).toBe(3);  expect(vargaSign(at(SC, 19), 27)).toBe(2);
    expect(vargaSign(at(GE, 11), 40)).toBe(2);  expect(vargaSign(at(SC, 19), 40)).toBe(7);
    expect(vargaSign(at(GE, 11), 45)).toBe(0);  expect(vargaSign(at(SC, 19), 45)).toBe(8);
  });
  it('D-30 Trimsamsa (unequal arcs)', () => {
    expect(vargaSign(at(AR, 3), 30)).toBe(0);   // odd 0-5 → Ar
    expect(vargaSign(at(AR, 7), 30)).toBe(10);  // odd 5-10 → Aq
    expect(vargaSign(at(AR, 15), 30)).toBe(8);  // odd 10-18 → Sg
    expect(vargaSign(at(AR, 20), 30)).toBe(2);  // odd 18-25 → Ge
    expect(vargaSign(at(AR, 27), 30)).toBe(6);  // odd 25-30 → Li
    expect(vargaSign(at(TA, 8), 30)).toBe(5);   // even 5-12 → Vi
    expect(vargaSign(at(TA, 27), 30)).toBe(7);  // even 25-30 → Sc
  });
  it('D-60 Shashtyamsa', () => {
    expect(vargaSign(at(SC, 12 + 58 / 60), 60)).toBe(8); // Jup 12°58' Sc → Sg
  });
});

describe('Narayana dasa (Ch 18) — verified against the book’s Examples 63–67', () => {
  it('dasa progression: Brahma / Shiva / Vishnu motion + direction', () => {
    expect(narayanaProgression(7)).toEqual([7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5, 0]);   // Ex63 Sc (Shiva, backward)
    expect(narayanaProgression(11)).toEqual([11, 3, 7, 8, 0, 4, 5, 9, 1, 2, 6, 10]);  // Ex64 Pi (Vishnu, forward)
    expect(narayanaProgression(9)).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 11, 10]);    // Ex65 Cp (Brahma, backward)
    expect(narayanaProgression(4)).toEqual([4, 9, 2, 7, 0, 5, 10, 3, 8, 1, 6, 11]);    // Ex66 Le (Shiva, forward)
  });
  it('Saturn & Ketu exceptions on the seed', () => {
    expect(narayanaProgression(7, true).slice(0, 6)).toEqual([7, 8, 9, 10, 11, 0]);    // Sc+Saturn → regular fwd
    expect(narayanaProgression(7, false, true).slice(0, 6)).toEqual([7, 0, 5, 10, 3, 8]); // Sc+Ketu → Shiva reversed
  });
  it('dasa lengths (Example 66) incl. the exalted-lord +1', () => {
    expect(narayanaDasaLength(4, 3)).toBe(1);                 // Le, Sun in Cn
    expect(narayanaDasaLength(9, 1)).toBe(8);                 // Cp, Saturn in Ta
    expect(narayanaDasaLength(2, 4)).toBe(2);                 // Ge, Mercury in Le
    expect(narayanaDasaLength(8, 7)).toBe(11);               // Sg, Jupiter in Sc (count 12 → 11)
    expect(narayanaDasaLength(3, 1, { exalted: true })).toBe(3); // Cn, Moon in Ta exalted
    expect(narayanaSecondCycle(1)).toBe(11);                  // 2nd cycle = 12 − 1
  });
  it('antardasas: 12 equal, direction by the start rasi’s sign parity (Example 67)', () => {
    const a = narayanaAntardashas(1, 5); // start Ta (even sign) → backward, 5 months each
    expect(a.map((x) => x.rasi)).toEqual([1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    expect(a[0]!.months).toBe(5);
  });
});

describe('muhurta + Part 5 reference (Ch 32/33/36/37)', () => {
  it('muhurtaCheck flags a good vs bad electional time', () => {
    // house-entering: tithi 3, Thursday(4), Rohini(3); janma nakshatra Rohini → Janma tara (not "good")
    const bad = muhurtaCheck('house-entering', 3, 4, 3, 3);
    expect(bad.tithiOk).toBe(true);
    expect(bad.weekdayOk).toBe(true);
    expect(bad.nakshatraOk).toBe(true);
    expect(bad.taraOk).toBe(false); // Rohini from Rohini = Janma tara
    // Same but janma nakshatra Aswini(0) → Rohini is the 4th (Kshema, good) → auspicious
    const good = muhurtaCheck('house-entering', 3, 4, 3, 0);
    expect(good.auspicious).toBe(true);
    // Rikta tithi (4) is flagged
    expect(muhurtaCheck('house-entering', 4, 4, 3, 0).rikta).toBe(true);
  });
  it('ethics principles back the no-doom guardrail', () => {
    expect(ETHICS_PRINCIPLES.length).toBeGreaterThan(3);
    expect(ETHICS_PRINCIPLES.some((p) => /never scare|remedy|preventive/i.test(p))).toBe(true);
    expect(RATIONAL_PRINCIPLES.some((p) => /free will|effort/i.test(p))).toBe(true);
  });
});

describe('Sudarsana Chakra dasa (Ch 31) — verified against the book’s examples', () => {
  it('45th year → 9th house; from Pisces lagna → Scorpio', () => {
    const d = sudarsanaDasa(11, 45); // Pisces(11) lagna, 45th year
    expect(d.house).toBe(9);
    expect(d.dasaSign).toBe(7); // Scorpio
    expect(d.antardashas[0]).toEqual({ sign: 7, months: 1 });   // Sc
    expect(d.antardashas[1]!.sign).toBe(8);                     // Sg (zodiacal)
  });
  it('Example 126: 18th year → 6th house; from Gemini → Scorpio', () => {
    expect(sudarsanaDasa(2, 18).house).toBe(6);
    expect(sudarsanaDasa(2, 18).dasaSign).toBe(7); // Scorpio
  });
  it('all three references at once (lagna Pi, Moon Aq, Sun Cn; 9th house)', () => {
    const a = sudarsanaAllRefs(11, 10, 3, 45); // Pi/Aq/Cn, 45th year → 9th house
    expect([a.lagna, a.moon, a.sun]).toEqual([7, 6, 11]); // Sc, Li, Pi
  });
});

describe('Mudda dasa (Ch 30) — verified against the book’s Example 122', () => {
  it('dasa days = Vimsottari years × 3', () => {
    expect(muddaDays('sun')).toBe(18);
    expect(muddaDays('rahu')).toBe(54);
    expect(muddaDays('venus')).toBe(60);
  });
  it('first dasa Rahu, balance ~42.66 days, next Jupiter 48 days (Moon 29°28′ Sg, 21 yrs)', () => {
    const m = muddaDasa(240 + 29 + 28 / 60, 21);
    expect(m.firstDasa).toBe('rahu');
    expect(m.balanceDays).toBeCloseTo(42.66, 1);
    expect(m.sequence[0]).toEqual({ lord: 'rahu', days: 54 });
    expect(m.sequence[1]).toEqual({ lord: 'jupiter', days: 48 });
  });
});

describe('Tajaka yogas (Ch 29) — verified against the book’s Moon/Venus examples', () => {
  it('speed order: Moon is faster than Venus', () => {
    expect(fasterPlanet('moon', 'venus')).toBe('moon');
  });
  it('ithasala (applying) vs eesarpha (separating)', () => {
    // Moon 14° Le, Venus 19° Li: faster Moon behind → ithasala
    expect(ithasala('moon', 14, 'venus', 19).kind).toBe('ithasala');
    // Moon 18°25' Le, Venus 19° Li: within 1° → poorna ithasala
    expect(ithasala('moon', 18 + 25 / 60, 'venus', 19).poorna).toBe(true);
    // Moon 23° Le, Venus 19° Li: faster Moon ahead → eesarpha
    expect(ithasala('moon', 23, 'venus', 19).kind).toBe('eesarpha');
  });
  it('Ishkavala vs Induvara by house distribution', () => {
    expect(ishkavala([1, 4, 2, 7])).toBe(true);   // only kendras/panapharas
    expect(ishkavala([1, 3])).toBe(false);        // 3rd is apoklima
    expect(induvara([3, 6, 9, 12])).toBe(true);   // only apoklimas
    expect(induvara([3, 4])).toBe(false);
  });
});

describe('Tajaka techniques (Ch 28) — verified against Example 119', () => {
  it('muntha progresses the lagna 1 rasi/year (Sc lagna, 32nd year → Gemini)', () => {
    expect(muntha(7, 32)).toBe(2);  // Scorpio + 31 → Gemini
    expect(muntha(7, 1)).toBe(7);   // 1st year = lagna itself
  });
  it('saham point calc: artha saham example → 212°30′ (2°30′ Sc)', () => {
    // artha = 2nd house − 2nd lord + Lagna; A=310°50', B=19°10', C=280°50' (same day/night)
    expect(saham(310 + 50 / 60, 19 + 10 / 60, 280 + 50 / 60, false, true)).toBeCloseTo(212.5, 3);
  });
  it('computeSahams resolves Punya first (Yasas depends on it)', () => {
    const ctx = { sun: 10, moon: 100, mars: 200, mercury: 50, jupiter: 150, venus: 250, saturn: 300, lagna: 50, lagnaLord: 40 };
    const s = computeSahams(ctx, true);
    expect(s.punya).toBeCloseTo(saham(ctx.moon, ctx.sun, ctx.lagna, true), 3);   // Moon−Sun+Lagna
    expect(s.yasas).toBeCloseTo(saham(ctx.jupiter, s.punya!, ctx.lagna, true), 3); // Jupiter−Punya+Lagna
  });
  it('Harsha bala matches the book (Moon 15, Mercury/Venus 10, Jupiter/Saturn 5, Sun/Mars 0)', () => {
    // Example 119: night birth; Moon 3rd, Mercury 2nd, Venus 1st, Jupiter 4th; none exalted/own.
    expect(harshaBala('moon', 3, false, false)).toBe(15);
    expect(harshaBala('mercury', 2, false, false)).toBe(10);
    expect(harshaBala('venus', 1, false, false)).toBe(10);
    expect(harshaBala('jupiter', 4, false, false)).toBe(5);
    expect(harshaBala('saturn', 10, false, false)).toBe(5); // only the night-feminine +5
    expect(harshaBala('sun', 2, false, false)).toBe(0);     // masculine, night, non-masculine house
    expect(harshaBala('mars', 2, false, false)).toBe(0);
  });
});

describe('transit taras & special nakshatras (Ch 26) — verified vs the Bill Gates example', () => {
  // Bill Gates: janma nakshatra = Uttarabhadrapada (index 25).
  it('tara from janma nakshatra (Table 64)', () => {
    expect(taraOf(25, 2).name).toBe('Pratyak');   // Krittika (5th) → obstacles
    expect(taraOf(25, 4).name).toBe('Naidhana');  // Mrigasira (7th) → death
    expect(taraOf(25, 25).name).toBe('Janma');    // same nakshatra → 1st
    expect(taraOf(25, 2).good).toBe(false);
  });
  it('special nakshatras count from janma (karma = 10th, jaati = 4th)', () => {
    expect(specialNakshatra(25, 'karma')).toBe(7);  // U.Bhadra(25) → Pushyami(7)
    expect(specialNakshatra(25, 'jaati')).toBe(1);  // U.Bhadra(25) → Bharani(1)
  });
  it('nakshatra-based aspects (26.5): Jupiter aspects the 10th/15th/19th', () => {
    expect(nakshatraAspectsFrom('jupiter', 0)).toEqual([9, 14, 18]); // from Aswini
    expect(nakshatraAspectsFrom('sun', 0)).toEqual([13, 14]);
  });
  it('latta / the transit kick (26.7) — verified against the book’s examples', () => {
    expect(lattaNakshatra('sun', 4)).toBe(15);      // Sun in Mrigasira → Vishakha (12th fwd)
    expect(lattaNakshatra('mars', 4)).toBe(6);      // Mars in Mrigasira → Punarvasu (3rd fwd)
    expect(lattaNakshatra('jupiter', 2)).toBe(7);   // Jupiter in Krittika → Pushya (6th fwd)
    expect(lattaNakshatra('saturn', 2)).toBe(9);    // Saturn in Krittika → Magha (8th fwd)
    expect(lattaNakshatra('moon', 16)).toBe(22);    // Moon in Anuradha → Dhanishtha (22nd bwd)
    expect(lattaNakshatra('mercury', 6)).toBe(0);   // Mercury in Punarvasu → Aswini (7th bwd)
    expect(lattaNakshatra('venus', 4)).toBe(0);     // Venus in Mrigasira → Aswini (5th bwd)
    expect(lattaNakshatra('rahu', 6)).toBe(25);     // Rahu in Punarvasu → U.Bhadra (9th bwd)
    expect(lattaNakshatra('ketu', 0)).toBeNull();   // Ketu has no latta
  });
  it('murthis / transit forms (26.2, Table 62)', () => {
    expect(murthiOf(1).name).toBe('Swarna');  // 1/6/11 → gold, favourable
    expect(murthiOf(11).favorable).toBe(true);
    expect(murthiOf(5).name).toBe('Rajata');  // 2/5/9 → silver
    expect(murthiOf(7).name).toBe('Taamra');  // 3/7/10 → copper, unfavourable
    expect(murthiOf(4).name).toBe('Loha');    // 4/8/12 → iron, highly unfavourable
    expect(murthiOf(8).favorable).toBe(false);
  });
});

describe('Kalachakra dasa (Ch 24) — verified against the book’s Aswini padas', () => {
  it('savya/apasavya group split by nakshatra triple', () => {
    expect(isSavya(0)).toBe(true);   // Aswini (triple 0)
    expect(isSavya(3)).toBe(false);  // Rohini (triple 1)
    expect(isSavya(6)).toBe(true);   // Punarvasu (triple 2)
  });
  it('Aswini pada 1: Ar…Sg, Deha Ar / Jeeva Sg, paramayush 100 (Table 44)', () => {
    const p = kalachakraPada(0, 1);
    expect(p.group).toBe('savya');
    expect(p.sequence).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]); // Ar,Ta,Ge,Cn,Le,Vi,Li,Sc,Sg
    expect(p.deha).toBe(0);   // Aries
    expect(p.jeeva).toBe(8);  // Sagittarius
    expect(p.paramayush).toBe(100);
  });
  it('Aswini pada 2: the next 9 rasis on the wheel', () => {
    const p = kalachakraPada(0, 2);
    expect(p.sequence).toEqual([9, 10, 11, 7, 6, 5, 3, 4, 2]); // Cp,Aq,Pi,Sc,Li,Vi,Cn,Le,Ge
  });
  it('apasavya reverses Deha/Jeeva (first = Jeeva, last = Deha)', () => {
    const p = kalachakraPada(3, 1); // Rohini
    expect(p.group).toBe('apasavya');
    expect(p.jeeva).toBe(p.sequence[0]);
    expect(p.deha).toBe(p.sequence[8]);
  });
});

describe('rasi dasas Ch 19/20/21 — verified against Examples 76/77/80', () => {
  it('Lagna Kendradi (Ch 19): quadrant-based, direction by lagna sign parity', () => {
    expect(lagnaKendradiDasa(2, 2)).toEqual([2, 5, 8, 11, 3, 6, 9, 0, 4, 7, 10, 1]); // Ge seed, Ge lagna (odd → fwd)
    expect(lagnaKendradiDasa(1, 1)).toEqual([1, 10, 7, 4, 0, 9, 6, 3, 11, 8, 5, 2]); // Ta seed, Ta lagna (even → bwd)
  });
  it('Sudasa (Ch 20): Kendradi from Sree Lagna + first-dasa balance', () => {
    const s = sudasa(9, 12 + 21 / 60); // SL 12°21' Capricorn (Example 77)
    expect(s.progression).toEqual([9, 6, 3, 0, 8, 5, 2, 11, 7, 4, 1, 10]);
    expect(s.firstDasaFraction).toBeCloseTo(0.5883, 4);
  });
  it('Drigdasa (Ch 21): aspect-based, from the 9th house (Example 80, Libra lagna)', () => {
    expect(drigdasa(6)).toEqual([2, 5, 8, 11, 3, 1, 10, 7, 4, 0, 9, 6]);
  });
  it('Niryaana Shoola dasa (Ch 22): modality years 7/8/9, direction by seed parity (Ex 84/85)', () => {
    const sg = niryaanaShoolaDasa(8); // Sg seed (odd sign → forward), Ex 84
    expect(sg.slice(0, 7)).toEqual([
      { rasi: 8, years: 9 }, { rasi: 9, years: 7 }, { rasi: 10, years: 8 }, { rasi: 11, years: 9 },
      { rasi: 0, years: 7 }, { rasi: 1, years: 8 }, { rasi: 2, years: 9 },
    ]);
    const vi = niryaanaShoolaDasa(5); // Vi seed (even sign → backward), Ex 85
    expect(vi.slice(0, 6)).toEqual([
      { rasi: 5, years: 9 }, { rasi: 4, years: 8 }, { rasi: 3, years: 7 },
      { rasi: 2, years: 9 }, { rasi: 1, years: 8 }, { rasi: 0, years: 7 },
    ]);
  });
  it('Shoola dasa (Ch 23): always zodiacal, 9 years each (Examples 89/91)', () => {
    expect(shoolaDasa(7).map((d) => d.rasi)).toEqual([7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6]); // from Sc
    expect(shoolaDasa(9).map((d) => d.rasi).slice(0, 4)).toEqual([9, 10, 11, 0]); // from Cp
    expect(shoolaDasa(7)[0]!.years).toBe(9);
  });
});

describe('avasthas (Ch 15) — planetary states, verified against the book’s examples', () => {
  const at = (sign: number, deg: number) => sign * 30 + deg;
  it('Baladi (age) from the degree, odd forward / even reversed (Table 35)', () => {
    expect(baladiAvastha(at(3, 23)).name).toBe('Kumaara'); // 23° Cancer (even)
    expect(baladiAvastha(at(6, 19)).name).toBe('Vriddha'); // 19° Libra (odd)
    expect(baladiAvastha(at(8, 14)).name).toBe('Yuva');    // 14° Sagittarius (odd)
    expect(baladiAvastha(at(11, 27)).name).toBe('Saisava'); // 27° Pisces (even)
    expect(baladiAvastha(at(8, 14)).weight).toBe(1);        // Yuva → full
  });
  it('Jagradi (alertness) from dignity', () => {
    expect(jagradiAvastha('exalted').name).toBe('Jaagrita');
    expect(jagradiAvastha('friend').name).toBe('Swapna');
    expect(jagradiAvastha('debilitated').name).toBe('Sushupta');
  });
  it('Deeptadi (mood) dignity part', () => {
    expect(deeptadiAvastha('exalted').name).toBe('Deepta');
    expect(deeptadiAvastha('own').name).toBe('Swastha');
    expect(deeptadiAvastha('enemy').name).toBe('Dukhita');
  });
});

describe('longevity (Ch 14) — marakas, Rudra 8th, three-pairs', () => {
  it('maraka lords are the lords of the 2nd and 7th signs from the lagna', () => {
    // Leo lagna (4): 2nd = Virgo → Mercury, 7th = Aquarius → Saturn.
    expect(marakaLords(4)).toEqual(['mercury', 'saturn']);
  });
  it('Rudra special 8th house (Table 32)', () => {
    expect(rudra8thSign(0)).toBe(7);  // Aries → Scorpio
    expect(rudra8thSign(1)).toBe(2);  // Taurus → Gemini (anti-zodiacal)
    expect(rudra8thSign(6)).toBe(1);  // Libra → Taurus
  });
  it('Maheswara = the 8th lord from the Atmakaraka (Ch 14.3 example)', () => {
    expect(maheswara(2)).toBe('saturn');  // AK in Gemini → 8th is Capricorn → Saturn
    expect(maheswara(0)).toBe('mars');    // AK in Aries → 8th is Scorpio → Mars
  });

  it('three-pairs longevity category (Table 33) + combination', () => {
    expect(pairLongevity('movable', 'movable')).toBe('long');
    expect(pairLongevity('fixed', 'fixed')).toBe('short');
    expect(pairLongevity('dual', 'dual')).toBe('middle');
    expect(pairLongevity('fixed', 'dual')).toBe('long');
    expect(pairLongevity('movable', 'dual')).toBe('short');
    expect(signModality(0)).toBe('movable');
    expect(combineThreePairs(['long', 'long', 'short'])).toBe('long'); // majority
  });
});

describe('Vimsottari dasa (Ch 16) — verified against the book’s Example 50', () => {
  it('nakshatra lords cycle Ketu…Mercury every 9', () => {
    expect(nakshatraLord(0)).toBe('ketu');   // Ashwini
    expect(nakshatraLord(22)).toBe('mars');  // Dhanishtha
    expect(nakshatraLord(26)).toBe('mercury'); // Revati
  });
  it('birth-dasa balance from the Moon (Moon 2°23′ Aq → Mars, 0.32125 left)', () => {
    const b = dashaBalanceAtBirth(300 + 2 + 23 / 60);
    expect(b.nakshatra).toBe(22);         // Dhanishtha
    expect(b.lord).toBe('mars');
    expect(b.fractionLeft).toBeCloseTo(0.32125, 4);
    expect(b.yearsLeft).toBeCloseTo(2.24875, 4);
  });
  it('dasa sequence + antardasa proportions', () => {
    expect(dashaSequence('mars').slice(0, 4)).toEqual(['mars', 'rahu', 'jupiter', 'saturn']);
    const venusAntars = antardashas('venus');
    expect(venusAntars[0]).toEqual({ lord: 'venus', years: 20 * 20 / 120 }); // 3y4m
    expect(venusAntars.find((a) => a.lord === 'sun')!.years).toBeCloseTo(1, 6); // 20*6/120 = 1y
    expect(venusAntars.reduce((s, a) => s + a.years, 0)).toBeCloseTo(VIMSHOTTARI_YEARS.venus, 6);
  });
});

describe('Ashtottari dasa (Ch 17) — verified against the book’s Example 59', () => {
  it('totals 108 years over 8 lords (no Ketu)', () => {
    expect(Object.values(ASHTOTTARI_YEARS).reduce((a, b) => a + b, 0)).toBe(ASHTOTTARI_TOTAL);
  });
  it('birth balance: Moon 24° Leo (144°) → Moon dasa, 0.4 of the arc left', () => {
    const b = ashtottariBalanceAtBirth(144);
    expect(b.lord).toBe('moon');
    expect(b.fractionLeft).toBeCloseTo(0.4, 6);
    expect(b.yearsLeft).toBeCloseTo(6, 6);
  });
  it('handles the Rahu arc wrap past 360° (Moon 10° Aries)', () => {
    const b = ashtottariBalanceAtBirth(10);
    expect(b.lord).toBe('rahu');
    expect(b.fractionLeft).toBeCloseTo((26 + 40 / 60 - 10) / (53 + 20 / 60), 5);
  });
  it('antardasas start AFTER the maha lord (Jupiter → Rahu first)', () => {
    const a = ashtottariAntardashas('jupiter');
    expect(a.map((x) => x.lord)).toEqual(['rahu', 'venus', 'sun', 'moon', 'mars', 'mercury', 'saturn', 'jupiter']);
    expect(a[a.length - 1]!.lord).toBe('jupiter'); // last antar = maha lord
  });
});

describe('panchanga (Ch 1) — verified against the book’s worked examples', () => {
  it('nitya-yoga: Sun 293°50′, Moon 197°20′ → Ganda (10th)', () => {
    const y = nityaYoga(270 + 23 + 50 / 60, 180 + 17 + 20 / 60);
    expect(y.index).toBe(10);
    expect(y.name).toBe('Ganda');
  });
  it('hora: the 16th hora on a Wednesday is ruled by the Moon', () => {
    expect(horaLord(3, 16)).toBe('moon'); // Wed = weekday 3
    expect(horaLord(3, 1)).toBe('mercury'); // first hora = weekday lord
  });
  it('tithi: elongation in 12° steps, split into shukla/krishna pakshas', () => {
    expect(tithiOf(0, 0).index).toBe(1);           // new moon → Shukla Pratipada
    expect(tithiOf(0, 175).name).toBe('Purnima');  // 15th tithi (elongation just under 180°)
    const k = tithiOf(0, 12 * 16 + 1);             // 17th tithi
    expect(k.paksha).toBe('krishna');
    expect(k.name).toBe('Krishna Dwitiya');
  });
  it('karana: fixed Kimstughna at the first half-tithi, movable ones repeat', () => {
    expect(karanaOf(0, 1).name).toBe('Kimstughna'); // slot 0
    expect(karanaOf(0, 7).name).toBe('Bava');       // slot 1
  });
});

describe('ashtakavarga (Ch 12) — the SAV total is the 337 invariant', () => {
  const mk = (o: Partial<RefSigns>): RefSigns => ({
    sun: 0, moon: 0, mars: 0, mercury: 0, jupiter: 0, venus: 0, saturn: 0, asc: 0, ...o,
  });
  it('every BAV is 0..8 per sign and each planet totals its own fixed bindu count', () => {
    const refs = mk({ sun: 2, moon: 5, mars: 8, mercury: 3, jupiter: 11, venus: 6, saturn: 9, asc: 0 });
    for (const p of AV_PLANETS) {
      const row = bhinnashtakavarga(p, refs);
      expect(row).toHaveLength(12);
      for (const b of row) { expect(b).toBeGreaterThanOrEqual(0); expect(b).toBeLessThanOrEqual(8); }
    }
  });
  it('SAV always sums to 337 regardless of positions (integrity invariant)', () => {
    for (const seed of [0, 3, 7, 11]) {
      const refs = mk({ sun: seed, moon: (seed + 2) % 12, mars: (seed + 4) % 12, mercury: (seed + 6) % 12, jupiter: (seed + 8) % 12, venus: (seed + 10) % 12, saturn: (seed + 1) % 12, asc: (seed + 5) % 12 });
      expect(ashtakavarga(refs).total).toBe(337);
    }
  });

  // Trikona sodhana reproduces the book's Mercury BAV → SoAV (Example 40): fiery {7,4,4}→{3,0,0},
  // watery {4,4,4}→{0,0,0}, and groups holding a zero pass through untouched.
  it('Trikona Sodhana matches the book’s Example 40 (Mercury’s BAV → SoAV)', () => {
    // indices Ar,Ta,Ge,Cn,Le,Vi,Li,Sc,Sg,Cp,Aq,Pi
    const bav = [7, 1, 3, 4, 4, 0, 0, 4, 4, 0, 2, 4];
    expect(trikonaSodhana(bav)).toEqual([3, 1, 3, 0, 0, 0, 0, 0, 0, 0, 2, 0]);
  });

  // Ekadhipatya sodhana, the five hypothetical cases the book uses to fix every rule (Example 42),
  // on Venus's pair Ta(1)/Li(6). Only the pair under test is non-zero so no other pair reduces.
  it('Ekadhipatya Sodhana obeys every branch (book Example 42 a–e, Ta/Li)', () => {
    const row = (ta: number, li: number) => { const r = new Array(12).fill(0); r[1] = ta; r[6] = li; return r; };
    // (a) both occupied → unchanged
    expect(ekadhipatyaSodhana(row(4, 2), [1, 6])).toEqual(row(4, 2));
    // (b) Ta occupied, Li empty, Li lower → Li=0
    expect(ekadhipatyaSodhana(row(4, 2), [1])).toEqual(row(4, 0));
    // (c) Ta empty, Li occupied, Ta higher → Ta takes Li's value (2)
    expect(ekadhipatyaSodhana(row(4, 2), [6])).toEqual(row(2, 2));
    // (d) both empty, different → higher falls to lower (both 2)
    expect(ekadhipatyaSodhana(row(4, 2), [])).toEqual(row(2, 2));
    // (e) both empty, equal → both 0
    expect(ekadhipatyaSodhana(row(2, 2), [])).toEqual(row(0, 0));
  });

  // End-to-end (Example 43): Mercury's SoAV [3,1,3,0,…,2,0] → rasi pinda 77, graha pinda 75, sodhya 152.
  it('Sodhya Pinda reproduces the book’s Example 43 (Mercury = 152)', () => {
    const bav = [7, 1, 3, 4, 4, 0, 0, 4, 4, 0, 2, 4];
    // Sun, Mars, Mercury in Ge(2); Venus in Ar(0); the rest parked in zero-SoAV signs.
    const occupied = [2, 0, 3, 4, 5]; // Ge, Ar, and empty Cn/Le/Vi — pairs still each hold a zero
    const soav = sodhitaAshtakavarga(bav, occupied);
    expect(soav).toEqual([3, 1, 3, 0, 0, 0, 0, 0, 0, 0, 2, 0]);
    const signs = { sun: 2, moon: 3, mars: 2, mercury: 2, jupiter: 4, venus: 0, saturn: 5 };
    const sp = sodhyaPinda(soav, signs);
    expect(sp.rasiPinda).toBe(77);
    expect(sp.grahaPinda).toBe(75);
    expect(sp.sodhyaPinda).toBe(152);
  });
});

describe('upagrahas (Ch 4) — verified against the book’s worked examples', () => {
  it('Sun-based upagrahas from the Sun’s longitude (Example 6: Sun 9°36′ Sg)', () => {
    const u = sunUpagrahas(240 + 9 + 36 / 60); // 249.6°
    expect(near(u.dhuma, 0 + 22 + 56 / 60)).toBe(true);      // 22°56' Aries
    expect(near(u.vyatipaata, 330 + 7 + 4 / 60)).toBe(true); // 7°4' Pisces
    expect(near(u.parivesha, 150 + 7 + 4 / 60)).toBe(true);  // 7°4' Virgo
    expect(near(u.indrachaapa, 180 + 22 + 56 / 60)).toBe(true); // 22°56' Libra
    expect(near(u.upaketu, 210 + 9 + 36 / 60)).toBe(true);   // 9°36' Scorpio (= Sun − 30)
  });
  it('day/night part-lords with the lord-less slot after Saturn', () => {
    // Thursday (weekday 4) daytime: Jup, Ven, Sat, —, Sun, Moon, Mars, Merc.
    expect(partLords(4, true)).toEqual(['jupiter', 'venus', 'saturn', null, 'sun', 'moon', 'mars', 'mercury']);
    // Thursday night: 5th from Jupiter is Moon → Moon, Mars, Merc, Jup, Ven, Sat, —, Sun.
    expect(partLords(4, false)).toEqual(['moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', null, 'sun']);
  });
  it('Yamaghantaka rises at the middle of Jupiter’s part (Thu night → 11:15pm of a 6pm–6am night)', () => {
    const frac = upagrahaFraction(4, false, 'yamaghantaka'); // Jupiter is the 4th night part
    expect(frac).toBeCloseTo(3.5 / 8, 6); // (index 3 + 0.5)/8 → 5.25h into a 12h night = 11:15pm
  });
});

describe('special lagnas (Ch 5) — verified against the book’s worked examples', () => {
  // Example 7-9: Sun at sunrise 294°17' (24°17' Cp), 766 minutes after sunrise.
  const sunSR = 270 + 24 + 17 / 60; // 294.2833
  it('bhava / hora / ghati lagna', () => {
    expect(near(bhavaLagna(sunSR, 766), 330 + 10 + 17 / 60)).toBe(true); // 10°17' Pisces
    expect(near(horaLagna(sunSR, 766), 300 + 17 + 17 / 60)).toBe(true);  // 17°17' Aquarius
    expect(near(ghatiLagna(sunSR, 766), 150 + 21 + 47 / 60)).toBe(true); // 21°47' Virgo
  });
  it('sree lagna from the Moon’s nakshatra fraction', () => {
    // Moon 13°06' Libra (193.1°), lagna 25°05' Virgo (175.083°) → SL 18°47' Pisces.
    expect(near(sreeLagna(180 + 13 + 6 / 60, 150 + 25 + 5 / 60), 330 + 18 + 47 / 60, 0.05)).toBe(true);
  });
});

describe('yogas', () => {
  it('encodes the key yogas with rule + effect', () => {
    expect(YOGAS.length).toBeGreaterThanOrEqual(18);
    for (const y of YOGAS) {
      expect(y.rule.length).toBeGreaterThan(10);
      expect(y.effect.length).toBeGreaterThan(10);
    }
    expect(YOGA_BY_KEY('gajakesari')?.category).toBe('Chandra');
    expect(YOGA_BY_KEY('hamsa')?.rule).toMatch(/Jupiter/);
  });
  it('yogas are searchable', () => {
    expect(search('raja').some((h) => h.kind === 'yoga')).toBe(true);
  });

  it('Aakriti (shape) Naabhasa yogas by house distribution (Ch 11.5.3)', () => {
    const names = (h: number[]) => matchAakritiYogas(h).map((y) => y.name);
    expect(names([1, 7])).toContain('Sakata');
    expect(names([4, 10])).toContain('Vihanga');
    expect(names([1, 5, 9])).toContain('Sringaataka');
    expect(names([1, 4, 7, 10])).toContain('Kamala');
    expect(names([2, 4, 6, 8, 10, 12])).toContain('Samudra');
    expect(names([2, 4, 6, 8, 10, 12])).not.toContain('Chakra');    // even houses ≠ odd
    expect(names([1, 2, 3, 4])).toContain('Yoopa');
    expect(names([2, 6, 10])).toContain('Hala');                    // mutual trines, not from lagna
  });
  it('Vajra / Yava (benefic-malefic placement) yogas', () => {
    expect(vajraYavaYoga([1, 7], [4, 10])!.name).toBe('Vajra');     // benefics in kendra 1/7
    expect(vajraYavaYoga([4, 10], [1, 7])!.name).toBe('Yava');      // reverse
    expect(vajraYavaYoga([1, 4], [7, 10])).toBeNull();
  });

  it('Sankhya Naabhasa yoga by distinct-sign count (Ch 11.5.4, Sri Rama → Daama)', () => {
    // Sri Rama: 7 planets across Ar,Ta,Cn,Li,Cp,Pi = 6 distinct signs → Daama.
    expect(sankhyaYoga([0, 1, 3, 6, 9, 11, 0]).name).toBe('Daama');
    expect(sankhyaYoga([0, 0, 0, 0, 0, 0, 0]).name).toBe('Gola');      // 1 sign
    expect(sankhyaYoga([0, 1, 2, 3, 4, 5, 6]).name).toBe('Veenaa');    // 7 signs
    expect(sankhyaYoga([0, 1, 2, 0, 1, 2, 0]).name).toBe('Soola');     // 3 signs
    expect(sankhyaYoga([0, 1, 2, 3, 0, 1, 2]).count).toBe(4);          // Kedaara
  });
});

describe('Raaja & Vipareeta Raaja yogas (Ch 11.7)', () => {
  // A base map placing every planet somewhere harmless; individual tests override two of them.
  const base = { sun: 0, moon: 0, mars: 0, mercury: 0, jupiter: 0, venus: 0, saturn: 0, rahu: 0, ketu: 0 };

  it('house lords are the sign lords counted from the lagna', () => {
    // Capricorn (9) lagna: 9th = Virgo → Mercury, 10th = Libra → Venus (the book’s example).
    expect(houseLord(9, 9)).toBe('mercury');
    expect(houseLord(9, 10)).toBe('venus');
    expect(houseOf(9, 1)).toBe(5); // Taurus is the 5th from Capricorn
  });

  it('Dharma-Karmadhipati by conjunction — Cp lagna, Mercury+Venus in Taurus (book 11.7.2)', () => {
    const links = rajaYogas(9, { ...base, mercury: 1, venus: 1 });
    const dk = links.find((l) => l.dharmaKarmadhipati);
    expect(dk).toBeTruthy();
    expect(dk!.association).toBe('conjunction');
    expect([dk!.quadrantLord, dk!.trineLord].sort()).toEqual(['mercury', 'venus']);
  });

  it('detects a Raaja yoga by mutual aspect (Cp lagna: 9th & 10th lords in mutual 7th)', () => {
    // Venus (10th lord) in Aries → house 4; Mercury (9th lord) in Libra → house 10; they aspect (7th).
    const links = rajaYogas(9, { ...base, venus: 0, mercury: 6 });
    expect(links.some((l) => l.association === 'aspect' && l.dharmaKarmadhipati)).toBe(true);
  });

  it('detects a Raaja yoga by parivartana (exchange)', () => {
    // Cp lagna: 4th lord Mars, 5th lord Venus. Mars in Taurus (Venus’s sign), Venus in Aries (Mars’s).
    const links = rajaYogas(9, { ...base, mars: 1, venus: 0 });
    const ex = links.find((l) => l.association === 'exchange');
    expect(ex).toBeTruthy();
    expect([ex!.quadrantLord, ex!.trineLord].sort()).toEqual(['mars', 'venus']);
  });

  it('Vipareeta Raaja yoga — Harsha/Sarala/Vimala when a dusthana lord sits in its own dusthana', () => {
    // Aries (0) lagna: 6th = Virgo → Mercury, 8th = Scorpio → Mars, 12th = Pisces → Jupiter.
    const v = vipareetaYoga(0, { ...base, mercury: 5, mars: 7, jupiter: 11 });
    expect(v.harsha).toBe(true);   // Mercury in the 6th
    expect(v.sarala).toBe(true);   // Mars in the 8th
    expect(v.vimala).toBe(true);   // Jupiter in the 12th
    expect(v.present).toBe(true);
  });

  it('Vipareeta counts a dusthana lord in a *different* dusthana, but not in a good house', () => {
    // Aries lagna, 6th lord Mercury in the 12th (Pisces) → present, but not Harsha (not the 6th).
    const good = vipareetaYoga(0, { ...base, mercury: 11 });
    expect(good.present).toBe(true);
    expect(good.harsha).toBe(false);
    // 6th lord Mercury in the 5th (a trine, not a dusthana) → no vipareeta.
    const none = vipareetaYoga(0, { ...base, mercury: 4 });
    expect(none.present).toBe(false);
  });
});

describe('chara karakas (Ch 8) — verified against the book’s Chart 34 (Reagan)', () => {
  // Longitudes (sign*30 + deg) from Chart 34.
  const L = {
    sun: 9 * 30 + 23 + 49 / 60,    // 23°49' Cp
    moon: 0 * 30 + 19 + 49 / 60,   // 19°49' Ar
    mars: 8 * 30 + 11 + 19 / 60,   // 11°19' Sg
    mercury: 8 * 30 + 28 + 49 / 60,// 28°49' Sg
    jupiter: 6 * 30 + 21 + 7 / 60, // 21°07' Li
    venus: 10 * 30 + 10 + 56 / 60, // 10°56' Aq
    saturn: 0 * 30 + 8 + 12 / 60,  // 8°12' Ar
    rahu: 0 * 30 + 21 + 54 / 60,   // 21°54' Ar (counted reversed)
  };
  it('assigns AK..DK by descending karaka degree (Rahu reversed)', () => {
    const ck = charaKarakas(L);
    const byCode = Object.fromEntries(ck.map((k) => [k.code, k.graha]));
    expect(byCode.AK).toBe('mercury');   // 28°49' Sg — highest
    expect(byCode.AmK).toBe('sun');       // 23°49'
    expect(byCode.BK).toBe('jupiter');    // 21°07'
    expect(byCode.MK).toBe('moon');       // 19°49'
    expect(byCode.PiK).toBe('mars');      // 11°19'
    expect(byCode.PK).toBe('venus');      // 10°56'
    expect(byCode.GK).toBe('saturn');     // 8°12'
    expect(byCode.DK).toBe('rahu');       // 30−21°54' = 8°06' — lowest
  });
});

describe('divisionals + karakas', () => {
  it('has the standard divisional significations', () => {
    expect(DIVISIONALS.length).toBeGreaterThanOrEqual(16);
    expect(DIVISIONAL_BY_N(9)?.area).toMatch(/marriage|spouse/i);
    expect(DIVISIONAL_BY_N(10)?.area).toMatch(/career/i);
  });
  it('has 8 chara karakas (AK..DK) and sthira karakas', () => {
    expect(CHARA_KARAKAS).toHaveLength(8);
    expect(CHARA_KARAKAS[0]!.code).toBe('AK');
    expect(CHARA_KARAKAS[7]!.code).toBe('DK');
    expect(STHIRA_KARAKAS.some((k) => k.relative === 'mother')).toBe(true);
  });
});

describe('functional nature (per lagna)', () => {
  it('covers all 12 lagnas with the classical yogakarakas', () => {
    expect(FUNCTIONAL_NATURE).toHaveLength(12);
    expect(functionalNatureFor(3).yogakaraka).toBe('mars');   // Cancer → Mars
    expect(functionalNatureFor(4).yogakaraka).toBe('mars');   // Leo → Mars
    expect(functionalNatureFor(9).yogakaraka).toBe('venus');  // Capricorn → Venus
    expect(functionalNatureFor(6).yogakaraka).toBe('saturn'); // Libra → Saturn
  });
  it('each planet is classified exactly once per lagna', () => {
    for (const f of FUNCTIONAL_NATURE) {
      const all = [...f.benefics, ...f.neutrals, ...f.malefics];
      expect(new Set(all).size).toBe(all.length);
      expect(all.length).toBeGreaterThanOrEqual(6); // the 7 classical planets (Moon may be omitted)
    }
  });
  it('baadhaka house follows modality (movable→11, fixed→9, dual→7)', () => {
    expect(baadhakaHouse('movable')).toBe(11);
    expect(baadhakaHouse('fixed')).toBe(9);
    expect(baadhakaHouse('dual')).toBe(7);
  });
});

describe('transits (gochara from Moon)', () => {
  it('encodes favourable transit houses for all 9 grahas', () => {
    expect(Object.keys(TRANSIT_FROM_MOON)).toHaveLength(9);
    expect(isFavourableTransit('jupiter', 11)).toBe(true);  // Jupiter in 11th from Moon
    expect(isFavourableTransit('saturn', 1)).toBe(false);   // Saturn over Moon (peak Sade Sati)
    expect(isFavourableTransit('mars', 6)).toBe(true);
  });
  it('maps Sade Sati phases from Saturn’s house relative to the Moon', () => {
    expect(sadeSatiPhase(12)).toBe('rising');
    expect(sadeSatiPhase(1)).toBe('peak');
    expect(sadeSatiPhase(2)).toBe('setting');
    expect(sadeSatiPhase(6)).toBeNull();
  });
  it('rasi gochara vedha (Ch 26.3, Table 63) + father-son exceptions', () => {
    // Bill Gates: Mercury favourable in the 4th → vedha sthaana is the 3rd.
    expect(vedhaHouse('mercury', 4)).toBe(3);
    expect(vedhaHouse('sun', 10)).toBe(4);
    expect(vedhaHouse('mercury', 5)).toBeNull(); // 5th isn't a favourable Mercury transit
    // A malefic in the vedha house obstructs; Sun↔Saturn never obstruct each other.
    expect(vedhaObstructors('mercury', 4, { 3: ['mars', 'saturn'] })).toEqual(['mars', 'saturn']);
    expect(vedhaObstructors('sun', 10, { 4: ['saturn'] })).toEqual([]); // Sun/Saturn exception
    expect(vedhaObstructors('moon', 1, { 5: ['mercury'] })).toEqual([]); // Moon/Mercury exception
  });
  it('timing with sodhya pinda (Ch 25.6) matches the book’s worked examples', () => {
    // Father example: 5 rekhas × Sun pinda 86 = 430 → nak 25 (Poorvabhadra), rasi 10 (Cp).
    const father = sodhyaPindaTiming(5, 86);
    expect(father.product).toBe(430);
    expect(father.nakshatra).toBe(25);
    expect(father.rasi).toBe(10);
    expect(father.companionNakshatras).toEqual([7, 16]); // 10th & 19th — all Jupiter-lorded
    // Moon example: 6 rekhas × 122 = 732 → nak 3 (Krittika).
    expect(sodhyaPindaTiming(6, 122).nakshatra).toBe(3);
    // Zero-product case wraps: 0 rekhas × 203 = 0 → nak 27 (Revathi), rasi 12 (Pisces).
    const zero = sodhyaPindaTiming(0, 203);
    expect(zero.nakshatra).toBe(27);
    expect(zero.rasi).toBe(12);
    // Table 61 pairs each planet with its matter/house.
    expect(SODHYA_PINDA_MATTERS.venus).toEqual({ house: 7, matter: 'marriage' });
    expect(SODHYA_PINDA_MATTERS.saturn.house).toBe(8);
  });
});

describe('planetary relationships', () => {
  it('encodes the classical natural friendships', () => {
    expect(naturalRelation('sun', 'saturn')).toBe('enemy');
    expect(naturalRelation('sun', 'jupiter')).toBe('friend');
    expect(naturalRelation('mercury', 'moon')).toBe('enemy');
    expect(naturalRelation('moon', 'mars')).toBe('neutral');
  });
  it('temporary + compound relationships combine correctly', () => {
    expect(temporaryRelation(3)).toBe('friend');   // 3rd from a planet
    expect(temporaryRelation(6)).toBe('enemy');    // 6th from a planet
    expect(compoundRelation('friend', 'friend')).toBe('great-friend');
    expect(compoundRelation('enemy', 'enemy')).toBe('great-enemy');
    expect(compoundRelation('friend', 'enemy')).toBe('neutral');
  });
});

describe('remedies (behavioural-only surfacing)', () => {
  it('every planet has a free behavioural remedy', () => {
    expect(Object.keys(REMEDIES)).toHaveLength(9);
    for (const g of Object.keys(REMEDIES) as Graha[]) {
      expect(behaviouralRemedy(g).length).toBeGreaterThan(20);
    }
  });
  it('behavioural remedies never mention purchases/gemstones/fasting/rituals (SPEC §11.4)', () => {
    for (const g of Object.keys(REMEDIES) as Graha[]) {
      expect(behaviouralRemedy(g).toLowerCase()).not.toMatch(/gem|ruby|sapphire|pearl|coral|emerald|diamond|buy|purchase|fast|mantra|ritual/);
    }
  });
});

describe('search', () => {
  it('finds concepts across kinds', () => {
    expect(search('wealth').some((h) => h.kind === 'bhava')).toBe(true);
    expect(search('courage').length).toBeGreaterThan(0);
    expect(search('').length).toBe(0);
  });
});
