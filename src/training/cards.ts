import { FORMATIONS } from '@/src/data/formations';
import { ROUTES } from '@/src/data/routes';
import { COVERAGES } from '@/src/data/coverages';
import { ZONES } from '@/src/data/zones';
import { RUNS } from '@/src/data/runs';
import { FRONTS } from '@/src/data/fronts';
import { PRESSURES } from '@/src/data/pressures';
import { CONCEPTS } from '@/src/data/concepts';
import { PERSONNEL, sceneForPersonnel } from '@/src/data/personnel';
import { factsForTopic } from '@/src/data/quizFacts';
import { buildPlay, buildDefense, parsePlaycall } from '@/src/core/parser';
import type { Collection, FlashCard, Playbook, PlaybookPlay, TrainingTopic } from './types';
import {
  colorKeyForPosition,
  type Player,
  type PlayScene,
  type SlotId,
} from '@/src/core/schema';

function pickDistractors(correct: string, pool: string[], count = 3): string[] {
  const others = pool.filter((p) => p.toLowerCase() !== correct.toLowerCase());
  const shuffled = [...others].sort((a, b) => a.localeCompare(b));
  const offset = correct.length % Math.max(shuffled.length, 1);
  const rotated = [...shuffled.slice(offset), ...shuffled.slice(0, offset)];
  return rotated.slice(0, count);
}

export type CardContext = {
  /** Plays to prefer for play-calls / formation drills (usually active install). */
  plays?: PlaybookPlay[];
  /** When set, formation cards prioritize formations appearing in these plays. */
  preferInstallFormations?: boolean;
};

/** Plays in a book, or only those in a collection (missing ids skipped). */
export function playsForScope(
  book: Playbook | undefined | null,
  collectionId?: string | null,
): PlaybookPlay[] {
  if (!book?.plays?.length) return [];
  if (!collectionId) return book.plays;
  const col = book.collections?.find((c) => c.id === collectionId);
  if (!col?.playIds?.length) return [];
  const byId = new Map(book.plays.map((p) => [p.id, p]));
  return col.playIds.map((id) => byId.get(id)).filter((p): p is PlaybookPlay => !!p);
}

/** Plays in the active collection, or all plays if none active / empty. */
export function playsForLearn(book: Playbook | undefined | null): PlaybookPlay[] {
  if (!book?.plays?.length) return [];
  const active = book.collections?.find((c) => c.isActive);
  if (active?.playIds?.length) {
    const fromInstall = playsForScope(book, active.id);
    if (fromInstall.length) return fromInstall;
  }
  return book.plays;
}

export function activeCollection(book: Playbook | undefined | null): Collection | undefined {
  return book?.collections?.find((c) => c.isActive);
}

export function generateCards(topic: TrainingTopic, ctx?: CardContext): FlashCard[] {
  switch (topic) {
    case 'personnel':
      return personnelCards();
    case 'formations':
      return formationCards(ctx);
    case 'play-calls':
      return playcallCards(ctx);
    case 'running-routes':
      return runningRouteCards();
    case 'passing-routes':
      return passingRouteCards();
    case 'zones':
      return zoneCards();
    case 'coverages':
      return coverageCards();
    case 'field-positions':
      return fieldPositionCards();
    case 'fronts':
      return frontCards();
    case 'pressures':
      return pressureCards();
    case 'defender-assignments':
      return defenderAssignmentCards();
    case 'coverage-reads':
      return coverageReadCards();
    default:
      return [];
  }
}

/** Cards for Learn / quiz driven by a playbook's active install. */
export function cardsForLearn(book: Playbook | undefined | null, topic?: TrainingTopic): FlashCard[] {
  const plays = playsForLearn(book);
  const ctx: CardContext = { plays, preferInstallFormations: true };
  if (topic) return generateCards(topic, ctx);
  return [
    ...generateCards('play-calls', ctx),
    ...generateCards('formations', ctx),
  ];
}

function factCards(topic: TrainingTopic): FlashCard[] {
  return factsForTopic(topic).map((fact) => ({
    id: `fact-${fact.id}`,
    topic: fact.topic,
    type: fact.type,
    prompt: fact.prompt,
    answer: fact.answer,
    distractors: fact.distractors,
    explain: fact.explain,
    group: fact.group ?? fact.id,
    hideTitle: true,
  }));
}

