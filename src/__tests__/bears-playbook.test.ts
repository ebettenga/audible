import { buildPlay, parsePlaycall } from '@/src/core/parser';
import { mergeLexicon } from '@/src/data/lexicon';
import {
  BEARS_PLAYS,
  BEARS_BOOK_ID,
  buildBearsPlaybook,
  isBearsSeedBook,
} from '@/src/data/bearsPlaybook';
import {
  ensureBearsPlaybook,
  ensureSeededPlaybooks,
  isPackersSeedBook,
  mergeMissingPackersSeed,
} from '@/src/training/storageSeed';
import { buildPackersPlaybook, PACKERS_SEED_VERSION } from '@/src/data/packersPlaybook';
import type { Playbook } from '@/src/training/types';

describe('Bears 2026 playbook seed', () => {
  const systems = mergeLexicon(['west-coast', 'air-coryell']);

  it.each(BEARS_PLAYS.map((p) => [p.id, p.name, p.playcall] as const))(
    'parses and builds %s (%s)',
    (_id, name, playcall) => {
      const ast = parsePlaycall(playcall, {
        lexicon: systems,
        softUnknown: false,
      });
      expect(ast.formationId).toBeTruthy();
      expect(name).toBeTruthy();
      expect(name).not.toBe(playcall);
      const scene = buildPlay(playcall, { includeDefense: false });
      expect(scene.players.some((p) => p.side === 'off')).toBe(true);
    },
  );

  it('builds Bears book with core install active', () => {
    const book = buildBearsPlaybook('2026-10-10T12:00:00.000Z');
    expect(book.id).toBe(BEARS_BOOK_ID);
    expect(book.name).toBe('Bears 2026');
    expect(book.systemIds).toEqual(['west-coast', 'air-coryell']);
    expect(book.plays.length).toBeGreaterThanOrEqual(18);
    expect(book.plays.every((p) => p.id.startsWith('chi-'))).toBe(true);
    const active = book.collections.filter((c) => c.isActive);
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('Core Install');
    expect(isBearsSeedBook(book)).toBe(true);
    expect(isPackersSeedBook(book)).toBe(false);
  });

  it('lexicon resolves Johnson teaching aliases', () => {
    expect(systems.concepts.get('cross')).toBe('high-cross');
    expect(systems.concepts.get('latch')).toBe('high-cross');
    expect(systems.concepts.get('branch')).toBe('drive');
    expect(systems.concepts.get('outside dig')).toBe('dagger');
    expect(systems.runs.get('counter')).toBe('counter');
  });
});

describe('seed v5 merge / ensure', () => {
  it('ensureBearsPlaybook appends Bears beside Packers', () => {
    const packers = buildPackersPlaybook();
    const next = ensureBearsPlaybook([packers]);
    expect(next).toHaveLength(2);
    expect(isPackersSeedBook(next[0])).toBe(true);
    expect(isBearsSeedBook(next[1])).toBe(true);
  });

  it('mergeMissingPackersSeed adds defense without wiping user edits', () => {
    const full = buildPackersPlaybook();
    // Simulate pre-v5 Packers: offense only, no defense collections
    const old: Playbook = {
      ...full,
      plays: full.plays
        .filter((p) => p.side !== 'def' && !p.id.startsWith('gb-d-'))
        .filter(
          (p) =>
            ![
              'gb-counter-strong',
              'gb-pistol-counter',
              'gb-uc-boot',
              'gb-i-boot',
              'gb-pistol-wz',
            ].includes(p.id),
        )
        .map((p) =>
          p.id === 'gb-spacing'
            ? { ...p, favorite: true, notes: 'USER NOTE KEEP ME', reviewCount: 7 }
            : p,
        ),
      collections: full.collections.filter(
        (c) => c.id !== 'col-packers-d' && c.id !== 'col-bears-w5-d',
      ),
    };
    expect(old.plays.some((p) => p.side === 'def')).toBe(false);

    const merged = mergeMissingPackersSeed(old);
    expect(merged.plays.some((p) => p.side === 'def')).toBe(true);
    expect(merged.collections.some((c) => c.id === 'col-packers-d')).toBe(true);
    const spacing = merged.plays.find((p) => p.id === 'gb-spacing')!;
    expect(spacing.favorite).toBe(true);
    expect(spacing.notes).toBe('USER NOTE KEEP ME');
    expect(spacing.reviewCount).toBe(7);
  });

  it('ensureSeededPlaybooks yields Packers then Bears', () => {
    const next = ensureSeededPlaybooks([]);
    expect(next.length).toBeGreaterThanOrEqual(2);
    expect(isPackersSeedBook(next[0])).toBe(true);
    expect(next.some(isBearsSeedBook)).toBe(true);
    expect(PACKERS_SEED_VERSION).toBe(5);
  });
});
