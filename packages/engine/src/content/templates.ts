// ─────────────────────────────────────────────────────────────────────────────
// Template bank (Tier 6, SPEC §6.1/§6.3). Deterministic, offline, free. Every beat
// is honest (a real gift paired with a real trap), agency-first (never doom), and
// jargon-free. Remedies come only from the approved behavioural library (App E).
//
// The no-jargon lint test (test/no-jargon.test.ts) scans every string here.
// ─────────────────────────────────────────────────────────────────────────────

import type { Energy, LifeArea } from '../types.js';

export interface EnergyContent {
  /** Serif "oracle voice" headline fragments. */
  headlines: string[];
  gift: string[];
  trap: string[];
  /** Generic best-action lines; specialised by area below when available. */
  move: string[];
  watch: string[];
  /** Behavioural remedies (App E), rotated. */
  remedies: string[];
  /** Short remedy for the Today pill. */
  remedyShort: string[];
  /** Area-specialised moves keyed by the hot life-area / goal. */
  moveByArea?: Partial<Record<LifeArea, string[]>>;
}

export const CONTENT: Record<Energy, EnergyContent> = {
  // ── Main Character (Sun) ───────────────────────────────────────────────────
  main: {
    headlines: ['You’re meant to be seen today.', 'Step to the front.', 'Your moment to lead.'],
    gift: [
      'Confidence and presence are with you. This is the time to lead, pitch, post, and be seen — people follow your energy right now.',
      'You carry natural authority today. Take the visible role; your clarity gives other people something to line up behind.',
      'The room turns toward you today. Whatever you put out — an idea, a stance, a piece of work — carries further than usual. Use the reach.',
    ],
    trap: [
      'Right now you’re performing for a reaction instead of doing the work — clocking who noticed, letting one person’s silence weigh more than it should. It’s the loop this energy makes; your worth isn’t on loan from the room.',
      'You start needing the applause. Attention isn’t the same as worth — don’t perform just to be validated.',
      'Pride wants to make this about being right instead of being useful. Ego is loud today; let it advise, not decide.',
    ],
    move: [
      'Say the idea out loud. Take the seat at the front. Lead without waiting for permission.',
      'Do one visible thing that moves you forward — and do it for the work, not the reaction.',
    ],
    watch: [
      'Someone’s approval will feel like the whole game. It isn’t. Don’t trade your direction for a moment of being liked.',
      'A bruised ego may tempt you to overreact to a small slight. Let it pass — it’s smaller than it feels.',
    ],
    remedies: [
      'Get morning sunlight within 30 minutes of waking — it anchors your confidence from the inside, so you shine without needing the crowd.',
      'Do one thing today for its own sake, not for applause. It reminds you your worth isn’t on loan from anyone.',
    ],
    remedyShort: ['Morning light within 30 min of waking', 'Do one thing just for you today'],
    moveByArea: {
      career: ['Put your name on the work. Pitch the thing, take the lead role — visibility compounds now.'],
      money: ['Ask for the raise or set the higher rate. Your worth is visible today — price it accordingly.'],
      partnership: ['Show up fully instead of managing how you land. Presence beats performance here.'],
      health: ['Move your body somewhere you can be seen — a class, a court. Being watched fuels you today.'],
      self: ['Back yourself out loud today. State what you want plainly, once, without over-explaining.'],
    },
  },

  // ── Big Feelings (Moon) ────────────────────────────────────────────────────
  feel: {
    headlines: ['Feelings run close today.', 'Soften. Come home to yourself.', 'A tender, intuitive stretch.'],
    gift: [
      'Deep intuition and empathy are online. Great for creating, healing, and getting close to the people who matter.',
      'You feel the room before you read it. Trust that radar today — it’s picking up something real.',
      'Your radar is wide open — you’ll sense what people aren’t saying. That empathy is the gift today: for making things, for mending things, for being the one who gets it.',
    ],
    trap: [
      'Right now you’re reading a neutral message as a rejection and building a whole story on it — then reacting to the story, not the fact. The feeling is real; the conclusion is the trap this tide makes.',
      'You treat every feeling as a fact. Moods swing, and you’re tempted to make a big call on a wave.',
      'A passing low convinces you it’s the whole truth. It’s weather, not climate — don’t sign anything to it.',
    ],
    move: [
      'Let the wave pass before you decide anything big. Protect your rest and reconnect with people who feel like home.',
      'Name what you’re feeling in one honest sentence. Naming the tide loosens its grip.',
    ],
    watch: [
      'A low hour will make a small slight feel permanent. Give it until tomorrow before you answer it.',
      'The urge to withdraw completely will be strong. Rest, yes — disappear, no.',
    ],
    remedies: [
      'Write one honest line about your mood tonight, and keep meals and water steady. Mood swings ride blood-sugar swings more than you’d think.',
      'Give yourself a real rest tonight — an early, unhurried wind-down. A tired mind exaggerates everything.',
    ],
    remedyShort: ['One-line mood note tonight + steady meals', 'Early, unhurried wind-down tonight'],
    moveByArea: {
      career: ['Lead with your read on the room — your instinct about people is the asset today. Don’t force a big call on a low mood.'],
      money: ['Don’t make a money decision on a feeling today. Sit with it one night; the tide passes.'],
      partnership: ['Say the soft true thing you’ve been holding. Closeness is the whole opportunity now.'],
      health: ['Protect your rest and eat steadily — your body is running your mood today. Gentle movement, not punishment.'],
      self: ['Be as kind to yourself as you are to everyone else. Name the feeling; don’t obey it.'],
      home: ['Tend your space and the people in it. Home is where your energy refills this week.'],
    },
  },

  // ── Fired Up (Mars) ────────────────────────────────────────────────────────
  fire: {
    headlines: ['There’s heat behind you today.', 'Move. Burn it clean.', 'Courage is cheap right now — spend it.'],
    gift: [
      'Drive, courage and initiative are high. This is the day to start the hard thing and push through resistance.',
      'You’ve got the energy to break a stalemate. One decisive action clears what a week of thinking couldn’t.',
      'There’s clean power behind you. The thing you’ve been circling — you can break it open today with one committed push.',
    ],
    trap: [
      'Right now you’re rehearsing the sharp reply in your head instead of stating the boundary once, plainly. The heat wants a fight; the situation just needs a sentence. That’s the loop — spend the fire on the task, not the person.',
      'The same heat leaks out as friction — a sharp reply, an impatient move. Speed becomes recklessness if you don’t aim it.',
      'You mistake urgency for importance and pick a fight that costs more than it wins.',
    ],
    move: [
      'Point the drive at the hardest useful task and go. Physical, decisive action beats stewing today.',
      'Do the hardest piece first, before the day negotiates you down. Momentum is the reward for moving first.',
    ],
    watch: [
      'A conversation could turn into a clash over nothing. Hold the sharp message 24 hours before you send it.',
      'Impatience will push you to force a result that just needs another beat. Don’t kick the door you can open.',
    ],
    remedies: [
      'Burn the heat physically — a hard workout or a fast walk. Channelled through the body, the drive stops leaking as conflict.',
      'Give any angry message the 24-hour rule. If it still matters tomorrow, send it calmer.',
    ],
    remedyShort: ['Burn the heat with hard exercise', '24-hour rule before any angry message'],
    moveByArea: {
      career: ['Make the bold ask or ship the hard piece today. Decisiveness reads as leadership now.'],
      health: ['Put the energy into your body on purpose — train, don’t simmer. It steadies the mind too.'],
      self: ['Do the brave small thing you keep postponing. Action is the antidote to the restlessness.'],
    },
  },

  // ── Busy Mind (Mercury) ────────────────────────────────────────────────────
  mind: {
    headlines: ['The mind is quick today.', 'Think it, then close the loop.', 'Sharp for words and deals.'],
    gift: [
      'Fast, clever thinking is with you — good for writing, talking, negotiating, and solving the knot that’s been stuck.',
      'You can find the words today. Say the thing, write the message, make the case — it lands.',
      'Ideas come fast and connect well. Today the mind is a scalpel, not a hammer — a day to solve, pitch, and negotiate.',
    ],
    trap: [
      'Right now you’re overthinking the message instead of just sending the honest version — twenty drafts, no send. The clever objection keeps beating the plain right answer. It’s a loop this energy makes, not the truth.',
      'The same speed becomes spin: twenty tabs, no decision. Cleverness argues you out of the obvious.',
      'Overthinking dresses up as diligence. You’re not analysing — you’re looping.',
    ],
    move: [
      'Single-task. Pick the one decision, write it down to end the loop, and act before you re-open it.',
      'Turn the thinking into one clear message or one clear choice. Motion creates the clarity, not more thinking.',
    ],
    watch: [
      'You may talk yourself out of a good, simple choice. Beware the clever objection to the plain right answer.',
      'A small miscommunication could snowball. Read it twice, assume good faith, reply once.',
    ],
    remedies: [
      'Work in single-task blocks with your phone in another room, and write the decision down to close the mental loop.',
      'Get the swirling thoughts onto paper for five minutes. On the page they’re smaller and sortable.',
    ],
    remedyShort: ['Single-task, phone in another room', 'Write the decision down to end the loop'],
    moveByArea: {
      money: ['Do the numbers once, decide, and stop re-checking. The spreadsheet won’t get truer by staring.'],
      communication: ['Send the clear message you’ve been drafting in your head. Said plainly, it works.'],
      career: ['Make the one decision that’s been blocking everything downstream, and write it down.'],
    },
  },

  // ── Green Light (Jupiter) ──────────────────────────────────────────────────
  grow: {
    headlines: ['Doors are giving today.', 'Say yes to the big one.', 'Room to grow — take it.'],
    gift: [
      'Opportunity comes looking for you — a person, an offer, an opening. Your optimism is realistic for once; say yes to the big thing.',
      'The pressure eases and momentum returns. This is the payoff stretch — don’t sleep on it.',
      'The wind’s at your back. Say yes to the thing that scares you a little in the good way — the timing is genuinely on your side.',
    ],
    trap: [
      'Right now you’re saying yes to everything because it all looks good — and finishing none of it. Optimism is quietly turning into over-commitment; that’s the loop this energy makes, not the opportunity itself.',
      'Good luck makes you say yes to everything and finish nothing. What you overcommit to now, you pay for later.',
      'Abundance feels endless, so you get sloppy with the details. Growth without a container just leaks.',
    ],
    move: [
      'Pick the one opening that actually grows what you’re building and pour into it. Let the good-but-distracting offers pass.',
      'Choose depth over scatter. One real yes beats ten maybes right now.',
    ],
    watch: [
      'People show up when things are going well — some are real, some are here for the shine. Keep your circle honest.',
      'The temptation to expand past what you can hold is strong. Grow on purpose, not on impulse.',
    ],
    remedies: [
      'Write your top three goals before this window opens, and hold every new “yes” against them. Then teach or help someone — this energy grows when you share it.',
      'Pick one opportunity to go deep on and decline the rest this week. A container turns luck into results.',
    ],
    remedyShort: ['Name your top 3 goals, filter every “yes”', 'Go deep on one thing; help someone'],
    moveByArea: {
      career: ['Take the bigger role or the bigger bet — the one that stretches you. This is the season it pays off.'],
      money: ['Invest in the thing that compounds, not the thing that glitters. Patient growth is favoured now.'],
      luck: ['Follow the opening that came unbidden. Learning and mentors are especially fruitful this stretch.'],
    },
  },

  // ── Soft Spot (Venus) ──────────────────────────────────────────────────────
  love: {
    headlines: ['Warmth pulls toward you today.', 'Let it be beautiful.', 'Connection is the work now.'],
    gift: [
      'Charm and warmth are magnetic today — good for love, art, and repairing the thing that went a little cold.',
      'You draw people in without trying. Use it to connect, create, and make something feel good on purpose.',
      'You’re easy to be around today, and that opens doors force never could. Lead with warmth and watch what softens.',
    ],
    trap: [
      'Right now you’re smoothing it over instead of saying the true thing — keeping the peace by quietly abandoning your own position, and you’ll resent it later. That’s the loop this energy makes; the way out is one honest sentence.',
      'You smooth things over instead of solving them. Keeping the peace becomes avoiding the truth.',
      'Comfort tips into indulgence — one more, just this once, on repeat. Pleasure quietly runs the day.',
    ],
    move: [
      'Have the one honest, slightly uncomfortable conversation you’ve been avoiding. Real harmony sometimes needs a little friction.',
      'Make something with your hands, or give someone your full warm attention. Beauty made on purpose lifts everything.',
    ],
    watch: [
      'You may say yes to keep someone happy and resent it later. Kindness that costs your truth isn’t kindness.',
      'A pleasant distraction could eat the day. Enjoy it deliberately, then come back.',
    ],
    remedies: [
      'Have one honest, slightly uncomfortable conversation you’ve been putting off. Then make something with your hands — real harmony sometimes needs friction.',
      'Do one small beautiful thing on purpose today — for a person, or a space. It rebalances the whole mood.',
    ],
    remedyShort: ['Have the honest conversation you’re avoiding', 'Make one thing beautiful on purpose'],
    moveByArea: {
      partnership: ['Say the true thing kindly, not the smooth thing. Closeness grows from honesty now, not niceness.'],
      creativity: ['Make the thing. Your taste is sharp today — put it into something real.'],
      self: ['Give yourself the same warmth you hand out freely. Fill your own cup first today.'],
    },
  },

  // ── Heavy Lifting (Saturn) ─────────────────────────────────────────────────
  build: {
    headlines: ['Build the brick in front of you.', 'Slow is the fast way now.', 'The long game rewards you.'],
    gift: [
      'Your patience is turning into a weapon. What you lay down in this heaviness will outlast what the fast people are chasing — you’re not slow, you’re structural.',
      'This is the season that builds something real. Discipline now becomes the foundation everything later stands on.',
      'Every unglamorous thing you do today is a brick that stays. You’re not behind — you’re laying a foundation the fast people skip.',
    ],
    trap: [
      'Right now you’re isolating because you’ve decided no one gets the pressure you’re under — carrying it all alone as if that’s strength. It isn’t; it’s the trap this heaviness sets. The load is real; the solitude is optional.',
      'The weight convinces you it’s permanent, and you start to isolate. The heaviness is real; the story that it’ll never lift is not.',
      'You mistake exhaustion for failure and push harder instead of resting. Grinding on empty isn’t discipline.',
    ],
    move: [
      'Pick the one thing that actually matters this week and let the rest be noise. Depth beats scatter — do the next brick, not the whole map.',
      'Set one small consistent action and do it for the streak, not the result. Consistency is what this season pays out on.',
    ],
    watch: [
      'The urge to withdraw and carry it all alone will be strong. Isolation is the real risk here, not the workload.',
      'You may judge your pace against faster people and feel behind. Different clock — yours compounds.',
    ],
    remedies: [
      'Do one small consistent thing daily this week — for the streak, not the result — and get outside every day. This season rewards consistency; isolation is the real risk.',
      'Get outdoors and let one person in this week. Don’t carry the whole weight in silence.',
    ],
    remedyShort: ['One small daily action, for the streak', 'Get outside daily — don’t isolate'],
    moveByArea: {
      career: ['Do the unglamorous foundational work now. It’s the part that makes the later win hold.'],
      money: ['Build slow and steady — the boring consistent habit beats the clever shortcut this season.'],
      self: ['Keep one promise to yourself daily. Rebuilding self-trust is the real project right now.'],
    },
  },

  // ── Never Enough (Rahu) ────────────────────────────────────────────────────
  crave: {
    headlines: ['Hunger and noise today.', 'Aim it at one thing.', 'Restless — that’s fuel, not fact.'],
    gift: [
      'This drive is rocket fuel if you point it. Big ambition, unconventional wins and real hustle all live here.',
      'The restlessness can move mountains aimed at one target. Pointed, it’s the most powerful energy you’ve got.',
      'That hunger is horsepower. Aimed at one real target today, it’ll take you somewhere the comfortable never reach.',
    ],
    trap: [
      'Right now you’re measuring yourself against someone’s highlight reel and calling the panic “ambition.” You’re not behind — you’re running their race in your head. That’s the loop this hunger makes; pick your own one thing.',
      'You feel behind and chase the next shiny thing. The anxiety is loud, but it’s a story, not a fact — you’re being pulled by a feeling, not the facts.',
      'The hunger says “more, faster” about everything at once, so nothing gets finished. Craving pretends to be ambition.',
    ],
    move: [
      'Pick one target and starve the noise. Say no to a shiny distraction today — on purpose. Nothing real needs you to panic-decide.',
      'Choose the one thing that matters and let the other ten be noise. Depth is the exit from the spin.',
    ],
    watch: [
      'Something will bait your urgency — a message, a comparison, a “now or never.” It’s a mirage; let it sit 24 hours.',
      'Comparison will bite hardest right after you open a feed. Notice that trigger, then close it.',
    ],
    remedies: [
      'Fix your sleep window for 7 days — up early, down early — and cut screens before bed. The fog and overthinking feed on late nights; morning light beats any plan.',
      'Cut your inputs before bed for a week. The craving quiets when the nervous system finally gets dark and rest.',
    ],
    remedyShort: ['Fix your sleep window — up early, down early', 'Cut screens before bed for a week'],
    moveByArea: {
      career: ['Bet big but on ONE thing. Your ambition is an asset the moment it stops scattering.'],
      money: ['Resist the shiny risk that promises fast. Aim the hunger at one patient play instead.'],
      self: ['Give the restlessness a single worthy target today. Fed one thing, it stops eating you.'],
    },
  },

  // ── Letting Go (Ketu) ──────────────────────────────────────────────────────
  let: {
    headlines: ['Something is ready to be released.', 'Loosen your grip.', 'Less, on purpose, today.'],
    gift: [
      'Clarity comes from detachment now. You can see what actually matters because you’ve stopped clutching what doesn’t.',
      'This is a rare stretch for insight and letting go — endings that make room, and a quiet that’s actually peace.',
      'There’s clarity in the loosening. What you’re ready to set down was never the point — and putting it down frees both hands.',
    ],
    trap: [
      'Right now you’re calling avoidance “detachment” — quietly checking out of something that still matters and telling yourself you’re above it. Releasing is healthy; disappearing is the trap this energy sets.',
      'Detachment tips into disappearing. Letting go of a thing becomes checking out of everything.',
      'You dismiss what still matters as “not important” to avoid the effort. Numbness isn’t the same as peace.',
    ],
    move: [
      'Release one thing you’ve outgrown — a habit, a grudge, a plan that isn’t yours anymore. Then do one small thing that connects you to a person.',
      'Ground yourself and choose what to keep, gently. You don’t have to hold everything to be whole.',
    ],
    watch: [
      'The pull to withdraw from people will be strong. Release the weight, not the connections.',
      'You may quietly abandon something that still matters. Check before you let it drift.',
    ],
    remedies: [
      'Do a daily grounding practice — breath, a walk, or journaling — and one small thing that connects you to another person. Release without disappearing.',
      'Take a slow walk with no phone and let the mind empty. Then text one person you care about. Grounded, not gone.',
    ],
    remedyShort: ['Daily grounding: breath, a walk, journaling', 'Release the weight — keep the people'],
    moveByArea: {
      release: ['Let the outgrown thing go cleanly. The space it leaves is the point, not a loss.'],
      self: ['Loosen the grip on who you thought you had to be. Clarity is arriving through the letting go.'],
      partnership: ['Release the resentment, not the person. Say the forgiving thing and mean it.'],
    },
  },
};
