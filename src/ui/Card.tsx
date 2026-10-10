import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radius, shadows } from '@/src/design';

export function Card({
  children,
  style,
  raised,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  raised?: boolean;
}) {
  return (
    <View style={[styles.card, raised && styles.raised, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#303832',
    borderRadius: radius.xxl,
    backgroundColor: colors.card,
  },
  raised: {
    backgroundColor: colors.cardRaised,
    ...shadows.card,
  },
});
