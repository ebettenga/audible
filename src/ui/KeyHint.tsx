import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, radius, typography } from '@/src/design';

export function KeyHint({ keys = ['⌘', 'S'], label = 'to save' }: { keys?: string[]; label?: string }) {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={styles.row}>
      {keys.map((k) => (
        <View key={k} style={styles.key}>
          <Text style={styles.keyText}>{k}</Text>
        </View>
      ))}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  key: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 5,
    backgroundColor: '#171c1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { color: '#9da59f', fontSize: 8, fontFamily: typography.fontFamilyBold },
  label: { color: '#6f7872', fontSize: 8, marginLeft: 2 },
});
