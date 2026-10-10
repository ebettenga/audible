import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { toScreen, type Viewport } from '@/src/core/field';
import { FIELD_COLORS } from './colors';

export interface LabelProps {
  text: string;
  x: number;
  y: number;
  viewport: Viewport;
  color?: string;
  fontSize?: number;
}

export function Label({
  text,
  x,
  y,
  viewport,
  color = FIELD_COLORS.gapLabel,
  fontSize = 12,
}: LabelProps) {
  const { sx, sy } = toScreen(x, y, viewport);
  return (
    <Text
      pointerEvents="none"
      style={[
        styles.label,
        {
          left: sx,
          top: sy,
          color,
          fontSize,
          marginLeft: -fontSize,
          marginTop: -fontSize * 0.65,
        },
      ]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    minWidth: 16,
    textAlign: 'center',
    fontWeight: '800',
    textShadowColor: '#111',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 4,
  },
});
