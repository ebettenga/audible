import type { MotionAssignment, PlayCallAst, RouteAssignment } from './ast';
import { PlaycallError } from './errors';
import { findFormation } from '@/src/data/formations';
import { findMotion } from '@/src/data/motions';
import { findRouteByName } from '@/src/data/routes';
import { findProtection } from '@/src/data/protections';
import { matchCoverage } from '@/src/data/coverages';
import { findFront } from '@/src/data/fronts';
import type { Strength } from '@/src/core/field';
import {
  mergeLexicon,
  matchLexiconPhrase,
  type MergedLexicon,
  DEFAULT_SYSTEM_IDS,
} from '@/src/data/lexicon';
import type { LexiconEntry } from '@/src/data/lexicon';

const STRENGTH_TOKENS = new Set(['left', 'right', 'lt', 'rt']);
const MODIFIER_TOKENS = new Set(['slot', 'trips', 'bunch', 'empty', 'tight', 'condensed']);

/** Player-role prefixes used in tags like Y-Pop, F Angle, Z-Drag */
const ROLE_TO_SLOT: Record<string, string> = {
  x: 'x',
  y: 'y',
  z: 'z',
  h: 'h',
  f: 'fb',
  fb: 'fb',
  r: 'rb',
  rb: 'rb',
  te: 'y',
  wr: 'z',
};

