import { buildPlay, buildDefense, parsePlaycall, parseDefenseCall } from '@/src/core/parser';
import type { PlayScene, PositionId } from '@/src/core/schema';
import { CONCEPTS, findConcept } from '@/src/data/concepts';
import { FORMATIONS, findFormation } from '@/src/data/formations';
import { FRONTS, findFront } from '@/src/data/fronts';
import { COVERAGES, findCoverage } from '@/src/data/coverages';
import { PRESSURES, findPressure } from '@/src/data/pressures';
import type { AssignmentOverride } from '@/src/core/parser';
import type { PlaySide } from '@/src/training/types';

export type DerivedPlayMeta = {
  formation: string;
  concept: string;
  personnel: string;
  scene: PlayScene | null;
  side: PlaySide;
  front?: string;
  coverage?: string;
  pressure?: string;
};

function isRb(position: PositionId): boolean {
  return position === 'RB' || position === 'FB';
}

function isTe(position: PositionId): boolean {
  return position === 'TE' || position === 'Y';
}

function isWr(position: PositionId): boolean {
  return position === 'X' || position === 'Z' || position === 'H' || position === 'WR';
}

/** Traditional personnel: RBs (incl FB) then TEs. */
export function personnelFromScene(scene: PlayScene): string {
  const offense = scene.players.filter((p) => p.side === 'off');
  const rbs = offense.filter((p) => isRb(p.position)).length;
  const tes = offense.filter((p) => isTe(p.position)).length;
  // Sanity: if neither skill group found, fall back to WR-based estimate
  if (rbs === 0 && tes === 0) {
    const wrs = offense.filter((p) => isWr(p.position)).length;
    const inferredRb = Math.max(0, 5 - wrs);
    return `${Math.min(2, inferredRb)}0`;
  }
  return `${rbs}${tes}`;
}

export function offenseOnlyScene(scene: PlayScene): PlayScene {
  const offenseIds = new Set(
    scene.players.filter((p) => p.side === 'off').map((p) => p.id),
  );
  return {
    ...scene,
    players: scene.players.filter((p) => p.side === 'off'),
    arrows: scene.arrows.filter((a) => !a.playerId || offenseIds.has(a.playerId)),
    zones: [],
    gapLabels: scene.gapLabels,
  };
}

/**
 * Derive formation / concept / personnel from a playcall via the parser.
 * Returns a null scene when the call cannot be parsed.
 */
export function derivePlayMeta(
  playcall: string,
  assignments?: Record<string, AssignmentOverride>,
  side: PlaySide = 'off',
): DerivedPlayMeta {
  if (side === 'def') {
    try {
      const ast = parseDefenseCall(playcall);
      const front =
        findFront(ast.frontId)?.name ??
        FRONTS.find((f) => f.id === ast.frontId)?.name ??
        'Front';
      const coverage = ast.coverageId
        ? findCoverage(ast.coverageId)?.name ??
          COVERAGES.find((c) => c.id === ast.coverageId)?.name ??
          'Coverage'
        : 'Coverage';
      const pressure = ast.pressureId
        ? findPressure(ast.pressureId)?.name ??
          PRESSURES.find((p) => p.id === ast.pressureId)?.name
        : undefined;
      const scene = buildDefense(playcall, { assignments });
      return {
        formation: front,
        concept: coverage,
        personnel: '—',
        scene,
        side: 'def',
        front,
        coverage,
        pressure,
      };
    } catch {
      return {
        formation: 'Front',
        concept: 'Coverage',
        personnel: '—',
        scene: null,
        side: 'def',
      };
    }
  }

  try {
    const ast = parsePlaycall(playcall);
    const formation =
      findFormation(ast.formationId)?.name ??
      FORMATIONS.find((f) => f.id === ast.formationId)?.name ??
      'Formation';
    const concept =
      (ast.conceptId ? findConcept(ast.conceptId)?.name : undefined) ??
      CONCEPTS.find((c) => c.id === ast.conceptId)?.name ??
      (ast.routeDigits ? `Routes ${ast.routeDigits}` : undefined) ??
      (ast.run ? 'Run' : 'Concept');
    const scene = offenseOnlyScene(
      buildPlay(playcall, { includeDefense: false, assignments }),
    );
    return {
      formation,
      concept,
      personnel: personnelFromScene(scene),
      scene,
      side: 'off',
    };
  } catch {
    return {
      formation: 'Formation',
      concept: 'Concept',
      personnel: '11',
      scene: null,
      side: 'off',
    };
  }
}

export function tryBuildOffenseScene(
  playcall: string,
  assignments?: Record<string, AssignmentOverride>,
): PlayScene | null {
  return derivePlayMeta(playcall, assignments, 'off').scene;
}

export function tryBuildPlayScene(
  playcall: string,
  assignments?: Record<string, AssignmentOverride>,
  side: PlaySide = 'off',
  vsPlaycall?: string,
): PlayScene | null {
  if (side === 'def') {
    try {
      return buildDefense(playcall, { assignments, vsPlaycall });
    } catch {
      return null;
    }
  }
  return tryBuildOffenseScene(playcall, assignments);
}
