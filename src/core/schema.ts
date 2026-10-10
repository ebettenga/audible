import { z } from 'zod';

export const PositionId = z.enum([
  // Offense
  'QB',
  'RB',
  'FB',
  'TE',
  'X',
  'Y',
  'Z',
  'H',
  'WR',
  'LT',
  'LG',
  'C',
  'RG',
  'RT',
  // Defense
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
export type PositionId = z.infer<typeof PositionId>;

export const SlotId = z.enum([
  'lt',
  'lg',
  'c',
  'rg',
  'rt',
  'qb',
  'fb',
  'rb',
  'x',
  'y',
  'z',
  'h',
  'te',
  // Defense slots
  'deL',
  'dtL',
  'nt',
  'dtR',
  'deR',
  'sam',
  'mike',
  'will',
  'lb',
  'cbL',
  'cbR',
  'ss',
  'fs',
  'nickel',
]);
export type SlotId = z.infer<typeof SlotId>;

export const Side = z.enum(['off', 'def']);
export type Side = z.infer<typeof Side>;

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Point = z.infer<typeof PointSchema>;

export const PlayerSchema = z.object({
  id: z.string(),
  slot: SlotId.optional(),
  position: PositionId,
  label: z.string(),
  x: z.number(),
  y: z.number(),
  side: Side,
  highlight: z.boolean().optional(),
  colorKey: z.enum(['ol', 'wr', 'qb', 'fb', 'rb', 'te', 'def', 'default']).optional(),
});
export type Player = z.infer<typeof PlayerSchema>;

export const ColorKeySchema = z.enum(['ol', 'wr', 'qb', 'fb', 'rb', 'te', 'def', 'default']);

export const FormationSlotSchema = z.object({
  x: z.number(),
  y: z.number(),
  position: PositionId,
  label: z.string().optional(),
  colorKey: ColorKeySchema.optional(),
});
export type FormationSlot = z.infer<typeof FormationSlotSchema>;

export const FormationSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  slots: z.record(z.string(), FormationSlotSchema),
  /** Receiver order for digit routes: typically x, y, z (or h) */
  routeOrder: z.array(z.string()).default(['x', 'y', 'z']),
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
  /** Declared strength side for Learn prompts (authored strength-right). */
  strength: z.enum(['right', 'left', 'balanced']).optional(),
});
export type Formation = z.infer<typeof FormationSchema>;

export const CurveType = z.enum(['straight', 'rounded', 'arc']);
export type CurveType = z.infer<typeof CurveType>;

export const ArrowheadType = z.enum(['arrow', 'block', 'none']);
export type ArrowheadType = z.infer<typeof ArrowheadType>;

export const RouteDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  number: z.number().int().min(0).max(9).optional(),
  /** Waypoints relative to the receiver start; first point is often (0,0) implied */
  waypoints: z.array(PointSchema),
  curve: CurveType.default('rounded'),
  arrowhead: ArrowheadType.default('arrow'),
  aliases: z.array(z.string()).default([]),
  /** Authored break depth in yards (for scaleRouteToDepth) */
  defaultDepth: z.number().optional(),
  coachingPoint: z.string().optional(),
});
export type RouteDef = z.infer<typeof RouteDefSchema>;

export const ZoneShape = z.enum(['ellipse', 'rect', 'polygon']);
export type ZoneShape = z.infer<typeof ZoneShape>;

export const ZoneDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  shape: ZoneShape,
  /** Center + radii for ellipse; x,y,w,h for rect; points for polygon */
  geometry: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    rx: z.number().optional(),
    ry: z.number().optional(),
    w: z.number().optional(),
    h: z.number().optional(),
    points: z.array(PointSchema).optional(),
  }),
  owner: z.string().optional(),
});
export type ZoneDef = z.infer<typeof ZoneDefSchema>;

export const FrontShift = z.enum(['over', 'under', 'even', 'bear']);
export type FrontShift = z.infer<typeof FrontShift>;

export const FrontDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  slots: z.record(z.string(), FormationSlotSchema),
  /** Optional default shift / strength tag for the front. */
  shift: FrontShift.optional(),
  description: z.string().optional(),
});
export type FrontDef = z.infer<typeof FrontDefSchema>;

export const DefenderAssignmentKind = z.enum([
  'zone',
  'man',
  'spy',
  'rush',
  'blitz',
  'press',
]);
export type DefenderAssignmentKind = z.infer<typeof DefenderAssignmentKind>;

export const DefenderAssignmentSchema = z.object({
  kind: DefenderAssignmentKind,
  /** Zone geometry id when kind is zone. */
  zoneId: z.string().optional(),
  /** Offensive slot to cover when kind is man/spy. */
  target: z.string().optional(),
  /** Gap number for rush/blitz. */
  gap: z.number().optional(),
  /** Short coaching label shown on the diagram / table. */
  label: z.string().optional(),
  /** Relative path for rush/blitz arrows (strength-right). */
  path: z.array(PointSchema).optional(),
});
export type DefenderAssignment = z.infer<typeof DefenderAssignmentSchema>;

export const CoverageWeakToSchema = z.object({
  conceptId: z.string(),
  why: z.string(),
});
export type CoverageWeakTo = z.infer<typeof CoverageWeakToSchema>;

