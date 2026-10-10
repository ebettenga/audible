import type { PressureDef } from '@/src/core/schema';

const rush = (gap: number, label: string, dx = 0, dy = -2.5) => ({
  kind: 'rush' as const,
  gap,
  label,
  path: [
    { x: 0, y: 0 },
    { x: dx, y: dy },
  ],
});

const blitz = (gap: number, label: string, dx: number, dy = -3.5) => ({
  kind: 'blitz' as const,
  gap,
  label,
  path: [
    { x: 0, y: 0 },
    { x: dx * 0.4, y: -1 },
    { x: dx, y: dy },
  ],
});

const drop = (zoneId: string, label: string) => ({
  kind: 'zone' as const,
  zoneId,
  label,
});

export const PRESSURES: PressureDef[] = [
  {
    id: 'base',
    name: 'Base',
    aliases: ['base', 'no pressure'],
    description: 'Four-man rush, everyone else drops into coverage.',
    assignments: {
      deL: rush(7, 'Contain'),
      dtL: rush(3, 'A Gap'),
      dtR: rush(4, 'A Gap'),
      deR: rush(8, 'Contain'),
      nt: rush(0, '0 Tech'),
    },
  },
  {
    id: 'fire-zone',
    name: 'Fire Zone',
    aliases: ['fire zone', 'fire', 'fz'],
    description: 'Five-man pressure with three deep behind it.',
    assignments: {
      deL: rush(7, 'Contain'),
      dtL: rush(3, 'B Gap'),
      dtR: rush(4, 'A Gap'),
      deR: rush(8, 'Contain'),
      will: blitz(5, 'Fire', -1.5),
      mike: drop('hook-middle', 'Hook'),
      sam: drop('flat-right', 'Flat'),
      ss: drop('deep-third-left', 'Deep ⅓'),
      fs: drop('deep-third-middle', 'Deep ⅓'),
      cbL: drop('deep-third-left', 'Deep ⅓'),
      cbR: drop('deep-third-right', 'Deep ⅓'),
    },
  },
  {
    id: 'a-gap-mug',
    name: 'A-Gap Mug',
    aliases: ['a-gap mug', 'mug', 'a gap'],
    description: 'Mike walks up and shoots an A-gap.',
    assignments: {
      deL: rush(7, 'Contain'),
      dtL: rush(2, 'B Gap'),
      dtR: rush(6, 'B Gap'),
      deR: rush(8, 'Contain'),
      mike: blitz(4, 'Mug', 0, -3),
      will: drop('hook-left', 'Hook'),
      sam: drop('hook-right', 'Hook'),
    },
  },
  {
    id: 'cross-dog',
    name: 'Cross Dog',
    aliases: ['cross dog', 'dog', 'cross'],
    description: 'Will and Sam exchange gaps; DL twists inside.',
    assignments: {
      deL: rush(5, 'Twist In', 1.2, -2),
      dtL: rush(1, 'Twist Out', -1, -2),
      dtR: rush(4, 'A Gap'),
      deR: rush(8, 'Contain'),
      will: blitz(6, 'Cross', 2),
      sam: blitz(3, 'Cross', -2),
      mike: drop('hook-middle', 'Hook'),
    },
  },
  {
    id: 'zero',
    name: 'Zero',
    aliases: ['zero', 'all-out', 'cover 0 blitz'],
    description: 'All-out man pressure — every eligible defender attacks.',
    assignments: {
      deL: rush(7, 'Contain'),
      dtL: rush(3, 'A Gap'),
      dtR: rush(4, 'A Gap'),
      deR: rush(8, 'Contain'),
      will: blitz(5, 'Blitz', -1.5),
      mike: blitz(0, 'Blitz', 0, -3),
      sam: blitz(6, 'Blitz', 1.5),
      ss: blitz(8, 'Blitz', 2.5, -2),
      nickel: blitz(9, 'Blitz', 2, -2),
    },
  },
  {
    id: 'stlunt',
    name: 'Stun',
    aliases: ['stun', 'stunt', 'tex'],
    description: 'End and tackle exchange: end loops inside, tackle takes contain.',
    assignments: {
      deL: rush(3, 'Loop', 2, -2.5),
      dtL: rush(7, 'Contain', -0.5, -2),
      dtR: rush(4, 'A Gap'),
      deR: rush(8, 'Contain'),
    },
  },
  {
    id: 'corner-blitz',
    name: 'Corner Blitz',
    aliases: ['corner blitz', 'cb blitz'],
    description: 'Boundary corner shoots the edge while the safety rotates over.',
    assignments: {
      deL: rush(7, 'Contain'),
      dtL: rush(3, 'A Gap'),
      dtR: rush(4, 'A Gap'),
      deR: rush(5, 'Collapse', -1, -2),
      cbR: blitz(8, 'CB Blitz', 1.5, -2.5),
      fs: drop('deep-half-right', 'Replace'),
      ss: drop('deep-half-left', 'Deep ½'),
      will: drop('hook-left', 'Hook'),
      mike: drop('hook-middle', 'Hook'),
      sam: drop('flat-right', 'Flat'),
    },
  },
  {
    id: 'safety-blitz',
    name: 'Safety Blitz',
    aliases: ['safety blitz', 'ss blitz'],
    description: 'Strong safety attacks the edge or A-gap from depth.',
    assignments: {
      deL: rush(7, 'Contain'),
      dtL: rush(3, 'A Gap'),
      dtR: rush(4, 'A Gap'),
      deR: rush(8, 'Contain'),
      ss: blitz(6, 'SS Blitz', 2, -4),
      fs: drop('deep-third-middle', 'Centerfield'),
      will: drop('hook-left', 'Hook'),
      mike: drop('hook-middle', 'Hook'),
      sam: drop('flat-right', 'Flat'),
      cbL: drop('deep-third-left', 'Deep ⅓'),
      cbR: drop('deep-third-right', 'Deep ⅓'),
    },
  },
  {
    id: 'creeper',
    name: 'Creeper',
    aliases: ['creeper', 'sim', 'simulated pressure'],
    description: 'Simulated pressure — a late blitzer replaces a dropping lineman.',
    assignments: {
      deL: rush(7, 'Contain'),
      dtL: drop('hook-left', 'Drop'),
      dtR: rush(4, 'A Gap'),
      deR: rush(8, 'Contain'),
      will: blitz(3, 'Creep', -0.5, -3),
      mike: drop('hook-middle', 'Hook'),
      sam: drop('flat-right', 'Flat'),
      ss: drop('deep-half-left', 'Deep ½'),
      fs: drop('deep-half-right', 'Deep ½'),
    },
  },
  {
    id: 'tex',
    name: 'Tex',
    aliases: ['tex stunt', 'tackle-end'],
    description: 'Tackle-end stunt: tackle loops outside, end crashes inside.',
    assignments: {
      deL: rush(3, 'Crash', 1.5, -2),
      dtL: rush(7, 'Loop', -1.5, -2.5),
      dtR: rush(4, 'A Gap'),
      deR: rush(8, 'Contain'),
    },
  },
  {
    id: 'twin-twist',
    name: 'Twin Twist',
    aliases: ['twin twist', 'twist'],
    description: 'Both interior pairs twist — create free runners in the A gaps.',
    assignments: {
      deL: rush(5, 'Twist In', 1.5, -2),
      dtL: rush(7, 'Twist Out', -1, -2),
      dtR: rush(8, 'Twist Out', 1, -2),
      deR: rush(6, 'Twist In', -1.5, -2),
      will: drop('hook-left', 'Hook'),
      mike: drop('hook-middle', 'Hook'),
      sam: drop('hook-right', 'Hook'),
    },
  },
  {
    id: 'double-mug',
    name: 'Double Mug',
    aliases: ['double mug', 'double a'],
    description: 'Both interior LBs walk up into the A-gaps pre-snap.',
    assignments: {
      deL: rush(7, 'Contain'),
      dtL: rush(2, 'B Gap'),
      dtR: rush(6, 'B Gap'),
      deR: rush(8, 'Contain'),
      will: blitz(3, 'Mug', -0.5, -3),
      mike: blitz(4, 'Mug', 0.5, -3),
      sam: drop('flat-right', 'Flat'),
      ss: drop('deep-half-left', 'Deep ½'),
      fs: drop('deep-half-right', 'Deep ½'),
    },
  },
];

export function findPressure(token: string): PressureDef | undefined {
  const t = token.toLowerCase().trim();
  return PRESSURES.find(
    (p) =>
      p.id === t ||
      p.name.toLowerCase() === t ||
      p.aliases.some((a) => a.toLowerCase() === t),
  );
}

export function matchPressure(
  tokens: string[],
  start: number,
): { pressure: PressureDef; consumed: number } | undefined {
  const remaining = tokens.slice(start);
  for (let len = Math.min(3, remaining.length); len >= 1; len--) {
    const phrase = remaining.slice(0, len).join(' ');
    const pressure = findPressure(phrase);
    if (pressure) return { pressure, consumed: len };
  }
  return undefined;
}
