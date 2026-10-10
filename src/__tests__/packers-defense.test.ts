import { parseDefenseCall, buildDefense } from '@/src/core/parser';
import {
  PACKERS_DEFENSE_PLAYS,
  BEARS_WEEK5_D_IDS,
  packersDefenseCollections,
} from '@/src/data/packersDefense';
import { buildPackersPlaybook } from '@/src/data/packersPlaybook';

describe('Packers 2026 defense seed', () => {
  it.each(PACKERS_DEFENSE_PLAYS.map((p) => [p.id, p.name, p.playcall] as const))(
    'parses and builds %s (%s)',
    (_id, name, playcall) => {
      const play = PACKERS_DEFENSE_PLAYS.find((p) => p.playcall === playcall)!;
      const ast = parseDefenseCall(playcall);
      expect(ast.frontId).toBeTruthy();
      expect(name).toBeTruthy();
      expect(name).not.toBe(playcall);
      expect(play.side).toBe('def');
      expect(play.frontId).toBeTruthy();

      const scene = buildDefense(playcall, {
        vsPlaycall: play.vsPlaycall,
      });
      expect(scene.flipped).toBe(true);
      expect(scene.players.some((p) => p.side === 'def')).toBe(true);
      if (play.vsPlaycall) {
        expect(scene.players.some((p) => p.id.startsWith('ghost-'))).toBe(true);
      }
    },
  );

  it('wires defense into Packers book with Packers D collections', () => {
    const book = buildPackersPlaybook('2026-10-10T12:00:00.000Z');
    const defPlays = book.plays.filter((p) => p.side === 'def');
    expect(defPlays.length).toBe(PACKERS_DEFENSE_PLAYS.length);
    expect(defPlays.every((p) => p.id.startsWith('gb-d-'))).toBe(true);

    const packersD = book.collections.find((c) => c.id === 'col-packers-d');
    expect(packersD).toBeTruthy();
    expect(packersD!.playIds).toEqual(
      expect.arrayContaining(PACKERS_DEFENSE_PLAYS.map((p) => p.id)),
    );
    expect(packersD!.isActive).toBe(false);

    const week5D = book.collections.find((c) => c.id === 'col-bears-w5-d');
    expect(week5D).toBeTruthy();
    expect(week5D!.playIds).toEqual(expect.arrayContaining([...BEARS_WEEK5_D_IDS]));
    expect(week5D!.isActive).toBe(false);

    // Offensive Bears Week 5 stays the active install
    const active = book.collections.filter((c) => c.isActive);
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('Bears Week 5');
  });

  it('packersDefenseCollections stays inactive', () => {
    const cols = packersDefenseCollections('packers-2026', '2026-10-10T12:00:00.000Z');
    expect(cols.every((c) => !c.isActive)).toBe(true);
  });
});
