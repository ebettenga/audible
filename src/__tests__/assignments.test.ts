import { buildPlay, buildDefense, NO_ROUTE_ID } from '@/src/core/parser';

const CALL = 'Gun Doubles Right 62 Slant-Flat';

function arrowsFor(scene: ReturnType<typeof buildPlay>, playerId: string) {
  return scene.arrows.filter((a) => a.playerId === playerId);
}

describe('assignment overrides', () => {
  it('clears a concept route for one player only', () => {
    const base = buildPlay(CALL, { includeDefense: false });
    expect(arrowsFor(base, 'off-z')).toHaveLength(1);

    const cleared = buildPlay(CALL, {
      includeDefense: false,
      assignments: { z: { routeId: NO_ROUTE_ID } },
    });
    expect(arrowsFor(cleared, 'off-z')).toHaveLength(0);
    expect(arrowsFor(cleared, 'off-y')).toEqual(arrowsFor(base, 'off-y'));
  });

  it('keeps the motion when the route is cleared', () => {
    const scene = buildPlay('Gun Doubles Right Z Jet 62 Slant-Flat', {
      includeDefense: false,
      assignments: { z: { routeId: NO_ROUTE_ID } },
    });
    expect(arrowsFor(scene, 'off-z').map((a) => a.kind)).toEqual(['motion']);
  });

  it('clears backs, linemen, and defenders', () => {
    const run = buildPlay('I Right Inside Zone', {
      includeDefense: false,
      assignments: { rb: { routeId: NO_ROUTE_ID }, lt: { routeId: NO_ROUTE_ID } },
    });
    expect(arrowsFor(run, 'off-rb')).toHaveLength(0);
    expect(arrowsFor(run, 'off-lt')).toHaveLength(0);

    const def = buildDefense('4-3 Cover 3', { assignments: { mike: { routeId: NO_ROUTE_ID } } });
    expect(def.arrows.filter((a) => a.playerId === 'def-mike')).toHaveLength(0);
  });

  it('applies a one-off route without touching the rest of the call', () => {
    const base = buildPlay(CALL, { includeDefense: false });
    const oneOff = buildPlay(CALL, {
      includeDefense: false,
      assignments: { z: { routeId: 'post', depth: 12 } },
    });
    expect(arrowsFor(oneOff, 'off-z')[0].label).toBe('Post');
    expect(arrowsFor(oneOff, 'off-x')).toEqual(arrowsFor(base, 'off-x'));
  });
});
