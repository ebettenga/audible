/**
 * Call-system lexicon: labels/aliases map onto canonical geometry ids.
 * Geometry lives in formations/runs/routes/concepts; systems are language packs.
 */

export type LexiconKind = 'formation' | 'run' | 'concept' | 'route' | 'protection';

export interface LexiconEntry {
  kind: LexiconKind;
  /** Geometry id, e.g. 'mesh' | 'wide-zone' | 'gun-doubles' */
  canonicalId: string;
  /** Primary label used when composing a call in this system */
  label: string;
  aliases?: string[];
  systemId: string;
}

export interface CallSystem {
  id: string;
  name: string;
  entries: LexiconEntry[];
}

function entry(
  systemId: string,
  kind: LexiconKind,
  canonicalId: string,
  label: string,
  aliases: string[] = [],
): LexiconEntry {
  return { kind, canonicalId, label, aliases, systemId };
}

/** West Coast / Shanahan–LaFleur labels. */
export const WEST_COAST: CallSystem = {
  id: 'west-coast',
  name: 'West Coast',
  entries: [
    entry('west-coast', 'formation', 'gun-doubles', 'Gun Doubles', ['gun doubles', 'doubles']),
    entry('west-coast', 'formation', 'gun-bunch', 'Gun Bunch', ['gun bunch', 'bunch']),
    entry('west-coast', 'formation', 'gun-nub', 'Gun Nub', ['gun nub', 'nub']),
    entry('west-coast', 'formation', 'gun-trips', 'Gun Trips', ['gun trips']),
    entry('west-coast', 'formation', 'shotgun', 'Shotgun', ['gun', 'sg']),
    entry('west-coast', 'formation', 'ace-twins', 'Ace Twins', ['ace twins', 'ace', 'twins']),
    entry('west-coast', 'formation', 'ace-balanced', 'Ace Balanced', ['ace balanced', 'balanced']),
    entry('west-coast', 'formation', 'trips', 'Trips', ['3x1']),
    entry('west-coast', 'formation', 'i', 'I', ['i formation', 'i-form']),
    entry('west-coast', 'formation', 'i-slot', 'I Slot', ['i slot']),
    entry('west-coast', 'formation', 'pistol', 'Pistol', ['pistol']),
    entry('west-coast', 'formation', 'gun-empty', 'Shotgun Empty', ['empty', 'gun empty']),

    entry('west-coast', 'run', 'wide-zone', 'Wide Zone', ['wide zone', 'outside zone', 'oz']),
    entry('west-coast', 'run', 'inside-zone', 'Inside Zone', ['inside zone', 'iz']),
    entry('west-coast', 'run', 'split-zone', 'Split Zone', ['split zone']),
    entry('west-coast', 'run', 'duo', 'Duo', ['duo']),
    entry('west-coast', 'run', 'jet-sweep', 'Jet Sweep', ['jet sweep', 'jet']),
    entry('west-coast', 'run', 'counter', 'Counter', ['counter', 'gt counter', 'counter strong']),
    entry('west-coast', 'run', '28-toss', '28 Toss', ['28 toss', 'toss']),

    entry('west-coast', 'concept', 'slant-flat', 'Slant-Flat', ['slant flat', 'slant / flat']),
    entry('west-coast', 'concept', 'four-verticals', 'Four Verticals', ['4 verts', 'verts']),
    entry('west-coast', 'concept', 'mesh', 'Mesh', ['mesh']),
    entry('west-coast', 'concept', 'boot', 'Boot', ['boot', 'pa boot', 'sail']),
    entry('west-coast', 'concept', 'dagger', 'Dagger', ['dagger', 'outside dig', 'pa dagger']),
    entry('west-coast', 'concept', 'smash', 'Smash', ['smash', 'china']),
    entry('west-coast', 'concept', 'high-cross', 'High-Cross', [
      'high cross',
      'high-cross',
      'cross',
      'latch',
    ]),
    entry('west-coast', 'concept', 'y-cross', 'Y-Cross', ['y cross', 'y-cross']),
    entry('west-coast', 'concept', 'spacing', 'Spacing', ['spacing']),
    entry('west-coast', 'concept', 'stick', 'Stick', ['stick']),
    entry('west-coast', 'concept', 'drive', 'Drive', ['drive', 'branch', 'branch-drive', 'branch drive']),
    entry('west-coast', 'concept', 'snag', 'Snag', ['snag']),
    entry('west-coast', 'concept', 'arches', 'Arches', ['arches']),

    entry('west-coast', 'protection', '62', '62', ['62']),
    entry('west-coast', 'protection', '68', '68', ['68']),
    entry('west-coast', 'protection', '60', '60', ['60']),
    entry('west-coast', 'protection', '50', '50', ['50']),
    entry('west-coast', 'protection', '70', '70', ['70']),
  ],
};

