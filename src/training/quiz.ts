import type { CardProgress, FlashCard, Playbook, TrainingTopic } from './types';
import { cardsForLearn, generateCards } from './cards';
import { buildSession, type BuildSessionOpts, type QuizQuestion } from './session';

export type { QuizQuestion };

const DEFAULT_TOPICS: TrainingTopic[] = [
  'personnel',
  'formations',
  'play-calls',
  'running-routes',
  'passing-routes',
  'coverages',
];

/**
 * Build an n-question quiz from topics, preferring due / weak cards.
 * Pass `book` to drive play-calls / formations from the active install.
 */
export function buildQuiz(
  topics: TrainingTopic[] = DEFAULT_TOPICS,
  n = 10,
  progress: Record<string, CardProgress> = {},
  opts?: BuildSessionOpts & { book?: Playbook | null; cards?: FlashCard[] },
): QuizQuestion[] {
  const pool =
    opts?.cards ??
    topics.flatMap((t) =>
      opts?.book ? cardsForLearn(opts.book, t) : generateCards(t),
    );

  const balanceTopics = topics.length > 1 || (opts?.cards && new Set(pool.map((c) => c.topic)).size > 1);

  return buildSession(pool, progress, {
    size: n,
    seed: opts?.seed,
    now: opts?.now,
    balanceTopics,
  });
}

export function quizXp(correct: number, streakBonus = 0): number {
  return correct * 30 + streakBonus;
}
