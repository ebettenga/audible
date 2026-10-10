/**
 * Packers 2026 West Coast install — training reconstruction from public film.
 * Display names are free teaching labels; playcalls use west-coast lexicon.
 */

import type { Collection, Playbook, PlaybookPlay } from '@/src/training/types';
import {
  PACKERS_DEFENSE_PLAYS,
  packersDefenseCollections,
} from './packersDefense';

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

/** All unique plays in the Packers 2026 book. */
export const PACKERS_PLAYS: SeedPlay[] = [
  // --- Year 1 run ---
  play('gb-wz-rt', 'Wide Zone Rt', 'Gun Doubles Right Wide Zone', {
    concept: 'Wide Zone',
    formation: 'Gun Doubles',
    coachingPoint: 'Stretch the front; cutback vs overpursuit.',
    notes: 'Base outside zone from 11p 2x2.',
    favorite: true,
  }),
  play('gb-wz-lt', 'Wide Zone Lt', 'Gun Doubles Left Wide Zone', {
    concept: 'Wide Zone',
    formation: 'Gun Doubles',
    coachingPoint: 'Mirror stretch left. Same cut rules.',
  }),
  play('gb-iz-rt', 'Inside Zone Rt', 'Gun Doubles Right Inside Zone', {
    concept: 'Inside Zone',
    formation: 'Gun Doubles',
    coachingPoint: 'Press A/B, one-cut vertical.',
  }),
  play('gb-split-zone', 'Split Zone', 'Ace Twins Right Split Zone', {
    concept: 'Split Zone',
    formation: 'Ace Twins',
    personnel: '12',
    coachingPoint: 'Backside insert creates cutback.',
    notes: '12p TE insert look.',
  }),
  play('gb-duo', 'Duo', 'Gun Doubles Right Duo', {
    concept: 'Duo',
    formation: 'Gun Doubles',
    coachingPoint: 'Double teams climb; back reads frontside LB.',
  }),

  // --- Year 1 play action ---
  play('gb-boot-wz', 'PA Boot', 'Gun Doubles Tight Right Fake Wide Zone Boot', {
    concept: 'Boot',
    formation: 'Gun Doubles',
    coachingPoint: 'Sell wide zone, boot away. High-low sail.',
    notes: 'Condensed 2x2. Staple off the run game.',
    favorite: true,
  }),
  play('gb-boot-duo', 'Frontside Boot', 'Gun Doubles Tight Right Fake Duo Boot', {
    concept: 'Boot',
    formation: 'Gun Doubles',
    coachingPoint: 'Boot to the handoff side. Flat is hot.',
    notes: 'Insert/frontside boot variant from 2026 tape.',
  }),
  play('gb-high-cross-pa', 'PA High Cross', 'Gun Trips Right Fake Wide Zone High-Cross', {
    concept: 'High Cross',
    formation: 'Gun Trips',
    coachingPoint: 'Two deep crossers vs single-high / man-free.',
  }),

  // --- Year 1 quick game ---
  play('gb-slant-flat', 'Slant Flat', 'Gun Doubles Right 62 Slant-Flat', {
    concept: 'Slant / Flat',
    formation: 'Gun Doubles',
    coachingPoint: 'Outside slant, slot flat. Beat pressure.',
    favorite: true,
  }),
  play('gb-spacing', 'Spacing', 'Gun Doubles Right 62 Spacing', {
    concept: 'Spacing',
    formation: 'Gun Doubles',
    coachingPoint: 'Hitch / sit / flat — ball out under 2.5s.',
    notes: 'Bears week hot: Allen blitz/stunt rate is high.',
    favorite: true,
  }),
  play('gb-stick', 'Stick', 'Gun Trips Right 62 Stick', {
    concept: 'Stick',
    formation: 'Gun Trips',
    coachingPoint: 'Slot sit is the answer vs zone blitz.',
  }),

  // --- Year 1 beaters ---
  play('gb-mesh', 'Mesh', 'Gun Bunch Right 62 Mesh', {
    concept: 'Mesh',
    formation: 'Gun Bunch',
    coachingPoint: 'Two shallow crossers. Man beater.',
    notes: 'Condensed bunch creates natural picks.',
    favorite: true,
  }),
  play('gb-smash', 'Smash', 'Gun Doubles Right 62 Smash', {
    concept: 'Smash',
    formation: 'Gun Doubles',
    coachingPoint: 'High-low corner/hitch vs two-high.',
  }),
  play('gb-dagger', 'Dagger', 'Gun Doubles Right 62 Dagger', {
    concept: 'Dagger',
    formation: 'Gun Doubles',
    coachingPoint: 'Slot vertical clears; dig sits behind.',
  }),
  play('gb-4v', 'Four Verts', 'Gun Trips Right 62 Four-Verticals', {
    concept: 'Four Verticals',
    formation: 'Gun Trips',
    coachingPoint: 'Push verticals; take the shot on Watson.',
  }),

  // --- Year 1 RZ / short ---
  play('gb-nub-smash', 'Nub Smash', 'Gun Nub Right 62 Smash', {
    concept: 'Smash',
    formation: 'Gun Nub',
    coachingPoint: 'Nub TE frees the trips smash.',
  }),
  play('gb-te-flat', 'TE Flat GL', 'Ace Balanced Right Fake Split Zone Y-Flat', {
    concept: 'Boot',
    formation: 'Ace Balanced',
    personnel: '12',
    coachingPoint: 'Sell insert run; TE releases to the pylon.',
    notes: 'Kraft front-pylon look from Week 4.',
  }),
  play('gb-ace-duo', 'Ace Duo', 'Ace Twins Right Duo', {
    concept: 'Duo',
    formation: 'Ace Twins',
    personnel: '12',
    coachingPoint: 'Short-yardage duo from under center.',
  }),

  // --- Year 2 ---
  play('gb-jet', 'Jet Sweep', 'Gun Doubles Right Jet Sweep', {
    concept: 'Jet Sweep',
    formation: 'Gun Doubles',
    coachingPoint: 'Motion across; hit the edge.',
  }),
  play('gb-fake-jet-wz', 'Fake Jet Zone', 'Gun Doubles Right Fake Wide Zone', {
    concept: 'Wide Zone',
    formation: 'Gun Doubles',
    coachingPoint: 'Jet fake holds the edge; zone inside.',
    notes: 'Teaching name includes jet; diagram is PA wide zone.',
  }),
  play('gb-fake-jet-boot', 'Fake Jet Boot', 'Gun Doubles Right Fake Jet Sweep Boot', {
    concept: 'Boot',
    formation: 'Gun Doubles',
    coachingPoint: 'Jet fake into boot. Flat is early.',
  }),
  play('gb-empty-mesh', 'Empty Mesh', 'Shotgun Empty Right 62 Mesh', {
    concept: 'Mesh',
    formation: 'Shotgun',
    personnel: '10',
    coachingPoint: 'Empty mesh vs man pressure.',
  }),
  play('gb-empty-spacing', 'Empty Spacing', 'Shotgun Empty Right 62 Spacing', {
    concept: 'Spacing',
    formation: 'Shotgun',
    personnel: '10',
    coachingPoint: 'Tempo spacing when they disguise.',
    notes: 'Bears week: get out of the huddle when you have the look.',
  }),
  play('gb-12-dagger', '12 Dagger', 'Ace Twins Right 62 Dagger', {
    concept: 'Dagger',
    formation: 'Ace Twins',
    personnel: '12',
    coachingPoint: '12p dagger — dig behind the vertical.',
  }),
  play('gb-drive', 'Drive', 'Gun Doubles Right 62 Drive', {
    concept: 'Drive',
    formation: 'Gun Doubles',
    coachingPoint: 'Shallow + dig. Work intermediate.',
  }),
  play('gb-snag', 'Snag', 'Gun Doubles Right 62 Snag', {
    concept: 'Snag',
    formation: 'Gun Doubles',
    coachingPoint: 'Corner / sit / flat triangle.',
  }),
  play('gb-sail', 'Sail', 'Gun Trips Right 62 Boot', {
    concept: 'Boot',
    formation: 'Gun Trips',
    coachingPoint: 'Trips sail — corner, cross, flat.',
  }),
  play('gb-mirrored-sf', 'Mirrored Slant-Flat', 'Gun Doubles Right 62 Slant-Flat', {
    concept: 'Slant / Flat',
    formation: 'Gun Doubles',
    coachingPoint: 'Same concept both sides; pick the soft edge.',
    notes: 'Mirrored teaching name — diagram is slant-flat.',
  }),
  play('gb-tight-hc', 'Condensed High Cross', 'Gun Doubles Tight Right Fake Wide Zone High-Cross', {
    concept: 'High Cross',
    formation: 'Gun Doubles',
    coachingPoint: 'Tight splits into high cross after zone fake.',
  }),
  play('gb-y-cross', 'Y Cross', 'Ace Twins Right 62 High-Cross Y-Cross', {
    concept: 'High Cross',
    formation: 'Ace Twins',
    personnel: '12',
    coachingPoint: 'TE deep cross is the featured read.',
  }),
  play('gb-jet-wheel', 'Jet Wheel', 'Gun Trips Right Jet Sweep Z-Wheel', {
    concept: 'Jet Sweep',
    formation: 'Gun Trips',
    coachingPoint: 'Jet path into wheel if they overplay.',
  }),
  play('gb-insert-corner', 'Insert Corner', 'Ace Balanced Right Fake Split Zone Z-Corner', {
    concept: 'Boot',
    formation: 'Ace Balanced',
    personnel: '12',
    coachingPoint: 'WR insert, then corner through the line.',
    notes: 'Watson insert corner TD look.',
  }),
  play('gb-arches', 'Arches', 'Gun Doubles Right 62 Arches', {
    concept: 'Arches',
    formation: 'Gun Doubles',
    coachingPoint: 'Delayed option vs the vertical push.',
  }),
  play('gb-nub-fade', 'Nub Fade Out', 'Gun Nub Right 62 Smash', {
    concept: 'Smash',
    formation: 'Gun Nub',
    coachingPoint: 'Quick out / fade from nub bunch — goal line.',
    notes: 'Reed Week 4 GL look (teaching name).',
    favorite: true,
  }),

  // --- 2026 Year-1 reset extras (public film / reporting) ---
  play('gb-counter-strong', 'Counter Strong', 'Gun Doubles Right Counter', {
    concept: 'Counter',
    formation: 'Gun Doubles',
    coachingPoint: 'Gap counter with FSTE / lead. Account for secondary scrape.',
    notes: 'Documented 2025–26 Counter Strong family — escort / GT variants.',
  }),
  play('gb-pistol-counter', 'Pistol Counter', 'Pistol Right Counter', {
    concept: 'Counter',
    formation: 'Pistol',
    coachingPoint: 'Pistol set into counter. Escort motion holds the edge.',
    notes: 'Pistol counter look from public cutups.',
  }),
  play('gb-uc-boot', 'Under-Center Boot', 'Ace Twins Right Fake Wide Zone Boot', {
    concept: 'Boot',
    formation: 'Ace Twins',
    personnel: '12',
    coachingPoint: 'Year-1 reset: marry boots to the zone fake under center.',
    notes: '2026 emphasis — more under-center PA boot off wide zone.',
    favorite: true,
  }),
  play('gb-i-boot', 'I-Form Boot', 'I Right Fake Wide Zone Boot', {
    concept: 'Boot',
    formation: 'I',
    personnel: '21',
    coachingPoint: 'Classic I-form boot. Flat is early; crosser is the shot.',
  }),
  play('gb-pistol-wz', 'Pistol Wide Zone', 'Pistol Right Wide Zone', {
    concept: 'Wide Zone',
    formation: 'Pistol',
    coachingPoint: 'Zone from pistol — stretch and cutback same rules.',
  }),
];

