// The interpretation library. Authored text, versioned, shipped with the app.
//
// Written in plain English, in our own words — never lifted from any classical text.
// Rules it obeys, everywhere:
//   · Conditions, not predictions. Nothing here guarantees or forecasts an outcome.
//   · No banned vocabulary: no malefic, benefic, auspicious, remedies, doshas, lucky,
//     unlucky, blessed, destiny. Say what is happening instead.
//   · Behavioural suggestions only — never gemstones, fasting or ritual.
//   · No medical, legal or financial directives.
//
// Shape: one authored block per planet, plus a per-office scaling frame. The same planet
// reads differently as King (a decade of weather) and as Messenger (an afternoon), so the
// office supplies the timescale and the planet supplies the content.
//
// This is layer (a) of the plan in the spec — generic per planet × role. The eventual
// layer (c) personalises against house placement and dignity behind these same strings,
// without the UI changing.

import type { Graha } from '@aura/engine';
import type { Office } from '../theme/tokens';

export interface PlanetBlock {
  /** One image of the court under this ruler. Never mixed with another image. */
  kingdomImage: string;
  /** What the term is good at. */
  goodAt: string;
  /** What to move on. Verbs, not nouns. */
  moveOn: string;
  /** Habits and surroundings that turn the advantage on. */
  lifestyleOn: string;
  /** How you can tell it's working. */
  workingWhen: string;
  /** How the term goes wrong. Never doom — a shape, with an exit. */
  goesWrong: string;
  /** Habits that trigger the difficult side. */
  lifestyleTrigger: string;
  /** Early warning signs, phrased as observations rather than verdicts. */
  warningSigns: string;
  /** What to do if it's already happening. Always an action, always small. */
  alreadyInIt: string;
}

/** How each office frames the same content: the timescale, and what it governs. */
export const OFFICE_FRAME: Record<Office, { scale: string; scope: string }> = {
  king: {
    scale: 'for years',
    scope: 'This is the weather over your whole decade, not your week. It sets what kind of effort compounds.',
  },
  primeMinister: {
    scale: 'for months at a time',
    scope: 'This is the layer worth planning around — long enough to change how you work, short enough to feel.',
  },
  governor: {
    scale: 'for weeks',
    scope: 'This is the texture of the season you are in. It shifts what a given month is good for.',
  },
  magistrate: {
    scale: 'for days',
    scope: 'This colours a stretch of days. Useful for choosing when in the month to make a move.',
  },
  messenger: {
    scale: 'for hours',
    scope: 'This turns over faster than a birth time can be trusted. Read it as mood, never as a plan.',
  },
};

