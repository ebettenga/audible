import type { Playbook, PlaybookPlay } from '@/src/training/types';

export function findPlay(
  books: Playbook[],
  playId: string,
): { book: Playbook; play: PlaybookPlay } | null {
  for (const book of books) {
    const play = book.plays.find((p) => p.id === playId);
    if (play) return { book, play };
  }
  return null;
}

export function collectionIdsForPlay(book: Playbook, playId: string): string[] {
  return (book.collections ?? [])
    .filter((c) => c.playIds.includes(playId))
    .map((c) => c.id);
}
