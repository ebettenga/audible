import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '@/src/design';
import { Icon } from './Icon';

export function Callout({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.wrap}>
      <Icon name="spark" size={17} color={colors.lime} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 9,
    padding: 11,
    borderWidth: 1,
    borderColor: '#384139',
    borderRadius: radius.md,
    backgroundColor: '#1c241d',
  },
  title: {
    color: '#e5e9e2',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: typography.fontFamilyBold,
  },
  body: {
    marginTop: 4,
    color: '#8b958d',
    fontSize: 8,
    lineHeight: 12,
    fontFamily: typography.fontFamilyRegular,
  },
});
