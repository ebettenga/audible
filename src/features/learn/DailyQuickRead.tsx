import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { FieldCanvas } from '@/src/render';
import {
  buildQuiz,
  getCardScene,
  loadPlaybooks,
  loadProgress,
  loadSettings,
  resolveActiveBook,
  upsertProgress,
  recordSession,
  reviewCard,
  type CardProgress,
  type QuizQuestion,
} from '@/src/training';
import { Button, Eyebrow } from '@/src/ui';
import { colors, typography } from '@/src/design';
import { LEARN_TOPICS } from './progress';

function todaySeed(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyQuickRead() {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadProgress(), loadPlaybooks(), loadSettings()]).then(
      ([map, books, settings]) => {
      if (cancelled) return;
      setProgress(map);
      setQuestions(
        buildQuiz(['play-calls', 'formations', ...LEARN_TOPICS.filter((t) => t !== 'play-calls' && t !== 'formations')], 5, map, {
          seed: `daily-${todaySeed()}`,
          book: resolveActiveBook(books, settings),
        }),
      );
      setIndex(0);
      setSelected(null);
      setCorrect(0);
    },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const q = questions[index];
  const scene = useMemo(() => (q ? getCardScene(q.card) : null), [q]);

  const choose = async (choice: string, endedAt: number) => {
    if (!q || selected !== null) return;
    setSelected(choice);
    const ok = choice.toLowerCase() === q.card.answer.toLowerCase();
    const nextCorrect = correct + (ok ? 1 : 0);
    if (ok) setCorrect(nextCorrect);
    const finishing = index >= questions.length - 1;
    const grade = ok ? 'good' : 'again';
    const updated = reviewCard(progress[q.card.id], q.card.id, grade);
    const map = await upsertProgress(updated);
    setProgress(map);

    if (finishing) {
      await recordSession({
        startedAt: new Date(startedAt).toISOString(),
        topic: q.card.topic,
        cardsReviewed: questions.length,
        correct: nextCorrect,
        durationSec: Math.max(1, Math.round((endedAt - startedAt) / 1000)),
        xp: nextCorrect * 30,
        source: 'quiz',
      });
    }
  };

  const advance = () => {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  if (!q || !scene) {
    return (
      <View style={styles.wrap}>
        <Eyebrow>Quick read</Eyebrow>
        <Text style={styles.title}>Loading daily 5…</Text>
      </View>
    );
  }

  const state =
    selected === null
      ? ''
      : selected.toLowerCase() === q.card.answer.toLowerCase()
        ? 'correct'
        : 'incorrect';

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Eyebrow>Quick read</Eyebrow>
        <Text style={styles.count}>
          {String(index + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
        </Text>
      </View>
      <Text style={styles.title}>Daily 5</Text>
      <Text style={styles.question}>{q.card.prompt}</Text>
      <View style={styles.field}>
        <FieldCanvas
          scene={{ ...scene, title: '' }}
          height={120}
          compact
          interactive={false}
        />
      </View>
      {q.choices.map((option) => {
        const optState =
          selected === null
            ? ''
            : option.toLowerCase() === q.card.answer.toLowerCase()
              ? 'correct'
              : selected === option
                ? 'incorrect'
                : '';
        return (
          <Pressable
            key={option}
            style={[
              styles.option,
              optState === 'correct' && styles.optionCorrect,
              optState === 'incorrect' && styles.optionIncorrect,
            ]}
            onPress={() => void choose(option, Date.now())}
            disabled={selected !== null}
          >
            <Text
              style={[
                styles.optionText,
                optState === 'correct' && { color: colors.lime },
                optState === 'incorrect' && { color: '#e98c80' },
              ]}
            >
              {option}
            </Text>
            {optState ? (
              <Text style={{ color: optState === 'correct' ? colors.lime : '#e98c80', fontSize: 10 }}>
                {optState === 'correct' ? 'Correct' : 'Try again'}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
      {selected !== null && index < questions.length - 1 ? (
        <Button label="Next" icon="arrow" variant="secondary" onPress={advance} style={{ marginTop: 8 }} />
      ) : null}
      <Button
        label="Full quiz"
        icon="play"
        variant="secondary"
        onPress={() => router.push('/learn/quiz')}
        style={{ marginTop: 8 }}
      />
      {state === 'correct' && index >= questions.length - 1 ? (
        <Text style={styles.done}>Daily 5 complete · {correct}/{questions.length}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 19,
    borderWidth: 1,
    borderColor: '#303833',
    borderRadius: 16,
    backgroundColor: colors.card,
    gap: 8,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  count: { color: '#717b74', fontSize: 11 },
  title: { fontSize: 18, color: colors.text, fontWeight: '700' },
  question: { color: '#a2aaa4', fontSize: 12 },
  field: {
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 6,
    backgroundColor: colors.turf,
  },
  option: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#323a35',
    backgroundColor: '#111613',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCorrect: { borderColor: colors.lime },
  optionIncorrect: { borderColor: '#e16f60' },
  optionText: { color: '#aeb5af', fontSize: 12, flex: 1 },
  done: {
    marginTop: 4,
    color: colors.lime,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
  },
});
