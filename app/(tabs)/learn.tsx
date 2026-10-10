import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { FieldCanvas } from '@/src/render';
import {
  activeCollection,
  cardsForLearn,
  generateCards,
  getCardScene,
  isDue,
  loadPlaybooks,
  loadProgress,
  loadSessionLog,
  loadSettings,
  loadUserStats,
  resolveActiveBook,
  saveSettings,
  type CardProgress,
  type Playbook,
  type StudySession,
  type TrainingTopic,
  type UserSettings,
  type UserStats,
} from '@/src/training';
import {
  buildLearnModules,
  buildPlaybookModules,
  DEFENSE_LEARN_TOPICS,
  LEARN_TOPICS,
  learnTopicsForRole,
  masteryPercent,
  masteryRows,
  nextUp,
  OFFENSE_LEARN_TOPICS,
  seasonBestStreak,
  sessionsThisWeek,
  weekDays,
  weekGoalPercent,
  type LearnModule,
  type PlaybookModule,
} from '@/src/features/learn/progress';
import { estimateMinutes } from '@/src/features/dashboard/nextUp';
import { DailyQuickRead } from '@/src/features/learn/DailyQuickRead';
import { Button, Eyebrow, Icon, ProgressBar, Select } from '@/src/ui';
import { colors, typography, radius, useBreakpoint } from '@/src/design';

const TONE_BG: Record<string, string> = {
  lime: colors.lime,
  blue: '#73baf2',
  orange: '#f0a55d',
  pink: '#dc79ad',
  purple: '#ae8ee8',
  cyan: '#6bd6cf',
};

function moduleStatusText(mod: { dueCount: number; mastery: number; progress: number }) {
  if (mod.dueCount > 0) return `${mod.dueCount} due`;
  if (mod.mastery >= 80) return 'Mastered';
  if (mod.progress > 0) return `${mod.mastery}% mastery`;
  return 'Not started';
}

