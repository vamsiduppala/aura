import { describe, it, expect } from 'vitest';
import {
  GRAHAS, RASIS, BHAVAS, NAKSHATRAS, YOGAS, YOGA_BY_KEY,
  DIVISIONALS, DIVISIONAL_BY_N, CHARA_KARAKAS, STHIRA_KARAKAS,
  FUNCTIONAL_NATURE, functionalNatureFor, baadhakaHouse,
  TRANSIT_FROM_MOON, isFavourableTransit, sadeSatiPhase,
  naturalRelation, temporaryRelation, compoundRelation,
  REMEDIES, behaviouralRemedy,
  getGraha, getRasi, getBhava, search,
  interpretPlacement, interpretLagnaLord, classifyDignity,
  grahaAspectsFrom, rasiDrishti, argalaOn,
  arudhaOf, allArudhas,
  vargaSign,
  bhavaLagna, horaLagna, ghatiLagna, sreeLagna,
  sunUpagrahas, partLords, upagrahaFraction,
  type Graha,
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
    for (const g of Object.keys(REMEDIES) as (keyof typeof REMEDIES)[]) {
      expect(behaviouralRemedy(g).length).toBeGreaterThan(20);
    }
  });
  it('behavioural remedies never mention purchases/gemstones/fasting/rituals (SPEC §11.4)', () => {
    for (const g of Object.keys(REMEDIES) as (keyof typeof REMEDIES)[]) {
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
