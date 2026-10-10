import { buildPlay, buildRoutePointsForPlayer } from '@/src/core/parser';
import { scaleRouteToDepth } from '@/src/core/routeMath';
import { ROUTES } from '@/src/data/routes';

const CALL = 'Gun Doubles Right 62 Slant-Flat';

describe('assignment preview geometry', () => {
  it('matches main field points for an outside receiver (H) with depth', () => {
    const scene = buildPlay(CALL, {
      includeDefense: false,
      assignments: { h: { routeId: 'curl', depth: 12 } },
    });
    const player = scene.players.find((p) => p.slot === 'h');
    expect(player).toBeDefined();
    const fieldArrow = scene.arrows.find((a) => a.playerId === player!.id && a.kind !== 'motion');
    expect(fieldArrow).toBeDefined();

    const curl = ROUTES.find((r) => r.id === 'curl')!;
    const preview = buildRoutePointsForPlayer(
      player!,
      scaleRouteToDepth(curl, 12),
      'right',
    );
    expect(preview).toEqual(fieldArrow!.points);
  });
});
