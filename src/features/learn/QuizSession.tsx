import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FieldCanvas } from '@/src/render';
import {
  getCardScene,
  upsertProgress,
  recordSession,
  reviewCard,
  TOPIC_META,
  type CardProgress,
  type QuizQuestion,
  type TrainingTopic,
} from '@/src/training';
import { Button, Eyebrow, Icon, ScoreRing } from '@/src/ui';
import { colors, typography } from '@/src/design';

const QUIZ_TIME = 20;
const HINT_COST = 40;

type QuizResult = { correct: boolean; time: number; xp: number };


export type QuizSessionProps = {
  title: string;
  subtitle?: string;
  questions: QuizQuestion[];
  progress: Record<string, CardProgress>;
  /** Called for "Run it back" to produce a fresh question set. */
  rebuild: (progress: Record<string, CardProgress>) => QuizQuestion[];
  source: 'quiz' | 'flashcards';
  fallbackTopic: TrainingTopic;
  bookId?: string;
  collectionId?: string;
};

export function QuizSession({
  title: headerTitle,
  subtitle = 'Quiz drill',
  questions: initialQuestions,
  progress: initialProgress,
  rebuild,
  source,
  fallbackTopic,
  bookId,
  collectionId,
}: QuizSessionProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);
  const [questions, setQuestions] = useState(initialQuestions);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const resultsRef = useRef<QuizResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME);
  const [combo, setCombo] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [complete, setComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;

  const question = questions[index];
  const locked = selected !== null;
  const scene = useMemo(() => {
    if (!question) return null;
    if (locked && question.card.revealScene) return question.card.revealScene;
    return getCardScene(question.card);
  }, [question, locked]);
  const xp = results.reduce((sum, r) => sum + r.xp, 0);
  const correctCount = results.filter((r) => r.correct).length;

  // Hint removes one wrong answer (deterministic per question).
  const hiddenChoice = useMemo(() => {
    if (!question) return -1;
    const wrong = question.choices
      .map((_, i) => i)
      .filter((i) => i !== question.correctIndex);
    return wrong.length > 1 ? wrong[question.card.id.length % wrong.length] : -1;
  }, [question]);

  const choose = async (answerIndex: number) => {
    if (!question || selected !== null) return;
    const ok = answerIndex === question.correctIndex;
    const earned = ok
      ? Math.round(
          (100 + timeLeft * 5 - (hintUsed ? HINT_COST : 0)) *
            (1 + Math.min(combo, 4) * 0.25),
        )
      : 0;
    const result: QuizResult = { correct: ok, time: QUIZ_TIME - timeLeft, xp: earned };
    resultsRef.current = [...resultsRef.current, result];
    setResults(resultsRef.current);
    setSelected(answerIndex);
    setCombo(ok ? combo + 1 : 0);
    const updated = reviewCard(
      progress[question.card.id],
      question.card.id,
      ok ? 'good' : 'again',
    );
    const map = await upsertProgress(updated);
    setProgress(map);
  };

  const next = async (endedAt: number) => {
    if (!questions.length || selected === null) return;
    if (index === questions.length - 1) {
      const all = resultsRef.current;
      const finalScore = all.filter((r) => r.correct).length;
      const earned = all.reduce((sum, r) => sum + r.xp, 0);
      const { stats } = await recordSession({
        startedAt: new Date(startedAt).toISOString(),
        topic: question?.card.topic ?? fallbackTopic,
        cardsReviewed: questions.length,
        correct: finalScore,
        durationSec: Math.max(1, Math.round((endedAt - startedAt) / 1000)),
        xp: earned,
        source,
        ...(bookId ? { bookId } : {}),
        ...(collectionId ? { collectionId } : {}),
      });
      setStreak(stats.streakDays);
      setComplete(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setTimeLeft(QUIZ_TIME);
    setHintUsed(false);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    resultsRef.current = [];
    setResults([]);
    setCombo(0);
    setTimeLeft(QUIZ_TIME);
    setHintUsed(false);
    setComplete(false);
    setQuestions(rebuild(progress));
  };

  // Countdown
  useEffect(() => {
    if (!question || locked || complete) return;
    if (timeLeft <= 0) {
      void choose(-1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, locked, complete, question]);

  // Web keyboard shortcuts: 1-4 answer, Enter next
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandler.current = (e) => {
      if (complete || !question) return;
      const n = Number(e.key);
      if (n >= 1 && n <= question.choices.length && n - 1 !== hiddenChoice) {
        void choose(n - 1);
      }
      if (e.key === 'Enter') void next(Date.now());
    };
  });
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (complete) {
    const total = questions.length;
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;
    const avgTime = results.length
      ? (results.reduce((s, r) => s + r.time, 0) / results.length).toFixed(1)
      : '0.0';
    let run = 0;
    let best = 0;
    for (const r of results) {
      run = r.correct ? run + 1 : 0;
      best = Math.max(best, run);
    }
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.completeWrap,
          { paddingTop: topInset + 24, paddingBottom: bottomInset + 32 },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.ringWrap}>
          <ScoreRing value={accuracy} size={150} />
        </View>
        <Eyebrow>{`${headerTitle} · Session complete`}</Eyebrow>
        <Text style={styles.completeTitle}>
          {accuracy >= 80
            ? 'Film-room ready.'
            : accuracy >= 50
              ? 'Getting there, Coach.'
              : 'Back to the whiteboard.'}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statStrong}>+{xp}</Text>
            <Text style={styles.statLabel}>XP earned</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statStrong}>
              {correctCount}/{total}
            </Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statStrong}>{avgTime}s</Text>
            <Text style={styles.statLabel}>Avg. read time</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statStrong}>{best}x</Text>
            <Text style={styles.statLabel}>Best combo</Text>
          </View>
        </View>
        <Text style={styles.streakNote}>{streak}-day streak · saved on this device</Text>
        <View style={styles.review}>
          {questions.map((q, i) => {
            const r = results[i];
            const good = !!r?.correct;
            return (
              <View key={`${q.card.id}-${i}`} style={styles.reviewRow}>
                <View style={[styles.reviewMark, good ? styles.reviewGood : styles.reviewBad]}>
                  <Text style={[styles.reviewMarkText, { color: good ? '#172014' : '#2a100b' }]}>
                    {good ? '✓' : '×'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewLabel}>{TOPIC_META[q.card.topic].title}</Text>
                  <Text style={styles.reviewAnswer} numberOfLines={1}>
                    {q.card.answer}
                  </Text>
                  {!good && q.card.explain ? (
                    <Text style={styles.reviewExplain} numberOfLines={3}>
                      {q.card.explain}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.reviewTime}>{r ? `${r.time}s` : '—'}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.completeActions}>
          <Button label="Run it back" variant="secondary" onPress={restart} />
          <Button label="Back to Learn" icon="arrow" onPress={() => router.push('/learn')} />
        </View>
      </ScrollView>
    );
  }

  if (!question || !scene) {
    return (
      <View style={[styles.screen, styles.loading, { paddingTop: topInset }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.loadingText}>Nothing to quiz yet</Text>
      </View>
    );
  }

  const correct = locked && selected === question.correctIndex;
  const lastXp = results[results.length - 1]?.xp ?? 0;
  const low = timeLeft <= 5 && !locked;
  const ringPct = (timeLeft / QUIZ_TIME) * 100;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: topInset + 10 }]}>
        <Pressable
          style={styles.close}
          onPress={() => router.back()}
          accessibilityLabel="Exit quiz"
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
        {wide ? (
          <View>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <Text style={styles.headerSub}>{subtitle}</Text>
          </View>
        ) : null}
        <View style={styles.segments}>
          {questions.map((_, i) => {
            const r = results[i];
            return (
              <View
                key={i}
                style={[
                  styles.segment,
                  r
                    ? r.correct
                      ? styles.segGood
                      : styles.segBad
                    : i === index
                      ? styles.segNow
                      : null,
                ]}
              />
            );
          })}
        </View>
        <View style={styles.hud}>
          <View style={[styles.pill, combo >= 2 && styles.pillHot]}>
            <Icon name="spark" size={14} color={combo >= 2 ? '#ffb05c' : '#aab1ab'} />
            <Text style={[styles.pillText, combo >= 2 && { color: '#ffb05c' }]}>
              {combo}x{wide ? ' combo' : ''}
            </Text>
          </View>
          <View style={styles.pill}>
            <Text style={[styles.pillText, { color: colors.lime }]}>{xp} XP</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.stage,
          wide && styles.stageWide,
          { paddingBottom: bottomInset + 48 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.visual, wide && { flex: 1.5 }]}>
          <View style={styles.visualLabel}>
            <View>
              <Eyebrow>{`Question ${index + 1} of ${questions.length}`}</Eyebrow>
              <Text style={styles.qLabel}>{TOPIC_META[question.card.topic].title}</Text>
            </View>
          </View>
          <View style={styles.fieldFrame}>
            <FieldCanvas
              scene={{ ...scene, title: question.card.hideTitle ? '' : scene.title }}
              height={wide ? 400 : 280}
              showYardNumbers={false}
              showHashes
              interactive={false}
            />
          </View>
          {Platform.OS === 'web' && wide ? (
            <Text style={styles.hint}>
              Press 1–{question.choices.length} to answer · Enter for next
            </Text>
          ) : null}
        </View>

        <View style={[styles.panel, wide && { flex: 1, minWidth: 360 }]}>
          <View style={[styles.clock, low && styles.clockLow]}>
            <ScoreRingTimer pct={ringPct} low={low} locked={locked} correct={correct} time={timeLeft} />
          </View>
          <Text style={styles.qTitle}>{question.card.prompt}</Text>
          <View style={styles.answers}>
            {question.choices.map((answer, answerIndex) => {
              if (hintUsed && !locked && answerIndex === hiddenChoice) {
                return null;
              }
              const state = !locked
                ? ''
                : answerIndex === question.correctIndex
                  ? 'correct'
                  : selected === answerIndex
                    ? 'incorrect'
                    : 'dimmed';
              return (
                <Pressable
                  key={`${answer}-${answerIndex}`}
                  disabled={locked}
                  style={[
                    styles.answer,
                    state === 'correct' && styles.answerCorrect,
                    state === 'incorrect' && styles.answerIncorrect,
                    state === 'dimmed' && styles.answerDimmed,
                  ]}
                  onPress={() => void choose(answerIndex)}
                >
                  <Text
                    style={[
                      styles.answerLetter,
                      state === 'correct' && styles.letterCorrect,
                      state === 'incorrect' && styles.letterIncorrect,
                    ]}
                  >
                    {answerIndex + 1}
                  </Text>
                  <Text style={styles.answerText}>{answer}</Text>
                  {state === 'correct' ? (
                    <Text style={styles.badge}>
                      {selected === answerIndex ? `+${lastXp} XP` : 'Answer'}
                    </Text>
                  ) : null}
                  {state === 'incorrect' ? (
                    <Text style={[styles.badge, styles.badgeBad]}>Your pick</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {!locked ? (
            hintUsed ? (
              <View style={styles.tip}>
                <Icon name="help" size={15} color="#b8d9f7" />
                <Text style={styles.tipText}>Eliminated one wrong answer.</Text>
              </View>
            ) : hiddenChoice >= 0 ? (
              <Pressable style={styles.tipBtn} onPress={() => setHintUsed(true)}>
                <Icon name="help" size={14} color="#9ba29d" />
                <Text style={styles.tipBtnText}>Coach&apos;s hint</Text>
                <Text style={styles.tipCost}>−{HINT_COST} XP</Text>
              </Pressable>
            ) : null
          ) : (
            <View style={[styles.feedback, correct && styles.feedbackCorrect]}>
              <Text style={[styles.feedbackTitle, correct && { color: colors.lime }]}>
                {correct
                  ? combo >= 3
                    ? `On fire. ${combo} straight.`
                    : 'Clean read.'
                  : selected === -1
                    ? 'Shot clock expired.'
                    : 'Not quite.'}
              </Text>
              <Text style={styles.feedbackBody}>Answer: {question.card.answer}</Text>
              {question.card.explain ? (
                <Text style={styles.feedbackExplain}>{question.card.explain}</Text>
              ) : null}
            </View>
          )}

          <Button
            label={index === questions.length - 1 ? 'See results' : 'Next play'}
            icon="arrow"
            disabled={!locked}
            onPress={() => void next(Date.now())}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ScoreRingTimer({
  pct,
  low,
  locked,
  correct,
  time,
}: {
  pct: number;
  low: boolean;
  locked: boolean;
  correct: boolean;
  time: number;
}) {
  const size = 74;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#262e29" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={low ? '#ff7a62' : colors.lime}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - pct / 100)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.clockLabel}>
        <Text style={styles.clockNum}>{locked ? (correct ? '✓' : '×') : time}</Text>
        <Text style={styles.clockSub}>{locked ? 'locked' : 'sec'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  loading: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.muted },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#333b36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#a4ada6', fontSize: 20, lineHeight: 22 },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { color: '#737c76', fontSize: 11 },
  segments: { flex: 1, flexDirection: 'row', gap: 5, maxWidth: 520, alignSelf: 'center', marginHorizontal: 'auto' },
  segment: { flex: 1, height: 6, borderRadius: 99, backgroundColor: '#262e29' },
  segNow: { backgroundColor: '#4f5a52', borderWidth: 1, borderColor: colors.lime },
  segGood: { backgroundColor: colors.lime },
  segBad: { backgroundColor: '#ff7a62' },
  hud: { flexDirection: 'row', gap: 8 },
  pill: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#2f3732',
    backgroundColor: '#161b19',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillHot: { borderColor: '#6a4a26', backgroundColor: 'rgba(255,160,70,0.1)' },
  pillText: { color: '#aab1ab', fontSize: 12, fontWeight: '800' },
  stage: { padding: 20, gap: 20, paddingBottom: 48 },
  stageWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 40,
    gap: 40,
    maxWidth: 1500,
    width: '100%',
    alignSelf: 'center',
  },
  visual: { minWidth: 0 },
  visualLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  qLabel: { marginTop: 4, color: colors.lime, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  fieldFrame: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#355238',
    overflow: 'hidden',
  },
  hint: { marginTop: 14, color: '#7e8781', fontSize: 12 },
  panel: {
    padding: 24,
    borderWidth: 1,
    borderColor: '#29302c',
    borderRadius: 20,
    backgroundColor: 'rgba(20,25,23,0.85)',
    gap: 0,
  },
  clock: { alignSelf: 'flex-start' },
  clockLow: {},
  clockLabel: {
    ...StyleSheet.absoluteFill as object,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockNum: { color: colors.text, fontSize: 22, fontWeight: '800', lineHeight: 24 },
  clockSub: { color: '#737c76', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  qTitle: {
    marginTop: 20,
    marginBottom: 22,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.8,
    color: colors.text,
    fontWeight: '600',
    fontFamily: typography.fontFamilySemi,
  },
  answers: { gap: 10 },
  answer: {
    minHeight: 58,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#323a35',
    backgroundColor: '#181e1b',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  answerCorrect: { borderColor: colors.lime, backgroundColor: 'rgba(201,242,91,0.1)' },
  answerIncorrect: { borderColor: '#ff7a62', backgroundColor: 'rgba(255,122,98,0.08)' },
  answerDimmed: { opacity: 0.4 },
  answerLetter: {
    minWidth: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#3a433d',
    backgroundColor: '#1b211e',
    color: '#c1c7c2',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
  },
  letterCorrect: { backgroundColor: colors.lime, color: '#172014', borderColor: colors.lime },
  letterIncorrect: { backgroundColor: '#ff7a62', color: '#2a100b', borderColor: '#ff7a62' },
  answerText: { flex: 1, color: '#e3e7e1', fontSize: 15, fontWeight: '700' },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 99,
    backgroundColor: colors.lime,
    color: '#172014',
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
  },
  badgeBad: { backgroundColor: 'rgba(255,122,98,0.2)', color: '#ff9a85' },
  tipBtn: {
    alignSelf: 'flex-start',
    marginTop: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  tipBtnText: { color: '#9ba29d', fontSize: 12, fontWeight: '700' },
  tipCost: { color: '#ff9a85', fontSize: 11 },
  tip: {
    marginTop: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 9,
    backgroundColor: 'rgba(111,183,255,0.08)',
    borderWidth: 1,
    borderColor: '#2c4258',
  },
  tipText: { color: '#b8d9f7', fontSize: 13, flex: 1 },
  feedback: {
    marginTop: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5a3832',
    backgroundColor: 'rgba(255,122,98,0.06)',
  },
  feedbackCorrect: { borderColor: '#445331', backgroundColor: 'rgba(201,242,91,0.06)' },
  feedbackTitle: { color: '#ff9a85', fontWeight: '800', fontSize: 14 },
  feedbackBody: { color: '#aab1ab', fontSize: 13, marginTop: 4, lineHeight: 20 },
  feedbackExplain: { color: '#c5cdc7', fontSize: 13, marginTop: 10, lineHeight: 20 },

  completeWrap: { alignItems: 'center', padding: 48, gap: 10, maxWidth: 720, width: '100%', alignSelf: 'center' },
  ringWrap: { marginBottom: 16 },
  completeTitle: {
    fontSize: 40,
    letterSpacing: -1.5,
    color: colors.text,
    fontWeight: '600',
    fontFamily: typography.fontFamilySemi,
    textAlign: 'center',
  },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 28, marginTop: 20 },
  stat: { alignItems: 'center' },
  statStrong: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11 },
  streakNote: { color: '#7c867f', fontSize: 12, marginTop: 8 },
  review: { alignSelf: 'stretch', marginTop: 24, gap: 8 },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMid,
    backgroundColor: '#141917',
  },
  reviewMark: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  reviewGood: { backgroundColor: colors.lime },
  reviewBad: { backgroundColor: '#ff7a62' },
  reviewMarkText: { fontWeight: '800', fontSize: 13 },
  reviewLabel: { color: '#737c76', fontSize: 10 },
  reviewAnswer: { color: colors.text, fontSize: 14, fontWeight: '700' },
  reviewExplain: { color: '#8a938c', fontSize: 12, lineHeight: 17, marginTop: 4 },
  reviewTime: { color: colors.muted, fontSize: 12 },
  completeActions: { flexDirection: 'row', gap: 10, marginTop: 28 },
});