/** Air Coryell numbered-tree labels (existing goldens). */
export const AIR_CORYELL: CallSystem = {
  id: 'air-coryell',
  name: 'Air Coryell',
  entries: [
    entry('air-coryell', 'formation', 'ace-twins', 'Ace Twins', ['ace twins', 'ace', 'twins']),
    entry('air-coryell', 'formation', 'gun-trips', 'Gun Trips', ['gun trips']),
    entry('air-coryell', 'formation', 'i', 'I', ['i formation', 'i-form']),
    entry('air-coryell', 'formation', 'i-slot', 'I Slot', ['i slot']),
    entry('air-coryell', 'formation', 'shotgun', 'Shotgun', ['gun', 'sg']),
    entry('air-coryell', 'formation', 'trips', 'Trips', ['3x1']),
    entry('air-coryell', 'formation', 'gun-doubles', 'Gun Doubles', ['gun doubles', 'doubles']),
    entry('air-coryell', 'formation', 'gun-bunch', 'Gun Bunch', ['gun bunch']),
    entry('air-coryell', 'formation', 'gun-nub', 'Gun Nub', ['gun nub']),
    entry('air-coryell', 'formation', 'ace-balanced', 'Ace Balanced', ['ace balanced']),

    entry('air-coryell', 'run', '24-lead', '24 Lead', ['24 lead', 'fake 24 lead', '24']),
    entry('air-coryell', 'run', '26-lead', '26 Lead', ['26 lead', 'fake 26 lead', '26']),
    entry('air-coryell', 'run', '28-toss', '28 Toss', ['28 toss', '28']),
    entry('air-coryell', 'run', '22-dive', '22 Dive', ['22 dive', '22']),
    entry('air-coryell', 'run', 'wide-zone', 'Wide Zone', ['wide zone']),
    entry('air-coryell', 'run', 'inside-zone', 'Inside Zone', ['inside zone']),
    entry('air-coryell', 'run', 'split-zone', 'Split Zone', ['split zone']),
    entry('air-coryell', 'run', 'duo', 'Duo', ['duo']),
    entry('air-coryell', 'run', 'jet-sweep', 'Jet Sweep', ['jet sweep', 'jet']),

    entry('air-coryell', 'concept', 'slant-flat', 'Slant-Flat', ['slant-flat', 'slant / flat', 'slant flat']),
    entry('air-coryell', 'concept', 'four-verticals', 'Four Verticals', ['four verticals', '4 verts', 'verts']),
    entry('air-coryell', 'concept', 'mesh', 'Mesh', ['mesh']),
    entry('air-coryell', 'concept', 'boot', 'Boot', ['boot']),
    entry('air-coryell', 'concept', 'dagger', 'Dagger', ['dagger']),
    entry('air-coryell', 'concept', 'smash', 'Smash', ['smash']),
    entry('air-coryell', 'concept', 'high-cross', 'High-Cross', ['high cross']),
    entry('air-coryell', 'concept', 'spacing', 'Spacing', ['spacing']),
    entry('air-coryell', 'concept', 'stick', 'Stick', ['stick']),
    entry('air-coryell', 'concept', 'drive', 'Drive', ['drive']),
    entry('air-coryell', 'concept', 'snag', 'Snag', ['snag']),
    entry('air-coryell', 'concept', 'arches', 'Arches', ['arches']),

    entry('air-coryell', 'protection', '62', '62', ['62']),
    entry('air-coryell', 'protection', '68', '68', ['68']),
    entry('air-coryell', 'protection', '60', '60', ['60']),
    entry('air-coryell', 'protection', '50', '50', ['50']),
    entry('air-coryell', 'protection', '70', '70', ['70']),
  ],
};

/** Air Raid concept-forward labels. */
export const AIR_RAID: CallSystem = {
  id: 'air-raid',
  name: 'Air Raid',
  entries: [
    entry('air-raid', 'formation', 'gun-doubles', 'Gun Doubles', ['gun doubles', 'doubles']),
    entry('air-raid', 'formation', 'gun-bunch', 'Gun Bunch', ['gun bunch', 'bunch']),
    entry('air-raid', 'formation', 'gun-trips', 'Gun Trips', ['gun trips', 'trips']),
    entry('air-raid', 'formation', 'shotgun', 'Shotgun', ['gun', 'empty']),
    entry('air-raid', 'formation', 'trips', 'Trips', ['3x1']),
    entry('air-raid', 'formation', 'gun-nub', 'Gun Nub', ['nub']),
    entry('air-raid', 'formation', 'ace-twins', 'Ace Twins', ['ace']),
    entry('air-raid', 'formation', 'ace-balanced', 'Ace Balanced', ['balanced']),

    entry('air-raid', 'run', 'inside-zone', 'Inside Zone', ['inside zone', 'iz']),
    entry('air-raid', 'run', 'wide-zone', 'Wide Zone', ['wide zone']),
    entry('air-raid', 'run', 'duo', 'Duo', ['duo']),
    entry('air-raid', 'run', 'jet-sweep', 'Jet Sweep', ['jet']),

    entry('air-raid', 'concept', 'mesh', 'Mesh', ['mesh', 'shallow cross']),
    entry('air-raid', 'concept', 'four-verticals', 'Four Verticals', ['4 verts', 'y-cross', 'y cross']),
    entry('air-raid', 'concept', 'stick', 'Stick', ['stick']),
    entry('air-raid', 'concept', 'spacing', 'Spacing', ['spacing']),
    entry('air-raid', 'concept', 'slant-flat', 'Slant-Flat', ['slant flat']),
    entry('air-raid', 'concept', 'smash', 'Smash', ['smash']),
    entry('air-raid', 'concept', 'dagger', 'Dagger', ['dagger']),
    entry('air-raid', 'concept', 'boot', 'Boot', ['boot']),
    entry('air-raid', 'concept', 'high-cross', 'High-Cross', ['high cross']),
    entry('air-raid', 'concept', 'drive', 'Drive', ['drive']),
    entry('air-raid', 'concept', 'snag', 'Snag', ['snag']),
    entry('air-raid', 'concept', 'arches', 'Arches', ['arches']),

    entry('air-raid', 'protection', '62', '62', ['62']),
    entry('air-raid', 'protection', '68', '68', ['68']),
  ],
};

