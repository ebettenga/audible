import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Button, ModalShell } from '@/src/ui';
import { colors, radius } from '@/src/design';

export const COLLECTION_COLORS = [
  '#c9f25b',
  '#e87868',
  '#72b9ef',
  '#d97cad',
  '#f0a55d',
  '#ae8ee8',
  '#6bd6cf',
];

export function CollectionCreateSheet({
  visible,
  initialName = '',
  initialColor = COLLECTION_COLORS[0],
  title = 'New collection',
  confirmLabel = 'Create',
  onSave,
  onDismiss,
}: {
  visible: boolean;
  initialName?: string;
  initialColor?: string;
  title?: string;
  confirmLabel?: string;
  onSave: (next: { name: string; color: string }) => void;
  onDismiss: () => void;
}) {
  if (!visible) return null;
  return (
    <CollectionForm
      key={`${initialName}-${initialColor}`}
      title={title}
      confirmLabel={confirmLabel}
      name={initialName}
      color={initialColor}
      onSave={onSave}
      onDismiss={onDismiss}
    />
  );
}

function CollectionForm({
  title,
  confirmLabel,
  name,
  color,
  onSave,
  onDismiss,
}: {
  title: string;
  confirmLabel: string;
  name: string;
  color: string;
  onSave: (next: { name: string; color: string }) => void;
  onDismiss: () => void;
}) {
  const [draftName, setDraftName] = useState(name);
  const [draftColor, setDraftColor] = useState(color);
  const [focused, setFocused] = useState(false);

  const submit = () => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, color: draftColor });
  };

  return (
    <ModalShell
      visible
      onClose={onDismiss}
      icon="layers"
      title={title}
      subtitle="Group plays by theme, situation or install."
      accent={draftColor}
      maxWidth={420}
      footer={
        <>
          <Button label="Cancel" variant="secondary" onPress={onDismiss} />
          <Button label={confirmLabel} onPress={submit} />
        </>
      }
    >
      <Text style={styles.label}>NAME</Text>
      <TextInput
        value={draftName}
        onChangeText={setDraftName}
        placeholder="Red zone"
        placeholderTextColor={colors.faint}
        style={[styles.input, focused && { borderColor: draftColor }]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={submit}
        autoFocus
      />
      <Text style={[styles.label, { marginTop: 8 }]}>COLOR</Text>
      <View style={styles.swatches}>
        {COLLECTION_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setDraftColor(c)}
            accessibilityLabel={`Color ${c}`}
            style={[
              styles.swatch,
              { backgroundColor: c },
              draftColor === c && styles.swatchActive,
            ]}
          />
        ))}
      </View>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  input: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: '#0d1210',
    color: colors.text,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: { borderColor: colors.text, transform: [{ scale: 1.1 }] },
});
