import React, { useMemo } from 'react';
import { G, Path, Line } from 'react-native-svg';
import type { SceneArrow } from '@/src/core/schema';
import { toScreen, type Viewport } from '@/src/core/field';
import { FIELD_COLORS } from './colors';

export type ArrowVisualStyle = 'route' | 'alt' | 'motion';

export interface ArrowProps {
  arrow: SceneArrow;
  viewport: Viewport;
  /** Figma play-viewer look: thicker #e9f54f routes with bigger heads */
  variant?: 'diagram' | 'viewer';
  visualStyle?: ArrowVisualStyle;
}

type ScreenPt = { sx: number; sy: number };

function buildPath(pts: ScreenPt[], curve: SceneArrow['curve'], cornerR = 14): string {
  if (pts.length < 2) return '';
  if (pts.length === 2 || curve === 'straight') {
    return `M ${pts.map((p) => `${p.sx} ${p.sy}`).join(' L ')}`;
  }

  let d = `M ${pts[0].sx} ${pts[0].sy}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];

    const dx1 = curr.sx - prev.sx;
    const dy1 = curr.sy - prev.sy;
    const len1 = Math.hypot(dx1, dy1) || 1;
    const dx2 = next.sx - curr.sx;
    const dy2 = next.sy - curr.sy;
    const len2 = Math.hypot(dx2, dy2) || 1;

    const r = Math.min(cornerR, len1 * 0.45, len2 * 0.45);
    const before = {
      sx: curr.sx - (dx1 / len1) * r,
      sy: curr.sy - (dy1 / len1) * r,
    };
    const after = {
      sx: curr.sx + (dx2 / len2) * r,
      sy: curr.sy + (dy2 / len2) * r,
    };

    d += ` L ${before.sx} ${before.sy}`;
    d += ` Q ${curr.sx} ${curr.sy} ${after.sx} ${after.sy}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.sx} ${last.sy}`;
  return d;
}

function filledArrowHead(from: ScreenPt, to: ScreenPt, length: number, width: number): string {
  const angle = Math.atan2(to.sy - from.sy, to.sx - from.sx);
  const left = {
    sx: to.sx - length * Math.cos(angle) + (width / 2) * Math.sin(angle),
    sy: to.sy - length * Math.sin(angle) - (width / 2) * Math.cos(angle),
  };
  const right = {
    sx: to.sx - length * Math.cos(angle) - (width / 2) * Math.sin(angle),
    sy: to.sy - length * Math.sin(angle) + (width / 2) * Math.cos(angle),
  };
  return `M ${to.sx} ${to.sy} L ${left.sx} ${left.sy} L ${right.sx} ${right.sy} Z`;
}

function tipInset(from: ScreenPt, to: ScreenPt, inset: number): ScreenPt {
  const dx = to.sx - from.sx;
  const dy = to.sy - from.sy;
  const len = Math.hypot(dx, dy) || 1;
  const t = Math.max(0, 1 - inset / len);
  return { sx: from.sx + dx * t, sy: from.sy + dy * t };
}

function resolveVisual(
  arrow: SceneArrow,
  variant: 'diagram' | 'viewer',
  visualStyle?: ArrowVisualStyle,
): { color: string; strokeWidth: number; dash?: string; headLen: number; headWidth: number } {
  const style =
    visualStyle ??
    (arrow.arrowhead === 'block'
      ? 'alt'
      : arrow.color?.toLowerCase().includes('f1') || arrow.color?.toLowerCase().includes('fff')
        ? 'alt'
        : 'route');

  if (variant === 'viewer') {
    if (style === 'motion') {
      return {
        color: FIELD_COLORS.arrowAlt,
        strokeWidth: 2,
        dash: '6 8',
        headLen: 8,
        headWidth: 6,
      };
    }
    if (style === 'alt') {
      return {
        color: FIELD_COLORS.arrowAlt,
        strokeWidth: 3,
        headLen: 10,
        headWidth: 7.5,
      };
    }
    return {
      color: FIELD_COLORS.arrowViewer,
      strokeWidth: arrow.highlight ? 5.5 : 5,
      headLen: 14,
      headWidth: 11,
    };
  }

  // diagram / flashcard
  return {
    color: arrow.color || FIELD_COLORS.arrow,
    strokeWidth: arrow.highlight ? 4 : 3.25,
    headLen: 11,
    headWidth: 8.5,
  };
}

export function Arrow({ arrow, viewport, variant = 'viewer', visualStyle }: ArrowProps) {
  const screenPts = useMemo(
    () => arrow.points.map((p) => toScreen(p.x, p.y, viewport)),
    [arrow.points, viewport],
  );

  if (screenPts.length < 2) return null;

  const { color, strokeWidth, dash, headLen, headWidth } = resolveVisual(
    arrow,
    variant,
    visualStyle,
  );

  const tip = screenPts[screenPts.length - 1];
  const before = screenPts[screenPts.length - 2];
  const drawPts =
    arrow.arrowhead === 'arrow'
      ? [...screenPts.slice(0, -1), tipInset(before, tip, headLen * 0.55)]
      : screenPts;

  const d = buildPath(drawPts, arrow.curve, variant === 'viewer' ? 16 : 10);
  const head = filledArrowHead(before, tip, headLen, headWidth);

  const blockAngle = Math.atan2(tip.sy - before.sy, tip.sx - before.sx);
  const blockHalf = variant === 'viewer' ? 9 : 7;
  const blockLeft = {
    sx: tip.sx + blockHalf * Math.sin(blockAngle),
    sy: tip.sy - blockHalf * Math.cos(blockAngle),
  };
  const blockRight = {
    sx: tip.sx - blockHalf * Math.sin(blockAngle),
    sy: tip.sy + blockHalf * Math.cos(blockAngle),
  };

  return (
    <G>
      <Path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dash}
      />
      {arrow.arrowhead === 'arrow' && !dash ? (
        <Path d={head} fill={color} stroke={color} strokeWidth={0.5} strokeLinejoin="round" />
      ) : null}
      {arrow.arrowhead === 'block' ? (
        <Line
          x1={blockLeft.sx}
          y1={blockLeft.sy}
          x2={blockRight.sx}
          y2={blockRight.sy}
          stroke={color}
          strokeWidth={strokeWidth + 0.5}
          strokeLinecap="round"
        />
      ) : null}
    </G>
  );
}
