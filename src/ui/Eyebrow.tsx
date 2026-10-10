import React from 'react';
import { Text, StyleSheet, type TextStyle } from 'react-native';
import { colors, typography } from '@/src/design';

export function Eyebrow({
  children,
  style,
}: {
  children: string;
  style?: TextStyle;
}) {
  return <Text style={[styles.eyebrow, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: typography.fontFamilyBold,
    color: '#818b84',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
