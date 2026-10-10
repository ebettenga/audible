/** Audible design tokens — lifted from the Figma Make mockup. */

export const colors = {
  bg: '#0d1110',
  panel: '#111614',
  card: '#171d1a',
  cardRaised: '#1a211d',
  cardHover: '#171d1a',
  border: '#262c28',
  borderStrong: '#303733',
  borderMid: '#29302c',
  borderSoft: '#2d3530',
  text: '#f4f5ed',
  muted: '#8e9690',
  dim: '#77807a',
  faint: '#7e8781',
  lime: '#c9f25b',
  limeDim: 'rgba(201,242,91,0.1)',
  routeYellow: '#e8f64a',
  routeAlt: '#f3f5e9',
  accentRed: '#E53935',
  turf: '#294c31',
  fieldLine: 'rgba(236,244,226,0.16)',
  fieldLineStrong: 'rgba(232,244,226,0.18)',
  yardNumber: 'rgba(240,245,235,0.11)',
  avatar: '#dfe5d7',
  avatarText: '#172019',
  ol: '#70b7f0',
  wr: '#eef05c',
  rb: '#ef6e5a',
  qb: '#171a18',
  te: '#db6fac',
  fb: '#F08A24',
  def: '#f2f3ec',
  defBorder: '#c6cbc1',
  progressTrack: '#343b36',
  iconMuted: '#667068',
  trainingMuted: '#28312b',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 42,
} as const;

export const radius = {
  sm: 7,
  md: 9,
  lg: 11,
  xl: 13,
  xxl: 18,
  pill: 999,
} as const;

export const typography = {
  fontFamily: 'Manrope',
  fontFamilyBold: 'Manrope_800ExtraBold',
  fontFamilySemi: 'Manrope_600SemiBold',
  fontFamilyMedium: 'Manrope_500Medium',
  fontFamilyRegular: 'Manrope_400Regular',
  fontFamilyExtra: 'Manrope_700Bold',
  eyebrow: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1.5 },
  h1: { fontSize: 42, fontWeight: '600' as const, letterSpacing: -1.8 },
  h2: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.3 },
  h3: { fontSize: 13, fontWeight: '700' as const },
  body: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 10, fontWeight: '700' as const },
  micro: { fontSize: 8, fontWeight: '800' as const, letterSpacing: 0.9 },
  nav: { fontSize: 13, fontWeight: '700' as const },
  button: { fontSize: 10, fontWeight: '800' as const },
} as const;

export const layout = {
  topbarHeight: 72,
  topbarHeightMobile: 64,
  trainerMaxPct: 0.32,
  inspectorWidth: 230,
  fieldMinHeight: 518,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.15,
    shadowRadius: 42,
    elevation: 8,
  },
  workspace: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.26,
    shadowRadius: 70,
    elevation: 12,
  },
  player: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;

export type ColorKey = 'ol' | 'wr' | 'qb' | 'fb' | 'rb' | 'te' | 'def' | 'default';

export const PLAYER_COLORS: Record<ColorKey, { fill: string; text: string }> = {
  ol: { fill: colors.ol, text: '#112230' },
  wr: { fill: colors.wr, text: '#252711' },
  qb: { fill: colors.qb, text: '#ffffff' },
  fb: { fill: colors.fb, text: '#111111' },
  rb: { fill: colors.rb, text: '#30120f' },
  te: { fill: colors.te, text: '#2d1022' },
  def: { fill: colors.def, text: '#19201a' },
  default: { fill: '#CCCCCC', text: '#111111' },
};
