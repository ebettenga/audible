import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Button, ModalShell, Select } from '@/src/ui';
import { colors, typography, radius } from '@/src/design';
import { CollectionCreateSheet } from '@/src/features/playbook/CollectionCreateSheet';
import type { Collection, Playbook } from '@/src/training/types';
import type { BuilderState } from './useBuilderState';

export function PlaySheet({
  builder,
  books,
  onCreatePlaybook,
  onCreateCollection,
  onSave,
  onNewPlay,
  savedPlayId,
}: {
  builder: BuilderState;
  books: Playbook[];
  onCreatePlaybook: (name: string) => Promise<void>;
  onCreateCollection: (input: { name: string; color: string }) => Promise<void>;
  onSave: () => void;
  onNewPlay: () => void;
  savedPlayId?: string | null;
}) {
  const [bookModal, setBookModal] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [collectionModal, setCollectionModal] = useState(false);

  const book = books.find((b) => b.id === builder.bookId) ?? books[0];
  const collections = book?.collections ?? [];
  const bookOptions = books.map((b) => b.name);
  const bookLabel = book?.name ?? 'Playbook';

  const toggleCollection = (id: string) => {
    const next = builder.collectionIds.includes(id)
      ? builder.collectionIds.filter((c) => c !== id)
      : [...builder.collectionIds, id];
    builder.setCollectionIds(next);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Play sheet</Text>
      <Text style={styles.title}>
        {builder.editingPlayId ? 'Edit play' : 'New play'}
      </Text>
      <Text style={styles.sub}>Name it, note the purpose, pick where it lives.</Text>

      <Text style={styles.label}>Side</Text>
      <View style={styles.sideRow}>
        {(['off', 'def'] as const).map((s) => {
          const active = builder.side === s;
          return (
            <Pressable
              key={s}
              style={[styles.sideChip, active && styles.sideChipActive]}
              onPress={() => builder.setSide(s)}
            >
              <Text style={[styles.sideChipText, active && styles.sideChipTextActive]}>
                {s === 'off' ? 'Offense' : 'Defense'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Display name</Text>
      <TextInput
        value={builder.name}
        onChangeText={builder.setName}
        placeholder={builder.playcall}
        placeholderTextColor="#5e6861"
        style={styles.input}
      />
      {!builder.nameDirty ? (
        <Text style={styles.meta}>Tracks the playcall until you rename it.</Text>
      ) : null}

      <Text style={styles.label}>Purpose / notes</Text>
      <TextInput
        value={builder.notes}
        onChangeText={builder.setNotes}
        placeholder="What is this play trying to achieve?"
        placeholderTextColor="#5e6861"
        multiline
        style={[styles.input, styles.notes]}
      />

      <Text style={styles.label}>Coaching point</Text>
      <TextInput
        value={builder.coachingPoint}
        onChangeText={builder.setCoachingPoint}
        placeholder="One-line teaching cue"
        placeholderTextColor="#5e6861"
        style={styles.input}
      />

      <Text style={styles.label}>Playbook</Text>
      <Select
        label="Playbook"
        value={bookLabel}
        options={bookOptions}
        onChange={(name) => {
          const next = books.find((b) => b.name === name);
          if (!next) return;
          builder.setBookId(next.id);
          const active = next.collections.find((c) => c.isActive);
          builder.setCollectionIds(active ? [active.id] : []);
        }}
      />
      <Button
        label="New playbook"
        variant="secondary"
        onPress={() => {
          setNewBookName('');
          setBookModal(true);
        }}
        style={{ marginTop: 8 }}
      />

      <Text style={[styles.label, { marginTop: 16 }]}>Collections</Text>
      <Text style={styles.meta}>Optional — plays can live in the library only.</Text>
      <View style={styles.collectionList}>
        {collections.length === 0 ? (
          <Text style={styles.empty}>No collections in this playbook yet.</Text>
        ) : (
          collections.map((c: Collection) => {
            const checked = builder.collectionIds.includes(c.id);
            return (
              <Pressable
                key={c.id}
                style={[styles.collectionRow, checked && styles.collectionRowActive]}
                onPress={() => toggleCollection(c.id)}
              >
                <View style={[styles.swatch, { backgroundColor: c.color }]} />
                <Text style={styles.collectionName}>{c.name}</Text>
                {c.isActive ? <Text style={styles.installBadge}>Install</Text> : null}
                <Text style={styles.check}>{checked ? '✓' : ''}</Text>
              </Pressable>
            );
          })
        )}
      </View>
      <Button
        label="New collection"
        variant="secondary"
        onPress={() => setCollectionModal(true)}
        style={{ marginTop: 8 }}
      />

      <View style={styles.actions}>
        <Button
          label={builder.saved ? 'Saved' : builder.editingPlayId ? 'Update play' : 'Save play'}
          icon={builder.saved ? 'spark' : 'arrow'}
          variant={builder.saved ? 'saved' : 'primary'}
          onPress={onSave}
        />
        <Button label="New play" variant="secondary" onPress={onNewPlay} />
      </View>

      {savedPlayId ? (
        <Text style={styles.savedHint}>Saved. Open from Playbook or search.</Text>
      ) : null}

      <ModalShell
        visible={bookModal}
        onClose={() => setBookModal(false)}
        icon="book"
        title="New playbook"
        subtitle="A named set of plays you can train on."
        maxWidth={420}
        footer={
          <>
            <Button label="Cancel" variant="secondary" onPress={() => setBookModal(false)} />
            <Button
              label="Create"
              onPress={() => {
                const trimmed = newBookName.trim();
                if (!trimmed) return;
                void onCreatePlaybook(trimmed).then(() => setBookModal(false));
              }}
            />
          </>
        }
      >
        <Text style={styles.label}>NAME</Text>
        <TextInput
          value={newBookName}
          onChangeText={setNewBookName}
          placeholder="e.g. Air Raid Install"
          placeholderTextColor="#5e6861"
          style={styles.input}
          autoFocus
        />
      </ModalShell>

      <CollectionCreateSheet
        visible={collectionModal}
        onDismiss={() => setCollectionModal(false)}
        onSave={(next) => {
          void onCreateCollection(next).then(() => setCollectionModal(false));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 24,
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#96a098',
    fontFamily: typography.fontFamilyBold,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    letterSpacing: -1,
    color: colors.text,
    fontFamily: typography.fontFamilySemi,
    fontWeight: '600',
  },
  sub: {
    marginTop: 4,
    marginBottom: 18,
    color: '#77807a',
    fontSize: 12,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    color: '#8e9790',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  sideRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sideChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderMid,
    backgroundColor: '#121714',
  },
  sideChipActive: {
    borderColor: colors.lime,
    backgroundColor: 'rgba(201,242,91,0.12)',
  },
  sideChipText: {
    color: '#8e9790',
    fontSize: 13,
    fontWeight: '700',
  },
  sideChipTextActive: {
    color: colors.lime,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderMid,
    borderRadius: radius.md,
    backgroundColor: '#121714',
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notes: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  meta: {
    marginTop: 4,
    color: '#5e6861',
    fontSize: 10,
  },
  collectionList: {
    gap: 6,
    marginTop: 8,
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderMid,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  collectionRowActive: {
    borderColor: colors.lime,
    backgroundColor: 'rgba(201,242,91,0.08)',
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  collectionName: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  installBadge: {
    color: colors.lime,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  check: {
    color: colors.lime,
    fontSize: 14,
    fontWeight: '800',
    width: 16,
    textAlign: 'right',
  },
  empty: {
    color: '#6a736c',
    fontSize: 12,
  },
  actions: {
    marginTop: 22,
    gap: 8,
  },
  savedHint: {
    marginTop: 10,
    color: colors.lime,
    fontSize: 11,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 24,
  },
  modalSheet: {
    backgroundColor: colors.panel,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
