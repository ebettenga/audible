/** Field coordinate system. Units are yards. Pure TypeScript — no RN imports. */

export type Strength = 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  width: number;
  height: number;
  /** Yards of field shown downfield of LOS */
  downfieldYards?: number;
  /** Yards of field shown in the backfield */
  backfieldYards?: number;
  /** Horizontal yards from center to either sideline edge of view */
  halfWidthYards?: number;
  /**
   * `linear` is true-to-scale yardage (flashcard diagrams).
   * `stylized` exaggerates the box and compresses the deep field the way the
   * Figma play surface lays players out (OL ~6% apart, WRs at ~9%/91%).
   */
  projection?: 'linear' | 'stylized';
  /**
   * When true, flip the field so defense sits at the bottom facing upfield
   * (defense-perspective view).
   */
  flipped?: boolean;
}

/** Tuning for the stylized (Figma-like) projection. */
export const STYLIZED = {
  /** Yards either side of center that get the exaggerated "box" scale */
  boxYards: 5,
  /** Fraction of the half-width those box yards occupy */
  boxFrac: 0.4,
  /** Downfield yards that get the exaggerated near-LOS scale */
  nearYards: 5,
  /** Fraction of the downfield pixels those near yards occupy */
  nearFrac: 0.36,
  /** Fraction of the view height below the LOS */
  backfieldFrac: 0.44,
  /**
   * Neutral zone between y=0 (OL) and any downfield player.
   * Figma puts the DL ~9% of the field above the offense.
   */
  losGapFrac: 0.05,
} as const;

function stylizedFrac(a: number, knee: number, kneeFrac: number, max: number): number {
  if (a <= knee) return (a / knee) * kneeFrac;
  const rest = Math.max(max - knee, 0.0001);
  return kneeFrac + ((a - knee) / rest) * (1 - kneeFrac);
}

export const FIELD = {
  /** Full field width between sidelines */
  widthYards: 53.333,
  /** Hash marks from center (NCAA ~6.17 yd each side; NFL ~3.08) */
  hashFromCenter: 6.17,
  /** Approximate OL player spacing */
  olSplit: 1.5,
  /** Default view extents */
  defaultDownfield: 25,
  defaultBackfield: 12,
  defaultHalfWidth: 28,
} as const;

/**
 * Even-numbered gaps on the right (offense facing downfield):
 * 0 = between C and LG, 2 = LG-LT, 4 = C-RG, 6 = RG-RT, 8 = RT-TE/Y, ...
 * Odd numbers are the defender head-up techniques; we label even holes for run plays.
 */
export const GAP_NUMBERS = {
  leftA: 1,
  leftB: 3,
  leftC: 5,
  leftD: 7,
  rightA: 4,
  rightB: 6,
  rightC: 8,
  rightD: 9,
} as const;

/** X of a gap label along the LOS, authored for strength-right. */
export function gapX(gap: number): number {
  const s = FIELD.olSplit;
  switch (gap) {
    case 0:
      return -s * 0.5;
    case 1:
      return -s;
    case 2:
      return -s * 1.5;
    case 3:
      return -s * 2.5;
    case 4:
      return s * 0.5;
    case 5:
      return -s * 3.5;
    case 6:
      return s * 1.5;
    case 7:
      return -s * 4.5;
    case 8:
      return s * 2.5;
    case 9:
      return s * 3.5;
    default:
      return 0;
  }
}

/** Mirror a point across the center for strength-left. */
export function mirrorX(x: number, strength: Strength): number {
  return strength === 'left' ? -x : x;
}

export function mirrorPoint(p: Point, strength: Strength): Point {
  return { x: mirrorX(p.x, strength), y: p.y };
}

export interface ScreenPoint {
  sx: number;
  sy: number;
}

/**
 * Map yards → SVG pixels.
 * Offense sits toward the bottom of the view; positive field y (downfield)
 * maps upward on screen (decreasing sy).
 */