const Y1_IDS = [
  'gb-wz-rt',
  'gb-wz-lt',
  'gb-iz-rt',
  'gb-split-zone',
  'gb-duo',
  'gb-boot-wz',
  'gb-boot-duo',
  'gb-high-cross-pa',
  'gb-slant-flat',
  'gb-spacing',
  'gb-stick',
  'gb-mesh',
  'gb-smash',
  'gb-dagger',
  'gb-4v',
  'gb-nub-smash',
  'gb-te-flat',
  'gb-ace-duo',
  'gb-mirrored-sf',
  'gb-empty-spacing',
];

const Y2_IDS = [
  'gb-jet',
  'gb-fake-jet-wz',
  'gb-fake-jet-boot',
  'gb-empty-mesh',
  'gb-empty-spacing',
  'gb-12-dagger',
  'gb-drive',
  'gb-snag',
  'gb-sail',
  'gb-mirrored-sf',
  'gb-tight-hc',
  'gb-y-cross',
  'gb-jet-wheel',
  'gb-insert-corner',
  'gb-arches',
  'gb-nub-fade',
];

/** Week 5 Bears script — active install for Sunday. */
export const BEARS_WEEK5_IDS = [
  'gb-spacing',
  'gb-slant-flat',
  'gb-stick',
  'gb-mesh',
  'gb-empty-spacing',
  'gb-smash',
  'gb-dagger',
  'gb-4v',
  'gb-boot-wz',
  'gb-boot-duo',
  'gb-wz-rt',
  'gb-duo',
  'gb-te-flat',
  'gb-nub-fade',
];

