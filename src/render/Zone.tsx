import React from 'react';
import { G, Ellipse, Rect, Polygon, Text as SvgText } from 'react-native-svg';
import type { SceneZone } from '@/src/core/schema';
import { toScreen, type Viewport } from '@/src/core/field';

export interface ZoneProps {
  zone: SceneZone;
  viewport: Viewport;
}

export function Zone({ zone, viewport }: ZoneProps) {
  const g = zone.geometry;
  const highlighted = !!zone.highlight;
  const color =
    zone.color ||
    (highlighted ? 'rgba(201,242,91,0.42)' : 'rgba(255,255,255,0.2)');
  const stroke = highlighted ? 'rgba(201,242,91,0.95)' : 'rgba(255,255,255,0.35)';
  const strokeWidth = highlighted ? 2.5 : 1;
  const showLabel = !!zone.label;

  if (zone.shape === 'ellipse' && g.x != null && g.y != null) {
    const c = toScreen(g.x, g.y, viewport);
    const right = toScreen(g.x + (g.rx ?? 5), g.y, viewport);
    const top = toScreen(g.x, g.y + (g.ry ?? 4), viewport);
    const rx = Math.abs(right.sx - c.sx);
    const ry = Math.abs(c.sy - top.sy);
    return (
      <G>
        <Ellipse
          cx={c.sx}
          cy={c.sy}
          rx={rx}
          ry={ry}
          fill={color}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        {showLabel ? (
          <SvgText
            x={c.sx}
            y={c.sy + 4}
            fill="#fff"
            fontSize={11}
            fontWeight="600"
            textAnchor="middle"
            opacity={0.9}
          >
            {zone.label}
          </SvgText>
        ) : null}
      </G>
    );
  }

  if (zone.shape === 'rect' && g.x != null && g.y != null && g.w != null && g.h != null) {
    const topLeft = toScreen(g.x - g.w / 2, g.y + g.h / 2, viewport);
    const bottomRight = toScreen(g.x + g.w / 2, g.y - g.h / 2, viewport);
    const w = bottomRight.sx - topLeft.sx;
    const h = bottomRight.sy - topLeft.sy;
    return (
      <G>
        <Rect
          x={topLeft.sx}
          y={topLeft.sy}
          width={w}
          height={h}
          fill={color}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={4}
        />
        {showLabel ? (
          <SvgText
            x={topLeft.sx + w / 2}
            y={topLeft.sy + h / 2 + 4}
            fill="#fff"
            fontSize={11}
            fontWeight="600"
            textAnchor="middle"
          >
            {zone.label}
          </SvgText>
        ) : null}
      </G>
    );
  }

  if (zone.shape === 'polygon' && g.points && g.points.length >= 3) {
    const pts = g.points
      .map((p) => {
        const s = toScreen(p.x, p.y, viewport);
        return `${s.sx},${s.sy}`;
      })
      .join(' ');
    const centroid = g.points.reduce(
      (acc, p) => ({ x: acc.x + p.x / g.points!.length, y: acc.y + p.y / g.points!.length }),
      { x: 0, y: 0 },
    );
    const c = toScreen(centroid.x, centroid.y, viewport);
    return (
      <G>
        <Polygon points={pts} fill={color} stroke={stroke} strokeWidth={strokeWidth} />
        {showLabel ? (
          <SvgText x={c.sx} y={c.sy + 4} fill="#fff" fontSize={11} fontWeight="600" textAnchor="middle">
            {zone.label}
          </SvgText>
        ) : null}
      </G>
    );
  }

  return null;
}
