import type { QuizFact } from '@/src/data/quizFacts';
import {
  QUIZ_BANK_VERSION,
  QUIZ_FACTS_BUNDLED,
  hydrateQuizFactCache,
} from '@/src/training/quizCache';

type QuizRow = {
  id: string;
  topic: string;
  type: string;
  prompt: string;
  answer: string;
  distractors_json: string;
  explain: string;
  group_key: string | null;
};

function rowToFact(row: QuizRow): QuizFact {
  let distractors: string[] = [];
  try {
    distractors = JSON.parse(row.distractors_json) as string[];
  } catch {
    distractors = [];
  }
  return {
    id: row.id,
    topic: row.topic as QuizFact['topic'],
    type: row.type as QuizFact['type'],
    prompt: row.prompt,
    answer: row.answer,
    distractors,
    explain: row.explain,
    group: row.group_key ?? undefined,
  };
}

export async function ensureQuizQuestionsTable(
  db: import('expo-sqlite').SQLiteDatabase,
): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY NOT NULL,
      topic TEXT NOT NULL,
      type TEXT NOT NULL,
      prompt TEXT NOT NULL,
      answer TEXT NOT NULL,
      distractors_json TEXT NOT NULL,
      explain TEXT NOT NULL,
      group_key TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_topic ON quiz_questions(topic);
  `);
}

async function storedQuizBankVersion(
  db: import('expo-sqlite').SQLiteDatabase,
): Promise<number> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    ['quiz_bank_version'],
  );
  return row?.value ? Number(row.value) : 0;
}

export async function seedQuizQuestionsIfNeeded(
  db: import('expo-sqlite').SQLiteDatabase,
): Promise<void> {
  await ensureQuizQuestionsTable(db);
  const stored = await storedQuizBankVersion(db);
  if (stored >= QUIZ_BANK_VERSION) return;

  await db.execAsync('DELETE FROM quiz_questions;');
  for (const fact of QUIZ_FACTS_BUNDLED) {
    await db.runAsync(
      `INSERT INTO quiz_questions (
        id, topic, type, prompt, answer, distractors_json, explain, group_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fact.id,
        fact.topic,
        fact.type,
        fact.prompt,
        fact.answer,
        JSON.stringify(fact.distractors),
        fact.explain,
        fact.group ?? null,
      ],
    );
  }
  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
    'quiz_bank_version',
    String(QUIZ_BANK_VERSION),
  ]);
}

export async function loadQuizFactsFromDb(
  db: import('expo-sqlite').SQLiteDatabase,
): Promise<QuizFact[]> {
  await ensureQuizQuestionsTable(db);
  const rows = await db.getAllAsync<QuizRow>(
    'SELECT * FROM quiz_questions ORDER BY topic, id',
  );
  if (!rows.length) return QUIZ_FACTS_BUNDLED;
  return rows.map(rowToFact);
}

/** Seed SQLite if needed, then hydrate the in-memory quiz cache from the DB. */
export async function refreshQuizFactCache(
  db: import('expo-sqlite').SQLiteDatabase,
): Promise<void> {
  await seedQuizQuestionsIfNeeded(db);
  const facts = await loadQuizFactsFromDb(db);
  hydrateQuizFactCache(facts);
}
