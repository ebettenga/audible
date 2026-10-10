import { FORMATIONS } from '@/src/data/formations';
import { QUIZ_FACTS, factsForTopic } from '@/src/data/quizFacts';
import { generateCards, getCardScene } from '@/src/training/cards';
import { buildQuiz } from '@/src/training/quiz';
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

  it('shows a relevant play for every fact, not a leftover Wide Zone', () => {
    const hints: Partial<Record<TrainingTopic, Record<string, string>>> = {
      formations: {
        't-formation': 'Wishbone',
        'i-formation': 'I Right',
        ace: 'Ace Twins',
        'pro-set': 'Strong I',
        shotgun: 'Shotgun',
        pistol: 'Pistol',
        spread: 'Gun Trips',
        wildcat: 'Shotgun',
        empty: 'Gun Empty',
        jumbo: 'I Tight',
        purpose: 'Ace Twins',
      },
      personnel: {
        '11': 'Gun Doubles',
        '12': 'Gun Trey',
        '21': 'I Right',
        '13': 'I Tight',
        '10': 'Doubles Flex',
        '22': 'I Tight',
        code: 'Gun Doubles',
        box: 'Gun Doubles',
        labels: 'Gun Doubles',
      },
      'passing-routes': {
        mesh: 'Mesh',
        levels: 'Levels',
        flood: 'Flood',
        smash: 'Smash',
        'y-cross': 'Y Cross',
        'four-verticals': 'Four Verticals',
        stick: 'Stick',
        drive: 'Drive',
        dagger: 'Dagger',
        'slant-flat': 'Slant-Flat',
        china: 'Smash',
        'shallow-cross': 'High Cross',
      },
      'running-routes': {
        scheme: 'Inside Zone',
        gap: '24 Lead',
        gaps: '24 Lead',
        holes: '24 Lead',
        techniques: 'Inside Zone',
        'inside-zone': 'Inside Zone',
        'lead-dive': '22 Dive',
        iso: 'Iso',
        'man-dive': '22 Dive',
        'split-zone': 'Split Zone',
        'zone-read': 'Inside Zone',
        'outside-zone': 'Wide Zone',
        'jet-zone': 'Jet Sweep',
        power: '26 Lead',
        counter: 'Counter',
        duo: 'Duo',
        trap: 'Trap',
        wham: 'Trap',
        'g-lead': '26 Lead',
        't-lead': '26 Lead',
        dart: 'Counter',
        'speed-option': 'Speed Option',
      },
      fronts: {
        '6-2': 'Bear',
        '5-3': 'Bear',
        '52-eagle': '4-3',
        '4-4': '3-3 Stack',
        '3-4': '3-4',
        '4-3': '4-3',
        bear: 'Bear',
        nickel: 'Nickel',
        dime: 'Dime',
      },
      coverages: {
        'cover-0': 'Cover 0',
        'cover-1': 'Cover 1',
        'cover-1-robber': 'Cover 1 Robber',
        'cover-2': 'Cover 2',
        'cover-2-man': '2-Man',
        'cover-2-buzz': 'Cover 2',
        'tampa-2': 'Tampa 2',
        'cover-3': 'Cover 3',
        'cover-3-cloud': 'Cover 3 Sky',
        'cover-3-buzz': 'Cover 3 Buzz',
        'cover-4': 'Cover 4',
        'cover-6': 'Cover 6',
      },
      pressures: {
        simulated: 'Creeper',
        blitz: 'A-Gap Mug',
        'second-level': 'Cross Dog',
        labels: 'Cover 3',
        protection: 'A-Gap Mug',
        perimeter: 'Corner Blitz',
        'fire-zone': 'Fire Zone',
        stunt: 'Twin Twist',
        zero: 'Zero',
      },
    };

    for (const topic of FACT_TOPICS) {
      const cards = generateCards(topic).filter((card) => card.id.startsWith('fact-'));
      expect(cards.length).toBeGreaterThan(0);
      for (const card of cards) {
        const scene = getCardScene(card);
        expect(card.playcall).toBeTruthy();
        expect(card.scene).toBeDefined();
        expect(scene.players.length).toBeGreaterThanOrEqual(11);
        const label = `${card.playcall ?? ''} ${scene.title ?? ''}`;
        if (card.group !== 'outside-zone') {
          expect(label).not.toMatch(/Wide Zone/);
        }
        const hint = hints[topic]?.[card.group ?? ''];
        if (hint) {
          expect(card.playcall).toContain(hint);
        }
      }
    }
  });

  it('keeps every quiz choice answering the same question', () => {
    for (const topic of FACT_TOPICS) {
      const cards = generateCards(topic);
      const quiz = buildQuiz([topic], Math.min(12, cards.length), {}, {
        seed: `choices-${topic}`,
        cards,
      });
      for (const question of quiz) {
        if (!question.card.id.startsWith('fact-')) {
          const allowed = new Set(
            [
              question.card.answer,
              ...(cards.find((card) => card.id === question.card.id)?.distractors ?? []),
              ...(cards.find((card) => card.id === question.card.id)?.distractorPool ?? []),
            ].map((choice) => choice.toLowerCase()),
          );
          for (const choice of question.choices) {
            expect(allowed.has(choice.toLowerCase())).toBe(true);
          }
          continue;
        }
        const fact = QUIZ_FACTS.find((item) => `fact-${item.id}` === question.card.id);
        expect(fact).toBeDefined();
        const allowed = new Set(
          [fact!.answer, ...fact!.distractors].map((choice) => choice.toLowerCase()),
        );
        for (const choice of question.choices) {
          expect(allowed.has(choice.toLowerCase())).toBe(true);
        }
      }
    }
  });

  it('does not author joke answers that ignore the question', () => {
    const jokes = /punter|coin toss|victory formation|victory kneel|opening kickoff|fake punt|punt on first|punt protection|punt return|punt rush|fake field goal|onside kick/i;
    for (const fact of QUIZ_FACTS) {
      for (const choice of fact.distractors) {
        expect(choice).not.toMatch(jokes);
      }
    }
  });

  it('does not reuse Wide Zone art on unrelated run or pass questions', () => {
    for (const topic of ['running-routes', 'passing-routes', 'formations', 'personnel'] as const) {
      for (const card of generateCards(topic)) {
        if (/wide zone/i.test(card.answer) || card.group === 'outside-zone' || /wide zone/i.test(card.prompt)) {
          continue;
        }
        const scene = getCardScene(card);
        expect(`${card.playcall ?? ''} ${scene.title ?? ''}`).not.toMatch(/Wide Zone/);
      }
    }
  });
});
