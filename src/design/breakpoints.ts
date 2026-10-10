import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  mobile: 780,
  tablet: 1100,
} as const;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

export function useBreakpoint(): {
  breakpoint: Breakpoint;
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  const { width, height } = useWindowDimensions();
  const breakpoint = getBreakpoint(width);
  return {
    breakpoint,
    width,
    height,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
  };
}
