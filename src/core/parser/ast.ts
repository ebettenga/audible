import type { Strength } from '@/src/core/field';

export interface RouteAssignment {
  /** Slot id: x, y, z, h, rb, fb, etc. */
  slot: string;
  routeId: string;
  highlight?: boolean;
}

export interface MotionAssignment {
  slot: string;
  motionId: string;
}

export interface PlayCallAst {
  raw: string;
  formationId: string;
  strength: Strength;
  /** Formation modifiers like "slot" that swap to a related formation */
  modifiers: string[];
  /** Pre-snap motion like "Z Jet" — one player per play */
  motion?: MotionAssignment;
  run?: {
    runId: string;
    isFake: boolean;
  };
  protectionId?: string;
  /** Digit string like "999" or "989" */
  routeDigits?: string;
  /** Named concept id (e.g. slant-flat) */
  conceptId?: string;
  /** Named overrides / tags like Y-Pop, F Angle, Z-Drag */
  tags: RouteAssignment[];
  /** Optional defensive overlay when resolving a full scene */
  coverageId?: string;
  frontId?: string;
  /** Tokens that did not match the lexicon (warnings, not hard fails) */
  unknownTokens?: string[];
  /** Soft parse warnings for the UI */
  warnings?: string[];
}