function tokenize(input: string): string[] {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function parseTag(raw: string, lexicon?: MergedLexicon): RouteAssignment | undefined {
  // Formats: "Y-Pop", "Y Pop", "F Angle", "Z-Drag"
  const cleaned = raw.replace(/_/g, '-');
  const parts = cleaned.includes('-')
    ? cleaned.split('-')
    : cleaned.split(/\s+/);
  if (parts.length < 2) return undefined;

  const role = parts[0].toLowerCase();
  const routeName = parts.slice(1).join('-').toLowerCase();
  const slot = ROLE_TO_SLOT[role];
  if (!slot) return undefined;

  let routeId: string | undefined;
  if (lexicon) {
    const fromLex =
      lexicon.routes.get(routeName) ??
      lexicon.routes.get(`${role}-${routeName}`) ??
      lexicon.routes.get(raw.toLowerCase());
    if (fromLex) routeId = fromLex;
  }
  if (!routeId) {
    const route =
      findRouteByName(routeName) ||
      findRouteByName(`${role}-${routeName}`) ||
      findRouteByName(raw.toLowerCase());
    routeId = route?.id;
  }
  if (!routeId) return undefined;

  return { slot, routeId, highlight: true };
}

/** Matches "Z Jet" (two tokens) or "Z-Jet" (one token) at `i`. */
function matchMotion(
  tokens: string[],
  i: number,
): { motion: MotionAssignment; consumed: number } | undefined {
  const token = tokens[i];
  if (!token) return undefined;
  const dash = token.indexOf('-');
  if (dash > 0) {
    const slot = ROLE_TO_SLOT[token.slice(0, dash).toLowerCase()];
    const motion = findMotion(token.slice(dash + 1));
    if (slot && motion) return { motion: { slot, motionId: motion.id }, consumed: 1 };
  }
  const slot = ROLE_TO_SLOT[token.toLowerCase()];
  const motion = i + 1 < tokens.length ? findMotion(tokens[i + 1]) : undefined;
  if (slot && motion) return { motion: { slot, motionId: motion.id }, consumed: 2 };
  return undefined;
}

function isRouteDigits(token: string): boolean {
  return /^\d{2,4}$/.test(token) && ![...token].every((d) => d === '0');
}

export type ParsePlaycallOptions = {
  lexicon?: MergedLexicon;
  systemIds?: string[];
  customLexicon?: LexiconEntry[];
  /** When true, unknown tokens become warnings instead of throwing (if formation resolved). Default true. */
  softUnknown?: boolean;
};

function resolveLexicon(opts?: ParsePlaycallOptions): MergedLexicon {
  if (opts?.lexicon) return opts.lexicon;
  return mergeLexicon(opts?.systemIds ?? [...DEFAULT_SYSTEM_IDS], opts?.customLexicon ?? []);
}

/**
 * Parse a playcall string into an AST.
 * Grammar (ordered slots):
 *   Formation  Strength?  Modifier*  Motion?  Fake/Run?  RouteDigits?  Protection?  Concept? Tag*
 * Defense overlay (optional, usually set by UI): Coverage / Front can appear at end.
 *
 * Pass a merged lexicon (or systemIds) so west-coast / air-raid / custom labels resolve.
 */
export function parsePlaycall(input: string, opts?: ParsePlaycallOptions): PlayCallAst {
  const softUnknown = opts?.softUnknown !== false;
  const lexicon = resolveLexicon(opts);
  const tokens = tokenize(input);
  if (tokens.length === 0) {
    throw new PlaycallError('Empty playcall', 0, '');
  }

  let i = 0;
  const unknownTokens: string[] = [];
  const warnings: string[] = [];

  // --- Formation (required) ---
  let formationMatch = matchLexiconPhrase(lexicon.formations, tokens, i);
  if (!formationMatch) {
    // Fall back to geometry dictionary by id/name for bare ids
    const f = findFormation(tokens[i]);
    if (f) {
      formationMatch = { canonicalId: f.id, consumed: 1, matched: tokens[i] };
    }
  }
  if (!formationMatch) {
    throw new PlaycallError(
      `Unknown formation starting at "${tokens[i]}"`,
      i,
      tokens[i],
    );
  }
  let formationId = formationMatch.canonicalId;
  i += formationMatch.consumed;

  // --- Strength (before and/or after modifiers: "I Right Slot" or "Gun Doubles Tight Right") ---
  let strength: Strength = 'right';
  const takeStrength = () => {
    if (i < tokens.length && STRENGTH_TOKENS.has(tokens[i].toLowerCase())) {
      const s = tokens[i].toLowerCase();
      strength = s === 'left' || s === 'lt' ? 'left' : 'right';
      i += 1;
      return true;
    }
    return false;
  };
  takeStrength();

  // --- Modifiers (may upgrade formation, e.g. I + Slot → i-slot) ---
  const modifiers: string[] = [];
  while (i < tokens.length && MODIFIER_TOKENS.has(tokens[i].toLowerCase())) {
    const mod = tokens[i].toLowerCase();
    modifiers.push(mod === 'condensed' ? 'tight' : mod);
    i += 1;
    if (mod === 'slot' && formationId === 'i') {
      const upgraded = findFormation('i-slot');
      if (upgraded) formationId = upgraded.id;
    }
    if (mod === 'trips') {
      const upgraded = findFormation('trips') ?? findFormation('gun-trips');
      if (upgraded) formationId = upgraded.id;
    }
    if (mod === 'bunch' && (formationId === 'shotgun' || formationId === 'gun-trips' || formationId === 'trips')) {
      const upgraded = findFormation('gun-bunch');
      if (upgraded) formationId = upgraded.id;
    }
    if (mod === 'empty' && (formationId === 'shotgun' || formationId === 'gun-doubles')) {
      // Empty keeps shotgun geometry; RB often unused in resolve
      const upgraded = findFormation('shotgun');
      if (upgraded) formationId = upgraded.id;
    }
  }
  // Strength after modifiers (Gun Doubles Tight Right / Shotgun Empty Left)
  takeStrength();

  // --- Motion (Z Jet, H Orbit) ---
  let motion: MotionAssignment | undefined;
  const earlyMotion = matchMotion(tokens, i);
  if (earlyMotion) {
    motion = earlyMotion.motion;
    i += earlyMotion.consumed;
  }

  // --- Run / Fake ---
  let run: PlayCallAst['run'];
  let isFake = false;
  if (i < tokens.length && tokens[i].toLowerCase() === 'fake') {
    isFake = true;
    i += 1;
  }
  const runMatch = matchLexiconPhrase(lexicon.runs, tokens, i);
  if (runMatch) {
    run = { runId: runMatch.canonicalId, isFake };
    i += runMatch.consumed;
  } else if (isFake) {
    // "Fake" without a recognized run — rewind so Fake can be treated as unknown later
    i -= 1;
    isFake = false;
  }

  // --- Route digits ---
  let routeDigits: string | undefined;
  if (i < tokens.length && isRouteDigits(tokens[i])) {
    const asProtection =
      lexicon.protections.get(tokens[i]) ?? findProtection(tokens[i])?.id;
    const looksLikeRoutes = [...tokens[i]].some((d) => '12356789'.includes(d));
    if (!asProtection || looksLikeRoutes) {
      if (tokens[i].length >= 3) {
        routeDigits = tokens[i];
        i += 1;
      } else if (!asProtection) {
        routeDigits = tokens[i];
        i += 1;
      }
    }
  }

  // --- Protection ---
  let protectionId: string | undefined;
  if (i < tokens.length) {
    const fromLex = matchLexiconPhrase(lexicon.protections, tokens, i, 1);
    if (fromLex) {
      protectionId = fromLex.canonicalId;
      i += fromLex.consumed;
    } else {
      const prot = findProtection(tokens[i]);
      if (prot) {
        protectionId = prot.id;
        i += 1;
      }
    }
  }

  // --- Concept ---
  let conceptId: string | undefined;
  const conceptMatch = matchLexiconPhrase(lexicon.concepts, tokens, i);
  if (conceptMatch) {
    conceptId = conceptMatch.canonicalId;
    i += conceptMatch.consumed;
  }

  // --- Tags / remaining ---
  const tags: RouteAssignment[] = [];
  while (i < tokens.length) {
    const cov = matchCoverage(tokens, i);
    if (cov) break;
    const front = findFront(tokens[i]);
    if (front) break;

    if (!conceptId) {
      const lateConcept = matchLexiconPhrase(lexicon.concepts, tokens, i);
      if (lateConcept) {
        conceptId = lateConcept.canonicalId;
        i += lateConcept.consumed;
        continue;
      }
    }

    // Late run (e.g. after protection skipped)
    if (!run) {
      const lateRun = matchLexiconPhrase(lexicon.runs, tokens, i);
      if (lateRun) {
        run = { runId: lateRun.canonicalId, isFake: false };
        i += lateRun.consumed;
        continue;
      }
    }

    const lateMotion = matchMotion(tokens, i);
    if (lateMotion) {
      if (motion) {
        warnings.push('Only one player can be in motion — extra motion ignored.');
      } else {
        motion = lateMotion.motion;
      }
      i += lateMotion.consumed;
      continue;
    }

    let tagged: RouteAssignment | undefined;
    if (i + 1 < tokens.length) {
      tagged = parseTag(`${tokens[i]} ${tokens[i + 1]}`, lexicon);
      if (tagged) {
        tags.push(tagged);
        i += 2;
        continue;
      }
    }
    tagged = parseTag(tokens[i], lexicon);
    if (tagged) {
      tags.push(tagged);
      i += 1;
      continue;
    }

    if (!routeDigits && isRouteDigits(tokens[i]) && tokens[i].length >= 3) {
      routeDigits = tokens[i];
      i += 1;
      continue;
    }
    if (!protectionId) {
      const lateProt = matchLexiconPhrase(lexicon.protections, tokens, i, 1);
      if (lateProt) {
        protectionId = lateProt.canonicalId;
        i += lateProt.consumed;
        continue;
      }
      if (findProtection(tokens[i])) {
        protectionId = findProtection(tokens[i])!.id;
        i += 1;
        continue;
      }
    }

    // Soft: record unknown and continue
    if (softUnknown) {
      unknownTokens.push(tokens[i]);
      warnings.push(`Unknown token "${tokens[i]}" — map it in your custom lexicon?`);
      i += 1;
      continue;
    }

    throw new PlaycallError(`Unrecognized token "${tokens[i]}"`, i, tokens[i]);
  }

  // --- Optional coverage / front at end ---
  let coverageId: string | undefined;
  let frontId: string | undefined;
  while (i < tokens.length) {
    const cov = matchCoverage(tokens, i);
    if (cov) {
      coverageId = cov.coverage.id;
      i += cov.consumed;
      continue;
    }
    const front = findFront(tokens[i]);
    if (front) {
      frontId = front.id;
      i += 1;
      continue;
    }
    if (softUnknown) {
      unknownTokens.push(tokens[i]);
      warnings.push(`Unknown token "${tokens[i]}"`);
      i += 1;
      continue;
    }
    throw new PlaycallError(`Unrecognized token "${tokens[i]}"`, i, tokens[i]);
  }

  return {
    raw: input.trim(),
    formationId,
    strength,
    modifiers,
    motion,
    run,
    protectionId,
    routeDigits,
    conceptId,
    tags,
    coverageId,
    frontId,
    unknownTokens: unknownTokens.length ? unknownTokens : undefined,
    warnings: warnings.length ? warnings : undefined,
  };
}
