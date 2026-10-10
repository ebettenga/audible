import { parsePlaycall, buildPlay } from '@/src/core/parser';
import { composePlaycall, draftFromAst } from '@/src/features/builder/composePlaycall';

describe('motion', () => {
  it('parses "Z Jet" after the formation', () => {
    const ast = parsePlaycall('Gun Doubles Right Z Jet 62 Slant-Flat');
    expect(ast.motion).toEqual({ slot: 'z', motionId: 'jet' });
    expect(ast.protectionId).toBe('62');
    expect(ast.conceptId).toBe('slant-flat');
    expect(ast.warnings).toBeUndefined();
  });

  it('parses dashed and late motion tokens', () => {
    expect(parsePlaycall('Gun Doubles Right 62 Slant-Flat H-Orbit').motion).toEqual({
      slot: 'h',
      motionId: 'orbit',
    });
  });

  it('keeps Jet Sweep as a run when no player prefix is given', () => {
    const ast = parsePlaycall('Gun Doubles Right Jet Sweep');
    expect(ast.motion).toBeUndefined();
    expect(ast.run?.runId).toBe('jet-sweep');
  });

  it('warns on a second motion', () => {
    const ast = parsePlaycall('Gun Doubles Right Z Jet 62 Slant-Flat X Across');
    expect(ast.motion).toEqual({ slot: 'z', motionId: 'jet' });
    expect(ast.warnings?.[0]).toMatch(/one player/i);
  });

  it('round-trips through the composer', () => {
    const call = 'Gun Doubles Right Z Jet 62 Slant-Flat';
    expect(composePlaycall(draftFromAst(parsePlaycall(call)))).toBe(call);
  });

  it('draws a dashed motion and starts the route at the snap point', () => {
    const scene = buildPlay('Gun Doubles Right Z Jet 62 Slant-Flat', { includeDefense: false });
    const motion = scene.arrows.find((a) => a.kind === 'motion');
    expect(motion?.playerId).toBe('off-z');
    const snap = motion!.points[motion!.points.length - 1];
    const route = scene.arrows.find((a) => a.playerId === 'off-z' && a.kind !== 'motion');
    expect(route?.points[0]).toEqual(snap);
  });

  it('breaks routes relative to the receiver side of the ball', () => {
    for (const call of ['Gun Doubles Right X-Slant Z-Slant', 'Gun Doubles Left X-Slant Z-Slant']) {
      const scene = buildPlay(call, { includeDefense: false });
      for (const id of ['off-x', 'off-z']) {
        const route = scene.arrows.find((a) => a.playerId === id && a.label === 'Slant')!;
        const start = route.points[0];
        const end = route.points[route.points.length - 1];
        expect(Math.abs(end.x)).toBeLessThan(Math.abs(start.x));
      }
    }
  });

  it('flips the route break when the motion crosses the ball', () => {
    const still = buildPlay('Gun Doubles Right 62 Slant-Flat', { includeDefense: false });
    const moved = buildPlay('Gun Doubles Right Z Across 62 Slant-Flat', { includeDefense: false });
    const breakDx = (scene: typeof still) => {
      const r = scene.arrows.find((a) => a.playerId === 'off-z' && a.kind !== 'motion')!;
      return r.points[r.points.length - 1].x - r.points[0].x;
    };
    expect(Math.sign(breakDx(moved))).toBe(-Math.sign(breakDx(still)));
  });
});
