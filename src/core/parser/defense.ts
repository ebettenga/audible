import type { Strength } from '@/src/core/field';
import { gapX, mirrorX } from '@/src/core/field';
import type {
  DefenderAssignment,
  Player,
  PlayScene,
  PositionId,
  SceneArrow,
  SceneZone,
  GapLabel,
  TitleSegment,
} from '@/src/core/schema';
import { findFront, matchFront, FRONTS } from '@/src/data/fronts';
import { findCoverage, matchCoverage, COVERAGES } from '@/src/data/coverages';
import { findPressure, matchPressure, PRESSURES } from '@/src/data/pressures';
import { getZone } from '@/src/data/zones';
import { findBlockOption } from '@/src/data/lineBlocking';
import { PlaycallError } from './errors';
import { NO_ROUTE_ID, resolvePlay } from './resolve';
import type { AssignmentOverride } from './resolve';
import { parsePlaycall } from './tokenize';

export interface DefenseCallAst {
  raw: string;
  frontId: string;
  coverageId?: string;
  pressureId?: string;
  shift?: string;
  strength: Strength;
  unknownTokens?: string[];
  warnings?: string[];
}

export interface DefenseDraft {
  frontId: string;
  coverageId?: string;
  pressureId?: string;
  shift?: string;
  strength: Strength;
  vsPlaycall?: string;
}

export interface ResolveDefenseOptions {
  vsPlaycall?: string;
  assignments?: Record<string, AssignmentOverride>;
  strength?: Strength;
}

function tokenize(input: string): string[] {
  return input.trim().split(/\s+/).filter(Boolean);
}

const SHIFT_TOKENS = new Set(['over', 'under', 'even', 'bear']);

/** Parse a defensive call like "4-3 Over Cover 3 Fire Zone". */
export function parseDefenseCall(input: string): DefenseCallAst {
  const raw = input.trim();
  if (!raw) throw new PlaycallError('Empty defensive call', 0, '');
  const tokens = tokenize(raw);
  const warnings: string[] = [];
  const unknownTokens: string[] = [];
  let i = 0;

  const frontMatch = matchFront(tokens, i);
  let frontId = frontMatch?.front.id;
  if (frontMatch) i += frontMatch.consumed;

  let shift: string | undefined;
  if (i < tokens.length && SHIFT_TOKENS.has(tokens[i].toLowerCase())) {
    shift = tokens[i].toLowerCase();
    // Prefer shifted front id if it exists (e.g. 4-3 + over → 4-3-over)
    if (frontId && !frontId.includes(shift)) {
      const shifted = findFront(`${frontId} ${shift}`) ?? findFront(`${frontId}-${shift}`);
      if (shifted) frontId = shifted.id;
    }
    i += 1;
  }

  if (!frontId) {
    // Try full remaining phrase as front
    const late = matchFront(tokens, 0);
    if (late) {
      frontId = late.front.id;
      i = late.consumed;
    }
  }

  if (!frontId) {
    throw new PlaycallError(`Unknown front in "${raw}"`, 0, tokens[0] ?? '');
  }

  let coverageId: string | undefined;
  const cov = matchCoverage(tokens, i);
  if (cov) {
    coverageId = cov.coverage.id;
    i += cov.consumed;
  }

  let pressureId: string | undefined;
  const press = matchPressure(tokens, i);
  if (press) {
    pressureId = press.pressure.id;
    i += press.consumed;
  }

  // Late coverage / pressure if order was swapped
  while (i < tokens.length) {
    const lateCov = matchCoverage(tokens, i);
    if (lateCov && !coverageId) {
      coverageId = lateCov.coverage.id;
      i += lateCov.consumed;
      continue;
    }
    const latePress = matchPressure(tokens, i);
    if (latePress && !pressureId) {
      pressureId = latePress.pressure.id;
      i += latePress.consumed;
      continue;
    }
    if (SHIFT_TOKENS.has(tokens[i].toLowerCase()) && !shift) {
      shift = tokens[i].toLowerCase();
      i += 1;
      continue;
    }
    unknownTokens.push(tokens[i]);
    warnings.push(`Unknown defensive token "${tokens[i]}"`);
    i += 1;
  }

  return {
    raw,
    frontId,
    coverageId,
    pressureId,
    shift,
    strength: 'right',
    unknownTokens: unknownTokens.length ? unknownTokens : undefined,
    warnings: warnings.length ? warnings : undefined,
  };
}

export function composeDefenseCall(draft: DefenseDraft): string {
  const front = FRONTS.find((f) => f.id === draft.frontId);
  const parts: string[] = [];
  if (front) {
    // Prefer base name + shift when front id already encodes shift
    if (draft.shift && front.shift === draft.shift) {
      parts.push(front.name);
    } else if (draft.shift && !front.name.toLowerCase().includes(draft.shift)) {
      parts.push(front.name, draft.shift.charAt(0).toUpperCase() + draft.shift.slice(1));
    } else {
      parts.push(front.name);
    }
  } else {
    parts.push(draft.frontId);
  }
  if (draft.coverageId) {
    const cov = COVERAGES.find((c) => c.id === draft.coverageId);
    if (cov) parts.push(cov.name);
  }
  if (draft.pressureId && draft.pressureId !== 'base') {
    const press = PRESSURES.find((p) => p.id === draft.pressureId);
    if (press) parts.push(press.name);
  }
  return parts.join(' ').trim();
}