export function toScreen(x: number, y: number, viewport: Viewport): ScreenPoint {
  const downfield = viewport.downfieldYards ?? FIELD.defaultDownfield;
  const backfield = viewport.backfieldYards ?? FIELD.defaultBackfield;
  const halfWidth = viewport.halfWidthYards ?? FIELD.defaultHalfWidth;
  // Defense perspective: swap axes so positive y (downfield from offense)
  // appears toward the top of a defense-at-bottom view via negation + swap extents.
  const fx = viewport.flipped ? -x : x;
  const fy = viewport.flipped ? -y : y;
  const viewDown = viewport.flipped ? backfield : downfield;
  const viewBack = viewport.flipped ? downfield : backfield;

  if (viewport.projection === 'stylized') {
    const losY = viewport.height * (1 - STYLIZED.backfieldFrac);
    const losGap = viewport.height * STYLIZED.losGapFrac;
    const downH = Math.max(losY - losGap, 1);
    const backH = viewport.height - losY;
    const halfW = viewport.width / 2;
    const xFrac = stylizedFrac(Math.abs(fx), STYLIZED.boxYards, STYLIZED.boxFrac, halfWidth);
    const sx = halfW + Math.sign(fx) * xFrac * halfW;
    const sy =
      fy > 0
        ? losY -
          losGap -
          stylizedFrac(fy, STYLIZED.nearYards, STYLIZED.nearFrac, viewDown) * downH
        : fy < 0
          ? losY + Math.min(1, Math.abs(fy) / viewBack) * backH
          : losY;
    return { sx, sy };
  }

  const totalY = viewDown + viewBack;
  const pxPerYardX = viewport.width / (halfWidth * 2);
  const pxPerYardY = viewport.height / totalY;
  const centerX = viewport.width / 2;
  const losY = viewport.height - viewBack * pxPerYardY;

  return {
    sx: centerX + fx * pxPerYardX,
    sy: losY - fy * pxPerYardY,
  };
}

export function yardsToPixels(viewport: Viewport): { x: number; y: number } {
  const downfield = viewport.downfieldYards ?? FIELD.defaultDownfield;
  const backfield = viewport.backfieldYards ?? FIELD.defaultBackfield;
  const halfWidth = viewport.halfWidthYards ?? FIELD.defaultHalfWidth;
  return {
    x: viewport.width / (halfWidth * 2),
    y: viewport.height / (downfield + backfield),
  };
}

/** Absolute yard-line y positions for drawing (relative to LOS). */
export function yardLines(downfield: number, backfield: number, step = 5): number[] {
  const lines: number[] = [];
  for (let y = -Math.floor(backfield / step) * step; y <= downfield; y += step) {
    if (y === 0) continue; // LOS drawn separately
    lines.push(y);
  }
  return lines;
}

/** Yard-line number painted on the field (0–50) given yards from own goal. */
export function fieldNumber(yardsFromOwnGoal: number): number {
  const y = Math.round(yardsFromOwnGoal);
  if (y <= 0 || y >= 100) return 0;
  return y <= 50 ? y : 100 - y;
}

/** 10-yard field numbers visible in the current window, relative to the ball spot. */
export function yardNumberMarks(
  downfield: number,
  backfield: number,
  ballSpot = 25,
): { y: number; number: number }[] {
  const marks: { y: number; number: number }[] = [];
  const start = -Math.floor(backfield);
  const end = Math.floor(downfield);
  for (let y = start; y <= end; y++) {
    const pos = ballSpot + y;
    if (y === 0 || pos <= 0 || pos >= 100 || pos % 10 !== 0) continue;
    marks.push({ y, number: fieldNumber(pos) });
  }
  return marks;
}

export interface FieldMark {
  y: number;
  sy: number;
}

export interface FieldNumberMark extends FieldMark {
  number: number;
}

export interface FieldMarkings {
  losY: number;
  leftHashX: number;
  rightHashX: number;
  fiveYardLines: FieldMark[];
  hashes: FieldMark[];
  numbers: FieldNumberMark[];
  gridYards: FieldMark[];
  gridXs: number[];
}

/** Screen-space field chrome for the play drawing surface. */
export function fieldMarkings(
  viewport: Viewport,
  opts?: { ballSpot?: number; gridStep?: number },
): FieldMarkings {
  const downfield = viewport.downfieldYards ?? FIELD.defaultDownfield;
  const backfield = viewport.backfieldYards ?? FIELD.defaultBackfield;
  const halfWidth = viewport.halfWidthYards ?? FIELD.defaultHalfWidth;
  const ballSpot = opts?.ballSpot ?? 25;
  const gridStep = opts?.gridStep ?? 1;
  const los = toScreen(0, 0, viewport);

  return {
    losY: los.sy,
    leftHashX: toScreen(-FIELD.hashFromCenter, 0, viewport).sx,
    rightHashX: toScreen(FIELD.hashFromCenter, 0, viewport).sx,
    fiveYardLines: yardLines(downfield, backfield, 5).map((y) => ({
      y,
      sy: toScreen(0, y, viewport).sy,
    })),
    hashes: yardLines(downfield, backfield, 1).concat(0).map((y) => ({
      y,
      sy: toScreen(0, y, viewport).sy,
    })),
    numbers: yardNumberMarks(downfield, backfield, ballSpot).map((m) => ({
      ...m,
      sy: toScreen(0, m.y, viewport).sy,
    })),
    gridYards: yardLines(downfield, backfield, gridStep).map((y) => ({
      y,
      sy: toScreen(0, y, viewport).sy,
    })),
    gridXs: yardLines(halfWidth, halfWidth, 5).concat(0).map((x) => toScreen(x, 0, viewport).sx),
  };
}
