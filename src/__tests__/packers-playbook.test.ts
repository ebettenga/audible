import { buildPlay, parsePlaycall } from '@/src/core/parser';
import { mergeLexicon } from '@/src/data/lexicon';
import {
  buildPackersPlaybook,
  PACKERS_PLAYS,
  BEARS_WEEK5_IDS,
} from '@/src/data/packersPlaybook';
import {
  activeCollection,
  cardsForLearn,
  playsForLearn,
} from '@/src/training/cards';
import {
  defaultPlaybook,
  defaultPlaybooks,
  ensurePackersPlaybook,
  ensureSeededPlaybooks,
  isBearsSeedBook,
  isPackersSeedBook,
  isUntouchedLegacyDefault,
} from '@/src/training/storageSeed';
import type { Playbook } from '@/src/training/types';

describe('Packers 2026 west-coast seed', () => {
  const westCoast = mergeLexicon(['west-coast']);

  it.each(PACKERS_PLAYS.map((p) => [p.id, p.name, p.playcall] as const))(
    'parses and builds %s (%s)',
    (_id, name, playcall) => {
      const ast = parsePlaycall(playcall, { lexicon: westCoast, softUnknown: false });
      expect(ast.formationId).toBeTruthy();
      expect(name).toBeTruthy();
      expect(name).not.toBe(playcall); // display name free / teaching label
      const scene = buildPlay(playcall, { includeDefense: false });
      expect(scene.players.some((p) => p.side === 'off')).toBe(true);
    },
  );

  it('seeds Packers book with west-coast and Bears Week 5 active', () => {
    const book = buildPackersPlaybook('2026-10-10T12:00:00.000Z');
    expect(book.name).toBe('Packers 2026 West Coast');
    expect(book.systemIds).toEqual(['west-coast']);
    expect(book.plays.length).toBeGreaterThanOrEqual(30);
    const active = book.collections.filter((c) => c.isActive);
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('Bears Week 5');
    expect(active[0].playIds).toEqual(expect.arrayContaining([...BEARS_WEEK5_IDS]));
    expect(activeCollection(book)?.name).toBe('Bears Week 5');
  });

  it('defaultPlaybook matches Packers seed', () => {
    const book = defaultPlaybook();
    expect(book.name).toContain('Packers');
    expect(book.systemIds).toEqual(['west-coast']);
    expect(book.plays.some((p) => p.side === 'def')).toBe(true);
  });

  it('defaultPlaybooks includes Packers and Bears', () => {
    const books = defaultPlaybooks();
    expect(books).toHaveLength(2);
    expect(isPackersSeedBook(books[0])).toBe(true);
    expect(isBearsSeedBook(books[1])).toBe(true);
  });

  it('ensureSeededPlaybooks adds Bears beside Packers', () => {
    const next = ensureSeededPlaybooks([buildPackersPlaybook()]);
    expect(next.some(isPackersSeedBook)).toBe(true);
    expect(next.some(isBearsSeedBook)).toBe(true);
  });

  it('Learn play-call cards use Bears Week 5 display names', () => {
    const book = buildPackersPlaybook();
    const install = playsForLearn(book);
    expect(install.length).toBe(BEARS_WEEK5_IDS.length);
    expect(install.every((p) => BEARS_WEEK5_IDS.includes(p.id))).toBe(true);

    const cards = cardsForLearn(book, 'play-calls');
    expect(cards.length).toBe(install.length);
    const answers = cards.map((c) => c.answer);
    for (const p of install) {
      expect(answers).toContain(p.name);
    }
    // Answers are teaching names, not raw playcalls
    expect(answers).not.toContain(install[0].playcall);
  });

  it('does not treat Packers seed as legacy Coryell', () => {
    expect(isUntouchedLegacyDefault(buildPackersPlaybook())).toBe(false);
  });

  it('ensurePackersPlaybook inserts Packers when missing', () => {
    const coryell: Playbook = {
      id: 'default',
      name: 'My starter',
      updatedAt: '2026-01-01T00:00:00.000Z',
      plays: ['p0', 'p1', 'p2', 'p3', 'p4', 'p5'].map((id) => ({
        id,
        name: id,
        playcall: 'Ace Twins Right 62 Slant-Flat',
        favorite: false,
        reviewCount: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })),
      collections: [],
    };
    expect(isUntouchedLegacyDefault(coryell)).toBe(true);
    const next = ensurePackersPlaybook([coryell]);
    expect(next).toHaveLength(1);
    expect(isPackersSeedBook(next[0])).toBe(true);
    expect(next[0].name).toContain('Packers');
  });

  it('ensurePackersPlaybook prepends Packers beside user books', () => {
    const custom: Playbook = {
      id: 'book-mine',
      name: 'HS Offense',
      updatedAt: '2026-01-01T00:00:00.000Z',
      plays: [
        {
          id: 'hs-1',
          name: 'Our Mesh',
          playcall: 'Gun Bunch Right Mesh',
          favorite: false,
          reviewCount: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      collections: [],
    };
    const next = ensurePackersPlaybook([custom]);
    expect(next).toHaveLength(2);
    expect(isPackersSeedBook(next[0])).toBe(true);
    expect(next[1].id).toBe('book-mine');
  });

  it('ensurePackersPlaybook remints colliding default ids', () => {
    const packers = buildPackersPlaybook();
    // Simulate pre-v4 Packers still on legacy id
    const legacyPackers = { ...packers, id: 'default' };
    const userOnDefault: Playbook = {
      id: 'default',
      name: 'My installs',
      updatedAt: '2026-01-01T00:00:00.000Z',
      plays: [
        {
          id: 'mine-1',
          name: 'Our Mesh',
          playcall: 'Gun Bunch Right Mesh',
          favorite: false,
          reviewCount: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      collections: [],
    };
    const next = ensurePackersPlaybook([legacyPackers, userOnDefault]);
    const ids = next.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(next[0].id).toBe('packers-2026');
    expect(isPackersSeedBook(next[0])).toBe(true);
    expect(next.some((b) => b.name === 'My installs' && b.id !== 'default')).toBe(true);
  });
});

describe('multi-system Mesh naming', () => {
  it('resolves Mesh from west-coast, air-raid, and custom Zebra', () => {
    const wc = parsePlaycall('Gun Bunch Right Mesh', {
      systemIds: ['west-coast'],
      softUnknown: false,
    });
    expect(wc.conceptId).toBe('mesh');

    const ar = parsePlaycall('Gun Bunch Right Mesh', {
      systemIds: ['air-raid'],
      softUnknown: false,
    });
    expect(ar.conceptId).toBe('mesh');

    const custom = parsePlaycall('Gun Bunch Right Zebra', {
      systemIds: ['west-coast'],
      customLexicon: [
        {
          kind: 'concept',
          canonicalId: 'mesh',
          label: 'Zebra',
          aliases: ['Zebra'],
          systemId: 'custom',
        },
      ],
      softUnknown: false,
    });
    expect(custom.conceptId).toBe('mesh');
  });

  it('soft-unknown keeps a resolved formation when token is unknown', () => {
    const ast = parsePlaycall('Gun Doubles Right Wide Zone Zebra', {
      systemIds: ['west-coast'],
      softUnknown: true,
    });
    expect(ast.formationId).toBe('gun-doubles');
    expect(ast.run?.runId).toBe('wide-zone');
    expect(ast.unknownTokens?.length).toBeGreaterThan(0);
  });
});

describe('Air Coryell golden still parses', () => {
  it('I Right 999 Y-Pop', () => {
    const ast = parsePlaycall('I Right 999 Y-Pop', {
      systemIds: ['air-coryell'],
      softUnknown: false,
    });
    expect(ast.formationId).toBe('i');
    expect(ast.routeDigits).toBe('999');
    const scene = buildPlay('I Right 999 Y-Pop', { includeDefense: true });
    expect(scene.title).toBe('I Right 999 Y-Pop');
  });
});
