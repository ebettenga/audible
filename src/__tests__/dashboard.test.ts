import { computeReadiness } from '@/src/features/dashboard/readiness';
import { estimateMinutes, nextUpTopics } from '@/src/features/dashboard/nextUp';
import { __resetMemoryStore, loadProfile, saveProfile } from '@/src/training/storageAsync';
import { defaultStats } from '@/src/training/storageSeed';
import type { CardProgress } from '@/src/training/types';
import { generateCards } from '@/src/training/cards';

describe('readiness', () => {
  it('scores zero on empty progress', () => {
    const result = computeReadiness({}, defaultStats());
    expect(result.score).toBe(0);
    expect(result.learned).toBe(0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.dueToday).toBe(result.total);
  });

  it('increases score when cards are learned and not due', () => {
    const cards = generateCards('formations');
    const progress: Record<string, CardProgress> = {};
    const future = new Date(Date.now() + 86_400_000).toISOString();
    for (const card of cards.slice(0, 5)) {
      progress[card.id] = {
        cardId: card.id,
        easiness: 2.5,
        intervalDays: 3,
        repetitions: 2,
        dueAt: future,
        lastResult: 'good',
      };
    }
    const result = computeReadiness(progress, { ...defaultStats(), weekSessions: 2, weekGoal: 4 });
    expect(result.learned).toBe(5);
    expect(result.score).toBeGreaterThan(0);
    expect(result.weekSessions).toBe(2);
  });
});

describe('nextUpTopics', () => {
  it('estimates minutes from card count', () => {
    expect(estimateMinutes(0)).toBe(0);
    expect(estimateMinutes(3)).toBe(1);
    expect(estimateMinutes(6)).toBe(2);
  });

  it('prefers topics with due cards', () => {
    const formationCards = generateCards('formations');
    const progress: Record<string, CardProgress> = {};
    // Mark personnel fully done and not due
    for (const card of generateCards('personnel')) {
      progress[card.id] = {
        cardId: card.id,
        easiness: 2.5,
        intervalDays: 10,
        repetitions: 3,
        dueAt: new Date(Date.now() + 86_400_000 * 10).toISOString(),
        lastResult: 'easy',
      };
    }
    // Leave formations unseen (all due)
    void formationCards;
    const next = nextUpTopics(progress, 2);
    expect(next.length).toBe(2);
    expect(next[0].dueCount).toBeGreaterThan(0);
  });
});

describe('profile storage', () => {
  beforeEach(() => {
    __resetMemoryStore();
  });

  it('round-trips name and role via settings', async () => {
    await saveProfile({ name: 'Coach Miller', role: 'OC' });
    const profile = await loadProfile();
    expect(profile.name).toBe('Coach Miller');
    expect(profile.role).toBe('OC');
  });
});
