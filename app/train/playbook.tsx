import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  buildSession,
  cardsFromPlaybook,
  loadPlaybooks,
  loadProgress,
  loadSettings,
  playsForScope,
  resolveActiveBook,
  type CardProgress,
  type FlashCard,
} from '@/src/training';
import { QuizSession } from '@/src/features/learn/QuizSession';
import { LearnMessage } from '@/src/features/learn/LearnLoading';

const SESSION_SIZE = 10;

export default function TrainPlaybookScreen() {
  const params = useLocalSearchParams<{ bookId?: string; collectionId?: string }>();
  const bookIdParam = typeof params.bookId === 'string' ? params.bookId : undefined;
  const collectionId =
    typeof params.collectionId === 'string' && params.collectionId
      ? params.collectionId
      : undefined;

  const [loaded, setLoaded] = useState<{
    title: string;
    bookId?: string;
    cards: FlashCard[];
    progress: Record<string, CardProgress>;
    seed: string;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      const [books, progress, settings] = await Promise.all([
        loadPlaybooks(),
        loadProgress(),
        loadSettings(),
      ]);
      const book =
        (bookIdParam ? books.find((b) => b.id === bookIdParam) : null) ??
        resolveActiveBook(books, settings);
      if (!book) {
        setLoaded({
          title: 'Playbook Drill',
          cards: [],
          progress,
          seed: 'empty',
        });
        return;
      }
      const col = collectionId ? book.collections?.find((c) => c.id === collectionId) : undefined;
      setLoaded({
        title: col?.name ?? book.name,
        bookId: book.id,
        cards: cardsFromPlaybook(playsForScope(book, collectionId)),
        progress,
        seed: `playbook-${book.id}-${Date.now()}`,
      });
    })();
  }, [bookIdParam, collectionId]);

  if (!loaded) return <LearnMessage text="Loading…" />;
  if (loaded.cards.length === 0) {
    return (
      <LearnMessage
        text={
          collectionId
            ? 'Add plays to this collection first'
            : 'Add plays to your playbook first'
        }
      />
    );
  }

  const makeSession = (map: Record<string, CardProgress>, seed: string) =>
    buildSession(loaded.cards, map, { size: SESSION_SIZE, seed });

  return (
    <QuizSession
      title={loaded.title}
      subtitle="Playbook drill"
      questions={makeSession(loaded.progress, loaded.seed)}
      progress={loaded.progress}
      rebuild={(map) => makeSession(map, `playbook-${loaded.bookId}-${Date.now()}`)}
      source="flashcards"
      fallbackTopic="play-calls"
      bookId={loaded.bookId}
      collectionId={collectionId}
    />
  );
}
