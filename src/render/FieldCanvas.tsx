import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import Svg from 'react-native-svg';
import type { PlayScene, Player } from '@/src/core/schema';
import { FIELD, fieldMarkings, toScreen, type Viewport } from '@/src/core/field';
import { FieldPlayer } from './FieldPlayer';
import { Arrow } from './Arrow';
import { Zone } from './Zone';
import { Label } from './Label';
import { FIELD_COLORS } from './colors';
import { colors } from '@/src/design/tokens';

export interface FieldCanvasProps {
  scene: PlayScene;
  width?: number;
  height?: number;
  showLabels?: boolean;
  hiddenPlayerIds?: string[];
  showTitle?: boolean;
  showYardNumbers?: boolean;
  showHashes?: boolean;
  showGrid?: boolean;
  showZones?: boolean;
  showDefense?: boolean;
  routesVisible?: boolean;
  selectedPlayerId?: string | null;
  interactive?: boolean;
  compact?: boolean;
  showCaption?: boolean;
  caption?: string;
  ballSpot?: number;
  downfieldYards?: number;
  backfieldYards?: number;
  halfWidthYards?: number;
  /** Flip the field so defense sits at the bottom. Defaults to scene.flipped. */
  flipped?: boolean;
  onPlayerPress?: (player: Player) => void;
  /**
   * @deprecated The dashboard viewer is the only play surface.
   * Kept so older call sites compile; ignored.
   */
  variant?: 'diagram' | 'viewer';
}

const WEB_TURF: ViewStyle =
  Platform.OS === 'web'
    ? ({
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.035) 50%, transparent 50%), repeating-linear-gradient(90deg, transparent 0 8.25%, rgba(236,244,226,0.16) 8.35% 8.6%, transparent 8.7% 16.5%)',
        backgroundSize: '100% 80px, 100% 100%',
      } as ViewStyle)
    : {};

function useFieldLayout(
  propWidth: number | undefined,
  propHeight: number,
  extents: {
    downfieldYards: number;
    backfieldYards: number;
    halfWidthYards: number;
    flipped?: boolean;
  },
) {
  const [layoutWidth, setLayoutWidth] = React.useState(propWidth ?? 360);
  const onLayout = (e: LayoutChangeEvent) => {
    if (propWidth) return;
    const w = e.nativeEvent.layout.width;
    if (w > 0) setLayoutWidth(w);
  };
  const width = propWidth ?? layoutWidth;
  const height = propHeight;
  const viewport: Viewport = useMemo(
    () => ({
      width,
      height,
      downfieldYards: extents.downfieldYards,
      backfieldYards: extents.backfieldYards,
      halfWidthYards: extents.halfWidthYards,
      projection: 'stylized',
      flipped: extents.flipped,
    }),
    [
      width,
      height,
      extents.downfieldYards,
      extents.backfieldYards,
      extents.halfWidthYards,
      extents.flipped,
    ],
  );
  return { width, height, viewport, onLayout };
}

