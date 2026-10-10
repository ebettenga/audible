export interface ConceptDef {
  id: string;
  name: string;
  aliases: string[];
  /** Slot → route id */
  assignments: Record<string, string>;
  /** Display accent segment for the title */
  accentLabel: string;
  description?: string;
  /** Primary read slot or coaching tip for Learn. */
  primaryRead?: string;
}

export const CONCEPTS: ConceptDef[] = [
  {
    id: 'slant-flat',
    name: 'Slant / Flat',
    aliases: ['slant-flat', 'slant / flat', 'slant flat'],
    accentLabel: 'Slant-Flat',
    // Outer WR (Z) slant, inner WR (Y) flat — matches the reference diagram
    assignments: {
      z: 'slant',
      y: 'flat',
      x: 'go',
      h: 'drag',
    },
  },
  {
    id: 'four-verticals',
    name: 'Four Verticals',
    aliases: ['four verticals', '4 verts', 'verts'],
    accentLabel: 'Four Verticals',
    assignments: {
      x: 'go',
      h: 'seam',
      y: 'go',
      z: 'go',
    },
  },
  {
    id: 'mesh',
    name: 'Mesh',
    aliases: ['mesh'],
    accentLabel: 'Mesh',
    assignments: {
      x: 'drag',
      y: 'drag',
      z: 'go',
      h: 'flat',
    },
  },
  {
    id: 'boot',
    name: 'Boot',
    aliases: ['boot', 'pa boot', 'sail'],
    accentLabel: 'Boot',
    assignments: {
      z: 'corner',
      y: 'cross',
      h: 'flat',
      x: 'go',
      rb: 'swing',
    },
  },
  {
    id: 'dagger',
    name: 'Dagger',
    aliases: ['dagger'],
    accentLabel: 'Dagger',
    assignments: {
      h: 'go',
      z: 'in',
      x: 'go',
      y: 'sit',
    },
  },
  {
    id: 'smash',
    name: 'Smash',
    aliases: ['smash', 'china'],
    accentLabel: 'Smash',
    assignments: {
      z: 'curl',
      y: 'corner',
      x: 'go',
      h: 'flat',
    },
  },
  {
    id: 'high-cross',
    name: 'High Cross',
    aliases: ['high cross', 'high-cross'],
    accentLabel: 'High-Cross',
    assignments: {
      x: 'cross',
      z: 'cross',
      y: 'go',
      h: 'sit',
    },
  },
  {
    id: 'spacing',
    name: 'Spacing',
    aliases: ['spacing'],
    accentLabel: 'Spacing',
    assignments: {
      z: 'curl',
      y: 'sit',
      h: 'flat',
      x: 'curl',
      rb: 'swing',
    },
  },
  {
    id: 'stick',
    name: 'Stick',
    aliases: ['stick'],
    accentLabel: 'Stick',
    assignments: {
      y: 'sit',
      z: 'go',
      h: 'flat',
      x: 'go',
      rb: 'swing',
    },
  },
  {
    id: 'drive',
    name: 'Drive',
    aliases: ['drive'],
    accentLabel: 'Drive',
    assignments: {
      y: 'drag',
      z: 'in',
      x: 'go',
      h: 'sit',
    },
  },
  {
    id: 'snag',
    name: 'Snag',
    aliases: ['snag'],
    accentLabel: 'Snag',
    assignments: {
      z: 'corner',
      y: 'sit',
      h: 'flat',
      x: 'go',
    },
  },
  {
    id: 'arches',
    name: 'Arches',
    aliases: ['arches'],
    accentLabel: 'Arches',
    description: 'Delayed vertical option after intermediate clearance.',
    primaryRead: 'Z go / X cross',
    assignments: {
      z: 'go',
      y: 'sit',
      h: 'flat',
      x: 'cross',
    },
  },
  {
    id: 'flood',
    name: 'Flood',
    aliases: ['flood', 'sail flood'],
    accentLabel: 'Flood',
    description: 'Three-level flood to one side — flat, intermediate, deep.',
    primaryRead: 'High-low the flat defender',
    assignments: {
      z: 'go',
      y: 'corner',
      h: 'flat',
      x: 'sit',
    },
  },
  {
    id: 'levels',
    name: 'Levels',
    aliases: ['levels'],
    accentLabel: 'Levels',
    description: 'Two digs at different depths to stress a single hook defender.',
    primaryRead: 'Low dig, then high dig',
    assignments: {
      y: 'in',
      z: 'in',
      h: 'sit',
      x: 'go',
    },
  },
  {
    id: 'y-cross',
    name: 'Y Cross',
    aliases: ['y cross', 'y-cross'],
    accentLabel: 'Y-Cross',
    description: 'TE deep cross as the featured intermediate read.',
    primaryRead: 'Y on the cross',
    assignments: {
      y: 'cross',
      z: 'go',
      h: 'sit',
      x: 'flat',
    },
  },
  {
    id: 'curl-flat',
    name: 'Curl Flat',
    aliases: ['curl flat', 'curl-flat'],
    accentLabel: 'Curl-Flat',
    description: 'Classic high-low: curl occupies the hook, flat occupies the flat.',
    primaryRead: 'Curl vs flat defender',
    assignments: {
      z: 'curl',
      y: 'flat',
      x: 'go',
      h: 'sit',
    },
  },
  {
    id: 'corner-flat',
    name: 'Corner Flat',
    aliases: ['corner flat', 'corner-flat'],
    accentLabel: 'Corner-Flat',
    description: 'Corner and flat stretch the same defender vertically.',
    primaryRead: 'Corner over the flat',
    assignments: {
      z: 'corner',
      y: 'flat',
      x: 'go',
      h: 'sit',
    },
  },
  {
    id: 'texas',
    name: 'Texas',
    aliases: ['texas', 'angle'],
    accentLabel: 'Texas',
    description: 'Back angle / Texas route under a vertical release.',
    primaryRead: 'RB on the angle',
    assignments: {
      rb: 'angle',
      y: 'go',
      z: 'sit',
      x: 'go',
      h: 'flat',
    },
  },
  {
    id: 'sail',
    name: 'Sail',
    aliases: ['sail'],
    accentLabel: 'Sail',
    description: 'Deep, intermediate, and flat to one side — classic boot companion.',
    primaryRead: 'Sail corner vs flat',
    assignments: {
      z: 'corner',
      y: 'sit',
      h: 'flat',
      x: 'go',
    },
  },
];

