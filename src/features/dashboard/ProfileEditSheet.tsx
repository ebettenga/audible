import React, { useState } from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';
import { Button, ModalShell } from '@/src/ui';
import { colors, radius } from '@/src/design';

function ProfileForm({
  name,
  role,
  onSave,
  onDismiss,
}: {
  name: string;
  role: string;
  onSave: (next: { name: string; role: string }) => void;
  onDismiss: () => void;
}) {
  const [draftName, setDraftName] = useState(name);
  const [draftRole, setDraftRole] = useState(role);
  const [focus, setFocus] = useState<'name' | 'role' | null>(null);

  const submit = () =>
    onSave({ name: draftName.trim(), role: draftRole.trim() || 'Offense' });

  return (
    <ModalShell
      visible
      onClose={onDismiss}
      icon="users"
      title="Your profile"
      subtitle="Stored on this device only."
      maxWidth={420}
      footer={
        <>
          <Button label="Skip" variant="secondary" onPress={onDismiss} />
          <Button label="Save" onPress={submit} />
        </>
      }
    >
      <Text style={styles.label}>DISPLAY NAME</Text>
      <TextInput
        value={draftName}
        onChangeText={setDraftName}
        placeholder="Coach"
        placeholderTextColor={colors.faint}
        style={[styles.input, focus === 'name' && styles.inputFocus]}
        onFocus={() => setFocus('name')}
        onBlur={() => setFocus(null)}
        autoFocus
      />
      <Text style={styles.label}>ROLE</Text>
      <TextInput
        value={draftRole}
        onChangeText={setDraftRole}
        placeholder="Offense"
        placeholderTextColor={colors.faint}
        style={[styles.input, focus === 'role' && styles.inputFocus]}
        onFocus={() => setFocus('role')}
        onBlur={() => setFocus(null)}
        onSubmitEditing={submit}
      />
    </ModalShell>
  );
}

export function ProfileEditSheet({
  visible,
  name,
  role,
  onSave,
  onDismiss,
}: {
  visible: boolean;
  name: string;
  role: string;
  onSave: (next: { name: string; role: string }) => void;
  onDismiss: () => void;
}) {
  if (!visible) return null;
  return (
    <ProfileForm
      key={`${name}|${role}`}
      name={name}
      role={role}
      onSave={onSave}
      onDismiss={onDismiss}
    />
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#8e9790',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderMid,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 14,
    backgroundColor: '#0d1210',
  },
  inputFocus: { borderColor: colors.lime },
});
