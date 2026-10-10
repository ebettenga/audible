/**
 * Native (iOS / Android) persistence via expo-sqlite.
 * Falls back to AsyncStorage if SQLite fails to open.
 */
import type {
  CardProgress,
  Collection,
  PlayActivity,
  Playbook,
  PlaybookPlay,
  PreviewColor,
  PreviewRoutes,
  StudySession,
  TrainingTopic,
  UserSettings,
  UserStats,
} from './types';
import { PLAYBOOK_PLAY_LIMIT, PLAY_ACTIVITY_LIMIT } from './types';
import type { AssignmentOverride } from '@/src/core/parser/resolve';
import {
  applyStudySession,
  defaultPlaybook,
  defaultPlaybooks,
  defaultSettings,
  defaultStats,
  enrichPlay,
  ensurePackersPlaybook,
  ensureSeededPlaybooks,
  isPackersSeedBook,
  isUntouchedLegacyDefault,
  newId,
  normalizePlaybook,
  PACKERS_SEED_VERSION,
  starterCollections,
  withDerivedInstalls,
} from './storageSeed';

export {
  topicProgressPercent,
  overallMasteryPercent,
  weekSessionCount,
} from './storageSeed';

type PlayRow = {
  id: string;
  book_id: string;
  name: string;
  playcall: string;
  side: string | null;
  notes: string | null;
  coaching_point: string | null;
  coverage_id: string | null;
  front_id: string | null;
  pressure_id: string | null;
  vs_playcall: string | null;
  concept: string | null;
  formation: string | null;
  personnel: string | null;
  assignments_json: string | null;
  preview_color: string | null;
  preview_routes: string | null;
  favorite: number;
  installs: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  last_viewed_at: string | null;
};

type CollectionRow = {
  id: string;
  book_id: string;
  name: string;
  color: string;
  is_active: number;
  roster_size: number | null;
  target_date: string | null;
  description: string | null;
  created_at: string;
};

let fallback: typeof import('./storageAsync') | null = null;
let dbReady: Promise<import('expo-sqlite').SQLiteDatabase> | null = null;
const viewedThisSession = new Set<string>();

async function getFallback() {
  if (!fallback) fallback = await import('./storageAsync');
  return fallback;
}

async function getDb() {
  if (!dbReady) {
    dbReady = (async () => {
      const SQLite = await import('expo-sqlite');
      const db = await SQLite.openDatabaseAsync('audible.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS card_progress (
          card_id TEXT PRIMARY KEY NOT NULL,
          easiness REAL NOT NULL,
          interval_days REAL NOT NULL,
          repetitions INTEGER NOT NULL,
          due_at TEXT NOT NULL,
          last_result TEXT
        );
        CREATE TABLE IF NOT EXISTS playbooks (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS plays (
          id TEXT PRIMARY KEY NOT NULL,
          book_id TEXT NOT NULL,
          name TEXT NOT NULL,
          playcall TEXT NOT NULL,
          notes TEXT,
          coaching_point TEXT,
          coverage_id TEXT,
          front_id TEXT,
          concept TEXT,
          formation TEXT,
          personnel TEXT,
          assignments_json TEXT,
          preview_color TEXT,
          preview_routes TEXT,
          favorite INTEGER NOT NULL DEFAULT 0,
          installs INTEGER NOT NULL DEFAULT 0,
          review_count INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          last_viewed_at TEXT
        );
        CREATE TABLE IF NOT EXISTS user_stats (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);
      await seedIfNeeded(db);
      await migrateV2(db);
      await migrateV3(db);
      await migrateV4(db);
      await migrateV5(db);
      await migrateV6(db);
      await migrateV7(db);
      return db;
    })();
  }
  return dbReady;
}

async function withDb<T>(
  fn: (db: import('expo-sqlite').SQLiteDatabase) => Promise<T>,
): Promise<T> {
  try {
    return await fn(await getDb());
  } catch (err) {
    console.warn('[audible] sqlite failed, using AsyncStorage', err);
    dbReady = null;
    throw err;
  }
}

function parseAssignments(raw: string | null): Record<string, AssignmentOverride> | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Record<string, AssignmentOverride>;
  } catch {
    return undefined;
  }
}

function rowToPlay(row: PlayRow): PlaybookPlay {
  return {
    id: row.id,
    name: row.name,
    playcall: row.playcall,
    side: row.side === 'def' ? 'def' : 'off',
    notes: row.notes ?? undefined,
    coachingPoint: row.coaching_point ?? undefined,
    coverageId: row.coverage_id ?? undefined,
    frontId: row.front_id ?? undefined,
    pressureId: row.pressure_id ?? undefined,
    vsPlaycall: row.vs_playcall ?? undefined,
    concept: row.concept ?? undefined,
    formation: row.formation ?? undefined,
    personnel: row.personnel ?? undefined,
    assignments: parseAssignments(row.assignments_json),
    previewColor: (row.preview_color as PreviewColor | null) ?? undefined,
    previewRoutes: (row.preview_routes as PreviewRoutes | null) ?? undefined,
    favorite: row.favorite === 1,
    installs: row.installs,
    reviewCount: row.review_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastViewedAt: row.last_viewed_at ?? undefined,
  };
}

