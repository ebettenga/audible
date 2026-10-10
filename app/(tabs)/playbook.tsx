import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  loadPlaybooks,
  loadSettings,
  saveSettings,
  resolveActiveBook,
  toggleFavorite,
  createCollection,
  createPlaybook,
  updateCollection,
  deleteCollection,
  setActiveCollection,
  duplicatePlay,
  removePlay,
  addPlayToCollection,
  removePlayFromCollection,
  PLAYBOOK_PLAY_LIMIT,
  type Collection,
  type Playbook,
  type PlaybookPlay,
  type UserSettings,
} from '@/src/training';
import { PlayPreview } from '@/src/features/playbook';
import { encodePlayIds, selectionInOrder } from '@/src/features/playbook/playViewer';
import {
  CollectionCreateSheet,
  COLLECTION_COLORS,
} from '@/src/features/playbook/CollectionCreateSheet';
import { Button, Eyebrow, Icon, IconButton, ModalShell, ProgressBar } from '@/src/ui';
import { colors, typography, radius, useBreakpoint } from '@/src/design';

type LibraryFilter = 'All plays' | 'Offense' | 'Defense' | 'Favorites' | 'Recently viewed';
type SortKey = 'name' | 'updated' | 'viewed' | 'reviewed';

const SORT_LABELS: Record<SortKey, string> = {
  name: 'Name',
  updated: 'Recently updated',
  viewed: 'Recently viewed',
  reviewed: 'Most reviewed',
};

