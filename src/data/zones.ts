import type { ZoneDef } from '@/src/core/schema';

export const ZONES: ZoneDef[] = [
  {
    id: 'deep-third-left',
    label: 'Deep ⅓',
    shape: 'ellipse',
    geometry: { x: -16, y: 16, rx: 10, ry: 6 },
    owner: 'cbL',
  },
  {
    id: 'deep-third-middle',
    label: 'Deep ⅓',
    shape: 'ellipse',
    geometry: { x: 0, y: 18, rx: 10, ry: 6 },
    owner: 'fs',
  },
  {
    id: 'deep-third-right',
    label: 'Deep ⅓',
    shape: 'ellipse',
    geometry: { x: 16, y: 16, rx: 10, ry: 6 },
    owner: 'cbR',
  },
  {
    id: 'deep-half-left',
    label: 'Deep ½',
    shape: 'ellipse',
    geometry: { x: -12, y: 16, rx: 14, ry: 7 },
    owner: 'ss',
  },
  {
    id: 'deep-half-right',
    label: 'Deep ½',
    shape: 'ellipse',
    geometry: { x: 12, y: 16, rx: 14, ry: 7 },
    owner: 'fs',
  },
  {
    id: 'flat-left',
    label: 'Flat',
    shape: 'ellipse',
    geometry: { x: -18, y: 4, rx: 7, ry: 4 },
    owner: 'will',
  },
  {
    id: 'flat-right',
    label: 'Flat',
    shape: 'ellipse',
    geometry: { x: 18, y: 4, rx: 7, ry: 4 },
    owner: 'sam',
  },
  {
    id: 'hook-left',
    label: 'Hook',
    shape: 'ellipse',
    geometry: { x: -7, y: 8, rx: 6, ry: 4 },
    owner: 'will',
  },
  {
    id: 'hook-middle',
    label: 'Hook',
    shape: 'ellipse',
    geometry: { x: 0, y: 8, rx: 6, ry: 4 },
    owner: 'mike',
  },
  {
    id: 'hook-right',
    label: 'Hook',
    shape: 'ellipse',
    geometry: { x: 7, y: 8, rx: 6, ry: 4 },
    owner: 'sam',
  },
  {
    id: 'curl-left',
    label: 'Curl',
    shape: 'ellipse',
    geometry: { x: -10, y: 10, rx: 6, ry: 4 },
    owner: 'will',
  },
  {
    id: 'curl-right',
    label: 'Curl',
    shape: 'ellipse',
    geometry: { x: 10, y: 10, rx: 6, ry: 4 },
    owner: 'sam',
  },
  {
    id: 'deep-quarter-ll',
    label: '¼',
    shape: 'ellipse',
    geometry: { x: -18, y: 16, rx: 8, ry: 6 },
    owner: 'cbL',
  },
  {
    id: 'deep-quarter-lr',
    label: '¼',
    shape: 'ellipse',
    geometry: { x: -6, y: 16, rx: 8, ry: 6 },
    owner: 'ss',
  },
  {
    id: 'deep-quarter-rl',
    label: '¼',
    shape: 'ellipse',
    geometry: { x: 6, y: 16, rx: 8, ry: 6 },
    owner: 'fs',
  },
  {
    id: 'deep-quarter-rr',
    label: '¼',
    shape: 'ellipse',
    geometry: { x: 18, y: 16, rx: 8, ry: 6 },
    owner: 'cbR',
  },
];

export function getZone(id: string): ZoneDef | undefined {
  return ZONES.find((z) => z.id === id);
}
