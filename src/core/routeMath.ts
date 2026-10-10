import type { Point, RouteDef } from './schema';

/**
 * Scale a route's relative waypoints so the max downfield depth matches `depthYards`.
 * Lateral (x) movement is preserved proportionally with y.
 */
export function scaleRouteToDepth(
  route: RouteDef,
  depthYards: number,
): Point[] {
  // Scale so the deepest waypoint lands at depthYards
  const authored = maxDepth(route.waypoints);
  if (authored <= 0) return route.waypoints.map((p) => ({ ...p }));
  const scale = depthYards / authored;
  return route.waypoints.map((p) => ({
    x: p.x * scale,
    y: p.y * scale,
  }));
}

function maxDepth(waypoints: Point[]): number {
  return waypoints.reduce((m, p) => Math.max(m, p.y), 0);
}
