/**
 * Web / Jest persistence via AsyncStorage.
 * Native (iOS/Android) uses `storage.native.ts` (expo-sqlite) instead.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  CardProgress,
  Collection,
  PlayActivity,
  Playbook,
  PlaybookPlay,
  StudySession,
  TrainingTopic,
  UserSettings,
  UserStats,
} from './types';
import { PLAYBOOK_PLAY_LIMIT, PLAY_ACTIVITY_LIMIT } from './types';
import {
  applyStudySession,
  defaultPlaybook,
  defaultPlaybooks,
  defaultSettings,
  defaultStats,
  enrichPlay,
  ensureSeededPlaybooks,
  isBearsSeedBook,
  isPackersSeedBook,
  newId,
  normalizePlaybook,
  PACKERS_SEED_VERSION,
  withDerivedInstalls,
} from './storageSeed';

export {
  topicProgressPercent,
  overallMasteryPercent,
  weekSessionCount,
} from './storageSeed';

const PROGRESS_KEY = 'audible/card-progress';
const PLAYBOOKS_KEY = 'audible/playbooks';
const STATS_KEY = 'audible/user-stats';
const SESSION_LOG_KEY = 'audible/session-log';
const SETTINGS_KEY = 'audible/settings';
const ACTIVITY_KEY = 'audible/play-activity';
const SEED_VERSION_KEY = 'audible/seed-version';
const LEGACY_PROGRESS = 'ff/card-progress';
const LEGACY_PLAYBOOKS = 'ff/playbooks';

type MemoryState = {
  progress: Record<string, CardProgress>;
  books: Playbook[];
  stats: UserStats;
  sessions: StudySession[];
  settings: UserSettings;
  activity: PlayActivity[];
};

let memory: MemoryState | null = null;
const useMemory = !!process.env.JEST_WORKER_ID;
const viewedThisSession = new Set<string>();

function mem(): MemoryState {
  if (!memory) {
    memory = {
      progress: {},
      books: defaultPlaybooks(),
      stats: defaultStats(),
      sessions: [],
      settings: defaultSettings(),
      activity: [],
    };
  }
  return memory;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  if (useMemory) {
    if (key === PROGRESS_KEY) return mem().progress as T;
    if (key === PLAYBOOKS_KEY) return mem().books as T;
    if (key === STATS_KEY) return mem().stats as T;
    if (key === SESSION_LOG_KEY) return mem().sessions as T;
    if (key === SETTINGS_KEY) return mem().settings as T;
    if (key === ACTIVITY_KEY) return mem().activity as T;
    return fallback;
  }
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  if (useMemory) {
    if (key === PROGRESS_KEY) mem().progress = value as Record<string, CardProgress>;
    if (key === PLAYBOOKS_KEY) mem().books = value as Playbook[];
    if (key === STATS_KEY) mem().stats = value as UserStats;
    if (key === SESSION_LOG_KEY) mem().sessions = value as StudySession[];
    if (key === SETTINGS_KEY) mem().settings = value as UserSettings;
    if (key === ACTIVITY_KEY) mem().activity = value as PlayActivity[];
    return;
  }
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function migrateLegacyIfNeeded(): Promise<void> {
  if (useMemory) return;
  const existing = await AsyncStorage.getItem(PLAYBOOKS_KEY);
  if (existing) return;
  const [legacyProgress, legacyBooks] = await Promise.all([
    AsyncStorage.getItem(LEGACY_PROGRESS),
    AsyncStorage.getItem(LEGACY_PLAYBOOKS),
  ]);
  if (legacyProgress) await AsyncStorage.setItem(PROGRESS_KEY, legacyProgress);
  if (legacyBooks) {
    try {
      const books = (JSON.parse(legacyBooks) as Playbook[]).map(normalizePlaybook);
      await writeJson(PLAYBOOKS_KEY, books);
    } catch {
      await writeJson(PLAYBOOKS_KEY, [defaultPlaybook()]);
    }
  }
}

function findCollection(
  books: Playbook[],
  collectionId: string,
): { book: Playbook; collection: Collection; bookIdx: number; colIdx: number } | null {
  for (let bookIdx = 0; bookIdx < books.length; bookIdx++) {
    const book = books[bookIdx];
    const colIdx = book.collections.findIndex((c) => c.id === collectionId);
    if (colIdx >= 0) {
      return { book, collection: book.collections[colIdx], bookIdx, colIdx };
    }
  }
  return null;
}

// --- Progress ---

export async function loadProgress(): Promise<Record<string, CardProgress>> {
  await migrateLegacyIfNeeded();
  return readJson(PROGRESS_KEY, {});
}

export async function saveProgress(map: Record<string, CardProgress>): Promise<void> {
  await writeJson(PROGRESS_KEY, map);
}

export async function upsertProgress(entry: CardProgress): Promise<Record<string, CardProgress>> {
  const map = await loadProgress();
  map[entry.cardId] = entry;
  await saveProgress(map);
  return map;
}

// --- Playbooks ---

async function maybeUpgradeSeed(books: Playbook[]): Promise<Playbook[]> {
  const rawVersion = useMemory
    ? String(PACKERS_SEED_VERSION)
    : await AsyncStorage.getItem(SEED_VERSION_KEY);
  const version = Number(rawVersion ?? '1');
  const normalized = books.map(normalizePlaybook);
  // Packers + Bears seeds; merge missing plays without wiping user edits
  const next = ensureSeededPlaybooks(normalized);
  const nextIds = next.map((b) => b.id).join('\0');
  const prevIds = normalized.map((b) => b.id).join('\0');
  const packersBefore = normalized.find(isPackersSeedBook);
  const packersAfter = next.find(isPackersSeedBook);
  const playCountChanged =
    (packersBefore?.plays.length ?? 0) !== (packersAfter?.plays.length ?? 0) ||
    (packersBefore?.collections.length ?? 0) !== (packersAfter?.collections.length ?? 0);
  const changed =
    version < PACKERS_SEED_VERSION ||
    next.length !== normalized.length ||
    nextIds !== prevIds ||
    playCountChanged ||
    next[0]?.name !== normalized[0]?.name ||
    !next.some(isBearsSeedBook);

  if (changed) {
    await writeJson(PLAYBOOKS_KEY, next);
    if (!useMemory) {
      await AsyncStorage.setItem(SEED_VERSION_KEY, String(PACKERS_SEED_VERSION));
    }
  }
  return next;
}

export async function loadPlaybooks(): Promise<Playbook[]> {
  await migrateLegacyIfNeeded();
  const books = await readJson<Playbook[] | null>(PLAYBOOKS_KEY, null);
  if (!books?.length) {
    const starters = defaultPlaybooks();
    await writeJson(PLAYBOOKS_KEY, starters);
    if (!useMemory) {
      await AsyncStorage.setItem(SEED_VERSION_KEY, String(PACKERS_SEED_VERSION));
    }
    return starters;
  }
  const upgraded = await maybeUpgradeSeed(books);
  // Persist backfill so collections land once
  if (books.some((b) => !b.collections || !b.systemIds)) {
    await writeJson(PLAYBOOKS_KEY, upgraded);
  }
  return upgraded;
}

export async function savePlaybooks(books: Playbook[]): Promise<void> {
  await writeJson(
    PLAYBOOKS_KEY,
    books.map((b) => normalizePlaybook(b)),
  );
}

export async function upsertPlaybook(book: Playbook): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const idx = books.findIndex((b) => b.id === book.id);
  if (idx >= 0) books[idx] = normalizePlaybook(book);
  else books.push(normalizePlaybook(book));
  await savePlaybooks(books);
  return books;
}

export async function createPlaybook(input: { name: string }): Promise<Playbook[]> {
  const now = new Date().toISOString();
  const book: Playbook = {
    id: newId('book'),
    name: input.name.trim() || 'Untitled playbook',
    plays: [],
    collections: [],
    systemIds: ['west-coast'],
    customLexicon: [],
    updatedAt: now,
  };
  return upsertPlaybook(book);
}

/** Remove a playbook and cascade its plays / collections / activity via savePlaybooks. */
export async function deletePlaybook(bookId: string): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const next = books.filter((b) => b.id !== bookId);
  if (next.length === books.length) return next;
  await savePlaybooks(next);
  const settings = await loadSettings();
  if (settings.activeBookId === bookId) {
    await saveSettings({ ...settings, activeBookId: next[0]?.id ?? null });
  }
  return loadPlaybooks();
}