function personnelCards(): FlashCard[] {
  const codes = PERSONNEL.map((p) => p.code);
  const cards: FlashCard[] = [];
  for (const pkg of PERSONNEL) {
    const scene = sceneForPersonnel(pkg);
    const explain = pkg.description;
    cards.push({
      id: `personnel-${pkg.code}`,
      topic: 'personnel',
      type: 'name-personnel',
      prompt: 'What personnel grouping is this?',
      answer: pkg.code,
      distractors: pickDistractors(pkg.code, codes),
      distractorPool: codes,
      scene,
      explain,
      group: pkg.code,
      hideTitle: true,
      resolveOptions: { includeDefense: false },
    });
    cards.push({
      id: `personnel-count-${pkg.code}`,
      topic: 'personnel',
      type: 'name-personnel',
      prompt: `Which grouping is ${pkg.backs} RB / ${pkg.tightEnds} TE?`,
      answer: pkg.code,
      distractors: pickDistractors(pkg.code, codes),
      distractorPool: codes,
      scene,
      explain,
      group: pkg.code,
      hideTitle: true,
      resolveOptions: { includeDefense: false },
    });
  }
  return [...cards, ...factCards('personnel')];
}

function sceneFromFormation(formationId: string, title: string): PlayScene {
  const f = FORMATIONS.find((x) => x.id === formationId)!;
  const players: Player[] = Object.entries(f.slots).map(([slot, s]) => ({
    id: `off-${slot}`,
    slot: slot as SlotId,
    position: s.position,
    label: s.label ?? s.position,
    x: s.x,
    y: s.y,
    side: 'off',
    colorKey: s.colorKey ?? colorKeyForPosition(s.position),
  }));
  return {
    title,
    players,
    arrows: [],
    zones: [],
    annotations: [],
    gapLabels: [],
  };
}

function formationIdsFromPlays(plays: PlaybookPlay[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const p of plays) {
    try {
      const ast = parsePlaycall(p.playcall);
      if (!seen.has(ast.formationId)) {
        seen.add(ast.formationId);
        ids.push(ast.formationId);
      }
    } catch {
      /* skip unparseable */
    }
  }
  return ids;
}

function formationCards(ctx?: CardContext): FlashCard[] {
  let list = FORMATIONS;
  if (ctx?.preferInstallFormations && ctx.plays?.length) {
    const installIds = formationIdsFromPlays(ctx.plays);
    const preferred = installIds
      .map((id) => FORMATIONS.find((f) => f.id === id))
      .filter((f): f is (typeof FORMATIONS)[number] => !!f);
    const rest = FORMATIONS.filter((f) => !installIds.includes(f.id));
    list = preferred.length ? [...preferred, ...rest] : FORMATIONS;
  }
  const names = list.map((f) => f.name);
  const cards: FlashCard[] = [];
  for (const f of list) {
    const scene = sceneFromFormation(f.id, '');
    const explain =
      f.description ??
      `${f.name}${f.tags?.length ? ` — ${f.tags.slice(0, 3).join(', ')}` : ''}.`;
    cards.push({
      id: `formation-${f.id}`,
      topic: 'formations',
      type: 'name-formation',
      prompt: 'Name this formation',
      answer: f.name,
      distractors: pickDistractors(f.name, names),
      distractorPool: names,
      scene,
      explain,
      group: f.id,
      hideTitle: true,
      resolveOptions: { includeDefense: false },
    });
  }
  return [...cards, ...factCards('formations')];
}

function playcallCards(ctx?: CardContext): FlashCard[] {
  if (ctx?.plays?.length) {
    return cardsFromPlaybook(ctx.plays);
  }
  // Fallback dictionary samples (west-coast friendly) when no book loaded yet
  const fallback = [
    { id: 'sample-spacing', name: 'Spacing', playcall: 'Gun Doubles Right 62 Spacing' },
    { id: 'sample-mesh', name: 'Mesh', playcall: 'Gun Bunch Right 62 Mesh' },
    { id: 'sample-boot', name: 'PA Boot', playcall: 'Gun Doubles Tight Right Fake Wide Zone Boot' },
    { id: 'sample-dagger', name: 'Dagger', playcall: 'Gun Doubles Right 62 Dagger' },
    { id: 'sample-wz', name: 'Wide Zone Rt', playcall: 'Gun Doubles Right Wide Zone' },
  ];
  return cardsFromPlaybook(fallback);
}

