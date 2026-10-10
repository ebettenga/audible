import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { FieldCanvas } from '@/src/render';
import { buildPlay, PlaycallError } from '@/src/core/parser';
import type { PlayScene } from '@/src/core/schema';
import { COVERAGES } from '@/src/data/coverages';
import { Eyebrow } from '@/src/ui';
import { colors, typography, radius } from '@/src/design';

const EXAMPLES = [
  'Ace Twins Right 62 Slant-Flat',
  'I Right 999 Y-Pop',
  'I Right Slot Fake 24 Lead 989 F Angle 68',
  'Shotgun Right 979',
  'Trips Right 989',
];

export default function PlaygroundScreen() {
  const [playcall, setPlaycall] = useState('Ace Twins Right 62 Slant-Flat');
  const [showDefense, setShowDefense] = useState(true);
  const [coverageId, setCoverageId] = useState<string | undefined>('cover-3');
  const [error, setError] = useState<string | null>(null);
  const [scene, setScene] = useState<PlayScene | null>(null);

  useEffect(() => {
    try {
      const s = buildPlay(playcall, {
        includeDefense: showDefense,
        coverageId: showDefense ? coverageId : undefined,
        frontId: '4-3',
      });
      setScene(s);
      setError(null);
    } catch (e) {
      setError(
        e instanceof PlaycallError
          ? `${e.message} (token: "${e.token}")`
          : e instanceof Error
            ? e.message
            : 'Parse error',
      );
      setScene(null);
    }
  }, [playcall, showDefense, coverageId]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Eyebrow>Dev</Eyebrow>
      <Text style={styles.heading}>Playcall Playground</Text>
      <TextInput
        style={styles.input}
        value={playcall}
        onChangeText={setPlaycall}
        autoCapitalize="words"
        autoCorrect={false}
        placeholder="e.g. Ace Twins Right 62 Slant-Flat"
        placeholderTextColor="#6A7A6A"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {EXAMPLES.map((ex) => (
          <Pressable key={ex} style={styles.chip} onPress={() => setPlaycall(ex)}>
            <Text style={styles.chipText}>{ex}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.row}>
        <Text style={styles.label}>Show defense</Text>
        <Switch
          value={showDefense}
          onValueChange={setShowDefense}
          trackColor={{ true: colors.lime }}
        />
      </View>

      {showDefense ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {COVERAGES.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chip, coverageId === c.id && styles.chipActive]}
              onPress={() => setCoverageId(c.id)}
            >
              <Text style={styles.chipText}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {scene ? (
        <View style={styles.fieldWrap}>
          <FieldCanvas
            scene={scene}
            height={440}
            showLabels
          />
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Fix the playcall to render</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, paddingBottom: 40, gap: 12 },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    fontFamily: typography.fontFamilyBold,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chips: { flexGrow: 0 },
  chip: {
    backgroundColor: '#243428',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#3D6B4F' },
  chipText: { color: '#D5E5D5', fontSize: 12, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { color: '#C5D5C5', fontSize: 15 },
  error: {
    color: '#FF8A80',
    backgroundColor: '#3A1A1A',
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
  },
  placeholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  placeholderText: { color: colors.muted },
  fieldWrap: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
});