export async function addPlayToBook(
  bookId: string,
  play: Omit<PlaybookPlay, 'id' | 'createdAt'> & { id?: string },
): Promise<Playbook[]> {
  const now = new Date().toISOString();
  const books = await loadPlaybooks();
  const book = books.find((b) => b.id === bookId);
  if (!book) throw new Error(`Playbook ${bookId} not found`);
  if (book.plays.length >= PLAYBOOK_PLAY_LIMIT) {
    throw new Error(`Playbook play limit of ${PLAYBOOK_PLAY_LIMIT} reached`);
  }
  const entry = enrichPlay({
    id: play.id ?? newId('play'),
    name: play.name,
    playcall: play.playcall,
    side: play.side ?? 'off',
    notes: play.notes,
    coachingPoint: play.coachingPoint,
    coverageId: play.coverageId,
    frontId: play.frontId,
    pressureId: play.pressureId,
    vsPlaycall: play.vsPlaycall,
    concept: play.concept,
    formation: play.formation,
    personnel: play.personnel,
    assignments: play.assignments,
    favorite: play.favorite ?? false,
    reviewCount: play.reviewCount ?? 0,
    createdAt: now,
    updatedAt: now,
  });
  book.plays.push(entry);
  book.plays = withDerivedInstalls(book.plays, book.collections);
  book.updatedAt = now;
  await savePlaybooks(books);
  await appendPlayActivity({
    id: newId('act'),
    playId: entry.id,
    type: 'created',
    createdAt: now,
  });
  return loadPlaybooks();
}

