import type { RouteDef } from '@/src/core/schema';

/**
 * Air Coryell–style numbered route tree plus named aliases.
 * Waypoints are relative to the receiver's starting position.
 * Positive y = downfield; positive x = toward strength-right sideline.
 */
export const ROUTES: RouteDef[] = [
  {
    id: 'flat',
    name: 'Flat',
    number: 1,
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: 2 },
      { x: 8, y: 2 },
    ],
    curve: 'rounded',
    arrowhead: 'arrow',
    aliases: ['1'],
    defaultDepth: 2,
    coachingPoint: 'Release outside, stem vertical two yards, then sit in the flat showing hands to the QB.',
  },
  {
    id: 'slant',
    name: 'Slant',
    number: 2,
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: 3 },
      { x: -6, y: 8 },
    ],
    curve: 'rounded',
    arrowhead: 'arrow',
    aliases: ['2'],
    defaultDepth: 7,
    coachingPoint: 'Win inside leverage. Snap the route at seven and show numbers to the QB.',
  },
  {
    id: 'out',
    name: 'Out',
    number: 3,
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 6, y: 10 },
    ],
    curve: 'rounded',
    arrowhead: 'arrow',
    aliases: ['3'],
  },
  {
    id: 'curl',
    name: 'Curl',
    number: 4,
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: 12 },
      { x: -2, y: 10 },
    ],
    curve: 'rounded',
    arrowhead: 'arrow',
    aliases: ['4', 'hitch'],
    defaultDepth: 12,
    coachingPoint: 'Stem vertical, plant and sink back to the QB. Eyes inside after the break.',
  },
  {
    id: 'in',
    name: 'Dig / In',
    number: 5,
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: 12 },
      { x: -8, y: 12 },
    ],
    curve: 'rounded',
    arrowhead: 'arrow',
    aliases: ['5', 'dig'],
  },
  {
    id: 'corner',
    name: 'Corner',
    number: 6,
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: 12 },
      { x: 6, y: 18 },
    ],
    curve: 'rounded',
    arrowhead: 'arrow',
    aliases: ['6'],
  },
  {
    id: 'post',
    name: 'Post',
    number: 7,
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: 12 },
      { x: -5, y: 20 },
    ],
    curve: 'rounded',
    arrowhead: 'arrow',
    aliases: ['7'],
  },
  {
    id: 'post-corner',
    name: 'Post-Corner',
    number: 8,
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: -3, y: 14 },
      { x: 4, y: 20 },
    ],
    curve: 'rounded',
    arrowhead: 'arrow',
    aliases: ['8'],
  },
  {
    id: 'go',
    name: 'Go / Fly',
    number: 9,
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: 22 },
    ],
    curve: 'straight',
    arrowhead: 'arrow',
    aliases: ['9', 'fly', 'fade'],
    defaultDepth: 22,
    coachingPoint: 'Stack the DB and run through. Do not look early — trust the throw.',
  },
  {
    id: 'drag',
    name: 'Drag',
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: 2 },
      { x: -14, y: 3 },
    ],
    curve: 'rounded',
    arrowhead: 'arrow',
    aliases: ['z-drag', 'y-drag'],
  },
  {
    id: 'pop',
    name: 'Pop',
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: 6 },
      { x: 2, y: 8 },
    ],
    curve: 'rounded',
    arrowhead: 'arrow',
    aliases: ['y-pop', 'te-pop'],
  },
  {
    id: 'angle',
    name: 'Angle',
    waypoints: [
      { x: 0, y: 0 },
      { x: 2, y: 3 },
      { x: -6, y: 8 },
    ],
    curve: 'rounded',
    arrowhead: 'arrow',
    aliases: ['f-angle', 'fb-angle'],
  },
  {
    id: 'wheel',
    name: 'Wheel',
    waypoints: [
      { x: 0, y: 0 },
      { x: 6, y: 2 },
      { x: 8, y: 16 },
    ],
    curve: 'arc',
    arrowhead: 'arrow',
    aliases: [],
  },
  {
    id: 'seam',
    name: 'Seam',
    waypoints: [
      { x: 0, y: 0 },
      { x: -2, y: 18 },
    ],
    curve: 'straight',
    arrowhead: 'arrow',
    aliases: [],
  },
  {
    id: 'cross',
    name: 'Cross',
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: 8 },
      { x: -14, y: 12 },
    ],
    curve: 'rounded',
    arrowhead: 'arrow',
    aliases: ['over', 'deep-cross'],
    defaultDepth: 12,
    coachingPoint: 'Stem vertical, then work across the field at depth. Eyes to the QB.',
  },
  {
    id: 'sit',
    name: 'Sit',
    waypoints: [
      { x: 0, y: 0 },
      { x: 0, y: 6 },
      { x: 1, y: 5.5 },
    ],
    curve: 'rounded',
    arrowhead: 'arrow',
    aliases: ['option', 'hook-sit'],
    defaultDepth: 6,
    coachingPoint: 'Stem to six, sink and sit in the window. Hands ready.',
  },
  {
    id: 'swing',
    name: 'Swing',
    waypoints: [
      { x: 0, y: 0 },
      { x: 6, y: -1 },
      { x: 10, y: 1 },
    ],
    curve: 'arc',
    arrowhead: 'arrow',
    aliases: ['rb-swing'],
    defaultDepth: 2,
    coachingPoint: 'Arc to the flat with pace. Present a target outside the numbers.',
  },
];

export function findRouteByNumber(n: number): RouteDef | undefined {
  return ROUTES.find((r) => r.number === n);
}

export function findRouteByName(token: string): RouteDef | undefined {
  const t = token.toLowerCase().trim();
  return ROUTES.find(
    (r) =>
      r.id === t ||
      r.name.toLowerCase() === t ||
      r.aliases.some((a) => a.toLowerCase() === t),
  );
}
