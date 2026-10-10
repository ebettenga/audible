import { FORMATIONS } from '@/src/data/formations';
import { ROUTES } from '@/src/data/routes';
import { COVERAGES } from '@/src/data/coverages';
import { ZONES } from '@/src/data/zones';
import { RUNS } from '@/src/data/runs';
import { FRONTS } from '@/src/data/fronts';
import { PRESSURES } from '@/src/data/pressures';
import { CONCEPTS } from '@/src/data/concepts';
import { PERSONNEL, sceneForPersonnel } from '@/src/data/personnel';
import { factsForTopic, type QuizFact } from '@/src/training/quizCache';
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

function tryBuildPlay(playcall: string, includeDefense = false): PlayScene | undefined {
  try {
    return { ...buildPlay(playcall, { includeDefense }), title: '' };
  } catch {
    return undefined;
  }
}

function tryBuildDefense(
  playcall: string,
  stripArrows = false,
  vsPlaycall = 'Gun Doubles Right 62 Slant-Flat',
): PlayScene | undefined {
  try {
    const scene = buildDefense(playcall, { vsPlaycall });
    return {
      ...scene,
      title: '',
      arrows: stripArrows ? [] : scene.arrows,
    };
  } catch {
    return undefined;
  }
}

/** Build the diagram shown on playbook identify-the-play cards. */
function sceneForPlaybookPlay(play: Pick<PlaybookPlay, 'playcall' | 'side' | 'vsPlaycall'>): PlayScene | undefined {
  if (play.side === 'def') {
    return tryBuildDefense(
      play.playcall,
      false,
      play.vsPlaycall ?? 'Gun Doubles Right 62 Slant-Flat',
    );
  }
  return tryBuildPlay(play.playcall, false);
}

function offensePlaysForPlayCalls(
  plays: { playcall: string; side?: PlaybookPlay['side'] }[],
): typeof plays {
  return plays.filter((p) => p.side !== 'def');
}

function sceneForRunName(runName: string): { playcall: string; scene: PlayScene } {
  const calls = [
    `Gun Doubles Right Fake ${runName}`,
    `I Right Fake ${runName}`,
    `I Tight Right Fake ${runName}`,
    `Shotgun Right Fake ${runName}`,
  ];
  for (const playcall of calls) {
    const scene = tryBuildPlay(playcall);
    if (scene) return { playcall, scene };
  }
  return {
    playcall: 'I Right',
    scene: tryBuildPlay('I Right') ?? sceneFromFormation('i', ''),
  };
}

function sceneForConceptName(
  conceptName: string,
  aliases: string[] = [],
): { playcall: string; scene?: PlayScene } {
  for (const token of [conceptName, ...aliases]) {
    const playcall = `Gun Doubles Right 62 ${token}`;
    const scene = tryBuildPlay(playcall);
    if (scene) return { playcall, scene };
  }
  return {
    playcall: `Gun Doubles Right 62 ${conceptName}`,
    scene: tryBuildPlay('Gun Doubles Right'),
  };
}

function fallbackSceneForTopic(topic: TrainingTopic): PlayScene {
  switch (topic) {
    case 'running-routes':
      return tryBuildPlay('I Right Fake Inside Zone') ?? fallbackSceneForTopic('formations');
    case 'passing-routes':
    case 'play-calls':
      return tryBuildPlay('Gun Doubles Right 62 Mesh') ?? fallbackSceneForTopic('formations');
    case 'fronts':
    case 'coverages':
    case 'pressures':
    case 'zones':
    case 'defender-assignments':
    case 'coverage-reads':
      return tryBuildDefense('4-3 Cover 3', true) ?? fallbackSceneForTopic('formations');
    default:
      return tryBuildPlay('Ace Twins Right') ?? {
        ...buildPlay('Ace Twins Right', { includeDefense: false }),
        title: '',
      };
  }
}

