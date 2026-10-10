import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { loadPlaybooks, TOPIC_META, type TrainingTopic } from '@/src/training';
import { Icon, ModalShell } from '@/src/ui';
import { colors, typography } from '@/src/design';

const SEARCH_TOPICS = Object.keys(TOPIC_META) as TrainingTopic[];

function SearchBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [plays, setPlays] = useState<{ id: string; name: string; concept?: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    void loadPlaybooks().then((books) => {
      if (cancelled) return;
      setPlays(
        books.flatMap((book) =>
          book.plays.map((p) => ({
            id: p.id,
            name: p.name,
            concept: p.concept,
          })),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();

  const matchedPlays = useMemo(() => {
    if (!q) return plays.slice(0, 8);
    return plays
      .filter((p) => `${p.name} ${p.concept ?? ''}`.toLowerCase().includes(q))
      .slice(0, 12);
  }, [plays, q]);

  const matchedTopics = useMemo(() => {
    return SEARCH_TOPICS.filter((t) => {
      const meta = TOPIC_META[t];
      if (!q) return true;
      return `${meta.title} ${meta.description}`.toLowerCase().includes(q);
    }).slice(0, 8);
  }, [q]);

  const go = (href: string) => {
    onClose();
    router.push(href as never);
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.searchRow}>
        <Icon name="search" size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search plays and topics"
          placeholderTextColor={colors.faint}
          style={styles.input}
          autoFocus
        />
      </View>
      <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Topics</Text>
        {matchedTopics.map((topic) => (
          <Pressable key={topic} style={styles.row} onPress={() => go(`/train/${topic}`)}>
            <Text style={styles.rowTitle}>{TOPIC_META[topic].title}</Text>
            <Text style={styles.rowSub}>{TOPIC_META[topic].description}</Text>
          </Pressable>
        ))}
        <Text style={[styles.section, { marginTop: 14 }]}>Plays</Text>
        {matchedPlays.length === 0 ? (
          <Text style={styles.empty}>No matching plays</Text>
        ) : (
          matchedPlays.map((play) => (
            <Pressable
              key={play.id}
              style={styles.row}
              onPress={() => go(`/play/${play.id}`)}
            >
              <Text style={styles.rowTitle}>{play.name}</Text>
              {play.concept ? <Text style={styles.rowSub}>{play.concept}</Text> : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export function SearchModal({
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
      hideHeader
      flush
      align="top"
      maxWidth={600}
    >
      {visible ? <SearchBody onClose={onClose} /> : null}
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  sheet: {
    maxHeight: 460,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, padding: 0 },
  results: { paddingHorizontal: 16, paddingBottom: 16 },
  section: {
    marginTop: 12,
    marginBottom: 6,
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: typography.fontFamilyBold,
  },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#262d29' },
  rowTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
  },
  rowSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  empty: { color: colors.faint, fontSize: 12, paddingVertical: 8 },
});
