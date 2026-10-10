import { generateCards, getCardScene } from '@/src/training/cards';

describe('learn diagram clarity', () => {
  it('every defender-assignment card highlights exactly one defender', () => {
    const cards = generateCards('defender-assignments');
    const bad: string[] = [];
    for (const card of cards) {
      const scene = getCardScene(card);
      const highlighted = scene.players.filter((p) => p.highlight);
      if (highlighted.length !== 1) {
        bad.push(
          `${card.id} highlights=${highlighted.length} storedScene=${!!card.scene} highlightPlayerId=${card.highlightPlayerId ?? 'none'}`,
        );
      }
      if (!card.scene) {
        bad.push(`${card.id} missing stored scene`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('pressure learn cards keep diagrams readable (no ghost routes, limited arrows)', () => {
    const cards = generateCards('pressures');
    for (const card of cards) {
      const scene = getCardScene(card);
      const ghostRoutes = scene.arrows.filter((a) => a.id.startsWith('ghost-'));
      expect(ghostRoutes).toHaveLength(0);
      expect(scene.players.some((p) => p.id.startsWith('ghost-'))).toBe(false);
      expect(scene.zones).toHaveLength(0);
      const rushBlitz = scene.arrows.filter(
        (a) => a.id.startsWith('def-rush') || a.id.startsWith('def-blitz'),
      );
      if (card.id.startsWith('pressure-')) {
        expect(rushBlitz.length).toBeGreaterThan(0);
        expect(rushBlitz.every((a) => a.highlight)).toBe(true);
      }
    }
  });

  it('defender-assignment learn scenes focus one player with a single job arrow', () => {
    const cards = generateCards('defender-assignments');
    for (const card of cards) {
      const scene = getCardScene(card);
      expect(scene.players.some((p) => p.id.startsWith('ghost-'))).toBe(false);
      expect(scene.zones).toHaveLength(0);
      const highlighted = scene.players.filter((p) => p.highlight);
      expect(highlighted).toHaveLength(1);
      if (scene.arrows.length > 0) {
        expect(scene.arrows.every((a) => a.playerId === highlighted[0].id)).toBe(true);
      }
    }
  });
});