function runningRouteCards(): FlashCard[] {
  const names = RUNS.map((r) => r.name);
  const cards: FlashCard[] = [];
  for (const r of RUNS) {
    const playcall = `Gun Doubles Right Fake ${r.name}`;
    let scene: PlayScene;
    try {
      scene = buildPlay(playcall, { includeDefense: false });
    } catch {
      try {
        scene = buildPlay(`I Right Fake ${r.name}`, { includeDefense: false });
      } catch {
        scene = buildPlay('Gun Doubles Right Wide Zone', { includeDefense: false });
      }
    }
    const explain =
      r.description ??
      `${r.name} attacks hole ${r.hole}${r.bestVs ? ` — best vs ${r.bestVs}` : ''}.`;
    cards.push({
      id: `run-${r.id}`,
      topic: 'running-routes',
      type: 'name-route',
      prompt: 'What run concept is this?',
      answer: r.name,
      distractors: pickDistractors(r.name, names),
      distractorPool: names,
      playcall,
      scene: { ...scene, title: '' },
      explain,
      group: r.id,
      hideTitle: true,
      resolveOptions: { includeDefense: false },
    });
    cards.push({
      id: `run-hole-${r.id}`,
      topic: 'running-routes',
      type: 'name-route',
      prompt: `Which hole does ${r.name} primarily attack?`,
      answer: String(r.hole),
      distractors: pickDistractors(String(r.hole), ['2', '4', '6', '8']),
      scene: { ...scene, title: '' },
      explain,
      group: r.id,
      hideTitle: true,
      resolveOptions: { includeDefense: false },
    });
  }
  return [...cards, ...factCards('running-routes')];
}

function passingRouteCards(): FlashCard[] {
  const cards: FlashCard[] = [];
  const numbered = ROUTES.filter((r) => r.number != null);
  const numberedNames = numbered.map((r) => r.name);
  for (const r of numbered) {
    const playcall = `I Right ${r.number}${r.number}${r.number}`;
    let scene: PlayScene;
    try {
      scene = buildPlay(playcall, { includeDefense: false });
    } catch {
      scene = buildPlay('I Right 888', { includeDefense: false });
    }
    if (scene.arrows[0]) scene.arrows[0].highlight = true;
    cards.push({
      id: `route-${r.id}`,
      topic: 'passing-routes',
      type: 'name-route',
      prompt: `What route is this? (Tree #${r.number})`,
      answer: r.name,
      distractors: pickDistractors(r.name, numberedNames),
      distractorPool: numberedNames,
      playcall,
      scene: { ...scene, title: '' },
      explain: r.coachingPoint ?? `${r.name} is tree number ${r.number}.`,
      group: r.id,
      hideTitle: true,
      highlightArrowId: scene.arrows[0]?.id,
      resolveOptions: { includeDefense: false },
    });
  }

  // Concept identification + primary-read variants
  const conceptNames = CONCEPTS.map((c) => c.name);
  for (const concept of CONCEPTS) {
    const playcall = `Gun Doubles Right 62 ${concept.name}`;
    let scene: PlayScene | undefined;
    try {
      scene = buildPlay(playcall, { includeDefense: false });
    } catch {
      scene = undefined;
    }
    const explain =
      concept.description ?? `${concept.name} — ${concept.primaryRead ?? 'concept family'}.`;
    cards.push({
      id: `concept-${concept.id}`,
      topic: 'passing-routes',
      type: 'name-route',
      prompt: 'Name this pass concept',
      answer: concept.name,
      distractors: pickDistractors(concept.name, conceptNames),
      distractorPool: conceptNames,
      playcall,
      scene: scene ? { ...scene, title: '' } : undefined,
      explain,
      group: concept.id,
      hideTitle: true,
      resolveOptions: { includeDefense: false },
    });
    if (concept.primaryRead) {
      const reads = CONCEPTS.map((c) => c.primaryRead!).filter(Boolean);
      cards.push({
        id: `concept-read-${concept.id}`,
        topic: 'passing-routes',
        type: 'name-route',
        prompt: `What is the primary read on ${concept.name}?`,
        answer: concept.primaryRead,
        distractors: pickDistractors(concept.primaryRead, reads),
        playcall,
        scene: scene ? { ...scene, title: '' } : undefined,
        explain,
        group: concept.id,
        hideTitle: true,
        resolveOptions: { includeDefense: false },
      });
    }
  }
  return [...cards, ...factCards('passing-routes')];
}

