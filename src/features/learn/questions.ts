import type { FlashCard, QuizQuestion } from '@/src/training';

/** Turn flashcards into multiple-choice quiz questions (stable choice order). */
export function questionsFromCards(cards: FlashCard[]): QuizQuestion[] {
  return cards.map((card) => {
    const choices = [card.answer, ...card.distractors].sort((a, b) => a.localeCompare(b));
    return { card, choices, correctIndex: choices.indexOf(card.answer) };
  });
}
