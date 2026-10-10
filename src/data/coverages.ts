import type { CoverageDef, DefenderAssignment } from '@/src/core/schema';

const zone = (zoneId: string, label?: string): DefenderAssignment => ({
  kind: 'zone',
  zoneId,
  label: label ?? zoneId,
});

const man = (target: string, label?: string): DefenderAssignment => ({
  kind: 'man',
  target,
  label: label ?? `Man ${target.toUpperCase()}`,
});

export const COVERAGES: CoverageDef[] = [
  {
    id: 'cover-0',
    name: 'Cover 0',
    number: 0,
    aliases: ['0', 'cover 0', 'c0'],
    shell: 'man',
    zones: [],
    manAssignments: {
      cbL: 'x',
      cbR: 'z',
      ss: 'y',
      fs: 'h',
      mike: 'rb',
    },
    assignments: {
      cbL: man('x'),
      cbR: man('z'),
      ss: man('y'),
      fs: man('h'),
      mike: man('rb'),
      will: { kind: 'blitz', gap: 5, label: 'Blitz' },
      sam: { kind: 'blitz', gap: 6, label: 'Blitz' },
      deL: { kind: 'rush', gap: 7, label: 'Contain' },
      deR: { kind: 'rush', gap: 8, label: 'Contain' },
      dtL: { kind: 'rush', gap: 3, label: 'A Gap' },
      dtR: { kind: 'rush', gap: 4, label: 'A Gap' },
    },
    weakTo: [
      {
        conceptId: 'four-verticals',
        why: 'No deep help — vertical stretch beats man with no safety.',
      },
      {
        conceptId: 'mesh',
        why: 'Crossing routes create natural rubs against pure man.',
      },
      {
        conceptId: 'smash',
        why: 'Corner route wins quickly when nobody is sitting deep thirds.',
      },
    ],
  },
  {
    id: 'cover-1',
    name: 'Cover 1',
    number: 1,
    aliases: ['1', 'cover 1', 'c1', 'man free'],
    shell: 'man',
    zones: ['deep-third-middle'],
    manAssignments: {
      cbL: 'x',
      cbR: 'z',
      ss: 'y',
      will: 'h',
    },
    assignments: {
      cbL: man('x'),
      cbR: man('z'),
      ss: man('y'),
      will: man('h'),
      fs: zone('deep-third-middle', 'Robber / Deep'),
      mike: { kind: 'spy', target: 'rb', label: 'Spy RB' },
      deL: { kind: 'rush', gap: 7, label: 'Contain' },
      deR: { kind: 'rush', gap: 8, label: 'Contain' },
      dtL: { kind: 'rush', gap: 3, label: 'A Gap' },
      dtR: { kind: 'rush', gap: 4, label: 'A Gap' },
    },
    weakTo: [
      {
        conceptId: 'mesh',
        why: 'Crossing routes create natural picks under man coverage.',
      },
      {
        conceptId: 'smash',
        why: 'Corner route stretches the free safety away from the smash side.',
      },
      {
        conceptId: 'drive',
        why: 'Shallow cross + dig sits under the single-high and stresses man leverage.',
      },
    ],
  },
  {
    id: 'cover-2',
    name: 'Cover 2',
    number: 2,
    aliases: ['2', 'cover 2', 'c2'],
    shell: 'zone',
    zones: [
      'deep-half-left',
      'deep-half-right',
      'flat-left',
      'flat-right',
      'hook-middle',
    ],
    assignments: {
      ss: zone('deep-half-left', 'Deep ½'),
      fs: zone('deep-half-right', 'Deep ½'),
      cbL: zone('flat-left', 'Flat'),
      cbR: zone('flat-right', 'Flat'),
      mike: zone('hook-middle', 'Hook'),
      will: zone('hook-left', 'Hook'),
      sam: zone('hook-right', 'Hook'),
      deL: { kind: 'rush', gap: 7, label: 'Contain' },
      deR: { kind: 'rush', gap: 8, label: 'Contain' },
      dtL: { kind: 'rush', gap: 3, label: 'A Gap' },
      dtR: { kind: 'rush', gap: 4, label: 'A Gap' },
    },
    weakTo: [
      {
        conceptId: 'smash',
        why: 'Corner / hitch high-low attacks the Cover 2 corner / safety soft spot.',
      },
      {
        conceptId: 'four-verticals',
        why: 'Four verticals stretch two deep safeties beyond capacity.',
      },
      {
        conceptId: 'spacing',
        why: 'Horizontal spacing floods the intermediate holes under two-deep.',
      },
    ],
  },
  {
    id: 'cover-3',
    name: 'Cover 3',
    number: 3,
    aliases: ['3', 'cover 3', 'c3'],
    shell: 'zone',
    zones: [
      'deep-third-left',
      'deep-third-middle',
      'deep-third-right',
      'flat-left',
      'flat-right',
      'hook-left',
      'hook-right',
    ],
    assignments: {
      cbL: zone('deep-third-left', 'Deep ⅓'),
      fs: zone('deep-third-middle', 'Deep ⅓'),
      cbR: zone('deep-third-right', 'Deep ⅓'),
      will: zone('flat-left', 'Flat'),
      sam: zone('flat-right', 'Flat'),
      mike: zone('hook-middle', 'Hook'),
      ss: zone('hook-right', 'Hook'),
      deL: { kind: 'rush', gap: 7, label: 'Contain' },
      deR: { kind: 'rush', gap: 8, label: 'Contain' },
      dtL: { kind: 'rush', gap: 3, label: 'A Gap' },
      dtR: { kind: 'rush', gap: 4, label: 'A Gap' },
    },
    weakTo: [
      {
        conceptId: 'four-verticals',
        why: 'Four verticals put four receivers on three deep defenders.',
      },
      {
        conceptId: 'smash',
        why: 'Corner route attacks the deep third while hitch occupies the flat.',
      },
      {
        conceptId: 'mesh',
        why: 'Shallow crossers sit under the deep thirds and rub man-match rules.',
      },
      {
        conceptId: 'spacing',
        why: 'Spacing floods the hook / flat windows under three-deep.',
      },
    ],
  },
  {
    id: 'cover-4',
    name: 'Cover 4',
    number: 4,
    aliases: ['4', 'cover 4', 'c4', 'quarters'],
    shell: 'zone',
    zones: [
      'deep-quarter-ll',
      'deep-quarter-lr',
      'deep-quarter-rl',
      'deep-quarter-rr',
      'hook-left',
      'hook-right',
    ],
    assignments: {
      cbL: zone('deep-quarter-ll', '¼'),
      ss: zone('deep-quarter-lr', '¼'),
      fs: zone('deep-quarter-rl', '¼'),
      cbR: zone('deep-quarter-rr', '¼'),
      will: zone('hook-left', 'Hook'),
      sam: zone('hook-right', 'Hook'),
      mike: zone('hook-middle', 'Hook'),
      deL: { kind: 'rush', gap: 7, label: 'Contain' },
      deR: { kind: 'rush', gap: 8, label: 'Contain' },
      dtL: { kind: 'rush', gap: 3, label: 'A Gap' },
      dtR: { kind: 'rush', gap: 4, label: 'A Gap' },
    },
    weakTo: [
      {
        conceptId: 'mesh',
        why: 'Shallow crossers sit under quarters and stress the hook defenders.',
      },
      {
        conceptId: 'spacing',
        why: 'Horizontal spacing floods the intermediate zones under quarters.',
      },
      {
        conceptId: 'drive',
        why: 'Drive dig settles in the intermediate hole before quarters can squeeze.',
      },
    ],
  },
  {
    id: 'tampa-2',
    name: 'Tampa 2',
    number: 2,
    aliases: ['tampa 2', 'tampa2', 't2'],
    shell: 'zone',
    zones: [
      'deep-half-left',
      'deep-half-right',
      'deep-third-middle',
      'flat-left',
      'flat-right',
      'curl-left',
      'curl-right',
    ],
    assignments: {
      ss: zone('deep-half-left', 'Deep ½'),
      fs: zone('deep-half-right', 'Deep ½'),
      mike: zone('deep-third-middle', 'Pipe'),
      cbL: zone('flat-left', 'Flat'),
      cbR: zone('flat-right', 'Flat'),
      will: zone('curl-left', 'Curl'),
      sam: zone('curl-right', 'Curl'),
      deL: { kind: 'rush', gap: 7, label: 'Contain' },
      deR: { kind: 'rush', gap: 8, label: 'Contain' },
      dtL: { kind: 'rush', gap: 3, label: 'A Gap' },
      dtR: { kind: 'rush', gap: 4, label: 'A Gap' },
    },
    weakTo: [
      {
        conceptId: 'boot',
        why: 'Boot stretches the pipe Mike and floods the vacated flat.',
      },
      {
        conceptId: 'smash',
        why: 'Corner route attacks the deep half / flat soft spot.',
      },
      {
        conceptId: 'dagger',
        why: 'Seam / dig holds the pipe and attacks the vacated intermediate.',
      },
    ],
  },
  {
    id: 'cover-6',
    name: 'Cover 6',
    number: 6,
    aliases: ['6', 'cover 6', 'c6', 'quarter quarter half', 'qqh'],
    shell: 'zone',
    zones: [
      'deep-quarter-ll',
      'deep-quarter-lr',
      'deep-half-right',
      'flat-left',
      'flat-right',
      'hook-left',
      'hook-right',
    ],
    assignments: {
      cbL: zone('deep-quarter-ll', '¼'),
      ss: zone('deep-quarter-lr', '¼'),
      fs: zone('deep-half-right', 'Deep ½'),
      cbR: zone('flat-right', 'Flat'),
      will: zone('hook-left', 'Hook'),
      mike: zone('hook-middle', 'Hook'),
      sam: zone('flat-left', 'Flat'),
      deL: { kind: 'rush', gap: 7, label: 'Contain' },
      deR: { kind: 'rush', gap: 8, label: 'Contain' },
      dtL: { kind: 'rush', gap: 3, label: 'A Gap' },
      dtR: { kind: 'rush', gap: 4, label: 'A Gap' },
    },
    weakTo: [
      {
        conceptId: 'smash',
        why: 'Smash to the Cover 2 side attacks the half / flat soft spot.',
      },
      {
        conceptId: 'dagger',
        why: 'Dig / seam stresses the quarters side under Cover 6.',
      },
      {
        conceptId: 'four-verticals',
        why: 'Four verticals stress the single-high half and the quarters side together.',
      },
    ],
  },
  {
    id: 'cover-2-man',
    name: '2-Man',
    number: 2,
    aliases: ['2 man', 'cover 2 man', 'man 2', 'two-man'],
    shell: 'man',
    zones: ['deep-half-left', 'deep-half-right'],
    manAssignments: {
      cbL: 'x',
      cbR: 'z',
      will: 'h',
      sam: 'y',
      mike: 'rb',
    },
    assignments: {
      cbL: { kind: 'press', target: 'x', label: 'Press X' },
      cbR: { kind: 'press', target: 'z', label: 'Press Z' },
      will: man('h'),
      sam: man('y'),
      mike: man('rb'),
      ss: zone('deep-half-left', 'Deep ½'),
      fs: zone('deep-half-right', 'Deep ½'),
      deL: { kind: 'rush', gap: 7, label: 'Contain' },
      deR: { kind: 'rush', gap: 8, label: 'Contain' },
      dtL: { kind: 'rush', gap: 3, label: 'A Gap' },
      dtR: { kind: 'rush', gap: 4, label: 'A Gap' },
    },
    weakTo: [
      {
        conceptId: 'mesh',
        why: 'Rub routes create collisions under man with two-deep help.',
      },
      {
        conceptId: 'drive',
        why: 'Drive dig sits under the two-deep and away from press corners.',
      },
      {
        conceptId: 'smash',
        why: 'Corner / hitch still stresses the flat when corners are locked in man.',
      },
    ],
  },
  {
    id: 'cover-1-robber',
    name: 'Cover 1 Robber',
    number: 1,
    aliases: ['cover 1 robber', 'robber', 'c1 robber'],
    shell: 'man',
    description: 'Man-free with a safety dropping into the intermediate hole as a robber.',
    presnapKeys: 'Single high safety; one safety walks down toward the hash.',
    rotation: 'Down safety robbers the dig / cross window post-snap.',
    zones: ['deep-third-middle', 'hook-middle'],
    manAssignments: {
      cbL: 'x',
      cbR: 'z',
      will: 'h',
      sam: 'y',
    },
    assignments: {
      cbL: man('x'),
      cbR: man('z'),
      will: man('h'),
      sam: man('y'),
      mike: man('rb'),
      ss: zone('hook-middle', 'Robber'),
      fs: zone('deep-third-middle', 'Deep'),
      deL: { kind: 'rush', gap: 7, label: 'Contain' },
      deR: { kind: 'rush', gap: 8, label: 'Contain' },
      dtL: { kind: 'rush', gap: 3, label: 'A Gap' },
      dtR: { kind: 'rush', gap: 4, label: 'A Gap' },
    },
    weakTo: [
      {
        conceptId: 'four-verticals',
        why: 'Four verticals stress the single-high when the robber leaves deep.',
      },
      {
        conceptId: 'smash',
        why: 'Corner route away from the robber wins the deep third.',
      },
    ],
  },
  {
    id: 'cover-3-sky',
    name: 'Cover 3 Sky',
    number: 3,
    aliases: ['cover 3 sky', 'c3 sky', 'sky'],
    shell: 'zone',
    description: 'Cover 3 with the safety rotating to the curl/flat (sky).',
    presnapKeys: 'Two-high look that rolls to three-deep; safety walks toward the flat.',
    rotation: 'Safety sky to the flat; corners and FS take deep thirds.',
    zones: [
      'deep-third-left',
      'deep-third-middle',
      'deep-third-right',
      'flat-left',
      'flat-right',
      'hook-left',
      'hook-right',
    ],
    assignments: {
      cbL: zone('deep-third-left', 'Deep ⅓'),
      fs: zone('deep-third-middle', 'Deep ⅓'),
      cbR: zone('deep-third-right', 'Deep ⅓'),
      ss: zone('flat-right', 'Sky'),
      will: zone('flat-left', 'Flat'),
      mike: zone('hook-middle', 'Hook'),
      sam: zone('hook-right', 'Hook'),
      deL: { kind: 'rush', gap: 7, label: 'Contain' },
      deR: { kind: 'rush', gap: 8, label: 'Contain' },
      dtL: { kind: 'rush', gap: 3, label: 'A Gap' },
      dtR: { kind: 'rush', gap: 4, label: 'A Gap' },
    },
    weakTo: [
      {
        conceptId: 'four-verticals',
        why: 'Four verticals put four on three deep defenders.',
      },
      {
        conceptId: 'flood',
        why: 'Flood puts three levels on the sky / flat defender.',
      },
    ],
  },
  {
    id: 'cover-3-buzz',
    name: 'Cover 3 Buzz',
    number: 3,
    aliases: ['cover 3 buzz', 'c3 buzz', 'buzz'],
    shell: 'zone',
    description: 'Cover 3 with a linebacker buzzing to the curl/flat.',
    presnapKeys: 'Often shows two-high; LB walks out to the flat post-snap.',
    rotation: 'Will or Sam buzzes the flat; FS and corners take deep thirds.',
    zones: [
      'deep-third-left',
      'deep-third-middle',
      'deep-third-right',
      'flat-left',
      'flat-right',
      'hook-middle',
    ],
    assignments: {
      cbL: zone('deep-third-left', 'Deep ⅓'),
      fs: zone('deep-third-middle', 'Deep ⅓'),
      cbR: zone('deep-third-right', 'Deep ⅓'),
      will: zone('flat-left', 'Buzz'),
      sam: zone('flat-right', 'Buzz'),
      mike: zone('hook-middle', 'Hook'),
      ss: zone('hook-right', 'Hook'),
      deL: { kind: 'rush', gap: 7, label: 'Contain' },
      deR: { kind: 'rush', gap: 8, label: 'Contain' },
      dtL: { kind: 'rush', gap: 3, label: 'A Gap' },
      dtR: { kind: 'rush', gap: 4, label: 'A Gap' },
    },
    weakTo: [
      {
        conceptId: 'smash',
        why: 'Corner attacks the deep third while hitch occupies the buzz defender.',
      },
      {
        conceptId: 'spacing',
        why: 'Spacing floods the intermediate windows under three-deep.',
      },
    ],
  },
  {
    id: 'palms',
    name: 'Palms',
    number: 7,
    aliases: ['palms', 'cover 7', 'cover 2 match'],
    shell: 'match',
    description: 'Match quarters / Cover 2 match — corners and safeties pattern-match.',
    presnapKeys: 'Two-high safeties; corners often off with outside leverage.',
    rotation: 'Match #2 vertical; corner takes #1 if #2 stays short.',
    zones: [
      'deep-quarter-ll',
      'deep-quarter-lr',
      'deep-quarter-rl',
      'deep-quarter-rr',
      'flat-left',
      'flat-right',
    ],
    assignments: {
      cbL: zone('deep-quarter-ll', 'Match #1'),
      ss: zone('deep-quarter-lr', 'Match #2'),
      fs: zone('deep-quarter-rl', 'Match #2'),
      cbR: zone('deep-quarter-rr', 'Match #1'),
      will: zone('flat-left', 'Flat'),
      sam: zone('flat-right', 'Flat'),
      mike: zone('hook-middle', 'Hook'),
      deL: { kind: 'rush', gap: 7, label: 'Contain' },
      deR: { kind: 'rush', gap: 8, label: 'Contain' },
      dtL: { kind: 'rush', gap: 3, label: 'A Gap' },
      dtR: { kind: 'rush', gap: 4, label: 'A Gap' },
    },
    weakTo: [
      {
        conceptId: 'mesh',
        why: 'Shallow crossers create conflict for match rules on #2.',
      },
      {
        conceptId: 'levels',
        why: 'Two digs at different depths stress the match intermediate.',
      },
    ],
  },
  {
    id: 'cover-9',
    name: 'Cover 9',
    number: 9,
    aliases: ['cover 9', 'c9', 'quarter quarter half'],
    shell: 'match',
    description: 'Quarters to one side, Cover 2 to the other — flexible match shell.',
    presnapKeys: 'Often mirrors Cover 6 alignment; strength dictates which side is quarters.',
    rotation: 'Quarters match to the trips / strength; half to the weak side.',
    zones: [
      'deep-quarter-ll',
      'deep-quarter-lr',
      'deep-half-right',
      'flat-left',
      'flat-right',
      'hook-left',
    ],
    assignments: {
      cbL: zone('deep-quarter-ll', '¼'),
      ss: zone('deep-quarter-lr', '¼'),
      fs: zone('deep-half-right', 'Deep ½'),
      cbR: zone('flat-right', 'Flat'),
      will: zone('hook-left', 'Hook'),
      mike: zone('hook-middle', 'Hook'),
      sam: zone('flat-left', 'Flat'),
      deL: { kind: 'rush', gap: 7, label: 'Contain' },
      deR: { kind: 'rush', gap: 8, label: 'Contain' },
      dtL: { kind: 'rush', gap: 3, label: 'A Gap' },
      dtR: { kind: 'rush', gap: 4, label: 'A Gap' },
    },
    weakTo: [
      {
        conceptId: 'smash',
        why: 'Smash to the Cover 2 side attacks the half / flat soft spot.',
      },
      {
        conceptId: 'dagger',
        why: 'Dig / seam stresses the quarters match side.',
      },
    ],
  },
];

