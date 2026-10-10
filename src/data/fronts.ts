import type { FrontDef } from '@/src/core/schema';
import { FIELD } from '@/src/core/field';

const s = FIELD.olSplit;

const secondary = {
  cbL: { x: -22, y: 1, position: 'CB' as const, label: 'CB', colorKey: 'def' as const },
  cbR: { x: 22, y: 1, position: 'CB' as const, label: 'CB', colorKey: 'def' as const },
  ss: { x: -8, y: 12, position: 'SS' as const, label: 'SS', colorKey: 'def' as const },
  fs: { x: 8, y: 14, position: 'FS' as const, label: 'FS', colorKey: 'def' as const },
};

export const FRONTS: FrontDef[] = [
  {
    id: '4-3',
    name: '4-3',
    aliases: ['43', 'four-three'],
    shift: 'even',
    slots: {
      deL: { x: -s * 3.2, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      dtL: { x: -s, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      dtR: { x: s, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      deR: { x: s * 3.2, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      sam: { x: s * 4, y: 4, position: 'SAM', label: 'LB', colorKey: 'def' },
      mike: { x: 0, y: 4.5, position: 'MIKE', label: 'LB', colorKey: 'def' },
      will: { x: -s * 3, y: 4, position: 'WILL', label: 'LB', colorKey: 'def' },
      ...secondary,
    },
  },
  {
    id: '4-3-over',
    name: '4-3 Over',
    aliases: ['43 over', 'over', 'four-three over'],
    shift: 'over',
    slots: {
      deL: { x: -s * 3.5, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      dtL: { x: -s * 0.4, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      dtR: { x: s * 1.6, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      deR: { x: s * 3.6, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      sam: { x: s * 4.2, y: 4, position: 'SAM', label: 'LB', colorKey: 'def' },
      mike: { x: s * 0.5, y: 4.5, position: 'MIKE', label: 'LB', colorKey: 'def' },
      will: { x: -s * 2.5, y: 4, position: 'WILL', label: 'LB', colorKey: 'def' },
      ...secondary,
    },
  },
  {
    id: '4-3-under',
    name: '4-3 Under',
    aliases: ['43 under', 'under', 'four-three under'],
    shift: 'under',
    slots: {
      deL: { x: -s * 3.6, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      dtL: { x: -s * 1.6, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      dtR: { x: s * 0.4, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      deR: { x: s * 3.5, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      sam: { x: s * 3.5, y: 4, position: 'SAM', label: 'LB', colorKey: 'def' },
      mike: { x: -s * 0.5, y: 4.5, position: 'MIKE', label: 'LB', colorKey: 'def' },
      will: { x: -s * 4, y: 4, position: 'WILL', label: 'LB', colorKey: 'def' },
      ...secondary,
    },
  },
  {
    id: '3-4',
    name: '3-4',
    aliases: ['34', 'three-four'],
    shift: 'even',
    slots: {
      deL: { x: -s * 2.5, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      nt: { x: 0, y: 0.8, position: 'NT', label: 'NT', colorKey: 'def' },
      deR: { x: s * 2.5, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      sam: { x: s * 4, y: 3.5, position: 'SAM', label: 'LB', colorKey: 'def' },
      mike: { x: s, y: 4.5, position: 'MIKE', label: 'LB', colorKey: 'def' },
      will: { x: -s, y: 4.5, position: 'WILL', label: 'LB', colorKey: 'def' },
      lb: { x: -s * 4, y: 3.5, position: 'LB', label: 'LB', colorKey: 'def' },
      ...secondary,
    },
  },
  {
    id: 'bear',
    name: 'Bear',
    aliases: ['46', 'bear front', '46 bear'],
    shift: 'bear',
    slots: {
      deL: { x: -s * 2.8, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      dtL: { x: -s * 0.8, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      nt: { x: s * 0.8, y: 0.8, position: 'NT', label: 'NT', colorKey: 'def' },
      deR: { x: s * 2.8, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      sam: { x: s * 4, y: 3.5, position: 'SAM', label: 'LB', colorKey: 'def' },
      mike: { x: 0, y: 4, position: 'MIKE', label: 'LB', colorKey: 'def' },
      will: { x: -s * 4, y: 3.5, position: 'WILL', label: 'LB', colorKey: 'def' },
      ...secondary,
    },
  },
  {
    id: 'nickel',
    name: 'Nickel',
    aliases: ['5db', 'nickel package'],
    shift: 'even',
    slots: {
      deL: { x: -s * 3.2, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      dtL: { x: -s, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      dtR: { x: s, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      deR: { x: s * 3.2, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      mike: { x: 0, y: 4.5, position: 'MIKE', label: 'LB', colorKey: 'def' },
      will: { x: -s * 3, y: 4, position: 'WILL', label: 'LB', colorKey: 'def' },
      nickel: { x: 10, y: 3, position: 'NICKEL', label: 'N', colorKey: 'def' },
      ...secondary,
      ss: { x: -6, y: 12, position: 'SS', label: 'SS', colorKey: 'def' },
      fs: { x: 6, y: 14, position: 'FS', label: 'FS', colorKey: 'def' },
    },
  },
  {
    id: 'dime',
    name: 'Dime',
    aliases: ['6db', 'dime package'],
    shift: 'even',
    description: 'Six DBs — extra speed for obvious passing downs.',
    slots: {
      deL: { x: -s * 3.2, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      dtL: { x: -s, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      dtR: { x: s, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      deR: { x: s * 3.2, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      mike: { x: 0, y: 4.5, position: 'MIKE', label: 'LB', colorKey: 'def' },
      nickel: { x: 10, y: 3, position: 'NICKEL', label: 'N', colorKey: 'def' },
      cbL: { x: -22, y: 1, position: 'CB', label: 'CB', colorKey: 'def' },
      cbR: { x: 22, y: 1, position: 'CB', label: 'CB', colorKey: 'def' },
      ss: { x: -8, y: 10, position: 'SS', label: 'SS', colorKey: 'def' },
      fs: { x: 8, y: 12, position: 'FS', label: 'FS', colorKey: 'def' },
      lb: { x: -10, y: 3, position: 'NICKEL', label: 'D', colorKey: 'def' },
    },
  },
  {
    id: 'tite',
    name: 'Tite',
    aliases: ['tite', 'tite front'],
    shift: 'even',
    description: 'Interior DL shade the guards — choke double teams and A/B gaps.',
    slots: {
      deL: { x: -s * 2.2, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      nt: { x: 0, y: 0.8, position: 'NT', label: 'NT', colorKey: 'def' },
      deR: { x: s * 2.2, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      sam: { x: s * 4, y: 3.5, position: 'SAM', label: 'LB', colorKey: 'def' },
      mike: { x: s, y: 4.5, position: 'MIKE', label: 'LB', colorKey: 'def' },
      will: { x: -s, y: 4.5, position: 'WILL', label: 'LB', colorKey: 'def' },
      lb: { x: -s * 4, y: 3.5, position: 'LB', label: 'LB', colorKey: 'def' },
      ...secondary,
    },
  },
  {
    id: 'stack-33',
    name: '3-3 Stack',
    aliases: ['3-3', '33 stack', 'stack'],
    shift: 'even',
    description: 'Three down linemen with LBs stacked behind — multiple blitz angles.',
    slots: {
      deL: { x: -s * 2.5, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      nt: { x: 0, y: 0.8, position: 'NT', label: 'NT', colorKey: 'def' },
      deR: { x: s * 2.5, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      sam: { x: s * 2.5, y: 4, position: 'SAM', label: 'LB', colorKey: 'def' },
      mike: { x: 0, y: 4.5, position: 'MIKE', label: 'LB', colorKey: 'def' },
      will: { x: -s * 2.5, y: 4, position: 'WILL', label: 'LB', colorKey: 'def' },
      ...secondary,
      ss: { x: -6, y: 10, position: 'SS', label: 'SS', colorKey: 'def' },
      fs: { x: 6, y: 12, position: 'FS', label: 'FS', colorKey: 'def' },
    },
  },
  {
    id: 'wide-9',
    name: 'Wide 9',
    aliases: ['wide 9', 'wide9'],
    shift: 'even',
    description: 'Ends aligned in 9 technique outside the TE — edge rush emphasis.',
    slots: {
      deL: { x: -s * 4.2, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      dtL: { x: -s, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      dtR: { x: s, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      deR: { x: s * 4.2, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      sam: { x: s * 3.2, y: 4, position: 'SAM', label: 'LB', colorKey: 'def' },
      mike: { x: 0, y: 4.5, position: 'MIKE', label: 'LB', colorKey: 'def' },
      will: { x: -s * 3.2, y: 4, position: 'WILL', label: 'LB', colorKey: 'def' },
      ...secondary,
    },
  },
  {
    id: 'nickel-over',
    name: 'Nickel Over',
    aliases: ['nickel over', 'over nickel'],
    shift: 'over',
    description: 'Nickel personnel with an over shift toward offensive strength.',
    slots: {
      deL: { x: -s * 3.5, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      dtL: { x: -s * 0.4, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      dtR: { x: s * 1.6, y: 0.8, position: 'DT', label: 'DT', colorKey: 'def' },
      deR: { x: s * 3.6, y: 0.8, position: 'DE', label: 'DE', colorKey: 'def' },
      mike: { x: s * 0.5, y: 4.5, position: 'MIKE', label: 'LB', colorKey: 'def' },
      will: { x: -s * 2.5, y: 4, position: 'WILL', label: 'LB', colorKey: 'def' },
      nickel: { x: 12, y: 3, position: 'NICKEL', label: 'N', colorKey: 'def' },
      ...secondary,
    },
  },
];

for (const f of FRONTS) {
  if (f.id === '4-3') f.description = 'Four down linemen, three linebackers — even alignment.';
  else if (f.id === '4-3-over') f.description = '4-3 shaded toward strength (over).';
  else if (f.id === '4-3-under') f.description = '4-3 shaded away from strength (under).';
  else if (f.id === '3-4') f.description = 'Three down linemen, four linebackers — odd front.';
  else if (f.id === 'bear') f.description = '46 / Bear — DL covers center and both guards.';
  else if (f.id === 'nickel') f.description = 'Five DBs — Will or Sam replaced by a nickel.';
}

export function findFront(token: string): FrontDef | undefined {
  const t = token.toLowerCase().trim();
  return FRONTS.find(
    (f) =>
      f.id === t ||
      f.name.toLowerCase() === t ||
      f.aliases.some((a) => a.toLowerCase() === t),
  );
}

export function matchFront(
  tokens: string[],
  start: number,
): { front: FrontDef; consumed: number } | undefined {
  const remaining = tokens.slice(start);
  for (let len = Math.min(3, remaining.length); len >= 1; len--) {
    const phrase = remaining.slice(0, len).join(' ');
    const front = findFront(phrase);
    if (front) return { front, consumed: len };
  }
  return undefined;
}