const RZ_IDS = [
  'gb-nub-smash',
  'gb-mesh',
  'gb-te-flat',
  'gb-insert-corner',
  'gb-nub-fade',
  'gb-spacing',
  'gb-smash',
];

const THIRD_IDS = [
  'gb-mesh',
  'gb-dagger',
  'gb-stick',
  'gb-4v',
  'gb-empty-mesh',
  'gb-snag',
  'gb-drive',
];

const PA_IDS = [
  'gb-boot-wz',
  'gb-boot-duo',
  'gb-high-cross-pa',
  'gb-fake-jet-boot',
  'gb-fake-jet-wz',
  'gb-tight-hc',
  'gb-insert-corner',
  'gb-te-flat',
  'gb-uc-boot',
  'gb-i-boot',
];

export function packersCollections(bookId: string, now: string): Collection[] {
  return [
    {
      id: 'col-bears-w5',
      bookId,
      name: 'Bears Week 5',
      color: '#0b4d2e',
      playIds: [...BEARS_WEEK5_IDS],
      isActive: true,
      description: 'Sunday script vs Allen pressure / two-high. Noon CT Lambeau.',
      targetDate: '2026-10-11',
      createdAt: now,
    },
    {
      id: 'col-year-1',
      bookId,
      name: 'Year 1 Install',
      color: '#c9f25b',
      playIds: [...Y1_IDS],
      isActive: false,
      description: 'Stripped-down 2026 spine — no-huddle ready.',
      createdAt: now,
    },
    {
      id: 'col-year-2',
      bookId,
      name: 'Year 2 Install',
      color: '#73baf2',
      playIds: [...Y2_IDS],
      isActive: false,
      description: 'Jet, empty, 12p, mirrored, specialty.',
      createdAt: now,
    },
    {
      id: 'col-red-zone',
      bookId,
      name: 'Red Zone',
      color: '#dc79ad',
      playIds: [...RZ_IDS],
      isActive: false,
      createdAt: now,
    },
    {
      id: 'col-third-down',
      bookId,
      name: 'Third Down',
      color: '#ae8ee8',
      playIds: [...THIRD_IDS],
      isActive: false,
      createdAt: now,
    },
    {
      id: 'col-play-action',
      bookId,
      name: 'Play Action',
      color: '#f0a55d',
      playIds: [...PA_IDS],
      isActive: false,
      createdAt: now,
    },
    ...packersDefenseCollections(bookId, now),
  ];
}