export const PLANET_BLOCK: Record<Graha, PlanetBlock> = {
  sun: {
    kingdomImage: 'The King steps out in person. Decisions get made in the room rather than passed down a corridor, and everyone can see who made them.',
    goodAt: 'Visibility, authorship and anything that needs one person to stand behind it. Recognition costs less effort than usual, and being the named owner of something works in your favour.',
    moveOn: 'Put your name on the work. Ask for the title, the byline, the lead. Have the conversation face to face rather than in writing.',
    lifestyleOn: 'Early starts suit this better than late nights. Daylight, movement, and one visible commitment per day rather than five private ones.',
    workingWhen: 'People come to you for the decision. You are being copied into things you used to have to ask about.',
    goesWrong: 'Pride picks fights that were never worth winning. Being right becomes more important than getting the outcome, and one bruised ego costs a working relationship.',
    lifestyleTrigger: 'Running on being seen. Skipping rest because momentum feels like proof. Treating disagreement as disrespect.',
    warningSigns: 'You are rehearsing arguments in the shower. You have described a colleague as not respecting you more than once this week.',
    alreadyInIt: 'Concede the small point out loud, today. It costs nothing and it resets the room faster than being proved right will.',
  },
  moon: {
    kingdomImage: 'The court moves on mood. The same request lands differently before and after lunch, and the room reads the ruler before it reads the paperwork.',
    goodAt: 'People, care and instinct. Anything that depends on being understood rather than being correct. Reading a room, holding a group, looking after something that is growing.',
    moveOn: 'Ask the person directly instead of building the case. Move on the read you already have. Repair something you let go quiet.',
    lifestyleOn: 'Sleep is the whole lever here. Water, regular meals, and time with people who leave you steadier than they found you.',
    workingWhen: 'Conversations go further than the words in them. People tell you things they had not planned to.',
    goesWrong: 'Mood becomes the plan. A bad night gets read as a bad life, and decisions taken on the low end of the swing are hard to unpick later.',
    lifestyleTrigger: 'Broken sleep, endless scrolling, and deciding things at midnight. Taking the temperature of the day from whoever texted first.',
    warningSigns: 'Your sense of how things are going changed twice today. You are making permanent decisions about a temporary feeling.',
    alreadyInIt: 'Postpone every decision by one night — not longer. Then eat something and read it again in the morning.',
  },
  mars: {
    kingdomImage: 'A war chief holds a short commission. Force is legal here: the door that needed three polite emails opens to one direct ask.',
    goodAt: 'Starting, cutting and shipping. Directness reads as confidence rather than pressure. Physical work, contested ground, anything that has been waiting on nerve.',
    moveOn: 'Send the thing you have been sitting on. Say your number first. Take the meeting you are not quite ready for.',
    lifestyleOn: 'Hard exercise early. Decisions before noon. One difficult conversation a day, not three. Protect sleep — it is the first thing to go.',
    workingWhen: 'Replies come faster than usual. People say yes to meetings. You feel slightly over-caffeinated even when you are not.',
    goesWrong: 'Speed without aim. Friction turns into a fight, and the message written at 11pm lands as an ultimatum in the morning.',
    lifestyleTrigger: 'Working angry. Skipping food and then negotiating. Answering the email that annoyed you while it still annoys you.',
    warningSigns: 'You are irritable about small things. You are drafting resignations. You are describing colleagues as obstacles.',
    alreadyInIt: 'Move the energy into the body, not the inbox. Reply tomorrow, not tonight. Nothing in this window is as urgent as it feels.',
  },
  mercury: {
    kingdomImage: 'The clerk rewrites every contract. Nothing moves until it is written down, and once it is written down it moves quickly.',
    goodAt: 'Words, deals, code and paperwork. Negotiation, teaching, anything with a document at the end. Fixing the thing nobody wants to read.',
    moveOn: 'Write it down and send it. Renegotiate the terms. Get the numbers in order. Learn the specific skill you have been circling.',
    lifestyleOn: 'Fewer inputs, more output. One list, not four. Short bursts with real breaks — this period runs hot and shallow if you let it.',
    workingWhen: 'Things you write get quoted back to you. Conversations end with a decision instead of another meeting.',
    goesWrong: 'Too many tabs open. Cleverness stands in for commitment, and the plan gets refined instead of started.',
    lifestyleTrigger: 'Reading about the work instead of doing it. Six half-projects. Talking a decision out until it dissolves.',
    warningSigns: 'You have explained your plan more times than you have advanced it. Your best hour today went to a group chat.',
    alreadyInIt: 'Pick the one item with a real deadline and finish it before opening anything else. Close the other tabs literally.',
  },
  jupiter: {
    kingdomImage: 'A patron keeps expanding the budget. Room appears — for the project, the team, the idea — and so does everything that fills room.',
    goodAt: 'Growth, teaching, mentors and scope. Asking for more works better than it usually does. Study, travel, and putting yourself in a bigger room.',
    moveOn: 'Ask for the bigger version. Find the person two steps ahead and ask them directly. Commit to the course, the move, the longer horizon.',
    lifestyleOn: 'Learning something structured. Generous with time, careful with money — this period inflates spending as easily as it inflates opportunity.',
    workingWhen: 'Doors open a size larger than you asked for. Someone senior takes an interest without being chased.',
    goesWrong: 'Everything inflates — cost, weight, timelines and promises included. You agree to a scope you would not have agreed to in writing.',
    lifestyleTrigger: 'Saying yes on enthusiasm. Buying the upgrade. Assuming the good stretch will fund the optimistic decision.',
    warningSigns: 'Your commitments outran your calendar. You have promised three people the same week.',
    alreadyInIt: 'Cut one commitment this week rather than finding time for all of them. Put the number in writing before you agree again.',
  },
  venus: {
    kingdomImage: 'The court holds a long banquet. Things get done through people who want to help, and the room itself starts to matter.',
    goodAt: 'Partnership, taste and negotiation — anything where being liked does the work. Money that arrives through people rather than effort. Design and appearance-facing work land better than they should.',
    moveOn: 'Ask for the thing that requires someone to want to give it to you. Renegotiate. Repair a relationship you let go cold. Make the space you live in better.',
    lifestyleOn: 'Keep your surroundings pleasant — this period is unusually sensitive to environment. Eat well rather than strictly. Sleep enough to look rested; here that is leverage, not vanity.',
    workingWhen: 'Things feel easier than they should. People offer before you ask. You stop having to convince.',
    goesWrong: 'Comfort quietly becomes avoidance. The hard conversation keeps getting postponed because the pleasant version of the day is always available. Nothing collapses — it drifts.',
    lifestyleTrigger: 'Late nights blurring into late mornings. Spending as self-soothing. Staying somewhere because leaving would be unpleasant.',
    warningSigns: 'Your calendar is full and nothing on it is difficult. You are buying things instead of deciding things. You have called a real problem "fine" twice this week.',
    alreadyInIt: 'Pick the smallest unpleasant task and do it before noon. This period does not respond to force — it responds to one honest thing done early.',
  },
  saturn: {
    kingdomImage: 'The King appoints an auditor. Every request passes a desk first — and whatever clears that desk is built to last.',
    goodAt: 'Slow, boring, repeated work that compounds. Foundations, systems, discipline, and anything where the reward is on the far side of a lot of unglamorous effort.',
    moveOn: 'Build the base nobody sees. Fix the process rather than the instance. Commit to the daily version instead of the heroic version.',
    lifestyleOn: 'Same time, same place, every day. Less variety, more repetition. Physical routine matters more here than motivation does.',
    workingWhen: 'Nothing feels fast, and yet the thing you were building three months ago is now real and does not need rebuilding.',
    goesWrong: 'Delay reads as failure. Progress is real but invisible, and the temptation is to conclude the whole direction was wrong and start again.',
    lifestyleTrigger: 'Measuring a long project by how it felt this week. Skipping the routine because it produced nothing visible. Isolating.',
    warningSigns: 'You are comparing your timeline to someone else\'s. You have restarted the same thing twice. You describe steady work as being stuck.',
    alreadyInIt: 'Shrink the daily commitment until it is boringly achievable, then do it for two more weeks before judging it.',
  },
  rahu: {
    kingdomImage: 'A foreign envoy arrives that nobody can quite read. The unfamiliar option is on the table, and the usual rules are not being enforced.',
    goodAt: 'Unconventional routes. Foreign, new and untested ground. Visibility that arrives suddenly. Bets that do not need permission from the people who normally give it.',
    moveOn: 'Try the route that is not the standard one. Go where you have no history. Put the unusual version of the idea in front of someone.',
    lifestyleOn: 'Novelty in the work, structure in the day — this period supplies its own chaos and does not need help. Sleep and food are the ballast.',
    workingWhen: 'Something moves much faster than its normal timeline. Attention arrives from a direction you did not cultivate.',
    goesWrong: 'Wanting outruns knowing. The shortcut arrives with a bill, and the appetite for more keeps the target moving so nothing counts as enough.',
    lifestyleTrigger: 'Chasing the next thing before the last one has landed. Comparison at volume. Deciding fast because waiting feels like losing.',
    warningSigns: 'You have changed direction twice this month. You cannot say what would count as enough. You are keeping part of the plan from people who would question it.',
    alreadyInIt: 'Write down what "enough" is, with a number and a date, and show it to one person. Then hold the current direction for a fixed period before changing it.',
  },
  ketu: {
    kingdomImage: 'A minister is already packing to leave. Attention narrows to one thing and quietly withdraws from everything else.',
    goodAt: 'Depth over breadth. Finishing, mastering, or letting go. Research, craft, and the kind of focus that ignores what is happening elsewhere.',
    moveOn: 'Finish the thing that is nearly done. Go one level deeper into the one subject. Close what you already know you are done with.',
    lifestyleOn: 'Fewer commitments, longer blocks. Solitude used deliberately rather than by drift. One practice done properly.',
    workingWhen: 'Your interest concentrates without effort. Work you had been forcing becomes absorbing, and the noise stops mattering.',
    goesWrong: 'Detachment lands on the one thing that was actually working. Interest drains from something worth keeping, and the exit gets rationalised afterwards.',
    lifestyleTrigger: 'Withdrawing from people while calling it focus. Dropping maintenance on things that only need maintenance. Deciding you never wanted it.',
    warningSigns: 'You have gone quiet on someone who did nothing wrong. You are dismissing something you fought for six months ago.',
    alreadyInIt: 'Before dropping anything, name what you would need for it to be worth keeping. If the answer is small, do that and decide later.',
  },
};

