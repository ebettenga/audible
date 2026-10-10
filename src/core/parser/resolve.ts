import type { PlayCallAst } from './ast';
import { PlaycallError } from './errors';
import { parsePlaycall } from './tokenize';
import { gapX, mirrorX, type Strength } from '@/src/core/field';
import {
  absolutePathPoints,
  absoluteRoutePoints,
  scaleRouteToDepth,
} from '@/src/core/routeMath';
import {
  colorKeyForPosition,
  type Player,
  type PlayScene,
  type SceneArrow,
  type SceneZone,
  type GapLabel,
  type PositionId,
  type TitleSegment,
} from '@/src/core/schema';
import { FORMATIONS } from '@/src/data/formations';
import { findRouteByNumber, findRouteByName, ROUTES } from '@/src/data/routes';
import { PROTECTIONS } from '@/src/data/protections';
import { RUNS } from '@/src/data/runs';
import { findBlockOption, passLineAssignments, runLineAssignments } from '@/src/data/lineBlocking';
import { FRONTS } from '@/src/data/fronts';
import { COVERAGES } from '@/src/data/coverages';
import { getZone } from '@/src/data/zones';
import { CONCEPTS } from '@/src/data/concepts';
import { MOTIONS, motionPath } from '@/src/data/motions';

/** Where the motion player is at the snap, and the strength his route mirrors to. */
export interface MotionOrigin {
  slot: string;
  x: number;
  y: number;
  strength: Strength;
}

export interface AssignmentOverride {
  routeId: string;
  depth?: number;
}

/** Override that strips a player's assignment for this play, even if the call gives him one. */
export const NO_ROUTE_ID = 'none';

export interface ResolveOptions {
  frontId?: string;
  coverageId?: string;
  includeDefense?: boolean;
  /** Per-slot route overrides (builder inspector) */
  assignments?: Record<string, AssignmentOverride>;
}

function playersFromFormation(
  formationId: string,
  strength: Strength,
): Player[] {
  const formation = FORMATIONS.find((f) => f.id === formationId);
  if (!formation) {
    throw new PlaycallError(`Unknown formation id "${formationId}"`, 0, formationId);
  }

  return Object.entries(formation.slots).map(([slot, s]): Player => {
    const position = s.position as PositionId;
    return {
      id: `off-${slot}`,
      slot: slot as Player['slot'],
      position,
      label: s.label ?? position,
      x: mirrorX(s.x, strength),
      y: s.y,
      side: 'off',
      colorKey: s.colorKey ?? colorKeyForPosition(position),
    };
  });
}

function playersFromFront(frontId: string, strength: Strength): Player[] {
  const front = FRONTS.find((f) => f.id === frontId);
  if (!front) return [];
  return Object.entries(front.slots).map(([slot, s]): Player => {
    const position = s.position as PositionId;
    return {
      id: `def-${slot}`,
      slot: slot as Player['slot'],
      position,
      label: s.label ?? position,
      x: mirrorX(s.x, strength),
      y: s.y,
      side: 'def',
      colorKey: s.colorKey ?? 'def',
    };
  });
}

function findPlayerBySlot(players: Player[], slot: string): Player | undefined {
  return players.find((p) => p.slot === slot && p.side === 'off');
}

/** Drop the post-snap arrow for a player, keeping any motion arrow. */
function removeRouteArrow(arrows: SceneArrow[], playerId: string) {
  const existing = arrows.findIndex((a) => a.playerId === playerId && a.kind !== 'motion');
  if (existing >= 0) arrows.splice(existing, 1);
}

function originFor(
  player: Player,
  strength: Strength,
  motion?: MotionOrigin,
): { x: number; y: number; strength: Strength } {
  if (motion && motion.slot === player.slot) return motion;
  return { x: player.x, y: player.y, strength };
}

export function motionOriginForSnap(
  players: Player[],
  motion: { slot: string; motionId: string } | undefined,
  callStrength: Strength,
): MotionOrigin | undefined {
  if (!motion) return undefined;
  const mover = findPlayerBySlot(players, motion.slot);
  const def = MOTIONS.find((m) => m.id === motion.motionId);
  const points = mover
    ? motionPath(motion.motionId, mover, callStrength === 'left' ? -1 : 1)
    : null;
  if (!mover || !def || !points) return undefined;
  const snap = points[points.length - 1];
  const crossed = Math.sign(snap.x) !== 0 && Math.sign(snap.x) === -Math.sign(mover.x);
  return {
    slot: motion.slot,
    x: snap.x,
    y: snap.y,
    strength: crossed ? (callStrength === 'left' ? 'right' : 'left') : callStrength,
  };
}

/** Same geometry as post-snap routes on the main field (origin, motion, mirroring). */
export function buildRoutePointsForPlayer(
  player: Player,
  relativeWaypoints: { x: number; y: number }[],
  callStrength: Strength,
  motion?: MotionOrigin,
): { x: number; y: number }[] {
  const origin = originFor(player, callStrength, motion);
  return absoluteRoutePoints(origin.x, origin.y, relativeWaypoints, origin.strength);
}