/** Formation / concept / front that matches the teaching fact, not a generic leftover play. */
function diagramForFact(fact: QuizFact): Pick<FlashCard, 'playcall' | 'scene' | 'resolveOptions'> {
  const group = fact.group ?? fact.id;

  if (fact.topic === 'formations') {
    const formationId =
      {
        't-formation': 'wishbone',
        'i-formation': 'i',
        ace: 'ace-twins',
        'pro-set': 'strong-i',
        shotgun: 'shotgun',
        pistol: 'pistol',
        spread: 'gun-trips',
        wildcat: 'shotgun',
        empty: 'gun-empty',
        jumbo: 'i-tight',
        purpose: 'ace-twins',
      }[group] ?? 'ace-twins';
    const formation = FORMATIONS.find((f) => f.id === formationId);
    return {
      playcall: `${formation?.name ?? 'Ace Twins'} Right`,
      scene: sceneFromFormation(formationId, ''),
      resolveOptions: { includeDefense: false },
    };
  }

  if (fact.topic === 'personnel') {
    const code =
      {
        '11': '11',
        '12': '12',
        '21': '21',
        '13': '13',
        '10': '10',
        '22': '22',
        '20': '20',
        '00': '00',
        code: '11',
        box: '11',
        labels: '11',
      }[group] ?? '11';
    const playcall =
      {
        '11': 'Gun Doubles Right',
        '12': 'Gun Trey Right',
        '21': 'I Right',
        '13': 'I Tight Right',
        '10': 'Doubles Flex Right',
        '22': 'I Tight Right',
        '20': 'I Slot Right',
        '00': 'Gun Empty Right',
        code: 'Gun Doubles Right',
        box: 'Gun Doubles Right',
        labels: 'Gun Doubles Right',
      }[group] ?? 'Gun Doubles Right';
    const pkg = PERSONNEL.find((p) => p.code === code) ?? PERSONNEL[0]!;
    return {
      playcall,
      scene: sceneForPersonnel(pkg),
      resolveOptions: { includeDefense: false },
    };
  }

  if (fact.topic === 'passing-routes') {
    const conceptName =
      {
        mesh: 'Mesh',
        levels: 'Levels',
        flood: 'Flood',
        smash: 'Smash',
        'y-cross': 'Y Cross',
        'four-verticals': 'Four Verticals',
        stick: 'Stick',
        drive: 'Drive',
        dagger: 'Dagger',
        'slant-flat': 'Slant-Flat',
        china: 'Smash',
        'shallow-cross': 'High Cross',
      }[group] ?? 'Mesh';
    const playcall = `Gun Doubles Right 62 ${conceptName}`;
    return {
      playcall,
      scene: tryBuildPlay(playcall),
      resolveOptions: { includeDefense: false },
    };
  }

  if (fact.topic === 'running-routes') {
    const playcall =
      {
        scheme: 'I Right Fake Inside Zone',
        gap: 'I Right Fake 24 Lead',
        gaps: 'I Right Fake 24 Lead',
        holes: 'I Right Fake 24 Lead',
        techniques: 'I Right Fake Inside Zone',
        'inside-zone': 'Gun Doubles Right Fake Inside Zone',
        'lead-dive': 'I Right Fake 22 Dive',
        iso: 'I Right Fake Iso',
        'man-dive': 'Ace Twins Right Fake 22 Dive',
        'split-zone': 'Gun Doubles Right Fake Split Zone',
        'zone-read': 'Shotgun Right Fake Inside Zone',
        'outside-zone': 'Gun Doubles Right Fake Wide Zone',
        'jet-zone': 'Gun Doubles Right Fake Jet Sweep',
        power: 'I Right Fake 26 Lead',
        counter: 'I Right Fake Counter',
        duo: 'I Tight Right Fake Duo',
        trap: 'I Right Fake Trap',
        wham: 'I Tight Right Fake Trap',
        'g-lead': 'I Right Fake 26 Lead',
        't-lead': 'I Tight Right Fake 26 Lead',
        dart: 'I Right Fake Counter',
        'speed-option': 'Shotgun Right Fake Speed Option',
      }[group] ?? 'I Right Fake Inside Zone';
    return {
      playcall,
      scene: tryBuildPlay(playcall) ?? tryBuildPlay('I Right Fake Inside Zone'),
      resolveOptions: { includeDefense: false },
    };
  }

  if (fact.topic === 'fronts') {
    const frontName =
      {
        '6-2': 'Bear',
        '5-3': 'Bear',
        '52-eagle': '4-3',
        '4-4': '3-3 Stack',
        '3-4': '3-4',
        '4-3': '4-3',
        bear: 'Bear',
        nickel: 'Nickel',
        dime: 'Dime',
      }[group] ?? '4-3';
    const playcall = `${frontName} Cover 3`;
    const front = FRONTS.find((f) => f.name === frontName);
    return {
      playcall,
      scene: tryBuildDefense(playcall, true),
      resolveOptions: { frontId: front?.id ?? '4-3', coverageId: 'cover-3', includeDefense: true },
    };
  }

  if (fact.topic === 'coverages') {
    const coverageName =
      {
        'cover-0': 'Cover 0',
        'cover-1': 'Cover 1',
        'cover-1-robber': 'Cover 1 Robber',
        'cover-2': 'Cover 2',
        'cover-2-man': '2-Man',
        'cover-2-buzz': 'Cover 2',
        'tampa-2': 'Tampa 2',
        'cover-3': 'Cover 3',
        'cover-3-cloud': 'Cover 3 Sky',
        'cover-3-buzz': 'Cover 3 Buzz',
        'cover-4': 'Cover 4',
        'cover-6': 'Cover 6',
      }[group] ?? 'Cover 3';
    const playcall = `4-3 ${coverageName}`;
    const coverage = COVERAGES.find((c) => c.name === coverageName);
    return {
      playcall,
      scene: tryBuildDefense(playcall, true),
      resolveOptions: { coverageId: coverage?.id ?? 'cover-3', frontId: '4-3', includeDefense: true },
    };
  }

  if (fact.topic === 'play-calls') {
    const candidates = [
      fact.playcall,
      {
        mesh: 'Gun Doubles Right 62 Mesh',
        dagger: 'Gun Doubles Right 62 Dagger',
        stick: 'Gun Doubles Right 62 Stick',
        'four-verticals': 'Gun Doubles Right 62 Four Verticals',
        'inside-zone': 'I Right Fake Inside Zone',
        'outside-zone': 'Gun Doubles Right Fake Wide Zone',
        power: 'I Right Fake 26 Lead',
        counter: 'I Right Fake Counter',
        'lead-dive': 'I Right Fake 24 Lead',
        boot: 'Gun Doubles Right 62 Boot',
        'zone-read': 'Shotgun Right Fake Inside Zone',
        protection: 'Gun Doubles Right 62 Spacing',
        personnel: 'Gun Doubles Right 62 Spacing',
        language: 'I Right Fake 24 Lead',
      }[group],
    ].filter((call): call is string => !!call);
    for (const playcall of candidates) {
      const scene = tryBuildPlay(playcall);
      if (scene) return { playcall, scene, resolveOptions: { includeDefense: false } };
    }
    return {
      playcall: 'Gun Doubles Right 62 Mesh',
      scene: fallbackSceneForTopic('play-calls'),
      resolveOptions: { includeDefense: false },
    };
  }

  if (fact.topic === 'pressures') {
    const pressureName =
      {
        simulated: 'Creeper',
        blitz: 'A-Gap Mug',
        'second-level': 'Cross Dog',
        labels: 'Base',
        protection: 'A-Gap Mug',
        perimeter: 'Corner Blitz',
        'fire-zone': 'Fire Zone',
        stunt: 'Twin Twist',
        zero: 'Zero',
      }[group] ?? 'Fire Zone';
    const playcall =
      pressureName === 'Base' ? '4-3 Cover 3' : `4-3 Cover 1 ${pressureName}`;
    return {
      playcall,
      scene: tryBuildDefense(playcall, pressureName === 'Base'),
      resolveOptions: {
        frontId: '4-3',
        coverageId: pressureName === 'Base' ? 'cover-3' : 'cover-1',
        includeDefense: true,
      },
    };
  }

  return {
    playcall: 'Ace Twins Right',
    scene: tryBuildPlay('Ace Twins Right'),
    resolveOptions: { includeDefense: false },
  };
}

