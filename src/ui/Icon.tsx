import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors } from '@/src/design';

export type IconName =
  | 'arrow'
  | 'book'
  | 'chevron'
  | 'grid'
  | 'help'
  | 'layers'
  | 'play'
  | 'plus'
  | 'search'
  | 'settings'
  | 'spark'
  | 'users';

export function Icon({
  name,
  size = 18,
  color = colors.text,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const stroke = color;
  const common = {
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'arrow' && (
        <>
          <Path d="M5 12h14" {...common} />
          <Path d="m13 6 6 6-6 6" {...common} />
        </>
      )}
      {name === 'book' && (
        <>
          <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" {...common} />
          <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" {...common} />
        </>
      )}
      {name === 'chevron' && <Path d="m9 18 6-6-6-6" {...common} />}
      {name === 'grid' && (
        <>
          <Rect x="3" y="3" width="7" height="7" rx="2" {...common} />
          <Rect x="14" y="3" width="7" height="7" rx="2" {...common} />
          <Rect x="3" y="14" width="7" height="7" rx="2" {...common} />
          <Rect x="14" y="14" width="7" height="7" rx="2" {...common} />
        </>
      )}
      {name === 'help' && (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Path d="M9.7 9a2.4 2.4 0 1 1 3.6 2.1c-.8.5-1.3 1-1.3 1.9" {...common} />
          <Path d="M12 17h.01" {...common} />
        </>
      )}
      {name === 'layers' && (
        <>
          <Path d="m12 2 9 5-9 5-9-5 9-5Z" {...common} />
          <Path d="m3 12 9 5 9-5" {...common} />
          <Path d="m3 17 9 5 9-5" {...common} />
        </>
      )}
      {name === 'play' && <Path d="m8 5 11 7-11 7V5Z" {...common} />}
      {name === 'plus' && (
        <>
          <Path d="M12 5v14" {...common} />
          <Path d="M5 12h14" {...common} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx="11" cy="11" r="7" {...common} />
          <Path d="m20 20-4-4" {...common} />
        </>
      )}
      {name === 'settings' && (
        <>
          <Circle cx="12" cy="12" r="3" {...common} />
          <Path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"
            {...common}
          />
        </>
      )}
      {name === 'spark' && (
        <Path
          d="m12 3 1.3 4.1a5.4 5.4 0 0 0 3.6 3.6L21 12l-4.1 1.3a5.4 5.4 0 0 0-3.6 3.6L12 21l-1.3-4.1a5.4 5.4 0 0 0-3.6-3.6L3 12l4.1-1.3a5.4 5.4 0 0 0 3.6-3.6L12 3Z"
          {...common}
        />
      )}
      {name === 'users' && (
        <>
          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...common} />
          <Circle cx="9" cy="7" r="4" {...common} />
          <Path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" {...common} />
        </>
      )}
    </Svg>
  );
}
