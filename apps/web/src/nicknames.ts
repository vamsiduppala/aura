import type { Graha } from '@aura/engine';

// A playful nickname that matches the flavour of the user's current antardasha (sub-period).
// 21 per planet, all on-theme; one is picked at random on each page load — a small delight.
export const NICKNAMES: Record<Graha, string[]> = {
  sun: [ // radiance · leadership · being seen
    'Sunlight', 'Headliner', 'Spotlight', 'Golden One', 'The Lead', 'Bright Spark',
    'Center Stage', 'Daybreak', 'Crown', 'Beacon', 'The Original', 'Sunny',
    'Marquee', 'Radiant', 'The Main Event', 'Solar', 'Firstlight', 'Glow-getter',
    'The Standout', 'Shine', 'Trailblazer',
  ],
  moon: [ // feeling · nurture · moods
    'Moonchild', 'Tender Heart', 'Soft Tide', 'Gentle One', 'Dreamweaver', 'Still Water',
    'Nightlight', 'Comfort', 'The Empath', 'Moonbeam', 'Harbor', 'Sea Glass',
    'Lullaby', 'Wavelength', 'The Nurturer', 'Quiet Storm', 'Silver', 'Homebody',
    'Deep Feeler', 'Twilight', 'Hearthfire',
  ],
  mars: [ // drive · courage · heat
    'Firecracker', 'The Spark', 'Pathfinder', 'Bold One', 'Red Runner', 'Go-getter',
    'Hotshot', 'The Charge', 'Fearless', 'Ignition', 'Warrior', 'First Mover',
    'Flint', 'The Engine', 'Daredevil', 'Full Throttle', 'Blaze', 'The Push',
    'Spearhead', 'Live Wire', 'Rocket',
  ],
  mercury: [ // wit · words · learning
    'Quicksilver', 'Wordsmith', 'Bright Mind', 'The Wit', 'Fast Talker', 'Puzzle Solver',
    'Curious One', 'Messenger', 'Cleverclogs', 'The Analyst', 'Silver Tongue', 'Bookmark',
    'Brainwave', 'The Connector', 'Notebook', 'Quick Study', 'Wordplay', 'The Networker',
    'Bright Idea', 'Chatterbox', 'Codebreaker',
  ],
  jupiter: [ // wisdom · luck · growth
    'Lucky One', 'The Sage', 'Big Sky', 'Goldenheart', 'The Optimist', 'Growth Spurt',
    'Wisdom Seeker', 'Fortune', 'The Guru', 'Open Road', 'Generous Soul', 'Tailwind',
    'The Believer', 'Grand Vision', 'Silver Lining', 'The Mentor', 'Abundance', 'High Hopes',
    'The Expander', 'Green Light', 'Blessing',
  ],
  venus: [ // love · beauty · charm
    'Sweetheart', 'Charmer', 'The Muse', 'Rosewater', 'Velvet', 'Heartthrob',
    'The Aesthete', 'Honey', 'Soft Spot', 'The Romantic', 'Bloom', 'Peaches',
    'The Artist', 'Magnetic', 'Sugar', 'Lovebird', 'Silk', 'The Darling',
    'Starry-eyed', 'Petal', 'Grace',
  ],
  saturn: [ // discipline · endurance · the long build
    'The Rock', 'Slow Burn', 'Steady Hand', 'The Builder', 'Ironwill', 'Long Game',
    'The Anchor', 'Backbone', 'Marathoner', 'The Grinder', 'Bedrock', 'Old Soul',
    'The Foreman', 'Patient One', 'Deep Roots', 'The Architect', 'Stonemason', 'Discipline',
    'The Vault', 'Timekeeper', 'Heavy Lifter',
  ],
  rahu: [ // hunger · ambition · the unconventional
    'The Hungry One', 'Moonshot', 'Boundary-breaker', 'Wildcard', 'The Climber', 'More-More',
    'The Maverick', 'Restless', 'Big Dreamer', 'The Outsider', 'Skyhigh', 'Insatiable',
    'The Disruptor', 'Neon', 'Rulebreaker', 'Empire-builder', 'The Gambler', 'Overdrive',
    'Shapeshifter', 'The Craving', 'Event Horizon',
  ],
  ketu: [ // detachment · release · the seeker
    'The Seeker', 'Free Spirit', 'Old Ghost', 'The Mystic', 'Featherlight', 'The Hermit',
    'Loose Thread', 'Driftwood', 'The Untethered', 'Smoke', 'Half-here', 'The Renunciate',
    'Vanishing Point', 'Quiet Exit', 'The Monk', 'Letting Go', 'Comet Tail', 'The Wanderer',
    'Nomad', 'Ash', 'The Unbound',
  ],
};

/** A random on-theme nickname for the given antardasha planet (fresh each call/reload). */
export function nicknameFor(graha: Graha): string {
  const list = NICKNAMES[graha];
  return list[Math.floor(Math.random() * list.length)]!;
}
