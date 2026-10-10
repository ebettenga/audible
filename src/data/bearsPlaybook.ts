/**
 * Bears 2026 offense — training reconstruction from public film.
 * Scheme identity: Ben Johnson (under-center boot / play-action, 11–13p).
 * Not official team docs.
 */

import type { Collection, Playbook, PlaybookPlay } from '@/src/training/types';

type SeedPlay = Omit<PlaybookPlay, 'createdAt' | 'updatedAt' | 'favorite' | 'reviewCount'> & {
  favorite?: boolean;
};

function play(
  id: string,
  name: string,
  playcall: string,
  extras: Partial<SeedPlay> = {},
): SeedPlay {
  return {
    id,
    name,
    playcall,
    concept: extras.concept,
    formation: extras.formation,
    personnel: extras.personnel ?? '11',
    notes: extras.notes,
    coachingPoint: extras.coachingPoint,
    favorite: extras.favorite ?? false,
  };
}

/** Ben Johnson 2026 spine — teaching labels; playcalls use west-coast lexicon. */
export const BEARS_PLAYS: SeedPlay[] = [
  // --- Run ---
  play('chi-wz', 'Wide Zone', 'Ace Twins Right Wide Zone', {
    concept: 'Wide Zone',
    formation: 'Ace Twins',
    coachingPoint: 'Under-center stretch. Cutback vs overpursuit.',
    notes: 'Johnson base zone — pairs with boot / PA.',
    favorite: true,
  }),
  play('chi-gun-wz', 'Gun Wide Zone', 'Gun Doubles Right Wide Zone', {
    concept: 'Wide Zone',
    formation: 'Gun Doubles',
    coachingPoint: 'Same stretch rules from gun when tempoing.',
  }),
  play('chi-counter', 'Counter', 'Ace Twins Right Counter', {
    concept: 'Counter',
    formation: 'Ace Twins',
    personnel: '12',
    coachingPoint: 'Gap change-up when defenses sit on zone.',
  }),
  play('chi-toss', 'Toss Action', 'Ace Balanced Right 28 Toss', {
    concept: '28 Toss',
    formation: 'Ace Balanced',
    personnel: '13',
    coachingPoint: 'Toss / toss-action boot look from 13p.',
    notes: 'Heavy personnel edge run that sells boot.',
  }),
  play('chi-duo', 'Duo', 'Ace Twins Right Duo', {
    concept: 'Duo',
    formation: 'Ace Twins',
    personnel: '12',
    coachingPoint: 'Interior doubles; back reads frontside LB.',
  }),

  // --- Play action / boot ---
  play('chi-boot', 'PA Boot', 'Ace Twins Right Fake Wide Zone Boot', {
    concept: 'Boot',
    formation: 'Ace Twins',
    personnel: '12',
    coachingPoint: 'Signature Johnson boot off zone. Triangle read.',
    notes: 'Under-center boot — freeze LBs, move launch point.',
    favorite: true,
  }),
  play('chi-toss-boot', 'Toss Boot', 'Ace Balanced Right Fake 28 Toss Boot', {
    concept: 'Boot',
    formation: 'Ace Balanced',
    personnel: '13',
    coachingPoint: 'Sell toss, boot away. Flat is hot.',
  }),
  play('chi-pa-dagger', 'PA Dagger', 'Ace Twins Right Fake Wide Zone Dagger', {
    concept: 'Dagger',
    formation: 'Ace Twins',
    personnel: '12',
    coachingPoint: 'Thru / clear + dig. Hook control from the back after the fake.',
    notes: 'Public film: PA Dagger with Thru flattening vs man undercut.',
    favorite: true,
  }),
  play('chi-pa-cross', 'PA Cross', 'Ace Twins Right Fake Wide Zone High-Cross', {
    concept: 'High Cross',
    formation: 'Ace Twins',
    personnel: '12',
    coachingPoint: 'Three-level vertical stretch after zone fake.',
    favorite: true,
  }),

  // --- Named Johnson concepts ---
  play('chi-cross', 'Cross', 'Gun Doubles Right 62 High-Cross', {
    concept: 'High Cross',
    formation: 'Gun Doubles',
    coachingPoint: 'Cross attacks the flat on the cross side — three-level stretch.',
    notes: 'Teaching name Cross → High-Cross geometry.',
    favorite: true,
  }),
  play('chi-latch', 'Latch Cross', 'Gun Trips Right 62 High-Cross', {
    concept: 'High Cross',
    formation: 'Gun Trips',
    personnel: '12',
    coachingPoint: 'Latch stops on the far hash to suck the safety; vertical behind.',
    notes: 'Latch variant of Cross from public 12p cutups.',
  }),
  play('chi-branch-drive', 'Branch Drive', 'Gun Doubles Right 62 Drive', {
    concept: 'Drive',
    formation: 'Gun Doubles',
    coachingPoint: 'Drive with Branch (Y) pairing. Shallow + dig.',
    notes: 'Branch-Drive teaching name — Drive geometry.',
    favorite: true,
  }),
  play('chi-outside-dig', 'Outside Dig', 'Gun Doubles Right 62 Dagger', {
    concept: 'Dagger',
    formation: 'Gun Doubles',
    coachingPoint: 'Outside dig 16–18y with deep over / clear. Push the ball.',
    notes: 'Outside Dig teaching name → Dagger geometry.',
  }),
  play('chi-4v', 'Four Verts', 'Gun Trips Right 62 Four-Verticals', {
    concept: 'Four Verticals',
    formation: 'Gun Trips',
    coachingPoint: 'Push verticals when safeties sit on intermediate.',
  }),
  play('chi-mesh', 'Mesh', 'Gun Bunch Right 62 Mesh', {
    concept: 'Mesh',
    formation: 'Gun Bunch',
    coachingPoint: 'Man beater. Condensed bunch creates picks.',
  }),
  play('chi-spacing', 'Spacing', 'Gun Doubles Right 62 Spacing', {
    concept: 'Spacing',
    formation: 'Gun Doubles',
    coachingPoint: 'Hitch / sit / flat — ball out under 2.5s.',
  }),
  play('chi-stick', 'Stick', 'Gun Trips Right 62 Stick', {
    concept: 'Stick',
    formation: 'Gun Trips',
    coachingPoint: 'Slot sit vs zone blitz / late pressure.',
  }),
  play('chi-smash', 'Smash', 'Gun Doubles Right 62 Smash', {
    concept: 'Smash',
    formation: 'Gun Doubles',
    coachingPoint: 'Corner / hitch high-low vs two-high.',
  }),

  // --- Empty / specialty ---
  play('chi-empty-mesh', 'Empty Mesh', 'Shotgun Empty Right 62 Mesh', {
    concept: 'Mesh',
    formation: 'Shotgun',
    personnel: '10',
    coachingPoint: 'Empty mesh when they show man pressure.',
  }),
  play('chi-y-cross', 'Y Cross', 'Ace Twins Right 62 High-Cross Y-Cross', {
    concept: 'High Cross',
    formation: 'Ace Twins',
    personnel: '12',
    coachingPoint: 'TE deep cross is the featured intermediate.',
  }),
  play('chi-12-dagger', '12 Dagger', 'Ace Twins Right 62 Dagger', {
    concept: 'Dagger',
    formation: 'Ace Twins',
    personnel: '12',
    coachingPoint: '12p dig behind the vertical clear.',
  }),
  play('chi-13-boot', '13 Boot', 'Ace Balanced Right Fake Wide Zone Boot', {
    concept: 'Boot',
    formation: 'Ace Balanced',
    personnel: '13',
    coachingPoint: 'Heavy personnel boot — sell run, work triangle.',
  }),
];

