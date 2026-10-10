import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Button, ModalShell } from '@/src/ui';
import { colors, typography, radius } from '@/src/design';

const MOD = Platform.OS === 'ios' || Platform.OS === 'web' ? '⌘/Ctrl' : 'Ctrl';

export function HelpSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <ModalShell
      visible={visible}
      onClose={onClose}
      icon="help"
      title="How Audible works"
      subtitle="Playcalls, shortcuts and training"
      maxWidth={520}
      footer={<Button label="Got it" onPress={onClose} />}
    >
      <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.h}>PLAYCALL GRAMMAR</Text>
        <Text style={styles.code}>
          Formation  Strength?  Modifier*  (Fake)? Run?  RouteDigits?  Tag*  Protection?
        </Text>
        <Text style={styles.p}>
          Examples: `I Right 999 Y-Pop`, `Shotgun Right 979`, `Ace Twins Right 62 Slant-Flat`.
        </Text>

        <Text style={styles.h}>SHORTCUTS</Text>
        <View style={styles.shortcut}>
          <Text style={styles.kbd}>{MOD}+S</Text>
          <Text style={styles.p}>Save the current play from the builder</Text>
        </View>

        <Text style={styles.h}>TRAINING</Text>
        <Text style={styles.p}>
          Flashcards use spaced repetition on this device. Cards you miss come back sooner;
          cards you know well wait longer. Progress stays local — there is no team sync yet.
        </Text>
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  h: {
    marginTop: 14,
    marginBottom: 8,
    color: colors.lime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: typography.fontFamilyBold,
  },
  code: {
    color: colors.text,
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    backgroundColor: '#0d1210',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  p: { color: '#9aa39c', fontSize: 12, lineHeight: 19 },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kbd: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
});
