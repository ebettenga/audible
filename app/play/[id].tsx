import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Platform,
  Modal,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FieldCanvas } from '@/src/render';
import { buildPlay } from '@/src/core/parser';
import {
  loadPlaybooks,
  markPlayViewed,
  updatePlay,
  addPlayToBook,
  removePlay,
  loadPlayActivity,
  appendPlayActivity,
  type Collection,
  type PlayActivity,
  type PlaybookPlay,
} from '@/src/training';
import { derivePlayMeta } from '@/src/features/playbook/playMeta';
import {
  assignmentsFromScene,
  defenseAssignmentsFromScene,
} from '@/src/features/playbook/playAssignments';
import { findPlay } from '@/src/features/playbook/findPlay';
import { PlaySwipePager } from '@/src/features/playbook/PlaySwipePager';
import {
  buildDetailScene,
  decodePlayIds,
  resolveViewerIds,
} from '@/src/features/playbook/playViewer';
import { Button, Eyebrow, Icon } from '@/src/ui';
import { colors, typography, radius, useBreakpoint } from '@/src/design';

function activityLabel(row: PlayActivity): string {
  switch (row.type) {
    case 'created':
      return 'Play created';
    case 'edited':
      return 'Play edited';
    case 'favorited':
      return 'Added to favorites';
    case 'unfavorited':
      return 'Removed from favorites';
    case 'added_to_collection':
      return `Added to ${row.payload?.collectionName ?? 'collection'}`;
    case 'removed_from_collection':
      return `Removed from ${row.payload?.collectionName ?? 'collection'}`;
    case 'reviewed':
      return 'Reviewed';
    default:
      return row.type;
  }
}