const CORE_IDS = [
  'chi-wz',
  'chi-boot',
  'chi-pa-dagger',
  'chi-cross',
  'chi-branch-drive',
  'chi-outside-dig',
  'chi-4v',
  'chi-counter',
  'chi-duo',
  'chi-spacing',
  'chi-mesh',
  'chi-stick',
];

const PA_IDS = [
  'chi-boot',
  'chi-toss-boot',
  'chi-pa-dagger',
  'chi-pa-cross',
  'chi-13-boot',
  'chi-latch',
];

const THIRD_IDS = [
  'chi-branch-drive',
  'chi-mesh',
  'chi-stick',
  'chi-4v',
  'chi-outside-dig',
  'chi-spacing',
  'chi-empty-mesh',
];

const RZ_IDS = [
  'chi-smash',
  'chi-mesh',
  'chi-boot',
  'chi-toss',
  'chi-13-boot',
  'chi-stick',
];

export function bearsCollections(bookId: string, now: string): Collection[] {
  return [
    {
      id: 'col-chi-core',
      bookId,
      name: 'Core Install',
      color: '#0c2340',
      playIds: [...CORE_IDS],
      isActive: true,
      description: 'Ben Johnson 2026 spine — under-center PA, Cross, Drive, Dagger.',
      createdAt: now,
    },
    {
      id: 'col-chi-pa',
      bookId,
      name: 'Play Action / Boot',
      color: '#c83803',
      playIds: [...PA_IDS],
      isActive: false,
      description: 'Boots and PA off zone / toss.',
      createdAt: now,
    },
    {
      id: 'col-chi-third',
      bookId,
      name: 'Third Down',
      color: '#73baf2',
      playIds: [...THIRD_IDS],
      isActive: false,
      createdAt: now,
    },
    {
      id: 'col-chi-rz',
      bookId,
      name: 'Red Zone',
      color: '#dc79ad',
      playIds: [...RZ_IDS],
      isActive: false,
      createdAt: now,
    },
  ];
}

export const BEARS_BOOK_ID = 'bears-2026';

export function buildBearsPlaybook(now = new Date().toISOString()): Playbook {
  const bookId = BEARS_BOOK_ID;
  const plays: PlaybookPlay[] = BEARS_PLAYS.map((p) => ({
    ...p,
    side: 'off' as const,
    favorite: p.favorite ?? false,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  }));

  return {
    id: bookId,
    name: 'Bears 2026',
    updatedAt: now,
    systemIds: ['west-coast', 'air-coryell'],
    customLexicon: [],
    plays,
    collections: bearsCollections(bookId, now),
  };
}

/** True when this book is the seeded Bears 2026 install. */
export function isBearsSeedBook(book: Playbook): boolean {
  if (book.id === BEARS_BOOK_ID) return true;
  if (/bears\s*2026/i.test(book.name)) return true;
  const chi = book.plays.filter((p) => p.id.startsWith('chi-')).length;
  return chi >= 8;
}
