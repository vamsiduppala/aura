// Plan content. Authored, in our own words, and composed at render time — never stored.
//
// Two layers:
//   · The category decides the WORDS (what the task is about).
//   · The ruling planet decides the SHAPE of the instruction (how to go at it).
// So a Health plan under Mars reads "Train heavy, eat properly", not "Push".
//
// Stage headings are the actual thing to do, phrased as a verb. Never "Stage 1", never a
// bare noun like "Groundwork" — a heading you could paste into any plan is a heading that
// tells you nothing.

import type { Graha } from '@aura/engine';

export type PlanCategory =
  | 'love' | 'job' | 'promotion' | 'startup' | 'health'
  | 'purchase' | 'study' | 'money' | 'other';

export interface CategoryDef {
  key: PlanCategory;
  label: string;
  sub: string;
  /** Where the person is right now. The plan is only as good as this answer. */
  situations: string[];
}

export const CATEGORIES: readonly CategoryDef[] = [
  {
    key: 'love', label: 'Love & Relationship', sub: 'Finding someone, or fixing something',
    situations: ['Not looking yet', 'Open, not meeting anyone', 'Dating someone new',
      'Long-term, needs work', 'Deciding whether to stay'],
  },
  {
    key: 'job', label: 'Job Search', sub: 'New role, new company',
    situations: ['Just thinking about it', 'Updating my CV', 'Applying actively',
      'In interviews', 'Have an offer, deciding'],
  },
  {
    key: 'promotion', label: 'Promotion & Raise', sub: 'Moving up where you already are',
    situations: ['Nothing said yet', 'Raised it once', 'In the process',
      'Passed over before', 'Waiting on a decision'],
  },
  {
    key: 'startup', label: 'Startup & New Venture', sub: 'Building something of your own',
    situations: ['Just an idea', 'Validating it', 'Building', 'Have users, no revenue', 'Raising'],
  },
  {
    key: 'health', label: 'Health & Body', sub: 'Energy, weight, recovery, habits',
    situations: ["Haven't started", 'On and off', 'Consistent, no results',
      'Recovering from something'],
  },
  {
    key: 'purchase', label: 'Big Purchase', sub: 'Home, land, vehicle',
    situations: ['Just looking', 'Saving for it', 'Actively viewing',
      'Negotiating', 'Waiting on finance'],
  },
  {
    key: 'study', label: 'Study & Exams', sub: 'A qualification with a deadline',
    situations: ['Deciding what to take', 'Enrolled, not started', 'Studying',
      'Behind schedule', 'Final stretch'],
  },
  {
    key: 'money', label: 'Money & Debt', sub: 'Getting clear, or getting ahead',
    situations: ['Not sure where I stand', 'Clearing debt', 'Breaking even',
      'Saving properly', 'Investing'],
  },
  {
    key: 'other', label: 'Something else', sub: 'Tell us in a line',
    situations: ['Just starting', 'Partway in', 'Stalled', 'Nearly there'],
  },
] as const;

export const categoryDef = (key: PlanCategory): CategoryDef =>
  CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1]!;

/**
 * The 81 stage headings: 9 categories × 9 ruling planets. The planet's verb family shows
 * through — Saturn builds and endures, Mars pushes and confronts, Ketu finishes and lets go —
 * but the words belong to the category.
 */
