import type { MotionAssignment, PlayCallAst, RouteAssignment } from '@/src/core/parser/ast';
import { MOTIONS } from '@/src/data/motions';
import type { Strength } from '@/src/core/field';
import { FORMATIONS } from '@/src/data/formations';
import { CONCEPTS } from '@/src/data/concepts';
import { RUNS } from '@/src/data/runs';
import { PROTECTIONS } from '@/src/data/protections';
import { ROUTES } from '@/src/data/routes';
import { COVERAGES } from '@/src/data/coverages';
import { FRONTS } from '@/src/data/fronts';
import {
  mergeLexicon,
  type MergedLexicon,
  DEFAULT_SYSTEM_IDS,
} from '@/src/data/lexicon';

export const MODIFIER_OPTIONS = ['slot', 'trips', 'bunch', 'empty', 'tight'] as const;

export const SLOT_TO_TAG_ROLE: Record<string, string> = {
  x: 'X',
  y: 'Y',
  z: 'Z',
  h: 'H',
  fb: 'F',
  rb: 'R',
};

export interface PlaycallDraft {
  formationId: string;
  strength: Strength;
  modifiers: string[];
  motion?: MotionAssignment;
  runId?: string;
  runIsFake: boolean;
  routeDigits?: string;
  protectionId?: string;
  conceptId?: string;
  tags: RouteAssignment[];
  /** Resolve overlays — not always written into the playcall string */
  coverageId?: string;
  frontId?: string;
  /** When true, append coverage/front tokens to the composed call */
  includeDefenseInCall: boolean;
}

export function defaultPlaycallDraft(): PlaycallDraft {
  return {
    formationId: 'gun-doubles',
    strength: 'right',
    modifiers: [],
    runIsFake: false,
    protectionId: '62',
    conceptId: 'slant-flat',
    tags: [],
    frontId: '4-3',
    includeDefenseInCall: false,
  };
}

function formationName(id: string, lexicon?: MergedLexicon): string {
  if (lexicon) return lexicon.preferredLabel('formation', id);
  return FORMATIONS.find((f) => f.id === id)?.name ?? id;
}

function conceptAccent(id: string, lexicon?: MergedLexicon): string {
  if (lexicon) return lexicon.preferredLabel('concept', id);
  const c = CONCEPTS.find((x) => x.id === id);
  return c?.accentLabel ?? c?.name ?? id;
}

function runPhrase(id: string, lexicon?: MergedLexicon): string {
  if (lexicon) return lexicon.preferredLabel('run', id);
  const run = RUNS.find((r) => r.id === id);
  return run?.name ?? id;
}

function tagToken(tag: RouteAssignment): string {
  const role = SLOT_TO_TAG_ROLE[tag.slot] ?? tag.slot.toUpperCase();
  const route = ROUTES.find((r) => r.id === tag.routeId);
  const routeName = (route?.name.split(' / ')[0] ?? tag.routeId).replace(/\s+/g, '-');
  return `${role}-${routeName}`;
}

function motionToken(motion: MotionAssignment): string {
  const role = SLOT_TO_TAG_ROLE[motion.slot] ?? motion.slot.toUpperCase();
  const name = MOTIONS.find((m) => m.id === motion.motionId)?.name ?? motion.motionId;
  return `${role} ${name}`;
}

/**
 * Compose a playcall string from structured draft fields.
 * Grammar: Formation Strength? Modifier* Motion? (Fake)? Run? RouteDigits? Protection? Concept? Tag*
 * Optional trailing Coverage / Front when includeDefenseInCall is set.
 */
export function composePlaycall(
  draft: PlaycallDraft,
  lexicon?: MergedLexicon,
): string {
  const parts: string[] = [formationName(draft.formationId, lexicon)];

  if (draft.strength) {
    parts.push(draft.strength === 'left' ? 'Left' : 'Right');
  }

  // Skip modifiers already baked into the formation id (parser upgrades I+Slot → i-slot).
  const formationMods = new Set(
    draft.formationId.includes('slot')
      ? ['slot']
      : draft.formationId === 'trips' || draft.formationId === 'gun-trips'
        ? ['trips']
        : draft.formationId === 'gun-bunch'
          ? ['bunch']
          : [],
  );
  for (const mod of draft.modifiers) {
    const cleaned = mod.trim().toLowerCase();
    if (!cleaned || formationMods.has(cleaned)) continue;
    parts.push(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
  }

  if (draft.motion) {
    parts.push(motionToken(draft.motion));
  }

  if (draft.runId) {
    if (draft.runIsFake) parts.push('Fake');
    parts.push(runPhrase(draft.runId, lexicon));
  }

  if (draft.routeDigits?.trim()) {
    parts.push(draft.routeDigits.trim());
  }

  if (draft.protectionId) {
    const prot = PROTECTIONS.find((p) => p.id === draft.protectionId);
    parts.push(prot?.id ?? draft.protectionId);
  }

  if (draft.conceptId) {
    parts.push(conceptAccent(draft.conceptId, lexicon));
  }

  for (const tag of draft.tags) {
    parts.push(tagToken(tag));
  }

  if (draft.includeDefenseInCall) {
    if (draft.coverageId) {
      const cov = COVERAGES.find((c) => c.id === draft.coverageId);
      if (cov) parts.push(cov.name);
    }
    if (draft.frontId) {
      const front = FRONTS.find((f) => f.id === draft.frontId);
      if (front) parts.push(front.name);
    }
  }

  return parts.join(' ');
}

/** Lexicon for composing with a playbook's enabled systems. */
export function lexiconFromSystemIds(
  systemIds?: string[],
  custom?: import('@/src/data/lexicon').LexiconEntry[],
): MergedLexicon {
  return mergeLexicon(systemIds?.length ? systemIds : [...DEFAULT_SYSTEM_IDS], custom ?? []);
}

/** Map a parsed AST into a PlaycallDraft, preserving resolve overlays when provided. */
export function draftFromAst(
  ast: PlayCallAst,
  overlays?: { coverageId?: string; frontId?: string; includeDefenseInCall?: boolean },
): PlaycallDraft {
  return {
    formationId: ast.formationId,
    strength: ast.strength,
    modifiers: [...ast.modifiers],
    motion: ast.motion ? { ...ast.motion } : undefined,
    runId: ast.run?.runId,
    runIsFake: ast.run?.isFake ?? false,
    routeDigits: ast.routeDigits,
    protectionId: ast.protectionId,
    conceptId: ast.conceptId,
    tags: ast.tags.map((t) => ({ ...t })),
    coverageId: overlays?.coverageId ?? ast.coverageId,
    frontId: overlays?.frontId ?? ast.frontId ?? '4-3',
    includeDefenseInCall:
      overlays?.includeDefenseInCall ?? !!(ast.coverageId || ast.frontId),
  };
}

export function draftSnapshot(draft: PlaycallDraft): string {
  return JSON.stringify({
    formationId: draft.formationId,
    strength: draft.strength,
    modifiers: draft.modifiers,
    motion: draft.motion ?? null,
    runId: draft.runId ?? null,
    runIsFake: draft.runIsFake,
    routeDigits: draft.routeDigits ?? null,
    protectionId: draft.protectionId ?? null,
    conceptId: draft.conceptId ?? null,
    tags: draft.tags,
    coverageId: draft.coverageId ?? null,
    frontId: draft.frontId ?? null,
    includeDefenseInCall: draft.includeDefenseInCall,
  });
}
