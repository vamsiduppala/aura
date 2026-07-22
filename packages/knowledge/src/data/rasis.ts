// Sign (rasi) reference — traditional attributes + distilled trait keywords (Ch 2).

import type { RasiKnowledge } from '../types.js';

export const RASIS: RasiKnowledge[] = [
  { index: 0, english: 'Aries', sanskrit: 'Mesha', lord: 'mars', element: 'fire', modality: 'movable', gender: 'male', guna: 'rajas', dosha: 'pitta', direction: 'east', varna: 'kshatriya', bodyPart: 'head',
    indications: ['dynamic', 'enterprising', 'valiant', 'impulsive', 'restless', 'leadership', 'hasty', 'pioneering'] },
  { index: 1, english: 'Taurus', sanskrit: 'Vrishabha', lord: 'venus', element: 'earth', modality: 'fixed', gender: 'female', guna: 'rajas', dosha: 'vaata', direction: 'south', varna: 'vaishya', bodyPart: 'face and neck',
    indications: ['stable', 'loyal', 'luxury-loving', 'sensual', 'steady', 'patient', 'possessive', 'grounded'] },
  { index: 2, english: 'Gemini', sanskrit: 'Mithuna', lord: 'mercury', element: 'air', modality: 'dual', gender: 'male', guna: 'tamas', dosha: null, direction: 'west', varna: 'shudra', bodyPart: 'chest and arms',
    indications: ['communicative', 'curious', 'learned', 'jovial', 'versatile', 'restless-minded', 'clever'] },
  { index: 3, english: 'Cancer', sanskrit: 'Karka', lord: 'moon', element: 'water', modality: 'movable', gender: 'female', guna: 'sattva', dosha: 'kapha', direction: 'north', varna: 'brahmana', bodyPart: 'heart and chest',
    indications: ['emotional', 'nurturing', 'sensitive', 'attached', 'protective', 'moody', 'homely'] },
  { index: 4, english: 'Leo', sanskrit: 'Simha', lord: 'sun', element: 'fire', modality: 'fixed', gender: 'male', guna: 'sattva', dosha: 'pitta', direction: 'east', varna: 'kshatriya', bodyPart: 'stomach',
    indications: ['royal', 'proud', 'domineering', 'generous', 'authoritative', 'self-assured', 'dramatic'] },
  { index: 5, english: 'Virgo', sanskrit: 'Kanya', lord: 'mercury', element: 'earth', modality: 'dual', gender: 'female', guna: 'tamas', dosha: 'vaata', direction: 'south', varna: 'vaishya', bodyPart: 'gut and hips',
    indications: ['intelligent', 'sharp', 'discerning', 'tactful', 'analytical', 'nervous', 'perfectionist'] },
  { index: 6, english: 'Libra', sanskrit: 'Tula', lord: 'venus', element: 'air', modality: 'movable', gender: 'male', guna: 'rajas', dosha: null, direction: 'west', varna: 'shudra', bodyPart: 'groin and kidneys',
    indications: ['balanced', 'diplomatic', 'business-minded', 'sociable', 'fair', 'refined', 'indecisive'] },
  { index: 7, english: 'Scorpio', sanskrit: 'Vrischika', lord: 'mars', element: 'water', modality: 'fixed', gender: 'female', guna: 'rajas', dosha: 'kapha', direction: 'north', varna: 'brahmana', bodyPart: 'genitals',
    indications: ['secretive', 'intense', 'occult', 'scheming', 'loyal-or-vengeful', 'penetrating', 'transformative'] },
  { index: 8, english: 'Sagittarius', sanskrit: 'Dhanus', lord: 'jupiter', element: 'fire', modality: 'dual', gender: 'male', guna: 'sattva', dosha: 'pitta', direction: 'east', varna: 'kshatriya', bodyPart: 'thighs',
    indications: ['honest', 'upright', 'philosophical', 'genial', 'freedom-loving', 'principled', 'optimistic'] },
  { index: 9, english: 'Capricorn', sanskrit: 'Makara', lord: 'saturn', element: 'earth', modality: 'movable', gender: 'female', guna: 'tamas', dosha: 'vaata', direction: 'south', varna: 'vaishya', bodyPart: 'knees',
    indications: ['patient', 'organized', 'pragmatic', 'cautious', 'ambitious', 'witty', 'secretive'] },
  { index: 10, english: 'Aquarius', sanskrit: 'Kumbha', lord: 'saturn', element: 'air', modality: 'fixed', gender: 'male', guna: 'tamas', dosha: null, direction: 'west', varna: 'shudra', bodyPart: 'ankles and calves',
    indications: ['hard-working', 'stoic', 'humanitarian', 'philosophical', 'honest', 'unconventional', 'detached'] },
  { index: 11, english: 'Pisces', sanskrit: 'Meena', lord: 'jupiter', element: 'water', modality: 'dual', gender: 'female', guna: 'sattva', dosha: 'kapha', direction: 'north', varna: 'brahmana', bodyPart: 'feet',
    indications: ['emotional', 'intuitive', 'compassionate', 'dreamy', 'spiritual', 'timid', 'imaginative'] },
];

export const RASI_BY_INDEX = (i: number): RasiKnowledge => RASIS[((i % 12) + 12) % 12]!;
