import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, typography } from '@/src/design';

export function Logo({
  showWordmark = true,
  onPress,
}: {
  showWordmark?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.wrap} accessibilityLabel="Audible home">
      <View style={styles.mark}>
        <View style={[styles.bar, { height: 15 }]} />
        <View style={[styles.bar, { height: 24 }]} />
        <View style={[styles.bar, { height: 19 }]} />
      </View>
      {showWordmark ? <Text style={styles.type}>AUDIBLE</Text> : null}
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 11, minWidth: 40 },
  mark: {
    width: 26,
    height: 27,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    transform: [{ skewX: '-12deg' }],
  },
  bar: { width: 6, borderRadius: 2, backgroundColor: colors.lime },
  type: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 15,
    letterSpacing: 2.7,
    fontWeight: '800',
    color: colors.text,
  },
});
