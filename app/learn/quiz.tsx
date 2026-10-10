import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  buildQuiz,
  cardsForInstallQuiz,
  loadPlaybooks,
  loadProgress,
  loadSettings,
  resolveActiveBook,
  TOPIC_META,
  type CardProgress,
  type FlashCard,
  type Playbook,
  type QuizQuestion,
  type TrainingTopic,
} from '@/src/training';
import { LEARN_TOPICS } from '@/src/features/learn/progress';
import { QuizSession } from '@/src/features/learn/QuizSession';
import { LearnMessage } from '@/src/features/learn/LearnLoading';

type Loaded = {
  progress: Record<string, CardProgress>;
  book: Playbook | null;
  scopeCards: FlashCard[] | null;
  scopeTitle: string | null;
  bookId?: string;
  questions: QuizQuestion[];
};

export default function QuizScreen() {
  const params = useLocalSearchParams<{
    topic?: string;
    n?: string;
    bookId?: string;
    collectionId?: string;
  }>();
  const bookIdParam = typeof params.bookId === 'string' ? params.bookId : undefined;
  const collectionId =
    typeof params.collectionId === 'string' && params.collectionId
      ? params.collectionId
      : undefined;
  const scoped = !!bookIdParam;
  const topicFilter = useMemo(
    () =>
      scoped
        ? (['play-calls'] as TrainingTopic[])
        : typeof params.topic === 'string' && params.topic in TOPIC_META
          ? ([params.topic] as TrainingTopic[])
          : LEARN_TOPICS,
    [params.topic, scoped],
  );
  const count = Math.min(20, Math.max(4, Number(params.n) || 10));
  const [data, setData] = useState<Loaded | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadProgress(), loadPlaybooks(), loadSettings()]).then(
      ([map, books, settings]) => {
        if (cancelled) return;
        if (scoped) {
          const resolved =
            (bookIdParam ? books.find((b) => b.id === bookIdParam) : null) ??
            resolveActiveBook(books, settings);
          if (!resolved) {
            setData({
              progress: map,
              book: null,
              scopeCards: [],
              scopeTitle: null,
              questions: [],
            });
            return;
          }
          const col = collectionId
            ? resolved.collections?.find((c) => c.id === collectionId)
            : undefined;
          const cards = cardsForInstallQuiz(resolved, collectionId);
          const installTopics: TrainingTopic[] = [
            'play-calls',
            'running-routes',
            'passing-routes',
          ];
          setData({
            progress: map,
            book: resolved,
            scopeCards: cards,
            scopeTitle: col?.name ?? resolved.name,
            bookId: resolved.id,
            questions: buildQuiz(installTopics, count, map, { cards }),
          });
        } else {
          const book = resolveActiveBook(books, settings);
          setData({
            progress: map,
            book,
            scopeCards: null,
            scopeTitle: null,
            questions: buildQuiz(topicFilter, count, map, { book }),
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return <LearnMessage text="Building quiz…" />;
  if (data.scopeCards && data.scopeCards.length === 0) {
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

  const title =
    data.scopeTitle ??
    (topicFilter.length === 1 ? TOPIC_META[topicFilter[0]].title : 'Mixed quiz');

  return (
    <QuizSession
      title={title}
      questions={data.questions}
      progress={data.progress}
      source="quiz"
      fallbackTopic={topicFilter[0]}
      bookId={scoped ? data.bookId : undefined}
      collectionId={scoped ? collectionId : undefined}
      rebuild={(map) =>
        data.scopeCards
          ? buildQuiz(topicFilter, count, map, { cards: data.scopeCards })
          : buildQuiz(topicFilter, count, map, { book: data.book })
      }
    />
  );
}
