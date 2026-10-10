import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, radius } from '@/src/design';
import { Icon, type IconName } from './Icon';

export function IconButton({
  name,
  onPress,
  label,
}: {
  name: IconName;
  onPress?: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
    >
      <Icon name={name} size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMid,
    backgroundColor: '#171c1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { borderColor: '#3b473e' },
});
