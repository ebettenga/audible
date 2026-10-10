import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '@/src/design';

export function Avatar({
  initials,
  size = 38,
  bg = colors.avatar,
  color = colors.avatarText,
}: {
  initials: string;
  size?: number;
  bg?: string;
  color?: string;
}) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: radius.lg,
          backgroundColor: bg,
        },
      ]}
    >
      <Text style={[styles.text, { color, fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

export function PresenceDot({ style }: { style?: object }) {
  return <View style={[styles.dot, style]} />;
}

export function AvatarStack({
  items,
  extra,
}: {
  items: { initials: string; bg?: string }[];
  extra?: number;
}) {
  return (
    <View style={styles.stack}>
      {items.map((item, i) => (
        <View key={`${item.initials}-${i}`} style={[styles.stackItem, { marginLeft: i === 0 ? 0 : -6, zIndex: items.length - i }]}>
          <View style={[styles.stackAvatar, { backgroundColor: item.bg ?? '#2c3530' }]}>
            <Text style={styles.stackText}>{item.initials}</Text>
          </View>
        </View>
      ))}
      {extra ? (
        <View style={[styles.stackItem, { marginLeft: -6 }]}>
          <View style={[styles.stackAvatar, { backgroundColor: colors.lime }]}>
            <Text style={[styles.stackText, { color: '#172014' }]}>+{extra}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  stack: { flexDirection: 'row', alignItems: 'center' },
  stackItem: {},
  stackAvatar: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackText: {
    color: '#cdd3ce',
    fontSize: 7,
    fontWeight: '800',
    fontFamily: typography.fontFamilyBold,
  },
});
