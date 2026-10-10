import { parsePlaycall } from '@/src/core/parser';
import {
  composePlaycall,
  defaultPlaycallDraft,
  draftFromAst,
  type PlaycallDraft,
} from '@/src/features/builder/composePlaycall';

function roundTrip(call: string, overlays?: Partial<PlaycallDraft>) {
  const ast = parsePlaycall(call);
  const draft = draftFromAst(ast, {
    coverageId: overlays?.coverageId ?? ast.coverageId,
    frontId: overlays?.frontId ?? ast.frontId,
    includeDefenseInCall: overlays?.includeDefenseInCall ?? false,
  });
  return { ast, draft, composed: composePlaycall(draft) };
}

describe('composePlaycall', () => {
  it('composes the default slant-flat call', () => {
    expect(composePlaycall(defaultPlaycallDraft())).toBe('Gun Doubles Right 62 Slant-Flat');
  });

  it('composes Ace Twins Right 62 Slant-Flat golden', () => {
    const { composed, draft } = roundTrip('Ace Twins Right 62 Slant-Flat');
    expect(draft.formationId).toBe('ace-twins');
    expect(draft.strength).toBe('right');
    expect(draft.protectionId).toBe('62');
    expect(draft.conceptId).toBe('slant-flat');
    expect(composed).toBe('Ace Twins Right 62 Slant-Flat');
  });

  it('composes I Right 999 Y-Pop golden', () => {
    const { composed, draft, ast } = roundTrip('I Right 999 Y-Pop');
    expect(draft.formationId).toBe('i');
    expect(draft.routeDigits).toBe('999');
    expect(ast.tags.some((t) => t.slot === 'y')).toBe(true);
    const again = parsePlaycall(composed);
    expect(again.formationId).toBe('i');
    expect(again.routeDigits).toBe('999');
    expect(again.tags.some((t) => t.slot === 'y')).toBe(true);
  });

  it('composes I Right Slot Fake 24 Lead 989 F Angle 68', () => {
    const { composed, draft } = roundTrip('I Right Slot Fake 24 Lead 989 F Angle 68');
    expect(draft.modifiers.map((m) => m.toLowerCase())).toContain('slot');
    expect(draft.runId).toBe('24-lead');
    expect(draft.runIsFake).toBe(true);
    expect(draft.routeDigits).toBe('989');
    expect(draft.protectionId).toBe('68');
    const again = parsePlaycall(composed);
    expect(again.run?.runId).toBe('24-lead');
    expect(again.run?.isFake).toBe(true);
    expect(again.routeDigits).toBe('989');
    expect(again.protectionId).toBe('68');
  });

  it('keeps coverage as a resolve overlay without writing it into the call by default', () => {
    const draft: PlaycallDraft = {
      ...defaultPlaycallDraft(),
      formationId: 'i',
      protectionId: undefined,
      conceptId: undefined,
      routeDigits: '888',
      strength: 'left',
      coverageId: 'cover-3',
      includeDefenseInCall: false,
    };
    expect(composePlaycall(draft)).toBe('I Left 888');
    draft.includeDefenseInCall = true;
    expect(composePlaycall(draft)).toContain('Cover 3');
  });

  it('parse → compose stays stable for golden calls', () => {
    const goldens = [
      'Ace Twins Right 62 Slant-Flat',
      'I Right 999 Y-Pop',
      'Shotgun Right 979',
    ];
    for (const call of goldens) {
      const first = composePlaycall(draftFromAst(parsePlaycall(call)));
      const second = composePlaycall(draftFromAst(parsePlaycall(first)));
      expect(second).toBe(first);
    }
  });
});
