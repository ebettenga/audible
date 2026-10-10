import type { PlayScene } from '@/src/core/schema';
import type { AssignmentOverride } from '@/src/core/parser/resolve';
import type { LexiconEntry } from '@/src/data/lexicon';

export type { AssignmentOverride, LexiconEntry };

export type TrainingTopic =
  | 'personnel'
  | 'formations'
  | 'play-calls'
  | 'running-routes'
  | 'passing-routes'
  | 'zones'
  | 'coverages'
  | 'field-positions'
  | 'fronts'
  | 'pressures'
  | 'defender-assignments'
  | 'coverage-reads';

export type CardType =
  | 'name-formation'
  | 'name-position'
  | 'name-personnel'
  | 'name-route'
  | 'name-coverage'
  | 'match-playcall'
  | 'name-zone'
  | 'name-gap'
  | 'name-front'
  | 'name-pressure'
  | 'name-assignment'
  | 'beat-coverage';

export type PlaySide = 'off' | 'def';

export interface FlashCard {
  id: string;
  topic: TrainingTopic;
  type: CardType;
  prompt: string;
  answer: string;
  distractors: string[];
  /** Playcall to render, if any */
  playcall?: string;
  /** Prebuilt scene override */
  scene?: PlayScene;
  /** Scene shown after the answer is locked (routes on, labels restored, etc.). */
  revealScene?: PlayScene;
  /** Coaching tip shown under the answer reveal. */
  explain?: string;
  /**
   * Family key used to avoid back-to-back cards from the same group
   * (e.g. coverage id, formation id, concept id).
   */
  group?: string;
  /** Extra answers that can be drawn as distractors for this family. */
  distractorPool?: string[];
  /** Resolver options (e.g. coverage) */
  resolveOptions?: {
    coverageId?: string;
    frontId?: string;
    includeDefense?: boolean;
    /** When set, getCardScene keeps / highlights only this zone. */
    highlightZoneId?: string;
  };
  /** Hide title / certain players when showing the question */
  hideTitle?: boolean;
  highlightPlayerId?: string;
  highlightArrowId?: string;
  highlightZoneId?: string;
}

export interface CardProgress {
  cardId: string;
  easiness: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string; // ISO
  lastResult?: 'again' | 'hard' | 'good' | 'easy';
}

export type PreviewColor = 'yellow' | 'blue' | 'orange' | 'pink' | 'green' | 'purple';
export type PreviewRoutes =
  | 'slant'
  | 'verticals'
  | 'power'
  | 'mesh'
  | 'zone'
  | 'spacing';

export interface PlaybookPlay {
  id: string;
  name: string;
  playcall: string;
  /** Offense (default) or defense play. */
  side?: PlaySide;
  notes?: string;
  coachingPoint?: string;
  coverageId?: string;
  frontId?: string;
  /** Blitz / stunt id for defensive plays. */
  pressureId?: string;
  /** Offensive look shown against a defensive play (ghost offense). */
  vsPlaycall?: string;
  concept?: string;
  formation?: string;
  personnel?: string;
  /** Per-slot route / defender overrides from the builder inspector */
  assignments?: Record<string, AssignmentOverride>;
  previewColor?: PreviewColor;
  previewRoutes?: PreviewRoutes;
  favorite?: boolean;
  /** Derived: number of collections containing this play */
  installs?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt?: string;
  lastViewedAt?: string;
}

export interface Collection {
  id: string;
  bookId: string;
  name: string;
  color: string;
  /** Play ids in this collection (API shape; SQLite uses collection_plays) */
  playIds: string[];
  isActive: boolean;
  rosterSize?: number;
  targetDate?: string;
  description?: string;
  createdAt: string;
}

export type PlayActivityType =
  | 'created'
  | 'edited'
  | 'favorited'
  | 'unfavorited'
  | 'added_to_collection'
  | 'removed_from_collection'
  | 'reviewed';

export interface PlayActivity {
  id: string;
  playId: string;
  type: PlayActivityType;
  payload?: Record<string, string>;
  createdAt: string;
}

