import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography } from '@/src/design';
import { Eyebrow } from './Eyebrow';

export function SectionTitle({
  eyebrow,
  title,
  actionLabel,
  onAction,
}: {
  eyebrow: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.row}>
      <View>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 13,
  },
  title: {
    marginTop: 5,
    fontFamily: typography.fontFamilySemi,
    fontSize: 17,
    letterSpacing: -0.3,
    color: colors.text,
    fontWeight: '600',
  },
  action: {
    color: colors.lime,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
  },
});
