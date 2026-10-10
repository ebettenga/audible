import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewToken,
} from 'react-native';
import { FieldCanvas } from '@/src/render';
import type { Player } from '@/src/core/schema';
import type { PlaybookPlay } from '@/src/training/types';
import { colors } from '@/src/design';
import { tryBuildDetailScene } from './playViewer';

type PageProps = {
  play: PlaybookPlay;
  width: number;
  height: number;
  showGrid: boolean;
  selectedLabel?: string;
  onPlayerPress?: (player: Player) => void;
};

const PlayPage = memo(function PlayPage({
  play,
  width,
  height,
  showGrid,
  selectedLabel,
  onPlayerPress,
}: PageProps) {
  const scene = useMemo(() => tryBuildDetailScene(play), [play]);
  if (!scene) {
    return (
      <View style={[styles.fallback, { width, height }]}>
        <Text style={styles.muted}>Could not render playcall</Text>
      </View>
    );
  }
  return (
    <View style={{ width }}>
      <FieldCanvas
        scene={scene}
        width={width}
        height={height}
        showLabels
        showGrid={showGrid}
        caption={play.concept}
        routesVisible
        selectedPlayerId={
          selectedLabel
            ? scene.players.find((p) => p.label === selectedLabel && p.side === 'off')?.id
            : undefined
        }
        onPlayerPress={onPlayerPress}
      />
    </View>
  );
});

const VIEWABILITY = { itemVisiblePercentThreshold: 60 };

/** Horizontally paged play diagrams; swiping changes the current play. */
export function PlaySwipePager({
  plays,
  index,
  onIndexChange,
  height,
  showGrid,
  selectedLabel,
  onPlayerPress,
}: {
  plays: PlaybookPlay[];
  index: number;
  onIndexChange: (index: number) => void;
  height: number;
  showGrid: boolean;
  selectedLabel?: string;
  onPlayerPress?: (player: Player) => void;
}) {
  const [width, setWidth] = useState(0);
  const listRef = useRef<FlatList<PlaybookPlay>>(null);
  const pageRef = useRef(index);
  const onIndexChangeRef = useRef(onIndexChange);
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  }, [onIndexChange]);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next > 0 && next !== width) setWidth(next);
  };

  useEffect(() => {
    if (!width || index < 0 || index === pageRef.current) return;
    pageRef.current = index;
    listRef.current?.scrollToIndex({ index, animated: true });
  }, [index, width]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<PlaybookPlay>[] }) => {
      const first = viewableItems.find((v) => v.isViewable && v.index != null);
      if (first?.index == null || first.index === pageRef.current) return;
      pageRef.current = first.index;
      onIndexChangeRef.current(first.index);
    },
    [],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<PlaybookPlay> | null | undefined, i: number) => ({
      length: width,
      offset: width * i,
      index: i,
    }),
    [width],
  );

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 ? (
        <FlatList
          ref={listRef}
          data={plays}
          keyExtractor={(p) => p.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={Math.max(0, index)}
          getItemLayout={getItemLayout}
          initialNumToRender={1}
          windowSize={3}
          maxToRenderPerBatch={2}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={VIEWABILITY}
          renderItem={({ item, index: i }) => (
            <PlayPage
              play={item}
              width={width}
              height={height}
              showGrid={showGrid}
              selectedLabel={i === index ? selectedLabel : undefined}
              onPlayerPress={i === index ? onPlayerPress : undefined}
            />
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted },
});
