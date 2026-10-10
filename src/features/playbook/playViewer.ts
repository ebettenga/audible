import { buildDefense, buildPlay } from '@/src/core/parser';
import type { PlayScene } from '@/src/core/schema';
import type { Collection, PlaybookPlay } from '@/src/training/types';

/** Route-param form of an ordered play list (`/play/[id]?ids=a,b,c`). */
export function encodePlayIds(ids: string[]): string {
  return ids.join(',');
}

export function decodePlayIds(raw: string | string[] | undefined | null): string[] {
  const value = Array.isArray(raw) ? raw.join(',') : raw;
  if (!value) return [];
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Plays the viewer swipes through, in order:
 * an explicit list (selection or filtered library), else a collection, else the whole book.
 */
export function resolveViewerIds({
  ids,
  collection,
  bookPlays,
}: {
  ids?: string[];
  collection?: Collection;
  bookPlays: PlaybookPlay[];
}): string[] {
  const present = new Set(bookPlays.map((p) => p.id));
  const explicit = (ids ?? []).filter((id) => present.has(id));
  if (explicit.length) return [...new Set(explicit)];
  if (collection) return collection.playIds.filter((id) => present.has(id));
  return bookPlays.map((p) => p.id);
}

/** Selected plays in the order they appear in the library list. */
export function selectionInOrder(visible: PlaybookPlay[], selected: Set<string>): string[] {
  return visible.filter((p) => selected.has(p.id)).map((p) => p.id);
}

export function buildDetailScene(play: PlaybookPlay, playcall = play.playcall): PlayScene {
  if (play.side === 'def') {
    return buildDefense(playcall, {
      vsPlaycall: play.vsPlaycall,
      assignments: play.assignments,
    });
  }
  return buildPlay(playcall, {
    includeDefense: true,
    coverageId: play.coverageId,
    frontId: play.frontId ?? '4-3',
    assignments: play.assignments,
  });
}

export function tryBuildDetailScene(play: PlaybookPlay): PlayScene | null {
  try {
    return buildDetailScene(play);
  } catch {
    return null;
  }
}
