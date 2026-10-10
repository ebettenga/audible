import type { CardProgress, TrainingTopic, UserStats } from '@/src/training/types';
import { generateCards } from '@/src/training/cards';
import { isDue } from '@/src/training/srs';

const CORE_TOPICS: TrainingTopic[] = [
  'personnel',
  'formations',
  'play-calls',
  'running-routes',
  'passing-routes',
  'coverages',
];

export type ReadinessResult = {
  score: number;
  coverage: number;
  retention: number;
  learned: number;
  total: number;
  dueToday: number;
  weekSessions: number;
  weekGoal: number;
  /** Topic with the most due cards (for "Review due") */
  reviewTopic: TrainingTopic;
};

function allCoreCards() {
  return CORE_TOPICS.flatMap((topic) => generateCards(topic));
}

export function computeReadiness(
  progress: Record<string, CardProgress>,
  stats: UserStats,
  now: Date = new Date(),
): ReadinessResult {
  const cards = allCoreCards();
  const total = cards.length;
  const seen = cards.filter((c) => (progress[c.id]?.repetitions ?? 0) > 0);
  const learned = seen.length;
  const coverage = total ? learned / total : 0;

  const retained = seen.filter((c) => !isDue(progress[c.id], now)).length;
  const retention = learned ? retained / learned : 0;

  const dueToday = cards.filter((c) => isDue(progress[c.id], now)).length;
  const score = Math.round(100 * (0.6 * coverage + 0.4 * retention));

  let reviewTopic: TrainingTopic = 'formations';
  let maxDue = -1;
  for (const topic of CORE_TOPICS) {
    const topicCards = generateCards(topic);
    const due = topicCards.filter((c) => isDue(progress[c.id], now)).length;
    if (due > maxDue) {
      maxDue = due;
      reviewTopic = topic;
    }
  }

  return {
    score,
    coverage,
    retention,
    learned,
    total,
    dueToday,
    weekSessions: stats.weekSessions,
    weekGoal: stats.weekGoal,
    reviewTopic,
  };
}
