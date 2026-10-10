import type {
  CardProgress,
  FlashCard,
  Playbook,
  StudySession,
  TrainingTopic,
  UserSettings,
  UserStats,
} from '@/src/training/types';
import { TOPIC_META } from '@/src/training/types';
import { cardsFromPlaybook, generateCards, playsForScope } from '@/src/training/cards';
import { isDue } from '@/src/training/srs';
import { topicProgressPercent, overallMasteryPercent, startOfWeek } from '@/src/training/storageSeed';
import { estimateMinutes, nextUpTopics } from '@/src/features/dashboard/nextUp';

export type LearnModule = {
  topic: TrainingTopic;
  title: string;
  description: string;
  lessons: number;
  progress: number;
  mastery: number;
  dueCount: number;
  tone: (typeof TOPIC_META)[TrainingTopic]['tone'];
  icon: (typeof TOPIC_META)[TrainingTopic]['icon'];
};

export type PlaybookModule = {
  kind: 'playbook' | 'collection';
  bookId: string;
  collectionId?: string;
  title: string;
  description: string;
  color: string;
  playCount: number;
  lessons: number;
  progress: number;
  mastery: number;
  dueCount: number;
};

export type CardSetMetrics = {
  playCount: number;
  lessons: number;
  progress: number;
  mastery: number;
  dueCount: number;
};

/** Offense curriculum modules shown on Learn. */
export const OFFENSE_LEARN_TOPICS: TrainingTopic[] = [
  'personnel',
  'formations',
  'play-calls',
  'running-routes',
  'passing-routes',
];

/** Defense curriculum modules shown on Learn. */
export const DEFENSE_LEARN_TOPICS: TrainingTopic[] = [
  'fronts',
  'coverages',
  'pressures',
  'defender-assignments',
  'coverage-reads',
  'zones',
];

/** Full curriculum (offense + defense, no duplicates). */
export const LEARN_TOPICS: TrainingTopic[] = [
  ...OFFENSE_LEARN_TOPICS,
  ...DEFENSE_LEARN_TOPICS,
];

/** Prefer defense topics first when the profile role is defensive. */
export function learnTopicsForRole(role?: string | null): TrainingTopic[] {
  const r = (role ?? '').toLowerCase();
  const defensive =
    r.includes('def') ||
    (r.includes('coord') && r.includes('d')) ||
    /\b(db|cb|safety|lb|dl|de|dt|nickel)\b/.test(r);
  if (defensive) return [...DEFENSE_LEARN_TOPICS, ...OFFENSE_LEARN_TOPICS];
  return LEARN_TOPICS;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/** Local calendar day as yyyy-mm-dd (avoids UTC shift from toISOString). */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type WeekDayState = {
  label: string;
  /** Local calendar date yyyy-mm-dd */
  date: string;
  status: 'done' | 'today' | 'upcoming';
};

export function weekDays(log: StudySession[], today: Date = new Date()): WeekDayState[] {
  const weekStart = startOfWeek(today);
  const todayIso = localDateKey(today);
  const studied = new Set(log.map((s) => localDateKey(new Date(s.startedAt))));

  return DAY_LABELS.map((label, index) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + index);
    const date = localDateKey(d);
    let status: WeekDayState['status'] = 'upcoming';
    if (date === todayIso) status = studied.has(date) ? 'done' : 'today';
    else if (date < todayIso) status = studied.has(date) ? 'done' : 'upcoming';
    else status = 'upcoming';
    return { label, date, status };
  });
}

/** Due / mastery / seen / lessons for an arbitrary card list (shared SRS ids). */
export function cardSetMetrics(
  cards: FlashCard[],
  progress: Record<string, CardProgress>,
  now: Date = new Date(),
): CardSetMetrics {
  const playCount = cards.length;
  if (!playCount) {
    return { playCount: 0, lessons: 0, progress: 0, mastery: 0, dueCount: 0 };
  }
  let dueCount = 0;
  let seen = 0;
  let mastered = 0;
  for (const card of cards) {
    const p = progress[card.id];
    if (isDue(p, now)) dueCount += 1;
    if (p && p.repetitions > 0) seen += 1;
    if (p && (p.repetitions >= 2 || p.intervalDays >= 3)) mastered += 1;
  }
  return {
    playCount,
    lessons: Math.max(1, Math.ceil(playCount / 10)),
    progress: Math.round((seen / playCount) * 100),
    mastery: Math.round((mastered / playCount) * 100),
    dueCount,
  };
}