export const CoverageDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  number: z.number().int().optional(),
  aliases: z.array(z.string()).default([]),
  shell: z.enum(['man', 'zone', 'match']).default('zone'),
  zones: z.array(z.string()),
  /** Optional absolute slot overrides for coverage alignment */
  slotOverrides: z.record(z.string(), FormationSlotSchema).optional(),
  manAssignments: z.record(z.string(), z.string()).optional(),
  /** Per-defender assignment keyed by front slot id. */
  assignments: z.record(z.string(), DefenderAssignmentSchema).optional(),
  /** Concepts that beat this coverage (for Learn read cards). */
  weakTo: z.array(CoverageWeakToSchema).optional(),
  description: z.string().optional(),
  /** Pre-snap recognition cues (safety depth, corner alignment). */
  presnapKeys: z.string().optional(),
  /** Post-snap rotation / drop description. */
  rotation: z.string().optional(),
});
export type CoverageDef = z.infer<typeof CoverageDefSchema>;

export const PressureDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  description: z.string().optional(),
  /** Per-defender rush / drop assignment keyed by front slot id. */
  assignments: z.record(z.string(), DefenderAssignmentSchema),
});
export type PressureDef = z.infer<typeof PressureDefSchema>;

export const ProtectionDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  /** Gap numbers to label on the diagram */
  gapLabels: z.array(z.number()),
});
export type ProtectionDef = z.infer<typeof ProtectionDefSchema>;

export const RunPlayDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  /** Primary hole number */
  hole: z.number(),
  /** Relative path for the ball carrier (RB) from their start */
  ballCarrierPath: z.array(PointSchema),
  /** Relative path for lead blocker (FB), if any */
  leadPath: z.array(PointSchema).optional(),
  leadArrowhead: ArrowheadType.default('block'),
  description: z.string().optional(),
  /** When this run is typically called. */
  bestVs: z.string().optional(),
});
export type RunPlayDef = z.infer<typeof RunPlayDefSchema>;

export const SceneArrowSchema = z.object({
  id: z.string(),
  playerId: z.string().optional(),
  points: z.array(PointSchema).min(2),
  curve: CurveType.default('rounded'),
  arrowhead: ArrowheadType.default('arrow'),
  color: z.string().default('#F5D90A'),
  label: z.string().optional(),
  highlight: z.boolean().optional(),
  /** Pre-snap motion paths render dashed, separate from the post-snap route. */
  kind: z.enum(['route', 'motion']).optional(),
});
export type SceneArrow = z.infer<typeof SceneArrowSchema>;

export const SceneZoneSchema = z.object({
  id: z.string(),
  label: z.string(),
  shape: ZoneShape,
  geometry: ZoneDefSchema.shape.geometry,
  color: z.string().default('rgba(255,255,255,0.18)'),
  owner: z.string().optional(),
  /** Emphasize this zone (learn / quiz highlight). */
  highlight: z.boolean().optional(),
});
export type SceneZone = z.infer<typeof SceneZoneSchema>;

export const AnnotationSchema = z.object({
  id: z.string(),
  text: z.string(),
  x: z.number(),
  y: z.number(),
  color: z.string().default('#F5D90A'),
});
export type Annotation = z.infer<typeof AnnotationSchema>;

export const GapLabelSchema = z.object({
  gap: z.number(),
  x: z.number(),
  y: z.number(),
  text: z.string(),
});
export type GapLabel = z.infer<typeof GapLabelSchema>;

export const TitleSegmentSchema = z.object({
  text: z.string(),
  tone: z.enum(['default', 'accent']).default('default'),
});
export type TitleSegment = z.infer<typeof TitleSegmentSchema>;

export const PlaySceneSchema = z.object({
  title: z.string(),
  titleSegments: z.array(TitleSegmentSchema).optional(),
  players: z.array(PlayerSchema),
  arrows: z.array(SceneArrowSchema).default([]),
  zones: z.array(SceneZoneSchema).default([]),
  annotations: z.array(AnnotationSchema).default([]),
  gapLabels: z.array(GapLabelSchema).default([]),
  /** When true, FieldCanvas flips the view so defense sits at the bottom. */
  flipped: z.boolean().optional(),
});
export type PlayScene = z.infer<typeof PlaySceneSchema>;

export type ColorKey = 'ol' | 'wr' | 'qb' | 'fb' | 'rb' | 'te' | 'def' | 'default';

/** Color map matching the Audible / mockup diagrams (values mirrored in design tokens) */
export const POSITION_COLORS: Record<ColorKey, { fill: string; text: string }> = {
  ol: { fill: '#70b7f0', text: '#112230' },
  wr: { fill: '#eef05c', text: '#252711' },
  qb: { fill: '#171a18', text: '#ffffff' },
  fb: { fill: '#F08A24', text: '#111111' },
  rb: { fill: '#ef6e5a', text: '#30120f' },
  te: { fill: '#db6fac', text: '#2d1022' },
  def: { fill: '#f2f3ec', text: '#19201a' },
  default: { fill: '#CCCCCC', text: '#111111' },
};

export function colorKeyForPosition(position: PositionId): ColorKey {
  if (['LT', 'LG', 'C', 'RG', 'RT'].includes(position)) return 'ol';
  if (['X', 'Z', 'H', 'WR'].includes(position)) return 'wr';
  if (position === 'QB') return 'qb';
  if (position === 'FB') return 'fb';
  if (position === 'RB') return 'rb';
  if (['TE', 'Y'].includes(position)) return 'te';
  if (
    ['DE', 'DT', 'NT', 'MIKE', 'WILL', 'SAM', 'LB', 'CB', 'SS', 'FS', 'NICKEL'].includes(
      position,
    )
  ) {
    return 'def';
  }
  return 'default';
}