export default function LearnScreen() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();
  const libraryY = useRef(0);
  const scrollRef = useRef<ScrollView>(null);

  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [stats, setStats] = useState<UserStats | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [log, setLog] = useState<StudySession[]>([]);
  const [books, setBooks] = useState<Playbook[]>([]);
  const [filter, setFilter] = useState<'All topics' | 'In progress' | 'Completed'>('All topics');
  const [active, setActive] = useState<TrainingTopic>('formations');

  const refresh = useCallback(async () => {
    const [p, s, sess, set, loaded] = await Promise.all([
      loadProgress(),
      loadUserStats(),
      loadSessionLog(),
      loadSettings(),
      loadPlaybooks(),
    ]);
    setProgress(p);
    setStats(s);
    setLog(sess);
    setSettings(set);
    setBooks(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const book = useMemo(
    () => resolveActiveBook(books, settings),
    [books, settings],
  );
  const topics = useMemo(() => learnTopicsForRole(settings?.role), [settings?.role]);
  const offenseModules = useMemo(
    () => buildLearnModules(progress, OFFENSE_LEARN_TOPICS),
    [progress],
  );
  const defenseModules = useMemo(
    () => buildLearnModules(progress, DEFENSE_LEARN_TOPICS),
    [progress],
  );
  const modules = useMemo(
    () => buildLearnModules(progress, LEARN_TOPICS),
    [progress],
  );
  const playbookModules = useMemo(
    () => (book ? buildPlaybookModules([book], progress) : []),
    [book, progress],
  );

  const selectPlaybook = async (name: string) => {
    const next = books.find((b) => b.name === name);
    if (!next || !settings) return;
    const updated = { ...settings, activeBookId: next.id };
    await saveSettings(updated);
    setSettings(updated);
  };
  const applyFilter = (list: LearnModule[]) =>
    list.filter((m) => {
      if (filter === 'Completed') return m.mastery >= 80;
      if (filter === 'In progress') return m.progress > 0 && m.mastery < 80;
      return true;
    });
  const filteredOffense = applyFilter(offenseModules);
  const filteredDefense = applyFilter(defenseModules);
  const mastery = masteryRows(progress, LEARN_TOPICS);
  const bookMasteryRows = useMemo(
    () =>
      playbookModules
        .filter((m) => m.kind === 'playbook')
        .map((m) => ({ label: m.title, value: m.mastery })),
    [playbookModules],
  );
  const overall = useMemo(
    () =>
      Math.round(
        modules.reduce((sum, m) => sum + masteryPercent(m.topic, progress), 0) /
          Math.max(modules.length, 1),
      ),
    [modules, progress],
  );
  const weekSessionDays = sessionsThisWeek(log);
  const weekGoal = settings?.weeklyGoal ?? stats?.weekGoal ?? 4;
  const weekPct = weekGoalPercent(
    stats ?? { weekSessions: 0, weekGoal: 4 } as UserStats,
    settings ?? undefined,
    weekSessionDays,
  );
  const days = useMemo(() => weekDays(log), [log]);
  const resumeTopic = useMemo(() => nextUp(progress, log, new Date(), topics), [progress, log, topics]);
  const resume = modules.find((m) => m.topic === resumeTopic) ?? modules[0];
  const dueForResume = resume?.dueCount ?? 0;
  const minutesLeft = estimateMinutes(dueForResume || 5);
  const seasonBest = seasonBestStreak(log, settings?.seasonStart ?? null);

  const install = activeCollection(book);
  const installName = install?.name ?? 'Current install';

  const resumeCard = useMemo(() => {
    const cards =
      resumeTopic === 'play-calls' || resumeTopic === 'formations'
        ? cardsForLearn(book, resumeTopic)
        : generateCards(resumeTopic);
    const due = cards.find((c) => isDue(progress[c.id])) ?? cards[0];
    return due ?? null;
  }, [resumeTopic, progress, book]);

  const resumeScene = useMemo(
    () => (resumeCard ? getCardScene(resumeCard) : null),
    [resumeCard],
  );

  const startTopic = (topic: TrainingTopic) => router.push(`/train/${topic}`);
  const startPlaybookModule = (mod: PlaybookModule) => {
    if (mod.playCount === 0) return;
    router.push({
      pathname: '/train/playbook',
      params: {
        bookId: mod.bookId,
        ...(mod.collectionId ? { collectionId: mod.collectionId } : {}),
      },
    });
  };
  const practiceInstall = () => {
    if (!book) {
      router.push({ pathname: '/learn/quiz', params: { topic: 'play-calls', n: '12' } });
      return;
    }
    router.push({
      pathname: '/learn/quiz',
      params: {
        bookId: book.id,
        ...(install?.id ? { collectionId: install.id } : {}),
        n: '12',
      },
    });
  };
  const browseLibrary = () => {
    setFilter('All topics');
    scrollRef.current?.scrollTo({ y: Math.max(0, libraryY.current - 16), animated: true });
  };

  const bumpGoal = async (delta: number) => {
    if (!settings) return;
    const next = Math.max(1, Math.min(14, (settings.weeklyGoal || 4) + delta));
    const updated = { ...settings, weeklyGoal: next };
    await saveSettings(updated);
    setSettings(updated);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
    >
      {isMobile ? (
        <View style={styles.mobileQuickRead}>
          <DailyQuickRead />
        </View>
      ) : null}

      <View style={[styles.hero, isMobile && styles.heroMobile]}>
        <View style={styles.heroCopy}>
          <Eyebrow>Learning center</Eyebrow>
          <Text style={styles.h1}>
            See the game{'\n'}
            <Text style={styles.h1Accent}>before it happens.</Text>
          </Text>
          <Text style={styles.sub}>
            Build football fluency through visual lessons, rapid recall, and game-ready concepts.
          </Text>
          <View style={styles.heroActions}>
            <Button
              label={`Practice ${installName}`}
              icon="play"
              onPress={practiceInstall}
            />
            <Button
              label="Continue lesson"
              icon="book"
              variant="secondary"
              onPress={() => startTopic(resume.topic)}
            />
            <Button
              label="Browse library"
              icon="grid"
              variant="secondary"
              onPress={browseLibrary}
            />
          </View>
        </View>

        <View style={styles.weekCard}>
          <View style={styles.weekTop}>
            <View>
              <Eyebrow>Weekly goal</Eyebrow>
              <Text style={styles.weekStrong}>
                {weekSessionDays} of {weekGoal} sessions
              </Text>
            </View>
            <View style={styles.goalStepper}>
              <Pressable style={styles.stepBtn} onPress={() => void bumpGoal(-1)}>
                <Text style={styles.stepText}>−</Text>
              </Pressable>
              <Text style={styles.weekScore}>{weekPct}%</Text>
              <Pressable style={styles.stepBtn} onPress={() => void bumpGoal(1)}>
                <Text style={styles.stepText}>+</Text>
              </Pressable>
            </View>
          </View>
          <ProgressBar value={weekPct} />
          <View style={styles.weekDays}>
            {days.map((day) => (
              <View
                key={day.date}
                style={[
                  styles.day,
                  day.status === 'done' && styles.dayComplete,
                  day.status === 'today' && styles.dayToday,
                ]}
              >
                <Text style={styles.dayMark}>
                  {day.status === 'done' ? '✓' : day.label}
                </Text>
                <Text style={styles.dayLabel}>
                  {day.status === 'done'
                    ? day.label
                    : day.status === 'today'
                      ? 'Today'
                      : '—'}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.streakRow}>
            <Icon name="spark" size={17} color={colors.lime} />
            <View>
              <Text style={styles.streakStrong}>{stats?.streakDays ?? 0} day streak</Text>
              <Text style={styles.streakSub}>Best this season: {seasonBest} days</Text>
            </View>
          </View>
        </View>
      </View>

      <Pressable style={styles.resume} onPress={() => startTopic(resume.topic)}>
        <View style={styles.resumeThumb}>
          {resumeScene ? (
            <FieldCanvas
              scene={{ ...resumeScene, title: '' }}
              height={88}
              compact
              interactive={false}
            />
          ) : (
            <Text style={styles.miniPlayer}>—</Text>
          )}
        </View>
        <View style={styles.resumeCopy}>
          <Eyebrow>Pick up where you left off</Eyebrow>
          <Text style={styles.resumeTitle}>
            {resume.title} · {resume.mastery}% mastery
          </Text>
          <Text style={styles.resumeSub}>
            {dueForResume > 0
              ? `${dueForResume} cards due · ${resume.lessons} lessons`
              : `${resume.lessons} lessons · Ready when you are`}
          </Text>
          <ProgressBar value={resume.mastery} style={{ marginTop: 10, maxWidth: 320 }} />
        </View>
        {!isMobile ? (
          <View style={styles.resumeTime}>
            <Text style={styles.resumeMin}>{minutesLeft || '—'}</Text>
            <Text style={styles.resumeMinLabel}>
              {dueForResume ? 'MIN LEFT' : 'READY'}
            </Text>
          </View>
        ) : null}
        <View style={styles.resumeBtn}>
          <Icon name="play" size={20} color="#182016" />
        </View>
      </Pressable>

      <View
        style={[styles.body, isMobile && styles.bodyMobile]}
        onLayout={(e) => {
          libraryY.current = e.nativeEvent.layout.y;
        }}
      >
        <View style={styles.library}>
          <View style={styles.sectionHead}>
            <View>
              <Eyebrow>Curriculum</Eyebrow>
              <Text style={styles.sectionTitle}>Build your football IQ</Text>
            </View>
            <View style={styles.pills}>
              {(['All topics', 'In progress', 'Completed'] as const).map((item) => (
                <Pressable
                  key={item}
                  style={[styles.pill, filter === item && styles.pillActive]}
                  onPress={() => setFilter(item)}
                >
                  <Text style={[styles.pillText, filter === item && styles.pillTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Text style={styles.trackLabel}>Offense</Text>
          <View style={[styles.moduleGrid, isMobile && styles.moduleGridMobile]}>
            {filteredOffense.length === 0 ? (
              <Text style={styles.emptyTrack}>No offense topics match this filter.</Text>
            ) : (
              filteredOffense.map((mod) => (
                <Pressable
                  key={mod.topic}
                  style={[
                    styles.module,
                    isMobile && styles.moduleMobile,
                    active === mod.topic && styles.moduleActive,
                  ]}
                  onPress={() => {
                    setActive(mod.topic);
                    startTopic(mod.topic);
                  }}
                >
                  <View style={[styles.moduleIcon, { backgroundColor: TONE_BG[mod.tone] }]}>
                    <Icon name={mod.icon} size={20} color="#172014" />
                  </View>
                  <View style={styles.moduleStatus}>
                    <Text style={styles.statusText}>{moduleStatusText(mod)}</Text>
                    <Icon name="arrow" size={14} color={colors.muted} />
                  </View>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <Text style={styles.moduleDesc}>{mod.description}</Text>
                  <View style={styles.moduleFooter}>
                    <Text style={styles.lessons}>{mod.lessons} lessons</Text>
                    <ProgressBar value={mod.mastery} style={{ flex: 1 }} />
                  </View>
                </Pressable>
              ))
            )}
          </View>

          <Text style={[styles.trackLabel, styles.trackLabelSpaced]}>Defense</Text>
          <View style={[styles.moduleGrid, isMobile && styles.moduleGridMobile]}>
            {filteredDefense.length === 0 ? (
              <Text style={styles.emptyTrack}>No defense topics match this filter.</Text>
            ) : (
              filteredDefense.map((mod) => (
                <Pressable
                  key={mod.topic}
                  style={[
                    styles.module,
                    isMobile && styles.moduleMobile,
                    active === mod.topic && styles.moduleActive,
                  ]}
                  onPress={() => {
                    setActive(mod.topic);
                    startTopic(mod.topic);
                  }}
                >
                  <View style={[styles.moduleIcon, { backgroundColor: TONE_BG[mod.tone] }]}>
                    <Icon name={mod.icon} size={20} color="#172014" />
                  </View>
                  <View style={styles.moduleStatus}>
                    <Text style={styles.statusText}>{moduleStatusText(mod)}</Text>
                    <Icon name="arrow" size={14} color={colors.muted} />
                  </View>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <Text style={styles.moduleDesc}>{mod.description}</Text>
                  <View style={styles.moduleFooter}>
                    <Text style={styles.lessons}>{mod.lessons} lessons</Text>
                    <ProgressBar value={mod.mastery} style={{ flex: 1 }} />
                  </View>
                </Pressable>
              ))
            )}
          </View>

          <View style={styles.playbooksSection}>
            <View style={[styles.sectionHead, isMobile && styles.sectionHeadStacked]}>
              <View style={styles.sectionHeadCopy}>
                <Eyebrow>Your playbooks</Eyebrow>
                <Text style={styles.sectionTitle}>Drill installs & collections</Text>
              </View>
              {books.length > 0 ? (
                <View style={[styles.bookPicker, isMobile && styles.bookPickerMobile]}>
                  <Select
                    label="Active playbook"
                    value={book?.name ?? books[0]?.name ?? ''}
                    options={books.map((b) => b.name)}
                    onChange={(name) => void selectPlaybook(name)}
                  />
                </View>
              ) : null}
            </View>
            {playbookModules.length === 0 ? (
              <Text style={styles.emptyPlaybooks}>Add plays in the Playbook tab.</Text>
            ) : (
              <View style={[styles.moduleGrid, isMobile && styles.moduleGridMobile]}>
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
                        styles.module,
                        isMobile && styles.moduleMobile,
                        mod.kind === 'collection' && styles.collectionModule,
                        disabled && styles.moduleDisabled,
                      ]}
                      disabled={disabled}
                      onPress={() => startPlaybookModule(mod)}
                    >
                      <View
                        style={[
                          styles.moduleIcon,
                          { backgroundColor: mod.color || TONE_BG.orange },
                        ]}
                      >
                        <Icon
                          name={mod.kind === 'playbook' ? 'book' : 'layers'}
                          size={20}
                          color="#172014"
                        />
                      </View>
                      <View style={styles.moduleStatus}>
                        <Text style={styles.statusText}>{moduleStatusText(mod)}</Text>
                        <Icon name="arrow" size={14} color={colors.muted} />
                      </View>
                      <Text style={styles.moduleTitle}>{mod.title}</Text>
                      <Text style={styles.moduleDesc}>{mod.description}</Text>
                      <View style={styles.moduleFooter}>
                        <Text style={styles.lessons}>
                          {mod.playCount === 0
                            ? 'Empty'
                            : `${mod.lessons} lesson${mod.lessons === 1 ? '' : 's'}`}
                        </Text>
                        <ProgressBar value={mod.mastery} style={{ flex: 1 }} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {!isMobile ? (
          <View style={styles.sidebar}>
            <DailyQuickRead />
            <View style={styles.mastery}>
              <View style={styles.masteryHead}>
                <View>
                  <Eyebrow>Your mastery</Eyebrow>
                  <Text style={styles.masteryTitle}>Topic mastery</Text>
                </View>
                <Text style={styles.masteryPct}>{overall}%</Text>
              </View>
              {mastery.map((row) => (
                <View key={row.label} style={styles.masteryRow}>
                  <Text style={styles.masteryLabel} numberOfLines={1}>
                    {row.label}
                  </Text>
                  <ProgressBar value={row.value} style={{ flex: 1 }} />
                  <Text style={styles.masteryVal}>{row.value}%</Text>
                </View>
              ))}
              {bookMasteryRows.length > 0 ? (
                <>
                  <Text style={styles.masteryDivider}>Playbooks</Text>
                  {bookMasteryRows.map((row, index) => (
                    <View key={`book-mastery-${row.label}-${index}`} style={styles.masteryRow}>
                      <Text style={styles.masteryLabel} numberOfLines={1}>
                        {row.label}
                      </Text>
                      <ProgressBar value={row.value} style={{ flex: 1 }} />
                      <Text style={styles.masteryVal}>{row.value}%</Text>
                    </View>
                  ))}
                </>
              ) : null}
              <Pressable onPress={() => router.push('/learn/report')}>
                <Text style={styles.reportLink}>View full report →</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.mobileMasteryWrap}>
            <Pressable
              style={styles.mastery}
              onPress={() => router.push('/learn/report')}
            >
              <Text style={styles.masteryTitle}>Mastery {overall}%</Text>
              <Text style={styles.reportLink}>View full report →</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 32, paddingBottom: 70 },
  contentMobile: { paddingHorizontal: 16, paddingTop: 16 },
  mobileQuickRead: { marginBottom: 20 },
  mobileMasteryWrap: { marginTop: 20, gap: 13 },
  hero: { flexDirection: 'row', gap: 48, alignItems: 'center', maxWidth: 1380 },
  heroMobile: { flexDirection: 'column', gap: 24 },
  heroCopy: { flex: 1.25 },
  h1: {
    marginTop: 12,
    fontSize: 48,
    lineHeight: 48,
    letterSpacing: -2,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilySemi,
  },
  h1Accent: { color: colors.lime },
  sub: { marginTop: 16, color: '#8b948d', fontSize: 14, lineHeight: 22, maxWidth: 480 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  weekCard: {
    flex: 0.75,
    minWidth: 260,
    padding: 24,
    borderWidth: 1,
    borderColor: '#343d37',
    borderRadius: 19,
    backgroundColor: '#141a17',
    gap: 14,
  },
  weekTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekStrong: { fontSize: 15, color: colors.text, fontWeight: '700', marginTop: 6 },
  goalStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  weekScore: { fontSize: 28, color: colors.lime, fontWeight: '800', minWidth: 56, textAlign: 'center' },
  weekDays: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  day: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a211d',
  },
  dayComplete: { backgroundColor: 'rgba(201,242,91,0.15)' },
  dayToday: { borderWidth: 1, borderColor: colors.lime },
  dayMark: { color: colors.text, fontSize: 11, fontWeight: '800' },
  dayLabel: { color: colors.dim, fontSize: 8, marginTop: 2 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakStrong: { color: colors.text, fontSize: 13, fontWeight: '700' },
  streakSub: { color: colors.dim, fontSize: 11 },
  resume: {
    marginTop: 40,
    padding: 14,
    borderWidth: 1,
    borderColor: '#323a35',
    borderRadius: 16,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  resumeThumb: {
    width: 140,
    height: 88,
    borderRadius: 10,
    backgroundColor: colors.turf,
    overflow: 'hidden',
  },
  miniPlayer: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 36,
  },
  resumeCopy: { flex: 1 },
  resumeTitle: { marginTop: 4, color: colors.text, fontSize: 16, fontWeight: '700' },
  resumeSub: { color: '#7e8881', fontSize: 11, marginTop: 2 },
  resumeTime: {
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#313934',
    alignItems: 'center',
  },
  resumeMin: { fontSize: 23, color: colors.text, fontWeight: '700' },
  resumeMinLabel: { color: '#6f7972', fontSize: 8, letterSpacing: 1 },
  resumeBtn: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { marginTop: 40, flexDirection: 'row', gap: 28, alignItems: 'flex-start' },
  bodyMobile: { flexDirection: 'column' },
  library: { flex: 1 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  sectionHeadStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  sectionHeadCopy: { flex: 1, minWidth: 0, alignSelf: 'stretch' },
  sectionTitle: {
    marginTop: 4,
    fontSize: 24,
    color: colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  trackLabel: {
    marginBottom: 12,
    color: colors.dim,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  trackLabelSpaced: {
    marginTop: 28,
  },
  emptyTrack: {
    color: '#6f7972',
    fontSize: 12,
    paddingVertical: 8,
  },
  pills: { flexDirection: 'row', gap: 6 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pillActive: { backgroundColor: colors.lime, borderColor: colors.lime },
  pillText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  pillTextActive: { color: '#172014' },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleGridMobile: { flexDirection: 'column' },
  module: {
    width: '31%',
    minWidth: 200,
    maxWidth: 340,
    minHeight: 190,
    padding: 17,
    borderWidth: 1,
    borderColor: '#2e3631',
    borderRadius: 14,
    backgroundColor: '#151a18',
  },
  moduleMobile: {
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  moduleActive: { borderColor: '#586357', backgroundColor: '#19201c' },
  moduleIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleStatus: {
    position: 'absolute',
    top: 18,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: { color: '#717b74', fontSize: 10, fontWeight: '700' },
  moduleTitle: {
    marginTop: 16,
    fontSize: 15,
    color: colors.text,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
  },
  moduleDesc: { marginTop: 6, color: '#78827b', fontSize: 12, lineHeight: 18, minHeight: 36 },
  moduleFooter: {
    marginTop: 'auto',
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  lessons: { color: '#667069', fontSize: 10 },
  playbooksSection: { marginTop: 32 },
  bookPicker: { minWidth: 200, maxWidth: 280, flexGrow: 1 },
  bookPickerMobile: {
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    flexGrow: 0,
    marginTop: 4,
  },
  collectionModule: { marginLeft: 8, borderStyle: 'dashed' },
  moduleDisabled: { opacity: 0.55 },
  emptyPlaybooks: { color: '#7e8881', fontSize: 13, paddingVertical: 8 },
  sidebar: { width: 315, gap: 13 },
  mastery: {
    padding: 19,
    borderWidth: 1,
    borderColor: '#303833',
    borderRadius: 16,
    backgroundColor: colors.card,
    gap: 12,
  },
  masteryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  masteryTitle: { marginTop: 4, fontSize: 14, color: colors.text, fontWeight: '700' },
  masteryPct: { fontSize: 24, color: colors.lime, fontWeight: '800' },
  masteryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  masteryLabel: { width: 72, color: '#8b948d', fontSize: 10 },
  masteryVal: { width: 32, textAlign: 'right', color: '#8b948d', fontSize: 10 },
  masteryDivider: {
    color: '#667069',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  reportLink: { color: colors.lime, fontSize: 12, fontWeight: '800', marginTop: 4 },
});
