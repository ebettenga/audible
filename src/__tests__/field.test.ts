import {
  toScreen,
  mirrorX,
  gapX,
  yardLines,
  fieldNumber,
  yardNumberMarks,
  fieldMarkings,
} from '@/src/core/field';

describe('field coordinates', () => {
  const viewport = { width: 360, height: 400, downfieldYards: 25, backfieldYards: 12, halfWidthYards: 28 };

  it('maps center LOS to horizontal midpoint', () => {
    const p = toScreen(0, 0, viewport);
    expect(p.sx).toBeCloseTo(180);
  });

  it('maps positive y (downfield) above the LOS on screen', () => {
    const los = toScreen(0, 0, viewport);
    const downfield = toScreen(0, 10, viewport);
    expect(downfield.sy).toBeLessThan(los.sy);
  });

  it('maps negative y (backfield) below the LOS on screen', () => {
    const los = toScreen(0, 0, viewport);
    const back = toScreen(0, -5, viewport);
    expect(back.sy).toBeGreaterThan(los.sy);
  });

  it('mirrors x for strength left', () => {
    expect(mirrorX(5, 'right')).toBe(5);
    expect(mirrorX(5, 'left')).toBe(-5);
  });

  it('places gap 4 to the right of center', () => {
    expect(gapX(4)).toBeGreaterThan(0);
    expect(gapX(6)).toBeGreaterThan(gapX(4));
    expect(gapX(8)).toBeGreaterThan(gapX(6));
  });

  it('spreads the box in the stylized Figma projection', () => {
    const stylized = { ...viewport, projection: 'stylized' as const };
    const center = toScreen(0, 0, stylized);
    const tackle = toScreen(-3, 0, stylized);
    const linearTackle = toScreen(-3, 0, viewport);
    expect(center.sx).toBeCloseTo(180);
    expect(center.sy / stylized.height).toBeCloseTo(0.56);
    const dl = toScreen(0, 0.8, stylized);
    // DL sits a clear row above the OL (Figma ~9% of field height)
    expect(center.sy - dl.sy).toBeGreaterThan(stylized.height * 0.045);
    expect(center.sy - dl.sy).toBeLessThan(stylized.height * 0.09);
    // OL sits farther from center than true-to-scale yards
    expect(Math.abs(tackle.sx - center.sx)).toBeGreaterThan(
      Math.abs(linearTackle.sx - 180),
    );
  });

  it('generates yard lines excluding LOS', () => {
    const lines = yardLines(20, 10, 5);
    expect(lines).not.toContain(0);
    expect(lines).toContain(5);
    expect(lines).toContain(-5);
  });

  it('maps field numbers from own-goal yardage', () => {
    expect(fieldNumber(20)).toBe(20);
    expect(fieldNumber(50)).toBe(50);
    expect(fieldNumber(70)).toBe(30);
    expect(fieldNumber(0)).toBe(0);
  });

  it('places 10-yard numbers relative to the ball spot', () => {
    const marks = yardNumberMarks(25, 12, 25);
    expect(marks.find((m) => m.y === 5)?.number).toBe(30);
    expect(marks.find((m) => m.y === -5)?.number).toBe(20);
    expect(marks.find((m) => m.y === 15)?.number).toBe(40);
    expect(marks.some((m) => m.y === 0)).toBe(false);
  });

  it('projects LOS and hashes into screen space', () => {
    const stylized = { ...viewport, projection: 'stylized' as const };
    const marks = fieldMarkings(stylized, { ballSpot: 25 });
    expect(marks.losY / stylized.height).toBeCloseTo(0.56);
    expect(marks.leftHashX).toBeLessThan(stylized.width / 2);
    expect(marks.rightHashX).toBeGreaterThan(stylized.width / 2);
    expect(marks.fiveYardLines.some((l) => l.y === 5)).toBe(true);
    expect(marks.numbers.some((n) => n.number === 30)).toBe(true);
  });
});
