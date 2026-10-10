import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '@/src/design';

export function ProgressBar({
  value,
  style,
  height = 4,
}: {
  value: number;
  style?: ViewStyle;
  height?: number;
}) {
  // Accept 0–1 fractions or 0–100 percentages.
  const normalized = value > 1 ? value / 100 : value;
  const pct = Math.max(0, Math.min(1, normalized));
  return (
    <View style={[styles.track, { height }, style]}>
      <View style={[styles.fill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    borderRadius: 9,
    backgroundColor: colors.progressTrack,
  },
  fill: {
    height: '100%',
    borderRadius: 9,
    backgroundColor: colors.lime,
  },
});
