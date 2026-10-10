import {
  weekDays,
  dueCount,
  masteryPercent,
  nextUp,
  seasonBestStreak,
  sessionsThisWeek,
  buildLearnModules,
  buildPlaybookModules,
  cardSetMetrics,
  localDateKey,
} from '@/src/features/learn/progress';
import { buildQuiz, quizXp } from '@/src/training/quiz';
import type { CardProgress, Playbook, StudySession } from '@/src/training/types';
import { cardsFromPlaybook, generateCards, playsForScope } from '@/src/training/cards';
import { startOfWeek } from '@/src/training/storageSeed';

function fakeBook(): Playbook {
  const now = new Date().toISOString();
  return {
    id: 'book-1',
    name: 'Test Packers',
    updatedAt: now,
    plays: [
      {
        id: 'play-a',
        name: 'Mesh',
        playcall: 'Ace Twins Right Y Mesh',
        createdAt: now,
      },
      {
        id: 'play-b',
        name: 'Stick',
        playcall: 'Ace Twins Right Y Stick',
        createdAt: now,
      },
      {
        id: 'play-c',
        name: 'Power',
        playcall: 'Ace Twins Right Power',
        createdAt: now,
      },
    ],
    collections: [
      {
        id: 'col-red',
        bookId: 'book-1',
        name: 'Red Zone',
        color: '#e05050',
        playIds: ['play-a', 'play-b'],
        isActive: true,
        createdAt: now,
      },
      {
        id: 'col-empty',
        bookId: 'book-1',
        name: 'Empty Set',
        color: '#888',
        playIds: [],
        isActive: false,
        createdAt: now,
      },
      {
        id: 'col-third',
        bookId: 'book-1',
        name: 'Third Down',
        color: '#50a0e0',
        playIds: ['play-a'],
        isActive: false,
        description: 'Money downs',
        createdAt: now,
      },
    ],
  };
}

function session(
  partial: Partial<StudySession> & { startedAt: string; topic: StudySession['topic'] },
): StudySession {
  return {
    id: partial.id ?? `s-${partial.startedAt}`,
    cardsReviewed: partial.cardsReviewed ?? 5,
    correct: partial.correct ?? 3,
    durationSec: partial.durationSec ?? 60,
    xp: partial.xp ?? 90,
    source: partial.source ?? 'quiz',
    ...partial,
  };
}

function atLocalNoon(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(12, 0, 0, 0);
  return copy;
}

describe('learn progress selectors', () => {
  it('marks real study days in the week strip', () => {
    const monday = atLocalNoon(startOfWeek(new Date()));
    const wed = new Date(monday);
    wed.setDate(monday.getDate() + 2);
    const log = [session({ startedAt: wed.toISOString(), topic: 'formations' })];
    const days = weekDays(log, wed);
    expect(days).toHaveLength(7);
    expect(days[2].date).toBe(localDateKey(wed));
    expect(days[2].status).toBe('done');
    expect(days.filter((d) => d.status === 'done')).toHaveLength(1);
  });

  it('computes mastery from repetitions / interval', () => {
    const cards = generateCards('formations');
    const progress: Record<string, CardProgress> = {};
    for (const card of cards.slice(0, 4)) {
      progress[card.id] = {
        cardId: card.id,
        easiness: 2.5,
        intervalDays: 3,
        repetitions: 2,
        dueAt: new Date(Date.now() + 86_400_000).toISOString(),
        lastResult: 'good',
      };
    }
    const pct = masteryPercent('formations', progress);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBe(Math.round((4 / cards.length) * 100));
  });

  it('counts due cards', () => {
    expect(dueCount('formations', {})).toBe(generateCards('formations').length);
  });

  it('picks nextUp topic with due cards', () => {
    const topic = nextUp({});
    expect(typeof topic).toBe('string');
  });

  it('computes season best streak from consecutive days', () => {
    const year = new Date().getFullYear();
    const d1 = new Date(year, 2, 1, 12, 0, 0);
    const d2 = new Date(year, 2, 2, 12, 0, 0);
    const d3 = new Date(year, 2, 3, 12, 0, 0);
    const d5 = new Date(year, 2, 5, 12, 0, 0);
    const log = [
      session({ startedAt: d1.toISOString(), topic: 'formations' }),
      session({ startedAt: d2.toISOString(), topic: 'formations' }),
      session({ startedAt: d3.toISOString(), topic: 'personnel' }),
      session({ startedAt: d5.toISOString(), topic: 'coverages' }),
    ];
    expect(seasonBestStreak(log, null, new Date(year, 2, 10, 12, 0, 0))).toBe(3);
  });

  it('counts distinct session days this week', () => {
    const monday = atLocalNoon(startOfWeek(new Date()));
    const log = [
      session({ startedAt: monday.toISOString(), topic: 'formations' }),
      session({
        startedAt: new Date(monday.getTime() + 3600_000).toISOString(),
        topic: 'personnel',
      }),
    ];
    expect(sessionsThisWeek(log, monday)).toBe(1);
  });

  it('builds modules with lesson chunks and due counts', () => {
    const modules = buildLearnModules({});
    expect(modules.length).toBe(11);
    expect(modules[0].lessons).toBeGreaterThanOrEqual(1);
    expect(modules[0].dueCount).toBeGreaterThan(0);
  });
});

