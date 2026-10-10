import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { colors, typography } from '@/src/design';

const logoMark = require('../../assets/images/logo-mark.png');

export function Logo({
  showWordmark = true,
  onPress,
}: {
  showWordmark?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.wrap} accessibilityLabel="Audible home">
      <Image
        source={logoMark}
        style={[styles.mark, !showWordmark && styles.markCompact]}
        accessibilityIgnoresInvertColors
      />
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
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  markCompact: {
    width: 36,
    height: 36,
    borderRadius: 9,
  },
  type: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 15,
    letterSpacing: 2.7,
    fontWeight: '800',
    color: colors.text,
  },
});
