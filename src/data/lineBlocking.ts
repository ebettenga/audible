import { gapX } from '@/src/core/field';
import type { Point } from '@/src/core/schema';

export const OL_SLOTS = ['lt', 'lg', 'c', 'rg', 'rt'] as const;
export type OlSlot = (typeof OL_SLOTS)[number];

export interface LineAssignment {
  slot: OlSlot;
  /** Short diagram/table label, e.g. "Slide", "Zone Step", "Pull". */
  label: string;
  /** Path relative to the player's start, authored strength-right. */
  path: Point[];
}

export type PlayerRole = 'line' | 'back' | 'receiver' | 'defender';

const DEF_POSITIONS = new Set([
  'DE',
  'DT',
  'NT',
  'MIKE',
  'WILL',
  'SAM',
  'LB',
  'CB',
  'SS',
  'FS',
  'NICKEL',
]);

export function roleForPosition(position: string): PlayerRole {
  if (['LT', 'LG', 'C', 'RG', 'RT'].includes(position)) return 'line';
  if (position === 'RB' || position === 'FB') return 'back';
  if (DEF_POSITIONS.has(position)) return 'defender';
  return 'receiver';
}

export interface BlockOption {
  /** Stored as the assignment routeId; prefixed `line:`, `back:`, or `def:`. */
  id: string;
  label: string;
  hint: string;
  /** Relative path, authored strength-right. */
  path: Point[];
}

/** Defensive assignment options shown in the builder inspector. */
export const DEFENDER_OPTIONS: BlockOption[] = [
  { id: 'def:rush-contain', label: 'Contain', hint: 'Rush contain — keep the QB inside.', path: [{ x: 0, y: 0 }, { x: 0, y: -2.5 }] },
  { id: 'def:rush-a', label: 'A Gap', hint: 'Attack the A-gap.', path: [{ x: 0, y: 0 }, { x: 0.3, y: -2.2 }] },
  { id: 'def:rush-b', label: 'B Gap', hint: 'Attack the B-gap.', path: [{ x: 0, y: 0 }, { x: 0.8, y: -2.2 }] },
  { id: 'def:blitz', label: 'Blitz', hint: 'Blitz — attack the QB.', path: [{ x: 0, y: 0 }, { x: 0.5, y: -1 }, { x: 1, y: -3.5 }] },
  { id: 'def:zone-flat', label: 'Flat', hint: 'Drop to the flat zone.', path: [{ x: 0, y: 0 }, { x: 3, y: 1 }] },
  { id: 'def:zone-hook', label: 'Hook', hint: 'Drop to the hook / curl zone.', path: [{ x: 0, y: 0 }, { x: 0, y: 3 }] },
  { id: 'def:zone-deep', label: 'Deep', hint: 'Drop deep — third, half, or quarter.', path: [{ x: 0, y: 0 }, { x: 0, y: 6 }] },
  { id: 'def:man', label: 'Man', hint: 'Man coverage on your assigned receiver.', path: [{ x: 0, y: 0 }, { x: 0, y: -1 }] },
  { id: 'def:press', label: 'Press', hint: 'Press man at the line of scrimmage.', path: [{ x: 0, y: 0 }, { x: 0, y: -0.5 }] },
  { id: 'def:spy', label: 'Spy', hint: 'Spy the QB / back — mirror his path.', path: [{ x: 0, y: 0 }, { x: 0, y: -1.5 }] },
];

export const LINE_OPTIONS: BlockOption[] = [
  { id: 'line:pass-set', label: 'Pass Set', hint: 'Kick back and mirror the rusher.', path: [{ x: 0, y: 0 }, { x: 0, y: -1.2 }] },
  { id: 'line:slide-right', label: 'Slide Right', hint: 'Slide toward the strength; block the gap to your right.', path: [{ x: 0, y: 0 }, { x: 0.9, y: -1.2 }] },
  { id: 'line:slide-left', label: 'Slide Left', hint: 'Slide away from strength; block the gap to your left.', path: [{ x: 0, y: 0 }, { x: -0.9, y: -1.2 }] },
  { id: 'line:zone-right', label: 'Zone Right', hint: 'Step playside to the right and work to the second level.', path: [{ x: 0, y: 0 }, { x: 1, y: 0.9 }] },
  { id: 'line:zone-left', label: 'Zone Left', hint: 'Step playside to the left and work to the second level.', path: [{ x: 0, y: 0 }, { x: -1, y: 0.9 }] },
  { id: 'line:drive', label: 'Drive', hint: 'Fire off the ball and drive the man in front of you.', path: [{ x: 0, y: 0 }, { x: 0.3, y: 1.2 }] },
  { id: 'line:pull-right', label: 'Pull Right', hint: 'Pull behind the line and lead through the hole on the right.', path: [{ x: 0, y: 0 }, { x: 1.5, y: -0.8 }, { x: 4, y: 0.5 }] },
  { id: 'line:pull-left', label: 'Pull Left', hint: 'Pull behind the line and lead through the hole on the left.', path: [{ x: 0, y: 0 }, { x: -1.5, y: -0.8 }, { x: -4, y: 0.5 }] },
];