function factCards(topic: TrainingTopic): FlashCard[] {
  return factsForTopic(topic).map((fact) => {
    const diagram = diagramForFact(fact);
    return {
      id: `fact-${fact.id}`,
      topic: fact.topic,
      type: fact.type,
      prompt: fact.prompt,
      answer: fact.answer,
      distractors: fact.distractors,
      explain: fact.explain,
      group: fact.group ?? fact.id,
      theme: fact.theme,
      hideTitle: true,
      playcall: diagram.playcall,
      scene: diagram.scene,
      resolveOptions: diagram.resolveOptions,
    };
  });
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
  const fallback = [
    { id: 'sample-spacing', name: 'Spacing', playcall: 'Gun Doubles Right 62 Spacing' },
    { id: 'sample-mesh', name: 'Mesh', playcall: 'Gun Bunch Right 62 Mesh' },
    { id: 'sample-boot', name: 'PA Boot', playcall: 'Gun Doubles Tight Right Fake Wide Zone Boot' },
    { id: 'sample-dagger', name: 'Dagger', playcall: 'Gun Doubles Right 62 Dagger' },
    { id: 'sample-wz', name: 'Wide Zone Rt', playcall: 'Gun Doubles Right Wide Zone' },
  ];
  const raw = ctx?.plays?.length ? ctx.plays : fallback;
  const plays = offensePlaysForPlayCalls(raw);
  return [...cardsFromPlaybook(plays), ...factCards('play-calls')];
}