async function insertPlay(
  db: import('expo-sqlite').SQLiteDatabase,
  bookId: string,
  play: PlaybookPlay,
  mode: 'replace' | 'ignore' = 'replace',
) {
  const p = enrichPlay(play);
  const sql =
    mode === 'ignore'
      ? `INSERT OR IGNORE INTO plays (
      id, book_id, name, playcall, side, notes, coaching_point, coverage_id, front_id,
      pressure_id, vs_playcall, concept, formation, personnel, assignments_json,
      preview_color, preview_routes, favorite, installs, review_count, created_at,
      updated_at, last_viewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT OR REPLACE INTO plays (
      id, book_id, name, playcall, side, notes, coaching_point, coverage_id, front_id,
      pressure_id, vs_playcall, concept, formation, personnel, assignments_json,
      preview_color, preview_routes, favorite, installs, review_count, created_at,
      updated_at, last_viewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  await db.runAsync(sql, [
    p.id,
    bookId,
    p.name,
    p.playcall,
    p.side ?? 'off',
    p.notes ?? null,
    p.coachingPoint ?? null,
    p.coverageId ?? null,
    p.frontId ?? null,
    p.pressureId ?? null,
    p.vsPlaycall ?? null,
    p.concept ?? null,
    p.formation ?? null,
    p.personnel ?? null,
    p.assignments ? JSON.stringify(p.assignments) : null,
    null, // preview_color unused
    null, // preview_routes unused
    p.favorite ? 1 : 0,
    0, // installs derived on read
    p.reviewCount ?? 0,
    p.createdAt,
    p.updatedAt ?? p.createdAt,
    p.lastViewedAt ?? null,
  ]);
}

async function columnExists(
  db: import('expo-sqlite').SQLiteDatabase,
  table: string,
  column: string,
): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.some((r) => r.name === column);
}

async function migrateV2(db: import('expo-sqlite').SQLiteDatabase) {
  const migrated = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    ['migrated_v2'],
  );
  if (migrated?.value === '1') return;

  if (!(await columnExists(db, 'plays', 'coaching_point'))) {
    await db.execAsync('ALTER TABLE plays ADD COLUMN coaching_point TEXT;');
  }
  if (!(await columnExists(db, 'plays', 'assignments_json'))) {
    await db.execAsync('ALTER TABLE plays ADD COLUMN assignments_json TEXT;');
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY NOT NULL,
      book_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0,
      roster_size INTEGER,
      target_date TEXT,
      description TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS collection_plays (
      collection_id TEXT NOT NULL,
      play_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (collection_id, play_id)
    );
    CREATE TABLE IF NOT EXISTS play_activity (
      id TEXT PRIMARY KEY NOT NULL,
      play_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload_json TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS session_log (
      id TEXT PRIMARY KEY NOT NULL,
      started_at TEXT NOT NULL,
      topic TEXT NOT NULL,
      cards_reviewed INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      duration_sec INTEGER NOT NULL,
      xp INTEGER NOT NULL,
      source TEXT NOT NULL,
      book_id TEXT,
      collection_id TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_plays_book ON plays(book_id);
    CREATE INDEX IF NOT EXISTS idx_plays_viewed ON plays(last_viewed_at);
    CREATE INDEX IF NOT EXISTS idx_plays_updated ON plays(updated_at);
    CREATE INDEX IF NOT EXISTS idx_collections_book ON collections(book_id);
    CREATE INDEX IF NOT EXISTS idx_collection_plays_play ON collection_plays(play_id);
    CREATE INDEX IF NOT EXISTS idx_play_activity_play ON play_activity(play_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_session_log_started ON session_log(started_at);
    CREATE INDEX IF NOT EXISTS idx_session_log_topic ON session_log(topic);
    CREATE INDEX IF NOT EXISTS idx_card_progress_due ON card_progress(due_at);
  `);

  const colCount = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) as n FROM collections',
  );
  if ((colCount?.n ?? 0) === 0) {
    let seededFromAsync = false;
    try {
      const asyncStore = await getFallback();
      const books = await asyncStore.loadPlaybooks();
      for (const book of books) {
        if (book.collections?.length) {
          for (const col of book.collections) {
            await insertCollectionRow(db, { ...col, bookId: col.bookId || book.id });
          }
          seededFromAsync = true;
        }
      }
    } catch {
      // fall through to starter seed
    }
    if (!seededFromAsync) {
      const books = await db.getAllAsync<{ id: string }>('SELECT id FROM playbooks');
      for (const book of books) {
        const plays = await db.getAllAsync<{ id: string }>(
          'SELECT id FROM plays WHERE book_id = ? ORDER BY created_at',
          [book.id],
        );
        const now = new Date().toISOString();
        const starters = starterCollections(
          book.id,
          plays.map((p) => p.id),
          now,
        );
        for (const col of starters) {
          await insertCollectionRow(db, col);
        }
      }
    }
  }

  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
    'migrated_v2',
    '1',
  ]);
}

/** Add system lexicon columns + Packers seed upgrade for untouched Coryell defaults. */
async function migrateV3(db: import('expo-sqlite').SQLiteDatabase) {
  const migrated = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    ['migrated_v3'],
  );
  if (migrated?.value === '1') return;

  try {
    await db.execAsync(`
      ALTER TABLE playbooks ADD COLUMN system_ids TEXT;
      ALTER TABLE playbooks ADD COLUMN custom_lexicon_json TEXT;
    `);
  } catch {
    // columns may already exist
  }

  const seedVer = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    ['seed_version'],
  );
  const version = Number(seedVer?.value ?? '1');
  if (version < PACKERS_SEED_VERSION) {
    const books = await db.getAllAsync<{ id: string; name: string; updated_at: string }>(
      'SELECT * FROM playbooks',
    );
    for (const book of books) {
      const plays = await db.getAllAsync<PlayRow>(
        'SELECT * FROM plays WHERE book_id = ?',
        [book.id],
      );
      const collections = await loadCollectionsForBook(db, book.id);
      const asBook: Playbook = {
        id: book.id,
        name: book.name,
        updatedAt: book.updated_at,
        plays: plays.map(rowToPlay),
        collections,
      };
      if (isUntouchedLegacyDefault(asBook)) {
        await db.runAsync('DELETE FROM collection_plays WHERE collection_id IN (SELECT id FROM collections WHERE book_id = ?)', [
          book.id,
        ]);
        await db.runAsync('DELETE FROM collections WHERE book_id = ?', [book.id]);
        await db.runAsync('DELETE FROM play_activity WHERE play_id IN (SELECT id FROM plays WHERE book_id = ?)', [
          book.id,
        ]);
        await db.runAsync('DELETE FROM plays WHERE book_id = ?', [book.id]);
        await db.runAsync('DELETE FROM playbooks WHERE id = ?', [book.id]);
        const starter = defaultPlaybook();
        await db.runAsync(
          'INSERT INTO playbooks (id, name, updated_at, system_ids, custom_lexicon_json) VALUES (?, ?, ?, ?, ?)',
          [
            starter.id,
            starter.name,
            starter.updatedAt,
            JSON.stringify(starter.systemIds ?? ['west-coast']),
            JSON.stringify(starter.customLexicon ?? []),
          ],
        );
        for (const play of starter.plays) await insertPlay(db, starter.id, play);
        for (const col of starter.collections) await insertCollectionRow(db, col);
      }
    }
    await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
      'seed_version',
      String(PACKERS_SEED_VERSION),
    ]);
  }

  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
    'migrated_v3',
    '1',
  ]);
}

/** Add optional playbook scope columns on session_log. */
async function migrateV4(db: import('expo-sqlite').SQLiteDatabase) {
  const migrated = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    ['migrated_v4'],
  );
  if (migrated?.value === '1') return;

  if (!(await columnExists(db, 'session_log', 'book_id'))) {
    await db.execAsync('ALTER TABLE session_log ADD COLUMN book_id TEXT;');
  }
  if (!(await columnExists(db, 'session_log', 'collection_id'))) {
    await db.execAsync('ALTER TABLE session_log ADD COLUMN collection_id TEXT;');
  }


  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
    'migrated_v4',
    '1',
  ]);
}

