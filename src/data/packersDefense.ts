/**
 * Packers 2026 defensive looks — training reconstruction from public film.
 * Scheme identity: Jonathan Gannon (3-4 / nickel / quarters). Not official team docs.
 */

import type { Collection, PlaybookPlay } from '@/src/training/types';

type SeedPlay = Omit<PlaybookPlay, 'createdAt' | 'updatedAt' | 'favorite' | 'reviewCount'> & {
  favorite?: boolean;
};

function defPlay(
  id: string,
  name: string,
  playcall: string,
  extras: Partial<SeedPlay> & {
    frontId: string;
    coverageId?: string;
    pressureId?: string;
    vsPlaycall?: string;
  },
): SeedPlay {
  return {
    id,
    name,
    playcall,
    side: 'def',
    frontId: extras.frontId,
    coverageId: extras.coverageId,
    pressureId: extras.pressureId,
    vsPlaycall: extras.vsPlaycall,
    concept: extras.concept,
    formation: extras.formation ?? extras.frontId,
    personnel: extras.personnel,
    notes: extras.notes,
    coachingPoint: extras.coachingPoint,
    favorite: extras.favorite ?? false,
  };
}

/** Gannon 2026 base and specialty looks. */
export const PACKERS_DEFENSE_PLAYS: SeedPlay[] = [
  defPlay('gb-d-34-c4', 'Base Quarters', '3-4 Cover 4', {
    frontId: '3-4',
    coverageId: 'cover-4',
    concept: 'Cover 4',
    coachingPoint: 'Two-high quarters from 3-4 base. Front four get home.',
    notes: 'Gannon identity look. Quarters > Cover 6 vs prior years.',
    vsPlaycall: 'Ace Twins Right Fake Wide Zone Dagger',
    favorite: true,
  }),
  defPlay('gb-d-nick-c4', 'Nickel Quarters', 'Nickel Cover 4', {
    frontId: 'nickel',
    coverageId: 'cover-4',
    concept: 'Cover 4',
    personnel: 'nickel',
    coachingPoint: 'Primary sub package. Safeties match verticals in quarters.',
    notes: 'Family Night staple. Two off-ball LBs.',
    vsPlaycall: 'Gun Doubles Right 62 Dagger',
    favorite: true,
  }),
  defPlay('gb-d-nick-c6', 'Nickel Quarter-Quarter-Half', 'Nickel Cover 6', {
    frontId: 'nickel',
    coverageId: 'cover-6',
    concept: 'Cover 6',
    personnel: 'nickel',
    coachingPoint: 'Change-up when trips forces a half to the 3-receiver side.',
    vsPlaycall: 'Gun Trips Right 62 Four-Verticals',
  }),
  defPlay('gb-d-mug', 'Mug Front', 'Nickel A-Gap Mug', {
    frontId: 'nickel',
    pressureId: 'a-gap-mug',
    coverageId: 'cover-1',
    concept: 'A-Gap Mug',
    personnel: 'nickel',
    coachingPoint: 'Walk LBs to the LOS. Force a chip or leave a free runner.',
    notes: 'Mug from nickel personnel — all six LOS threaten.',
    vsPlaycall: 'Gun Doubles Right 62 Spacing',
    favorite: true,
  }),
  defPlay('gb-d-double-mug', 'Double Mug', 'Nickel Double Mug', {
    frontId: 'nickel',
    pressureId: 'double-mug',
    coverageId: 'cover-0',
    concept: 'Double Mug',
    personnel: 'nickel',
    coachingPoint: 'Both A-gaps walked. Zero behind it on conversion downs.',
    vsPlaycall: 'Gun Doubles Right 62 Mesh',
  }),
  defPlay('gb-d-penny', 'Penny Safety Blitz', 'Nickel Cover 4 Safety Blitz', {
    frontId: 'nickel',
    coverageId: 'cover-4',
    pressureId: 'safety-blitz',
    concept: '3-Safety Penny',
    personnel: 'nickel',
    coachingPoint: 'Three-safety look: one can blitz, cover, or fit run without tipping.',
    notes: 'Teaching label for Gannon penny / three-safety rotations.',
    vsPlaycall: 'Gun Doubles Right 62 Drive',
    favorite: true,
  }),
  defPlay('gb-d-creeper', 'Creeper Quarters', '3-4 Cover 4 Creeper', {
    frontId: '3-4',
    coverageId: 'cover-4',
    pressureId: 'creeper',
    concept: 'Creeper',
    coachingPoint: 'Delayed LB creep after showing drop. Front four still primary.',
    vsPlaycall: 'Ace Twins Right Fake Wide Zone Boot',
  }),
  defPlay('gb-d-cheetah', 'Cheetah Stun', 'Nickel Cover 4 Stun', {
    frontId: 'nickel',
    coverageId: 'cover-4',
    pressureId: 'stlunt',
    concept: 'Cheetah',
    personnel: 'nickel',
    coachingPoint: 'Edge kicks inside / stun. Third-down pass-rush package.',
    notes: 'Cheetah-style teaching name — edge into interior from three-point.',
    vsPlaycall: 'Gun Trips Right 62 Stick',
    favorite: true,
  }),
  defPlay('gb-d-c3-buzz', 'Cover 3 Buzz', 'Nickel Cover 3 Buzz', {
    frontId: 'nickel',
    coverageId: 'cover-3-buzz',
    concept: 'Cover 3 Buzz',
    personnel: 'nickel',
    coachingPoint: 'Show two-high, rotate post-snap. Spot-drop change-up.',
    vsPlaycall: 'Gun Doubles Right 62 Smash',
  }),
  defPlay('gb-d-robber', 'Cover 1 Robber', 'Nickel Cover 1 Robber', {
    frontId: 'nickel',
    coverageId: 'cover-1-robber',
    concept: 'Cover 1 Robber',
    personnel: 'nickel',
    coachingPoint: 'Man-free with robber in the dig window. Early-down man look.',
    vsPlaycall: 'Gun Doubles Right 62 Dagger',
  }),
  defPlay('gb-d-fire', 'Fire Zone', 'Nickel Cover 3 Fire Zone', {
    frontId: 'nickel',
    coverageId: 'cover-3',
    pressureId: 'fire-zone',
    concept: 'Fire Zone',
    personnel: 'nickel',
    coachingPoint: 'Five-man fire with three deep. Use when they idle protection.',
    vsPlaycall: 'Gun Doubles Right 62 Slant-Flat',
  }),
  defPlay('gb-d-dime-zero', 'Dime Zero', 'Dime Cover 0', {
    frontId: 'dime',
    coverageId: 'cover-0',
    pressureId: 'zero',
    concept: 'Cover 0',
    personnel: 'dime',
    coachingPoint: 'All-out man. Rare — save for obvious throw.',
    vsPlaycall: 'Shotgun Empty Right 62 Mesh',
  }),
];

export const PACKERS_D_IDS = PACKERS_DEFENSE_PLAYS.map((p) => p.id);

/** Week 5 script vs Bears — defensive install for Sunday. */
export const BEARS_WEEK5_D_IDS = [
  'gb-d-nick-c4',
  'gb-d-34-c4',
  'gb-d-mug',
  'gb-d-penny',
  'gb-d-cheetah',
  'gb-d-c3-buzz',
  'gb-d-robber',
  'gb-d-fire',
];

export function packersDefenseCollections(bookId: string, now: string): Collection[] {
  return [
    {
      id: 'col-packers-d',
      bookId,
      name: 'Packers D',
      color: '#203731',
      playIds: [...PACKERS_D_IDS],
      isActive: false,
      description:
        'Gannon 2026 — 3-4 / nickel quarters. Training reconstruction from public film.',
      createdAt: now,
    },
    {
      id: 'col-bears-w5-d',
      bookId,
      name: 'Bears Week 5 D',
      color: '#0b4d2e',
      playIds: [...BEARS_WEEK5_D_IDS],
      isActive: false,
      description: 'Sunday defensive script vs Ben Johnson under-center / boot attack.',
      targetDate: '2026-10-11',
      createdAt: now,
    },
  ];
}
