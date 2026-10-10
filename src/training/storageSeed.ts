import type {
  Collection,
  Playbook,
  PlaybookPlay,
  UserSettings,
  UserStats,
  TrainingTopic,
  CardProgress,
} from './types';
import { generateCards } from './cards';
import { derivePlayMeta } from '@/src/features/playbook/playMeta';
import {
  buildPackersPlaybook,
  LEGACY_CORYELL_PLAY_IDS,
  PACKERS_BOOK_ID,
  PACKERS_SEED_VERSION,
} from '@/src/data/packersPlaybook';
import {
  buildBearsPlaybook,
  BEARS_BOOK_ID,
  isBearsSeedBook,
} from '@/src/data/bearsPlaybook';

export { PACKERS_BOOK_ID, PACKERS_SEED_VERSION, BEARS_BOOK_ID, isBearsSeedBook };

export function newId(prefix = 'id'): string {
  const uuid =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}-${uuid}` : uuid;
}

export function defaultStats(): UserStats {
  return {
    streakDays: 0,
    bestStreak: 0,
    weekSessions: 0,
    weekGoal: 4,
    lastSessionDate: null,
    weekStart: null,
  };
}

export function defaultSettings(): UserSettings {
  return {
    displayName: '',
    role: 'Offense',
    weeklyGoal: 4,
    seasonStart: null,
    activeBookId: null,
  };
}

/** Resolve the selected playbook: saved id → Packers → first book. */
export function resolveActiveBook(
  books: Playbook[],
  settings?: Pick<UserSettings, 'activeBookId'> | null,
): Playbook | null {
  if (!books.length) return null;
  const saved = settings?.activeBookId
    ? books.find((b) => b.id === settings.activeBookId)
    : null;
  if (saved) return saved;
  const packers =
    books.find((b) => b.id === PACKERS_BOOK_ID) ?? books.find((b) => isPackersSeedBook(b));
  return packers ?? books[0] ?? null;
}

/** @deprecated Prefer packersCollections via defaultPlaybook. Kept for native migration backfill. */
export function starterCollections(bookId: string, playIds: string[], now: string): Collection[] {
  const [a, b, c, d] = playIds;
  return [
    {
      id: 'col-red-zone',
      bookId,
      name: 'Red zone',
      color: '#dc79ad',
      playIds: [a, b].filter(Boolean),
      isActive: true,
      createdAt: now,
    },
    {
      id: 'col-third-down',
      bookId,
      name: 'Third down',
      color: '#73baf2',
      playIds: [c, d, playIds[4]].filter(Boolean),
      isActive: false,
      createdAt: now,
    },
  ];
}

/** Default on-device playbook: Packers 2026 West Coast with Bears Week 5 active. */
export function defaultPlaybook(): Playbook {
  return buildPackersPlaybook();
}

/** Fresh-install starter library: Packers (offense + D) then Bears. */
export function defaultPlaybooks(): Playbook[] {
  return [buildPackersPlaybook(), buildBearsPlaybook()];
}

/** True when this book is (or was seeded as) the Packers 2026 west-coast install. */
export function isPackersSeedBook(book: Playbook): boolean {
  if (book.id === PACKERS_BOOK_ID) return true;
  if (/packers\s*2026/i.test(book.name)) return true;
  const gb = book.plays.filter((p) => p.id.startsWith('gb-')).length;
  return gb >= 10;
}

/**
 * True when the book is still the untouched Air Coryell starter (seed v1).
 * Matches by play ids (p0–p5); name may vary. Do not replace user-authored books.
 */
export function isUntouchedLegacyDefault(book: Playbook): boolean {
  if (isPackersSeedBook(book)) return false;
  if (book.plays.length !== LEGACY_CORYELL_PLAY_IDS.length) return false;
  const ids = new Set(book.plays.map((p) => p.id));
  if (!LEGACY_CORYELL_PLAY_IDS.every((id) => ids.has(id))) return false;
  // Prefer known starter names / default id, but allow renamed copies of the same 6 plays
  if (book.id === 'default') return true;
  return /coryell/i.test(book.name);
}

function remintBookId(book: Playbook, id: string): Playbook {
  return {
    ...book,
    id,
    collections: (book.collections ?? []).map((c) => ({ ...c, bookId: id })),
  };
}

function dedupeBooksById(books: Playbook[]): Playbook[] {
  const seen = new Set<string>();
  const out: Playbook[] = [];
  for (const book of books) {
    if (seen.has(book.id)) continue;
    seen.add(book.id);
    out.push(book);
  }
  return out;
}

/**
 * Guarantee Packers 2026 is in the library.
 * Replaces an untouched Coryell starter; otherwise prepends Packers and keeps user books.
 * Migrates Packers off the legacy `default` id so it never collides with user books.
 */
export function ensurePackersPlaybook(books: Playbook[]): Playbook[] {
  let next = books.map((b) => normalizePlaybook(b));

  // Migrate Packers seed from legacy id "default" → packers-2026 (before Coryell drop)
  next = next.map((b) =>
    isPackersSeedBook(b) && b.id === 'default' ? remintBookId(b, PACKERS_BOOK_ID) : b,
  );

  if (next.some(isPackersSeedBook)) {
    // Drop the untouched legacy Air Coryell starter; it isn't a real playbook.
    next = next.filter((b) => !isUntouchedLegacyDefault(b));
  } else {
    const legacyIdx = next.findIndex(isUntouchedLegacyDefault);
    if (legacyIdx >= 0) {
      next = [defaultPlaybook(), ...next.filter((_, i) => i !== legacyIdx)];
    } else {
      next = [defaultPlaybook(), ...next];
    }
  }

  // Remint non-Packers books that still claim "default" or the Packers id
  next = next.map((b) => {
    if (isPackersSeedBook(b)) return b;
    if (b.id === 'default' || b.id === PACKERS_BOOK_ID) {
      return remintBookId(b, newId('book'));
    }
    return b;
  });

  next = dedupeBooksById(next);

  // Surface Packers first so the playbook picker defaults to it
  const packersIdx = next.findIndex(isPackersSeedBook);
  if (packersIdx <= 0) return next;
  const [packers] = next.splice(packersIdx, 1);
  return [packers, ...next];
}

/**
 * Merge new seed plays / collections into an existing Packers book without
 * overwriting user edits (favorites, notes, review counts, renamed plays).
 */
export function mergeMissingPackersSeed(book: Playbook): Playbook {
  if (!isPackersSeedBook(book)) return book;
  const seed = buildPackersPlaybook(book.updatedAt);
  const existingPlayIds = new Set(book.plays.map((p) => p.id));
  const existingColIds = new Set((book.collections ?? []).map((c) => c.id));

  const addedPlays = seed.plays.filter((p) => !existingPlayIds.has(p.id));
  const addedCols = seed.collections.filter((c) => !existingColIds.has(c.id));
  if (!addedPlays.length && !addedCols.length) return book;

  return normalizePlaybook({
    ...book,
    plays: [...book.plays, ...addedPlays],
    collections: [...(book.collections ?? []), ...addedCols],
    updatedAt: new Date().toISOString(),
  });
}

/** Guarantee Bears 2026 is in the library (append after Packers if missing). */
export function ensureBearsPlaybook(books: Playbook[]): Playbook[] {
  const next = books.map((b) => normalizePlaybook(b));
  if (next.some(isBearsSeedBook)) return next;

  // Remint any non-Bears book that stole the bears id
  const reminted = next.map((b) =>
    !isBearsSeedBook(b) && b.id === BEARS_BOOK_ID ? remintBookId(b, newId('book')) : b,
  );
  const bears = buildBearsPlaybook();
  // Keep Packers first when present
  const packersIdx = reminted.findIndex(isPackersSeedBook);
  if (packersIdx === 0) {
    return [reminted[0], bears, ...reminted.slice(1)];
  }
  if (packersIdx > 0) {
    const [packers] = reminted.splice(packersIdx, 1);
    return [packers, bears, ...reminted];
  }
  return [bears, ...reminted];
}

/**
 * Drop empty auto-named "Playbook N" stubs (created by the New playbook button).
 * Keeps Packers / Bears seeds and any book that has plays or a custom name.
 */
export function pruneEmptyNumberedPlaybooks(books: Playbook[]): Playbook[] {
  return books.filter((b) => {
    if (isPackersSeedBook(b) || isBearsSeedBook(b)) return true;
    if (b.plays.length > 0) return true;
    return !/^Playbook\s+\d+$/i.test(b.name.trim());
  });
}

/**
 * Full seed upgrade path for loaders: Packers present + merged, then Bears present.
 * Preserves user edits on existing seed plays.
 */
export function ensureSeededPlaybooks(books: Playbook[]): Playbook[] {
  let next = ensurePackersPlaybook(books);
  next = next.map((b) => (isPackersSeedBook(b) ? mergeMissingPackersSeed(b) : b));
  next = ensureBearsPlaybook(next);
  next = pruneEmptyNumberedPlaybooks(next);
  return dedupeBooksById(next);
}

export function enrichPlay(play: PlaybookPlay): PlaybookPlay {
  const side = play.side === 'def' ? 'def' : 'off';
  const derived = derivePlayMeta(play.playcall, play.assignments, side);
  return {
    ...play,
    side,
    concept: play.concept ?? derived.concept,
    formation: play.formation ?? derived.formation,
    personnel: play.personnel ?? derived.personnel,
    favorite: play.favorite ?? false,
    reviewCount: play.reviewCount ?? 0,
    updatedAt: play.updatedAt ?? play.createdAt,
  };
}

/** Attach derived `installs` from collection membership. */
export function withDerivedInstalls(
  plays: PlaybookPlay[],
  collections: Collection[],
): PlaybookPlay[] {
  const counts = new Map<string, number>();
  for (const col of collections) {
    for (const playId of col.playIds) {
      counts.set(playId, (counts.get(playId) ?? 0) + 1);
    }
  }
  return plays.map((p) => ({
    ...p,
    installs: counts.get(p.id) ?? 0,
  }));
}

/** Normalize a loaded playbook blob (backfill collections, derive installs, systems). */
export function normalizePlaybook(book: Playbook): Playbook {
  const collections = (book.collections ?? []).map((c) => ({
    ...c,
    bookId: c.bookId ?? book.id,
    playIds: c.playIds ?? [],
    isActive: !!c.isActive,
  }));
  const plays = withDerivedInstalls(book.plays.map(enrichPlay), collections);
  return {
    ...book,
    collections,
    plays,
    systemIds: book.systemIds?.length ? book.systemIds : ['west-coast'],
    customLexicon: book.customLexicon ?? [],
  };
}

export function topicProgressPercent(
  topic: TrainingTopic,
  progress: Record<string, CardProgress>,
): number {
  const cards = generateCards(topic);
  if (!cards.length) return 0;
  const seen = cards.filter((c) => progress[c.id]?.repetitions > 0).length;
  return Math.round((seen / cards.length) * 100);
}

export function overallMasteryPercent(progress: Record<string, CardProgress>): number {
  const topics: TrainingTopic[] = [
    'personnel',
    'formations',
    'play-calls',
    'running-routes',
    'passing-routes',
    'coverages',
  ];
  const vals = topics.map((t) => topicProgressPercent(t, progress));
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function applyStudySession(stats: UserStats): UserStats {
  const next = { ...stats };
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = startOfWeek(new Date()).toISOString().slice(0, 10);

  if (next.weekStart !== weekStart) {
    next.weekStart = weekStart;
    next.weekSessions = 0;
  }

  if (next.lastSessionDate !== today) {
    next.weekSessions += 1;
    if (next.lastSessionDate) {
      const prev = new Date(next.lastSessionDate);
      const cur = new Date(today);
      const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
      next.streakDays = diffDays === 1 ? next.streakDays + 1 : 1;
    } else {
      next.streakDays = 1;
    }
    next.bestStreak = Math.max(next.bestStreak, next.streakDays);
    next.lastSessionDate = today;
  }

  return next;
}

/** Sessions in the current calendar week (Mon–Sun). */
export function weekSessionCount(
  sessions: { startedAt: string }[],
  now = new Date(),
): number {
  const weekStart = startOfWeek(now).toISOString().slice(0, 10);
  const days = new Set<string>();
  for (const s of sessions) {
    const day = s.startedAt.slice(0, 10);
    if (day >= weekStart) days.add(day);
  }
  return days.size;
}
