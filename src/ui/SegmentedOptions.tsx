import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '@/src/design';

/** Whole-word prefix so "Post" does not light up for "Post-Corner". */
export function isOptionActive(value: string, opt: string): boolean {
  const v = value.toLowerCase();
  const o = opt.toLowerCase();
  return !!v && (v === o || v.startsWith(`${o} `));
}

export function SegmentedOptions({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {options.map((opt) => {
        const active = isOptionActive(value, opt);
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.btn, active && styles.active]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btn: {
    width: '48%',
    flexGrow: 1,
    height: 30,
    borderWidth: 1,
    borderColor: '#333b36',
    borderRadius: radius.sm,
    backgroundColor: '#111613',
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  label: {
    color: '#8a938c',
    fontSize: 9,
    fontFamily: typography.fontFamilyMedium,
  },
  labelActive: {
    color: '#202616',
    fontWeight: '800',
    fontFamily: typography.fontFamilyBold,
  },
});
