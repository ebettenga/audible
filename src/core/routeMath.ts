import { mirrorX, type Strength } from '@/src/core/field';
import type { Point, RouteDef } from './schema';

/**
 * Routes are authored for a receiver on the right (+x = toward his sideline).
 * Mirror lateral movement by which side of the ball the player is on.
 */
export function sideOfBall(x: number, callStrength: Strength): Strength {
  if (x > 0.5) return 'right';
  if (x < -0.5) return 'left';
  return callStrength;
}

/** Relative waypoints → absolute coords, mirroring lateral by side of ball (receiver routes). */
export function absoluteRoutePoints(
  originX: number,
  originY: number,
  relativeWaypoints: Point[],
  callStrength: Strength,
): Point[] {
  const mirrorStrength = sideOfBall(originX, callStrength);
  return relativeWaypoints.map((wp) => ({
    x: originX + mirrorX(wp.x, mirrorStrength),
    y: originY + wp.y,
  }));
}

/** Relative waypoints → absolute coords with explicit mirror strength (blocks, runs). */
export function absolutePathPoints(
  originX: number,
  originY: number,
  relativeWaypoints: Point[],
  mirrorStrength: Strength,
): Point[] {
  return relativeWaypoints.map((wp) => ({
    x: originX + mirrorX(wp.x, mirrorStrength),
    y: originY + wp.y,
  }));
}

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
