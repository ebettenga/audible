import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FieldCanvas } from '@/src/render';
import { Button, KeyHint, ModalShell } from '@/src/ui';
import { colors, typography, radius, shadows, useBreakpoint } from '@/src/design';
import { Inspector } from './Inspector';
import { CallControls } from './CallControls';
import type { BuilderState } from './useBuilderState';

export function PlayBuilder({
  builder,
  onSave,
  savedPlayId,
  saveError,
}: {
  builder: BuilderState;
  onSave: () => void;
  savedPlayId?: string | null;
  saveError?: string | null;
}) {
  const router = useRouter();
  const { isDesktop, isMobile } = useBreakpoint();
  const showSideInspector = isDesktop;
  const showMobileAssignmentSheet = !isDesktop && !!builder.selectedSlot;
  const assignmentTitle = builder.selectedPlayer
    ? `${builder.selectedPlayer.label ?? 'Player'} · ${
        builder.selectedPlayer.position ?? (builder.side === 'def' ? 'Defender' : 'Receiver')
      }`
    : 'Assignment';

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSave]);

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.labelRow}>
            <View style={styles.liveDot} />
            <Text style={styles.label}>PLAY BUILDER</Text>
          </View>
          <Text style={styles.h2}>Design the call.</Text>
          <Text style={styles.sub}>
            Type a playcall or build it from the controls — chart and name stay in sync.
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            label={builder.routesVisible ? 'Hide routes' : 'Show routes'}
            icon="grid"
            variant="secondary"
            onPress={() => builder.setRoutesVisible(!builder.routesVisible)}
          />
          <Button
            label={builder.saved ? 'Saved' : 'Save play'}
            icon={builder.saved ? 'spark' : 'arrow'}
            variant={builder.saved ? 'saved' : 'primary'}
            onPress={onSave}
          />
        </View>
      </View>

      {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
      {savedPlayId && builder.saved ? (
        <Pressable onPress={() => router.push(`/play/${savedPlayId}` as never)}>
          <Text style={styles.savedLink}>Saved — open play detail →</Text>
        </Pressable>
      ) : null}

      <View style={[styles.workspace, !showSideInspector && styles.workspaceStack]}>
        <View style={styles.fieldCard}>
          <FieldCanvas
            scene={{ ...builder.scene, title: '' }}
            height={isMobile ? 360 : 480}
            variant="viewer"
            showTitle={false}
            caption={
              builder.conceptLabel !== '(none)' ? builder.conceptLabel : builder.formationLabel
            }
            routesVisible={builder.routesVisible}
            selectedPlayerId={builder.selectedPlayer?.id}
            compact={isMobile}
            interactive
            onPlayerPress={(p) => {
              const want = builder.side === 'def' ? 'def' : 'off';
              if (p.side === want && p.slot) builder.selectPlayer(p.slot);
            }}
            flipped={builder.side === 'def' || !!builder.scene.flipped}
          />
          <CallControls builder={builder} />
        </View>
        {showSideInspector ? (
          <View style={styles.inspectorCol}>
            <Inspector builder={builder} />
          </View>
        ) : null}
      </View>

      {showMobileAssignmentSheet ? (
        <ModalShell
          visible
          onClose={() => builder.selectPlayer(null)}
          title={assignmentTitle}
          subtitle="Set the assignment, then apply to this play."
          icon="grid"
          align="bottom"
          flush
          maxWidth={720}
        >
          <ScrollView
            style={styles.mobileSheetScroll}
            contentContainerStyle={styles.mobileSheetScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Inspector builder={builder} variant="sheet" />
          </ScrollView>
        </ModalShell>
      ) : null}

      <View style={styles.footer}>
        <View />
        <KeyHint />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    minWidth: 0,
    paddingTop: 28,
    paddingHorizontal: 28,
    paddingBottom: 22,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 24,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.lime,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: '#96a098',
    fontFamily: typography.fontFamilyBold,
  },
  h2: {
    fontSize: 28,
    letterSpacing: -1.1,
    fontWeight: '600',
    marginTop: 9,
    marginBottom: 5,
    color: colors.text,
    fontFamily: typography.fontFamilySemi,
  },
  sub: { margin: 0, color: '#77807a', fontSize: 12, maxWidth: 420 },
  actions: { flexDirection: 'row', gap: 9, flexWrap: 'wrap' },
  saveError: {
    color: '#e87868',
    fontSize: 12,
    marginBottom: 8,
  },
  savedLink: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  workspace: {
    flexDirection: 'row',
    minHeight: 560,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.xxl,
    backgroundColor: '#151a18',
    overflow: 'hidden',
    ...shadows.workspace,
  },
  workspaceStack: { flexDirection: 'column', minHeight: 480 },
  fieldCard: { flex: 1, minWidth: 0, borderRightWidth: 1, borderRightColor: colors.borderStrong },
  inspectorCol: { width: 240 },
  mobileSheetScroll: { maxHeight: 520 },
  mobileSheetScrollContent: { paddingBottom: 8 },
  footer: {
    height: 53,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
});