export function dueCount(
  topic: TrainingTopic,
  progress: Record<string, CardProgress>,
  now: Date = new Date(),
): number {
  return cardSetMetrics(generateCards(topic), progress, now).dueCount;
}

/** Mastery: repetitions >= 2 OR intervalDays >= 3. */
export function masteryPercent(
  topic: TrainingTopic,
  progress: Record<string, CardProgress>,
): number {
  return cardSetMetrics(generateCards(topic), progress).mastery;
}

export function nextUp(
  progress: Record<string, CardProgress>,
  log: StudySession[] = [],
  now: Date = new Date(),
  topics: TrainingTopic[] = LEARN_TOPICS,
): TrainingTopic {
  const ranked = nextUpTopics(progress, topics.length, now);
  const withDue = ranked.find((t) => t.dueCount > 0 && topics.includes(t.topic));
  if (withDue) return withDue.topic;

  // Least recently studied among the active topic list
  const lastByTopic = new Map<TrainingTopic, string>();
  for (const s of log) {
    if (!topics.includes(s.topic)) continue;
    const prev = lastByTopic.get(s.topic);
    if (!prev || s.startedAt > prev) lastByTopic.set(s.topic, s.startedAt);
  }
  let oldest: TrainingTopic = topics[0];
  let oldestAt = '9999';
  for (const topic of topics) {
    const at = lastByTopic.get(topic) ?? '';
    if (at < oldestAt) {
      oldestAt = at;
      oldest = topic;
    }
  }
  return oldest;
}

