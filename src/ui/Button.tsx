import React from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radius, typography } from '@/src/design';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'apply' | 'ghost' | 'saved';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  style,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const isPrimary = variant === 'primary' || variant === 'apply' || variant === 'saved';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        variant === 'secondary' && styles.secondary,
        isPrimary && styles.primary,
        variant === 'saved' && styles.saved,
        variant === 'ghost' && styles.ghost,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          isPrimary && styles.labelPrimary,
          variant === 'secondary' && styles.labelSecondary,
          variant === 'ghost' && styles.labelGhost,
        ]}
      >
        {label}
      </Text>
      {icon ? (
        <Icon
          name={icon}
          size={15}
          color={isPrimary ? '#172014' : colors.muted}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 39,
    paddingHorizontal: 15,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primary: {
    backgroundColor: colors.lime,
    borderWidth: 1,
    borderColor: colors.lime,
  },
  saved: {
    backgroundColor: '#e5e8df',
    borderColor: '#e5e8df',
  },
  secondary: {
    backgroundColor: '#181e1b',
    borderWidth: 1,
    borderColor: '#323a35',
  },
  ghost: {
    backgroundColor: 'transparent',
    height: 'auto' as unknown as number,
    paddingHorizontal: 0,
  },
  label: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 10,
    fontWeight: '800',
  },
  labelPrimary: { color: '#172014' },
  labelSecondary: { color: '#c1c7c2' },
  labelGhost: { color: colors.lime },
});