/** Install / collection quiz: playbook plays plus transcript-backed run & pass literacy. */
export function cardsForInstallQuiz(
  book: Playbook | undefined | null,
  collectionId?: string | null,
): FlashCard[] {
  const plays = playsForScope(book, collectionId);
  const ctx: CardContext = { plays, preferInstallFormations: true };
  const topics: TrainingTopic[] = ['play-calls', 'running-routes', 'passing-routes'];
  return topics.flatMap((topic) => generateCards(topic, ctx));
}

function runningRouteCards(): FlashCard[] {
  const names = RUNS.map((r) => r.name);
  const cards: FlashCard[] = [];
  for (const r of RUNS) {
    const { playcall, scene } = sceneForRunName(r.name);
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
      scene,
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
    const { playcall, scene } = sceneForConceptName(concept.name, concept.aliases);
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
      scene,
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
        scene,
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
        scene = { ...scene, title: '' };
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
        highlightPlayerId: `def-${slot}`,
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

/** Strip ghost offense and unrelated arrows so pressure drills read at a glance. */
function sceneForPressureLearn(scene: PlayScene): PlayScene {
  const players = scene.players.filter((p) => !p.id.startsWith('ghost-'));
  const arrows = scene.arrows
    .filter((a) => !a.id.startsWith('ghost-'))
    .filter((a) => a.id.startsWith('def-rush') || a.id.startsWith('def-blitz'))
    .map((a) => ({ ...a, highlight: true }));
  return {
    ...scene,
    title: '',
    players,
    arrows,
    zones: [],
    annotations: [],
  };
}

/** One highlighted defender, one assignment arrow, no ghost offense or zone shell. */
function sceneForDefenderAssignmentLearn(scene: PlayScene, focusPlayerId?: string): PlayScene {
  const focusId =
    focusPlayerId ??
    scene.players.find((p) => p.side === 'def' && p.highlight)?.id;
  const players = scene.players
    .filter((p) => !p.id.startsWith('ghost-'))
    .map((p) => ({
      ...p,
      highlight: focusId ? p.id === focusId : !!p.highlight,
    }));
  const arrows =
    focusId == null
      ? []
      : scene.arrows
          .filter((a) => !a.id.startsWith('ghost-') && a.playerId === focusId)
          .map((a) => ({ ...a, highlight: true }));
  return {
    ...scene,
    title: '',
    players,
    arrows,
    zones: [],
    annotations: [],
    gapLabels: [],
  };
}

function finishLearnScene(card: FlashCard, scene: PlayScene): PlayScene {
  switch (card.topic) {
    case 'pressures':
      return sceneForPressureLearn(scene);
    case 'defender-assignments':
      return sceneForDefenderAssignmentLearn(scene, card.highlightPlayerId);
    default:
      return scene;
  }
}

export function getCardScene(card: FlashCard) {
  let scene: PlayScene | undefined = card.scene;
  if (!scene) {
    const zoneId = card.highlightZoneId ?? card.resolveOptions?.highlightZoneId;
    if (card.topic === 'zones' && zoneId) {
      const coverageId = card.resolveOptions?.coverageId ?? coverageIdForZone(zoneId);
      scene = sceneForZoneHighlight(zoneId, coverageId);
    }
  }
  if (!scene && card.playcall) {
    const isDefenseTopic =
      card.topic === 'fronts' ||
      card.topic === 'pressures' ||
      card.topic === 'defender-assignments' ||
      card.topic === 'coverage-reads' ||
      card.topic === 'zones';
    try {
      if (isDefenseTopic) {
        const built = buildDefense(card.playcall, {
          vsPlaycall: 'Gun Doubles Right 62 Slant-Flat',
        });
        if (card.topic === 'coverage-reads') {
          scene = { ...built, title: '', arrows: [], annotations: [] };
        } else {
          scene = built;
        }
      } else if (card.topic === 'play-calls' && card.type === 'match-playcall') {
        scene =
          tryBuildPlay(card.playcall, false) ??
          tryBuildDefense(
            card.playcall,
            false,
            card.resolveOptions?.vsPlaycall ?? 'Gun Doubles Right 62 Slant-Flat',
          );
      } else {
        scene = buildPlay(card.playcall, {
          includeDefense: card.resolveOptions?.includeDefense ?? false,
          coverageId: card.resolveOptions?.coverageId,
          frontId: card.resolveOptions?.frontId,
        });
      }
    } catch {
      /* fall through */
    }
  }
  return finishLearnScene(card, scene ?? fallbackSceneForTopic(card.topic));
}

/**
 * Identify-the-play cards from saved plays.
 * Diagram → display name (answer is the teaching name, not the raw call).
 */
export function cardsFromPlaybook(
  plays: Pick<
    PlaybookPlay,
    'id' | 'name' | 'playcall' | 'concept' | 'coachingPoint' | 'side' | 'vsPlaycall'
  >[],
): FlashCard[] {
  const offense = offensePlaysForPlayCalls(plays);
  if (offense.length === 0) return [];
  const names = offense.map((p) => p.name);
  return offense.map((p) => {
    const built = sceneForPlaybookPlay(p);
    return {
      id: `playbook-${p.id}`,
      topic: 'play-calls' as const,
      type: 'match-playcall' as const,
      prompt: 'Name this play',
      answer: p.name,
      distractors: pickDistractors(p.name, names),
      distractorPool: names,
      playcall: p.playcall,
      scene: built,
      explain: p.coachingPoint ?? (p.concept ? `${p.name} — ${p.concept} family.` : undefined),
      group: p.concept ?? p.id,
      hideTitle: true,
      resolveOptions: {
        includeDefense: false,
        vsPlaycall: p.vsPlaycall,
      },
    };
  });
}
