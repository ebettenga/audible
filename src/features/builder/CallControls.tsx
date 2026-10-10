import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Select, Button, Icon } from '@/src/ui';
import { colors, typography, radius } from '@/src/design';
import { ROUTES } from '@/src/data/routes';
import { MOTIONS } from '@/src/data/motions';
import { MODIFIER_OPTIONS } from './composePlaycall';
import type { BuilderState } from './useBuilderState';

const TAG_SLOTS = [
  { slot: 'x', label: 'X' },
  { slot: 'y', label: 'Y' },
  { slot: 'z', label: 'Z' },
  { slot: 'h', label: 'H' },
  { slot: 'fb', label: 'F' },
  { slot: 'rb', label: 'R' },
];

type SectionId =
  | 'formation'
  | 'pass'
  | 'run'
  | 'protection'
  | 'defense'
  | 'front'
  | 'coverage'
  | 'pressure'
  | 'vs';

function CollapsibleSection({
  id,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  summary?: string;
  open: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Pressable
        style={styles.sectionHeader}
        onPress={() => onToggle(id)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {!open && summary ? (
            <Text style={styles.sectionSummary} numberOfLines={1}>
              {summary}
            </Text>
          ) : null}
        </View>
        <View style={[styles.chevron, open && styles.chevronOpen]}>
          <Icon name="chevron" size={14} color={colors.muted} />
        </View>
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

const CUSTOM_KINDS = [
  { id: 'concept' as const, label: 'Concept' },
  { id: 'formation' as const, label: 'Formation' },
  { id: 'run' as const, label: 'Run' },
];

export function CallControls({ builder }: { builder: BuilderState }) {
  const isDefense = builder.side === 'def';
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    formation: true,
    pass: true,
    run: false,
    protection: false,
    defense: false,
    front: true,
    coverage: true,
    pressure: true,
    vs: true,
  });
  const [tagSlot, setTagSlot] = useState('y');
  const [tagRoute, setTagRoute] = useState('Pop');
  const [pendingMotionSlot, setPendingMotionSlot] = useState('z');
  const [customWord, setCustomWord] = useState('');
  const [customKind, setCustomKind] = useState<'concept' | 'formation' | 'run'>('concept');
  const [customMapsTo, setCustomMapsTo] = useState('Mesh');

  const routeNames = ROUTES.map((r) => r.name.split(' / ')[0]);
  const mapOptions = useMemo(() => {
    if (customKind === 'formation') return builder.formationOptions.filter((o) => o !== '(none)');
    if (customKind === 'run') return builder.runOptions.filter((o) => o !== '(none)');
    return builder.conceptOptions.filter((o) => o !== '(none)');
  }, [customKind, builder.formationOptions, builder.runOptions, builder.conceptOptions]);

  const toggle = (id: SectionId) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formationSummary = useMemo(() => {
    const mods = builder.modifiers.length
      ? ` · ${builder.modifiers.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}`
      : '';
    const motion = builder.motion
      ? ` · ${TAG_SLOTS.find((s) => s.slot === builder.motion?.slot)?.label ?? builder.motion.slot.toUpperCase()} ${
          MOTIONS.find((m) => m.id === builder.motion?.motionId)?.name ?? builder.motion.motionId
        }`
      : '';
    return `${builder.formationLabel} ${builder.strength === 'left' ? 'Left' : 'Right'}${mods}${motion}`;
  }, [builder.formationLabel, builder.strength, builder.modifiers, builder.motion]);

  const motionSlot = builder.motion?.slot ?? pendingMotionSlot;
  const motionLabel =
    MOTIONS.find((m) => m.id === builder.motion?.motionId)?.name ?? '(none)';

  const passSummary = useMemo(() => {
    const parts: string[] = [];
    if (builder.conceptLabel !== '(none)') parts.push(builder.conceptLabel);
    if (builder.routeDigits) parts.push(builder.routeDigits);
    if (builder.tags.length) {
      parts.push(
        builder.tags
          .map(
            (t) =>
              `${TAG_SLOTS.find((s) => s.slot === t.slot)?.label ?? t.slot.toUpperCase()}-${
                ROUTES.find((r) => r.id === t.routeId)?.name.split(' / ')[0] ?? t.routeId
              }`,
          )
          .join(' '),
      );
    }
    return parts.length ? parts.join(' · ') : 'No concept or routes set';
  }, [builder.conceptLabel, builder.routeDigits, builder.tags]);

  const runSummary = useMemo(() => {
    if (builder.runLabel === '(none)') return 'No run';
    return `${builder.runIsFake ? 'Fake ' : ''}${builder.runLabel}`;
  }, [builder.runLabel, builder.runIsFake]);

  const protectionSummary =
    builder.protectionLabel === '(none)' ? 'No protection' : builder.protectionLabel;

  const defenseSummary = useMemo(() => {
    const cov = builder.coverageLabel === '(none)' ? null : builder.coverageLabel;
    return [cov, builder.frontLabel].filter(Boolean).join(' · ') || 'No overlay';
  }, [builder.coverageLabel, builder.frontLabel]);

  const defFrontSummary = builder.frontLabel;
  const defCoverageSummary =
    builder.coverageLabel === '(none)' ? 'No coverage' : builder.coverageLabel;
  const defPressureSummary = builder.pressureLabel;
  const defVsSummary = builder.vsPlaycall || 'No offensive look';

  return (
    <View style={styles.wrap}>
      {!isDefense ? (
        <>
          <Text style={styles.lead}>Call system</Text>
          <View style={styles.chips}>
            {(builder.systemOptions ?? []).map((sys) => {
              const active = (builder.systemIds ?? []).includes(sys.id);
              return (
                <Pressable
                  key={sys.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => builder.toggleSystem?.(sys.id)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{sys.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <Text style={styles.lead}>{isDefense ? 'Defensive call' : 'Playcall'}</Text>
      <TextInput
        value={builder.playcall}
        onChangeText={builder.setPlaycallText}
        placeholder={isDefense ? '4-3 Over Cover 3 Fire Zone' : 'Gun Doubles Right Wide Zone'}
        placeholderTextColor="#5e6861"
        autoCapitalize="words"
        autoCorrect={false}
        style={[styles.playcallInput, builder.parseError ? styles.playcallError : null]}
      />
      {builder.parseError ? (
        <Text style={styles.errorText}>{builder.parseError}</Text>
      ) : builder.parseWarnings?.length ? (
        <Text style={styles.warnText}>{builder.parseWarnings[0]}</Text>
      ) : (
        <Text style={styles.hint}>
          {isDefense
            ? 'Front · Coverage · Pressure — unknown words warn, they do not block save.'
            : 'Type any call language — unknown words warn, they do not block save. Display name is free.'}
        </Text>
      )}

      {!isDefense ? (
        <>
      <Text style={[styles.lead, { marginTop: 10 }]}>Custom word</Text>
      <View style={styles.row}>
        <TextInput
          value={customWord}
          onChangeText={setCustomWord}
          placeholder="Zebra"
          placeholderTextColor="#5e6861"
          autoCapitalize="words"
          autoCorrect={false}
          style={[styles.playcallInput, { flex: 1, marginTop: 0 }]}
        />
      </View>
      <View style={styles.row}>
        <Select
          label="Kind"
          value={CUSTOM_KINDS.find((k) => k.id === customKind)?.label ?? 'Concept'}
          options={CUSTOM_KINDS.map((k) => k.label)}
          onChange={(label) => {
            const found = CUSTOM_KINDS.find((k) => k.label === label);
            if (found) {
              setCustomKind(found.id);
              const opts =
                found.id === 'formation'
                  ? builder.formationOptions
                  : found.id === 'run'
                    ? builder.runOptions
                    : builder.conceptOptions;
              const first = opts.find((o) => o !== '(none)');
              if (first) setCustomMapsTo(first);
            }
          }}
        />
        <Select
          label="Maps to"
          value={mapOptions.includes(customMapsTo) ? customMapsTo : mapOptions[0] ?? ''}
          options={mapOptions}
          onChange={setCustomMapsTo}
        />
      </View>
      <Button
        label="Add custom alias"
        variant="secondary"
        onPress={() => {
          const word = customWord.trim();
          if (!word || !customMapsTo) return;
          builder.addCustomAliasFromLabel?.(customKind, word, customMapsTo);
          setCustomWord('');
        }}
        style={{ marginTop: 4 }}
      />

      <View style={styles.sections}>
        <CollapsibleSection
          id="formation"
          title="Formation & alignment"
          summary={formationSummary}
          open={openSections.formation}
          onToggle={toggle}
        >
          <View style={styles.row}>
            <Select
              label="Formation"
              value={builder.formationLabel}
              options={builder.formationOptions}
              onChange={builder.setFormationByName}
            />
            <Select
              label="Strength"
              value={builder.strength === 'left' ? 'Left' : 'Right'}
              options={['Left', 'Right']}
              onChange={(v) => builder.setStrength(v === 'Left' ? 'left' : 'right')}
            />
          </View>
          <Text style={styles.fieldLabel}>Modifiers</Text>
          <View style={styles.chips}>
            {MODIFIER_OPTIONS.map((mod) => {
              const active = builder.modifiers.map((m) => m.toLowerCase()).includes(mod);
              return (
                <Pressable
                  key={mod}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => builder.toggleModifier(mod)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {mod.charAt(0).toUpperCase() + mod.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.row}>
            <Select
              label="Motion player"
              value={TAG_SLOTS.find((s) => s.slot === motionSlot)?.label ?? 'Z'}
              options={TAG_SLOTS.map((s) => s.label)}
              onChange={(label) => {
                const found = TAG_SLOTS.find((s) => s.label === label);
                if (!found) return;
                setPendingMotionSlot(found.slot);
                if (builder.motion) builder.setMotion(found.slot, builder.motion.motionId);
              }}
            />
            <Select
              label="Motion"
              value={motionLabel}
              options={['(none)', ...MOTIONS.map((m) => m.name)]}
              onChange={(name) => {
                builder.setMotion(motionSlot, MOTIONS.find((m) => m.name === name)?.id);
              }}
            />
          </View>
        </CollapsibleSection>

        <CollapsibleSection
          id="pass"
          title="Pass concept & routes"
          summary={passSummary}
          open={openSections.pass}
          onToggle={toggle}
        >
          <View style={styles.row}>
            <Select
              label="Concept"
              value={builder.conceptLabel}
              options={builder.conceptOptions}
              onChange={builder.setConceptByName}
            />
            <View style={styles.digitsWrap}>
              <Text style={styles.floating}>Route digits</Text>
              <TextInput
                value={builder.routeDigits}
                onChangeText={builder.setRouteDigits}
                placeholder="999"
                placeholderTextColor="#5e6861"
                keyboardType="number-pad"
                style={styles.digitsInput}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Player tags</Text>
          <View style={styles.tagRow}>
            {builder.tags.length === 0 ? (
              <Text style={styles.emptyTags}>No tags — e.g. Y-Pop, F-Angle</Text>
            ) : (
              builder.tags.map((t) => (
                <Pressable
                  key={`${t.slot}-${t.routeId}`}
                  style={styles.tagChip}
                  onPress={() => builder.removeTag(t.slot)}
                >
                  <Text style={styles.tagChipText}>
                    {(TAG_SLOTS.find((s) => s.slot === t.slot)?.label ?? t.slot.toUpperCase())}-
                    {ROUTES.find((r) => r.id === t.routeId)?.name.split(' / ')[0] ?? t.routeId} ×
                  </Text>
                </Pressable>
              ))
            )}
          </View>
          <View style={styles.row}>
            <Select
              label="Player"
              value={TAG_SLOTS.find((s) => s.slot === tagSlot)?.label ?? 'Y'}
              options={TAG_SLOTS.map((s) => s.label)}
              onChange={(label) => {
                const found = TAG_SLOTS.find((s) => s.label === label);
                if (found) setTagSlot(found.slot);
              }}
            />
            <Select
              label="Route"
              value={tagRoute}
              options={routeNames}
              onChange={setTagRoute}
            />
          </View>
          <Button
            label="Add tag"
            variant="secondary"
            onPress={() => {
              const route = ROUTES.find((r) => r.name.split(' / ')[0] === tagRoute);
              if (!route) return;
              builder.addTag({ slot: tagSlot, routeId: route.id, highlight: true });
            }}
            style={{ marginTop: 4 }}
          />
        </CollapsibleSection>

        <CollapsibleSection
          id="run"
          title="Run game"
          summary={runSummary}
          open={openSections.run}
          onToggle={toggle}
        >
          <View style={styles.row}>
            <Select
              label="Run"
              value={builder.runLabel}
              options={builder.runOptions}
              onChange={builder.setRunByName}
            />
            <Select
              label="Fake"
              value={builder.runIsFake ? 'Yes' : 'No'}
              options={['No', 'Yes']}
              onChange={(v) => builder.setRunIsFake(v === 'Yes')}
            />
          </View>
        </CollapsibleSection>

        <CollapsibleSection
          id="protection"
          title="Protection"
          summary={protectionSummary}
          open={openSections.protection}
          onToggle={toggle}
        >
          <Select
            label="Protection"
            value={builder.protectionLabel}
            options={builder.protectionOptions}
            onChange={builder.setProtectionById}
          />
        </CollapsibleSection>

        <CollapsibleSection
          id="defense"
          title="Defense overlay"
          summary={defenseSummary}
          open={openSections.defense}
          onToggle={toggle}
        >
          <View style={styles.row}>
            <Select
              label="Coverage"
              value={builder.coverageLabel}
              options={builder.coverageOptions}
              onChange={builder.setCoverageByName}
            />
            <Select
              label="Front"
              value={builder.frontLabel}
              options={builder.frontOptions}
              onChange={builder.setFrontByName}
            />
          </View>
        </CollapsibleSection>
      </View>
        </>
      ) : (
        <View style={styles.sections}>
          <CollapsibleSection
            id="front"
            title="Front & alignment"
            summary={defFrontSummary}
            open={openSections.front}
            onToggle={toggle}
          >
            <Select
              label="Front"
              value={builder.frontLabel}
              options={builder.frontOptions}
              onChange={builder.setFrontByName}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="coverage"
            title="Coverage"
            summary={defCoverageSummary}
            open={openSections.coverage}
            onToggle={toggle}
          >
            <Select
              label="Coverage"
              value={builder.coverageLabel}
              options={builder.coverageOptions}
              onChange={builder.setCoverageByName}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="pressure"
            title="Pressure"
            summary={defPressureSummary}
            open={openSections.pressure}
            onToggle={toggle}
          >
            <Select
              label="Pressure"
              value={builder.pressureLabel}
              options={builder.pressureOptions}
              onChange={builder.setPressureByName}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="vs"
            title="Vs offense look"
            summary={defVsSummary}
            open={openSections.vs}
            onToggle={toggle}
          >
            <Text style={styles.floating}>Ghost offense playcall</Text>
            <TextInput
              value={builder.vsPlaycall}
              onChangeText={builder.setVsPlaycall}
              placeholder="Gun Doubles Right 62 Slant-Flat"
              placeholderTextColor="#5e6861"
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.playcallInput}
            />
            <Text style={styles.hint}>
              Shown as a ghost offense so defenders can see their matchups.
            </Text>
          </CollapsibleSection>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
    backgroundColor: '#181e1b',
  },
  lead: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: '#96a098',
    fontFamily: typography.fontFamilyBold,
    textTransform: 'uppercase',
  },
  playcallInput: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: '#121714',
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  playcallError: {
    borderColor: '#e87868',
  },
  errorText: {
    color: '#e87868',
    fontSize: 11,
  },
  warnText: {
    color: '#f0a55d',
    fontSize: 11,
  },
  hint: {
    color: '#6a736c',
    fontSize: 11,
    marginBottom: 4,
  },
  sections: {
    gap: 8,
    marginTop: 4,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: colors.borderMid,
    borderRadius: radius.lg,
    backgroundColor: '#141a17',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
  },
  sectionSummary: {
    marginTop: 2,
    color: '#6a736c',
    fontSize: 11,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  sectionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderMid,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldLabel: {
    color: '#8e9790',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderMid,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: colors.lime,
    backgroundColor: 'rgba(201,242,91,0.12)',
  },
  chipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.lime,
  },
  digitsWrap: {
    minWidth: 110,
    flexGrow: 1,
    position: 'relative',
  },
  floating: {
    position: 'absolute',
    top: -7,
    left: 10,
    zIndex: 1,
    paddingHorizontal: 4,
    backgroundColor: '#141a17',
    color: '#8e9790',
    fontSize: 9,
    fontWeight: '700',
  },
  digitsInput: {
    borderWidth: 1,
    borderColor: colors.borderMid,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    minHeight: 42,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emptyTags: {
    color: '#5e6861',
    fontSize: 11,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: colors.borderMid,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#121714',
  },
  tagChipText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
});