/**
 * Seed v3: guarantee Packers 2026 exists (v2 often bumped seed_version without inserting).
 */
async function migrateV5(db: import('expo-sqlite').SQLiteDatabase) {
  const migrated = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    ['migrated_v5'],
  );
  if (migrated?.value === '1') return;

  const books = await db.getAllAsync<BookRow>('SELECT * FROM playbooks');
  const loaded: Playbook[] = [];
  for (const book of books) {
    const plays = await db.getAllAsync<PlayRow>('SELECT * FROM plays WHERE book_id = ?', [
      book.id,
    ]);
    const collections = await loadCollectionsForBook(db, book.id);
    loaded.push(
      normalizePlaybook({
        id: book.id,
        name: book.name,
        updatedAt: book.updated_at,
        plays: plays.map(rowToPlay),
        collections,
        ...parseBookSystems(book),
      }),
    );
  }

  const ensured = ensurePackersPlaybook(loaded);
  for (const book of ensured) {
    if (loaded.some((b) => b.id === book.id && isPackersSeedBook(b))) continue;
    if (isPackersSeedBook(book) && !loaded.some((b) => b.id === book.id)) {
      // New Packers book
      await db.runAsync(
        'INSERT OR REPLACE INTO playbooks (id, name, updated_at, system_ids, custom_lexicon_json) VALUES (?, ?, ?, ?, ?)',
        [
          book.id,
          book.name,
          book.updatedAt,
          JSON.stringify(book.systemIds ?? ['west-coast']),
          JSON.stringify(book.customLexicon ?? []),
        ],
      );
      for (const play of book.plays) await insertPlay(db, book.id, play);
      for (const col of book.collections) await insertCollectionRow(db, col);
      continue;
    }
    if (isPackersSeedBook(book) && loaded.some((b) => b.id === book.id && !isPackersSeedBook(b))) {
      // Replaced legacy default in-place
      await db.runAsync('DELETE FROM collection_plays WHERE collection_id IN (SELECT id FROM collections WHERE book_id = ?)', [
        book.id,
      ]);
      await db.runAsync('DELETE FROM collections WHERE book_id = ?', [book.id]);
      await db.runAsync('DELETE FROM plays WHERE book_id = ?', [book.id]);
      await db.runAsync(
        'UPDATE playbooks SET name = ?, updated_at = ?, system_ids = ?, custom_lexicon_json = ? WHERE id = ?',
        [
          book.name,
          book.updatedAt,
          JSON.stringify(book.systemIds ?? ['west-coast']),
          JSON.stringify(book.customLexicon ?? []),
          book.id,
        ],
      );
      for (const play of book.plays) await insertPlay(db, book.id, play);
      for (const col of book.collections) await insertCollectionRow(db, col);
    }
  }

  // Persist reminted books (e.g. user book moved off legacy `default` id)
  for (const book of ensured) {
    if (loaded.some((b) => b.id === book.id)) continue;
    if (isPackersSeedBook(book)) continue; // already inserted above
    await db.runAsync(
      'INSERT OR REPLACE INTO playbooks (id, name, updated_at, system_ids, custom_lexicon_json) VALUES (?, ?, ?, ?, ?)',
      [
        book.id,
        book.name,
        book.updatedAt,
        JSON.stringify(book.systemIds ?? ['west-coast']),
        JSON.stringify(book.customLexicon ?? []),
      ],
    );
    for (const play of book.plays) await insertPlay(db, book.id, play);
    for (const col of book.collections) await insertCollectionRow(db, col);
  }

  // Drop books ensurePackers removed or reminted away (legacy Coryell, old `default` Packers id)
  for (const old of loaded) {
    if (ensured.some((b) => b.id === old.id)) continue;
    await db.runAsync('DELETE FROM collection_plays WHERE collection_id IN (SELECT id FROM collections WHERE book_id = ?)', [
      old.id,
    ]);
    await db.runAsync('DELETE FROM collections WHERE book_id = ?', [old.id]);
    await db.runAsync('DELETE FROM plays WHERE book_id = ?', [old.id]);
    await db.runAsync('DELETE FROM playbooks WHERE id = ?', [old.id]);
  }

  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
    'seed_version',
    String(PACKERS_SEED_VERSION),
  ]);
  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
    'migrated_v5',
    '1',
  ]);
}

/** Add side / pressure / vs_playcall columns for defensive plays. */
async function migrateV6(db: import('expo-sqlite').SQLiteDatabase) {
  const migrated = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    ['migrated_v6'],
  );
  if (migrated?.value === '1') return;

  if (!(await columnExists(db, 'plays', 'side'))) {
    await db.execAsync("ALTER TABLE plays ADD COLUMN side TEXT NOT NULL DEFAULT 'off';");
  }
  if (!(await columnExists(db, 'plays', 'pressure_id'))) {
    await db.execAsync('ALTER TABLE plays ADD COLUMN pressure_id TEXT;');
  }
  if (!(await columnExists(db, 'plays', 'vs_playcall'))) {
    await db.execAsync('ALTER TABLE plays ADD COLUMN vs_playcall TEXT;');
  }

  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
    'migrated_v6',
    '1',
  ]);
}

/**
 * Seed v5: Packers defense looks + offense extras + Bears 2026 book.
 * Idempotent — INSERT OR IGNORE on plays; only insert missing collections / Bears book.
 * Does not rewrite existing Packers plays (preserves favorites / notes / edits).
 */
async function migrateV7(db: import('expo-sqlite').SQLiteDatabase) {
  const migrated = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    ['migrated_v7'],
  );
  if (migrated?.value === '1') return;

  const books = await db.getAllAsync<BookRow>('SELECT * FROM playbooks');
  const loaded: Playbook[] = [];
  for (const book of books) {
    const plays = await db.getAllAsync<PlayRow>('SELECT * FROM plays WHERE book_id = ?', [
      book.id,
    ]);
    const collections = await loadCollectionsForBook(db, book.id);
    loaded.push(
      normalizePlaybook({
        id: book.id,
        name: book.name,
        updatedAt: book.updated_at,
        plays: plays.map(rowToPlay),
        collections,
        ...parseBookSystems(book),
      }),
    );
  }

  const ensured = ensureSeededPlaybooks(loaded);

  for (const book of ensured) {
    const prior = loaded.find((b) => b.id === book.id);
    if (!prior) {
      // Brand-new book (Packers and/or Bears)
      await db.runAsync(
        'INSERT OR REPLACE INTO playbooks (id, name, updated_at, system_ids, custom_lexicon_json) VALUES (?, ?, ?, ?, ?)',
        [
          book.id,
          book.name,
          book.updatedAt,
          JSON.stringify(book.systemIds ?? ['west-coast']),
          JSON.stringify(book.customLexicon ?? []),
        ],
      );
      for (const play of book.plays) await insertPlay(db, book.id, play, 'ignore');
      for (const col of book.collections) await insertCollectionRow(db, col);
      continue;
    }

    if (isPackersSeedBook(book)) {
      const priorPlayIds = new Set(prior.plays.map((p) => p.id));
      const priorColIds = new Set(prior.collections.map((c) => c.id));
      for (const play of book.plays) {
        if (priorPlayIds.has(play.id)) continue;
        await insertPlay(db, book.id, play, 'ignore');
      }
      for (const col of book.collections) {
        if (priorColIds.has(col.id)) continue;
        await insertCollectionRow(db, col);
      }
      await db.runAsync(
        'UPDATE playbooks SET updated_at = ?, system_ids = ?, custom_lexicon_json = ? WHERE id = ?',
        [
          book.updatedAt,
          JSON.stringify(book.systemIds ?? ['west-coast']),
          JSON.stringify(book.customLexicon ?? []),
          book.id,
        ],
      );
    }
  }

  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
    'seed_version',
    String(PACKERS_SEED_VERSION),
  ]);
  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
    'migrated_v7',
    '1',
  ]);
}

