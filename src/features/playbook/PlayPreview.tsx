import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { FieldCanvas } from '@/src/render';
import type { AssignmentOverride } from '@/src/core/parser';
import { colors, radius } from '@/src/design';
import type { PlaySide } from '@/src/training/types';
import { tryBuildPlayScene } from './playMeta';

export function PlayPreview({
  playcall,
  assignments,
  height = 132,
  side = 'off',
  vsPlaycall,
}: {
  playcall?: string;
  assignments?: Record<string, AssignmentOverride>;
  height?: number;
  side?: PlaySide;
  vsPlaycall?: string;
  /** @deprecated kept for call-site compatibility; ignored */
  routes?: string;
  /** @deprecated kept for call-site compatibility; ignored */
  color?: string;
}) {
  const scene = useMemo(
    () => (playcall ? tryBuildPlayScene(playcall, assignments, side, vsPlaycall) : null),
    [playcall, assignments, side, vsPlaycall],
  );

  if (!scene) {
    return (
      <View style={[styles.wrap, styles.fallback, { height }]}>
        <Text style={styles.fallbackText}>No diagram</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <FieldCanvas
        scene={{ ...scene, title: '' }}
        height={height}
        showLabels={false}
        compact
        interactive={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.turf,
    overflow: 'hidden',
    position: 'relative',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: 'rgba(244,245,237,0.45)',
    fontSize: 11,
    fontWeight: '700',
  },
});
