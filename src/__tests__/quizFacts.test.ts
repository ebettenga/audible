import { FORMATIONS } from '@/src/data/formations';
import { QUIZ_FACTS, factsForTopic } from '@/src/data/quizFacts';
import { generateCards } from '@/src/training/cards';
import type { TrainingTopic } from '@/src/training/types';

const FACT_TOPICS: TrainingTopic[] = [
  'formations',
  'personnel',
  'passing-routes',
  'running-routes',
  'fronts',
  'coverages',
  'pressures',
];

describe('transcript-backed quiz facts', () => {
  it('covers every Fourth and Film Learn topic with unique, well-formed facts', () => {
    const ids = QUIZ_FACTS.map((fact) => fact.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(QUIZ_FACTS.length).toBeGreaterThanOrEqual(130);

    for (const topic of FACT_TOPICS) {
      const facts = factsForTopic(topic);
      expect(facts.length).toBeGreaterThanOrEqual(16);
      const answers = facts.map((fact) => fact.answer.toLowerCase());
      expect(new Set(answers).size).toBe(answers.length);
    }

    for (const fact of QUIZ_FACTS) {
      expect(fact.prompt.trim().length).toBeGreaterThan(10);
      expect(fact.answer.trim().length).toBeGreaterThan(0);
      expect(fact.explain.trim().length).toBeGreaterThan(20);
      expect(fact.distractors).toHaveLength(3);
      expect(fact.distractors).not.toContain(fact.answer);
      expect(new Set(fact.distractors.map((d) => d.toLowerCase())).size).toBe(3);
    }
  });

  it('does not ask the invalid default-right formation-strength questions', () => {
    const cards = generateCards('formations');
    expect(cards.some((card) => card.id.startsWith('formation-strength-'))).toBe(false);
    expect(cards.some((card) => /declared strength/i.test(card.prompt))).toBe(false);
    expect(cards.filter((card) => card.answer.toLowerCase() === 'right').length).toBe(0);
  });

  it('keeps a visual ID card for every formation and appends fact cards', () => {
    const cards = generateCards('formations');
    const facts = factsForTopic('formations');

    for (const formation of FORMATIONS) {
      const card = cards.find((candidate) => candidate.id === `formation-${formation.id}`);
      expect(card).toBeDefined();
      expect(card?.prompt).toBe('Name this formation');
      expect(card?.answer).toBe(formation.name);
      expect(card?.scene?.players).toHaveLength(11);
    }

    expect(cards.filter((card) => card.id.startsWith('fact-'))).toHaveLength(facts.length);
    expect(cards.length).toBe(FORMATIONS.length + facts.length);
  });

  it('covers the named concepts from each Fourth and Film transcript', () => {
    const groups = Object.fromEntries(
      FACT_TOPICS.map((topic) => [topic, new Set(factsForTopic(topic).map((fact) => fact.group))]),
    ) as Record<TrainingTopic, Set<string | undefined>>;

    expect([...groups.formations]).toEqual(
      expect.arrayContaining([
        't-formation',
        'i-formation',
        'ace',
        'pro-set',
        'shotgun',
        'pistol',
        'spread',
        'wildcat',
        'empty',
        'jumbo',
      ]),
    );
    expect([...groups.personnel]).toEqual(
      expect.arrayContaining(['code', 'box', '11', '12', '21', '13', '10', '22']),
    );
    expect([...groups['passing-routes']]).toEqual(
      expect.arrayContaining([
        'mesh',
        'levels',
        'flood',
        'smash',
        'y-cross',
        'four-verticals',
        'stick',
        'drive',
        'dagger',
        'slant-flat',
        'china',
        'shallow-cross',
      ]),
    );
    expect([...groups['running-routes']]).toEqual(
      expect.arrayContaining([
        'lead-dive',
        'iso',
        'split-zone',
        'power',
        'counter',
        'duo',
        'trap',
        'wham',
        'g-lead',
        't-lead',
        'dart',
        'speed-option',
        'jet-zone',
      ]),
    );
    expect([...groups.fronts]).toEqual(
      expect.arrayContaining(['6-2', '5-3', '52-eagle', '4-4', '3-4', '4-3', 'bear', 'nickel', 'dime']),
    );
    expect([...groups.coverages]).toEqual(
      expect.arrayContaining([
        'cover-0',
        'cover-1',
        'cover-1-robber',
        'cover-2',
        'cover-2-man',
        'cover-2-buzz',
        'tampa-2',
        'cover-3',
        'cover-3-cloud',
        'cover-3-buzz',
        'cover-4',
        'cover-6',
      ]),
    );
    expect([...groups.pressures]).toEqual(
      expect.arrayContaining([
        'simulated',
        'second-level',
        'protection',
        'perimeter',
        'fire-zone',
        'stunt',
        'zero',
      ]),
    );
  });

  it('merges fact cards into each transcript topic bank', () => {
    for (const topic of FACT_TOPICS) {
      const facts = factsForTopic(topic);
      const cards = generateCards(topic);
      const factIds = facts.map((fact) => `fact-${fact.id}`);
      expect(cards.map((card) => card.id)).toEqual(expect.arrayContaining(factIds));
      for (const fact of facts) {
        const card = cards.find((candidate) => candidate.id === `fact-${fact.id}`);
        expect(card?.prompt).toBe(fact.prompt);
        expect(card?.answer).toBe(fact.answer);
        expect(card?.explain).toBe(fact.explain);
      }
    }
  });
});