function pushRouteArrow(
  arrows: SceneArrow[],
  covered: Set<string>,
  players: Player[],
  slot: string,
  routeId: string,
  strength: Strength,
  depth?: number,
  idPrefix = 'route',
  motion?: MotionOrigin,
) {
  const route = ROUTES.find((r) => r.id === routeId) ?? findRouteByName(routeId);
  if (!route) return;
  const player = findPlayerBySlot(players, slot);
  if (!player) return;
  const waypoints =
    depth != null ? scaleRouteToDepth(route, depth) : route.waypoints;
  removeRouteArrow(arrows, player.id);
  covered.add(slot);
  arrows.push({
    id: `${idPrefix}-${slot}-${route.id}`,
    playerId: player.id,
    points: buildRoutePointsForPlayer(player, waypoints, strength, motion),
    curve: route.curve,
    arrowhead: route.arrowhead,
    color: '#e8f64a',
    label: route.name,
  });
}

export function resolvePlay(ast: PlayCallAst, options: ResolveOptions = {}): PlayScene {
  const strength = ast.strength;
  const formation = FORMATIONS.find((f) => f.id === ast.formationId);
  if (!formation) {
    throw new PlaycallError(`Unknown formation "${ast.formationId}"`, 0, ast.formationId);
  }

  const players = playersFromFormation(ast.formationId, strength);
  const arrows: SceneArrow[] = [];
  const gapLabels: GapLabel[] = [];
  const zones: SceneZone[] = [];
  const annotations: PlayScene['annotations'] = [];
  const covered = new Set<string>();

  // --- Pre-snap motion ---
  const motion = motionOriginForSnap(players, ast.motion, strength);
  if (ast.motion && motion) {
    const mover = findPlayerBySlot(players, ast.motion.slot);
    const def = MOTIONS.find((m) => m.id === ast.motion!.motionId);
    const points = mover
      ? motionPath(ast.motion.motionId, mover, strength === 'left' ? -1 : 1)
      : null;
    if (mover && def && points) {
      arrows.push({
        id: `motion-${ast.motion.slot}-${def.id}`,
        playerId: mover.id,
        points,
        curve: def.id === 'jet' ? 'straight' : 'rounded',
        arrowhead: 'none',
        color: '#f1f3ec',
        label: `${def.name} motion`,
        kind: 'motion',
      });
    }
  }

  // --- Concept assignments ---
  const concept = ast.conceptId
    ? CONCEPTS.find((c) => c.id === ast.conceptId)
    : undefined;
  if (concept) {
    for (const [slot, routeId] of Object.entries(concept.assignments)) {
      pushRouteArrow(arrows, covered, players, slot, routeId, strength, undefined, 'concept', motion);
    }
  }

  // --- Route digits (skip slots already covered by concept unless no concept) ---
  if (ast.routeDigits) {
    const digits = [...ast.routeDigits].map((d) => parseInt(d, 10));
    const order = formation.routeOrder;
    digits.forEach((digit, idx) => {
      const slot = order[idx];
      if (!slot) return;
      if (concept && covered.has(slot)) return;
      const route = findRouteByNumber(digit);
      if (!route) return;
      pushRouteArrow(arrows, covered, players, slot, route.id, strength, undefined, 'route', motion);
    });
  }

  // --- Tags ---
  for (const tag of ast.tags) {
    const player = findPlayerBySlot(players, tag.slot);
    if (player && tag.highlight) player.highlight = true;
    if (covered.has(tag.slot) && !options.assignments?.[tag.slot]) {
      // Tag on already-covered receiver: highlight only (unless assignment override later)
      continue;
    }
    pushRouteArrow(arrows, covered, players, tag.slot, tag.routeId, strength, undefined, 'tag', motion);
  }

  // --- Builder assignment overrides (highest precedence) ---
  if (options.assignments) {
    for (const [slot, ov] of Object.entries(options.assignments)) {
      if (ov.routeId === NO_ROUTE_ID) {
        const cleared = findPlayerBySlot(players, slot);
        if (cleared) removeRouteArrow(arrows, cleared.id);
        covered.add(slot);
        continue;
      }
      // Linemen overrides are applied with the line assignments below.
      if (ov.routeId.startsWith('line:')) continue;
      if (ov.routeId.startsWith('back:')) {
        const opt = findBlockOption(ov.routeId);
        const back = findPlayerBySlot(players, slot);
        if (!opt || !back) continue;
        removeRouteArrow(arrows, back.id);
        const origin = originFor(back, strength, motion);
        arrows.push({
          id: `assign-${slot}-${opt.id.replace(':', '-')}`,
          playerId: back.id,
          points: absolutePathPoints(origin.x, origin.y, opt.path, origin.strength),
          curve: 'rounded',
          arrowhead: 'block',
          color: '#e8f64a',
          label: opt.label,
        });
        continue;
      }
      pushRouteArrow(
        arrows,
        covered,
        players,
        slot,
        ov.routeId,
        strength,
        ov.depth,
        'assign',
        motion,
      );
    }
  }

  // --- Run / Fake ---
  if (ast.run) {
    const run = RUNS.find((r) => r.id === ast.run!.runId);
    if (run) {
      const rb = findPlayerBySlot(players, 'rb');
      const fb = findPlayerBySlot(players, 'fb');
      if (rb && !options.assignments?.rb) {
        const origin = originFor(rb, strength, motion);
        arrows.push({
          id: `run-rb-${run.id}`,
          playerId: rb.id,
          points: absolutePathPoints(origin.x, origin.y, run.ballCarrierPath, origin.strength),
          curve: 'rounded',
          arrowhead: 'arrow',
          color: '#e8f64a',
          label: ast.run.isFake ? 'Fake' : run.name,
        });
      }
      if (fb && run.leadPath && !options.assignments?.fb) {
        const origin = originFor(fb, strength, motion);
        arrows.push({
          id: `run-fb-${run.id}`,
          playerId: fb.id,
          points: absolutePathPoints(origin.x, origin.y, run.leadPath, origin.strength),
          curve: 'rounded',
          arrowhead: run.leadArrowhead ?? 'block',
          color: '#e8f64a',
          label: 'Lead',
        });
      }
      gapLabels.push({
        gap: run.hole,
        x: mirrorX(gapX(run.hole), strength),
        y: 1.5,
        text: String(run.hole),
      });
    }
  }

  // --- Offensive line assignments ---
  {
    const runDef = ast.run ? RUNS.find((r) => r.id === ast.run!.runId) : undefined;
    const isPassSet = !runDef || ast.run?.isFake;
    const lineAssignments = isPassSet
      ? passLineAssignments(ast.protectionId)
      : runLineAssignments(runDef!.id, runDef!.hole);
    const prefix = isPassSet ? 'line-pass' : 'line-run';
    for (const la of lineAssignments) {
      const ol = findPlayerBySlot(players, la.slot);
      if (!ol) continue;
      const override = options.assignments?.[la.slot]?.routeId;
      if (override === NO_ROUTE_ID) continue;
      const opt = override?.startsWith('line:') ? findBlockOption(override) : undefined;
      arrows.push({
        id: `${prefix}-${la.slot}`,
        playerId: ol.id,
        points: absolutePathPoints(ol.x, ol.y, opt?.path ?? la.path, strength),
        curve: 'rounded',
        arrowhead: 'block',
        color: '#9ab0c8',
        label: opt?.label ?? la.label,
      });
    }
  }

  // --- Protection gap labels ---
  if (ast.protectionId) {
    const prot = PROTECTIONS.find((p) => p.id === ast.protectionId);
    if (prot) {
      for (const gap of prot.gapLabels) {
        if (gapLabels.some((g) => g.gap === gap)) continue;
        gapLabels.push({
          gap,
          x: mirrorX(gapX(gap), strength),
          y: 1.5,
          text: String(gap),
        });
      }
    }
  }

  // --- Defense ---
  const frontId = ast.frontId ?? options.frontId ?? '4-3';
  const coverageId = ast.coverageId ?? options.coverageId;
  const includeDefense = options.includeDefense ?? true;

  if (includeDefense) {
    players.push(...playersFromFront(frontId, strength));
  }

  if (coverageId) {
    const coverage = COVERAGES.find((c) => c.id === coverageId);
    if (coverage) {
      for (const zoneId of coverage.zones) {
        const zone = getZone(zoneId);
        if (!zone) continue;
        const geo = { ...zone.geometry };
        if (geo.x != null) geo.x = mirrorX(geo.x, strength);
        if (geo.points) {
          geo.points = geo.points.map((p) => ({
            x: mirrorX(p.x, strength),
            y: p.y,
          }));
        }
        zones.push({
          id: zone.id,
          label: zone.label,
          shape: zone.shape,
          geometry: geo,
          color: 'rgba(255,255,255,0.2)',
          owner: zone.owner,
        });
      }
    }
  }

  players.sort((a, b) => a.id.localeCompare(b.id));
  arrows.sort((a, b) => a.id.localeCompare(b.id));
  zones.sort((a, b) => a.id.localeCompare(b.id));
  gapLabels.sort((a, b) => a.gap - b.gap || a.x - b.x);

  const titleSegments: TitleSegment[] = concept
    ? [
        { text: ast.raw.replace(new RegExp(`\\s*${concept.accentLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), '').replace(/\s*(Slant\s*\/\s*Flat|Slant-Flat|Four Verticals|Mesh)\s*$/i, '').trim() + ' ', tone: 'default' },
        { text: concept.accentLabel, tone: 'accent' },
      ]
    : [{ text: ast.raw, tone: 'default' }];

  return {
    title: ast.raw,
    titleSegments,
    players,
    arrows,
    zones,
    annotations,
    gapLabels,
  };
}

export function buildPlay(
  playcall: string,
  options?: ResolveOptions,
): PlayScene {
  return resolvePlay(parsePlaycall(playcall), options);
}