/** Coverage shell that actually paints this zone on the field. */
function coverageIdForZone(zoneId: string): string {
  if (zoneId.startsWith('deep-third')) return 'cover-3';
  if (zoneId.startsWith('deep-half') || zoneId.startsWith('flat')) return 'cover-2';
  if (zoneId.startsWith('deep-quarter')) return 'cover-4';
  if (zoneId.startsWith('curl')) return 'tampa-2';
  if (zoneId === 'hook-middle') return 'cover-2';
  return 'cover-3';
}

/** Isolate one zone for identification drills (no label spoilers). */
function sceneForZoneHighlight(zoneId: string, coverageId: string): PlayScene | undefined {
  const coverage = COVERAGES.find((c) => c.id === coverageId);
  if (!coverage) return undefined;
  try {
    const scene = buildDefense(`4-3 ${coverage.name}`, {
      vsPlaycall: 'Gun Doubles Right 62 Slant-Flat',
    });
    const target = scene.zones.find((z) => z.id === zoneId);
    if (!target) return undefined;
    return {
      ...scene,
      title: '',
      // Drop route/blitz clutter — the zone is the question.
      arrows: [],
      annotations: [],
      zones: [
        {
          ...target,
          label: '',
          highlight: true,
          color: 'rgba(201,242,91,0.42)',
        },
      ],
    };
  } catch {
    return undefined;
  }
}

function zoneRevealScene(zoneId: string, coverageId: string): PlayScene | undefined {
  const coverage = COVERAGES.find((c) => c.id === coverageId);
  if (!coverage) return undefined;
  try {
    const scene = buildDefense(`4-3 ${coverage.name}`, {
      vsPlaycall: 'Gun Doubles Right 62 Slant-Flat',
    });
    return {
      ...scene,
      title: '',
      arrows: [],
      annotations: [],
      zones: scene.zones.map((z) =>
        z.id === zoneId
          ? { ...z, highlight: true, color: 'rgba(201,242,91,0.42)' }
          : { ...z, color: 'rgba(255,255,255,0.12)' },
      ),
    };
  } catch {
    return undefined;
  }
}

function zoneCards(): FlashCard[] {
  const uniqueLabels = [...new Set(ZONES.map((z) => z.label))];
  const ownerLabels = [
    ...new Set(ZONES.map((z) => z.owner).filter((o): o is string => !!o)),
  ].map((o) => o.toUpperCase());
  const cards: FlashCard[] = [];

  for (const z of ZONES) {
    const coverageId = coverageIdForZone(z.id);
    const coverage = COVERAGES.find((c) => c.id === coverageId);
    const scene = sceneForZoneHighlight(z.id, coverageId);
    if (!scene) continue;
    const reveal = zoneRevealScene(z.id, coverageId);
    const explain = `${z.label} — owned by ${z.owner?.toUpperCase() ?? 'the secondary'} in ${coverage?.name ?? 'this shell'}.`;
    cards.push({
      id: `zone-${z.id}`,
      topic: 'zones',
      type: 'name-zone',
      prompt: 'What zone is highlighted?',
      answer: z.label,
      distractors: pickDistractors(z.label, uniqueLabels),
      distractorPool: uniqueLabels,
      playcall: `4-3 ${coverage?.name ?? 'Cover 3'}`,
      scene,
      revealScene: reveal,
      explain,
      group: z.label,
      hideTitle: true,
      highlightZoneId: z.id,
      resolveOptions: {
        coverageId,
        frontId: '4-3',
        includeDefense: true,
        highlightZoneId: z.id,
      },
    });
    if (z.owner) {
      cards.push({
        id: `zone-owner-${z.id}`,
        topic: 'zones',
        type: 'name-zone',
        prompt: `Who owns the highlighted ${z.label} in ${coverage?.name ?? 'this coverage'}?`,
        answer: z.owner.toUpperCase(),
        distractors: pickDistractors(z.owner.toUpperCase(), ownerLabels),
        scene,
        revealScene: reveal,
        explain,
        group: z.label,
        hideTitle: true,
        highlightZoneId: z.id,
        resolveOptions: {
          coverageId,
          frontId: '4-3',
          includeDefense: true,
          highlightZoneId: z.id,
        },
      });
    }
  }
  return cards;
}