/** Shared play drawing surface used by the builder, playbook, and training. */
export function FieldCanvas({
  scene,
  width: propWidth,
  height: propHeight = 420,
  showLabels = true,
  hiddenPlayerIds = [],
  showTitle = false,
  showYardNumbers,
  showHashes,
  showGrid = false,
  showZones = true,
  showDefense = true,
  routesVisible = true,
  selectedPlayerId,
  interactive = false,
  compact = false,
  showCaption,
  caption,
  ballSpot = 25,
  downfieldYards = FIELD.defaultDownfield,
  backfieldYards = FIELD.defaultBackfield,
  halfWidthYards = FIELD.defaultHalfWidth,
  flipped,
  onPlayerPress,
}: FieldCanvasProps) {
  const isFlipped = flipped ?? scene.flipped ?? false;
  const { width, height, viewport, onLayout } = useFieldLayout(propWidth, propHeight, {
    downfieldYards,
    backfieldYards,
    halfWidthYards,
    flipped: isFlipped,
  });
  const hidden = useMemo(() => new Set(hiddenPlayerIds), [hiddenPlayerIds]);
  const marks = useMemo(
    () => fieldMarkings(viewport, { ballSpot, gridStep: 1 }),
    [viewport, ballSpot],
  );
  const chipW = compact ? 27 : 33;
  const chipH = compact ? 24 : 28;
  const native = Platform.OS !== 'web';
  const hashesOn = showHashes ?? !compact;
  const numbersOn = showYardNumbers ?? !compact;
  const captionOn = showCaption ?? !compact;
  const captionText = caption ?? (showTitle ? scene.title : undefined);
  const numSize = compact ? 18 : Math.min(34, Math.max(22, height * 0.075));

  const players = scene.players
    .filter((p) => {
      if (hidden.has(p.id)) return false;
      if (!showDefense && p.side === 'def') return false;
      return true;
    })
    // Paint order: ghosts under offense under defense (front stays visible on LOS)
    .slice()
    .sort((a, b) => {
      const rank = (p: (typeof scene.players)[number]) => {
        if (p.id.startsWith('ghost-')) return 0;
        if (p.side === 'off') return 1;
        return 2;
      };
      const d = rank(a) - rank(b);
      return d !== 0 ? d : a.id.localeCompare(b.id);
    });

  return (
    <View style={[styles.field, { height }, WEB_TURF]} onLayout={onLayout}>
      {native ? <NativeTurf width={width} height={height} /> : null}

      {showGrid
        ? marks.gridYards.map((line) => (
            <View key={`grid-y-${line.y}`} style={[styles.gridH, { top: line.sy }]} />
          ))
        : null}
      {showGrid
        ? marks.gridXs.map((sx) => (
            <View key={`grid-x-${sx}`} style={[styles.gridV, { left: sx }]} />
          ))
        : null}

      {marks.fiveYardLines.map((line) => (
        <View
          key={`yl-${line.y}`}
          style={[styles.yardLine, { top: line.sy }]}
        />
      ))}

      <View style={[styles.los, { top: marks.losY }]} />

      {hashesOn
        ? marks.hashes.map((tick) => (
            <React.Fragment key={`hash-${tick.y}`}>
              <View style={[styles.hashTick, { top: tick.sy, left: marks.leftHashX }]} />
              <View style={[styles.hashTick, { top: tick.sy, left: marks.rightHashX }]} />
            </React.Fragment>
          ))
        : null}

      {numbersOn
        ? marks.numbers.map((n) => (
            <React.Fragment key={`num-${n.y}`}>
              <Text
                style={[
                  styles.yardNum,
                  {
                    top: n.sy,
                    left: width * 0.12,
                    fontSize: numSize,
                    marginLeft: -numSize / 2,
                    marginTop: -numSize / 2,
                  },
                ]}
              >
                {n.number}
              </Text>
              <Text
                style={[
                  styles.yardNum,
                  styles.yardNumRight,
                  {
                    top: n.sy,
                    right: width * 0.1,
                    fontSize: numSize,
                    marginRight: -numSize / 2,
                    marginTop: -numSize / 2,
                  },
                ]}
              >
                {n.number}
              </Text>
            </React.Fragment>
          ))
        : null}

      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        {showZones
          ? scene.zones.map((z) => <Zone key={z.id} zone={z} viewport={viewport} />)
          : null}
        {routesVisible
          ? scene.arrows.map((a) => (
              <Arrow
                key={a.id}
                arrow={a}
                viewport={viewport}
                visualStyle={
                  a.kind === 'motion' ? 'motion' : a.arrowhead === 'block' ? 'alt' : 'route'
                }
              />
            ))
          : null}
      </Svg>

      {scene.gapLabels.map((g) => (
        <Label
          key={`gap-${g.gap}-${g.x}`}
          text={g.text}
          x={g.x}
          y={g.y}
          viewport={viewport}
        />
      ))}
      {scene.annotations.map((a) => (
        <Label
          key={a.id}
          text={a.text}
          x={a.x}
          y={a.y}
          viewport={viewport}
          color={a.color}
        />
      ))}

      {players.map((p) => {
        const { sx, sy } = toScreen(p.x, p.y, viewport);
        return (
          <FieldPlayer
            key={p.id}
            player={p}
            left={sx}
            top={sy}
            width={chipW}
            height={chipH}
            showLabel={showLabels}
            selected={selectedPlayerId === p.id || !!p.highlight}
            onPress={interactive || onPlayerPress ? onPlayerPress : undefined}
          />
        );
      })}

      {captionOn ? (
        <View style={[styles.caption, { top: marks.losY - 12 }]} pointerEvents="none">
          <View style={styles.losPill}>
            <Text style={styles.losText}>LOS</Text>
          </View>
          {captionText ? <Text style={styles.captionName}>{captionText}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function NativeTurf({ width, height }: { width: number; height: number }) {
  const bands: number[] = [];
  for (let y = 0; y < height; y += 160) bands.push(y);
  const stripes: number[] = [];
  for (let x = width * 0.0835; x < width; x += width * 0.165) stripes.push(x);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bands.map((y) => (
        <View
          key={`mow-${y}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: y,
            height: 80,
            backgroundColor: 'rgba(255,255,255,0.035)',
          }}
        />
      ))}
      {stripes.map((x) => (
        <View
          key={`stripe-${x}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: x,
            width: Math.max(1.5, width * 0.0025),
            backgroundColor: 'rgba(236,244,226,0.16)',
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.turf,
  },
  yardLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    marginTop: -1,
    backgroundColor: colors.fieldLineStrong,
  },
  los: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    marginTop: -1,
    backgroundColor: FIELD_COLORS.los,
    zIndex: 2,
  },
  hashTick: {
    position: 'absolute',
    width: 10,
    height: 2,
    marginLeft: -5,
    marginTop: -1,
    backgroundColor: 'rgba(244,245,237,0.45)',
    zIndex: 2,
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(236,244,226,0.08)',
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    marginLeft: -0.5,
    backgroundColor: 'rgba(236,244,226,0.08)',
  },
  yardNum: {
    position: 'absolute',
    color: colors.yardNumber,
    fontWeight: '800',
    transform: [{ rotate: '90deg' }],
    zIndex: 1,
  },
  yardNumRight: {
    transform: [{ rotate: '-90deg' }],
  },
  caption: {
    position: 'absolute',
    left: 18,
    zIndex: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  losPill: {
    borderWidth: 1,
    borderColor: FIELD_COLORS.losCaptionBorder,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(20,28,22,0.45)',
  },
  losText: {
    color: FIELD_COLORS.losCaption,
    fontSize: 7,
    fontWeight: '800',
  },
  captionName: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
