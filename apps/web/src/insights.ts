import type { Energy, Graha } from '@aura/engine';

// The single simplest, free, healthy behavioural nudge per planet — a tiny morning act
// that gently strengthens that energy. No gemstones, fasting or rituals (SPEC §11.4).
export const SIMPLE_REMEDY: Record<Graha, string> = {
  sun: 'Step outside and let the morning sun hit your face for two minutes before the day starts.',
  moon: 'Drink a full glass of water the moment you wake — before your phone, before anything.',
  mars: 'Do ten push-ups or a brisk two-minute stretch before you touch your phone.',
  mercury: 'Write down your three tasks for the day before your first coffee.',
  jupiter: 'Read one page of something that teaches you, first thing in the morning.',
  venus: 'Tidy or beautify one small corner of your space before you leave it.',
  saturn: 'Pay one bill or finish one boring chore first thing — even before breakfast.',
  rahu: 'Leave your phone across the room for the first twenty minutes after waking.',
  ketu: 'Sit and breathe slowly for two minutes before you check anything.',
};

// How to take advantage when this energy is one of your strong ones.
export const ADVANTAGE: Record<Energy, string> = {
  main: 'Put yourself forward — ask for the visible role, the lead, the credit. People are ready to follow you now.',
  feel: 'Trust your read on people; your sense of mood and timing is unusually accurate — use it in the talks that matter.',
  fire: 'Start the hard thing first. Your drive is high, and the initiative you take now moves faster than usual.',
  mind: 'Have the tricky conversation, pitch the idea, sign the deal — your words land sharp and persuasive right now.',
  grow: 'Say yes to the bigger ask. Growth and luck favour you — aim higher than feels comfortable.',
  love: 'Lean into connection and craft — reach out, create, make things beautiful. Charm opens doors for you now.',
  build: 'Build the foundation — the systems, the discipline, the long project. What you set up now genuinely lasts.',
  crave: 'Point the hunger at ONE bold goal instead of ten. Channelled, this restlessness becomes real momentum.',
  let: 'Cut the dead weight. This is the time to release, simplify and go deep on what actually matters to you.',
};

// A one-line theme for a whole mahadasha season, in plain language.
export const MAHA_THEME: Record<Energy, string> = {
  main: 'A years-long chapter about visibility, identity and stepping into your own authority.',
  feel: 'A tender, inward season — your emotional world, home and sense of belonging lead the way.',
  fire: 'A driven, high-energy era of action, courage and cutting new paths.',
  mind: 'A clever, fast-moving chapter of learning, talking, dealing and connecting the dots.',
  grow: 'An expansive season of luck, learning and growth — doors open when you stay generous.',
  love: 'A warm chapter about love, beauty, pleasure and the art you make of your life.',
  build: 'A long, serious build — discipline and patience now, with earned, lasting results.',
  crave: 'A restless, ambitious era of big hunger — powerful when aimed, scattering when not.',
  let: 'A quiet, dissolving chapter — releasing, simplifying and turning toward the inner life.',
};