export interface StudySession {
  id: string;
  startedAt: string;
  topic: TrainingTopic;
  cardsReviewed: number;
  correct: number;
  durationSec: number;
  xp: number;
  source: 'flashcards' | 'quiz';
  /** Optional playbook drill scope (topic stays play-calls). */
  bookId?: string;
  collectionId?: string;
}

export interface UserSettings {
  displayName: string;
  role: string;
  weeklyGoal: number;
  /** Null means calendar year. */
  seasonStart: string | null;
  /** Selected playbook for Learn / Playbook tabs. Null = resolve to Packers / first. */
  activeBookId: string | null;
}

export interface Playbook {
  id: string;
  name: string;
  plays: PlaybookPlay[];
  collections: Collection[];
  updatedAt: string;
  /** Enabled call-system pack ids (e.g. west-coast, air-coryell, air-raid). */
  systemIds?: string[];
  /** User aliases mapped onto canonical geometry ids. */
  customLexicon?: LexiconEntry[];
}

export interface UserStats {
  streakDays: number;
  bestStreak: number;
  weekSessions: number;
  weekGoal: number;
  lastSessionDate: string | null;
  weekStart: string | null;
}

/** Soft cap for plays per playbook (storage meter). */
export const PLAYBOOK_PLAY_LIMIT = 100;

/** Cap for play activity rows kept per play. */
export const PLAY_ACTIVITY_LIMIT = 50;

export const TOPIC_META: Record<
  TrainingTopic,
  {
    title: string;
    description: string;
    color: string;
    tone: 'lime' | 'blue' | 'orange' | 'pink' | 'purple' | 'cyan';
    icon: 'users' | 'layers' | 'book' | 'arrow' | 'spark' | 'grid';
    lessons: number;
  }
> = {
  personnel: {
    title: 'Personnel',
    description: 'Master position groups and skill-player labels.',
    color: '#c9f25b',
    tone: 'lime',
    icon: 'users',
    lessons: 16,
  },
  formations: {
    title: 'Formations',
    description: 'Identify offensive sets before the snap.',
    color: '#73baf2',
    tone: 'blue',
    icon: 'layers',
    lessons: 20,
  },
  'play-calls': {
    title: 'Play Calls',
    description: 'Break down complete calls with confidence.',
    color: '#f0a55d',
    tone: 'orange',
    icon: 'book',
    lessons: 10,
  },
  'running-routes': {
    title: 'Running Routes',
    description: 'Learn gaps, tracks, and blocking paths.',
    color: '#dc79ad',
    tone: 'pink',
    icon: 'arrow',
    lessons: 36,
  },
  'passing-routes': {
    title: 'Passing Routes',
    description: 'Read the route tree and core concepts.',
    color: '#ae8ee8',
    tone: 'purple',
    icon: 'spark',
    lessons: 40,
  },
  zones: {
    title: 'Zones',
    description: 'Deep thirds, flats, hooks, and curls.',
    color: '#ae8ee8',
    tone: 'purple',
    icon: 'grid',
    lessons: 30,
  },
  coverages: {
    title: 'Coverages',
    description: 'Recognize shells and post-snap rotations.',
    color: '#6bd6cf',
    tone: 'cyan',
    icon: 'grid',
    lessons: 24,
  },
  'field-positions': {
    title: 'Field Positions',
    description: 'Hashes, gaps, and alignments.',
    color: '#6bd6cf',
    tone: 'cyan',
    icon: 'grid',
    lessons: 6,
  },
  fronts: {
    title: 'Fronts',
    description: 'Identify fronts, shifts, and personnel packages.',
    color: '#73baf2',
    tone: 'blue',
    icon: 'layers',
    lessons: 22,
  },
  pressures: {
    title: 'Pressures',
    description: 'Name blitzes, dogs, and stunts.',
    color: '#f0a55d',
    tone: 'orange',
    icon: 'arrow',
    lessons: 12,
  },
  'defender-assignments': {
    title: 'Defender Assignments',
    description: 'Know each defender’s job after the snap.',
    color: '#dc79ad',
    tone: 'pink',
    icon: 'users',
    lessons: 60,
  },
  'coverage-reads': {
    title: 'Coverage Reads',
    description: 'Which concepts beat each shell — and why.',
    color: '#ae8ee8',
    tone: 'purple',
    icon: 'spark',
    lessons: 60,
  },
};
