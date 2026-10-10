import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NO_ROUTE_ID } from '@/src/core/parser';
import { Eyebrow, SegmentedOptions, Slider, Button, isOptionActive } from '@/src/ui';
import { FieldCanvas } from '@/src/render';
import { colors, typography } from '@/src/design';
import { findRouteByName, ROUTES } from '@/src/data/routes';
import { MOTIONS } from '@/src/data/motions';
import { scaleRouteToDepth } from '@/src/core/routeMath';
import { LINE_OPTIONS, BACK_OPTIONS, DEFENDER_OPTIONS } from '@/src/data/lineBlocking';
import type { PlayScene } from '@/src/core/schema';
import { SLOT_TO_TAG_ROLE } from './composePlaycall';
import type { BuilderState } from './useBuilderState';

const MOTION_CHOICES = ['None', ...MOTIONS.map((m) => m.name)];

export function Inspector({ builder }: { builder: BuilderState }) {
  const player = builder.selectedPlayer;
  const label = player?.label ?? '—';
  const position = player?.position ?? (builder.side === 'def' ? 'Defender' : 'Receiver');
  const hasRoute = !!builder.draftRoute;
  const route = hasRoute
    ? findRouteByName(builder.draftRoute) ??
      ROUTES.find((r) =>
        r.name.toLowerCase().startsWith(builder.draftRoute.toLowerCase().split(' / ')[0]),
      )
    : undefined;
  const blockOpt = [...LINE_OPTIONS, ...BACK_OPTIONS, ...DEFENDER_OPTIONS].find(
    (o) => o.label === builder.draftRoute,
  );
  const override = builder.selectedOverride;
  const routeStatus = !override
    ? 'From the call'
    : override.routeId === NO_ROUTE_ID
      ? 'No route on this play'
      : 'One-off on this play';
  const role = builder.selectedRole;
  const fieldLabel =
    role === 'line'
      ? 'Blocking assignment'
      : role === 'defender'
        ? 'Defender assignment'
        : role === 'back'
          ? 'Assignment'
          : 'Route';
  const slot = builder.selectedSlot;
  const canMotion =
    builder.side === 'off' && player?.side === 'off' && !!slot && slot in SLOT_TO_TAG_ROLE;
  const motionDef =
    slot && builder.motion?.slot === slot
      ? MOTIONS.find((m) => m.id === builder.motion?.motionId)
      : undefined;
  const otherMover =
    builder.motion && builder.motion.slot !== slot
      ? SLOT_TO_TAG_ROLE[builder.motion.slot] ?? builder.motion.slot.toUpperCase()
      : undefined;

  const previewScene = useMemo<PlayScene | null>(() => {
    if (!player) return null;
    if (!hasRoute) {
      return {
        title: '',
        players: [{ ...player, x: 0, y: 0, highlight: true }],
        arrows: [],
        zones: [],
        annotations: [],
        gapLabels: [],
      };
    }
    const depth = builder.draftDepth || route?.defaultDepth || 8;
    const waypoints = blockOpt
      ? blockOpt.path
      : route ? scaleRouteToDepth(route, depth) : [
      { x: 0, y: 0 },
      { x: 0, y: depth },
    ];
    return {
      title: '',
      players: [{ ...player, x: 0, y: 0, highlight: true }],
      arrows: [
        {
          id: 'preview',
          playerId: player.id,
          points: waypoints.length >= 2 ? waypoints : [{ x: 0, y: 0 }, { x: 0, y: depth }],
          curve: route?.curve ?? 'rounded',
          arrowhead: blockOpt ? 'block' : route?.arrowhead ?? 'arrow',
          color: colors.routeYellow,
        },
      ],
      zones: [],
      annotations: [],
      gapLabels: [],
    };
  }, [player, hasRoute, route, blockOpt, builder.draftDepth]);

  return (
    <View style={styles.wrap}>
      <Eyebrow>Assignment</Eyebrow>
      <Text style={styles.title}>
        {label} {position}
      </Text>
      <Text style={styles.sub}>
        {role === 'receiver' ? 'Set the route and motion.' : 'Set the assignment.'}
      </Text>

      <View style={styles.preview}>
        {previewScene ? (
          <FieldCanvas
            scene={previewScene}
            height={114}
            compact
            showLabels
            showYardNumbers={false}
            showHashes={false}
            showCaption={false}
            showZones={false}
            showDefense={player?.side === 'def'}
            downfieldYards={16}
            backfieldYards={3}
            halfWidthYards={8}
            interactive={false}
          />
        ) : (
          <Text style={styles.previewEmpty}>Select a player</Text>
        )}
      </View>

      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>{fieldLabel}</Text>
          <Text style={[styles.status, override && styles.statusOneOff]}>{routeStatus}</Text>
        </View>
        <SegmentedOptions
          options={builder.assignmentChoices}
          value={builder.draftRoute}
          onChange={(v) => {
            if (isOptionActive(builder.draftRoute, v)) {
              builder.clearAssignment();
              return;
            }
            builder.setDraftRoute(v);
            // Line / back / defender options apply immediately — no depth to dial in.
            if (role !== 'receiver') builder.applyAssignmentFor?.(v);
          }}
        />
        <View style={styles.fieldHeader}>
          <Text style={styles.fieldHint}>Tap the selected one again to clear it.</Text>
          {override ? (
            <Pressable onPress={builder.resetAssignment} hitSlop={8}>
              <Text style={styles.resetLink}>Reset to call</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {builder.choiceUsesDepth ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Break depth</Text>
          <Slider
            value={builder.draftDepth}
            onChange={builder.setDraftDepth}
            min={1}
            max={20}
          />
        </View>
      ) : null}

      {canMotion && slot ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Pre-snap motion</Text>
          <SegmentedOptions
            options={MOTION_CHOICES}
            value={motionDef?.name ?? 'None'}
            onChange={(v) => {
              const next = MOTIONS.find((m) => m.name === v);
              if (next && next.id !== motionDef?.id) builder.setMotion(slot, next.id);
              else if (motionDef) builder.setMotion(slot, undefined);
            }}
          />
          <Text style={styles.fieldHint}>
            {motionDef
              ? motionDef.description
              : otherMover
                ? `${otherMover} is in motion. Picking one here moves it to this player.`
                : 'Dashed path shows where he is at the snap.'}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={role === 'receiver' ? 'No route' : 'No assignment'}
          variant="secondary"
          disabled={override?.routeId === NO_ROUTE_ID}
          onPress={builder.clearAssignment}
          style={{ flex: 1, justifyContent: 'center' }}
        />
        <Button
          label="Apply to this play"
          icon="arrow"
          variant="apply"
          disabled={!hasRoute}
          onPress={builder.applyAssignment}
          style={{ flex: 1, justifyContent: 'center' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 23,
    paddingHorizontal: 18,
    backgroundColor: '#171d1a',
    flex: 1,
  },
  title: {
    marginTop: 5,
    fontSize: 17,
    color: colors.text,
    fontFamily: typography.fontFamilySemi,
    fontWeight: '600',
  },
  sub: { marginTop: 0, color: '#778079', fontSize: 9 },
  preview: {
    height: 114,
    marginVertical: 19,
    borderWidth: 1,
    borderColor: '#303833',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.turf,
  },
  previewEmpty: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 46,
  },
  field: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#2b322e',
  },
  fieldLabel: {
    marginBottom: 9,
    color: '#8e9790',
    fontSize: 9,
    fontWeight: '700',
  },
  fieldHint: {
    marginTop: 8,
    color: '#6a736c',
    fontSize: 10,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 9,
  },
  status: {
    color: '#6a736c',
    fontSize: 9,
    fontWeight: '700',
  },
  statusOneOff: {
    color: colors.lime,
  },
  resetLink: {
    marginTop: 8,
    color: colors.lime,
    fontSize: 10,
    fontWeight: '700',
  },
});