export async function updatePlay(
  bookId: string,
  playId: string,
  patch: Partial<PlaybookPlay>,
): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const book = books.find((b) => b.id === bookId);
  if (!book) return books;
  const idx = book.plays.findIndex((p) => p.id === playId);
  if (idx < 0) return books;
  const prev = book.plays[idx];
  book.plays[idx] = enrichPlay({
    ...prev,
    ...patch,
    id: prev.id,
    createdAt: prev.createdAt,
    updatedAt: new Date().toISOString(),
  });
  book.plays = withDerivedInstalls(book.plays, book.collections);
  book.updatedAt = book.plays[idx].updatedAt!;
  await savePlaybooks(books);
  if (patch.favorite !== undefined && patch.favorite !== prev.favorite) {
    await appendPlayActivity({
      id: newId('act'),
      playId,
      type: patch.favorite ? 'favorited' : 'unfavorited',
      createdAt: new Date().toISOString(),
    });
  } else if (
    patch.playcall !== undefined ||
    patch.name !== undefined ||
    patch.notes !== undefined ||
    patch.coachingPoint !== undefined ||
    patch.assignments !== undefined ||
    patch.concept !== undefined ||
    patch.formation !== undefined
  ) {
    await appendPlayActivity({
      id: newId('act'),
      playId,
      type: 'edited',
      createdAt: new Date().toISOString(),
    });
  }
  return loadPlaybooks();
}

export async function toggleFavorite(bookId: string, playId: string): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const play = books.find((b) => b.id === bookId)?.plays.find((p) => p.id === playId);
  if (!play) return books;
  return updatePlay(bookId, playId, { favorite: !play.favorite });
}

export async function markPlayViewed(bookId: string, playId: string): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const play = books.find((b) => b.id === bookId)?.plays.find((p) => p.id === playId);
  if (!play) return books;
  const now = new Date().toISOString();
  const sessionKey = `${bookId}:${playId}`;
  const shouldCount = !viewedThisSession.has(sessionKey);
  if (shouldCount) viewedThisSession.add(sessionKey);
  const next = await updatePlay(bookId, playId, {
    lastViewedAt: now,
    ...(shouldCount ? { reviewCount: (play.reviewCount ?? 0) + 1 } : {}),
  });
  if (shouldCount) {
    await appendPlayActivity({
      id: newId('act'),
      playId,
      type: 'reviewed',
      createdAt: now,
    });
  }
  return next;
}

export async function removePlay(bookId: string, playId: string): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const book = books.find((b) => b.id === bookId);
  if (!book) return books;
  book.plays = book.plays.filter((p) => p.id !== playId);
  book.collections = book.collections.map((c) => ({
    ...c,
    playIds: c.playIds.filter((id) => id !== playId),
  }));
  book.plays = withDerivedInstalls(book.plays, book.collections);
  book.updatedAt = new Date().toISOString();
  await savePlaybooks(books);
  const activity = (await loadAllActivity()).filter((a) => a.playId !== playId);
  await writeJson(ACTIVITY_KEY, activity);
  return loadPlaybooks();
}