/** Longest consecutive-day streak within the season window. */
export function seasonBestStreak(
  log: StudySession[],
  seasonStart: string | null = null,
  now: Date = new Date(),
): number {
  const yearStart = `${now.getFullYear()}-01-01`;
  const from = seasonStart && seasonStart > yearStart ? seasonStart : yearStart;
  const todayKey = localDateKey(now);
  const days = [
    ...new Set(
      log
        .map((s) => localDateKey(new Date(s.startedAt)))
        .filter((d) => d >= from && d <= todayKey),
    ),
  ].sort();

  if (!days.length) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const cur = new Date(days[i]);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    if (diff === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

export function buildLearnModules(
  progress: Record<string, CardProgress>,
  topics: TrainingTopic[] = LEARN_TOPICS,
): LearnModule[] {
  return topics.map((topic) => {
    const meta = TOPIC_META[topic];
    const cards = generateCards(topic);
    const metrics = cardSetMetrics(cards, progress);
    return {
      topic,
      title: meta.title,
      description: meta.description,
      lessons: metrics.lessons,
      progress: topicProgressPercent(topic, progress),
      mastery: metrics.mastery,
      dueCount: metrics.dueCount,
      tone: meta.tone,
      icon: meta.icon,
    };
  });
}

const DEFAULT_BOOK_COLOR = '#f0a55d';

/** One module per book, then one per collection (shared playbook-{id} SRS). */
export function buildPlaybookModules(
  books: Playbook[],
  progress: Record<string, CardProgress>,
  now: Date = new Date(),
): PlaybookModule[] {
  // loadPlaybooks can briefly surface two rows with the same id (e.g. Packers
  // seed prepended while a legacy "default" book remains). Dedupe so React
  // keys and drill targets stay unique.
  const seenBookIds = new Set<string>();
  const uniqueBooks = books.filter((book) => {
    if (seenBookIds.has(book.id)) return false;
    seenBookIds.add(book.id);
    return true;
  });

  const modules: PlaybookModule[] = [];
  for (const book of uniqueBooks) {
    const bookCards = cardsFromPlaybook(playsForScope(book));
    const bookMetrics = cardSetMetrics(bookCards, progress, now);
    modules.push({
      kind: 'playbook',
      bookId: book.id,
      title: book.name,
      description:
        bookMetrics.playCount === 1
          ? '1 play'
          : `${bookMetrics.playCount} plays`,
      color: DEFAULT_BOOK_COLOR,
      ...bookMetrics,
    });
    for (const col of book.collections ?? []) {
      const plays = playsForScope(book, col.id);
      const cards = cardsFromPlaybook(plays);
      const metrics = cardSetMetrics(cards, progress, now);
      const fallbackDesc =
        metrics.playCount === 1 ? '1 play' : `${metrics.playCount} plays`;
      modules.push({
        kind: 'collection',
        bookId: book.id,
        collectionId: col.id,
        title: col.name,
        description: col.description?.trim() || fallbackDesc,
        color: col.color || DEFAULT_BOOK_COLOR,
        ...metrics,
      });
    }
  }
  return modules;
}

export function masteryRows(
  progress: Record<string, CardProgress>,
  topics: TrainingTopic[] = LEARN_TOPICS,
) {
  return topics.map((topic) => ({
    label: TOPIC_META[topic].title,
    value: masteryPercent(topic, progress),
  }));
}

export function weekGoalPercent(
  stats: UserStats,
  settings?: UserSettings,
  sessionDaysThisWeek?: number,
): number {
  const goal = settings?.weeklyGoal ?? stats.weekGoal ?? 4;
  if (!goal) return 0;
  const sessions = sessionDaysThisWeek ?? stats.weekSessions;
  return Math.min(100, Math.round((sessions / goal) * 100));
}

export function sessionsThisWeek(log: StudySession[], today: Date = new Date()): number {
  const weekStart = localDateKey(startOfWeek(today));
  const days = new Set(
    log.map((s) => localDateKey(new Date(s.startedAt))).filter((d) => d >= weekStart),
  );
  return days.size;
}

export function totalXp(log: StudySession[]): number {
  return log.reduce((sum, s) => sum + (s.xp ?? 0), 0);
}

export function accuracyInRange(
  log: StudySession[],
  sinceIso: string,
): { sessions: number; cards: number; correct: number; accuracy: number } {
  const rows = log.filter((s) => s.startedAt >= sinceIso);
  const cards = rows.reduce((n, s) => n + s.cardsReviewed, 0);
  const correct = rows.reduce((n, s) => n + s.correct, 0);
  return {
    sessions: rows.length,
    cards,
    correct,
    accuracy: cards ? Math.round((correct / cards) * 100) : 0,
  };
}

export function weakestCards(
  progress: Record<string, CardProgress>,
  limit = 5,
  books: Playbook[] = [],
): { cardId: string; topic: TrainingTopic; easiness: number; lastResult?: string }[] {
  const rows: {
    cardId: string;
    topic: TrainingTopic;
    easiness: number;
    lastResult?: string;
  }[] = [];
  const seen = new Set<string>();
  for (const topic of LEARN_TOPICS) {
    for (const card of generateCards(topic)) {
      const p = progress[card.id];
      if (!p) continue;
      seen.add(card.id);
      rows.push({
        cardId: card.id,
        topic,
        easiness: p.easiness,
        lastResult: p.lastResult,
      });
    }
  }
  for (const book of books) {
    for (const card of cardsFromPlaybook(playsForScope(book))) {
      if (seen.has(card.id)) continue;
      const p = progress[card.id];
      if (!p) continue;
      seen.add(card.id);
      rows.push({
        cardId: card.id,
        topic: 'play-calls',
        easiness: p.easiness,
        lastResult: p.lastResult,
      });
    }
  }
  rows.sort((a, b) => {
    const aAgain = a.lastResult === 'again' ? 1 : 0;
    const bAgain = b.lastResult === 'again' ? 1 : 0;
    if (aAgain !== bAgain) return bAgain - aAgain;
    return a.easiness - b.easiness;
  });
  return rows.slice(0, limit);
}

export { estimateMinutes, overallMasteryPercent, topicProgressPercent };
