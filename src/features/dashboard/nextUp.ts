import type { CardProgress, TrainingTopic } from '@/src/training/types';
import { TOPIC_META } from '@/src/training/types';
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

/** ~20 seconds per card, rounded up to whole minutes (min 1 when any due). */
export function estimateMinutes(cardCount: number): number {
  if (cardCount <= 0) return 0;
  return Math.max(1, Math.round((cardCount * 20) / 60));
}

export type NextUpTopic = {
  topic: TrainingTopic;
  title: string;
  description: string;
  icon: (typeof TOPIC_META)[TrainingTopic]['icon'];
  tone: (typeof TOPIC_META)[TrainingTopic]['tone'];
  dueCount: number;
  seenCount: number;
  totalCount: number;
  minutes: number;
  progress: number;
};

type Ranked = NextUpTopic & { overdueMs: number; started: boolean };

/**
 * Priority: topics with due cards first (most overdue), then in-progress,
 * then least-started.
 */
export function nextUpTopics(
  progress: Record<string, CardProgress>,
  n = 2,
  now: Date = new Date(),
): NextUpTopic[] {
  const ranked: Ranked[] = CORE_TOPICS.map((topic) => {
    const cards = generateCards(topic);
    const meta = TOPIC_META[topic];
    let dueCount = 0;
    let seenCount = 0;
    let overdueMs = 0;
    for (const card of cards) {
      const entry = progress[card.id];
      if ((entry?.repetitions ?? 0) > 0) seenCount += 1;
      if (isDue(entry, now)) {
        dueCount += 1;
        if (entry) {
          overdueMs += Math.max(0, now.getTime() - new Date(entry.dueAt).getTime());
        } else {
          overdueMs += Number.MAX_SAFE_INTEGER / cards.length;
        }
      }
    }
    const totalCount = cards.length;
    return {
      topic,
      title: meta.title,
      description: meta.description,
      icon: meta.icon,
      tone: meta.tone,
      dueCount,
      seenCount,
      totalCount,
      minutes: estimateMinutes(dueCount || Math.max(0, totalCount - seenCount)),
      progress: totalCount ? Math.round((seenCount / totalCount) * 100) : 0,
      overdueMs,
      started: seenCount > 0 && seenCount < totalCount,
    };
  });

  ranked.sort((a, b) => {
    const aDue = a.dueCount > 0 ? 1 : 0;
    const bDue = b.dueCount > 0 ? 1 : 0;
    if (aDue !== bDue) return bDue - aDue;
    if (a.dueCount > 0 && b.dueCount > 0) {
      if (b.overdueMs !== a.overdueMs) return b.overdueMs - a.overdueMs;
      return b.dueCount - a.dueCount;
    }
    const aIn = a.started ? 1 : 0;
    const bIn = b.started ? 1 : 0;
    if (aIn !== bIn) return bIn - aIn;
    return a.seenCount - b.seenCount;
  });

  return ranked.slice(0, n).map(({ overdueMs: _o, started: _s, ...rest }) => rest);
}