/** Stable playbook id — must not collide with legacy Coryell `default`. */
export const PACKERS_BOOK_ID = 'packers-2026';

export function buildPackersPlaybook(now = new Date().toISOString()): Playbook {
  const bookId = PACKERS_BOOK_ID;
  const offense: PlaybookPlay[] = PACKERS_PLAYS.map((p) => ({
    ...p,
    side: p.side ?? 'off',
    favorite: p.favorite ?? false,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  }));

  const defense: PlaybookPlay[] = PACKERS_DEFENSE_PLAYS.map((p) => ({
    ...p,
    side: 'def' as const,
    favorite: p.favorite ?? false,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  }));

  const plays = [...offense, ...defense];

  // Apply Bears-week coaching notes on overlapping plays
  const bearsNotes: Record<string, string> = {
    'gb-spacing': 'Vs Bears: Allen blitz/stunt — get it out. Kraft YAC.',
    'gb-slant-flat': 'Vs Bears: Hot answer when they send.',
    'gb-stick': 'Vs Bears: Sit window vs zone pressure.',
    'gb-mesh': 'Vs Bears: Man-beater when they blitz and lock.',
    'gb-empty-spacing': 'Vs Bears: Tempo when they disguise coverage.',
    'gb-smash': 'Vs Bears: Two-high high-low.',
    'gb-dagger': 'Vs Bears: Intermediate dig if they bail.',
    'gb-4v': 'Vs Bears: Take the shot if safeties sit.',
    'gb-boot-wz': 'Vs Bears: Still have to show PA off wide zone.',
    'gb-boot-duo': 'Vs Bears: Frontside boot / insert look.',
    'gb-wz-rt': 'Vs Bears: Must show the run even without Jacobs.',
    'gb-duo': 'Vs Bears: Interior run change-up.',
    'gb-te-flat': 'Vs Bears: Kraft pylon / 12p GL.',
    'gb-nub-fade': 'Vs Bears: Nub quick out / fade in the red zone.',
    'gb-uc-boot': 'Vs Bears: Under-center boot off zone — freeze LBs.',
    'gb-counter-strong': 'Vs Bears: Gap change-up when they sit on zone.',
    'gb-d-nick-c4': 'Vs Bears: Base quarters vs Johnson dig / cross game.',
    'gb-d-mug': 'Vs Bears: Mug to disrupt under-center protection.',
    'gb-d-penny': 'Vs Bears: Penny rotate — threaten blitz without tipping.',
  };
  for (const p of plays) {
    if (bearsNotes[p.id]) {
      p.notes = [p.notes, bearsNotes[p.id]].filter(Boolean).join(' ');
    }
  }

  return {
    id: bookId,
    name: 'Packers 2026 West Coast',
    updatedAt: now,
    systemIds: ['west-coast'],
    customLexicon: [],
    plays,
    collections: packersCollections(bookId, now),
  };
}

/** Legacy Air Coryell starter play ids — used to detect untouched default books. */
export const LEGACY_CORYELL_PLAY_IDS = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5'];

/**
 * Bump when seed contents or migration rules change.
 * v4 remints Packers off legacy `default` id.
 * v5 adds Packers defense looks + Bears 2026 book.
 */
export const PACKERS_SEED_VERSION = 5;
