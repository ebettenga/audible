import type { CardProgress } from './types';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

const GRADE_QUALITY: Record<Grade, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

/** SM-2–lite spaced repetition update. Pure function. */
export function reviewCard(
  progress: CardProgress | undefined,
  cardId: string,
  grade: Grade,
  now: Date = new Date(),
): CardProgress {
  const prev: CardProgress = progress ?? {
    cardId,
    easiness: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: now.toISOString(),
  };

  const q = GRADE_QUALITY[grade];
  let { easiness, intervalDays, repetitions } = prev;

  easiness = Math.max(1.3, easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (q < 3) {
    repetitions = 0;
    intervalDays = 0;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 3;
    else intervalDays = Math.round(intervalDays * easiness);
    repetitions += 1;
  }

  const due = new Date(now);
  due.setDate(due.getDate() + Math.max(intervalDays, grade === 'again' ? 0 : 1));
  if (grade === 'again') {
    // due immediately / same session
    due.setTime(now.getTime());
  }

  return {
    cardId,
    easiness,
    intervalDays,
    repetitions,
    dueAt: due.toISOString(),
    lastResult: grade,
  };
}

export function isDue(progress: CardProgress | undefined, now: Date = new Date()): boolean {
  if (!progress) return true;
  return new Date(progress.dueAt).getTime() <= now.getTime();
}

export function sortByDue(
  cardIds: string[],
  progressMap: Record<string, CardProgress>,
): string[] {
  return [...cardIds].sort((a, b) => {
    const pa = progressMap[a];
    const pb = progressMap[b];
    const ta = pa ? new Date(pa.dueAt).getTime() : 0;
    const tb = pb ? new Date(pb.dueAt).getTime() : 0;
    return ta - tb;
  });
}