async function insertCollectionRow(
  db: import('expo-sqlite').SQLiteDatabase,
  col: Collection,
) {
  await db.runAsync(
    `INSERT OR REPLACE INTO collections (
      id, book_id, name, color, is_active, roster_size, target_date, description, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      col.id,
      col.bookId,
      col.name,
      col.color,
      col.isActive ? 1 : 0,
      col.rosterSize ?? null,
      col.targetDate ?? null,
      col.description ?? null,
      col.createdAt,
    ],
  );
  await db.runAsync('DELETE FROM collection_plays WHERE collection_id = ?', [col.id]);
  for (let i = 0; i < col.playIds.length; i++) {
    await db.runAsync(
      'INSERT OR REPLACE INTO collection_plays (collection_id, play_id, sort_order) VALUES (?, ?, ?)',
      [col.id, col.playIds[i], i],
    );
  }
}

async function loadCollectionsForBook(
  db: import('expo-sqlite').SQLiteDatabase,
  bookId: string,
): Promise<Collection[]> {
  const rows = await db.getAllAsync<CollectionRow>(
    'SELECT * FROM collections WHERE book_id = ? ORDER BY created_at',
    [bookId],
  );
  const result: Collection[] = [];
  for (const row of rows) {
    const members = await db.getAllAsync<{ play_id: string }>(
      'SELECT play_id FROM collection_plays WHERE collection_id = ? ORDER BY sort_order',
      [row.id],
    );
    result.push({
      id: row.id,
      bookId: row.book_id,
      name: row.name,
      color: row.color,
      playIds: members.map((m) => m.play_id),
      isActive: row.is_active === 1,
      rosterSize: row.roster_size ?? undefined,
      targetDate: row.target_date ?? undefined,
      description: row.description ?? undefined,
      createdAt: row.created_at,
    });
  }
  return result;
}

async function seedIfNeeded(db: import('expo-sqlite').SQLiteDatabase) {
  const migrated = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    ['migrated_v1'],
  );
  if (migrated?.value === '1') return;

  try {
    const asyncStore = await getFallback();
    const books = await asyncStore.loadPlaybooks();
    const progress = await asyncStore.loadProgress();
    const stats = await asyncStore.loadUserStats();
    for (const [cardId, entry] of Object.entries(progress)) {
      await db.runAsync(
        `INSERT OR REPLACE INTO card_progress
          (card_id, easiness, interval_days, repetitions, due_at, last_result)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          cardId,
          entry.easiness,
          entry.intervalDays,
          entry.repetitions,
          entry.dueAt,
          entry.lastResult ?? null,
        ],
      );
    }
    for (const book of books) {
      await db.runAsync(
        'INSERT OR REPLACE INTO playbooks (id, name, updated_at) VALUES (?, ?, ?)',
        [book.id, book.name, book.updatedAt],
      );
      for (const play of book.plays) await insertPlay(db, book.id, play);
    }
    for (const [key, value] of Object.entries(stats)) {
      await db.runAsync('INSERT OR REPLACE INTO user_stats (key, value) VALUES (?, ?)', [
        key,
        value == null ? '' : String(value),
      ]);
    }
  } catch {
    const starter = defaultPlaybook();
    await db.runAsync(
      'INSERT OR REPLACE INTO playbooks (id, name, updated_at) VALUES (?, ?, ?)',
      [starter.id, starter.name, starter.updatedAt],
    );
    for (const play of starter.plays) await insertPlay(db, starter.id, play);
    for (const [key, value] of Object.entries(defaultStats())) {
      await db.runAsync('INSERT OR REPLACE INTO user_stats (key, value) VALUES (?, ?)', [
        key,
        value == null ? '' : String(value),
      ]);
    }
  }

  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
    'migrated_v1',
    '1',
  ]);
}

async function viaSqliteOrAsync<T>(
  sqliteFn: () => Promise<T>,
  asyncKey: keyof typeof import('./storageAsync'),
  ...args: unknown[]
): Promise<T> {
  try {
    return await sqliteFn();
  } catch {
    const store = await getFallback();
    const fn = store[asyncKey] as (...a: unknown[]) => Promise<T>;
    return fn(...args);
  }
}

async function trimPlayActivity(
  db: import('expo-sqlite').SQLiteDatabase,
  playId: string,
) {
  await db.runAsync(
    `DELETE FROM play_activity WHERE play_id = ? AND id NOT IN (
      SELECT id FROM play_activity WHERE play_id = ?
      ORDER BY created_at DESC LIMIT ?
    )`,
    [playId, playId, PLAY_ACTIVITY_LIMIT],
  );
}

