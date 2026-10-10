import type { Point } from '@/src/core/schema';

export interface MotionDef {
  id: string;
  name: string;
  aliases: string[];
  description: string;
}

export const MOTIONS: MotionDef[] = [
  {
    id: 'jet',
    name: 'Jet',
    aliases: ['jet'],
    description: 'Full-speed motion toward the ball; snapped as he crosses the near tackle.',
  },
  {
    id: 'orbit',
    name: 'Orbit',
    aliases: ['orbit', 'rocket'],
    description: 'Loops behind the QB toward the far side.',
  },
  {
    id: 'across',
    name: 'Across',
    aliases: ['across'],
    description: 'Motions across the formation and resets as a slot on the far side.',
  },
  {
    id: 'short',
    name: 'Short',
    aliases: ['short', 'zip'],
    description: 'Motions toward the ball and sets in a tight split.',
  },
  {
    id: 'wide',
    name: 'Wide',
    aliases: ['wide', 'zoom'],
    description: 'Motions away from the ball to a wider split.',
  },
  {
    id: 'return',
    name: 'Return',
    aliases: ['return', 'yo-yo', 'yoyo'],
    description: 'Starts in, then returns to near his original alignment.',
  },
];

export function findMotion(token: string): MotionDef | undefined {
  const key = token.trim().toLowerCase();
  return MOTIONS.find((m) => m.id === key || m.aliases.includes(key));
}

/** Motion players must be off the line of scrimmage at the snap. */
const OFF_LINE_Y = -1.5;

/**
 * Absolute pre-snap path for a motion; the last point is where the player is at the snap.
 * `fallbackSide` picks a direction for players aligned over the ball (backs).
 */
export function motionPath(motionId: string, start: Point, fallbackSide: 1 | -1): Point[] | null {
  const side = Math.abs(start.x) < 1 ? fallbackSide : Math.sign(start.x);
  const split = Math.abs(start.x);
  const travelY = Math.min(start.y, OFF_LINE_Y);
  const from = { x: start.x, y: start.y };

  switch (motionId) {
    case 'jet':
      return [from, { x: side * 3.5, y: travelY }];
    case 'orbit':
      return [from, { x: side * 3, y: -5.5 }, { x: -side * 1.5, y: -7.5 }];
    case 'across':
      return [from, { x: start.x - side, y: travelY }, { x: -side * 8, y: travelY }];
    case 'short':
      return [from, { x: side * Math.max(split - 7, 4), y: travelY }];
    case 'wide':
      return [from, { x: side * Math.min(split + 7, 24), y: travelY }];
    case 'return':
      return [
        from,
        { x: side * Math.max(split - 7, 2), y: travelY },
        { x: side * Math.max(split - 1, 2), y: travelY - 1 },
      ];
    default:
      return null;
  }
}