function coverageCards(): FlashCard[] {
  const names = COVERAGES.map((c) => c.name);
  const shells = [...new Set(COVERAGES.map((c) => c.shell))];
  const cards: FlashCard[] = [];
  for (const c of COVERAGES) {
    let scene: PlayScene | undefined;
    try {
      scene = buildDefense(`4-3 ${c.name}`, {
        vsPlaycall: 'Gun Doubles Right 62 Slant-Flat',
      });
      scene = { ...scene, title: '', arrows: [] };
    } catch {
      scene = undefined;
    }
    const explain =
      c.description ??
      c.presnapKeys ??
      `${c.name} is a ${c.shell} shell.`;
    cards.push({
      id: `coverage-${c.id}`,
      topic: 'coverages',
      type: 'name-coverage',
      prompt: 'Name this coverage',
      answer: c.name,
      distractors: pickDistractors(c.name, names),
      distractorPool: names,
      playcall: `4-3 ${c.name}`,
      scene,
      explain: [c.description, c.presnapKeys, c.rotation].filter(Boolean).join(' '),
      group: c.id,
      hideTitle: true,
      resolveOptions: { coverageId: c.id, frontId: '4-3', includeDefense: true },
    });
    if (c.presnapKeys) {
      cards.push({
        id: `coverage-shell-${c.id}`,
        topic: 'coverages',
        type: 'name-coverage',
        prompt: `From the shell, is ${c.name} man, zone, or match?`,
        answer: c.shell,
        distractors: pickDistractors(c.shell, shells),
        scene,
        explain,
        group: c.id,
        hideTitle: true,
        resolveOptions: { coverageId: c.id, frontId: '4-3', includeDefense: true },
      });
    }
  }
  return [...cards, ...factCards('coverages')];
}

function frontCards(): FlashCard[] {
  const names = FRONTS.map((f) => f.name);
  const cards: FlashCard[] = [];
  for (const f of FRONTS) {
    let scene: PlayScene | undefined;
    try {
      scene = buildDefense(`${f.name} Cover 3`, {
        vsPlaycall: 'Gun Doubles Right 62 Slant-Flat',
      });
    } catch {
      scene = undefined;
    }
    const explain = f.description ?? `${f.name} front${f.shift ? ` (${f.shift} shift)` : ''}.`;
    cards.push({
      id: `front-${f.id}`,
      topic: 'fronts',
      type: 'name-front',
      prompt: 'Name this front',
      answer: f.name,
      distractors: pickDistractors(f.name, names),
      distractorPool: names,
      playcall: `${f.name} Cover 3`,
      scene: scene ? { ...scene, title: '', arrows: [] } : undefined,
      explain,
      group: f.id,
      hideTitle: true,
      resolveOptions: { frontId: f.id, coverageId: 'cover-3', includeDefense: true },
    });
    if (f.shift) {
      cards.push({
        id: `front-shift-${f.id}`,
        topic: 'fronts',
        type: 'name-front',
        prompt: `What shift tag does ${f.name} use?`,
        answer: f.shift,
        distractors: pickDistractors(f.shift, ['over', 'under', 'even', 'bear']),
        scene: scene ? { ...scene, title: '', arrows: [] } : undefined,
        explain,
        group: f.id,
        hideTitle: true,
        resolveOptions: { frontId: f.id, coverageId: 'cover-3', includeDefense: true },
      });
    }
  }
  return [...cards, ...factCards('fronts')];
}

function pressureCards(): FlashCard[] {
  const list = PRESSURES.filter((p) => p.id !== 'base');
  const names = list.map((p) => p.name);
  const cards: FlashCard[] = list.map((p) => {
    let scene: PlayScene | undefined;
    try {
      scene = buildDefense(`4-3 Cover 1 ${p.name}`, {
        vsPlaycall: 'Gun Doubles Right 62 Slant-Flat',
      });
    } catch {
      scene = undefined;
    }
    return {
      id: `pressure-${p.id}`,
      topic: 'pressures' as const,
      type: 'name-pressure' as const,
      prompt: 'Name this pressure',
      answer: p.name,
      distractors: pickDistractors(p.name, names),
      distractorPool: names,
      playcall: `4-3 Cover 1 ${p.name}`,
      scene: scene ? { ...scene, title: '' } : undefined,
      explain: p.description ?? `${p.name} pressure package.`,
      group: p.id,
      hideTitle: true,
      resolveOptions: { frontId: '4-3', coverageId: 'cover-1', includeDefense: true },
    };
  });
  return [...cards, ...factCards('pressures')];
}