async function insertActivityRow(
  db: import('expo-sqlite').SQLiteDatabase,
  entry: PlayActivity,
) {
  await db.runAsync(
    `INSERT OR REPLACE INTO play_activity (id, play_id, type, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.playId,
      entry.type,
      entry.payload ? JSON.stringify(entry.payload) : null,
      entry.createdAt,
    ],
  );
  await trimPlayActivity(db, entry.playId);
}

// --- Progress ---

export async function loadProgress(): Promise<Record<string, CardProgress>> {
  return viaSqliteOrAsync(async () => {
    return withDb(async (db) => {
      const rows = await db.getAllAsync<{
        card_id: string;
        easiness: number;
        interval_days: number;
        repetitions: number;
        due_at: string;
        last_result: string | null;
      }>('SELECT * FROM card_progress');
      const map: Record<string, CardProgress> = {};
      for (const row of rows) {
        map[row.card_id] = {
          cardId: row.card_id,
          easiness: row.easiness,
          intervalDays: row.interval_days,
          repetitions: row.repetitions,
          dueAt: row.due_at,
          lastResult: (row.last_result as CardProgress['lastResult']) ?? undefined,
        };
      }
      return map;
    });
  }, 'loadProgress');
}

export async function saveProgress(map: Record<string, CardProgress>): Promise<void> {
  return viaSqliteOrAsync(async () => {
    await withDb(async (db) => {
      await db.execAsync('DELETE FROM card_progress');
      for (const entry of Object.values(map)) {
        await db.runAsync(
          `INSERT INTO card_progress
            (card_id, easiness, interval_days, repetitions, due_at, last_result)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            entry.cardId,
            entry.easiness,
            entry.intervalDays,
            entry.repetitions,
            entry.dueAt,
            entry.lastResult ?? null,
          ],
        );
      }
    });
  }, 'saveProgress', map);
}

