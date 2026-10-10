import type { Player, PlayScene, PositionId, ColorKey, SlotId } from '@/src/core/schema';
import { colorKeyForPosition } from '@/src/core/schema';
import { FIELD } from '@/src/core/field';

const s = FIELD.olSplit;

export interface PersonnelPackage {
  id: string;
  /** Two-digit code: RBs then TEs, e.g. "21", "11", "12" */
  code: string;
  name: string;
  aliases: string[];
  backs: number;
  tightEnds: number;
  /** Derived: 5 - backs - tightEnds */
  receivers: number;
  description: string;
}

/**
 * Standard NFL/college personnel groupings.
 * Code = (# RBs including FB)(# TEs); WRs fill out the 5 skill spots.
 */
export const PERSONNEL: PersonnelPackage[] = [
  {
    id: '21',
    code: '21',
    name: '21 Personnel',
    aliases: ['21', 'two-back', 'pro'],
    backs: 2,
    tightEnds: 1,
    receivers: 2,
    description: '2 backs, 1 TE, 2 WRs — classic I / Ace base',
  },
  {
    id: '11',
    code: '11',
    name: '11 Personnel',
    aliases: ['11', 'nickel personnel', '11 personnel'],
    backs: 1,
    tightEnds: 1,
    receivers: 3,
    description: '1 back, 1 TE, 3 WRs — shotgun spread staple',
  },
  {
    id: '12',
    code: '12',
    name: '12 Personnel',
    aliases: ['12', '12 personnel', 'ace'],
    backs: 1,
    tightEnds: 2,
    receivers: 2,
    description: '1 back, 2 TEs, 2 WRs',
  },
  {
    id: '10',
    code: '10',
    name: '10 Personnel',
    aliases: ['10', '10 personnel', 'empty te'],
    backs: 1,
    tightEnds: 0,
    receivers: 4,
    description: '1 back, 0 TE, 4 WRs',
  },
  {
    id: '22',
    code: '22',
    name: '22 Personnel',
    aliases: ['22', '22 personnel', 'jumbo'],
    backs: 2,
    tightEnds: 2,
    receivers: 1,
    description: '2 backs, 2 TEs, 1 WR — heavy / jumbo',
  },
  {
    id: '13',
    code: '13',
    name: '13 Personnel',
    aliases: ['13', '13 personnel'],
    backs: 1,
    tightEnds: 3,
    receivers: 1,
    description: '1 back, 3 TEs, 1 WR',
  },
  {
    id: '20',
    code: '20',
    name: '20 Personnel',
    aliases: ['20', '20 personnel'],
    backs: 2,
    tightEnds: 0,
    receivers: 3,
    description: '2 backs, 0 TE, 3 WRs',
  },
  {
    id: '00',
    code: '00',
    name: '00 Personnel',
    aliases: ['00', 'empty', 'empty personnel'],
    backs: 0,
    tightEnds: 0,
    receivers: 5,
    description: '0 backs, 0 TE, 5 WRs — empty',
  },
];

function chip(
  slot: string,
  x: number,
  y: number,
  position: PositionId,
  label: string,
  colorKey?: ColorKey,
): Player {
  return {
    id: `off-${slot}`,
    slot: slot as SlotId,
    position,
    label,
    x,
    y,
    side: 'off',
    colorKey: colorKey ?? colorKeyForPosition(position),
  };
}

const OL: Player[] = [
  chip('lt', -s * 2, 0, 'LT', 'LT', 'ol'),
  chip('lg', -s, 0, 'LG', 'LG', 'ol'),
  chip('c', 0, 0, 'C', 'C', 'ol'),
  chip('rg', s, 0, 'RG', 'RG', 'ol'),
  chip('rt', s * 2, 0, 'RT', 'RT', 'ol'),
];

/**
 * Build a deterministic offensive scene for a personnel package.
 * Layout is strength-right; skill players are placed so counts are visually obvious.
 */
export function sceneForPersonnel(pkg: PersonnelPackage): PlayScene {
  const players: Player[] = [...OL, chip('qb', 0, pkg.backs === 0 ? -5 : -1.5, 'QB', 'QB', 'qb')];

  // --- Backs (RB / FB) ---
  if (pkg.backs === 1) {
    players.push(chip('rb', -2.5, -5, 'RB', 'RB', 'rb'));
  } else if (pkg.backs >= 2) {
    players.push(chip('fb', 0, -3.5, 'FB', 'FB', 'fb'));
    players.push(chip('rb', 0, -5.5, 'RB', 'RB', 'rb'));
  }

  // --- Tight ends (Y, then H/TE2, then TE3) ---
  const teSlots: { slot: string; x: number; y: number; label: string }[] = [
    { slot: 'y', x: s * 3.2, y: 0, label: 'TE' },
    { slot: 'te2', x: -s * 3.2, y: 0, label: 'TE' },
    { slot: 'te3', x: s * 4.4, y: -1, label: 'TE' },
  ];
  for (let i = 0; i < pkg.tightEnds; i++) {
    const t = teSlots[i];
    players.push(chip(t.slot, t.x, t.y, 'TE', t.label, 'te'));
  }

  // --- Wide receivers ---
  // Spread across the field so 2 vs 3 vs 4 vs 5 is obvious
  const wrLayouts: Record<number, { slot: string; x: number; y: number }[]> = {
    1: [{ slot: 'x', x: -22, y: 0 }],
    2: [
      { slot: 'x', x: -22, y: 0 },
      { slot: 'z', x: 22, y: -1 },
    ],
    3: [
      { slot: 'x', x: -22, y: 0 },
      { slot: 'h', x: 10, y: -1 },
      { slot: 'z', x: 22, y: -1 },
    ],
    4: [
      { slot: 'x', x: -22, y: 0 },
      { slot: 'h', x: -10, y: -1 },
      { slot: 'y', x: 10, y: -1 },
      { slot: 'z', x: 22, y: -1 },
    ],
    5: [
      { slot: 'x', x: -22, y: 0 },
      { slot: 'h', x: -12, y: -1 },
      { slot: 'slot', x: -4, y: -1 },
      { slot: 'y', x: 10, y: -1 },
      { slot: 'z', x: 22, y: -1 },
    ],
  };

  // When TEs already used 'y' slot for TE, avoid WR collision on that id
  const wrPlan = wrLayouts[pkg.receivers] ?? wrLayouts[2];
  wrPlan.forEach((w, idx) => {
    // If TE took the right wing and we also want a Z, keep Z wide
    let slot = w.slot;
    if (pkg.tightEnds > 0 && slot === 'y') {
      slot = `wr${idx}`;
    }
    // Avoid duplicate ids with TE slots
    if (players.some((p) => p.id === `off-${slot}`)) {
      slot = `wr${idx}`;
    }
    players.push(chip(slot, w.x, w.y, 'WR', 'WR', 'wr'));
  });

  players.sort((a, b) => a.id.localeCompare(b.id));

  return {
    title: '',
    players,
    arrows: [],
    zones: [],
    annotations: [],
    gapLabels: [],
  };
}

export function findPersonnel(token: string): PersonnelPackage | undefined {
  const t = token.toLowerCase().trim();
  return PERSONNEL.find(
    (p) =>
      p.id === t ||
      p.code === t ||
      p.name.toLowerCase() === t ||
      p.aliases.some((a) => a.toLowerCase() === t),
  );
}
