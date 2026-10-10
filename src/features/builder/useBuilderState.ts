import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildPlay, NO_ROUTE_ID, type AssignmentOverride } from '@/src/core/parser/resolve';
import {
  parsePlaycall,
  PlaycallError,
  buildDefense,
  composeDefenseCall,
  parseDefenseCall,
  defaultDefenseDraft,
  defenseDraftFromAst,
  type DefenseDraft,
} from '@/src/core/parser';
import type { RouteAssignment } from '@/src/core/parser/ast';
import type { Strength } from '@/src/core/field';
import { FORMATIONS } from '@/src/data/formations';
import { CONCEPTS } from '@/src/data/concepts';
import { RUNS } from '@/src/data/runs';
import { PROTECTIONS } from '@/src/data/protections';
import { COVERAGES } from '@/src/data/coverages';
import { FRONTS } from '@/src/data/fronts';
import { PRESSURES } from '@/src/data/pressures';
import { findRouteByName, ROUTES } from '@/src/data/routes';
import {
  BUILTIN_SYSTEMS,
  lexiconOptions,
  mergeLexicon,
  type LexiconEntry,
} from '@/src/data/lexicon';
import type { PlaybookPlay, PlaySide } from '@/src/training/types';
import {
  composePlaycall,
  defaultPlaycallDraft,
  draftFromAst,
  lexiconFromSystemIds,
  type PlaycallDraft,
} from './composePlaycall';

import {
  BACK_OPTIONS,
  BACK_ROUTE_IDS,
  DEFENDER_OPTIONS,
  LINE_OPTIONS,
  roleForPosition,
  type BlockOption,
  type PlayerRole,
} from '@/src/data/lineBlocking';

function blockOptionsForRole(role: PlayerRole): BlockOption[] {
  if (role === 'line') return LINE_OPTIONS;
  if (role === 'back') return BACK_OPTIONS;
  if (role === 'defender') return DEFENDER_OPTIONS;
  return [];
}

/** Labels shown in the inspector for each role. */
function choicesForRole(role: PlayerRole): string[] {
  if (role === 'line') return LINE_OPTIONS.map((o) => o.label);
  if (role === 'defender') return DEFENDER_OPTIONS.map((o) => o.label);
  if (role === 'back') {
    return [
      ...BACK_ROUTE_IDS.map((id) => ROUTES.find((r) => r.id === id)?.name.split(' / ')[0] ?? id),
      ...BACK_OPTIONS.map((o) => o.label),
    ];
  }
  return ROUTES.map((r) => r.name.split(' / ')[0]);
}

const PARSE_DEBOUNCE_MS = 150;
const FALLBACK_CALL = 'Gun Doubles Right 62 Slant-Flat';
const FALLBACK_DEF_CALL = '4-3 Cover 3';