export function defaultDefenseDraft(): DefenseDraft {
  return {
    frontId: '4-3',
    coverageId: 'cover-3',
    pressureId: 'base',
    strength: 'right',
    vsPlaycall: 'Gun Doubles Right 62 Slant-Flat',
  };
}

export function defenseDraftFromAst(
  ast: DefenseCallAst,
  extras?: Partial<DefenseDraft>,
): DefenseDraft {
  return {
    frontId: ast.frontId,
    coverageId: ast.coverageId,
    pressureId: ast.pressureId ?? 'base',
    shift: ast.shift,
    strength: ast.strength,
    vsPlaycall: extras?.vsPlaycall,
    ...extras,
  };
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

function findDefBySlot(players: Player[], slot: string): Player | undefined {
  return players.find((p) => p.slot === slot && p.side === 'def');
}

function findOffBySlot(players: Player[], slot: string): Player | undefined {
  return players.find((p) => p.slot === slot && p.side === 'off');
}

function absolutePath(
  startX: number,
  startY: number,
  waypoints: { x: number; y: number }[],
  strength: Strength,
): { x: number; y: number }[] {
  return waypoints.map((wp) => ({
    x: startX + mirrorX(wp.x, strength),
    y: startY + wp.y,
  }));
}

function assignmentLabel(a: DefenderAssignment): string {
  return a.label ?? a.kind.charAt(0).toUpperCase() + a.kind.slice(1);
}

function pushAssignmentArrow(
  arrows: SceneArrow[],
  player: Player,
  assignment: DefenderAssignment,
  strength: Strength,
  idPrefix: string,
  color: string,
) {
  const existing = arrows.findIndex((a) => a.playerId === player.id);
  if (existing >= 0) arrows.splice(existing, 1);

  if (assignment.kind === 'man' || assignment.kind === 'press' || assignment.kind === 'spy') {
    // Man-match line drawn later once offense is present
    return;
  }

  const path =
    assignment.path ??
    (assignment.kind === 'zone'
      ? [
          { x: 0, y: 0 },
          { x: 0, y: 3 },
        ]
      : [
          { x: 0, y: 0 },
          { x: 0, y: -2.5 },
        ]);

  arrows.push({
    id: `${idPrefix}-${player.slot ?? player.id}`,
    playerId: player.id,
    points: absolutePath(player.x, player.y, path, strength),
    curve: 'rounded',
    arrowhead: assignment.kind === 'zone' ? 'none' : 'arrow',
    color,
    label: assignmentLabel(assignment),
  });

  if (assignment.gap != null) {
    // gap labels collected by caller
  }
}

/** Resolve a defensive call into a flipped PlayScene with optional ghost offense. */
export function resolveDefense(
  ast: DefenseCallAst,
  options: ResolveDefenseOptions = {},
): PlayScene {
  const strength = options.strength ?? ast.strength;
  const front = FRONTS.find((f) => f.id === ast.frontId);
  if (!front) {
    throw new PlaycallError(`Unknown front "${ast.frontId}"`, 0, ast.frontId);
  }

  const defenders = playersFromFront(ast.frontId, strength);
  const arrows: SceneArrow[] = [];
  const zones: SceneZone[] = [];
  const gapLabels: GapLabel[] = [];
  const annotations: PlayScene['annotations'] = [];

  // Ghost offense keeps standard field coords (offense backfield = negative y).
  // Viewport.flipped alone provides the defense-at-bottom perspective — do not
  // negate Y here or both sides pile into the same half of the field.
  let offense: Player[] = [];
  if (options.vsPlaycall) {
    try {
      const offScene = resolvePlay(parsePlaycall(options.vsPlaycall), {
        includeDefense: false,
      });
      // Skip OL ghosts — they sit on the LOS and cover the defensive front.
      const OL = new Set(['LT', 'LG', 'C', 'RG', 'RT']);
      offense = offScene.players
        .filter((p) => p.side === 'off' && !OL.has(p.position))
        .map((p) => ({
          ...p,
          id: `ghost-${p.id}`,
          colorKey: p.colorKey,
        }));
      // Ghost route arrows only — skip OL protection / line-block arrows (T-bars on the LOS).
      const ghostIds = new Set(offense.map((p) => p.id));
      for (const a of offScene.arrows) {
        if (a.id.startsWith('line-')) continue;
        if (a.arrowhead === 'block') continue;
        const ghostPlayerId = a.playerId ? `ghost-${a.playerId}` : undefined;
        if (ghostPlayerId && !ghostIds.has(ghostPlayerId)) continue;
        arrows.push({
          ...a,
          id: `ghost-${a.id}`,
          playerId: ghostPlayerId,
          color: 'rgba(232,246,74,0.35)',
        });
      }
    } catch {
      /* ignore bad vs look */
    }
  }

  const coverage = ast.coverageId
    ? COVERAGES.find((c) => c.id === ast.coverageId)
    : undefined;
  const pressure = ast.pressureId
    ? PRESSURES.find((p) => p.id === ast.pressureId)
    : undefined;

  // Merge coverage + pressure assignments (pressure wins on conflict for rush/blitz)
  const merged: Record<string, DefenderAssignment> = {
    ...(coverage?.assignments ?? {}),
    ...(pressure && pressure.id !== 'base' ? pressure.assignments : {}),
  };

  // Zones from coverage
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
        color: 'rgba(255,255,255,0.22)',
        owner: zone.owner,
      });
    }
  }

  // Apply merged assignments
  for (const [slot, assignment] of Object.entries(merged)) {
    const player = findDefBySlot(defenders, slot);
    if (!player) continue;

    if (assignment.kind === 'man' || assignment.kind === 'press' || assignment.kind === 'spy') {
      const targetSlot = assignment.target;
      const target = targetSlot
        ? findOffBySlot(offense, targetSlot) ??
          // Fall back to unlabeled point toward typical receiver depth
          undefined
        : undefined;
      if (target) {
        arrows.push({
          id: `man-${slot}-${targetSlot}`,
          playerId: player.id,
          points: [
            { x: player.x, y: player.y },
            { x: target.x, y: target.y },
          ],
          curve: 'straight',
          arrowhead: 'none',
          color: assignment.kind === 'press' ? '#f08a24' : '#6bd6cf',
          label: assignmentLabel(assignment),
        });
      } else {
        // Drop toward LOS as a placeholder man arrow
        arrows.push({
          id: `man-${slot}`,
          playerId: player.id,
          points: absolutePath(
            player.x,
            player.y,
            [
              { x: 0, y: 0 },
              { x: 0, y: -2 },
            ],
            strength,
          ),
          curve: 'straight',
          arrowhead: 'none',
          color: '#6bd6cf',
          label: assignmentLabel(assignment),
        });
      }
      continue;
    }

    const color =
      assignment.kind === 'blitz'
        ? '#ef6e5a'
        : assignment.kind === 'rush'
          ? '#f0a55d'
          : '#9ab0c8';
    pushAssignmentArrow(arrows, player, assignment, strength, `def-${assignment.kind}`, color);

    if (assignment.gap != null && !gapLabels.some((g) => g.gap === assignment.gap)) {
      gapLabels.push({
        gap: assignment.gap,
        x: mirrorX(gapX(assignment.gap), strength),
        y: 0.6,
        text: String(assignment.gap),
      });
    }
  }

  // Builder overrides (def: prefixed)
  if (options.assignments) {
    for (const [slot, ov] of Object.entries(options.assignments)) {
      const player = findDefBySlot(defenders, slot);
      if (!player) continue;
      if (ov.routeId === NO_ROUTE_ID) {
        for (let i = arrows.length - 1; i >= 0; i--) {
          if (arrows[i].playerId === player.id) arrows.splice(i, 1);
        }
        continue;
      }
      if (ov.routeId.startsWith('def:')) {
        const opt = findBlockOption(ov.routeId);
        if (!opt) continue;
        const existing = arrows.findIndex((a) => a.playerId === player.id);
        if (existing >= 0) arrows.splice(existing, 1);
        arrows.push({
          id: `assign-${slot}-${opt.id.replace(':', '-')}`,
          playerId: player.id,
          points: absolutePath(player.x, player.y, opt.path, strength),
          curve: 'rounded',
          arrowhead: opt.id.includes('zone') || opt.id.includes('man') ? 'none' : 'arrow',
          color: opt.id.includes('blitz')
            ? '#ef6e5a'
            : opt.id.includes('rush')
              ? '#f0a55d'
              : '#9ab0c8',
          label: opt.label,
        });
      }
    }
  }

  // Ghosts first so defenders (especially the front) paint on top near the LOS.
  const players = [...offense, ...defenders];
  players.sort((a, b) => {
    const ag = a.id.startsWith('ghost-') ? 0 : 1;
    const bg = b.id.startsWith('ghost-') ? 0 : 1;
    if (ag !== bg) return ag - bg;
    return a.id.localeCompare(b.id);
  });
  arrows.sort((a, b) => a.id.localeCompare(b.id));
  zones.sort((a, b) => a.id.localeCompare(b.id));
  gapLabels.sort((a, b) => a.gap - b.gap || a.x - b.x);

  const titleSegments: TitleSegment[] = [{ text: ast.raw, tone: 'default' }];

  return {
    title: ast.raw,
    titleSegments,
    players,
    arrows,
    zones,
    annotations,
    gapLabels,
    flipped: true,
  };
}

export function buildDefense(
  call: string,
  options?: ResolveDefenseOptions,
): PlayScene {
  return resolveDefense(parseDefenseCall(call), options);
}
