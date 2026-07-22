// Divisional chart (varga) significations — Ch 6.3 / Table 11. Which divisional chart
// reveals which area of life, as compact reference data (our own concise phrasing).

export interface DivisionalKnowledge {
  division: number;     // e.g. 9 for D-9
  code: string;         // "D-9"
  name: string;         // Sanskrit name
  area: string;         // area of life it reveals
}

export const DIVISIONALS: DivisionalKnowledge[] = [
  { division: 1, code: 'D-1', name: 'Rasi', area: 'the whole life at the physical level; the body and everything' },
  { division: 2, code: 'D-2', name: 'Hora', area: 'wealth and money' },
  { division: 3, code: 'D-3', name: 'Drekkana', area: 'siblings, courage and initiative' },
  { division: 4, code: 'D-4', name: 'Chaturthamsa', area: 'home, property, residence and fortune' },
  { division: 5, code: 'D-5', name: 'Panchamsa', area: 'fame, authority and power' },
  { division: 6, code: 'D-6', name: 'Shashthamsa', area: 'health troubles' },
  { division: 7, code: 'D-7', name: 'Saptamsa', area: 'children and progeny' },
  { division: 8, code: 'D-8', name: 'Ashtamsa', area: 'sudden and unexpected troubles, litigation' },
  { division: 9, code: 'D-9', name: 'Navamsa', area: 'marriage, spouse, dharma, inner self and overall strength (the key divisional)' },
  { division: 10, code: 'D-10', name: 'Dasamsa', area: 'career, work and achievement in society' },
  { division: 11, code: 'D-11', name: 'Rudramsa', area: 'endings and destruction' },
  { division: 12, code: 'D-12', name: 'Dwadasamsa', area: 'parents and elder blood-relatives' },
  { division: 16, code: 'D-16', name: 'Shodasamsa', area: 'vehicles, comforts, pleasures and discomforts' },
  { division: 20, code: 'D-20', name: 'Vimsamsa', area: 'spiritual practice and worship' },
  { division: 24, code: 'D-24', name: 'Chaturvimsamsa', area: 'learning, knowledge and education' },
  { division: 27, code: 'D-27', name: 'Nakshatramsa', area: 'inherent strengths, weaknesses and nature' },
  { division: 30, code: 'D-30', name: 'Trimsamsa', area: 'misfortunes, the sub-conscious and some diseases' },
  { division: 40, code: 'D-40', name: 'Khavedamsa', area: 'auspicious and inauspicious events (maternal legacy)' },
  { division: 45, code: 'D-45', name: 'Akshavedamsa', area: 'all matters and character (paternal legacy)' },
  { division: 60, code: 'D-60', name: 'Shashtiamsa', area: 'past-life karma and all matters (the most refined)' },
];

export const DIVISIONAL_BY_N = (n: number): DivisionalKnowledge | undefined => DIVISIONALS.find((d) => d.division === n);
