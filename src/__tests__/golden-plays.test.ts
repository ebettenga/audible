import { buildPlay, parsePlaycall, PlaycallError } from '@/src/core/parser';
import { mirrorX } from '@/src/core/field';
import { COVERAGES } from '@/src/data/coverages';
import { getZone } from '@/src/data/zones';

describe('golden: I Right 999 Y-Pop', () => {
  const scene = buildPlay('I Right 999 Y-Pop', { includeDefense: true });

  it('titles the scene with the playcall', () => {
    expect(scene.title).toBe('I Right 999 Y-Pop');
  });

  it('places OL, QB, FB, RB in I formation', () => {
    const labels = scene.players.filter((p) => p.side === 'off').map((p) => p.label);
    expect(labels).toEqual(
      expect.arrayContaining(['LT', 'LG', 'C', 'RG', 'RT', 'QB', 'FB', 'RB']),
    );
    const qb = scene.players.find((p) => p.slot === 'qb')!;
    const fb = scene.players.find((p) => p.slot === 'fb')!;
    const rb = scene.players.find((p) => p.slot === 'rb')!;
    expect(qb.y).toBeGreaterThan(fb.y); // QB closer to LOS (less negative... wait)
    // y: LOS=0, backfield negative. QB at -1.5, FB at -3.5, RB at -5.5
    expect(qb.y).toBeGreaterThan(fb.y);
    expect(fb.y).toBeGreaterThan(rb.y);
  });

  it('draws three go routes for X, Y, Z', () => {
    const routeArrows = scene.arrows.filter((a) => a.id.startsWith('route-'));
    expect(routeArrows).toHaveLength(3);
    expect(routeArrows.every((a) => a.label === 'Go / Fly')).toBe(true);
  });

  it('highlights Y as the concept tag', () => {
    const y = scene.players.find((p) => p.slot === 'y');
    expect(y?.highlight).toBe(true);
  });

  it('places Y to the right of RT (strength right)', () => {
    const y = scene.players.find((p) => p.slot === 'y')!;
    const rt = scene.players.find((p) => p.slot === 'rt')!;
    expect(y.x).toBeGreaterThan(rt.x);
  });
});

describe('golden: I Right Slot Fake 24 Lead 989 F Angle 68', () => {
  const playcall = 'I Right Slot Fake 24 Lead 989 F Angle 68';
  const scene = buildPlay(playcall, { includeDefense: true });

  it('parses formation as i-slot', () => {
    const ast = parsePlaycall(playcall);
    expect(ast.formationId).toBe('i-slot');
    expect(ast.run?.runId).toBe('24-lead');
    expect(ast.run?.isFake).toBe(true);
    expect(ast.routeDigits).toBe('989');
    expect(ast.protectionId).toBe('68');
    expect(ast.tags.some((t) => t.slot === 'fb' && t.routeId === 'angle')).toBe(true);
  });

  it('uses slot alignment for Z (inside)', () => {
    const z = scene.players.find((p) => p.slot === 'z')!;
    expect(Math.abs(z.x)).toBeLessThan(15);
  });

  it('draws FB lead (block) and RB fake paths', () => {
    const fbArrow = scene.arrows.find((a) => a.id.startsWith('run-fb'));
    const rbArrow = scene.arrows.find((a) => a.id.startsWith('run-rb'));
    expect(fbArrow).toBeDefined();
    expect(fbArrow?.arrowhead).toBe('block');
    expect(rbArrow).toBeDefined();
  });

  it('labels gaps 4, 6, 8', () => {
    const gaps = scene.gapLabels.map((g) => g.gap).sort();
    expect(gaps).toEqual([4, 6, 8]);
  });

  it('assigns 9/8/9 routes plus F angle', () => {
    const labels = scene.arrows.map((a) => a.label);
    expect(labels).toEqual(
      expect.arrayContaining(['Go / Fly', 'Post-Corner', 'Angle']),
    );
  });
});

describe('mirroring', () => {
  it('flips receiver X when strength is left', () => {
    const right = buildPlay('I Right 999', { includeDefense: false });
    const left = buildPlay('I Left 999', { includeDefense: false });
    const yR = right.players.find((p) => p.slot === 'y')!;
    const yL = left.players.find((p) => p.slot === 'y')!;
    expect(yL.x).toBe(mirrorX(yR.x, 'left'));
    expect(yL.x).toBeLessThan(0);
  });
});

describe('parser errors', () => {
  it('throws PlaycallError on unknown formation', () => {
    expect(() => parsePlaycall('Ziggurat Right 999')).toThrow(PlaycallError);
  });

  it('throws on unrecognized token when softUnknown is off', () => {
    expect(() => parsePlaycall('I Right Banana', { softUnknown: false })).toThrow(
      PlaycallError,
    );
  });

  it('soft-unknown records leftover tokens by default', () => {
    const ast = parsePlaycall('I Right Banana');
    expect(ast.formationId).toBe('i');
    expect(ast.unknownTokens).toEqual(expect.arrayContaining(['Banana']));
  });

  it('includes token index in the error', () => {
    expect.assertions(2);
    try {
      parsePlaycall('I Right Banana', { softUnknown: false });
    } catch (e) {
      expect(e).toBeInstanceOf(PlaycallError);
      expect((e as PlaycallError).token).toBe('Banana');
    }
  });
});

describe('coverage zones', () => {
  it('Cover 3 resolves to 3 deep + 4 under zones', () => {
    const cover3 = COVERAGES.find((c) => c.id === 'cover-3')!;
    expect(cover3.zones).toHaveLength(7);
    const deep = cover3.zones.filter((id) => id.includes('deep-third'));
    expect(deep).toHaveLength(3);
    const scene = buildPlay('I Right 999', {
      includeDefense: true,
      coverageId: 'cover-3',
    });
    expect(scene.zones).toHaveLength(7);
    for (const id of cover3.zones) {
      expect(getZone(id)).toBeDefined();
    }
  });

  it('Cover 2 has two deep halves', () => {
    const scene = buildPlay('I Right 999', {
      includeDefense: true,
      coverageId: 'cover-2',
    });
    const deepHalves = scene.zones.filter((z) => z.label === 'Deep ½');
    expect(deepHalves).toHaveLength(2);
  });
});

describe('determinism', () => {
  it('same playcall twice yields deep-equal scenes', () => {
    const a = buildPlay('I Right Slot Fake 24 Lead 989 F Angle 68', {
      includeDefense: true,
      coverageId: 'cover-3',
    });
    const b = buildPlay('I Right Slot Fake 24 Lead 989 F Angle 68', {
      includeDefense: true,
      coverageId: 'cover-3',
    });
    expect(a).toEqual(b);
  });
});
