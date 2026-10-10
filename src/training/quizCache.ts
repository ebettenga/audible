import type { QuizFact } from '@/src/data/quizFacts';
import { QUIZ_CORE_FACTS } from '@/src/data/quizFacts';
import { QUIZ_PLAY_CALL_FACTS } from '@/src/data/quizPlayCallFacts';
import { QUIZ_EXTRA_RUNNING_FACTS } from '@/src/data/quizExtraRunningFacts';
import { QUIZ_SCHEME_FACTS } from '@/src/data/quizSchemeFacts';
import type { TrainingTopic } from './types';

/** Bump when bundled seed content changes (SQLite re-seeds when stored version is lower). */
export const QUIZ_BANK_VERSION = 3;

export const QUIZ_FACTS_BUNDLED: QuizFact[] = [
  ...QUIZ_CORE_FACTS,
  ...QUIZ_PLAY_CALL_FACTS,
  ...QUIZ_SCHEME_FACTS,
  ...QUIZ_EXTRA_RUNNING_FACTS,
];

/** Static bundled bank (tests, seed source). Runtime quizzes use `getQuizFacts()` after DB hydrate. */
export const QUIZ_FACTS = QUIZ_FACTS_BUNDLED;

let cache: QuizFact[] = QUIZ_FACTS_BUNDLED;

export function getQuizFacts(): QuizFact[] {
  return cache;
}

export function hydrateQuizFactCache(facts: QuizFact[]): void {
  if (facts.length) cache = facts;
}

export function factsForTopic(topic: TrainingTopic): QuizFact[] {
  return cache.filter((fact) => fact.topic === topic);
}

export type { QuizFact };