for (const c of COVERAGES) {
  if (c.id === 'cover-0') {
    c.description = 'Pure man with no deep help — maximum pressure shell.';
    c.presnapKeys = 'No deep safety; corners often pressed.';
    c.rotation = 'Everyone locks man; no post-snap help.';
  } else if (c.id === 'cover-1') {
    c.description = 'Man coverage with a free safety in the middle of the field.';
    c.presnapKeys = 'Single high safety at 12–15 yards.';
    c.rotation = 'FS stays deep middle; everyone else locks man.';
  } else if (c.id === 'cover-2') {
    c.description = 'Two deep safeties, five underneath — Tampa-style base without the pipe.';
    c.presnapKeys = 'Two-high safeties split the hashes.';
    c.rotation = 'Safeties split deep halves; corners and LBs take the flats and hooks.';
  } else if (c.id === 'cover-3') {
    c.description = 'Three deep defenders, four underneath — classic zone shell.';
    c.presnapKeys = 'Often rolls from two-high; corners bail to deep thirds.';
    c.rotation = 'Corners and FS take deep thirds; LBs and SS fill underneath.';
  } else if (c.id === 'cover-4') {
    c.description = 'Quarters — four deep defenders each own a deep quarter.';
    c.presnapKeys = 'Two-high with corners off; even cushion across the board.';
    c.rotation = 'Each deep defender matches vertical stems in their quarter.';
  } else if (c.id === 'tampa-2') {
    c.description = 'Cover 2 with the Mike piping into the deep middle.';
    c.presnapKeys = 'Two-high look; Mike aligned deeper than usual.';
    c.rotation = 'Mike runs the pipe; safeties split deep halves.';
  } else if (c.id === 'cover-6') {
    c.description = 'Quarter-quarter-half — Cover 4 to one side, Cover 2 to the other.';
    c.presnapKeys = 'Asymmetric two-high; one safety deeper toward the half side.';
    c.rotation = 'Quarters to strength / trips; half to the weak side.';
  } else if (c.id === 'cover-2-man') {
    c.description = 'Man underneath with two deep safeties.';
    c.presnapKeys = 'Two-high; corners often pressed.';
    c.rotation = 'Safeties stay deep halves; everyone else locks man.';
  }
}

export function findCoverage(token: string): CoverageDef | undefined {
  const t = token.toLowerCase().trim();
  return COVERAGES.find(
    (c) =>
      c.id === t ||
      c.name.toLowerCase() === t ||
      c.aliases.some((a) => a.toLowerCase() === t),
  );
}

export function matchCoverage(
  tokens: string[],
  start: number,
): { coverage: CoverageDef; consumed: number } | undefined {
  const remaining = tokens.slice(start);
  for (let len = Math.min(3, remaining.length); len >= 1; len--) {
    const phrase = remaining.slice(0, len).join(' ');
    const coverage = findCoverage(phrase);
    if (coverage) return { coverage, consumed: len };
  }
  return undefined;
}