export default function PlaybookScreen() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();
  const { width } = useWindowDimensions();
  const [books, setBooks] = useState<Playbook[]>([]);
  const [bookId, setBookId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [search, setSearch] = useState('');
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>('All plays');
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState<SortKey>('updated');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [collectionMenu, setCollectionMenu] = useState<Collection | null>(null);
  const [renameCollection, setRenameCollection] = useState<Collection | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [menuPlay, setMenuPlay] = useState<PlaybookPlay | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PlaybookPlay | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkCollectionOpen, setBulkCollectionOpen] = useState(false);
  const [pickInstallOpen, setPickInstallOpen] = useState(false);

  const persistActiveBook = useCallback(async (id: string) => {
    const current = settings ?? (await loadSettings());
    if (current.activeBookId === id) {
      setSettings(current);
      return;
    }
    const next = { ...current, activeBookId: id };
    await saveSettings(next);
    setSettings(next);
  }, [settings]);

  const selectBook = useCallback(
    (id: string) => {
      setBookId(id);
      setCollectionFilter(null);
      setLibraryFilter('All plays');
      setSelectedIds(new Set());
      void persistActiveBook(id);
    },
    [persistActiveBook],
  );

  const refresh = useCallback(async () => {
    const [list, loadedSettings] = await Promise.all([loadPlaybooks(), loadSettings()]);
    setBooks(list);
    setSettings(loadedSettings);
    const active = resolveActiveBook(list, loadedSettings);
    setBookId((prev) => {
      if (prev && list.some((b) => b.id === prev)) return prev;
      return active?.id ?? list[0]?.id ?? null;
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const book = books.find((b) => b.id === bookId) ?? books[0];
  const plays = useMemo(() => book?.plays ?? [], [book]);
  const collections = useMemo(() => book?.collections ?? [], [book]);
  const active = collections.find((c) => c.isActive) ?? null;
  const favorites = plays.filter((p) => p.favorite).length;
  const total = plays.length;
  const storageRatio = total / PLAYBOOK_PLAY_LIMIT;

  const filterLabel = collectionFilter
    ? collections.find((c) => c.id === collectionFilter)?.name ?? 'Collection'
    : libraryFilter;

  const visible = useMemo(() => {
    let rows = plays.filter((play) => {
      const hay = `${play.name} ${play.concept ?? ''} ${play.formation ?? ''} ${play.playcall}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
      if (collectionFilter) {
        const col = collections.find((c) => c.id === collectionFilter);
        return !!col?.playIds.includes(play.id);
      }
      if (libraryFilter === 'Favorites') return !!play.favorite;
      if (libraryFilter === 'Recently viewed') return !!play.lastViewedAt;
      if (libraryFilter === 'Offense') return play.side !== 'def';
      if (libraryFilter === 'Defense') return play.side === 'def';
      return true;
    });

    rows = [...rows].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'viewed') {
        return (b.lastViewedAt ?? '').localeCompare(a.lastViewedAt ?? '');
      }
      if (sort === 'reviewed') {
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      }
      return (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt);
    });
    return rows;
  }, [plays, search, libraryFilter, collectionFilter, collections, sort]);

  const installPlays = useMemo(() => {
    if (!active) return [];
    return active.playIds
      .map((id) => plays.find((p) => p.id === id))
      .filter((p): p is PlaybookPlay => !!p);
  }, [active, plays]);

  const onFavorite = async (play: PlaybookPlay) => {
    if (!book) return;
    setBooks(await toggleFavorite(book.id, play.id));
  };

  const openPlay = (id: string, scopeCollectionId?: string | null) => {
    if (scopeCollectionId) {
      router.push({ pathname: '/play/[id]', params: { id, collectionId: scopeCollectionId } });
      return;
    }
    const listIds = visible.map((p) => p.id);
    router.push({
      pathname: '/play/[id]',
      params: {
        id,
        ids: encodePlayIds(listIds.includes(id) ? listIds : [id, ...listIds]),
        scope: filterLabel,
        ...(collectionFilter ? { collectionId: collectionFilter } : {}),
      },
    });
  };

  const viewSelected = () => {
    const ids = selectionInOrder(visible, selectedIds);
    if (!ids.length) return;
    router.push({
      pathname: '/play/[id]',
      params: {
        id: ids[0]!,
        ids: encodePlayIds(ids),
        scope: `${ids.length} selected`,
      },
    });
  };

  const makeActiveInstall = async (collectionId: string) => {
    if (!book) return;
    setBooks(await setActiveCollection(book.id, collectionId));
  };

  const createPlay = () => {
    const parts: string[] = [];
    if (book?.id) parts.push(`bookId=${encodeURIComponent(book.id)}`);
    const destCollection = collectionFilter ?? active?.id;
    if (destCollection) parts.push(`collectionId=${encodeURIComponent(destCollection)}`);
    router.push((parts.length ? `/?${parts.join('&')}` : '/') as never);
  };

  const selectLibrary = (filter: LibraryFilter) => {
    setLibraryFilter(filter);
    setCollectionFilter(null);
  };

  const selectCollection = (id: string) => {
    setCollectionFilter(id);
    setLibraryFilter('All plays');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const gridCols = width >= 1200 ? 3 : width >= 780 ? 2 : 1;

  const sidebar = (
    <View style={styles.sidebar}>
      <Eyebrow>Workspace</Eyebrow>
      <Text style={styles.sideTitle}>{book?.name ?? 'My playbook'}</Text>
      {books.length > 0 ? (
        <>
          <Text style={styles.sideLabel}>Playbooks</Text>
          {books.map((b) => {
            const isCurrent = b.id === book?.id;
            return (
              <Pressable
                key={b.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isCurrent }}
                style={[styles.navBtn, isCurrent && styles.navBtnActive]}
                onPress={() => {
                  if (isCurrent) return;
                  selectBook(b.id);
                }}
              >
                <Icon name="book" size={16} color={isCurrent ? colors.lime : colors.muted} />
                <Text
                  style={[styles.navText, isCurrent && styles.navTextActive]}
                  numberOfLines={1}
                >
                  {b.name}
                </Text>
                <Text style={[styles.navCount, isCurrent && { color: colors.lime }]}>
                  {b.plays.length}
                </Text>
              </Pressable>
            );
          })}
        </>
      ) : null}
      <Button
        label="New playbook"
        variant="secondary"
        onPress={() => {
          void (async () => {
            const list = await createPlaybook({ name: `Playbook ${books.length + 1}` });
            setBooks(list);
            const created = list[list.length - 1];
            if (created) selectBook(created.id);
          })();
        }}
        style={{ marginTop: 8 }}
      />
      <Button label="Create new play" icon="plus" onPress={createPlay} style={{ marginTop: 8 }} />
      <Text style={styles.sideLabel}>Library</Text>
      {(
        [
          ['All plays', 'grid', String(total)],
          ['Offense', 'arrow', String(plays.filter((p) => p.side !== 'def').length)],
          ['Defense', 'layers', String(plays.filter((p) => p.side === 'def').length)],
          ['Favorites', 'spark', String(favorites)],
          [
            'Recently viewed',
            'arrow',
            String(plays.filter((p) => p.lastViewedAt).length),
          ],
        ] as const
      ).map(([label, icon, count]) => (
        <Pressable
          key={label}
          style={[
            styles.navBtn,
            !collectionFilter && libraryFilter === label && styles.navBtnActive,
          ]}
          onPress={() => selectLibrary(label)}
        >
          <Icon
            name={icon}
            size={16}
            color={
              !collectionFilter && libraryFilter === label ? colors.lime : colors.muted
            }
          />
          <Text
            style={[
              styles.navText,
              !collectionFilter && libraryFilter === label && styles.navTextActive,
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.navCount,
              !collectionFilter && libraryFilter === label && { color: colors.lime },
            ]}
          >
            {count}
          </Text>
        </Pressable>
      ))}
      <View style={styles.collectionsHead}>
        <Text style={styles.sideLabel}>Collections</Text>
        <IconButton name="plus" label="Add collection" onPress={() => setCreateOpen(true)} />
      </View>
      {collections.map((c) => (
        <Pressable
          key={c.id}
          style={[styles.collection, collectionFilter === c.id && styles.navBtnActive]}
          onPress={() => selectCollection(c.id)}
          onLongPress={() => setCollectionMenu(c)}
        >
          <View style={[styles.dot, { backgroundColor: c.color }]} />
          <Text
            style={[styles.navText, collectionFilter === c.id && styles.navTextActive]}
            numberOfLines={1}
          >
            {c.name}
            {c.isActive ? ' · install' : ''}
          </Text>
          <Text style={styles.navCount}>{c.playIds.length}</Text>
          <Pressable
            accessibilityLabel={`Manage ${c.name}`}
            hitSlop={8}
            style={styles.collectionMenuBtn}
            onPress={(e) => {
              e?.stopPropagation?.();
              setCollectionMenu(c);
            }}
          >
            <Text style={styles.menuDots}>···</Text>
          </Pressable>
        </Pressable>
      ))}
      <View style={styles.storage}>
        <View style={styles.storageRow}>
          <Icon name="book" size={16} color={colors.muted} />
          <Text style={styles.storageLabel}>Playbook storage</Text>
          <Text style={styles.storageStrong}>
            {total} / {PLAYBOOK_PLAY_LIMIT}
          </Text>
        </View>
        <ProgressBar value={storageRatio} />
        <Text style={styles.storageHint}>Stored on this device · sync later with backend.</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.page}>
      {!isMobile ? (
        <ScrollView
          style={styles.sidebarScroll}
          contentContainerStyle={styles.sidebarScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sidebar}
        </ScrollView>
      ) : null}

      <ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Eyebrow>
              {(book?.systemIds ?? ['west-coast'])
                .map((id) =>
                  id === 'west-coast'
                    ? 'West Coast'
                    : id === 'air-coryell'
                      ? 'Air Coryell'
                      : id === 'air-raid'
                        ? 'Air Raid'
                        : id,
                )
                .join(' · ')}
            </Eyebrow>
            <Text style={styles.h1}>Every call. One place.</Text>
            <Text style={styles.sub}>
              Organize, review, and install your complete offensive identity.
            </Text>
          </View>
          {isMobile ? (
            <View style={{ gap: 8 }}>
              <Button label="New play" icon="plus" onPress={createPlay} />
              <Button
                label="Filters"
                icon="layers"
                variant="secondary"
                onPress={() => setMobileFiltersOpen(true)}
              />
            </View>
          ) : (
            <View style={styles.stat}>
              <Text style={styles.statNum}>{total}</Text>
              <View>
                <Text style={styles.statLabel}>total plays</Text>
                <Text style={styles.statSmall}>stored locally</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.install}>
          {active ? (
            <>
              <View style={styles.installCopy}>
                <Text style={styles.installTag}>● CURRENT INSTALL</Text>
                <Text style={styles.installTitle}>{active.name}</Text>
                <Text style={styles.installBody}>
                  {active.description ??
                    `${installPlays.length} plays in this install. Study progress lives on this device.`}
                </Text>
                <View style={styles.installMeta}>
                  {active.rosterSize != null ? (
                    <Text style={styles.metaChip}>{active.rosterSize} players</Text>
                  ) : null}
                  <Text style={styles.metaChip}>{installPlays.length} plays</Text>
                  {active.targetDate ? (
                    <Text style={styles.metaChip}>{active.targetDate.slice(0, 10)}</Text>
                  ) : (
                    <Text style={styles.metaChip}>Local install</Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Button
                    label="Open install"
                    icon="arrow"
                    onPress={() => {
                      selectCollection(active.id);
                      if (installPlays[0]) openPlay(installPlays[0].id, active.id);
                    }}
                  />
                  <Button
                    label="Edit"
                    variant="secondary"
                    onPress={() => setCollectionMenu(active)}
                  />
                  {collections.length > 1 ? (
                    <Button
                      label="Change install"
                      variant="secondary"
                      onPress={() => setPickInstallOpen(true)}
                    />
                  ) : null}
                </View>
              </View>
              {!isMobile ? (
                <View style={styles.stack}>
                  {installPlays.slice(0, 3).map((play, i) => (
                    <View
                      key={play.id}
                      style={[
                        styles.stackCard,
                        i === 0 && styles.stackBack,
                        i === 1 && styles.stackMid,
                        i === 2 && styles.stackFront,
                        installPlays.length === 1 && styles.stackFront,
                        installPlays.length === 2 && i === 1 && styles.stackFront,
                      ]}
                    >
                      <PlayPreview
                        playcall={play.playcall}
                        assignments={play.assignments}
                        side={play.side ?? 'off'}
                        vsPlaycall={play.vsPlaycall}
                        height={i === 2 || installPlays.length <= 2 ? 120 : 110}
                      />
                      {(i === 2 || installPlays.length - 1 === i) && (
                        <Text style={styles.stackLabel}>{play.name}</Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.installCopy}>
              <Text style={styles.installTag}>● NO ACTIVE INSTALL</Text>
              <Text style={styles.installTitle}>
                {collections.length ? 'Choose an install' : 'Create an install'}
              </Text>
              <Text style={styles.installBody}>
                Flag a collection as the current install to focus this week&apos;s calls.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {collections.length > 0 ? (
                  <Button
                    label="Set current install"
                    icon="spark"
                    onPress={() => setPickInstallOpen(true)}
                  />
                ) : null}
                <Button
                  label="Create collection"
                  icon="plus"
                  variant={collections.length > 0 ? 'secondary' : undefined}
                  onPress={() => setCreateOpen(true)}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.toolbar}>
          <View>
            <Eyebrow>Library</Eyebrow>
            <Text style={styles.libTitle}>
              {filterLabel} <Text style={styles.libCount}>{visible.length} plays</Text>
            </Text>
          </View>
          <View style={styles.controls}>
            {collectionFilter &&
            collections.find((c) => c.id === collectionFilter) &&
            !collections.find((c) => c.id === collectionFilter)?.isActive ? (
              <Button
                label="Set as current install"
                icon="spark"
                variant="secondary"
                onPress={() => void makeActiveInstall(collectionFilter)}
              />
            ) : null}
            <View style={styles.search}>
              <Icon name="search" size={15} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search plays..."
                placeholderTextColor={colors.dim}
                style={styles.searchInput}
              />
            </View>
            <Pressable
              style={styles.sortBtn}
              onPress={() => {
                const keys: SortKey[] = ['updated', 'viewed', 'reviewed', 'name'];
                const idx = keys.indexOf(sort);
                setSort(keys[(idx + 1) % keys.length]);
              }}
            >
              <Text style={styles.sortText}>{SORT_LABELS[sort]}</Text>
            </Pressable>
            <View style={styles.viewSwitch}>
              <Pressable
                style={[styles.viewBtn, view === 'grid' && styles.viewBtnActive]}
                onPress={() => setView('grid')}
              >
                <Icon name="grid" size={15} color={view === 'grid' ? colors.text : colors.muted} />
              </Pressable>
              <Pressable
                style={[styles.viewBtn, view === 'list' && styles.viewBtnActive]}
                onPress={() => setView('list')}
              >
                <Icon name="layers" size={15} color={view === 'list' ? colors.text : colors.muted} />
              </Pressable>
            </View>
          </View>
        </View>

        {selectedIds.size > 0 ? (
          <View style={styles.bulkBar}>
            <Text style={styles.bulkText}>{selectedIds.size} selected</Text>
            <Button
              label={`View ${selectedIds.size} play${selectedIds.size === 1 ? '' : 's'}`}
              icon="arrow"
              onPress={viewSelected}
            />
            <Button
              label="Add to collection"
              variant="secondary"
              onPress={() => setBulkCollectionOpen(true)}
            />
            <Button
              label="Favorite"
              variant="secondary"
              onPress={() => {
                void (async () => {
                  if (!book) return;
                  let next = books;
                  for (const id of selectedIds) {
                    const play = plays.find((p) => p.id === id);
                    if (play && !play.favorite) next = await toggleFavorite(book.id, id);
                  }
                  setBooks(next);
                  clearSelection();
                })();
              }}
            />
            <Button
              label="Delete"
              variant="secondary"
              onPress={() => setConfirmBulkDelete(true)}
            />
            <Button label="Clear" variant="secondary" onPress={clearSelection} />
          </View>
        ) : null}

        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="search" size={26} color={colors.muted} />
            <Text style={styles.emptyTitle}>
              {plays.length === 0
                ? 'No plays yet'
                : collectionFilter
                  ? 'Empty collection'
                  : 'No plays found'}
            </Text>
            <Text style={styles.sub}>
              {plays.length === 0
                ? 'Create your first play to start the playbook.'
                : 'Try another search or clear filters.'}
            </Text>
            {plays.length === 0 ? (
              <Button label="Create play" icon="plus" onPress={createPlay} />
            ) : (
              <Button
                label="Clear filters"
                variant="secondary"
                onPress={() => {
                  setSearch('');
                  selectLibrary('All plays');
                }}
              />
            )}
          </View>
        ) : (
          <View
            style={[
              styles.library,
              view === 'grid'
                ? { flexDirection: 'row', flexWrap: 'wrap', gap: 13 }
                : { gap: 8 },
            ]}
          >
            {visible.map((play) => {
              const selected = selectedIds.has(play.id);
              return (
                <Pressable
                  key={play.id}
                  style={[
                    styles.card,
                    view === 'grid' && { width: `${100 / gridCols - 1.5}%` as `${number}%` },
                    view === 'list' && styles.cardList,
                    selected && styles.cardSelected,
                  ]}
                  onPress={() =>
                    selectedIds.size > 0 ? toggleSelect(play.id) : openPlay(play.id)
                  }
                  onLongPress={() => toggleSelect(play.id)}
                >
                  <View style={view === 'list' ? styles.listPreview : undefined}>
                    <PlayPreview
                      playcall={play.playcall}
                      assignments={play.assignments}
                      side={play.side ?? 'off'}
                      vsPlaycall={play.vsPlaycall}
                      height={view === 'list' ? 96 : 132}
                    />
                  </View>
                  <Pressable
                    style={[styles.fav, play.favorite && styles.favActive]}
                    onPress={() => void onFavorite(play)}
                  >
                    <Text style={{ color: play.favorite ? colors.lime : colors.muted }}>★</Text>
                  </Pressable>
                  <Pressable style={styles.menuBtn} onPress={() => setMenuPlay(play)}>
                    <Text style={styles.menuDots}>···</Text>
                  </Pressable>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardForm}>
                      {play.side === 'def' ? 'Defense' : play.formation ?? 'Offense'}
                    </Text>
                    <Text style={styles.cardName}>{play.name}</Text>
                    <Text style={styles.cardConcept}>{play.concept ?? play.playcall}</Text>
                    <View style={styles.tags}>
                      <Text style={styles.tag}>
                        {play.side === 'def' ? 'Defense' : `${play.personnel ?? '11'} personnel`}
                      </Text>
                      <Text style={styles.tag}>{play.installs ?? 0} installs</Text>
                    </View>
                    <View style={styles.cardFooter}>
                      <Text style={styles.updated}>
                        {play.lastViewedAt ? 'Viewed recently' : 'Updated locally'}
                      </Text>
                      <Pressable onPress={() => toggleSelect(play.id)}>
                        <Text style={styles.open}>{selected ? 'Selected' : 'Select'}</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <CollectionCreateSheet
        visible={createOpen}
        onDismiss={() => setCreateOpen(false)}
        onSave={(next) => {
          void (async () => {
            if (!book) return;
            const list = await createCollection(book.id, {
              name: next.name,
              color: next.color,
              isActive: !active,
            });
            setBooks(list);
            setCreateOpen(false);
          })();
        }}
      />

      <CollectionCreateSheet
        visible={!!renameCollection}
        title="Edit collection"
        confirmLabel="Save"
        initialName={renameCollection?.name}
        initialColor={renameCollection?.color ?? COLLECTION_COLORS[0]}
        onDismiss={() => setRenameCollection(null)}
        onSave={(next) => {
          void (async () => {
            if (!renameCollection) return;
            setBooks(
              await updateCollection(renameCollection.id, {
                name: next.name,
                color: next.color,
              }),
            );
            setRenameCollection(null);
          })();
        }}
      />

      <ModalShell
        visible={!!collectionMenu}
        onClose={() => setCollectionMenu(null)}
        icon="layers"
        title={collectionMenu?.name ?? 'Collection'}
        subtitle="Collection options"
        accent={collectionMenu?.color}
        maxWidth={380}
      >
          {collectionMenu ? (
            <>
              <Button
                label={collectionMenu.isActive ? 'Current install' : 'Set as current install'}
                onPress={() => {
                  void (async () => {
                    await makeActiveInstall(collectionMenu.id);
                    setCollectionMenu(null);
                  })();
                }}
                disabled={collectionMenu.isActive}
              />
              <Button
                label="Rename / recolor"
                variant="secondary"
                onPress={() => {
                  setRenameCollection(collectionMenu);
                  setCollectionMenu(null);
                }}
              />
              <Button
                label="Delete collection"
                variant="secondary"
                onPress={() => {
                  void (async () => {
                    setBooks(await deleteCollection(collectionMenu.id));
                    if (collectionFilter === collectionMenu.id) selectLibrary('All plays');
                    setCollectionMenu(null);
                  })();
                }}
              />
              <Button label="Close" variant="secondary" onPress={() => setCollectionMenu(null)} />
            </>
          ) : null}
      </ModalShell>

      <ModalShell
        visible={pickInstallOpen}
        onClose={() => setPickInstallOpen(false)}
        icon="spark"
        title="Set current install"
        maxWidth={380}
      >
            <Text style={styles.pickInstallHint}>
              Choose which collection Learn and quizzes use as the active install.
            </Text>
            {collections.map((c) => (
              <Button
                key={c.id}
                label={c.isActive ? `${c.name} · current` : c.name}
                variant={c.isActive ? undefined : 'secondary'}
                disabled={c.isActive}
                onPress={() => {
                  void (async () => {
                    await makeActiveInstall(c.id);
                    setPickInstallOpen(false);
                  })();
                }}
              />
            ))}
            <Button
              label="Close"
              variant="secondary"
              onPress={() => setPickInstallOpen(false)}
            />
      </ModalShell>

      <ModalShell
        visible={!!menuPlay}
        onClose={() => setMenuPlay(null)}
        icon="play"
        title={menuPlay?.name ?? 'Play'}
        subtitle="Play options"
        maxWidth={380}
      >
          {menuPlay && book ? (
            <>
              <Button label="Open" onPress={() => { openPlay(menuPlay.id); setMenuPlay(null); }} />
              <Button
                label="Duplicate"
                variant="secondary"
                onPress={() => {
                  void (async () => {
                    setBooks(await duplicatePlay(book.id, menuPlay.id));
                    setMenuPlay(null);
                  })();
                }}
              />
              <Button
                label={menuPlay.favorite ? 'Unfavorite' : 'Favorite'}
                variant="secondary"
                onPress={() => {
                  void (async () => {
                    setBooks(await toggleFavorite(book.id, menuPlay.id));
                    setMenuPlay(null);
                  })();
                }}
              />
              {collections.map((c) => {
                const inCol = c.playIds.includes(menuPlay.id);
                return (
                  <Button
                    key={c.id}
                    label={inCol ? `Remove from ${c.name}` : `Add to ${c.name}`}
                    variant="secondary"
                    onPress={() => {
                      void (async () => {
                        setBooks(
                          inCol
                            ? await removePlayFromCollection(c.id, menuPlay.id)
                            : await addPlayToCollection(c.id, menuPlay.id),
                        );
                        setMenuPlay(null);
                      })();
                    }}
                  />
                );
              })}
              <Button
                label="Delete"
                variant="secondary"
                onPress={() => {
                  setConfirmDelete(menuPlay);
                  setMenuPlay(null);
                }}
              />
              <Button label="Cancel" variant="secondary" onPress={() => setMenuPlay(null)} />
            </>
          ) : null}
      </ModalShell>

      <ModalShell
        visible={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        icon="help"
        accent={colors.accentRed}
        title={`Delete ${confirmDelete?.name ?? 'play'}?`}
        maxWidth={380}
      >
            <Text style={styles.sub}>This cannot be undone.</Text>
            <Button
              label="Delete"
              onPress={() => {
                void (async () => {
                  if (!book || !confirmDelete) return;
                  setBooks(await removePlay(book.id, confirmDelete.id));
                  setConfirmDelete(null);
                })();
              }}
            />
            <Button label="Cancel" variant="secondary" onPress={() => setConfirmDelete(null)} />
      </ModalShell>

      <ModalShell
        visible={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        icon="help"
        accent={colors.accentRed}
        title={`Delete ${selectedIds.size} play${selectedIds.size === 1 ? '' : 's'}?`}
        maxWidth={380}
      >
            <Text style={styles.sub}>This cannot be undone.</Text>
            <Button
              label="Delete"
              onPress={() => {
                void (async () => {
                  if (!book) return;
                  let next = books;
                  for (const id of selectedIds) {
                    next = await removePlay(book.id, id);
                  }
                  setBooks(next);
                  clearSelection();
                  setConfirmBulkDelete(false);
                })();
              }}
            />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => setConfirmBulkDelete(false)}
            />
      </ModalShell>

      <ModalShell
        visible={bulkCollectionOpen}
        onClose={() => setBulkCollectionOpen(false)}
        icon="layers"
        title="Add to collection"
        maxWidth={380}
      >
            {collections.map((c) => (
              <Button
                key={c.id}
                label={c.name}
                variant="secondary"
                onPress={() => {
                  void (async () => {
                    if (!book) return;
                    let next = books;
                    for (const id of selectedIds) {
                      next = await addPlayToCollection(c.id, id);
                    }
                    setBooks(next);
                    setBulkCollectionOpen(false);
                    clearSelection();
                  })();
                }}
              />
            ))}
            <Button label="Cancel" variant="secondary" onPress={() => setBulkCollectionOpen(false)} />
      </ModalShell>

      <ModalShell
        visible={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        icon="grid"
        title="Filters"
        maxWidth={420}
        cardStyle={{ maxHeight: '80%' }}
      >
            <ScrollView>{sidebar}</ScrollView>
            <Button label="Done" onPress={() => setMobileFiltersOpen(false)} />
      </ModalShell>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  sidebarScroll: {
    width: 230,
    flexGrow: 0,
    flexShrink: 0,
    borderRightWidth: 1,
    borderRightColor: colors.borderMid,
    backgroundColor: colors.panel,
  },
  sidebarScrollContent: {
    paddingBottom: 28,
    flexGrow: 1,
  },
  sidebar: {
    width: '100%',
    paddingHorizontal: 19,
    paddingTop: 31,
    paddingBottom: 22,
    gap: 6,
  },
  sideTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.fontFamilyExtra,
    marginBottom: 12,
  },
  sideLabel: {
    marginTop: 18,
    marginBottom: 6,
    color: colors.dim,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  collectionsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  navBtnActive: { backgroundColor: '#202721' },
  navText: { flex: 1, color: '#818b84', fontSize: 11, fontWeight: '600' },
  navTextActive: { color: colors.text },
  navCount: { color: '#657068', fontSize: 10 },
  collection: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  collectionMenuBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 2,
  },
  pickInstallHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 2 },
  storage: {
    marginTop: 'auto',
    padding: 13,
    borderWidth: 1,
    borderColor: '#2e3631',
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    gap: 8,
  },
  storageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  storageLabel: { flex: 1, color: colors.muted, fontSize: 10 },
  storageStrong: { color: '#d7dcd5', fontSize: 10, fontWeight: '700' },
  storageHint: { color: '#626c65', fontSize: 9 },
  main: { flex: 1 },
  mainContent: { padding: 32, paddingBottom: 70, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: 20, maxWidth: 1320 },
  h1: {
    marginTop: 8,
    fontSize: 42,
    lineHeight: 44,
    letterSpacing: -1.8,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.fontFamilySemi,
  },
  sub: { marginTop: 8, color: '#7d8780', fontSize: 13, maxWidth: 480 },
  stat: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingLeft: 22,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderStrong,
  },
  statNum: { fontSize: 37, color: colors.lime, fontWeight: '700', lineHeight: 37 },
  statLabel: { color: '#c4cac5', fontSize: 10, fontWeight: '700' },
  statSmall: { color: '#657069', fontSize: 9 },
  install: {
    marginTop: 28,
    marginBottom: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: '#394238',
    borderRadius: radius.xxl,
    backgroundColor: '#151a18',
    flexDirection: 'row',
    gap: 24,
    overflow: 'hidden',
  },
  installCopy: { flex: 1, gap: 10 },
  installTag: { color: colors.lime, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  installTitle: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
  },
  installBody: { color: colors.muted, fontSize: 13, lineHeight: 20, maxWidth: 480 },
  installMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    color: colors.dim,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#202722',
  },
  stack: { width: 280, height: 160, position: 'relative' },
  stackCard: {
    position: 'absolute',
    width: 210,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  stackBack: { right: 0, top: 0, transform: [{ rotate: '6deg' }], opacity: 0.7 },
  stackMid: { right: 24, top: 12, transform: [{ rotate: '-3deg' }], opacity: 0.85 },
  stackFront: { right: 48, top: 24 },
  stackLabel: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  libTitle: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
  },
  libCount: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    minWidth: 180,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 13, outlineStyle: 'none' as never },
  sortBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  sortText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  viewSwitch: { flexDirection: 'row', borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md },
  viewBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  viewBtnActive: { backgroundColor: '#202722' },
  bulkBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMid,
    backgroundColor: colors.card,
  },
  bulkText: { color: colors.text, fontWeight: '700', marginRight: 8 },
  library: { maxWidth: 1320 },
  card: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    backgroundColor: '#151a18',
    overflow: 'hidden',
    position: 'relative',
    minWidth: 220,
    maxWidth: 340,
  },
  cardList: { flexDirection: 'row', minHeight: 96 },
  cardSelected: { borderColor: colors.lime },
  listPreview: { width: 170 },
  fav: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13,17,16,0.55)',
    zIndex: 2,
  },
  favActive: { backgroundColor: 'rgba(201,242,91,0.15)' },
  menuBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13,17,16,0.55)',
    zIndex: 2,
  },
  menuDots: { color: colors.muted, fontWeight: '900', fontSize: 12 },
  cardBody: { padding: 14, gap: 4 },
  cardForm: { color: colors.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  cardName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
  },
  cardConcept: { color: colors.dim, fontSize: 12 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: {
    color: colors.muted,
    fontSize: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: '#202722',
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updated: { color: '#667069', fontSize: 10 },
  open: { color: colors.lime, fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  menuSheet: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    padding: 18,
    gap: 8,
  },
  menuTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
});