export const BUILTIN_SYSTEMS: CallSystem[] = [WEST_COAST, AIR_CORYELL, AIR_RAID];

export const DEFAULT_SYSTEM_IDS = ['west-coast'] as const;

export type MergedLexicon = {
  formations: Map<string, string>; // normalized label/alias → canonicalId
  runs: Map<string, string>;
  concepts: Map<string, string>;
  routes: Map<string, string>;
  protections: Map<string, string>;
  /** Prefer labels from the first enabled system for compose */
  preferredLabel: (kind: LexiconKind, canonicalId: string) => string;
  entries: LexiconEntry[];
};

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

function addToMap(map: Map<string, string>, label: string, canonicalId: string) {
  const key = norm(label);
  if (!map.has(key)) map.set(key, canonicalId);
}

/**
 * Merge enabled system packs + optional custom lexicon.
 * First system wins for preferred compose labels; all aliases are searchable.
 */
export function mergeLexicon(
  systemIds: string[] = [...DEFAULT_SYSTEM_IDS],
  custom: LexiconEntry[] = [],
): MergedLexicon {
  const systems = systemIds
    .map((id) => BUILTIN_SYSTEMS.find((s) => s.id === id))
    .filter((s): s is CallSystem => !!s);

  // Always include air-coryell as fallback so existing goldens keep parsing
  // unless the caller already enabled it.
  if (!systemIds.includes('air-coryell')) {
    systems.push(AIR_CORYELL);
  }
  // Also pull west-coast geometry labels when only coryell is on
  if (!systemIds.includes('west-coast') && systemIds.includes('air-coryell')) {
    systems.push(WEST_COAST);
  }

  const entries: LexiconEntry[] = [
    ...systems.flatMap((s) => s.entries),
    ...custom.map((e) => ({ ...e, systemId: e.systemId || 'custom' })),
  ];

  const formations = new Map<string, string>();
  const runs = new Map<string, string>();
  const concepts = new Map<string, string>();
  const routes = new Map<string, string>();
  const protections = new Map<string, string>();

  const primaryLabels = new Map<string, string>(); // `${kind}:${id}` → label from first system

  for (const e of entries) {
    const bucket =
      e.kind === 'formation'
        ? formations
        : e.kind === 'run'
          ? runs
          : e.kind === 'concept'
            ? concepts
            : e.kind === 'route'
              ? routes
              : protections;
    addToMap(bucket, e.label, e.canonicalId);
    addToMap(bucket, e.canonicalId, e.canonicalId);
    for (const a of e.aliases ?? []) addToMap(bucket, a, e.canonicalId);

    const pk = `${e.kind}:${e.canonicalId}`;
    if (!primaryLabels.has(pk)) primaryLabels.set(pk, e.label);
  }

  return {
    formations,
    runs,
    concepts,
    routes,
    protections,
    preferredLabel: (kind, canonicalId) =>
      primaryLabels.get(`${kind}:${canonicalId}`) ?? canonicalId,
    entries,
  };
}

/** Match longest phrase in a lexicon map starting at tokens[start]. */
export function matchLexiconPhrase(
  map: Map<string, string>,
  tokens: string[],
  start: number,
  maxLen = 3,
): { canonicalId: string; consumed: number; matched: string } | undefined {
  const remaining = tokens.slice(start);
  for (let len = Math.min(maxLen, remaining.length); len >= 1; len--) {
    const phrase = remaining.slice(0, len).join(' ');
    const id = map.get(norm(phrase));
    if (id) return { canonicalId: id, consumed: len, matched: phrase };
  }
  return undefined;
}

export function lexiconOptions(
  lexicon: MergedLexicon,
  kind: LexiconKind,
): { id: string; label: string }[] {
  const seen = new Set<string>();
  const out: { id: string; label: string }[] = [];
  for (const e of lexicon.entries) {
    if (e.kind !== kind) continue;
    if (seen.has(e.canonicalId)) continue;
    seen.add(e.canonicalId);
    out.push({ id: e.canonicalId, label: lexicon.preferredLabel(kind, e.canonicalId) });
  }
  return out;
}
