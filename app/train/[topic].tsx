import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  buildSession,
  cardsForLearn,
  generateCards,
  loadPlaybooks,
  loadProgress,
  loadSettings,
  resolveActiveBook,
  TOPIC_META,
  type CardProgress,
  type FlashCard,
  type Playbook,
  type TrainingTopic,
} from '@/src/training';
import { QuizSession } from '@/src/features/learn/QuizSession';
import { LearnMessage } from '@/src/features/learn/LearnLoading';

function isTopic(v: string): v is TrainingTopic {
  return v in TOPIC_META;
}

const SESSION_SIZE = 10;

export default function TrainTopicScreen() {
  const { topic: raw } = useLocalSearchParams<{ topic: string }>();
  const topic = typeof raw === 'string' && isTopic(raw) ? raw : 'formations';
  const meta = TOPIC_META[topic];
  const seedRef = useRef(`train-${topic}-init`);
  const [loaded, setLoaded] = useState<{
    book: Playbook | null;
    progress: Record<string, CardProgress>;
    cards: FlashCard[];
    seed: string;
  } | null>(null);

  useEffect(() => {
    void Promise.all([loadProgress(), loadPlaybooks(), loadSettings()]).then(
      ([progress, books, settings]) => {
        const book = resolveActiveBook(books, settings);
        const cards =
          topic === 'play-calls' || topic === 'formations'
            ? cardsForLearn(book, topic)
            : generateCards(topic);
        const seed = `train-${topic}-${Date.now()}`;
        seedRef.current = seed;
        setLoaded({ progress, book, cards, seed });
      },
    );
  }, [topic]);

  if (!loaded) return <LearnMessage text="Loading…" />;
  if (loaded.cards.length === 0) return <LearnMessage text="No cards for this topic" />;

  const makeSession = (map: Record<string, CardProgress>, seed: string) =>
    buildSession(loaded.cards, map, { size: SESSION_SIZE, seed });

  return (
    <QuizSession
      title={meta.title}
      subtitle="Topic drill"
      questions={makeSession(loaded.progress, loaded.seed)}
      progress={loaded.progress}
      rebuild={(map) => {
        const seed = `train-${topic}-${Date.now()}`;
        seedRef.current = seed;
        return makeSession(map, seed);
      }}
      source="flashcards"
      fallbackTopic={topic}
    />
  );
}
