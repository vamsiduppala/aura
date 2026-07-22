// Planet (graha) reference — traditional significations + characteristics (Ch 3),
// encoded as structured data in our own concise phrasing.

import type { GrahaKnowledge } from '../types.js';

export const GRAHAS: Record<string, GrahaKnowledge> = {
  sun: {
    key: 'sun', english: 'Sun', sanskrit: 'Surya', naturalNature: 'malefic',
    governs: 'the soul',
    significations: ['self', 'father', 'authority', 'vitality', 'ego', 'status', 'leadership', 'government', 'health'],
    cabinet: 'king', deity: 'Agni (fire)', gender: 'male', element: 'fire', varna: 'kshatriya',
    guna: 'sattva', bodyTissue: 'bones', taste: 'pungent', season: 'summer',
    digBalaHouse: 10, strongIn: 'day', colour: 'blood-red',
  },
  moon: {
    key: 'moon', english: 'Moon', sanskrit: 'Chandra', naturalNature: 'conditional',
    governs: 'the mind',
    significations: ['mind', 'emotions', 'mother', 'comfort', 'the public', 'moods', 'nurturing', 'memory', 'home'],
    cabinet: 'king', deity: 'Varuna (waters)', gender: 'female', element: 'water', varna: 'vaishya',
    guna: 'sattva', bodyTissue: 'blood', taste: 'saline', season: 'rains',
    digBalaHouse: 4, strongIn: 'night', colour: 'tawny',
  },
  mars: {
    key: 'mars', english: 'Mars', sanskrit: 'Mangala', naturalNature: 'malefic',
    governs: 'strength',
    significations: ['energy', 'courage', 'drive', 'siblings', 'conflict', 'land', 'discipline', 'competition', 'surgery'],
    cabinet: 'army chief', deity: 'Subrahmanya', gender: 'male', element: 'fire', varna: 'kshatriya',
    guna: 'tamas', bodyTissue: 'marrow', taste: 'bitter', season: 'summer',
    digBalaHouse: 10, strongIn: 'night', colour: 'blood-red',
  },
  mercury: {
    key: 'mercury', english: 'Mercury', sanskrit: 'Budha', naturalNature: 'conditional',
    governs: 'speech',
    significations: ['intellect', 'speech', 'commerce', 'analysis', 'communication', 'skill', 'writing', 'trade', 'nervous system'],
    cabinet: 'prince', deity: 'Maha Vishnu', gender: 'neuter', element: 'earth', varna: 'vaishya',
    guna: 'rajas', bodyTissue: 'skin', taste: 'mixed', season: 'dew',
    digBalaHouse: 1, strongIn: 'always', colour: 'grass-green',
  },
  jupiter: {
    key: 'jupiter', english: 'Jupiter', sanskrit: 'Guru', naturalNature: 'benefic',
    governs: 'knowledge and happiness',
    significations: ['wisdom', 'luck', 'expansion', 'wealth', 'children', 'teachers', 'dharma', 'higher learning', 'faith'],
    cabinet: 'minister', deity: 'Indra', gender: 'male', element: 'ether', varna: 'brahmana',
    guna: 'sattva', bodyTissue: 'fat', taste: 'sweet', season: 'winter',
    digBalaHouse: 1, strongIn: 'day', colour: 'tawny',
  },
  venus: {
    key: 'venus', english: 'Venus', sanskrit: 'Shukra', naturalNature: 'benefic',
    governs: 'potency and pleasure',
    significations: ['love', 'beauty', 'pleasure', 'art', 'spouse', 'luxury', 'vehicles', 'creativity', 'refinement'],
    cabinet: 'minister', deity: 'Sachi Devi', gender: 'female', element: 'water', varna: 'brahmana',
    guna: 'rajas', bodyTissue: 'reproductive fluids', taste: 'sour', season: 'spring',
    digBalaHouse: 4, strongIn: 'day', colour: 'variegated',
  },
  saturn: {
    key: 'saturn', english: 'Saturn', sanskrit: 'Shani', naturalNature: 'malefic',
    governs: 'grief and endurance',
    significations: ['discipline', 'time', 'delay', 'endurance', 'karma', 'labour', 'longevity', 'detachment', 'the poor'],
    cabinet: 'servant', deity: 'Brahma', gender: 'neuter', element: 'air', varna: 'shudra',
    guna: 'tamas', bodyTissue: 'muscles', taste: 'astringent', season: 'fall',
    digBalaHouse: 7, strongIn: 'night', colour: 'black',
  },
  rahu: {
    key: 'rahu', english: 'Rahu (north node)', sanskrit: 'Rahu', naturalNature: 'malefic',
    governs: 'worldly desire and illusion',
    significations: ['craving', 'obsession', 'ambition', 'illusion', 'the foreign', 'the unconventional', 'sudden gains', 'anxiety'],
    cabinet: 'army', deity: 'Durga', gender: 'neuter', element: null, varna: null,
    guna: 'tamas', bodyTissue: 'metals/materials', taste: null, season: null,
    digBalaHouse: null, strongIn: null, colour: 'smoky',
  },
  ketu: {
    key: 'ketu', english: 'Ketu (south node)', sanskrit: 'Ketu', naturalNature: 'malefic',
    governs: 'detachment and liberation',
    significations: ['detachment', 'release', 'spirituality', 'past-karma', 'loss', 'insight', 'moksha', 'the occult'],
    cabinet: 'army', deity: 'Ganesha', gender: 'neuter', element: null, varna: null,
    guna: 'tamas', bodyTissue: 'living beings', taste: null, season: null,
    digBalaHouse: null, strongIn: null, colour: 'variegated',
  },
};

export const GRAHA_KEYS = Object.keys(GRAHAS) as (keyof typeof GRAHAS)[];
