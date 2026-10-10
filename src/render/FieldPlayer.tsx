import React from 'react';
import { Pressable, Text, StyleSheet, Platform, type ViewStyle } from 'react-native';
import type { Player } from '@/src/core/schema';
import { POSITION_COLORS } from './colors';
import { colors } from '@/src/design/tokens';

export interface FieldPlayerProps {
  player: Player;
  left: number;
  top: number;
  selected?: boolean;
  showLabel?: boolean;
  width?: number;
  height?: number;
  onPress?: (player: Player) => void;
}

function chipColors(player: Player) {
  // Figma paints Y as a WR chip even in 12 personnel
  if (player.position === 'Y' || player.label === 'Y') return POSITION_COLORS.wr;
  return POSITION_COLORS[player.colorKey ?? 'default'] ?? POSITION_COLORS.default;
}

/** HTML/CSS player chip from the Figma `.player` surface (33×28, shadow, lime ring). */
export function FieldPlayer({
  player,
  left,
  top,
  selected = false,
  showLabel = true,
  width = 33,
  height = 28,
  onPress,
}: FieldPlayerProps) {
  const palette = chipColors(player);
  const isQb = player.colorKey === 'qb' || player.position === 'QB';
  const isDef = player.side === 'def';
  const handle = onPress ? () => onPress(player) : undefined;

  const layout: ViewStyle = {
    left,
    top,
    width,
    height,
    marginLeft: -width / 2,
    marginTop: -height / 2,
    backgroundColor: palette.fill,
    borderColor: isDef ? colors.defBorder : isQb ? '#eeeeee' : '#151a17',
    transform: selected ? [{ scale: 1.13 }] : undefined,
    zIndex: selected ? 8 : 5,
  };

  const shadow = selected
    ? Platform.OS === 'web'
      ? ({ boxShadow: '0 0 0 3px #c9f25b, 0 7px 18px rgba(0,0,0,0.35)' } as ViewStyle)
      : {
          shadowColor: colors.lime,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 3,
          elevation: 8,
        }
    : Platform.OS === 'web'
      ? ({ boxShadow: '0 3px 10px rgba(0,0,0,0.28)' } as ViewStyle)
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.28,
          shadowRadius: 5,
          elevation: 4,
        };

  return (
    <Pressable
      accessibilityLabel={player.label}
      disabled={!handle}
      onPress={handle}
      style={[styles.chip, layout, shadow]}
    >
      {showLabel ? (
        <Text style={[styles.label, { color: palette.text, fontSize: height * 0.32 }]}>
          {player.label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    borderWidth: 1,
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