export async function upsertProgress(entry: CardProgress): Promise<Record<string, CardProgress>> {
  return viaSqliteOrAsync(async () => {
    await withDb(async (db) => {
      await db.runAsync(
        `INSERT OR REPLACE INTO card_progress
          (card_id, easiness, interval_days, repetitions, due_at, last_result)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          entry.cardId,
          entry.easiness,
          entry.intervalDays,
          entry.repetitions,
          entry.dueAt,
          entry.lastResult ?? null,
        ],
      );
    });
    return loadProgress();
  }, 'upsertProgress', entry);
}

// --- Playbooks ---

type BookRow = {
  id: string;
  name: string;
  updated_at: string;
  system_ids?: string | null;
  custom_lexicon_json?: string | null;
};

function parseBookSystems(book: BookRow): Pick<Playbook, 'systemIds' | 'customLexicon'> {
  let systemIds: string[] = ['west-coast'];
  let customLexicon: Playbook['customLexicon'] = [];
  try {
    if (book.system_ids) systemIds = JSON.parse(book.system_ids) as string[];
  } catch {
    /* keep default */
  }
  try {
    if (book.custom_lexicon_json) {
      customLexicon = JSON.parse(book.custom_lexicon_json) as Playbook['customLexicon'];
    }
  } catch {
    /* keep empty */
  }
  return { systemIds, customLexicon };
}

export async function loadPlaybooks(): Promise<Playbook[]> {
  return viaSqliteOrAsync(async () => {
    return withDb(async (db) => {
      const books = await db.getAllAsync<BookRow>('SELECT * FROM playbooks ORDER BY name');
      if (!books.length) {
        const starters = defaultPlaybooks();
        for (const starter of starters) {
          await db.runAsync(
            'INSERT INTO playbooks (id, name, updated_at, system_ids, custom_lexicon_json) VALUES (?, ?, ?, ?, ?)',
            [
              starter.id,
              starter.name,
              starter.updatedAt,
              JSON.stringify(starter.systemIds ?? ['west-coast']),
              JSON.stringify(starter.customLexicon ?? []),
            ],
          );
          for (const play of starter.plays) await insertPlay(db, starter.id, play);
          for (const col of starter.collections) await insertCollectionRow(db, col);
        }
        await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
          'seed_version',
          String(PACKERS_SEED_VERSION),
        ]);
        return starters.map(normalizePlaybook);
      }
      const result: Playbook[] = [];
      for (const book of books) {
        const plays = await db.getAllAsync<PlayRow>(
          'SELECT * FROM plays WHERE book_id = ? ORDER BY created_at',
          [book.id],
        );
        const collections = await loadCollectionsForBook(db, book.id);
        const systems = parseBookSystems(book);
        result.push(
          normalizePlaybook({
            id: book.id,
            name: book.name,
            updatedAt: book.updated_at,
            collections,
            plays: withDerivedInstalls(plays.map(rowToPlay), collections),
            ...systems,
          }),
        );
      }
      const ensured = ensureSeededPlaybooks(result);
      for (const book of ensured) {
        if (result.some((b) => b.id === book.id)) continue;
        await db.runAsync(
          'INSERT OR REPLACE INTO playbooks (id, name, updated_at, system_ids, custom_lexicon_json) VALUES (?, ?, ?, ?, ?)',
          [
            book.id,
            book.name,
            book.updatedAt,
            JSON.stringify(book.systemIds ?? ['west-coast']),
            JSON.stringify(book.customLexicon ?? []),
          ],
        );
        for (const play of book.plays) await insertPlay(db, book.id, play, 'ignore');
        for (const col of book.collections) await insertCollectionRow(db, col);
      }
      // Persist merged Packers seed plays/collections without overwriting existing rows
      for (const book of ensured) {
        if (!isPackersSeedBook(book)) continue;
        const prior = result.find((b) => b.id === book.id);
        if (!prior) continue;
        const priorPlayIds = new Set(prior.plays.map((p) => p.id));
        const priorColIds = new Set(prior.collections.map((c) => c.id));
        for (const play of book.plays) {
          if (priorPlayIds.has(play.id)) continue;
          await insertPlay(db, book.id, play, 'ignore');
        }
        for (const col of book.collections) {
          if (priorColIds.has(col.id)) continue;
          await insertCollectionRow(db, col);
        }
      }
      // Drop pruned stubs (e.g. empty "Playbook 3") from the DB
      for (const old of result) {
        if (ensured.some((b) => b.id === old.id)) continue;
        await db.runAsync(
          'DELETE FROM collection_plays WHERE collection_id IN (SELECT id FROM collections WHERE book_id = ?)',
          [old.id],
        );
        await db.runAsync('DELETE FROM collections WHERE book_id = ?', [old.id]);
        await db.runAsync(
          'DELETE FROM play_activity WHERE play_id IN (SELECT id FROM plays WHERE book_id = ?)',
          [old.id],
        );
        await db.runAsync('DELETE FROM plays WHERE book_id = ?', [old.id]);
        await db.runAsync('DELETE FROM playbooks WHERE id = ?', [old.id]);
      }
      return ensured;
    });
  }, 'loadPlaybooks');
}

export async function savePlaybooks(books: Playbook[]): Promise<void> {
  return viaSqliteOrAsync(async () => {
    await withDb(async (db) => {
      const keepBookIds = books.map((b) => b.id);
      const keepPlayIds = books.flatMap((b) => b.plays.map((p) => p.id));
      const keepColIds = books.flatMap((b) => b.collections.map((c) => c.id));

      // Delete removed books / plays / collections without wiping unrelated activity for kept plays
      if (keepBookIds.length) {
        const placeholders = keepBookIds.map(() => '?').join(',');
        await db.runAsync(
          `DELETE FROM collection_plays WHERE collection_id IN (
            SELECT id FROM collections WHERE book_id NOT IN (${placeholders})
          )`,
          keepBookIds,
        );
        await db.runAsync(
          `DELETE FROM collections WHERE book_id NOT IN (${placeholders})`,
          keepBookIds,
        );
        await db.runAsync(
          `DELETE FROM play_activity WHERE play_id IN (
            SELECT id FROM plays WHERE book_id NOT IN (${placeholders})
          )`,
          keepBookIds,
        );
        await db.runAsync(`DELETE FROM plays WHERE book_id NOT IN (${placeholders})`, keepBookIds);
        await db.runAsync(
          `DELETE FROM playbooks WHERE id NOT IN (${placeholders})`,
          keepBookIds,
        );
      } else {
        await db.execAsync(
          'DELETE FROM collection_plays; DELETE FROM collections; DELETE FROM play_activity; DELETE FROM plays; DELETE FROM playbooks;',
        );
      }

      if (keepPlayIds.length) {
        const placeholders = keepPlayIds.map(() => '?').join(',');
        await db.runAsync(
          `DELETE FROM collection_plays WHERE play_id NOT IN (${placeholders})`,
          keepPlayIds,
        );
        await db.runAsync(
          `DELETE FROM play_activity WHERE play_id NOT IN (${placeholders})`,
          keepPlayIds,
        );
        await db.runAsync(
          `DELETE FROM plays WHERE id NOT IN (${placeholders})`,
          keepPlayIds,
        );
      }

      if (keepColIds.length) {
        const placeholders = keepColIds.map(() => '?').join(',');
        await db.runAsync(
          `DELETE FROM collection_plays WHERE collection_id NOT IN (${placeholders})`,
          keepColIds,
        );
        await db.runAsync(
          `DELETE FROM collections WHERE id NOT IN (${placeholders})`,
          keepColIds,
        );
      } else {
        await db.execAsync('DELETE FROM collection_plays; DELETE FROM collections;');
      }

      for (const book of books) {
        const normalized = normalizePlaybook(book);
        await db.runAsync(
          'INSERT OR REPLACE INTO playbooks (id, name, updated_at, system_ids, custom_lexicon_json) VALUES (?, ?, ?, ?, ?)',
          [
            normalized.id,
            normalized.name,
            normalized.updatedAt,
            JSON.stringify(normalized.systemIds ?? ['west-coast']),
            JSON.stringify(normalized.customLexicon ?? []),
          ],
        );
        for (const play of normalized.plays) await insertPlay(db, normalized.id, play);
        for (const col of normalized.collections) await insertCollectionRow(db, col);
      }
    });
  }, 'savePlaybooks', books);
}

export async function upsertPlaybook(book: Playbook): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const idx = books.findIndex((b) => b.id === book.id);
  if (idx >= 0) books[idx] = book;
  else books.push(book);
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

/** Remove a playbook and cascade related rows via savePlaybooks. */
export async function deletePlaybook(bookId: string): Promise<Playbook[]> {
  return viaSqliteOrAsync(async () => {
    const books = await loadPlaybooks();
    const next = books.filter((b) => b.id !== bookId);
    if (next.length === books.length) return next;
    await savePlaybooks(next);
    const settings = await loadSettings();
    if (settings.activeBookId === bookId) {
      await saveSettings({ ...settings, activeBookId: next[0]?.id ?? null });
    }
    return loadPlaybooks();
  }, 'deletePlaybook', bookId);
}

export async function addPlayToBook(
  bookId: string,
  play: Omit<PlaybookPlay, 'id' | 'createdAt'> & { id?: string },
): Promise<Playbook[]> {
  return viaSqliteOrAsync(async () => {
    const now = new Date().toISOString();
    return withDb(async (db) => {
      const count = await db.getFirstAsync<{ n: number }>(
        'SELECT COUNT(*) as n FROM plays WHERE book_id = ?',
        [bookId],
      );
      if ((count?.n ?? 0) >= PLAYBOOK_PLAY_LIMIT) {
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
      await insertPlay(db, bookId, entry);
      await db.runAsync('UPDATE playbooks SET updated_at = ? WHERE id = ?', [now, bookId]);
      await insertActivityRow(db, {
        id: newId('act'),
        playId: entry.id,
        type: 'created',
        createdAt: now,
      });
      return loadPlaybooks();
    });
  }, 'addPlayToBook', bookId, play);
}

export async function updatePlay(
  bookId: string,
  playId: string,
  patch: Partial<PlaybookPlay>,
): Promise<Playbook[]> {
  return viaSqliteOrAsync(async () => {
    return withDb(async (db) => {
      const row = await db.getFirstAsync<PlayRow>(
        'SELECT * FROM plays WHERE book_id = ? AND id = ?',
        [bookId, playId],
      );
      if (!row) return loadPlaybooks();
      const prev = rowToPlay(row);
      const next = enrichPlay({
        ...prev,
        ...patch,
        id: prev.id,
        createdAt: prev.createdAt,
        updatedAt: new Date().toISOString(),
      });
      await insertPlay(db, bookId, next);
      await db.runAsync('UPDATE playbooks SET updated_at = ? WHERE id = ?', [
        next.updatedAt!,
        bookId,
      ]);

      if (patch.favorite !== undefined && patch.favorite !== prev.favorite) {
        await insertActivityRow(db, {
          id: newId('act'),
          playId,
          type: patch.favorite ? 'favorited' : 'unfavorited',
          createdAt: next.updatedAt!,
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
        await insertActivityRow(db, {
          id: newId('act'),
          playId,
          type: 'edited',
          createdAt: next.updatedAt!,
        });
      }
      return loadPlaybooks();
    });
  }, 'updatePlay', bookId, playId, patch);
}

export async function toggleFavorite(bookId: string, playId: string): Promise<Playbook[]> {
  const books = await loadPlaybooks();
  const play = books.find((b) => b.id === bookId)?.plays.find((p) => p.id === playId);
  if (!play) return books;
  return updatePlay(bookId, playId, { favorite: !play.favorite });
}

export async function markPlayViewed(bookId: string, playId: string): Promise<Playbook[]> {
  return viaSqliteOrAsync(async () => {
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
      await withDb(async (db) => {
        await insertActivityRow(db, {
          id: newId('act'),
          playId,
          type: 'reviewed',
          createdAt: now,
        });
      });
    }
    return next;
  }, 'markPlayViewed', bookId, playId);
}

export async function removePlay(bookId: string, playId: string): Promise<Playbook[]> {
  return viaSqliteOrAsync(async () => {
    await withDb(async (db) => {
      await db.runAsync('DELETE FROM collection_plays WHERE play_id = ?', [playId]);
      await db.runAsync('DELETE FROM play_activity WHERE play_id = ?', [playId]);
      await db.runAsync('DELETE FROM plays WHERE book_id = ? AND id = ?', [bookId, playId]);
      await db.runAsync('UPDATE playbooks SET updated_at = ? WHERE id = ?', [
        new Date().toISOString(),
        bookId,
      ]);
    });
    return loadPlaybooks();
  }, 'removePlay', bookId, playId);
}

export async function duplicatePlay(bookId: string, playId: string): Promise<Playbook[]> {
  return viaSqliteOrAsync(async () => {
    const books = await loadPlaybooks();
    const play = books.find((b) => b.id === bookId)?.plays.find((p) => p.id === playId);
    if (!play) return books;
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
  }, 'duplicatePlay', bookId, playId);
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
  return viaSqliteOrAsync(async () => {
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
    await withDb(async (db) => {
      if (collection.isActive) {
        await db.runAsync('UPDATE collections SET is_active = 0 WHERE book_id = ?', [bookId]);
      }
      await insertCollectionRow(db, collection);
      await db.runAsync('UPDATE playbooks SET updated_at = ? WHERE id = ?', [now, bookId]);
    });
    return loadPlaybooks();
  }, 'createCollection', bookId, input);
}

export async function updateCollection(
  id: string,
  patch: Partial<Omit<Collection, 'id' | 'bookId' | 'createdAt'>>,
): Promise<Playbook[]> {
  return viaSqliteOrAsync(async () => {
    return withDb(async (db) => {
      const row = await db.getFirstAsync<CollectionRow>(
        'SELECT * FROM collections WHERE id = ?',
        [id],
      );
      if (!row) return loadPlaybooks();
      const members = await db.getAllAsync<{ play_id: string }>(
        'SELECT play_id FROM collection_plays WHERE collection_id = ? ORDER BY sort_order',
        [id],
      );
      const next: Collection = {
        id: row.id,
        bookId: row.book_id,
        name: patch.name ?? row.name,
        color: patch.color ?? row.color,
        playIds: patch.playIds ?? members.map((m) => m.play_id),
        isActive: patch.isActive ?? row.is_active === 1,
        rosterSize:
          patch.rosterSize !== undefined ? patch.rosterSize : (row.roster_size ?? undefined),
        targetDate:
          patch.targetDate !== undefined ? patch.targetDate : (row.target_date ?? undefined),
        description:
          patch.description !== undefined ? patch.description : (row.description ?? undefined),
        createdAt: row.created_at,
      };
      if (patch.isActive === true) {
        await db.runAsync('UPDATE collections SET is_active = 0 WHERE book_id = ?', [
          row.book_id,
        ]);
      }
      await insertCollectionRow(db, next);
      await db.runAsync('UPDATE playbooks SET updated_at = ? WHERE id = ?', [
        new Date().toISOString(),
        row.book_id,
      ]);
      return loadPlaybooks();
    });
  }, 'updateCollection', id, patch);
}

export async function deleteCollection(id: string): Promise<Playbook[]> {
  return viaSqliteOrAsync(async () => {
    return withDb(async (db) => {
      const row = await db.getFirstAsync<{ book_id: string }>(
        'SELECT book_id FROM collections WHERE id = ?',
        [id],
      );
      await db.runAsync('DELETE FROM collection_plays WHERE collection_id = ?', [id]);
      await db.runAsync('DELETE FROM collections WHERE id = ?', [id]);
      if (row) {
        await db.runAsync('UPDATE playbooks SET updated_at = ? WHERE id = ?', [
          new Date().toISOString(),
          row.book_id,
        ]);
      }
      return loadPlaybooks();
    });
  }, 'deleteCollection', id);
}

export async function setActiveCollection(bookId: string, id: string): Promise<Playbook[]> {
  return viaSqliteOrAsync(async () => {
    return withDb(async (db) => {
      const exists = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM collections WHERE id = ? AND book_id = ?',
        [id, bookId],
      );
      if (!exists) return loadPlaybooks();
      await db.runAsync('UPDATE collections SET is_active = 0 WHERE book_id = ?', [bookId]);
      await db.runAsync('UPDATE collections SET is_active = 1 WHERE id = ?', [id]);
      await db.runAsync('UPDATE playbooks SET updated_at = ? WHERE id = ?', [
        new Date().toISOString(),
        bookId,
      ]);
      return loadPlaybooks();
    });
  }, 'setActiveCollection', bookId, id);
}

export async function addPlayToCollection(
  collectionId: string,
  playId: string,
): Promise<Playbook[]> {
  return viaSqliteOrAsync(async () => {
    return withDb(async (db) => {
      const col = await db.getFirstAsync<CollectionRow>(
        'SELECT * FROM collections WHERE id = ?',
        [collectionId],
      );
      if (!col) return loadPlaybooks();
      const play = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM plays WHERE id = ? AND book_id = ?',
        [playId, col.book_id],
      );
      if (!play) return loadPlaybooks();
      const existing = await db.getFirstAsync<{ play_id: string }>(
        'SELECT play_id FROM collection_plays WHERE collection_id = ? AND play_id = ?',
        [collectionId, playId],
      );
      if (!existing) {
        const max = await db.getFirstAsync<{ n: number }>(
          'SELECT COALESCE(MAX(sort_order), -1) as n FROM collection_plays WHERE collection_id = ?',
          [collectionId],
        );
        await db.runAsync(
          'INSERT INTO collection_plays (collection_id, play_id, sort_order) VALUES (?, ?, ?)',
          [collectionId, playId, (max?.n ?? -1) + 1],
        );
        await insertActivityRow(db, {
          id: newId('act'),
          playId,
          type: 'added_to_collection',
          payload: { collectionId, name: col.name },
          createdAt: new Date().toISOString(),
        });
        await db.runAsync('UPDATE playbooks SET updated_at = ? WHERE id = ?', [
          new Date().toISOString(),
          col.book_id,
        ]);
      }
      return loadPlaybooks();
    });
  }, 'addPlayToCollection', collectionId, playId);
}

export async function removePlayFromCollection(
  collectionId: string,
  playId: string,
): Promise<Playbook[]> {
  return viaSqliteOrAsync(async () => {
    return withDb(async (db) => {
      const col = await db.getFirstAsync<CollectionRow>(
        'SELECT * FROM collections WHERE id = ?',
        [collectionId],
      );
      await db.runAsync(
        'DELETE FROM collection_plays WHERE collection_id = ? AND play_id = ?',
        [collectionId, playId],
      );
      if (col) {
        await insertActivityRow(db, {
          id: newId('act'),
          playId,
          type: 'removed_from_collection',
          payload: { collectionId, name: col.name },
          createdAt: new Date().toISOString(),
        });
        await db.runAsync('UPDATE playbooks SET updated_at = ? WHERE id = ?', [
          new Date().toISOString(),
          col.book_id,
        ]);
      }
      return loadPlaybooks();
    });
  }, 'removePlayFromCollection', collectionId, playId);
}

// --- Sessions ---

export async function loadSessionLog(opts?: {
  since?: string;
  topic?: TrainingTopic;
}): Promise<StudySession[]> {
  return viaSqliteOrAsync(async () => {
    return withDb(async (db) => {
      let sql = 'SELECT * FROM session_log';
      const params: string[] = [];
      const clauses: string[] = [];
      if (opts?.since) {
        clauses.push('started_at >= ?');
        params.push(opts.since);
      }
      if (opts?.topic) {
        clauses.push('topic = ?');
        params.push(opts.topic);
      }
      if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`;
      sql += ' ORDER BY started_at DESC';
      const rows = await db.getAllAsync<{
        id: string;
        started_at: string;
        topic: string;
        cards_reviewed: number;
        correct: number;
        duration_sec: number;
        xp: number;
        source: string;
        book_id?: string | null;
        collection_id?: string | null;
      }>(sql, params);
      return rows.map((r) => ({
        id: r.id,
        startedAt: r.started_at,
        topic: r.topic as TrainingTopic,
        cardsReviewed: r.cards_reviewed,
        correct: r.correct,
        durationSec: r.duration_sec,
        xp: r.xp,
        source: r.source as StudySession['source'],
        ...(r.book_id ? { bookId: r.book_id } : {}),
        ...(r.collection_id ? { collectionId: r.collection_id } : {}),
      }));
    });
  }, 'loadSessionLog', opts);
}

export async function recordSession(
  session: Omit<StudySession, 'id'> & { id?: string },
): Promise<{ session: StudySession; stats: UserStats }> {
  return viaSqliteOrAsync(async () => {
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
    await withDb(async (db) => {
      await db.runAsync(
        `INSERT INTO session_log
          (id, started_at, topic, cards_reviewed, correct, duration_sec, xp, source, book_id, collection_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.id,
          entry.startedAt,
          entry.topic,
          entry.cardsReviewed,
          entry.correct,
          entry.durationSec,
          entry.xp,
          entry.source,
          entry.bookId ?? null,
          entry.collectionId ?? null,
        ],
      );
    });
    const stats = applyStudySession(await loadUserStats());
    await saveUserStats(stats);
    return { session: entry, stats };
  }, 'recordSession', session);
}

// --- Settings ---

export async function loadSettings(): Promise<UserSettings> {
  return viaSqliteOrAsync(async () => {
    return withDb(async (db) => {
      const rows = await db.getAllAsync<{ key: string; value: string }>(
        'SELECT * FROM settings',
      );
      if (!rows.length) return defaultSettings();
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      return {
        displayName: map.displayName ?? '',
        role: map.role ?? 'Offense',
        weeklyGoal: Number(map.weeklyGoal ?? 4),
        seasonStart: map.seasonStart || null,
        activeBookId: map.activeBookId || null,
      };
    });
  }, 'loadSettings');
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  return viaSqliteOrAsync(async () => {
    await withDb(async (db) => {
      for (const [key, value] of Object.entries(settings)) {
        await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
          key,
          value == null ? '' : String(value),
        ]);
      }
    });
  }, 'saveSettings', settings);
}

export async function loadProfile(): Promise<{ name: string; role: string }> {
  return viaSqliteOrAsync(async () => {
    const s = await loadSettings();
    return { name: s.displayName, role: s.role };
  }, 'loadProfile');
}

export async function saveProfile(profile: { name: string; role: string }): Promise<void> {
  return viaSqliteOrAsync(async () => {
    const s = await loadSettings();
    await saveSettings({
      ...s,
      displayName: profile.name,
      role: profile.role || 'Offense',
    });
  }, 'saveProfile', profile);
}

// --- Activity ---

export async function appendPlayActivity(
  entry: Omit<PlayActivity, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): Promise<PlayActivity[]> {
  return viaSqliteOrAsync(async () => {
    const row: PlayActivity = {
      id: entry.id ?? newId('act'),
      playId: entry.playId,
      type: entry.type,
      payload: entry.payload,
      createdAt: entry.createdAt ?? new Date().toISOString(),
    };
    await withDb(async (db) => {
      await insertActivityRow(db, row);
    });
    return loadPlayActivity(row.playId);
  }, 'appendPlayActivity', entry);
}

export async function loadPlayActivity(playId: string): Promise<PlayActivity[]> {
  return viaSqliteOrAsync(async () => {
    return withDb(async (db) => {
      const rows = await db.getAllAsync<{
        id: string;
        play_id: string;
        type: string;
        payload_json: string | null;
        created_at: string;
      }>('SELECT * FROM play_activity WHERE play_id = ? ORDER BY created_at DESC', [playId]);
      return rows.map((r) => ({
        id: r.id,
        playId: r.play_id,
        type: r.type as PlayActivity['type'],
        payload: r.payload_json
          ? (JSON.parse(r.payload_json) as Record<string, string>)
          : undefined,
        createdAt: r.created_at,
      }));
    });
  }, 'loadPlayActivity', playId);
}

// --- User stats ---

export async function loadUserStats(): Promise<UserStats> {
  return viaSqliteOrAsync(async () => {
    return withDb(async (db) => {
      const rows = await db.getAllAsync<{ key: string; value: string }>(
        'SELECT * FROM user_stats',
      );
      if (!rows.length) return defaultStats();
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      return {
        streakDays: Number(map.streakDays ?? 0),
        bestStreak: Number(map.bestStreak ?? 0),
        weekSessions: Number(map.weekSessions ?? 0),
        weekGoal: Number(map.weekGoal ?? 4),
        lastSessionDate: map.lastSessionDate || null,
        weekStart: map.weekStart || null,
      };
    });
  }, 'loadUserStats');
}

export async function saveUserStats(stats: UserStats): Promise<void> {
  return viaSqliteOrAsync(async () => {
    await withDb(async (db) => {
      for (const [key, value] of Object.entries(stats)) {
        await db.runAsync('INSERT OR REPLACE INTO user_stats (key, value) VALUES (?, ?)', [
          key,
          value == null ? '' : String(value),
        ]);
      }
    });
  }, 'saveUserStats', stats);
}

export async function recordStudySession(): Promise<UserStats> {
  const stats = applyStudySession(await loadUserStats());
  await saveUserStats(stats);
  return stats;
}

export function __resetMemoryStore(): void {
  viewedThisSession.clear();
}