function defenderAssignmentCards(): FlashCard[] {
  const cards: FlashCard[] = [];
  const pool = [
    ...new Set(
      COVERAGES.flatMap((cov) =>
        Object.values(cov.assignments ?? {}).map((a) => a.label ?? a.kind),
      ),
    ),
  ];
  for (const c of COVERAGES) {
    if (!c.assignments) continue;
    for (const [slot, assignment] of Object.entries(c.assignments)) {
      // Skip pure DL contain/rush noise that clutters every coverage
      if (assignment.kind === 'rush' && (slot.startsWith('de') || slot.startsWith('dt') || slot === 'nt')) {
        continue;
      }
      const answer = assignment.label ?? assignment.kind;
      let scene: PlayScene | undefined;
      try {
        scene = buildDefense(`4-3 ${c.name}`, {
          vsPlaycall: 'Gun Doubles Right 62 Slant-Flat',
        });
        const player = scene.players.find((p) => p.slot === slot && p.side === 'def');
        if (player) player.highlight = true;
        scene = { ...scene, title: '', arrows: [] };
      } catch {
        scene = undefined;
      }
      const explain =
        c.description ??
        `In ${c.name}, the highlighted defender's job is ${answer}.`;
      cards.push({
        id: `assign-${c.id}-${slot}`,
        topic: 'defender-assignments',
        type: 'name-assignment',
        prompt: `What is the highlighted defender's job in ${c.name}?`,
        answer,
        distractors: pickDistractors(answer, pool),
        distractorPool: pool,
        playcall: `4-3 ${c.name}`,
        scene,
        explain,
        group: c.id,
        hideTitle: true,
        highlightPlayerId: scene?.players.find((p) => p.slot === slot && p.side === 'def')?.id,
        resolveOptions: { coverageId: c.id, frontId: '4-3', includeDefense: true },
      });
    }
  }
  return cards;
}

/** Defense shell for coverage-read prompts (zones on, concept routes off). */
function sceneForCoverageShell(coverageId: string): PlayScene | undefined {
  const coverage = COVERAGES.find((c) => c.id === coverageId);
  if (!coverage) return undefined;
  try {
    const scene = buildDefense(`4-3 ${coverage.name}`, {
      vsPlaycall: 'Gun Doubles Right 62 Slant-Flat',
    });
    return {
      ...scene,
      title: '',
      arrows: [],
      annotations: [],
    };
  } catch {
    return undefined;
  }
}

function revealConceptVsCoverage(coverageId: string, conceptName: string): PlayScene | undefined {
  try {
    const scene = buildPlay(`Gun Doubles Right 62 ${conceptName}`, {
      includeDefense: true,
      coverageId,
      frontId: '4-3',
    });
    return { ...scene, title: '' };
  } catch {
    return undefined;
  }
}

function coverageReadCards(): FlashCard[] {
  const cards: FlashCard[] = [];
  const conceptNames = CONCEPTS.map((c) => c.name);
  const coverageNames = COVERAGES.map((c) => c.name);
  const allWhys = COVERAGES.flatMap((c) => (c.weakTo ?? []).map((w) => w.why));

  for (const cov of COVERAGES) {
    const shell = sceneForCoverageShell(cov.id);

    for (const weak of cov.weakTo ?? []) {
      const concept = CONCEPTS.find((c) => c.id === weak.conceptId);
      if (!concept) continue;
      const reveal = revealConceptVsCoverage(cov.id, concept.name);

      cards.push({
        id: `read-${cov.id}-${weak.conceptId}`,
        topic: 'coverage-reads',
        type: 'beat-coverage',
        prompt: `Which concept beats ${cov.name}?`,
        answer: concept.name,
        distractors: pickDistractors(concept.name, conceptNames),
        distractorPool: conceptNames,
        playcall: `4-3 ${cov.name}`,
        scene: shell,
        revealScene: reveal,
        explain: weak.why,
        group: cov.id,
        hideTitle: true,
        resolveOptions: { coverageId: cov.id, frontId: '4-3', includeDefense: true },
      });

      cards.push({
        id: `read-vs-${weak.conceptId}-${cov.id}`,
        topic: 'coverage-reads',
        type: 'beat-coverage',
        prompt: `${concept.name} is a classic answer vs which coverage?`,
        answer: cov.name,
        distractors: pickDistractors(cov.name, coverageNames),
        distractorPool: coverageNames,
        playcall: `4-3 ${cov.name}`,
        scene: shell,
        revealScene: reveal,
        explain: weak.why,
        group: cov.id,
        hideTitle: true,
        resolveOptions: { coverageId: cov.id, frontId: '4-3', includeDefense: true },
      });

      cards.push({
        id: `read-why-${cov.id}-${weak.conceptId}`,
        topic: 'coverage-reads',
        type: 'beat-coverage',
        prompt: `Why does ${concept.name} beat ${cov.name}?`,
        answer: weak.why,
        distractors: pickDistractors(weak.why, allWhys),
        playcall: `4-3 ${cov.name}`,
        scene: shell,
        revealScene: reveal,
        explain: weak.why,
        group: cov.id,
        hideTitle: true,
        resolveOptions: { coverageId: cov.id, frontId: '4-3', includeDefense: true },
      });
    }
  }

  return cards.filter((c) => (c.distractors?.length ?? 0) >= 1);
}

