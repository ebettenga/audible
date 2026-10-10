import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import {
  loadProgress,
  loadSessionLog,
  loadSettings,
  loadPlaybooks,
  generateCards,
  TOPIC_META,
  type CardProgress,
  type Playbook,
  type StudySession,
  type UserSettings,
} from '@/src/training';
import {
  LEARN_TOPICS,
  accuracyInRange,
  buildPlaybookModules,
  masteryPercent,
  weakestCards,
  dueCount,
} from '@/src/features/learn/progress';
import { Button, Eyebrow, ProgressBar } from '@/src/ui';
import { colors, typography, radius } from '@/src/design';

export default function MasteryReportScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [log, setLog] = useState<StudySession[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [books, setBooks] = useState<Playbook[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void Promise.all([
        loadProgress(),
        loadSessionLog(),
        loadSettings(),
        loadPlaybooks(),
      ]).then(([p, sessions, s, loaded]) => {
        if (cancelled) return;
        setProgress(p);
        setLog(sessions);
        setSettings(s);
        setBooks(loaded);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const now = useMemo(() => new Date(), []);
  const d7 = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }, [now]);
  const d30 = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, [now]);

  const week = accuracyInRange(log, d7);
  const month = accuracyInRange(log, d30);
  const playbookModules = useMemo(
    () => buildPlaybookModules(books, progress, now),
    [books, progress, now],
  );
  const weak = weakestCards(progress, 6, books);
  const topicDue = LEARN_TOPICS.reduce((n, t) => n + dueCount(t, progress, now), 0);
  const playbookDue = playbookModules
    .filter((m) => m.kind === 'playbook')
    .reduce((n, m) => n + m.dueCount, 0);
  const dueNow = topicDue + playbookDue;
  const reviewTopic = LEARN_TOPICS.map((t) => ({
    t,
    due: dueCount(t, progress, now),
  })).sort((a, b) => b.due - a.due)[0]?.t ?? 'formations';

  const playNameByCardId = useMemo(() => {
    const map = new Map<string, string>();
    for (const book of books) {
      for (const play of book.plays) {
        map.set(`playbook-${play.id}`, play.name);
      }
    }
    return map;
  }, [books]);

  const cardLabel = (cardId: string) => {
    const playName = playNameByCardId.get(cardId);
    if (playName) return playName;
    for (const topic of LEARN_TOPICS) {
      const card = generateCards(topic).find((c) => c.id === cardId);
      if (card) return card.answer || card.prompt;
    }
    return cardId;
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Mastery report' }} />
      <Eyebrow>Your mastery</Eyebrow>
      <Text style={styles.h1}>Season report</Text>
      <Text style={styles.sub}>
        {settings?.displayName ? `${settings.displayName} · ` : ''}
        Local study progress across topics
      </Text>

      <View style={styles.grid}>
        {LEARN_TOPICS.map((topic) => {
          const value = masteryPercent(topic, progress);
          const due = dueCount(topic, progress, now);
          return (
            <Pressable
              key={topic}
              style={styles.topicCard}
              onPress={() => router.push(`/train/${topic}`)}
            >
              <Text style={styles.topicTitle}>{TOPIC_META[topic].title}</Text>
              <Text style={styles.topicPct}>{value}%</Text>
              <ProgressBar value={value} />
              <Text style={styles.topicDue}>{due} due</Text>
            </Pressable>
          );
        })}
      </View>

      {playbookModules.length > 0 ? (
        <View style={styles.section}>
          <Eyebrow>Your playbooks</Eyebrow>
          <Text style={styles.sectionTitle}>Playbooks & collections</Text>
          <View style={styles.grid}>
            {playbookModules.map((mod, index) => {
              const key =
                mod.kind === 'playbook'
                  ? `book-${mod.bookId}-${index}`
                  : `col-${mod.bookId}-${mod.collectionId}-${index}`;
              const disabled = mod.playCount === 0;
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.topicCard,
                    mod.kind === 'collection' && styles.collectionCard,
                    disabled && styles.disabledCard,
                  ]}
                  disabled={disabled}
                  onPress={() =>
                    router.push({
                      pathname: '/train/playbook',
                      params: {
                        bookId: mod.bookId,
                        ...(mod.collectionId
                          ? { collectionId: mod.collectionId }
                          : {}),
                      },
                    })
                  }
                >
                  <Text style={styles.topicTitle}>{mod.title}</Text>
                  <Text style={styles.topicPct}>{mod.mastery}%</Text>
                  <ProgressBar value={mod.mastery} />
                  <Text style={styles.topicDue}>
                    {mod.playCount === 0
                      ? 'Empty'
                      : `${mod.dueCount} due · ${mod.playCount} plays`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Eyebrow>Trends</Eyebrow>
        <Text style={styles.sectionTitle}>Accuracy</Text>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statStrong}>{week.accuracy}%</Text>
            <Text style={styles.statLabel}>Last 7 days · {week.cards} cards</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statStrong}>{month.accuracy}%</Text>
            <Text style={styles.statLabel}>Last 30 days · {month.cards} cards</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statStrong}>{dueNow}</Text>
            <Text style={styles.statLabel}>Cards due now</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Eyebrow>Focus</Eyebrow>
        <Text style={styles.sectionTitle}>Weakest cards</Text>
        {weak.length === 0 ? (
          <Text style={styles.empty}>No reviewed cards yet. Start a quiz to build a report.</Text>
        ) : (
          weak.map((row) => (
            <View key={row.cardId} style={styles.weakRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.weakTitle}>{cardLabel(row.cardId)}</Text>
                <Text style={styles.weakMeta}>
                  {playNameByCardId.has(row.cardId)
                    ? 'Playbook'
                    : TOPIC_META[row.topic].title}
                  {row.lastResult ? ` · last: ${row.lastResult}` : ''}
                </Text>
              </View>
              <Text style={styles.weakEase}>{row.easiness.toFixed(1)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.actions}>
        <Button
          label="Review due cards"
          icon="play"
          onPress={() => router.push(`/train/${reviewTopic}`)}
        />
        <Button
          label="Take a quiz"
          icon="spark"
          variant="secondary"
          onPress={() => router.push('/learn/quiz')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 28, paddingBottom: 64, gap: 8 },
  h1: {
    fontSize: 36,
    letterSpacing: -1.2,
    color: colors.text,
    fontWeight: '600',
    fontFamily: typography.fontFamilySemi,
  },
  sub: { color: colors.muted, fontSize: 13, marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  topicCard: {
    width: '47%',
    minWidth: 140,
    flexGrow: 1,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMid,
    backgroundColor: colors.card,
    gap: 8,
  },
  collectionCard: { borderStyle: 'dashed' },
  disabledCard: { opacity: 0.55 },
  topicTitle: { color: colors.text, fontWeight: '800', fontSize: 13 },
  topicPct: { color: colors.lime, fontWeight: '800', fontSize: 22 },
  topicDue: { color: colors.dim, fontSize: 11 },
  section: { marginTop: 28, gap: 8 },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  stat: { minWidth: 120 },
  statStrong: { color: colors.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  empty: { color: colors.dim, fontSize: 13 },
  weakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMid,
  },
  weakTitle: { color: colors.text, fontWeight: '700', fontSize: 13 },
  weakMeta: { color: colors.dim, fontSize: 11, marginTop: 2 },
  weakEase: { color: colors.muted, fontWeight: '800', fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 28 },
});