export async function duplicatePlay(bookId: string, playId: string): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const book = books.find((b) => b.id === bookId);
  const play = book?.plays.find((p) => p.id === playId);
  if (!book || !play) return books;
  return addPlayToBook(bookId, {
    name: `${play.name} (copy)`,
    playcall: play.playcall,
    side: play.side ?? 'off',
    notes: play.notes,
    coachingPoint: play.coachingPoint,
    coverageId: play.coverageId,
    frontId: play.frontId,
    pressureId: play.pressureId,
    vsPlaycall: play.vsPlaycall,
    concept: play.concept,
    formation: play.formation,
    personnel: play.personnel,
    assignments: play.assignments ? { ...play.assignments } : undefined,
    favorite: false,
    reviewCount: 0,
  });
}

// --- Collections ---

export async function createCollection(
  bookId: string,
  input: {
    name: string;
    color: string;
    playIds?: string[];
    rosterSize?: number;
    targetDate?: string;
    description?: string;
    isActive?: boolean;
  },
): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const book = books.find((b) => b.id === bookId);
  if (!book) throw new Error(`Playbook ${bookId} not found`);
  const now = new Date().toISOString();
  const collection: Collection = {
    id: newId('col'),
    bookId,
    name: input.name,
    color: input.color,
    playIds: input.playIds ?? [],
    isActive: !!input.isActive,
    rosterSize: input.rosterSize,
    targetDate: input.targetDate,
    description: input.description,
    createdAt: now,
  };
  if (collection.isActive) {
    book.collections = book.collections.map((c) => ({ ...c, isActive: false }));
  }
  book.collections.push(collection);
  book.plays = withDerivedInstalls(book.plays, book.collections);
  book.updatedAt = now;
  await savePlaybooks(books);
  return loadPlaybooks();
}

export async function updateCollection(
  id: string,
  patch: Partial<Omit<Collection, 'id' | 'bookId' | 'createdAt'>>,
): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const found = findCollection(books, id);
  if (!found) return books;
  const { book, colIdx } = found;
  book.collections[colIdx] = {
    ...book.collections[colIdx],
    ...patch,
    id: book.collections[colIdx].id,
    bookId: book.collections[colIdx].bookId,
    createdAt: book.collections[colIdx].createdAt,
  };
  if (patch.isActive === true) {
    book.collections = book.collections.map((c, i) => ({
      ...c,
      isActive: i === colIdx,
    }));
  }
  book.plays = withDerivedInstalls(book.plays, book.collections);
  book.updatedAt = new Date().toISOString();
  await savePlaybooks(books);
  return loadPlaybooks();
}

export async function deleteCollection(id: string): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const found = findCollection(books, id);
  if (!found) return books;
  const { book } = found;
  book.collections = book.collections.filter((c) => c.id !== id);
  book.plays = withDerivedInstalls(book.plays, book.collections);
  book.updatedAt = new Date().toISOString();
  await savePlaybooks(books);
  return loadPlaybooks();
}

export async function setActiveCollection(bookId: string, id: string): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const book = books.find((b) => b.id === bookId);
  if (!book) return books;
  if (!book.collections.some((c) => c.id === id)) return books;
  book.collections = book.collections.map((c) => ({
    ...c,
    isActive: c.id === id,
  }));
  book.updatedAt = new Date().toISOString();
  await savePlaybooks(books);
  return loadPlaybooks();
}

export async function addPlayToCollection(
  collectionId: string,
  playId: string,
): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const found = findCollection(books, collectionId);
  if (!found) return books;
  const { book, collection, colIdx } = found;
  if (!book.plays.some((p) => p.id === playId)) return books;
  if (!collection.playIds.includes(playId)) {
    book.collections[colIdx] = {
      ...collection,
      playIds: [...collection.playIds, playId],
    };
    book.plays = withDerivedInstalls(book.plays, book.collections);
    book.updatedAt = new Date().toISOString();
    await savePlaybooks(books);
    await appendPlayActivity({
      id: newId('act'),
      playId,
      type: 'added_to_collection',
      payload: { collectionId, name: collection.name },
      createdAt: new Date().toISOString(),
    });
  }
  return loadPlaybooks();
}