/** The "In the Kingdom" paragraph: the planet's image, scaled to the office. */
export function kingdomLine(lord: Graha, office: Office): string {
  return `${PLANET_BLOCK[lord].kingdomImage} ${OFFICE_FRAME[office].scope}`;
}

export interface Section { heading: string; body: string }

export function advantageSections(lord: Graha, office: Office): Section[] {
  const b = PLANET_BLOCK[lord];
  // The office supplies the timescale, so the same advantage doesn't read as an
  // afternoon's mood and a decade's weather in the same words.
  const scale = OFFICE_FRAME[office].scale;
  return [
    { heading: 'What this period is good at', body: `${b.goodAt} This holds ${scale}.` },
    { heading: 'Move on this', body: b.moveOn },
    { heading: 'What turns it on', body: b.lifestyleOn },
    { heading: `You'll know it's working when`, body: b.workingWhen },
  ];
}

export function obstacleSections(lord: Graha, office: Office): Section[] {
  const b = PLANET_BLOCK[lord];
  const scale = OFFICE_FRAME[office].scale;
  return [
    { heading: 'How this period goes wrong', body: `${b.goesWrong} This pattern runs ${scale}.` },
    { heading: 'What triggers it', body: b.lifestyleTrigger },
    { heading: 'Early warning signs', body: b.warningSigns },
    { heading: "If you're already in it", body: b.alreadyInIt },
  ];
}

/** Shown once, quietly, on every detail page. Never as a modal. */
export const DISCLAIMER =
  'This describes conditions, not outcomes. What you do with them is yours.';

/** Health copy needs one extra line wherever the body is mentioned. */
export const HEALTH_NOTE =
  'Not medical advice. If something hurts, see a doctor — the timing conversation can wait.';