export function useBuilderState() {
  const [systemIds, setSystemIds] = useState<string[]>(['west-coast']);
  const [customLexicon, setCustomLexicon] = useState<LexiconEntry[]>([]);
  const lexicon = useMemo(
    () => lexiconFromSystemIds(systemIds, customLexicon),
    [systemIds, customLexicon],
  );
  const [side, setSideState] = useState<PlaySide>('off');
  const [draft, setDraft] = useState<PlaycallDraft>(defaultPlaycallDraft);
  const [defDraft, setDefDraft] = useState<DefenseDraft>(defaultDefenseDraft);
  const [playcall, setPlaycall] = useState(() =>
    composePlaycall(defaultPlaycallDraft(), mergeLexicon(['west-coast'])),
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [name, setNameState] = useState('');
  const [nameDirty, setNameDirty] = useState(false);
  const [notes, setNotes] = useState('');
  const [coachingPoint, setCoachingPoint] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>('z');
  const [assignments, setAssignments] = useState<Record<string, AssignmentOverride>>({});
  const [routesVisible, setRoutesVisible] = useState(true);
  const [saved, setSaved] = useState(false);
  /** Route picked in the inspector but not applied yet; otherwise the chip shows the live route. */
  const [pendingRoute, setPendingRoute] = useState<{ slot: string | null; label: string } | null>(
    null,
  );
  const [draftDepth, setDraftDepth] = useState(7);
  const [editingPlayId, setEditingPlayId] = useState<string | null>(null);
  const [bookId, setBookId] = useState('packers-2026');
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [lastValidPlaycall, setLastValidPlaycall] = useState(FALLBACK_CALL);

  const syncSource = useRef<'controls' | 'text' | null>(null);
  const parseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);
  const defDraftRef = useRef(defDraft);
  const sideRef = useRef(side);
  const nameDirtyRef = useRef(nameDirty);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    defDraftRef.current = defDraft;
  }, [defDraft]);

  useEffect(() => {
    sideRef.current = side;
  }, [side]);

  useEffect(() => {
    nameDirtyRef.current = nameDirty;
  }, [nameDirty]);

  const lexiconRef = useRef(lexicon);
  useEffect(() => {
    lexiconRef.current = lexicon;
  }, [lexicon]);

  /** Only auto-fill name when the user has never typed a display name. */
  const applyNameFromCall = useCallback((call: string) => {
    if (!nameDirtyRef.current) setNameState(call);
  }, []);

  const patchDraft = useCallback(
    (patch: Partial<PlaycallDraft>) => {
      syncSource.current = 'controls';
      setDraft((prev) => {
        const next = { ...prev, ...patch };
        const call = composePlaycall(next, lexiconRef.current);
        setPlaycall(call);
        setParseError(null);
        setParseWarnings([]);
        setLastValidPlaycall(call);
        applyNameFromCall(call);
        setSaved(false);
        return next;
      });
    },
    [applyNameFromCall],
  );

  const patchDefDraft = useCallback(
    (patch: Partial<DefenseDraft>) => {
      syncSource.current = 'controls';
      setDefDraft((prev) => {
        const next = { ...prev, ...patch };
        const call = composeDefenseCall(next);
        setPlaycall(call);
        setParseError(null);
        setParseWarnings([]);
        setLastValidPlaycall(call);
        applyNameFromCall(call);
        setSaved(false);
        return next;
      });
    },
    [applyNameFromCall],
  );

  const setPlaycallText = useCallback(
    (text: string) => {
      syncSource.current = 'text';
      setPlaycall(text);
      setSaved(false);
      if (parseTimer.current) clearTimeout(parseTimer.current);
      parseTimer.current = setTimeout(() => {
        try {
          if (sideRef.current === 'def') {
            const ast = parseDefenseCall(text);
            const next = defenseDraftFromAst(ast, {
              vsPlaycall: defDraftRef.current.vsPlaycall,
            });
            setDefDraft(next);
            setParseError(null);
            setParseWarnings(ast.warnings ?? []);
            setLastValidPlaycall(text.trim());
            applyNameFromCall(text.trim());
            return;
          }
          const current = draftRef.current;
          const ast = parsePlaycall(text, {
            lexicon: lexiconRef.current,
            softUnknown: true,
          });
          const next = draftFromAst(ast, {
            coverageId: ast.coverageId ?? current.coverageId,
            frontId: ast.frontId ?? current.frontId,
            includeDefenseInCall: !!(ast.coverageId || ast.frontId),
          });
          setDraft(next);
          setParseError(null);
          setParseWarnings(ast.warnings ?? []);
          setLastValidPlaycall(text.trim());
          applyNameFromCall(text.trim());
        } catch (e) {
          const msg =
            e instanceof PlaycallError
              ? `${e.message}${e.token ? ` (token: "${e.token}")` : ''}`
              : e instanceof Error
                ? e.message
                : 'Parse error';
          setParseError(msg);
          setParseWarnings([]);
        }
      }, PARSE_DEBOUNCE_MS);
    },
    [applyNameFromCall],
  );

  useEffect(() => {
    return () => {
      if (parseTimer.current) clearTimeout(parseTimer.current);
    };
  }, []);

  const setName = useCallback((value: string) => {
    setNameState(value);
    setNameDirty(true);
    setSaved(false);
  }, []);

  const scene = useMemo(() => {
    const call = parseError ? lastValidPlaycall : playcall.trim() || lastValidPlaycall;
    if (side === 'def') {
      try {
        return buildDefense(call, {
          vsPlaycall: defDraft.vsPlaycall,
          assignments,
          strength: defDraft.strength,
        });
      } catch {
        return buildDefense(FALLBACK_DEF_CALL, {
          vsPlaycall: defDraft.vsPlaycall,
          assignments,
        });
      }
    }
    try {
      return buildPlay(call, {
        includeDefense: true,
        coverageId: draft.coverageId,
        frontId: draft.frontId ?? '4-3',
        assignments,
      });
    } catch {
      return buildPlay(FALLBACK_CALL, {
        includeDefense: true,
        frontId: '4-3',
        assignments,
      });
    }
  }, [
    side,
    playcall,
    parseError,
    lastValidPlaycall,
    draft.coverageId,
    draft.frontId,
    defDraft.vsPlaycall,
    defDraft.strength,
    assignments,
  ]);

  const selectedPlayer = useMemo(() => {
    const wantSide = side === 'def' ? 'def' : 'off';
    return (
      scene.players.find((p) => p.slot === selectedSlot && p.side === wantSide) ?? null
    );
  }, [scene, selectedSlot, side]);

  const selectedRole = selectedPlayer ? roleForPosition(selectedPlayer.position) : 'receiver';
  const assignmentChoices = useMemo(() => choicesForRole(selectedRole), [selectedRole]);

  const currentRouteLabel = useMemo(() => {
    if (!selectedPlayer) return '';
    const arrow = scene.arrows.find(
      (a) => a.playerId === selectedPlayer.id && a.kind !== 'motion',
    );
    return arrow?.label?.split(' / ')[0] ?? '';
  }, [scene, selectedPlayer]);
  const draftRoute =
    pendingRoute && pendingRoute.slot === selectedSlot ? pendingRoute.label : currentRouteLabel;
  const setDraftRoute = useCallback(
    (label: string) => setPendingRoute({ slot: selectedSlot, label }),
    [selectedSlot],
  );
  const selectedOverride = selectedSlot ? assignments[selectedSlot] : undefined;

  const choiceUsesDepth =
    selectedRole === 'receiver' ||
    (selectedRole === 'back' && !blockOptionsForRole('back').some((o) => o.label === draftRoute));

  const applyAssignmentFor = useCallback(
    (label: string, depth = draftDepth) => {
      if (!selectedSlot || !label) return;
      setPendingRoute(null);
      const blockOpt = blockOptionsForRole(selectedRole).find((o) => o.label === label);
      if (blockOpt) {
        setAssignments((prev) => ({ ...prev, [selectedSlot]: { routeId: blockOpt.id } }));
        setSaved(false);
        return;
      }
      const def =
        findRouteByName(label) ??
        ROUTES.find((r) =>
          r.name.toLowerCase().startsWith(label.toLowerCase().split(' / ')[0]),
        );
      const routeId = def?.id ?? label.toLowerCase().split(/[\s/]+/)[0];
      setAssignments((prev) => ({
        ...prev,
        [selectedSlot]: { routeId, depth },
      }));
      setSaved(false);
    },
    [selectedSlot, selectedRole, draftDepth],
  );

  const applyAssignment = useCallback(() => {
    applyAssignmentFor(draftRoute, draftDepth);
  }, [applyAssignmentFor, draftRoute, draftDepth]);

  /** One-off for this play: the player gets no route, whatever the call says. */
  const clearAssignment = useCallback(() => {
    if (!selectedSlot) return;
    setPendingRoute(null);
    setAssignments((prev) => ({ ...prev, [selectedSlot]: { routeId: NO_ROUTE_ID } }));
    setSaved(false);
  }, [selectedSlot]);

  /** Drop this play's one-off so the player goes back to what the call gives him. */
  const resetAssignment = useCallback(() => {
    if (!selectedSlot) return;
    setPendingRoute(null);
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[selectedSlot];
      return next;
    });
    setSaved(false);
  }, [selectedSlot]);

  const addTag = useCallback(
    (tag: RouteAssignment) => {
      patchDraft({ tags: [...draft.tags.filter((t) => t.slot !== tag.slot), tag] });
    },
    [draft.tags, patchDraft],
  );

  const removeTag = useCallback(
    (slot: string) => {
      patchDraft({ tags: draft.tags.filter((t) => t.slot !== slot) });
    },
    [draft.tags, patchDraft],
  );

  const toggleModifier = useCallback(
    (mod: string) => {
      const key = mod.toLowerCase();
      const has = draft.modifiers.map((m) => m.toLowerCase()).includes(key);
      patchDraft({
        modifiers: has
          ? draft.modifiers.filter((m) => m.toLowerCase() !== key)
          : [...draft.modifiers, key],
      });
    },
    [draft.modifiers, patchDraft],
  );

  const reset = useCallback(
    (opts?: {
      bookId?: string;
      collectionIds?: string[];
      systemIds?: string[];
      customLexicon?: LexiconEntry[];
      side?: PlaySide;
    }) => {
      if (opts?.systemIds) setSystemIds(opts.systemIds);
      if (opts?.customLexicon) setCustomLexicon(opts.customLexicon);
      const nextSide = opts?.side ?? 'off';
      setSideState(nextSide);
      const lex = lexiconFromSystemIds(
        opts?.systemIds ?? systemIds,
        opts?.customLexicon ?? customLexicon,
      );
      if (nextSide === 'def') {
        const next = defaultDefenseDraft();
        const call = composeDefenseCall(next);
        setDefDraft(next);
        setPlaycall(call);
        setLastValidPlaycall(call);
        setSelectedSlot('mike');
        setPendingRoute(null);
      } else {
        const next = defaultPlaycallDraft();
        const call = composePlaycall(next, lex);
        setDraft(next);
        setPlaycall(call);
        setLastValidPlaycall(call);
        setSelectedSlot('z');
        setPendingRoute(null);
      }
      setParseError(null);
      setParseWarnings([]);
      setNameState('');
      setNameDirty(false);
      setNotes('');
      setCoachingPoint('');
      setAssignments({});
      setRoutesVisible(true);
      setSaved(false);
      setDraftDepth(7);
      setEditingPlayId(null);
      if (opts?.bookId) setBookId(opts.bookId);
      if (opts?.collectionIds) setCollectionIds(opts.collectionIds);
      syncSource.current = null;
    },
    [systemIds, customLexicon],
  );

  const loadPlay = useCallback(
    (
      play: PlaybookPlay,
      opts: {
        bookId: string;
        collectionIds?: string[];
        systemIds?: string[];
        customLexicon?: LexiconEntry[];
      },
    ) => {
      if (opts.systemIds) setSystemIds(opts.systemIds);
      if (opts.customLexicon) setCustomLexicon(opts.customLexicon);
      const playSide: PlaySide = play.side === 'def' ? 'def' : 'off';
      setSideState(playSide);
      const lex = lexiconFromSystemIds(
        opts.systemIds ?? ['west-coast'],
        opts.customLexicon ?? [],
      );
      if (playSide === 'def') {
        try {
          const ast = parseDefenseCall(play.playcall);
          const next = defenseDraftFromAst(ast, {
            vsPlaycall: play.vsPlaycall ?? defaultDefenseDraft().vsPlaycall,
            coverageId: play.coverageId ?? ast.coverageId,
            frontId: play.frontId ?? ast.frontId,
            pressureId: play.pressureId ?? ast.pressureId ?? 'base',
          });
          setDefDraft(next);
          setPlaycall(play.playcall);
          setLastValidPlaycall(play.playcall);
          setParseError(null);
          setParseWarnings(ast.warnings ?? []);
          setSelectedSlot('mike');
          setPendingRoute(null);
        } catch {
          const next = defaultDefenseDraft();
          setDefDraft(next);
          setPlaycall(play.playcall);
          setParseError('Could not parse saved defensive call');
          setParseWarnings([]);
        }
      } else {
        try {
          const ast = parsePlaycall(play.playcall, { lexicon: lex, softUnknown: true });
          const next = draftFromAst(ast, {
            coverageId: play.coverageId ?? ast.coverageId,
            frontId: play.frontId ?? ast.frontId ?? '4-3',
            includeDefenseInCall: !!(ast.coverageId || ast.frontId),
          });
          setDraft(next);
          setPlaycall(play.playcall);
          setLastValidPlaycall(play.playcall);
          setParseError(null);
          setParseWarnings(ast.warnings ?? []);
          setSelectedSlot('z');
          setPendingRoute(null);
        } catch {
          const next = defaultPlaycallDraft();
          setDraft(next);
          setPlaycall(play.playcall);
          setParseError('Could not parse saved playcall');
          setParseWarnings([]);
        }
      }
      setNameState(play.name);
      setNameDirty(!!play.name.trim());
      setNotes(play.notes ?? '');
      setCoachingPoint(play.coachingPoint ?? '');
      setAssignments(play.assignments ?? {});
      setEditingPlayId(play.id);
      setBookId(opts.bookId);
      setCollectionIds(opts.collectionIds ?? []);
      setSaved(true);
      syncSource.current = null;
    },
    [],
  );

  const addCustomAlias = useCallback(
    (entry: Omit<LexiconEntry, 'systemId'>) => {
      setCustomLexicon((prev) => [
        ...prev.filter(
          (e) => !(e.kind === entry.kind && e.label.toLowerCase() === entry.label.toLowerCase()),
        ),
        { ...entry, systemId: 'custom' },
      ]);
      setSaved(false);
    },
    [],
  );

  const addCustomAliasFromLabel = useCallback(
    (kind: 'formation' | 'run' | 'concept', word: string, mapsToLabel: string) => {
      const opts = lexiconOptions(lexicon, kind);
      const hit = opts.find((o) => o.label.toLowerCase() === mapsToLabel.toLowerCase());
      if (!hit || !word.trim()) return;
      addCustomAlias({
        kind,
        canonicalId: hit.id,
        label: word.trim(),
        aliases: [word.trim()],
      });
    },
    [lexicon, addCustomAlias],
  );

  const toggleSystem = useCallback((id: string) => {
    setSystemIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
    setSaved(false);
  }, []);

  const selectPlayer = useCallback(
    (slot: string | null) => {
      setSelectedSlot(slot);
      setPendingRoute(null);
      const depth = slot ? assignments[slot]?.depth : undefined;
      if (depth != null) setDraftDepth(depth);
    },
    [assignments],
  );

  const setSide = useCallback(
    (next: PlaySide) => {
      if (next === side) return;
      setSideState(next);
      setAssignments({});
      setParseError(null);
      setParseWarnings([]);
      setSaved(false);
      if (next === 'def') {
        const d = defaultDefenseDraft();
        setDefDraft(d);
        const call = composeDefenseCall(d);
        setPlaycall(call);
        setLastValidPlaycall(call);
        applyNameFromCall(call);
        setSelectedSlot('mike');
        setPendingRoute(null);
      } else {
        const d = defaultPlaycallDraft();
        setDraft(d);
        const call = composePlaycall(d, lexiconRef.current);
        setPlaycall(call);
        setLastValidPlaycall(call);
        applyNameFromCall(call);
        setSelectedSlot('z');
        setPendingRoute(null);
      }
      syncSource.current = null;
    },
    [side, applyNameFromCall],
  );

  const formationOpts = lexiconOptions(lexicon, 'formation');
  const conceptOpts = lexiconOptions(lexicon, 'concept');
  const runOpts = lexiconOptions(lexicon, 'run');
  const formationOptions = formationOpts.map((o) => o.label);
  const conceptOptions = ['(none)', ...conceptOpts.map((o) => o.label)];
  const runOptions = ['(none)', ...runOpts.map((o) => o.label)];
  const protectionOptions = ['(none)', ...PROTECTIONS.map((p) => p.id)];
  const coverageOptions = ['(none)', ...COVERAGES.map((c) => c.name)];
  const frontOptions = FRONTS.map((f) => f.name);
  const systemOptions = BUILTIN_SYSTEMS.map((s) => ({ id: s.id, name: s.name }));

  const formationLabel = lexicon.preferredLabel('formation', draft.formationId);
  const conceptLabel = draft.conceptId
    ? lexicon.preferredLabel('concept', draft.conceptId)
    : '(none)';
  const runLabel = draft.runId ? lexicon.preferredLabel('run', draft.runId) : '(none)';
  const protectionLabel = draft.protectionId ?? '(none)';
  const activeCoverageId = side === 'def' ? defDraft.coverageId : draft.coverageId;
  const activeFrontId = side === 'def' ? defDraft.frontId : draft.frontId;
  const coverageLabel = activeCoverageId
    ? (COVERAGES.find((c) => c.id === activeCoverageId)?.name ?? activeCoverageId)
    : '(none)';
  const frontLabel =
    FRONTS.find((f) => f.id === activeFrontId)?.name ?? activeFrontId ?? '4-3';
  const pressureOptions = PRESSURES.map((p) => p.name);
  const pressureLabel =
    PRESSURES.find((p) => p.id === (defDraft.pressureId ?? 'base'))?.name ?? 'Base';

  const setFormationByName = useCallback(
    (label: string) => {
      const opt = formationOpts.find((x) => x.label === label);
      if (opt) {
        patchDraft({ formationId: opt.id });
        return;
      }
      const f = FORMATIONS.find((x) => x.name === label);
      if (f) patchDraft({ formationId: f.id });
    },
    [patchDraft, formationOpts],
  );

  const setConceptByName = useCallback(
    (label: string) => {
      if (label === '(none)') {
        patchDraft({ conceptId: undefined });
        return;
      }
      const opt = conceptOpts.find((x) => x.label === label);
      if (opt) {
        patchDraft({ conceptId: opt.id });
        return;
      }
      const c = CONCEPTS.find((x) => x.name === label);
      if (c) patchDraft({ conceptId: c.id });
    },
    [patchDraft, conceptOpts],
  );

  const setRunByName = useCallback(
    (label: string) => {
      if (label === '(none)') {
        patchDraft({ runId: undefined, runIsFake: false });
        return;
      }
      const opt = runOpts.find((x) => x.label === label);
      if (opt) {
        patchDraft({ runId: opt.id });
        return;
      }
      const r = RUNS.find((x) => x.name === label);
      if (r) patchDraft({ runId: r.id });
    },
    [patchDraft, runOpts],
  );

  const setProtectionById = useCallback(
    (label: string) => {
      patchDraft({ protectionId: label === '(none)' ? undefined : label });
    },
    [patchDraft],
  );

  const setCoverageByName = useCallback(
    (label: string) => {
      if (side === 'def') {
        if (label === '(none)') {
          patchDefDraft({ coverageId: undefined });
          return;
        }
        const c = COVERAGES.find((x) => x.name === label);
        if (c) patchDefDraft({ coverageId: c.id });
        return;
      }
      if (label === '(none)') {
        patchDraft({ coverageId: undefined });
        return;
      }
      const c = COVERAGES.find((x) => x.name === label);
      if (c) patchDraft({ coverageId: c.id });
    },
    [patchDraft, patchDefDraft, side],
  );

  const setFrontByName = useCallback(
    (label: string) => {
      const f = FRONTS.find((x) => x.name === label);
      if (!f) return;
      if (side === 'def') {
        patchDefDraft({ frontId: f.id, shift: f.shift });
      } else {
        patchDraft({ frontId: f.id });
      }
    },
    [patchDraft, patchDefDraft, side],
  );

  const setPressureByName = useCallback(
    (label: string) => {
      if (label === '(none)' || label === 'Base') {
        patchDefDraft({ pressureId: 'base' });
        return;
      }
      const p = PRESSURES.find((x) => x.name === label);
      if (p) patchDefDraft({ pressureId: p.id });
    },
    [patchDefDraft],
  );

  const setVsPlaycall = useCallback(
    (vsPlaycall: string) => {
      patchDefDraft({ vsPlaycall: vsPlaycall.trim() || undefined });
    },
    [patchDefDraft],
  );

  const setStrength = useCallback(
    (strength: Strength) => {
      patchDraft({ strength });
    },
    [patchDraft],
  );

  const setRouteDigits = useCallback(
    (digits: string) => {
      patchDraft({ routeDigits: digits.trim() || undefined });
    },
    [patchDraft],
  );

  /** One player in motion per play; setting a new one replaces the old. */
  const setMotion = useCallback(
    (slot: string, motionId: string | undefined) => {
      patchDraft({ motion: motionId ? { slot, motionId } : undefined });
    },
    [patchDraft],
  );

  const setRunIsFake = useCallback(
    (runIsFake: boolean) => {
      patchDraft({ runIsFake });
    },
    [patchDraft],
  );

  return {
    side,
    setSide,
    defDraft,
    draft,
    playcall,
    setPlaycallText,
    parseError,
    parseWarnings,
    name,
    setName,
    nameDirty,
    systemIds,
    setSystemIds,
    toggleSystem,
    systemOptions,
    customLexicon,
    addCustomAlias,
    addCustomAliasFromLabel,
    notes,
    setNotes: (v: string) => {
      setNotes(v);
      setSaved(false);
    },
    coachingPoint,
    setCoachingPoint: (v: string) => {
      setCoachingPoint(v);
      setSaved(false);
    },
    formationLabel,
    setFormationByName,
    formationOptions,
    strength: draft.strength,
    setStrength,
    modifiers: draft.modifiers,
    toggleModifier,
    motion: draft.motion,
    setMotion,
    runLabel,
    setRunByName,
    runOptions,
    runIsFake: draft.runIsFake,
    setRunIsFake,
    routeDigits: draft.routeDigits ?? '',
    setRouteDigits,
    protectionLabel,
    setProtectionById,
    protectionOptions,
    conceptLabel,
    setConceptByName,
    conceptOptions,
    tags: draft.tags,
    addTag,
    removeTag,
    coverageLabel,
    setCoverageByName,
    coverageOptions,
    frontLabel,
    setFrontByName,
    frontOptions,
    pressureLabel,
    setPressureByName,
    pressureOptions,
    vsPlaycall: defDraft.vsPlaycall ?? '',
    setVsPlaycall,
    selectedSlot,
    selectPlayer,
    selectedPlayer,
    selectedRole,
    assignmentChoices,
    choiceUsesDepth,
    assignments,
    routesVisible,
    setRoutesVisible,
    saved,
    setSaved,
    draftRoute,
    setDraftRoute,
    draftDepth,
    setDraftDepth,
    applyAssignment,
    applyAssignmentFor,
    clearAssignment,
    resetAssignment,
    selectedOverride,
    scene,
    reset,
    loadPlay,
    editingPlayId,
    setEditingPlayId,
    bookId,
    setBookId,
    collectionIds,
    setCollectionIds,
  };
}

export type BuilderState = ReturnType<typeof useBuilderState>;