describe('playbook / collection modules', () => {
  it('scopes plays by collection and skips missing ids', () => {
    const book = fakeBook();
    expect(playsForScope(book).map((p) => p.id)).toEqual(['play-a', 'play-b', 'play-c']);
    expect(playsForScope(book, 'col-red').map((p) => p.id)).toEqual(['play-a', 'play-b']);
    expect(playsForScope(book, 'col-empty')).toEqual([]);
    book.collections[0].playIds = ['play-a', 'missing', 'play-b'];
    expect(playsForScope(book, 'col-red').map((p) => p.id)).toEqual(['play-a', 'play-b']);
  });

  it('shares SRS progress across overlapping collections and the book', () => {
    const book = fakeBook();
    const meshId = cardsFromPlaybook(playsForScope(book, 'col-third'))[0].id;
    expect(meshId).toBe('playbook-play-a');
    const progress: Record<string, CardProgress> = {
      [meshId]: {
        cardId: meshId,
        easiness: 2.5,
        intervalDays: 3,
        repetitions: 2,
        dueAt: new Date(Date.now() + 86_400_000).toISOString(),
        lastResult: 'good',
      },
    };
    const modules = buildPlaybookModules([book], progress);
    const bookMod = modules.find((m) => m.kind === 'playbook')!;
    const red = modules.find((m) => m.collectionId === 'col-red')!;
    const third = modules.find((m) => m.collectionId === 'col-third')!;
    expect(bookMod.mastery).toBe(Math.round((1 / 3) * 100));
    expect(red.mastery).toBe(Math.round((1 / 2) * 100));
    expect(third.mastery).toBe(100);
    expect(third.description).toBe('Money downs');
  });

  it('counts due only within the collection and zeros empty sets', () => {
    const book = fakeBook();
    const modules = buildPlaybookModules([book], {});
    const red = modules.find((m) => m.collectionId === 'col-red')!;
    const empty = modules.find((m) => m.collectionId === 'col-empty')!;
    const bookMod = modules.find((m) => m.kind === 'playbook')!;
    expect(bookMod.dueCount).toBe(3);
    expect(red.dueCount).toBe(2);
    expect(empty.dueCount).toBe(0);
    expect(empty.mastery).toBe(0);
    expect(empty.lessons).toBe(0);
    expect(empty.playCount).toBe(0);
  });

  it('dedupes books that share the same id', () => {
    const book = fakeBook();
    const modules = buildPlaybookModules([book, { ...book, name: 'Duplicate' }], {});
    expect(modules.filter((m) => m.kind === 'playbook')).toHaveLength(1);
    expect(modules.filter((m) => m.kind === 'playbook')[0].title).toBe('Test Packers');
  });

  it('cardSetMetrics matches topic helpers for the same cards', () => {
    const cards = generateCards('formations');
    const metrics = cardSetMetrics(cards, {});
    expect(metrics.dueCount).toBe(dueCount('formations', {}));
    expect(metrics.mastery).toBe(masteryPercent('formations', {}));
  });
});

describe('quiz builder', () => {
  it('builds n questions with choices', () => {
    const quiz = buildQuiz(['formations'], 4, {}, { seed: 'test-seed' });
    expect(quiz.length).toBeLessThanOrEqual(4);
    expect(quiz.length).toBeGreaterThan(0);
    for (const q of quiz) {
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
      expect(q.choices[q.correctIndex].toLowerCase()).toBe(q.card.answer.toLowerCase());
    }
  });

  it('is deterministic for the same seed', () => {
    const a = buildQuiz(['formations'], 5, {}, { seed: 'daily-2026-10-10' });
    const b = buildQuiz(['formations'], 5, {}, { seed: 'daily-2026-10-10' });
    expect(a.map((q) => q.card.id)).toEqual(b.map((q) => q.card.id));
  });

  it('computes xp', () => {
    expect(quizXp(3)).toBe(90);
    expect(quizXp(3, 10)).toBe(100);
  });
});
