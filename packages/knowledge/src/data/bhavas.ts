// House (bhava) reference — significations (Ch 7), categories, natural significators.

import type { BhavaKnowledge } from '../types.js';

export const BHAVAS: BhavaKnowledge[] = [
  { number: 1, english: 'Self', sanskrit: 'Tanu', categories: ['kendra', 'trikona'], karakas: ['sun'], bodyPart: 'head',
    significations: ['body', 'appearance', 'vitality', 'personality', 'strength', 'fame', 'nature of birth', 'the self'] },
  { number: 2, english: 'Wealth', sanskrit: 'Dhana', categories: ['maraka', 'panapara'], karakas: ['jupiter'], bodyPart: 'face and mouth',
    significations: ['wealth', 'assets', 'family', 'speech', 'food', 'eyes', 'values', 'accumulated resources'] },
  { number: 3, english: 'Siblings', sanskrit: 'Sahaja', categories: ['upachaya', 'apoklima'], karakas: ['mars'], bodyPart: 'arms and throat',
    significations: ['younger siblings', 'courage', 'effort', 'communication', 'skills', 'short travels', 'hands'] },
  { number: 4, english: 'Home', sanskrit: 'Sukha', categories: ['kendra'], karakas: ['moon', 'mercury'], bodyPart: 'heart and chest',
    significations: ['mother', 'home', 'property', 'vehicles', 'inner peace', 'comforts', 'education', 'the heart', 'roots'] },
  { number: 5, english: 'Creativity', sanskrit: 'Putra', categories: ['trikona', 'panapara'], karakas: ['jupiter'], bodyPart: 'stomach',
    significations: ['children', 'intelligence', 'past-life merit', 'romance', 'creativity', 'devotion', 'speculation', 'the emotions'] },
  { number: 6, english: 'Health', sanskrit: 'Ripu', categories: ['dusthana', 'upachaya', 'apoklima'], karakas: ['mars', 'saturn'], bodyPart: 'gut and hips',
    significations: ['enemies', 'disease', 'debt', 'daily work', 'service', 'obstacles', 'routines', 'litigation'] },
  { number: 7, english: 'Partnership', sanskrit: 'Kalatra', categories: ['kendra', 'maraka'], karakas: ['venus'], bodyPart: 'below the navel',
    significations: ['spouse', 'marriage', 'business partners', 'the public', 'deals', 'passion', 'long journeys'] },
  { number: 8, english: 'Transformation', sanskrit: 'Ayus', categories: ['dusthana', 'panapara'], karakas: ['saturn'], bodyPart: 'genitals',
    significations: ['longevity', 'sudden change', 'inheritance', 'the occult', 'secrets', 'crisis', 'depth', 'windfalls', 'transformation'] },
  { number: 9, english: 'Fortune', sanskrit: 'Dharma', categories: ['trikona', 'apoklima'], karakas: ['jupiter', 'sun'], bodyPart: 'thighs',
    significations: ['father', 'fortune', 'teachers', 'higher learning', 'dharma', 'faith', 'long travel', 'grace', 'principles'] },
  { number: 10, english: 'Career', sanskrit: 'Karma', categories: ['kendra', 'upachaya'], karakas: ['sun', 'mercury', 'jupiter', 'saturn'], bodyPart: 'knees',
    significations: ['career', 'status', 'action in the world', 'reputation', 'authority', 'honours', 'conduct', 'ambition'] },
  { number: 11, english: 'Gains', sanskrit: 'Labha', categories: ['upachaya', 'panapara'], karakas: ['jupiter'], bodyPart: 'ankles and calves',
    significations: ['income', 'gains', 'network', 'elder siblings', 'hopes fulfilled', 'friends', 'aspirations'] },
  { number: 12, english: 'Release', sanskrit: 'Vyaya', categories: ['dusthana', 'apoklima'], karakas: ['saturn', 'ketu'], bodyPart: 'feet',
    significations: ['loss', 'expenses', 'foreign lands', 'isolation', 'rest', 'the bed', 'spirituality', 'liberation', 'letting go'] },
];

export const BHAVA = (n: number): BhavaKnowledge => BHAVAS[(((n - 1) % 12) + 12) % 12]!;
