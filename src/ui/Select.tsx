import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import { colors, radius, typography } from '@/src/design';

export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  // Web: use native select for better UX
  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <Text style={styles.floating}>{label}</Text>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={webSelectStyle as object}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.floating}>{label}</Text>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.value}>{value}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item === value && styles.optionActive]}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, item === value && styles.optionTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const webSelectStyle = {
  height: 46,
  minWidth: 112,
  paddingTop: 14,
  paddingBottom: 2,
  paddingLeft: 9,
  paddingRight: 27,
  border: `1px solid #323b35`,
  borderRadius: 9,
  color: '#e6e9e1',
  fontSize: 10,
  fontWeight: 700,
  background: '#111613',
  outline: 'none',
  fontFamily: 'Manrope, sans-serif',
};

const styles = StyleSheet.create({
  wrap: { position: 'relative', minWidth: 112 },
  floating: {
    position: 'absolute',
    top: 5,
    left: 10,
    zIndex: 1,
    fontSize: 7,
    color: '#79827c',
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: typography.fontFamilyBold,
    pointerEvents: 'none',
  },
  trigger: {
    height: 46,
    paddingTop: 14,
    paddingBottom: 2,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: '#323b35',
    borderRadius: radius.md,
    backgroundColor: '#111613',
    justifyContent: 'center',
  },
  value: {
    color: '#e6e9e1',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.panel,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    maxHeight: 380,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 48,
    elevation: 24,
  },
  sheetTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: radius.md,
  },
  optionActive: { backgroundColor: colors.lime },
  optionText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  optionTextActive: { color: '#172014' },
});
