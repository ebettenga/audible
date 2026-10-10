import type { CardProgress, FlashCard } from './types';
import { isDue } from './srs';

export type QuizQuestion = {
  card: FlashCard;
  choices: string[];
  correctIndex: number;
};

/** Deterministic PRNG for seeded sessions. */
export function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function scoreCard(
  card: FlashCard,
  progress: Record<string, CardProgress>,
  now: Date,
): number {
  const p = progress[card.id];
  let score = 0;
  if (isDue(p, now)) score += 100;
  if (!p) score += 40;
  else {
    if (p.lastResult === 'again') score += 50;
    score += Math.max(0, 30 - p.easiness * 8);
    score += Math.max(0, 20 - p.repetitions * 4);
  }
  return score;
}

function cardGroup(card: FlashCard): string {
  return card.group ?? card.id;
}

/**
 * Prefer cards from a different group than the previous pick.
 * Falls back to any remaining card when the pool is exhausted.
 */
function interleaveByGroup(cards: FlashCard[], rand: () => number): FlashCard[] {
  const remaining = [...cards];
  const out: FlashCard[] = [];
  let lastGroup: string | null = null;

  while (remaining.length) {
    const different = remaining.filter((c) => cardGroup(c) !== lastGroup);
    const pool = different.length ? different : remaining;
    const pick = pool[Math.floor(rand() * pool.length)]!;
    out.push(pick);
    lastGroup = cardGroup(pick);
    const idx = remaining.findIndex((c) => c.id === pick.id);
    if (idx >= 0) remaining.splice(idx, 1);
  }
  return out;
}

function uniqueAnswers(answer: string, items: string[]): string[] {
  const answerKey = answer.toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase().trim();
    if (!key || key === answerKey || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Keep every choice answering the same question.
 * Do not pull other cards' answers from the topic — that turns a
 * "how deep is Y cross?" item into Mesh / Cover 2 / Ace.
 */
function pickSessionDistractors(
  card: FlashCard,
  allCards: FlashCard[],
  rand: () => number,
  count = 3,
): string[] {
  const fromCard = uniqueAnswers(card.answer, card.distractors);
  if (fromCard.length >= count) {
    return shuffle(fromCard, rand).slice(0, count);
  }

  const fromPool = uniqueAnswers(card.answer, card.distractorPool ?? []);
  const preferred = uniqueAnswers(card.answer, [...fromCard, ...fromPool]);
  if (preferred.length >= count) {
    return shuffle(preferred, rand).slice(0, count);
  }

  const peers = allCards
    .filter(
      (candidate) =>
        candidate.id !== card.id &&
        candidate.topic === card.topic &&
        candidate.type === card.type &&
        candidate.prompt === card.prompt,
    )
    .map((candidate) => candidate.answer);
  return shuffle(uniqueAnswers(card.answer, [...preferred, ...peers]), rand).slice(0, count);
}

export type BuildSessionOpts = {
  size?: number;
  seed?: string;
  now?: Date;
};

/**
 * Build a short, shuffled session from a card bank.
 * Prefers due / weak cards, avoids back-to-back same-group items,
 * and draws fresh distractors per session.
 */
export function buildSession(
  cards: FlashCard[],
  progress: Record<string, CardProgress> = {},
  opts: BuildSessionOpts = {},
): QuizQuestion[] {
  const size = Math.max(1, opts.size ?? 10);
  const now = opts.now ?? new Date();
  const rand = mulberry32(hashSeed(opts.seed ?? `session-${now.toISOString()}`));

  if (!cards.length) return [];

  const ranked = [...cards].sort((a, b) => {
    const diff = scoreCard(b, progress, now) - scoreCard(a, progress, now);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });

  const poolSize = Math.min(cards.length, Math.max(size * 3, size));
  const pool = ranked.slice(0, poolSize);
  const interleaved = interleaveByGroup(shuffle(pool, rand), rand);
  const picked = interleaved.slice(0, Math.min(size, interleaved.length));

  return picked.map((card) => {
    const distractors = pickSessionDistractors(card, cards, rand);
    const raw = [card.answer, ...distractors];
    const choices = shuffle(raw, rand);
    const correctIndex = choices.findIndex(
      (c) => c.toLowerCase() === card.answer.toLowerCase(),
    );
    return {
      card: { ...card, distractors },
      choices,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
    };
  });
}
