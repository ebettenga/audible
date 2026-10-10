import { buildSession } from '@/src/training/session';
import { generateCards } from '@/src/training/cards';
import { resolveActiveBook, defaultSettings } from '@/src/training/storageSeed';
import type { FlashCard, Playbook } from '@/src/training/types';
import { buildPlaybookModules } from '@/src/features/learn/progress';

function fakeBook(id: string, name: string): Playbook {
  return {
    id,
    name,
    updatedAt: '2026-01-01T00:00:00.000Z',
    plays: [],
    collections: [
      {
        id: `col-${id}`,
        bookId: id,
        name: 'Install',
        color: '#c9f25b',
        playIds: [],
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  };
}

describe('buildSession', () => {
  const cards = generateCards('coverages');

  it('caps session size and shuffles with a seed', () => {
    const a = buildSession(cards, {}, { size: 8, seed: 'seed-a', now: new Date('2026-01-01') });
    const b = buildSession(cards, {}, { size: 8, seed: 'seed-a', now: new Date('2026-01-01') });
    const c = buildSession(cards, {}, { size: 8, seed: 'seed-b', now: new Date('2026-01-01') });
    expect(a).toHaveLength(8);
    expect(a.map((q) => q.card.id)).toEqual(b.map((q) => q.card.id));
    expect(a.map((q) => q.card.id)).not.toEqual(c.map((q) => q.card.id));
  });

  it('avoids back-to-back cards from the same group when possible', () => {
    const grouped: FlashCard[] = [];
    for (let g = 0; g < 5; g++) {
      for (let i = 0; i < 4; i++) {
        grouped.push({
          id: `g${g}-${i}`,
          topic: 'coverages',
          type: 'name-coverage',
          prompt: 'x',
          answer: `A${g}${i}`,
          distractors: ['B', 'C', 'D'],
          group: `group-${g}`,
        });
      }
    }
    const session = buildSession(grouped, {}, { size: 10, seed: 'interleave' });
    for (let i = 1; i < session.length; i++) {
      expect(session[i]!.card.group).not.toBe(session[i - 1]!.card.group);
    }
  });

  it('uses a card’s own wrong answers instead of other topics’ answers', () => {
    const cards: FlashCard[] = [
      {
        id: 'depth',
        topic: 'passing-routes',
        type: 'name-route',
        prompt: 'How deep is Y cross?',
        answer: '15 to 18 yards',
        distractors: ['3 to 5 yards', '8 to 10 yards', '25 to 30 yards'],
        group: 'y-cross',
      },
      {
        id: 'mesh',
        topic: 'passing-routes',
        type: 'name-route',
        prompt: 'Why is mesh a man beater?',
        answer: 'Two shallow crosses create traffic',
        distractors: ['Four verticals stretch Cover 3', 'Smash highs and lows Cover 2', 'Stick sits at 5 yards'],
        group: 'mesh',
      },
    ];
    const session = buildSession(cards, {}, { size: 2, seed: 'relevant-choices' });
    const depth = session.find((q) => q.card.id === 'depth');
    expect(depth?.choices.sort()).toEqual(
      ['15 to 18 yards', '25 to 30 yards', '3 to 5 yards', '8 to 10 yards'].sort(),
    );
    expect(depth?.choices.join(' ')).not.toMatch(/Mesh|Cover|Ace/i);
  });

  it('always finds a correctIndex', () => {
    const session = buildSession(cards, {}, { size: 10, seed: 'choices' });
    for (const q of session) {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.choices[q.correctIndex]?.toLowerCase()).toBe(q.card.answer.toLowerCase());
    }
  });
});

describe('topic-balanced sessions', () => {
  it('mixes running routes into multi-topic quizzes instead of only play calls', () => {
    const playCalls = generateCards('play-calls');
    const runs = generateCards('running-routes');
    const pool = [...playCalls, ...runs];
    const session = buildSession(pool, {}, {
      size: 12,
      seed: 'balance-runs',
      balanceTopics: true,
      now: new Date('2026-01-01'),
    });
    const topics = new Set(session.map((q) => q.card.topic));
    expect(topics.has('running-routes')).toBe(true);
    expect(topics.has('play-calls')).toBe(true);
    const runCount = session.filter((q) => q.card.topic === 'running-routes').length;
    expect(runCount).toBeGreaterThanOrEqual(3);
  });
});

describe('content depth', () => {
  it('has deeper banks for key topics', () => {
    expect(generateCards('formations').length).toBeGreaterThanOrEqual(18);
    expect(generateCards('play-calls').length).toBeGreaterThanOrEqual(20);
    expect(generateCards('defender-assignments').length).toBeGreaterThanOrEqual(40);
    expect(generateCards('coverage-reads').length).toBeGreaterThanOrEqual(30);
    expect(generateCards('zones').length).toBeGreaterThanOrEqual(16);
    expect(generateCards('fronts').length).toBeGreaterThanOrEqual(10);
    expect(generateCards('pressures').length).toBeGreaterThanOrEqual(8);
  });

  it('attaches explanations to most defense cards', () => {
    for (const topic of [
      'coverages',
      'coverage-reads',
      'zones',
      'fronts',
      'pressures',
      'defender-assignments',
    ] as const) {
      const cards = generateCards(topic);
      const withExplain = cards.filter((c) => !!c.explain).length;
      expect(withExplain).toBeGreaterThan(cards.length * 0.8);
    }
  });
});

describe('resolveActiveBook', () => {
  it('prefers saved activeBookId', () => {
    const books = [fakeBook('a', 'A'), fakeBook('b', 'B')];
    const settings = { ...defaultSettings(), activeBookId: 'b' };
    expect(resolveActiveBook(books, settings)?.id).toBe('b');
  });

  it('falls back to first book when saved id is missing', () => {
    const books = [fakeBook('a', 'A'), fakeBook('b', 'B')];
    const settings = { ...defaultSettings(), activeBookId: 'missing' };
    expect(resolveActiveBook(books, settings)?.id).toBe('a');
  });
});

describe('learn playbook modules scope', () => {
  it('only lists the selected book and its collections', () => {
    const books = [fakeBook('packers-2026', 'Packers'), fakeBook('madden', 'Madden')];
    const mods = buildPlaybookModules([books[0]!], {});
    expect(mods.every((m) => m.bookId === 'packers-2026')).toBe(true);
    expect(mods.some((m) => m.bookId === 'madden')).toBe(false);
  });
});