export async function removePlayFromCollection(
  collectionId: string,
  playId: string,
): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const found = findCollection(books, collectionId);
  if (!found) return books;
  const { book, collection, colIdx } = found;
  book.collections[colIdx] = {
    ...collection,
    playIds: collection.playIds.filter((id) => id !== playId),
  };
  book.plays = withDerivedInstalls(book.plays, book.collections);
  book.updatedAt = new Date().toISOString();
  await savePlaybooks(books);
  await appendPlayActivity({
    id: newId('act'),
    playId,
    type: 'removed_from_collection',
    payload: { collectionId, name: collection.name },
    createdAt: new Date().toISOString(),
  });
  return loadPlaybooks();
}

// --- Sessions ---

export async function loadSessionLog(opts?: {
  since?: string;
  topic?: TrainingTopic;
}): Promise<StudySession[]> {
  let sessions = await readJson<StudySession[]>(SESSION_LOG_KEY, []);
  if (opts?.since) {
    sessions = sessions.filter((s) => s.startedAt >= opts.since!);
  }
  if (opts?.topic) {
    sessions = sessions.filter((s) => s.topic === opts.topic);
  }
  return sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function recordSession(
  session: Omit<StudySession, 'id'> & { id?: string },
): Promise<{ session: StudySession; stats: UserStats }> {
  const entry: StudySession = {
    id: session.id ?? newId('sess'),
    startedAt: session.startedAt,
    topic: session.topic,
    cardsReviewed: session.cardsReviewed,
    correct: session.correct,
    durationSec: session.durationSec,
    xp: session.xp,
    source: session.source,
    ...(session.bookId ? { bookId: session.bookId } : {}),
    ...(session.collectionId ? { collectionId: session.collectionId } : {}),
  };
  const sessions = await readJson<StudySession[]>(SESSION_LOG_KEY, []);
  sessions.push(entry);
  await writeJson(SESSION_LOG_KEY, sessions);
  const stats = applyStudySession(await loadUserStats());
  await saveUserStats(stats);
  return { session: entry, stats };
}

// --- Settings ---

export async function loadSettings(): Promise<UserSettings> {
  const raw = await readJson<Partial<UserSettings> | null>(SETTINGS_KEY, null);
  return { ...defaultSettings(), ...(raw ?? {}) };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await writeJson(SETTINGS_KEY, settings);
}

/** Dashboard profile helpers (maps onto settings.displayName / role). */
export async function loadProfile(): Promise<{ name: string; role: string }> {
  const s = await loadSettings();
  return { name: s.displayName, role: s.role };
}

export async function saveProfile(profile: { name: string; role: string }): Promise<void> {
  const s = await loadSettings();
  await saveSettings({
    ...s,
    displayName: profile.name,
    role: profile.role || 'Offense',
  });
}

// --- Activity ---

async function loadAllActivity(): Promise<PlayActivity[]> {
  return readJson<PlayActivity[]>(ACTIVITY_KEY, []);
}

export async function appendPlayActivity(
  entry: Omit<PlayActivity, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): Promise<PlayActivity[]> {
  const activity = await loadAllActivity();
  const row: PlayActivity = {
    id: entry.id ?? newId('act'),
    playId: entry.playId,
    type: entry.type,
    payload: entry.payload,
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };
  activity.push(row);
  const forPlay = activity
    .filter((a) => a.playId === row.playId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const keepIds = new Set(forPlay.slice(0, PLAY_ACTIVITY_LIMIT).map((a) => a.id));
  const trimmed = activity.filter((a) => a.playId !== row.playId || keepIds.has(a.id));
  await writeJson(ACTIVITY_KEY, trimmed);
  return trimmed.filter((a) => a.playId === row.playId);
}

export async function loadPlayActivity(playId: string): Promise<PlayActivity[]> {
  const activity = await loadAllActivity();
  return activity
    .filter((a) => a.playId === playId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// --- User stats ---

export async function loadUserStats(): Promise<UserStats> {
  return readJson(STATS_KEY, defaultStats());
}

export async function saveUserStats(stats: UserStats): Promise<void> {
  await writeJson(STATS_KEY, stats);
}

export async function recordStudySession(): Promise<UserStats> {
  const stats = applyStudySession(await loadUserStats());
  await saveUserStats(stats);
  return stats;
}

export function __resetMemoryStore(): void {
  memory = null;
  viewedThisSession.clear();
}
