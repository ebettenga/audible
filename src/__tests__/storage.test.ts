import {
  __resetMemoryStore,
  addPlayToBook,
  addPlayToCollection,
  appendPlayActivity,
  createCollection,
  createPlaybook,
  deletePlaybook,
  deleteCollection,
  duplicatePlay,
  loadPlayActivity,
  loadPlaybooks,
  loadProgress,
  loadSessionLog,
  loadSettings,
  loadUserStats,
  markPlayViewed,
  recordSession,
  recordStudySession,
  removePlay,
  removePlayFromCollection,
  savePlaybooks,
  saveSettings,
  setActiveCollection,
  toggleFavorite,
  topicProgressPercent,
  upsertProgress,
  updateCollection,
} from '@/src/training/storageAsync';
import { normalizePlaybook } from '@/src/training/storageSeed';
import { PLAY_ACTIVITY_LIMIT, type Playbook } from '@/src/training/types';

describe('local storage', () => {
  beforeEach(() => {
    __resetMemoryStore();
  });

  it('seeds Packers and Bears playbooks with starter collections', async () => {
    const books = await loadPlaybooks();
    expect(books.length).toBeGreaterThanOrEqual(2);
    expect(books[0].id).toBe('packers-2026');
    expect(books[0].plays.length).toBeGreaterThanOrEqual(30);
    expect(books[0].plays.some((p) => p.side === 'def')).toBe(true);
    expect(books[0].collections.length).toBeGreaterThanOrEqual(6);
    expect(books[0].collections.some((c) => c.isActive)).toBe(true);
    expect(books.some((b) => b.id === 'bears-2026')).toBe(true);
  });

  it('merges new Packers seed plays without wiping user edits', async () => {
    const books = await loadPlaybooks();
    const packers = books.find((b) => b.id === 'packers-2026')!;
    expect(packers.plays.find((p) => p.id === 'gb-spacing')).toBeTruthy();

    // Strip defense to simulate pre-v5, keep a user edit on spacing
    const stripped: Playbook = {
      ...packers,
      plays: packers.plays
        .filter((p) => p.side !== 'def')
        .map((p) =>
          p.id === 'gb-spacing'
            ? { ...p, favorite: true, notes: 'KEEP-USER-EDIT', reviewCount: 3 }
            : p,
        ),
      collections: packers.collections.filter((c) => c.id !== 'col-packers-d'),
    };
    const bears = books.find((b) => b.id === 'bears-2026')!;
    await savePlaybooks([stripped, bears]);

    const reloaded = await loadPlaybooks();
    const next = reloaded.find((b) => b.id === 'packers-2026')!;
    expect(next.plays.some((p) => p.side === 'def')).toBe(true);
    const kept = next.plays.find((p) => p.id === 'gb-spacing')!;
    expect(kept.notes).toBe('KEEP-USER-EDIT');
    expect(kept.favorite).toBe(true);
    expect(kept.reviewCount).toBe(3);
    expect(reloaded.some((b) => b.id === 'bears-2026')).toBe(true);
  });

  it('derives installs from collection membership', async () => {
    const books = await loadPlaybooks();
    const book = books[0];
    const active = book.collections.find((c) => c.isActive)!;
    for (const playId of active.playIds) {
      const play = book.plays.find((p) => p.id === playId);
      expect(play?.installs).toBeGreaterThanOrEqual(1);
    }
  });

  it('persists card progress', async () => {
    await upsertProgress({
      cardId: 'formations-0',
      easiness: 2.5,
      intervalDays: 1,
      repetitions: 1,
      dueAt: new Date().toISOString(),
      lastResult: 'good',
    });
    const map = await loadProgress();
    expect(map['formations-0']?.repetitions).toBe(1);
  });

  it('toggles favorites', async () => {
    const books = await loadPlaybooks();
    const play = books[0].plays[0];
    const before = !!play.favorite;
    const next = await toggleFavorite(books[0].id, play.id);
    expect(next[0].plays.find((p) => p.id === play.id)?.favorite).toBe(!before);
  });

  it('records study sessions for weekly goal + streak', async () => {
    const stats = await recordStudySession();
    expect(stats.weekSessions).toBeGreaterThanOrEqual(1);
    expect(stats.streakDays).toBeGreaterThanOrEqual(1);
    const again = await loadUserStats();
    expect(again.weekSessions).toBe(stats.weekSessions);
  });

  it('computes topic progress percent', async () => {
    expect(topicProgressPercent('formations', {})).toBe(0);
  });

  it('creates, activates, and deletes collections', async () => {
    const books = await loadPlaybooks();
    const bookId = books[0].id;
    const withNew = await createCollection(bookId, {
      name: 'Goal line',
      color: '#c9f25b',
      playIds: [books[0].plays[0].id],
    });
    const created = withNew[0].collections.find((c) => c.name === 'Goal line');
    expect(created).toBeTruthy();
    expect(created!.playIds).toEqual([books[0].plays[0].id]);

    const activated = await setActiveCollection(bookId, created!.id);
    expect(activated[0].collections.filter((c) => c.isActive)).toHaveLength(1);
    expect(activated[0].collections.find((c) => c.id === created!.id)?.isActive).toBe(true);

    const renamed = await updateCollection(created!.id, { name: 'Goal-line' });
    expect(renamed[0].collections.find((c) => c.id === created!.id)?.name).toBe('Goal-line');

    const afterDelete = await deleteCollection(created!.id);
    expect(afterDelete[0].collections.find((c) => c.id === created!.id)).toBeUndefined();
  });

  it('adds and removes plays from collections and updates installs', async () => {
    const books = await loadPlaybooks();
    const book = books[0];
    const col = book.collections[0];
    const play = book.plays.find((p) => !col.playIds.includes(p.id)) ?? book.plays[0];

    const added = await addPlayToCollection(col.id, play.id);
    expect(added[0].collections.find((c) => c.id === col.id)?.playIds).toContain(play.id);
    expect(added[0].plays.find((p) => p.id === play.id)!.installs).toBeGreaterThanOrEqual(1);

    const removed = await removePlayFromCollection(col.id, play.id);
    expect(removed[0].collections.find((c) => c.id === col.id)?.playIds).not.toContain(play.id);
  });

  it('removes a play from the book, collections, and activity', async () => {
    const books = await loadPlaybooks();
    const bookId = books[0].id;
    const withPlay = await addPlayToBook(bookId, {
      name: 'Delete Me',
      playcall: 'Ace Twins Right 62 Slant-Flat',
    });
    const play = withPlay[0].plays.find((p) => p.name === 'Delete Me')!;
    const col = withPlay[0].collections[0];
    await addPlayToCollection(col.id, play.id);
    await appendPlayActivity({ playId: play.id, type: 'created' });
    expect((await loadPlayActivity(play.id)).length).toBeGreaterThan(0);

    const after = await removePlay(bookId, play.id);
    expect(after[0].plays.find((p) => p.id === play.id)).toBeUndefined();
    expect(after[0].collections.find((c) => c.id === col.id)?.playIds).not.toContain(play.id);
    expect(await loadPlayActivity(play.id)).toEqual([]);
  });

  it('duplicates a play with a new id and copied assignments', async () => {
    const books = await loadPlaybooks();
    const bookId = books[0].id;
    const withPlay = await addPlayToBook(bookId, {
      name: 'Assign Test',
      playcall: 'Ace Twins Right 62 Slant-Flat',
      assignments: { x: { routeId: 'slant', depth: 5 } },
    });
    const source = withPlay[0].plays.find((p) => p.name === 'Assign Test')!;
    expect(source.assignments?.x?.routeId).toBe('slant');

    const duped = await duplicatePlay(bookId, source.id);
    const copy = duped[0].plays.find((p) => p.name === 'Assign Test (copy)');
    expect(copy).toBeTruthy();
    expect(copy!.id).not.toBe(source.id);
    expect(copy!.assignments?.x).toEqual({ routeId: 'slant', depth: 5 });
    expect(copy!.reviewCount).toBe(0);
  });

  it('persists assignments on addPlayToBook', async () => {
    const books = await loadPlaybooks();
    const next = await addPlayToBook(books[0].id, {
      name: 'With Assignments',
      playcall: 'Shotgun Right 979',
      assignments: { z: { routeId: 'go' } },
      coachingPoint: 'Sell the vertical',
    });
    const play = next[0].plays.find((p) => p.name === 'With Assignments')!;
    expect(play.assignments?.z?.routeId).toBe('go');
    expect(play.coachingPoint).toBe('Sell the vertical');
    expect(play.id.startsWith('play-')).toBe(true);
  });

  it('persists defensive side, pressure, and vs look', async () => {
    const books = await loadPlaybooks();
    const next = await addPlayToBook(books[0].id, {
      name: 'Custom Fire Zone',
      playcall: '4-3 Cover 3 Fire Zone',
      side: 'def',
      frontId: '4-3',
      coverageId: 'cover-3',
      pressureId: 'fire-zone',
      vsPlaycall: 'Gun Doubles Right 62 Slant-Flat',
      assignments: { mike: { routeId: 'def:blitz' } },
    });
    const play = next[0].plays.find((p) => p.name === 'Custom Fire Zone')!;
    expect(play.side).toBe('def');
    expect(play.pressureId).toBe('fire-zone');
    expect(play.vsPlaycall).toContain('Gun Doubles');
    expect(play.assignments?.mike?.routeId).toBe('def:blitz');

    const duped = await duplicatePlay(books[0].id, play.id);
    const copy = duped[0].plays.find((p) => p.name === 'Custom Fire Zone (copy)')!;
    expect(copy.side).toBe('def');
    expect(copy.pressureId).toBe('fire-zone');
  });

  it('prunes empty auto-named Playbook N stubs on load', async () => {
    const books = await loadPlaybooks();
    await savePlaybooks([
      ...books,
      {
        id: 'book-stub-3',
        name: 'Playbook 3',
        plays: [],
        collections: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
        systemIds: ['west-coast'],
        customLexicon: [],
      },
    ]);
    const reloaded = await loadPlaybooks();
    expect(reloaded.some((b) => b.name === 'Playbook 3')).toBe(false);
    expect(reloaded.some((b) => b.id === 'packers-2026')).toBe(true);
    expect(reloaded.some((b) => b.id === 'bears-2026')).toBe(true);
  });

  it('deletes a user playbook', async () => {
    const list = await createPlaybook({ name: 'Temp Book' });
    const created = list.find((b) => b.name === 'Temp Book')!;
    const after = await deletePlaybook(created.id);
    expect(after.find((b) => b.id === created.id)).toBeUndefined();
    expect(after.some((b) => b.id === 'packers-2026')).toBe(true);
  });

  it('creates a second playbook and saves plays into it', async () => {
    const list = await createPlaybook({ name: 'Red Zone Book' });
    expect(list.length).toBeGreaterThanOrEqual(2);
    const created = list.find((b) => b.name === 'Red Zone Book')!;
    expect(created.id.startsWith('book-')).toBe(true);
    expect(created.plays).toHaveLength(0);

    const withPlay = await addPlayToBook(created.id, {
      name: 'Corner Fade',
      playcall: 'Trips Right 989',
      notes: 'Attack the boundary',
    });
    const book = withPlay.find((b) => b.id === created.id)!;
    expect(book.plays).toHaveLength(1);
    expect(book.plays[0].notes).toBe('Attack the boundary');
    expect(withPlay.find((b) => b.id === 'packers-2026')?.plays.length).toBeGreaterThan(0);

    const colList = await createCollection(created.id, {
      name: 'Sunday',
      color: '#c9f25b',
      isActive: true,
    });
    const col = colList.find((b) => b.id === created.id)!.collections[0];
    const playId = book.plays[0].id;
    const membership = await addPlayToCollection(col.id, playId);
    expect(
      membership.find((b) => b.id === created.id)!.collections[0].playIds,
    ).toContain(playId);
  });

  it('round-trips settings', async () => {
    await saveSettings({
      displayName: 'Coach Miller',
      role: 'OC',
      weeklyGoal: 5,
      seasonStart: '2026-08-01',
      activeBookId: 'packers-2026',
    });
    const settings = await loadSettings();
    expect(settings.displayName).toBe('Coach Miller');
    expect(settings.role).toBe('OC');
    expect(settings.weeklyGoal).toBe(5);
    expect(settings.seasonStart).toBe('2026-08-01');
    expect(settings.activeBookId).toBe('packers-2026');
  });

  it('records session log and updates streak cache', async () => {
    const { session, stats } = await recordSession({
      startedAt: new Date().toISOString(),
      topic: 'formations',
      cardsReviewed: 10,
      correct: 8,
      durationSec: 120,
      xp: 240,
      source: 'quiz',
    });
    expect(session.id).toBeTruthy();
    const log = await loadSessionLog({ topic: 'formations' });
    expect(log.some((s) => s.id === session.id)).toBe(true);
    expect(stats.streakDays).toBeGreaterThanOrEqual(1);
  });

  it('round-trips playbook session scope on session_log', async () => {
    const { session } = await recordSession({
      startedAt: new Date().toISOString(),
      topic: 'play-calls',
      cardsReviewed: 5,
      correct: 4,
      durationSec: 90,
      xp: 80,
      source: 'flashcards',
      bookId: 'default',
      collectionId: 'col-red-zone',
    });
    expect(session.bookId).toBe('default');
    expect(session.collectionId).toBe('col-red-zone');
    const log = await loadSessionLog({ topic: 'play-calls' });
    const found = log.find((s) => s.id === session.id);
    expect(found?.bookId).toBe('default');
    expect(found?.collectionId).toBe('col-red-zone');
  });

  it('caps play activity at PLAY_ACTIVITY_LIMIT', async () => {
    const books = await loadPlaybooks();
    const playId = books[0].plays[0].id;
    for (let i = 0; i < PLAY_ACTIVITY_LIMIT + 5; i++) {
      await appendPlayActivity({
        playId,
        type: 'edited',
        createdAt: new Date(Date.now() + i).toISOString(),
      });
    }
    const activity = await loadPlayActivity(playId);
    expect(activity.length).toBeLessThanOrEqual(PLAY_ACTIVITY_LIMIT);
  });

  it('counts review at most once per session', async () => {
    const books = await loadPlaybooks();
    const bookId = books[0].id;
    const playId = books[0].plays[0].id;
    const before = books[0].plays[0].reviewCount ?? 0;
    const once = await markPlayViewed(bookId, playId);
    const twice = await markPlayViewed(bookId, playId);
    expect(once[0].plays.find((p) => p.id === playId)!.reviewCount).toBe(before + 1);
    expect(twice[0].plays.find((p) => p.id === playId)!.reviewCount).toBe(before + 1);
  });

  it('backfills playbooks without collections via normalizePlaybook', () => {
    const legacy = {
      id: 'legacy',
      name: 'Legacy Book',
      updatedAt: new Date().toISOString(),
      plays: [
        {
          id: 'lp0',
          name: 'Legacy Play',
          playcall: 'I Right 999',
          createdAt: new Date().toISOString(),
        },
      ],
    } as Playbook;
    const normalized = normalizePlaybook(legacy);
    expect(normalized.collections).toEqual([]);
    expect(normalized.plays[0].installs).toBe(0);
    expect(normalized.plays[0].formation).toBeTruthy();
  });
});
