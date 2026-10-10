import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { PlayBuilder } from '@/src/features/builder/PlayBuilder';
import { PlaySheet } from '@/src/features/builder/PlaySheet';
import { useBuilderState } from '@/src/features/builder/useBuilderState';
import {
  addPlayToBook,
  addPlayToCollection,
  createCollection,
  createPlaybook,
  loadPlaybooks,
  removePlayFromCollection,
  updatePlay,
  upsertPlaybook,
  type Playbook,
} from '@/src/training';
import { derivePlayMeta } from '@/src/features/playbook/playMeta';
import { collectionIdsForPlay, findPlay } from '@/src/features/playbook/findPlay';
import { colors, useBreakpoint } from '@/src/design';

export default function BuildScreen() {
  const { isMobile, isDesktop } = useBreakpoint();
  const params = useLocalSearchParams<{
    bookId?: string;
    collectionId?: string;
    playId?: string;
  }>();
  const builder = useBuilderState();
  const [books, setBooks] = useState<Playbook[]>([]);
  const [savedPlayId, setSavedPlayId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const loadedParamKey = useRef<string | null>(null);
  const lastBookId = useRef<string | null>(null);
  const builderRef = useRef(builder);

  useEffect(() => {
    builderRef.current = builder;
  }, [builder]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const list = await loadPlaybooks();
        if (cancelled) return;
        setBooks(list);

        const b = builderRef.current;
        const bookId = typeof params.bookId === 'string' ? params.bookId : undefined;
        const collectionId =
          typeof params.collectionId === 'string' ? params.collectionId : undefined;
        const playId = typeof params.playId === 'string' ? params.playId : undefined;
        const key = `${bookId ?? ''}|${collectionId ?? ''}|${playId ?? ''}`;

        if (playId) {
          if (loadedParamKey.current === key) return;
          loadedParamKey.current = key;
          const found = findPlay(list, playId);
          if (found) {
            b.loadPlay(found.play, {
              bookId: found.book.id,
              collectionIds: collectionIdsForPlay(found.book, found.play.id),
              systemIds: found.book.systemIds,
              customLexicon: found.book.customLexicon,
            });
            lastBookId.current = found.book.id;
            setSavedPlayId(found.play.id);
          }
          return;
        }

        if (loadedParamKey.current === key && b.bookId) return;
        loadedParamKey.current = key;

        const book =
          (bookId ? list.find((x) => x.id === bookId) : null) ??
          (lastBookId.current ? list.find((x) => x.id === lastBookId.current) : null) ??
          list[0];
        if (!book) return;

        const collectionIds = collectionId
          ? [collectionId]
          : book.collections.find((c) => c.isActive)
            ? [book.collections.find((c) => c.isActive)!.id]
            : [];

        if (!b.editingPlayId) {
          b.setBookId(book.id);
          b.setCollectionIds(collectionIds);
          if (book.systemIds) b.setSystemIds(book.systemIds);
          lastBookId.current = book.id;
        } else if (!b.bookId) {
          b.setBookId(book.id);
          lastBookId.current = book.id;
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [params.bookId, params.collectionId, params.playId]),
  );

  const onSave = useCallback(async () => {
    setSaveError(null);
    if (builder.parseError) {
      setSaveError('Fix the playcall before saving.');
      return;
    }
    const playName = builder.name.trim() || builder.playcall;
    const meta = derivePlayMeta(builder.playcall, builder.assignments);
    const bookId = builder.bookId || books[0]?.id || 'packers-2026';
    const payload = {
      name: playName,
      playcall: builder.playcall,
      side: builder.side,
      notes: builder.notes.trim() || undefined,
      coachingPoint: builder.coachingPoint.trim() || undefined,
      coverageId:
        builder.side === 'def' ? builder.defDraft.coverageId : builder.draft.coverageId,
      frontId: builder.side === 'def' ? builder.defDraft.frontId : builder.draft.frontId,
      pressureId:
        builder.side === 'def' && builder.defDraft.pressureId !== 'base'
          ? builder.defDraft.pressureId
          : undefined,
      vsPlaycall: builder.side === 'def' ? builder.defDraft.vsPlaycall : undefined,
      concept:
        builder.side === 'def'
          ? builder.coverageLabel !== '(none)'
            ? builder.coverageLabel
            : undefined
          : builder.conceptLabel !== '(none)'
            ? builder.conceptLabel
            : meta.concept,
      formation: builder.side === 'def' ? builder.frontLabel : builder.formationLabel || meta.formation,
      personnel: builder.side === 'def' ? undefined : meta.personnel,
      assignments: Object.keys(builder.assignments).length ? builder.assignments : undefined,
    };

    try {
      let list: Playbook[];
      let playId = builder.editingPlayId;

      if (playId) {
        list = await updatePlay(bookId, playId, payload);
        const book = list.find((b) => b.id === bookId);
        const current = new Set(
          (book?.collections ?? [])
            .filter((c) => c.playIds.includes(playId!))
            .map((c) => c.id),
        );
        const desired = new Set(builder.collectionIds);
        for (const id of desired) {
          if (!current.has(id)) list = await addPlayToCollection(id, playId);
        }
        for (const id of current) {
          if (!desired.has(id)) list = await removePlayFromCollection(id, playId);
        }
      } else {
        list = await addPlayToBook(bookId, payload);
        const created = list.find((b) => b.id === bookId)?.plays.slice(-1)[0];
        playId = created?.id ?? null;
        if (playId) {
          for (const collectionId of builder.collectionIds) {
            list = await addPlayToCollection(collectionId, playId);
          }
          builder.setEditingPlayId(playId);
        }
      }

      // Persist call-system selection on the book
      const book = list.find((b) => b.id === bookId);
      if (book) {
        list = await upsertPlaybook({
          ...book,
          systemIds: builder.systemIds,
          customLexicon: builder.customLexicon,
        });
      }

      setBooks(list);
      builder.setSaved(true);
      lastBookId.current = bookId;
      if (playId) setSavedPlayId(playId);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save play');
    }
  }, [builder, books]);

  const onNewPlay = useCallback(() => {
    const bookId = builder.bookId || books[0]?.id;
    const book = books.find((b) => b.id === bookId) ?? books[0];
    const active = book?.collections.find((c) => c.isActive);
    builder.reset({
      bookId: book?.id,
      collectionIds: active ? [active.id] : [],
      systemIds: book?.systemIds,
      customLexicon: book?.customLexicon,
    });
    setSavedPlayId(null);
    setSaveError(null);
    loadedParamKey.current = null;
  }, [builder, books]);

  const onCreatePlaybook = useCallback(
    async (name: string) => {
      const list = await createPlaybook({ name });
      setBooks(list);
      const created = list.find((b) => b.name === name.trim()) ?? list[list.length - 1];
      if (created) {
        builder.setBookId(created.id);
        builder.setCollectionIds([]);
        lastBookId.current = created.id;
      }
    },
    [builder],
  );

  const onCreateCollection = useCallback(
    async (input: { name: string; color: string }) => {
      const bookId = builder.bookId || books[0]?.id;
      if (!bookId) return;
      const list = await createCollection(bookId, input);
      setBooks(list);
      const created = list
        .find((b) => b.id === bookId)
        ?.collections.find((c) => c.name === input.name);
      if (created) {
        builder.setCollectionIds([...builder.collectionIds, created.id]);
      }
    },
    [builder, books],
  );

  const sheet = (
    <PlaySheet
      builder={builder}
      books={books}
      onCreatePlaybook={onCreatePlaybook}
      onCreateCollection={onCreateCollection}
      onSave={() => void onSave()}
      onNewPlay={onNewPlay}
      savedPlayId={savedPlayId}
    />
  );

  const workspace = (
    <PlayBuilder
      builder={builder}
      onSave={() => void onSave()}
      savedPlayId={savedPlayId}
      saveError={saveError}
    />
  );

  if (isMobile) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 28 }}>
        {sheet}
        <View style={styles.mobileDivider} />
        {workspace}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.screen, styles.row]}>
      <ScrollView
        style={[styles.sheetCol, !isDesktop && { maxWidth: 300, flexBasis: 300 }]}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        {sheet}
      </ScrollView>
      <ScrollView style={styles.builderCol} contentContainerStyle={{ flexGrow: 1 }}>
        {workspace}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row' },
  sheetCol: {
    flexBasis: '30%',
    maxWidth: 380,
    minWidth: 280,
    borderRightWidth: 1,
    borderRightColor: '#282e2a',
    backgroundColor: colors.panel,
  },
  builderCol: { flex: 1, minWidth: 0 },
  mobileDivider: {
    height: 1,
    backgroundColor: '#2b322e',
  },
});