// Backfill descriptions on earlier concepts
for (const c of CONCEPTS) {
  if (c.id === 'slant-flat') {
    c.description = 'Outside slant with an inside flat — beat pressure and soft edges.';
    c.primaryRead = 'Slant if soft, flat if leverage';
  } else if (c.id === 'four-verticals') {
    c.description = 'Four deep verticals to stretch any two- or three-deep shell.';
    c.primaryRead = 'Seam vs safety leverage';
  } else if (c.id === 'mesh') {
    c.description = 'Shallow crossing rubs — classic man-beater.';
    c.primaryRead = 'First open crosser';
  } else if (c.id === 'boot') {
    c.description = 'Play-action bootleg with a three-level flood away from the fake.';
    c.primaryRead = 'Flat hot, then sail';
  } else if (c.id === 'dagger') {
    c.description = 'Seam clears, dig sits underneath — intermediate answer.';
    c.primaryRead = 'Dig behind the seam';
  } else if (c.id === 'smash') {
    c.description = 'Corner / hitch high-low vs Cover 2 soft spots.';
    c.primaryRead = 'Corner if soft, hitch if flat open';
  } else if (c.id === 'high-cross') {
    c.description = 'Two deep crossers vs single-high or man-free.';
    c.primaryRead = 'Frontside cross';
  } else if (c.id === 'spacing') {
    c.description = 'Horizontal spacing — hitch, sit, flat under 2.5 seconds.';
    c.primaryRead = 'First open window';
  } else if (c.id === 'stick') {
    c.description = 'Stick / sit with a flat and vertical clear.';
    c.primaryRead = 'Stick vs flat';
  } else if (c.id === 'drive') {
    c.description = 'Shallow cross plus dig — drive the hook defender.';
    c.primaryRead = 'Shallow then dig';
  } else if (c.id === 'snag') {
    c.description = 'Corner, sit, flat triangle from a trips look.';
    c.primaryRead = 'Sit vs flat';
  }
}

export function findConcept(token: string): ConceptDef | undefined {
  const t = token.toLowerCase().trim().replace(/\s+/g, ' ');
  return CONCEPTS.find(
    (c) =>
      c.id === t ||
      c.name.toLowerCase() === t ||
      c.aliases.some((a) => a.toLowerCase() === t),
  );
}

export function matchConcept(
  tokens: string[],
  start: number,
): { concept: ConceptDef; consumed: number } | undefined {
  const remaining = tokens.slice(start);
  for (let len = Math.min(3, remaining.length); len >= 1; len--) {
    const phrase = remaining.slice(0, len).join(' ');
    const concept = findConcept(phrase);
    if (concept) return { concept, consumed: len };
  }
  return undefined;
}
