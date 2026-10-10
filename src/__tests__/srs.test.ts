import { reviewCard, isDue } from '@/src/training/srs';

describe('SM-2 lite', () => {
  const now = new Date('2026-01-01T12:00:00Z');

  it('creates progress on first review', () => {
    const p = reviewCard(undefined, 'card-1', 'good', now);
    expect(p.cardId).toBe('card-1');
    expect(p.repetitions).toBe(1);
    expect(p.intervalDays).toBe(1);
    expect(isDue(p, now)).toBe(false);
  });

  it('resets on again', () => {
    const first = reviewCard(undefined, 'card-1', 'good', now);
    const again = reviewCard(first, 'card-1', 'again', now);
    expect(again.repetitions).toBe(0);
    expect(isDue(again, now)).toBe(true);
  });

  it('grows interval on easy', () => {
    let p = reviewCard(undefined, 'c', 'easy', now);
    p = reviewCard(p, 'c', 'easy', new Date('2026-01-02T12:00:00Z'));
    p = reviewCard(p, 'c', 'easy', new Date('2026-01-05T12:00:00Z'));
    expect(p.intervalDays).toBeGreaterThan(3);
  });
});