const HEADINGS: Record<PlanCategory, Record<Graha, string>> = {
  love: {
    sun: 'Be seen properly',
    moon: 'Say how you actually feel',
    mars: 'Ask directly',
    mercury: 'Have the honest conversation',
    jupiter: 'Widen the circle',
    venus: 'Make it easy to say yes',
    saturn: 'Show up consistently',
    rahu: 'Meet people outside your usual',
    ketu: 'Let go of the one that ended',
  },
  job: {
    sun: 'Be seen by the decider',
    moon: 'Work your warm contacts',
    mars: 'Apply hard, ask directly',
    mercury: 'Get the words right',
    jupiter: 'Aim one level higher',
    venus: 'Negotiate and sign',
    saturn: 'Build the boring assets',
    rahu: 'Try the unconventional route',
    ketu: "Close the search you've outgrown",
  },
  promotion: {
    sun: 'Put your name on the win',
    moon: 'Read the room above you',
    mars: 'Ask for the title',
    mercury: 'Write the case down',
    jupiter: 'Ask for more scope',
    venus: 'Get your sponsor on side',
    saturn: 'Deliver the unglamorous quarter',
    rahu: 'Take the role nobody wants',
    ketu: "Hand off what's holding you",
  },
  startup: {
    sun: 'Put your name to it publicly',
    moon: 'Talk to twenty users',
    mars: 'Ship the first version',
    mercury: 'Get the numbers straight',
    jupiter: 'Raise the ambition',
    venus: 'Land the first partners',
    saturn: 'Build the boring infrastructure',
    rahu: 'Bet on the odd channel',
    ketu: "Kill what isn't working",
  },
  health: {
    sun: 'Commit in public',
    moon: 'Fix sleep first',
    mars: 'Train heavy, eat properly',
    mercury: 'Track it and read the data',
    jupiter: 'Get a proper assessment',
    venus: 'Make the routine pleasant',
    saturn: 'Repeat it daily, small',
    rahu: 'Change the whole format',
    ketu: 'Drop the habit you keep defending',
  },
  purchase: {
    sun: 'Decide, and own the decision',
    moon: 'Go and see it in person',
    mars: 'Make the offer',
    mercury: 'Read every document',
    jupiter: 'Ask for the better terms',
    venus: 'Negotiate the price down',
    saturn: 'Get the paperwork airtight',
    rahu: "Look where nobody's looking",
    ketu: 'Walk away from the wrong one',
  },
  study: {
    sun: 'Sit it, and claim the result',
    moon: 'Study with other people',
    mars: 'Do the hard past papers',
    mercury: 'Rewrite your notes',
    jupiter: 'Get a tutor or a mentor',
    venus: 'Make the study space work',
    saturn: 'Same hours, every day',
    rahu: 'Change the method entirely',
    ketu: "Cut the subject you can't save",
  },
  money: {
    sun: 'Own the number out loud',
    moon: 'Have the money conversation',
    mars: 'Attack the highest interest',
    mercury: 'Get every account in order',
    jupiter: 'Grow the income side',
    venus: "Renegotiate what you're paying",
    saturn: 'Automate the boring payment',
    rahu: 'Try the unconventional income',
    ketu: "Cancel what you don't use",
  },
  other: {
    sun: 'Claim it publicly',
    moon: 'Go with your read',
    mars: 'Start it now',
    mercury: 'Write the plan down',
    jupiter: 'Make it bigger',
    venus: 'Get people on side',
    saturn: 'Lay the base',
    rahu: 'Break the format',
    ketu: 'Finish it, or let it go',
  },
};

export const stageHeading = (category: PlanCategory, lord: Graha): string =>
  HEADINGS[category][lord];

/**
 * What to actually do inside a stage. Per ruling planet, because the planet is what decides
 * whether force or patience is the thing that works — and that is the only advice in this
 * app that changes from stage to stage rather than from person to person.
 */
const CHECKLIST: Record<Graha, string[]> = {
  sun: [
    'Put your name on one visible thing this week',
    'Have the key conversation face to face, not in writing',
    'Ask for the decision rather than waiting to be given it',
  ],
  moon: [
    'Protect sleep before anything else this stretch',
    'Ask the person directly instead of building the case first',
    'Reread anything you decided after 10pm',
  ],
  mars: [
    "Send the thing you've been sitting on",
    'Say your number first',
    'Move the frustration into exercise, not into a message',
  ],
  mercury: [
    'Write it down and send it today',
    'Get the numbers into one place',
    "Close the projects you aren't going to finish",
  ],
  jupiter: [
    'Ask for the bigger version',
    'Find someone two steps ahead and ask them directly',
    "Put a number on what you're agreeing to before you agree",
  ],
  venus: [
    'Ask for the thing someone has to want to give you',
    'Repair one relationship you let go cold',
    'Do the smallest unpleasant task before noon',
  ],
  saturn: [
    'Shrink the daily commitment until it is boringly achievable',
    'Fix the process, not this one instance',
    'Judge progress monthly, not weekly',
  ],
  rahu: [
    "Try the route that isn't the standard one",
    "Write down what 'enough' is, with a number and a date",
    'Hold this direction for a fixed period before changing it',
  ],
  ketu: [
    'Finish the thing that is nearly done',
    'Name what would make it worth keeping before you drop it',
    "Say the quiet 'no' out loud",
  ],
};

export const stageChecklist = (lord: Graha): string[] => CHECKLIST[lord];

/** Suggested plan title from the category, editable by the user afterwards. */
export const suggestedTitle = (category: PlanCategory): string => {
  const map: Record<PlanCategory, string> = {
    love: 'Sort out my relationship',
    job: 'Land a new role',
    promotion: 'Get the promotion',
    startup: 'Get the venture off the ground',
    health: 'Get my health in order',
    purchase: 'Make the purchase',
    study: 'Pass the qualification',
    money: 'Get on top of my money',
    other: 'My plan',
  };
  return map[category];
};

/** Shown when a horizon is short enough that the plan will be dense. Trust-builder: an app
 *  that never pushes back reads as a horoscope. */
export const tightHorizonWarning =
  "That's a fast one. It's possible, but the plan will be dense and there's no slack for a bad window.";