export default function PlayDetailScreen() {
  const {
    id,
    edit,
    collectionId: collectionIdParam,
    ids: idsParam,
    scope: scopeParam,
  } = useLocalSearchParams<{
    id: string;
    edit?: string;
    collectionId?: string;
    ids?: string;
    scope?: string;
  }>();
  const scopeLabel = typeof scopeParam === 'string' && scopeParam ? scopeParam : undefined;
  const router = useRouter();
  const { isMobile } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;
  const isNew = id === 'new';
  const collectionId =
    typeof collectionIdParam === 'string' && collectionIdParam
      ? collectionIdParam
      : undefined;

  useEffect(() => {
    if (!isNew) return;
    router.replace('/' as never);
  }, [isNew, router]);

  const [play, setPlay] = useState<PlaybookPlay | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [bookPlays, setBookPlays] = useState<PlaybookPlay[]>([]);
  const [bookId, setBookId] = useState('packers-2026');
  const [isEditing, setIsEditing] = useState(edit === '1' && !isNew);
  const [name, setName] = useState(isNew ? 'Untitled play' : '');
  const [concept, setConcept] = useState('');
  const [formation, setFormation] = useState('');
  const [playcall, setPlaycall] = useState(isNew ? '' : '');
  const [notes, setNotes] = useState('');
  const [coachingPoint, setCoachingPoint] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [saved, setSaved] = useState(!isNew && edit !== '1');
  const [tab, setTab] = useState<'Notes' | 'Assignments' | 'Activity'>('Notes');
  const [selected, setSelected] = useState('Z');
  const [showGrid, setShowGrid] = useState(false);
  const [activity, setActivity] = useState<PlayActivity[]>([]);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const applyPlay = useCallback((next: PlaybookPlay) => {
    setPlay(next);
    setName(next.name);
    setConcept(next.concept ?? '');
    setFormation(next.formation ?? '');
    setPlaycall(next.playcall);
    setNotes(next.notes ?? '');
    setCoachingPoint(next.coachingPoint ?? '');
  }, []);

  const load = useCallback(async () => {
    if (isNew || !id) return;
    const books = await loadPlaybooks();
    const found = findPlay(books, id) ?? (books[0]?.plays[0]
      ? { book: books[0], play: books[0].plays[0] }
      : null);
    if (!found) return;
    setBookId(found.book.id);
    setCollections(found.book.collections ?? []);
    setBookPlays(found.book.plays ?? []);
    applyPlay(found.play);
    setActivity(await loadPlayActivity(found.play.id));
    await markPlayViewed(found.book.id, found.play.id);
  }, [id, isNew, applyPlay]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const parsed = useMemo(() => {
    if (!play) return { scene: null as ReturnType<typeof buildPlay> | null, error: null as string | null };
    const call = isEditing ? playcall : play.playcall;
    if (!call.trim()) return { scene: null, error: null };
    try {
      return { scene: buildDetailScene(play, call), error: null };
    } catch (err) {
      return {
        scene: null,
        error: err instanceof Error ? err.message : 'Could not parse playcall',
      };
    }
  }, [play, playcall, isEditing]);

  const scene = parsed.scene;
  const liveParseError = isEditing ? parsed.error : parseError;

  const assignments = useMemo(
    () =>
      scene
        ? play?.side === 'def' || scene.flipped
          ? defenseAssignmentsFromScene(scene)
          : assignmentsFromScene(scene)
        : [],
    [scene, play?.side],
  );

  const membershipTags = useMemo(() => {
    if (!play || isNew) return [];
    return collections.filter((c) => c.playIds.includes(play.id)).map((c) => c.name);
  }, [collections, play, isNew]);

  const viewingCollection = useMemo(
    () => (collectionId ? collections.find((c) => c.id === collectionId) : undefined),
    [collections, collectionId],
  );

  const explicitIds = useMemo(() => decodePlayIds(idsParam), [idsParam]);

  const siblingIds = useMemo(
    () =>
      resolveViewerIds({
        ids: explicitIds,
        collection: viewingCollection,
        bookPlays,
      }),
    [explicitIds, viewingCollection, bookPlays],
  );

  const siblingPlays = useMemo(() => {
    const byId = new Map(bookPlays.map((p) => [p.id, p]));
    return siblingIds
      .map((pid) => (pid === play?.id ? play : byId.get(pid)))
      .filter((p): p is PlaybookPlay => !!p);
  }, [siblingIds, bookPlays, play]);

  const routeIndex = id ? siblingIds.indexOf(id) : -1;
  const siblingIndex = routeIndex >= 0 ? routeIndex : play ? siblingIds.indexOf(play.id) : -1;
  const prevPlayId = siblingIndex > 0 ? siblingIds[siblingIndex - 1] : null;
  const nextPlayId =
    siblingIndex >= 0 && siblingIndex < siblingIds.length - 1
      ? siblingIds[siblingIndex + 1]
      : null;

  const goToSibling = (playId: string) => {
    if (playId === id) return;
    const target = bookPlays.find((p) => p.id === playId);
    if (target) applyPlay(target);
    router.setParams({ id: playId });
  };

  const crumbScope = viewingCollection?.name ?? scopeLabel;

  const selectedAssignment = assignments.find((a) => a.player === selected) ?? assignments[0];

  const markDirty = () => setSaved(false);

  const save = async () => {
    if (!play) return;
    const call = playcall.trim();
    if (!call) {
      setParseError('Playcall is required');
      return;
    }
    const meta = derivePlayMeta(call, play.assignments);
    if (!meta.scene) {
      setParseError('Playcall could not be parsed');
      return;
    }
    const payload = {
      name: name.trim() || 'Untitled play',
      playcall: call,
      concept: concept.trim() || meta.concept,
      formation: formation.trim() || meta.formation,
      personnel: meta.personnel,
      notes: notes.trim() || undefined,
      coachingPoint: coachingPoint.trim() || undefined,
      assignments: play.assignments,
    };
    if (isNew) {
      const list = await addPlayToBook(bookId, {
        ...payload,
        favorite: false,
      });
      const created = list[0]?.plays[list[0].plays.length - 1];
      if (created) {
        await appendPlayActivity({ playId: created.id, type: 'created' });
        setSaved(true);
        setIsEditing(false);
        router.replace(`/play/${created.id}`);
      }
      return;
    }
    const list = await updatePlay(bookId, play.id, payload);
    const updated = list.find((b) => b.id === bookId)?.plays.find((p) => p.id === play.id);
    if (updated) {
      setPlay(updated);
      setConcept(updated.concept ?? '');
      setFormation(updated.formation ?? '');
      setActivity(await appendPlayActivity({ playId: play.id, type: 'edited' }));
    }
    setSaved(true);
    setIsEditing(false);
  };

  const sharePlay = async () => {
    if (!play) return;
    const message = `${name}\n${playcall || play.playcall}\n${concept || play.concept || ''}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        setShareMsg('Copied playcall');
      } else {
        await Share.share({ message, title: name });
      }
    } catch {
      setShareMsg('Could not share');
    }
    setTimeout(() => setShareMsg(null), 2000);
  };

  const deletePlay = async () => {
    if (!play || isNew) return;
    await removePlay(bookId, play.id);
    setConfirmDelete(false);
    router.replace('/playbook');
  };

  if (isNew) {
    return (
      <SafeAreaView style={[styles.screen, styles.loading]} edges={['top', 'bottom']}>
        <Text style={styles.muted}>Opening builder…</Text>
      </SafeAreaView>
    );
  }

  if (!play) {
    return (
      <SafeAreaView style={[styles.screen, styles.loading]} edges={['top', 'bottom']}>
        <Text style={styles.muted}>Loading play…</Text>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 12, paddingBottom: bottomInset + 48 },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.breadcrumb}>
          <Pressable onPress={() => router.push('/playbook')} style={styles.backBtn}>
            <Text style={styles.backText}>← Playbook</Text>
          </Pressable>
          <Icon name="chevron" size={12} color="#555f58" />
          {crumbScope ? (
            <>
              <Text style={styles.crumbName}>{crumbScope}</Text>
              <Icon name="chevron" size={12} color="#555f58" />
            </>
          ) : null}
          <Text style={styles.crumbName}>{name}</Text>
        </View>
        <View style={styles.actions}>
          {siblingIds.length > 1 ? (
            <View style={styles.pager}>
              <Pressable
                accessibilityLabel="Previous play"
                disabled={!prevPlayId}
                style={[styles.pagerBtn, !prevPlayId && styles.pagerBtnDisabled]}
                onPress={() => prevPlayId && goToSibling(prevPlayId)}
              >
                <Text style={styles.pagerText}>←</Text>
              </Pressable>
              <Text style={styles.pagerCount}>
                {siblingIndex + 1} / {siblingIds.length}
              </Text>
              <Pressable
                accessibilityLabel="Next play"
                disabled={!nextPlayId}
                style={[styles.pagerBtn, !nextPlayId && styles.pagerBtnDisabled]}
                onPress={() => nextPlayId && goToSibling(nextPlayId)}
              >
                <Text style={styles.pagerText}>→</Text>
              </Pressable>
            </View>
          ) : null}
          <Text style={[styles.saveStatus, saved && styles.saveSaved]}>
            {shareMsg ?? (saved ? '● All changes saved' : '● Unsaved changes')}
          </Text>
          <Button label="Share" icon="users" variant="secondary" onPress={() => void sharePlay()} />
          <Button
            label="Delete"
            variant="secondary"
            onPress={() => setConfirmDelete(true)}
          />
          {isEditing ? (
            <Button label="Save changes" icon="spark" onPress={() => void save()} />
          ) : (
            <Button
              label="Edit play"
              icon="settings"
              onPress={() => {
                if (!play || isNew) return;
                router.push(`/?bookId=${bookId}&playId=${play.id}` as never);
              }}
            />
          )}
        </View>
      </View>

      <View style={[styles.titlebar, isMobile && { flexDirection: 'column', alignItems: 'flex-start' }]}>
        <View style={{ flex: 1 }}>
          <Eyebrow>
            {isEditing
              ? 'Editing play'
              : `${(play.formation ?? formation) || 'Offense'} · ${play.personnel ?? '11'} personnel`}
          </Eyebrow>
          {isEditing ? (
            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                markDirty();
              }}
              style={styles.titleInput}
            />
          ) : (
            <Text style={styles.h1}>{name}</Text>
          )}
          <View style={styles.tags}>
            {(concept || play.concept) ? (
              <Text style={styles.tag}>{concept || play.concept}</Text>
            ) : null}
            {(formation || play.formation) ? (
              <Text style={styles.tag}>{formation || play.formation}</Text>
            ) : null}
            {membershipTags.map((t) => (
              <Text key={t} style={styles.tag}>
                {t}
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.metrics}>
          <View>
            <Text style={styles.metricStrong}>{play.reviewCount ?? 0}</Text>
            <Text style={styles.metricLabel}>Times reviewed</Text>
          </View>
          <View>
            <Text style={styles.metricStrong}>{play.installs ?? membershipTags.length}</Text>
            <Text style={styles.metricLabel}>Installs</Text>
          </View>
          <View>
            <Text style={styles.metricStrong}>
              {(play.updatedAt ?? play.createdAt).slice(5, 10)}
            </Text>
            <Text style={styles.metricLabel}>Last updated</Text>
          </View>
        </View>
      </View>

      {isEditing ? (
        <View style={styles.editFields}>
          <Text style={styles.fieldLabel}>Playcall</Text>
          <TextInput
            value={playcall}
            onChangeText={(v) => {
              setPlaycall(v);
              markDirty();
            }}
            placeholder="Ace Twins Right 62 Slant-Flat"
            placeholderTextColor={colors.faint}
            style={styles.input}
            autoCapitalize="words"
          />
          {liveParseError ? <Text style={styles.error}>{liveParseError}</Text> : null}
          <Text style={styles.fieldLabel}>Formation</Text>
          <TextInput
            value={formation}
            onChangeText={(v) => {
              setFormation(v);
              markDirty();
            }}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Concept</Text>
          <TextInput
            value={concept}
            onChangeText={(v) => {
              setConcept(v);
              markDirty();
            }}
            style={styles.input}
          />
        </View>
      ) : null}

      <View style={[styles.workspace, isMobile && styles.workspaceMobile]}>
        <View style={styles.fieldWrap}>
          <View style={styles.fieldToolbar}>
            <View style={styles.modes}>
              <Text style={[styles.mode, styles.modeActive]}>Diagram</Text>
              {!isEditing && siblingPlays.length > 1 ? (
                <Text style={styles.mode}>
                  {`Swipe ← → · ${siblingIndex + 1} of ${siblingPlays.length}`}
                </Text>
              ) : null}
            </View>
            <View style={styles.tools}>
              <Pressable onPress={() => setShowGrid((g) => !g)}>
                <Text style={[styles.tool, showGrid && styles.modeActive]}>
                  {showGrid ? 'Grid on' : 'Grid'}
                </Text>
              </Pressable>
            </View>
          </View>
          {!isEditing && siblingPlays.length > 1 && siblingIndex >= 0 ? (
            <PlaySwipePager
              plays={siblingPlays}
              index={siblingIndex}
              onIndexChange={(i) => {
                const next = siblingPlays[i];
                if (next) goToSibling(next.id);
              }}
              height={isMobile ? 340 : 520}
              showGrid={showGrid}
              selectedLabel={selected}
              onPlayerPress={(p) => {
                if (p.label) setSelected(p.label);
              }}
            />
          ) : scene ? (
            <FieldCanvas
              scene={scene}
              height={isMobile ? 340 : 520}
              showLabels
              showGrid={showGrid}
              caption={concept || play.concept}
              routesVisible
              selectedPlayerId={
                scene.players.find((p) => p.label === selected && p.side === 'off')?.id
              }
              onPlayerPress={(p) => {
                if (p.label) setSelected(p.label);
              }}
            />
          ) : (
            <View style={styles.fieldFallback}>
              <Text style={styles.muted}>
                {isNew || isEditing
                  ? 'Enter a playcall to preview the diagram'
                  : 'Could not render playcall'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.inspector}>
          <View style={styles.tabs}>
            {(['Notes', 'Assignments', 'Activity'] as const).map((item) => (
              <Pressable
                key={item}
                style={[styles.tab, tab === item && styles.tabActive]}
                onPress={() => setTab(item)}
              >
                <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          {tab === 'Assignments' ? (
            <ScrollView contentContainerStyle={styles.inspectorBody}>
              {selectedAssignment ? (
                <>
                  <View style={styles.selectedRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{selectedAssignment.player}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Eyebrow>Selected player</Eyebrow>
                      <Text style={styles.selectedName}>{selectedAssignment.player}</Text>
                    </View>
                  </View>
                  <Text style={styles.fieldLabel}>Assignment</Text>
                  <Text style={styles.assignmentStrong}>{selectedAssignment.route}</Text>
                  {selectedAssignment.hint ? (
                    <Text style={styles.assignmentHint}>{selectedAssignment.hint}</Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.muted}>No assignments yet.</Text>
              )}
              <View style={styles.listHead}>
                <Text style={styles.listTitle}>All assignments</Text>
                <Text style={styles.listCount}>{assignments.length} players</Text>
              </View>
              {assignments.map((row) => (
                <Pressable
                  key={row.playerId}
                  style={[styles.assignRow, selected === row.player && styles.assignActive]}
                  onPress={() => setSelected(row.player)}
                >
                  <Text style={styles.assignPlayer}>{row.player}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.assignRoute}>{row.route}</Text>
                    <Text style={styles.assignKind}>{row.kind}</Text>
                  </View>
                  <Icon name="chevron" size={13} color={colors.muted} />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {tab === 'Notes' ? (
            <View style={styles.inspectorBody}>
              <Eyebrow>Coaching notes</Eyebrow>
              <Text style={styles.notesTitle}>Install emphasis</Text>
              {isEditing ? (
                <TextInput
                  value={notes}
                  onChangeText={(v) => {
                    setNotes(v);
                    markDirty();
                  }}
                  multiline
                  placeholder="Add coaching notes…"
                  placeholderTextColor={colors.faint}
                  style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
                />
              ) : (
                <Text style={styles.notesBody}>
                  {notes || 'No notes yet. Edit the play to add coaching notes.'}
                </Text>
              )}
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Coaching point</Text>
              {isEditing ? (
                <TextInput
                  value={coachingPoint}
                  onChangeText={(v) => {
                    setCoachingPoint(v);
                    markDirty();
                  }}
                  placeholder="One-line coaching point"
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
              ) : (
                <Text style={styles.notesBody}>
                  {coachingPoint || 'No coaching point set.'}
                </Text>
              )}
            </View>
          ) : null}

          {tab === 'Activity' ? (
            <View style={styles.inspectorBody}>
              {activity.length === 0 ? (
                <Text style={styles.muted}>No activity yet on this device.</Text>
              ) : (
                activity.map((row) => (
                  <View key={row.id} style={styles.activityRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {row.type.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.assignRoute}>{activityLabel(row)}</Text>
                      <Text style={styles.assignKind}>
                        {new Date(row.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Eyebrow>Coaching point</Eyebrow>
          <Text style={styles.footerCopy}>
            {coachingPoint || play.coachingPoint || 'Add a coaching point when you edit this play.'}
          </Text>
        </View>
      </View>

      <Modal
        visible={confirmDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDelete(false)}
      >
        <View style={styles.menuBackdrop}>
          <View style={styles.menuSheet}>
            <Text style={styles.menuTitle}>Delete {name}?</Text>
            <Text style={styles.menuSub}>This removes the play from your playbook. It cannot be undone.</Text>
            <Button label="Delete" onPress={() => void deletePlay()} />
            <Button label="Cancel" variant="secondary" onPress={() => setConfirmDelete(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  loading: { justifyContent: 'center', padding: 24 },
  content: { padding: 24, paddingBottom: 48, gap: 12 },
  muted: { color: colors.muted },
  error: { color: '#e98c80', fontSize: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { paddingVertical: 4 },
  backText: { color: '#a2aba4', fontSize: 12 },
  crumbName: { color: '#555f58', fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderMid,
    backgroundColor: '#171c1a',
  },
  pagerBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202722',
  },
  pagerBtnDisabled: { opacity: 0.35 },
  pagerText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  pagerCount: { color: colors.muted, fontSize: 11, fontWeight: '700', minWidth: 40, textAlign: 'center' },
  saveStatus: { color: '#9b6e62', fontSize: 11, marginRight: 4 },
  saveSaved: { color: '#717c74' },
  titlebar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 24,
    minHeight: 90,
  },
  h1: {
    marginTop: 4,
    fontSize: 30,
    letterSpacing: -1,
    color: colors.text,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
  },
  titleInput: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: '#536054',
    paddingVertical: 4,
    maxWidth: 480,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#202722',
    color: '#879189',
    fontSize: 10,
  },
  metrics: { flexDirection: 'row', gap: 28 },
  metricStrong: { fontSize: 14, color: colors.text, fontWeight: '700' },
  metricLabel: { color: '#667069', fontSize: 10, marginTop: 2 },
  editFields: { gap: 8, marginBottom: 8 },
  workspace: {
    minHeight: 520,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#303833',
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: '#151a18',
  },
  workspaceMobile: { flexDirection: 'column' },
  fieldWrap: { flex: 1, borderRightWidth: 1, borderRightColor: '#303833' },
  fieldToolbar: {
    height: 52,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#303833',
    backgroundColor: colors.card,
  },
  modes: { flexDirection: 'row', gap: 14 },
  mode: { color: '#69736c', fontSize: 11, fontWeight: '700' },
  modeActive: { color: colors.text },
  tools: { flexDirection: 'row', gap: 12 },
  tool: { color: '#879189', fontSize: 11 },
  fieldFallback: { height: 320, alignItems: 'center', justifyContent: 'center' },
  inspector: { width: 290, backgroundColor: colors.card },
  tabs: {
    height: 52,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#303833',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.lime },
  tabText: { color: '#69736c', fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: '#e5e9e2' },
  inspectorBody: { padding: 16, gap: 8 },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.wr,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#112230', fontWeight: '800', fontSize: 11 },
  selectedName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
  },
  assignmentStrong: { color: colors.text, fontSize: 14, fontWeight: '700' },
  assignmentHint: { color: colors.dim, fontSize: 11, lineHeight: 16 },
  listHead: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
  listCount: { color: colors.muted, fontSize: 10 },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  assignActive: { backgroundColor: '#202722' },
  assignPlayer: {
    width: 28,
    height: 24,
    borderRadius: 6,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#2a322d',
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
    lineHeight: 24,
  },
  assignRoute: { color: colors.text, fontSize: 12, fontWeight: '700' },
  assignKind: { color: colors.muted, fontSize: 10 },
  notesTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  notesBody: { color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 8 },
  activityRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  footerCopy: { color: '#929b94', fontSize: 12, marginTop: 4 },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuSheet: {
    width: '100%',
    maxWidth: 360,
    gap: 10,
    padding: 20,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  menuTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  menuSub: { color: colors.muted, fontSize: 13, marginBottom: 8 },
});
