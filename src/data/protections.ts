import type { ProtectionDef } from '@/src/core/schema';

export const PROTECTIONS: ProtectionDef[] = [
  {
    id: '62',
    name: '62 Protection',
    aliases: ['62'],
    gapLabels: [2, 4, 6],
  },
  {
    id: '68',
    name: '68 Protection',
    aliases: ['68'],
    gapLabels: [4, 6, 8],
  },
  {
    id: '60',
    name: '60 Protection',
    aliases: ['60'],
    gapLabels: [0, 2, 4, 6],
  },
  {
    id: '50',
    name: '50 Protection',
    aliases: ['50'],
    gapLabels: [1, 3, 5],
  },
  {
    id: '70',
    name: '70 Protection',
    aliases: ['70'],
    gapLabels: [4, 6, 8],
  },
];

export function findProtection(token: string): ProtectionDef | undefined {
  const t = token.toLowerCase().trim();
  return PROTECTIONS.find(
    (p) =>
      p.id === t ||
      p.name.toLowerCase() === t ||
      p.aliases.some((a) => a.toLowerCase() === t),
  );
}
