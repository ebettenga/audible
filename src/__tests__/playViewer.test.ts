import {
  decodePlayIds,
  encodePlayIds,
  resolveViewerIds,
  selectionInOrder,
  tryBuildDetailScene,
} from '@/src/features/playbook/playViewer';
import { buildPackersPlaybook } from '@/src/data/packersPlaybook';
import type { Collection, PlaybookPlay } from '@/src/training/types';

function play(id: string, name = id): PlaybookPlay {
  return {
    id,
    name,
    playcall: 'Gun Doubles Right 62 Mesh',
    createdAt: '2026-01-01T00:00:00.000Z',
  } as PlaybookPlay;
}

const plays = ['a', 'b', 'c', 'd', 'e'].map((id) => play(id));

describe('play viewer scope', () => {
  it('round-trips ordered ids through route params', () => {
    expect(decodePlayIds(encodePlayIds(['x', 'y', 'z']))).toEqual(['x', 'y', 'z']);
    expect(decodePlayIds(undefined)).toEqual([]);
    expect(decodePlayIds(' a , ,b ')).toEqual(['a', 'b']);
  });

  it('swipes through an explicit selection in the order given', () => {
    expect(resolveViewerIds({ ids: ['d', 'a', 'c'], bookPlays: plays })).toEqual(['d', 'a', 'c']);
  });

  it('drops ids that are no longer in the book', () => {
    expect(resolveViewerIds({ ids: ['gone', 'b'], bookPlays: plays })).toEqual(['b']);
  });

  it('falls back to the collection, then to every play in the book', () => {
    const collection = { id: 'col', playIds: ['e', 'missing', 'b'] } as Collection;
    expect(resolveViewerIds({ collection, bookPlays: plays })).toEqual(['e', 'b']);
    expect(resolveViewerIds({ bookPlays: plays })).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('keeps a selection in library order, not tap order', () => {
    expect(selectionInOrder(plays, new Set(['e', 'a', 'c']))).toEqual(['a', 'c', 'e']);
  });

  it('renders a diagram for every seeded Packers play', () => {
    for (const p of buildPackersPlaybook().plays) {
      expect(tryBuildDetailScene(p)?.players.length).toBeGreaterThanOrEqual(11);
    }
  });
});
