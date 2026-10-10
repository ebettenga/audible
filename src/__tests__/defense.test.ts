import {
  parseDefenseCall,
  composeDefenseCall,
  buildDefense,
  defaultDefenseDraft,
} from '@/src/core/parser';
import { generateCards } from '@/src/training/cards';
import { defenseAssignmentsFromScene } from '@/src/features/playbook/playAssignments';
import { derivePlayMeta } from '@/src/features/playbook/playMeta';

describe('defense parser', () => {
  it('parses front, coverage, and pressure', () => {
    const ast = parseDefenseCall('4-3 Over Cover 3 Fire Zone');
    expect(ast.frontId).toMatch(/4-3/);
    expect(ast.coverageId).toBe('cover-3');
    expect(ast.pressureId).toBe('fire-zone');
  });

  it('composes a readable call from a draft', () => {
    const call = composeDefenseCall({
      ...defaultDefenseDraft(),
      frontId: '4-3-over',
      coverageId: 'cover-3',
      pressureId: 'fire-zone',
    });
    expect(call.toLowerCase()).toContain('cover 3');
    expect(call.toLowerCase()).toContain('fire zone');
  });

  it('resolves a flipped scene with defenders across the LOS from ghost offense', () => {
    const scene = buildDefense('4-3 Cover 3', {
      vsPlaycall: 'Gun Doubles Right 62 Slant-Flat',
    });
    expect(scene.flipped).toBe(true);
    const defenders = scene.players.filter((p) => p.side === 'def');
    const ghosts = scene.players.filter((p) => p.id.startsWith('ghost-'));
    expect(defenders.length).toBeGreaterThan(0);
    expect(ghosts.length).toBeGreaterThan(0);
    // Standard field coords: defense downfield (y > 0), offense backfield (y <= 0)
    expect(defenders.every((p) => p.y > 0)).toBe(true);
    expect(ghosts.filter((p) => p.position === 'QB').every((p) => p.y < 0)).toBe(true);
    expect(scene.zones.length).toBeGreaterThan(0);
  });

  it('applies defender overrides', () => {
    const scene = buildDefense('4-3 Cover 3', {
      assignments: { mike: { routeId: 'def:blitz' } },
    });
    const mike = scene.players.find((p) => p.slot === 'mike');
    const arrow = scene.arrows.find((a) => a.playerId === mike?.id);
    expect(arrow?.label).toBe('Blitz');
  });
});

describe('defense play meta and assignments', () => {
  it('derives front and coverage for defensive calls', () => {
    const meta = derivePlayMeta('Nickel Cover 2', undefined, 'def');
    expect(meta.side).toBe('def');
    expect(meta.scene).not.toBeNull();
    expect(meta.front?.toLowerCase()).toContain('nickel');
    expect(meta.coverage?.toLowerCase()).toContain('cover 2');
  });

  it('builds defender assignment rows from a flipped scene', () => {
    const scene = buildDefense('4-3 Cover 1');
    const rows = defenseAssignmentsFromScene(scene);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.player && r.route)).toBe(true);
  });
});

describe('defense learning cards', () => {
  it('generates front, pressure, assignment, and read cards', () => {
    expect(generateCards('fronts').length).toBeGreaterThan(0);
    expect(generateCards('pressures').length).toBeGreaterThan(0);
    expect(generateCards('defender-assignments').length).toBeGreaterThan(0);
    const reads = generateCards('coverage-reads');
    expect(reads.length).toBeGreaterThanOrEqual(20);
    expect(reads.every((c) => c.type === 'beat-coverage')).toBe(true);
    expect(reads.every((c) => c.distractors.length >= 1)).toBe(true);
    expect(reads.every((c) => !!c.scene)).toBe(true);
    expect(reads.every((c) => (c.scene?.arrows.length ?? 0) === 0)).toBe(true);
  });

  it('generates zone cards with a single highlighted unlabeled zone', () => {
    const zones = generateCards('zones');
    expect(zones.length).toBeGreaterThanOrEqual(10);
    expect(zones.every((c) => c.type === 'name-zone')).toBe(true);
    expect(zones.every((c) => c.distractors.length >= 1)).toBe(true);
    for (const card of zones) {
      expect(card.scene).toBeTruthy();
      expect(card.scene!.zones).toHaveLength(1);
      expect(card.scene!.zones[0].highlight).toBe(true);
      expect(card.scene!.zones[0].label).toBe('');
      expect(card.scene!.flipped).toBe(true);
    }
  });
});
