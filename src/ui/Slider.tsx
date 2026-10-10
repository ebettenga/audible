import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import CommunitySlider from '@react-native-community/slider';
import { colors, typography } from '@/src/design';

export function Slider({
  value,
  onChange,
  min = 1,
  max = 20,
  suffix = 'yds',
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <View style={styles.row}>
      <CommunitySlider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.lime}
        maximumTrackTintColor="#343b36"
        thumbTintColor={colors.lime}
      />
      <Text style={styles.value}>
        {value} {suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  slider: { flex: 1, minWidth: 0, height: Platform.OS === 'web' ? 28 : 32 },
  value: {
    color: '#cdd3cd',
    fontSize: 9,
    fontFamily: typography.fontFamilyExtra,
  },
});