function fieldPositionCards(): FlashCard[] {
  return [
    {
      id: 'field-gap-4',
      topic: 'field-positions',
      type: 'name-gap',
      prompt: 'Which gap is between C and RG (strength right)?',
      answer: '4',
      distractors: ['2', '6', '8'],
      playcall: 'I Right Slot Fake 24 Lead 68',
      hideTitle: true,
      resolveOptions: { includeDefense: false },
    },
    {
      id: 'field-gap-6',
      topic: 'field-positions',
      type: 'name-gap',
      prompt: 'Which gap is between RG and RT?',
      answer: '6',
      distractors: ['4', '8', '2'],
      playcall: 'I Right 68',
      hideTitle: true,
      resolveOptions: { includeDefense: false },
    },
    {
      id: 'field-gap-8',
      topic: 'field-positions',
      type: 'name-gap',
      prompt: 'Which gap is outside the RT (TE side)?',
      answer: '8',
      distractors: ['4', '6', '9'],
      playcall: 'I Right 68',
      hideTitle: true,
      resolveOptions: { includeDefense: false },
    },
  ];
}

export function getCardScene(card: FlashCard) {
  if (card.scene) return card.scene;
  const zoneId = card.highlightZoneId ?? card.resolveOptions?.highlightZoneId;
  if (card.topic === 'zones' && zoneId) {
    const coverageId = card.resolveOptions?.coverageId ?? coverageIdForZone(zoneId);
    const highlighted = sceneForZoneHighlight(zoneId, coverageId);
    if (highlighted) return highlighted;
  }
  if (card.playcall) {
    const isDefenseTopic =
      card.topic === 'fronts' ||
      card.topic === 'pressures' ||
      card.topic === 'defender-assignments' ||
      card.topic === 'coverage-reads' ||
      card.topic === 'zones';
    try {
      if (isDefenseTopic) {
        const scene = buildDefense(card.playcall, {
          vsPlaycall: 'Gun Doubles Right 62 Slant-Flat',
        });
        if (card.topic === 'coverage-reads') {
          return { ...scene, title: '', arrows: [], annotations: [] };
        }
        return scene;
      }
      return buildPlay(card.playcall, {
        includeDefense: card.resolveOptions?.includeDefense ?? false,
        coverageId: card.resolveOptions?.coverageId,
        frontId: card.resolveOptions?.frontId,
      });
    } catch {
      /* fall through */
    }
  }
  return buildPlay('Gun Doubles Right Wide Zone', { includeDefense: false });
}

/**
 * Identify-the-play cards from saved plays.
 * Diagram → display name (answer is the teaching name, not the raw call).
 */
export function cardsFromPlaybook(
  plays: { id: string; name: string; playcall: string; concept?: string; coachingPoint?: string }[],
): FlashCard[] {
  if (plays.length === 0) return [];
  const names = plays.map((p) => p.name);
  return plays.map((p) => ({
    id: `playbook-${p.id}`,
    topic: 'play-calls' as const,
    type: 'match-playcall' as const,
    prompt: 'Name this play',
    answer: p.name,
    distractors: pickDistractors(p.name, names),
    distractorPool: names,
    playcall: p.playcall,
    explain: p.coachingPoint ?? (p.concept ? `${p.name} — ${p.concept} family.` : undefined),
    group: p.concept ?? p.id,
    hideTitle: true,
  }));
}