/** Non-route options for RB/FB. Route options come from ROUTES (see BACK_ROUTE_IDS). */
export const BACK_OPTIONS: BlockOption[] = [
  { id: 'back:pass-block', label: 'Pass Block', hint: 'Step up, find the most dangerous rusher, and block him.', path: [{ x: 0, y: 0 }, { x: 0, y: 0.8 }] },
  { id: 'back:lead-block', label: 'Lead Block', hint: 'Attack the hole and block the first defender to show.', path: [{ x: 0, y: 0 }, { x: 1, y: 3 }] },
  { id: 'back:run-fake', label: 'Run Fake', hint: 'Sell the run with a hard dive path.', path: [{ x: 0, y: 0 }, { x: 0.5, y: 2.5 }] },
];

export const BACK_ROUTE_IDS = ['flat', 'swing', 'angle', 'wheel', 'sit', 'drag'];

export function findBlockOption(id: string): BlockOption | undefined {
  return [...LINE_OPTIONS, ...BACK_OPTIONS, ...DEFENDER_OPTIONS].find((o) => o.id === id);
}

type PassScheme = 'slide' | 'slide-weak' | 'man' | 'max';

/** Pass-protection scheme per protection id (data-driven; edit to taste). */
const PASS_SCHEMES: Record<string, PassScheme> = {
  '62': 'slide',
  '68': 'max',
  '60': 'man',
  '50': 'slide-weak',
  '70': 'max',
};

const SCHEME_LABEL: Record<PassScheme, string> = {
  slide: 'Slide Right',
  'slide-weak': 'Slide Left',
  man: 'Man',
  max: 'Hold',
};

/** Pass sets: kick back ~1.2 yds, sliding laterally for slide schemes. */
export function passLineAssignments(protectionId?: string): LineAssignment[] {
  const scheme = (protectionId && PASS_SCHEMES[protectionId]) || 'man';
  const dx = scheme === 'slide' ? 0.9 : scheme === 'slide-weak' ? -0.9 : 0;
  return OL_SLOTS.map((slot) => ({
    slot,
    label: SCHEME_LABEL[scheme],
    path: [
      { x: 0, y: 0 },
      { x: dx, y: -1.2 },
    ],
  }));
}

type RunStyle = 'zone' | 'gap';

const RUN_STYLE: Record<string, RunStyle> = {
  'wide-zone': 'zone',
  'inside-zone': 'zone',
  'split-zone': 'zone',
  duo: 'gap',
  '22-dive': 'gap',
  '24-lead': 'gap',
  '26-lead': 'gap',
  '28-toss': 'gap',
  'jet-sweep': 'zone',
};

/** Run blocking: zone steps toward the hole; gap runs drive and pull the backside guard. */
export function runLineAssignments(runId: string, hole: number): LineAssignment[] {
  const style = RUN_STYLE[runId] ?? 'gap';
  const dir = Math.sign(gapX(hole)) || 1;
  const wide = Math.abs(hole) >= 6;
  const pullGuard: OlSlot = dir > 0 ? 'lg' : 'rg';

  return OL_SLOTS.map((slot) => {
    if (style === 'zone') {
      return {
        slot,
        label: 'Zone',
        path: [
          { x: 0, y: 0 },
          { x: dir * (wide ? 1.4 : 0.8), y: 0.9 },
        ],
      };
    }
    if (wide && slot === pullGuard) {
      return {
        slot,
        label: 'Pull',
        path: [
          { x: 0, y: 0 },
          { x: dir * 1.5, y: -0.8 },
          { x: dir * 4, y: 0.5 },
        ],
      };
    }
    return {
      slot,
      label: 'Drive',
      path: [
        { x: 0, y: 0 },
        { x: dir * 0.4, y: 1.2 },
      ],
    };
  });
}
