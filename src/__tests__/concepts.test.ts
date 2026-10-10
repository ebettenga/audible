import { parsePlaycall, buildPlay } from '@/src/core/parser';
import { scaleRouteToDepth } from '@/src/core/routeMath';
import { findRouteByName } from '@/src/data/routes';
import { CONCEPTS } from '@/src/data/concepts';

describe('concepts and depth scaling', () => {
  it('parses Ace Twins Right 62 Slant-Flat', () => {
    const ast = parsePlaycall('Ace Twins Right 62 Slant-Flat');
    expect(ast.formationId).toBe('ace-twins');
    expect(ast.strength).toBe('right');
    expect(ast.protectionId).toBe('62');
    expect(ast.conceptId).toBe('slant-flat');
  });

  it('resolves slant-flat routes for Y and Z', () => {
    const scene = buildPlay('Ace Twins Right 62 Slant-Flat', {
      includeDefense: false,
    });
    const labels = scene.arrows.map((a) => a.label);
    expect(labels).toEqual(expect.arrayContaining(['Slant', 'Flat']));
    expect(scene.titleSegments?.some((s) => s.tone === 'accent')).toBe(true);
  });

  it('assignment overrides replace concept routes', () => {
    const scene = buildPlay('Ace Twins Right 62 Slant-Flat', {
      includeDefense: false,
      assignments: { z: { routeId: 'go', depth: 15 } },
    });
    const zArrow = scene.arrows.find((a) => a.id.includes('-z-'));
    expect(zArrow?.label).toBe('Go / Fly');
  });

  it('scales route depth proportionally', () => {
    const slant = findRouteByName('slant')!;
    const scaled = scaleRouteToDepth(slant, 14);
    const maxY = scaled.reduce((m, p) => Math.max(m, p.y), 0);
    expect(maxY).toBeCloseTo(14, 5);
  });

  it('lists expected concepts', () => {
    expect(CONCEPTS.map((c) => c.id)).toEqual(
      expect.arrayContaining(['slant-flat', 'four-verticals', 'mesh']),
    );
  });
});
