import type { RunPlayDef } from '@/src/core/schema';

/**
 * Run plays keyed by hole number (Air Coryell / many systems use even holes to the right).
 * Paths are relative to the player's start position.
 */
export const RUNS: RunPlayDef[] = [
  {
    id: '24-lead',
    name: '24 Lead',
    aliases: ['24 lead', 'fake 24 lead', '24'],
    hole: 4,
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 1.5, y: 2 },
      { x: 1.2, y: 5 },
    ],
    leadPath: [
      { x: 0, y: 0 },
      { x: 1, y: 3 },
      { x: 0.8, y: 4.5 },
    ],
    leadArrowhead: 'block',
  },
  {
    id: '26-lead',
    name: '26 Lead',
    aliases: ['26 lead', 'fake 26 lead', '26'],
    hole: 6,
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 2.5, y: 2 },
      { x: 2.2, y: 5 },
    ],
    leadPath: [
      { x: 0, y: 0 },
      { x: 2, y: 3 },
      { x: 2, y: 4.5 },
    ],
    leadArrowhead: 'block',
  },
  {
    id: '28-toss',
    name: '28 Toss',
    aliases: ['28 toss', '28'],
    hole: 8,
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 4, y: 1 },
      { x: 6, y: 3 },
    ],
    leadPath: [
      { x: 0, y: 0 },
      { x: 4, y: 2 },
      { x: 5, y: 3.5 },
    ],
    leadArrowhead: 'block',
  },
  {
    id: '22-dive',
    name: '22 Dive',
    aliases: ['22 dive', '22'],
    hole: 2,
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: -1, y: 4 },
    ],
    leadArrowhead: 'block',
  },
  {
    id: 'wide-zone',
    name: 'Wide Zone',
    aliases: ['wide zone', 'outside zone', 'oz'],
    hole: 8,
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 3, y: 1.5 },
      { x: 5, y: 4 },
      { x: 6, y: 6 },
    ],
    leadPath: [
      { x: 0, y: 0 },
      { x: 3, y: 2 },
      { x: 4, y: 4 },
    ],
    leadArrowhead: 'block',
  },
  {
    id: 'inside-zone',
    name: 'Inside Zone',
    aliases: ['inside zone', 'iz'],
    hole: 4,
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 0.5, y: 5 },
    ],
    leadPath: [
      { x: 0, y: 0 },
      { x: 1, y: 3 },
      { x: 0.5, y: 4.5 },
    ],
    leadArrowhead: 'block',
  },
  {
    id: 'split-zone',
    name: 'Split Zone',
    aliases: ['split zone'],
    hole: 6,
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      { x: 2.5, y: 5 },
    ],
    leadPath: [
      { x: 0, y: 0 },
      { x: -2, y: 2 },
      { x: -3, y: 3.5 },
    ],
    leadArrowhead: 'block',
  },
  {
    id: 'duo',
    name: 'Duo',
    aliases: ['duo'],
    hole: 4,
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 1.5, y: 2 },
      { x: 1, y: 5 },
    ],
    leadPath: [
      { x: 0, y: 0 },
      { x: 2, y: 2.5 },
      { x: 2, y: 4 },
    ],
    leadArrowhead: 'block',
  },
  {
    id: 'jet-sweep',
    name: 'Jet Sweep',
    aliases: ['jet sweep', 'jet'],
    hole: 8,
    description: 'Motion receiver takes the handoff on the perimeter.',
    bestVs: 'Overloaded box / soft edge',
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 6, y: 0.5 },
      { x: 10, y: 2 },
    ],
    leadArrowhead: 'none',
  },
  {
    id: 'counter',
    name: 'Counter',
    aliases: ['counter', 'gt counter'],
    hole: 6,
    description: 'Misdirection — back steps opposite, puller leads through the hole.',
    bestVs: 'Aggressive flow / overpursuit',
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: -1.5, y: 1 },
      { x: 2, y: 3 },
      { x: 2.5, y: 5.5 },
    ],
    leadPath: [
      { x: 0, y: 0 },
      { x: 3, y: 1 },
      { x: 2.5, y: 4 },
    ],
    leadArrowhead: 'block',
  },
  {
    id: 'trap',
    name: 'Trap',
    aliases: ['trap', 'trap run'],
    hole: 4,
    description: 'Invite the DT upfield, then trap block him from the backside.',
    bestVs: 'Penetrating defensive line',
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 0.5, y: 5 },
    ],
    leadPath: [
      { x: 0, y: 0 },
      { x: 2, y: 1.5 },
      { x: 1.5, y: 3 },
    ],
    leadArrowhead: 'block',
  },
  {
    id: 'iso',
    name: 'Iso',
    aliases: ['iso', 'isolation'],
    hole: 4,
    description: 'Fullback isolates the Mike; back reads the block and presses A/B.',
    bestVs: 'Light box / man fronts',
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 1.2, y: 5 },
    ],
    leadPath: [
      { x: 0, y: 0 },
      { x: 1, y: 3.5 },
    ],
    leadArrowhead: 'block',
  },
  {
    id: 'draw',
    name: 'Draw',
    aliases: ['draw', 'qb draw'],
    hole: 2,
    description: 'Sell pass protection, then hand off into a soft middle.',
    bestVs: 'Pass rush / soft middle',
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0.5, y: 4 },
      { x: 0, y: 6 },
    ],
    leadArrowhead: 'none',
  },
  {
    id: 'pin-pull',
    name: 'Pin and Pull',
    aliases: ['pin and pull', 'pin-pull', 'pin pull'],
    hole: 8,
    description: 'Down blocks pin the edge; pullers lead the back outside.',
    bestVs: 'Light edge / zone-heavy fronts',
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 3, y: 1 },
      { x: 5, y: 3 },
      { x: 7, y: 5 },
    ],
    leadPath: [
      { x: 0, y: 0 },
      { x: 4, y: 1.5 },
      { x: 6, y: 3.5 },
    ],
    leadArrowhead: 'block',
  },
  {
    id: 'speed-option',
    name: 'Speed Option',
    aliases: ['speed option', 'option'],
    hole: 8,
    description: 'QB attacks the edge and pitches off the unblocked defender.',
    bestVs: 'Unblocked edge / soft contain',
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 4, y: 1 },
      { x: 7, y: 3 },
    ],
    leadArrowhead: 'none',
  },
  {
    id: 'qb-power',
    name: 'QB Power',
    aliases: ['qb power', 'power read'],
    hole: 6,
    description: 'QB keeps on power gap scheme with a lead puller.',
    bestVs: 'Light box / aggressive DE',
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      { x: 2.5, y: 5 },
    ],
    leadPath: [
      { x: 0, y: 0 },
      { x: 2.5, y: 2 },
      { x: 2.5, y: 4 },
    ],
    leadArrowhead: 'block',
  },
  {
    id: 'stretch',
    name: 'Stretch',
    aliases: ['stretch', 'stretch zone'],
    hole: 8,
    description: 'Outside-zone track with a wider aiming point than wide zone.',
    bestVs: 'Slow-flow second level',
    ballCarrierPath: [
      { x: 0, y: 0 },
      { x: 4, y: 1 },
      { x: 7, y: 3 },
      { x: 9, y: 5 },
    ],
    leadPath: [
      { x: 0, y: 0 },
      { x: 4, y: 2 },
      { x: 5, y: 4 },
    ],
    leadArrowhead: 'block',
  },
];

export function findRun(token: string): RunPlayDef | undefined {
  const t = token.toLowerCase().trim();
  return RUNS.find(
    (r) =>
      r.id === t ||
      r.name.toLowerCase() === t ||
      r.aliases.some((a) => a.toLowerCase() === t),
  );
}

/** Match multi-word run phrases like "Fake 24 Lead". */
export function matchRun(
  tokens: string[],
  start: number,
): { run: RunPlayDef; consumed: number; isFake: boolean } | undefined {
  const remaining = tokens.slice(start);
  let isFake = false;
  let offset = 0;
  if (remaining[0]?.toLowerCase() === 'fake') {
    isFake = true;
    offset = 1;
  }
  for (let len = Math.min(3, remaining.length - offset); len >= 1; len--) {
    const phrase = remaining.slice(offset, offset + len).join(' ');
    const run = findRun(phrase);
    if (run) return { run, consumed: offset + len, isFake };
    // Also try with "fake " prefix in aliases
    const withFake = findRun(`fake ${phrase}`);
    if (withFake) return { run: withFake, consumed: offset + len, isFake: true };
  }
  return undefined;
}
