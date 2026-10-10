import type { PlayScene } from '@/src/core/schema';
import { findRouteByName, ROUTES } from '@/src/data/routes';
import { BACK_OPTIONS, DEFENDER_OPTIONS, LINE_OPTIONS } from '@/src/data/lineBlocking';

export type SceneAssignment = {
  player: string;
  playerId: string;
  route: string;
  kind: string;
  hint?: string;
};

const OL = new Set(['LT', 'LG', 'C', 'RG', 'RT']);

const DEF_KIND: Record<string, string> = {
  Contain: 'Rush',
  'A Gap': 'Rush',
  'B Gap': 'Rush',
  Blitz: 'Blitz',
  Flat: 'Zone',
  Hook: 'Zone',
  Deep: 'Zone',
  Man: 'Man',
  Press: 'Man',
  Spy: 'Spy',
};

export function defenseAssignmentsFromScene(scene: PlayScene): SceneAssignment[] {
  const defenders = scene.players.filter((p) => p.side === 'def');
  return defenders.map((player) => {
    const arrow = scene.arrows.find(
      (a) => a.playerId === player.id && !a.id.startsWith('ghost-'),
    );
    const routeName = arrow?.label ?? 'No assignment';
    const hint = DEFENDER_OPTIONS.find((o) => o.label === routeName)?.hint;
    const kind =
      DEF_KIND[routeName] ??
      (arrow?.color === '#ef6e5a'
        ? 'Blitz'
        : arrow?.color === '#f0a55d'
          ? 'Rush'
          : arrow?.color === '#6bd6cf'
            ? 'Man'
            : 'Zone');
    return {
      player: player.label || player.position,
      playerId: player.id,
      route: routeName,
      kind,
      hint,
    };
  });
}

export function assignmentsFromScene(scene: PlayScene): SceneAssignment[] {
  if (scene.flipped) return defenseAssignmentsFromScene(scene);
  const offense = scene.players.filter(
    (p) => p.side === 'off' && !p.id.startsWith('ghost-'),
  );
  return offense.map((player) => {
    const arrow = scene.arrows.find((a) => a.playerId === player.id && a.kind !== 'motion');
    const label = player.label || player.position;
    if (OL.has(player.position)) {
      return {
        player: label,
        playerId: player.id,
        route: arrow?.label ?? 'No assignment',
        kind: arrow?.id.startsWith('line-run') ? 'Block' : 'Protection',
        hint: LINE_OPTIONS.find((o) => o.label === arrow?.label)?.hint,
      };
    }
    if (player.position === 'QB') {
      return {
        player: label,
        playerId: player.id,
        route: arrow?.label ?? 'Drop',
        kind: 'QB',
        hint: undefined,
      };
    }
    const routeName = arrow?.label ?? 'No route';
    const routeDef =
      findRouteByName(routeName) ??
      ROUTES.find((r) => r.name.toLowerCase() === routeName.toLowerCase());
    return {
      player: label,
      playerId: player.id,
      route: routeName,
      kind: arrow?.arrowhead === 'block' ? 'Block' : 'Route',
      hint:
        routeDef?.coachingPoint ??
        [...BACK_OPTIONS].find((o) => o.label === routeName)?.hint,
    };
  });
}
