import { POSITION_COLORS } from '@/src/core/schema';
import { colors } from '@/src/design/tokens';

export { POSITION_COLORS };

export const FIELD_COLORS = {
  turf: colors.turf,
  turfAlt: '#24522c',
  line: 'rgba(255,255,255,0.18)',
  hash: 'rgba(255,255,255,0.18)',
  hashStripe: 'rgba(236,244,226,0.16)',
  los: 'rgba(255,255,255,0.9)',
  title: colors.text,
  titleStroke: '#111111',
  titleAccent: '#E53935',
  /** Flashcard / builder yellow */
  arrow: colors.routeYellow,
  /** Figma play-viewer route */
  arrowViewer: colors.routeYellow,
  arrowAlt: '#f1f3eb',
  gapLabel: colors.routeYellow,
  highlightStroke: colors.lime,
  chipStroke: '#152019',
  chipShadow: 'rgba(0,0,0,0.25)',
  selectionRing: colors.lime,
  losCaption: 'rgba(255,255,255,0.65)',
  losCaptionBorder: 'rgba(255,255,255,0.2)',
};
