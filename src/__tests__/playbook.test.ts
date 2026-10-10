import { derivePlayMeta, personnelFromScene } from '@/src/features/playbook/playMeta';
import { assignmentsFromScene } from '@/src/features/playbook/playAssignments';
import { buildPlay } from '@/src/core/parser';

describe('playMeta', () => {
  it('derives formation, concept, and personnel from a playcall', () => {
    const meta = derivePlayMeta('Ace Twins Right 62 Slant-Flat');
    expect(meta.scene).not.toBeNull();
    expect(meta.formation.toLowerCase()).toContain('ace');
    expect(meta.concept.toLowerCase()).toMatch(/slant|flat/);
    expect(meta.personnel).toMatch(/^\d\d$/);
  });

  it('returns null scene for garbage playcalls', () => {
    const meta = derivePlayMeta('not a real playcall xyz');
    expect(meta.scene).toBeNull();
  });

  it('counts personnel from offense players', () => {
    const scene = buildPlay('Ace Twins Right 62 Slant-Flat', { includeDefense: false });
    const code = personnelFromScene(scene);
    expect(code).toMatch(/^\d\d$/);
  });
});

describe('playAssignments', () => {
  it('builds one assignment row per offensive player', () => {
    const scene = buildPlay('Ace Twins Right 62 Slant-Flat', { includeDefense: false });
    const rows = assignmentsFromScene(scene);
    expect(rows.length).toBe(scene.players.filter((p) => p.side === 'off').length);
    expect(rows.some((r) => r.kind === 'Route' || r.kind === 'Protection' || r.kind === 'QB')).toBe(
      true,
    );
  });

  it('applies builder overrides for linemen and backs', () => {
    const scene = buildPlay('I Right 26 Lead', {
      includeDefense: false,
      assignments: {
        rg: { routeId: 'line:pull-right' },
        rb: { routeId: 'back:pass-block' },
      },
    });
    const rows = assignmentsFromScene(scene);
    expect(rows.find((r) => r.player === 'RG')?.route).toBe('Pull Right');
    expect(rows.find((r) => r.player === 'RB')?.route).toBe('Pass Block');
    expect(scene.arrows.filter((a) => a.id.startsWith('run-rb'))).toHaveLength(0);
  });

  it('generates assignments for all five linemen on pass and run plays', () => {
    const pass = assignmentsFromScene(
      buildPlay('Ace Twins Right 62 Slant-Flat', { includeDefense: false }),
    );
    const linePass = pass.filter((r) => ['LT', 'LG', 'C', 'RG', 'RT'].includes(r.player));
    expect(linePass).toHaveLength(5);
    expect(linePass.every((r) => r.kind === 'Protection')).toBe(true);

    const run = assignmentsFromScene(
      buildPlay('I Right 26 Lead', { includeDefense: false }),
    );
    const lineRun = run.filter((r) => ['LT', 'LG', 'C', 'RG', 'RT'].includes(r.player));
    expect(lineRun).toHaveLength(5);
    expect(lineRun.every((r) => r.kind === 'Block')).toBe(true);
    expect(lineRun.some((r) => r.route === 'Pull')).toBe(true);
  });
});
