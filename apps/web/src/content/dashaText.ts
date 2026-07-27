// Plain-language explanations for the Forecast screen. Written for people with no astrology
// background: every idea is carried by a scenario or a metaphor, with the classical planet named
// in brackets so the vocabulary is still learnable.
//
// The two "what is a mahadasha / antardasha" pieces are deliberately GENERIC and identical for
// everyone — they explain the system itself, not the person, so they never change.

import type { Energy, Graha } from '@aura/engine';

/** What a mahadasha is — the same explanation for every user. */
export const WHAT_IS_MAHADASHA = {
  title: 'Your long season',
  sub: 'mahadasha — the weather system you live inside for years',
  body: [
    'Think of your life as a series of long seasons. Not "good" or "bad" ones — seasons with a temperament. A season can last anywhere from six to twenty years, and while you are in it, it quietly decides which of your efforts feel easy and which feel like pushing a car uphill.',
    'You have probably felt this without naming it. There are stretches of life where work simply lands: the right calls come, doors open a little early. And there are stretches where the same effort, from the same person, keeps meeting friction. Nothing about you changed. The season did.',
    'Each season is governed by one planet, and that planet sets the mood of the whole stretch — Saturn seasons build slowly and reward patience, Venus seasons soften everything and pull relationships and comfort forward, Jupiter seasons open doors, Mars seasons run hot and fast. Knowing which one you are in tells you what kind of effort will actually pay off right now.',
  ],
};

/** What an antardasha is — again, generic and unchanging. */
export const WHAT_IS_ANTARDASHA = {
  title: 'The chapter inside it',
  sub: 'antardasha — the shorter mood that colours the season',
  body: [
    'Inside every long season there are shorter chapters, usually months to a couple of years each. If the season is the climate, this is the actual weather this month.',
    'It is why two years inside the same long season can feel completely different. Picture a patient, building season — a Saturn stretch where you are putting in foundations. One chapter inside it might be governed by Venus, and suddenly the same building years also bring warmth, people and something beautiful to show for the work. A later chapter under Mars in that same season brings heat, urgency and a fight worth having.',
    'The season tells you what this era of your life is *for*. The chapter tells you what this particular stretch of months will *feel* like. When people say a period "turned a corner" without anything visible changing, this is usually the corner they turned.',
  ],
};

/** How the two combine — the practical takeaway. */
export const HOW_THEY_COMBINE =
  'Read them together: the long season is the ground you are standing on, and the chapter is the light falling on it right now. When both point the same way, things move fast. When they pull against each other — a fast chapter inside a patient season — that friction is not a mistake, it is the tension you are meant to work with.';

/** What each cadence of the forecast actually means, in plain terms. */
export const CADENCE_MEANING: Record<'daily' | 'weekly' | 'monthly' | 'custom', { title: string; body: string }> = {
  daily: {
    title: 'Day by day',
    body: 'These are the fastest shifts — the texture of a single day. Useful for choosing when to have the hard conversation, when to push a decision, and when to simply do the quiet work and leave the big call for later. Nothing here decides your life; it just tells you which way the wind is blowing before you step outside.',
  },
  weekly: {
    title: 'Week by week',
    body: 'A week is long enough to hold a mood but short enough to plan around. This view is for pacing: which week to launch something, which week to consolidate, which week you will probably feel stretched thin and should protect your energy rather than fill the calendar.',
  },
  monthly: {
    title: 'Month by month',
    body: 'The most practical view for real decisions. Months are where projects, relationships and health actually turn. If you are choosing when to start something that matters — a job move, a conversation you have been avoiding, a commitment — this is the view to read.',
  },
  custom: {
    title: 'Your own window',
    body: 'Pick any two dates and see every shift between them. Useful for looking back at a stretch you have already lived — to see whether the reading matches what actually happened — or for looking ahead at a specific window you are planning around.',
  },
};

/** How a period governed by each energy tends to *feel*, scenario-first. */
export const PERIOD_FEEL: Record<Energy, string> = {
  build:
    'Everything asks for patience. Progress is real but slow, and the reward is structural — what you build in a stretch like this tends to still be standing years later. The trap is reading slowness as failure and abandoning something a month before it would have worked.',
  crave:
    'A restless, hungry stretch. Ambition runs high and so does comparison — the sense that everyone else is further along. Aimed at one thing, this is the most powerful fuel you get. Spread across ten things, it burns you out and finishes none of them.',
  main:
    'You are visible. People notice your work, your name comes up in rooms you are not in, and recognition is available if you are willing to be seen. The risk is spending the visibility on ego rather than on the thing you actually want to build.',
  feel:
    'Softer and closer to the surface. Feelings, home, family and rest matter more than usual, and your instinct about people is unusually accurate. Good for repairing relationships and for creative work; poor for making a big decision on a low day.',
  fire:
    'Heat and drive. Hard starts become possible, physical energy is up, and confrontations you have been avoiding tend to surface. Excellent for beginning things and for finally saying the difficult thing. Watch for picking fights that cost more than they win.',
  mind:
    'Quick, curious and verbal. Deals, learning, writing, negotiation and travel all move well. The mind runs fast enough to overthink, so the danger is analysing a decision to death instead of making it and adjusting.',
  grow:
    'The open road. Luck, teachers, opportunity and meaning all show up more easily, and the general instruction is to say yes and expand. The trap is overextending — taking on more than you can hold because it all looks good.',
  love:
    'Warm, connective and comfortable. Relationships, beauty, money and pleasure come easier, and it is a genuinely good stretch for partnership and for anything creative. The risk is drifting into comfort and losing the edge that got you here.',
  let: 'Something is ending, and the ending is the point. Things loosen, fall away or quietly lose their hold on you. It can feel like loss when it is actually clearance — the room being made for what comes next. Fighting to keep everything is what makes this stretch hard.',
};

/** One-line "what this planet governs", used inline so the names mean something. */
export const PLANET_ROLE: Record<Graha, string> = {
  sun: 'authority, vitality and being seen',
  moon: 'feelings, home and the inner weather',
  mars: 'drive, courage and conflict',
  mercury: 'thinking, speech and dealmaking',
  jupiter: 'growth, luck, teachers and meaning',
  venus: 'love, beauty, comfort and money',
  saturn: 'discipline, time, endurance and structure',
  rahu: 'hunger, ambition and the unconventional',
  ketu: 'detachment, endings and the inward turn',
};
