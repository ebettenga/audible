import type { CardType, TrainingTopic } from '@/src/training/types';

/** Teaching facts drawn from the Fourth and Film transcripts in /transcripts. */
export interface QuizFact {
  id: string;
  topic: TrainingTopic;
  type: CardType;
  prompt: string;
  answer: string;
  distractors: string[];
  explain: string;
  group?: string;
}

export const QUIZ_FACTS: QuizFact[] = [
  // --- Formations ---
  {
    id: 'form-t-shape',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'In the T formation, how are the three running backs aligned?',
    answer: 'Fullback behind the QB, halfbacks on either side',
    distractors: [
      'Fullback and tailback stacked in a line',
      'Two backs split beside the quarterback',
      'One back seven yards deep in shotgun',
    ],
    explain:
      'The T is named for that backfield: quarterback under center, fullback behind him, and two halfbacks flanking the fullback.',
    group: 't-formation',
  },
  {
    id: 'form-i-stack',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'What makes I formation look like the letter I from above?',
    answer: 'QB, fullback, and tailback stacked in a line',
    distractors: [
      'Three running backs spread in a T',
      'Two backs split left and right of the QB',
      'The quarterback standing alone in empty',
    ],
    explain:
      'Under center, the fullback is about four yards deep and the tailback another four yards behind him — a straight I.',
    group: 'i-formation',
  },
  {
    id: 'form-ace-name',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'Single back — one running back, no fullback — is also called what?',
    answer: 'Ace',
    distractors: ['Pro set', 'Wishbone', 'Wildcat'],
    explain: 'Remove the fullback from I and you have single back, also called ace.',
    group: 'ace',
  },
  {
    id: 'form-pro-set',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'How do the two running backs line up in the pro set?',
    answer: 'Split side by side behind the quarterback',
    distractors: [
      'Stacked in a line behind the quarterback',
      'One is in the slot as a receiver',
      'Both are on the line as tight ends',
    ],
    explain:
      'Pro set splits the backs about four yards deep so the defense cannot tell which back is getting the ball until the quarterback turns.',
    group: 'pro-set',
  },
  {
    id: 'form-gun-depth',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'How far behind the center does a shotgun quarterback usually stand?',
    answer: '5 to 7 yards',
    distractors: ['1 to 2 yards', '3 to 4 yards', '10 to 12 yards'],
    explain:
      'Shotgun puts the quarterback 5 to 7 yards back so the snap is caught in the air and he is already in throwing position.',
    group: 'shotgun',
  },
  {
    id: 'form-pistol-depth',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'How is pistol different from shotgun?',
    answer: 'QB is closer (3–4 yards) with the RB directly behind him',
    distractors: [
      'QB is under center with no running back',
      'QB is 5–7 yards deep and the RB is offset',
      'The ball is snapped to the running back',
    ],
    explain:
      'Chris Ault’s pistol keeps shotgun vision but puts the back downhill behind the quarterback instead of offset to the side.',
    group: 'pistol',
  },
  {
    id: 'form-spread-count',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'What skill-player mix is a classic spread look?',
    answer: '4 wide receivers and 1 running back',
    distractors: [
      '2 wide receivers and 2 running backs',
      '3 tight ends and 2 running backs',
      '5 wide receivers and no running back',
    ],
    explain:
      'Spread replaces the tight end with another receiver so four wideouts stretch the field and the box gets lighter.',
    group: 'spread',
  },
  {
    id: 'form-wildcat-snap',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'Who takes the snap in Wildcat?',
    answer: 'A running back in shotgun',
    distractors: [
      'The quarterback under center',
      'The tight end on the line',
      'The fullback in I formation',
    ],
    explain:
      'Wildcat snaps the ball directly to a running back, eliminating the handoff and adding an extra blocker or receiver.',
    group: 'wildcat',
  },
  {
    id: 'form-empty',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'What is empty backfield?',
    answer: 'No running backs; five eligible receivers split out',
    distractors: [
      'Two backs and no wide receivers',
      'One back and four tight ends',
      'The quarterback under center in jumbo',
    ],
    explain:
      'Empty puts five receivers in routes. There is no run threat in the backfield, so the defense can focus on coverage.',
    group: 'empty',
  },
  {
    id: 'form-jumbo',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'What personnel does a typical jumbo / goal-line package use?',
    answer: '3 tight ends, 2 running backs, 0 wide receivers',
    distractors: [
      '1 tight end, 1 running back, 3 wide receivers',
      '0 tight ends, 1 running back, 4 wide receivers',
      '2 tight ends, 0 running backs, 3 wide receivers',
    ],
    explain:
      'Jumbo is pure mass: extra tight ends and backs, no wideouts, to move someone on third-and-short or the goal line.',
    group: 'jumbo',
  },
  {
    id: 'form-zone-read',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'On a shotgun zone read, which defender does the quarterback usually read?',
    answer: 'The backside defensive end',
    distractors: [
      'The free safety',
      'The nose tackle',
      'The slot corner',
    ],
    explain:
      'If that end crashes the back, the quarterback keeps. If he stays wide to contain, the quarterback hands it off.',
    group: 'shotgun',
  },

  // --- Personnel ---
  {
    id: 'pers-code-first',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'In an NFL personnel code, what does the first digit count?',
    answer: 'Running backs',
    distractors: ['Tight ends', 'Wide receivers', 'Offensive linemen'],
    explain: '11, 12, 21 — first digit is backs (including the fullback), second digit is tight ends.',
    group: 'code',
  },
  {
    id: 'pers-code-second',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'In an NFL personnel code, what does the second digit count?',
    answer: 'Tight ends',
    distractors: ['Running backs', 'Wide receivers', 'Linebackers'],
    explain: 'Wide receivers fill the remaining skill spots: 5 − backs − tight ends.',
    group: 'code',
  },
  {
    id: 'pers-11-mix',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'What is 11 personnel?',
    answer: '1 RB, 1 TE, 3 WR',
    distractors: ['1 RB, 2 TE, 2 WR', '2 RB, 1 TE, 2 WR', '1 RB, 0 TE, 4 WR'],
    explain:
      'One back and one tight end leave three receivers. It is the NFL’s most-used package because it can run or pass without substituting.',
    group: '11',
  },
  {
    id: 'pers-12-mix',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'What is 12 personnel?',
    answer: '1 RB, 2 TE, 2 WR',
    distractors: ['1 RB, 1 TE, 3 WR', '2 RB, 2 TE, 1 WR', '0 RB, 2 TE, 3 WR'],
    explain:
      'The extra tight end adds run-blocking and play-action credibility while still keeping two wideouts on the field.',
    group: '12',
  },
  {
    id: 'pers-21-mix',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'What is 21 personnel?',
    answer: '2 RB, 1 TE, 2 WR',
    distractors: ['1 RB, 2 TE, 2 WR', '2 RB, 2 TE, 1 WR', '1 RB, 1 TE, 3 WR'],
    explain:
      'Two backs and a tight end — the I-formation / lead-back look. It can also max-protect and take a deep shot.',
    group: '21',
  },
  {
    id: 'pers-13-mix',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'What is 13 personnel?',
    answer: '1 RB, 3 TE, 1 WR',
    distractors: ['1 RB, 1 TE, 3 WR', '3 RB, 1 TE, 1 WR', '0 RB, 3 TE, 2 WR'],
    explain:
      'Three tight ends maximize size for power runs and make play-action leaks and seams more believable.',
    group: '13',
  },
  {
    id: 'pers-most-used',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'Which personnel package do NFL offenses use most?',
    answer: '11',
    distractors: ['12', '21', '10'],
    explain:
      'About 59% of recent NFL snaps come from 11. It keeps a run game and three receivers without changing personnel.',
    group: '11',
  },
  {
    id: 'pers-12-vs-nickel',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'Why do teams use more 12 personnel against nickel defenses?',
    answer: 'Bigger tight ends can bully the extra (smaller) defensive back',
    distractors: [
      'Nickel cannot cover four wide receivers',
      '12 personnel removes all wide receivers',
      'The extra back always motions to empty',
    ],
    explain:
      'Nickel replaces a linebacker with a smaller DB. Two tight ends restore a size advantage and can force the defense back to base.',
    group: '12',
  },

  // --- Passing concepts ---
  {
    id: 'pass-mesh',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'Why is mesh such a reliable man-coverage beater?',
    answer: 'Two shallow crosses create traffic and natural picks',
    distractors: [
      'Four verticals stretch the single-high safety',
      'A hitch and corner high-low the Cover 2 corner',
      'The tight end sits in the hole at 5 yards',
    ],
    explain:
      'Mesh is two shallow crossing routes plus a back to the flat. Defenders have to weave through traffic after the mesh point.',
    group: 'mesh',
  },
  {
    id: 'pass-levels',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'What does the levels concept attack?',
    answer: 'Short, intermediate, and deep layers on one side',
    distractors: [
      'Only the boundary fade',
      'Only the running back in the flat',
      'The A-gap with a dive',
    ],
    explain:
      'Levels staggers receivers at different depths so a zone defender who sits on one layer leaves a window at another.',
    group: 'levels',
  },
  {
    id: 'pass-flood',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'Flood puts three routes on one side. What are the usual levels?',
    answer: 'Deep corner, intermediate out, short flat',
    distractors: [
      'Two slants and a bubble',
      'Four verticals and a checkdown',
      'Hitch, hitch, and a screen',
    ],
    explain:
      'Flood is a half-field high-to-low read — especially off boot — designed to put three receivers on two Cover 3 defenders.',
    group: 'flood',
  },
  {
    id: 'pass-smash-vs',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'Smash (hitch + corner) is built to attack which coverage?',
    answer: 'Cover 2',
    distractors: ['Cover 0', 'Cover 4', 'Tampa 2'],
    explain:
      'The hitch occupies the Cover 2 corner; the corner route breaks into the void between that corner and the deep safety.',
    group: 'smash',
  },
  {
    id: 'pass-ycross-depth',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'How deep is the featured crossing route in Y cross?',
    answer: '15 to 18 yards',
    distractors: ['3 to 5 yards', '8 to 10 yards', '25 to 30 yards'],
    explain:
      'Y cross sends the tight end or slot on a 15- to 18-yard cross, usually off play-action behind linebackers who stepped up.',
    group: 'y-cross',
  },
  {
    id: 'pass-4v-c3',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'Against Cover 3, what does four verticals stress?',
    answer: 'The single deep middle safety',
    distractors: [
      'The two deep half safeties',
      'The nickel corner in the slot',
      'The nose tackle in the A-gap',
    ],
    explain:
      'Cover 3 has one deep middle defender. Four verticals put more deep threats on the field than that safety can handle.',
    group: 'four-verticals',
  },
  {
    id: 'pass-4v-c2',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'Against Cover 2, where does four verticals attack?',
    answer: 'The seam between the two deep safeties',
    distractors: [
      'The flats outside the corners',
      'The A-gap on a draw',
      'The boundary fade only',
    ],
    explain: 'Two deep safeties split the field in half. The hole is the deep middle / seam between them.',
    group: 'four-verticals',
  },
  {
    id: 'pass-stick-read',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'On stick, who does the quarterback read first after the snap?',
    answer: 'The flat defender',
    distractors: ['The free safety', 'The backside guard', 'The boundary corner only'],
    explain:
      'If the flat defender widens, throw the 5-yard stick. If he sits on the stick, throw the back in the flat.',
    group: 'stick',
  },
  {
    id: 'pass-drive',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'What two crossing routes make up drive?',
    answer: 'A deep dig over a shallow cross',
    distractors: [
      'A smash hitch and a corner',
      'Four go routes',
      'A bubble and a slip screen',
    ],
    explain:
      'Drive layers a shallow cross under a dig, with a backside post to clear. The quarterback works high to low across the field.',
    group: 'drive',
  },
  {
    id: 'pass-dagger',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'What does the inside receiver do on dagger?',
    answer: 'Clears vertically so the outside receiver can run a dig',
    distractors: [
      'Sits in the flat at 2 yards',
      'Blocks the edge for a toss',
      'Runs a mesh drag under the formation',
    ],
    explain:
      'The vertical puller moves the deep defender. If the middle opens, hit the dig; if a safety sits on it, look at the vertical.',
    group: 'dagger',
  },
  {
    id: 'pass-slant-flat',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'On slant-flat, if the flat defender widens to the back, where do you throw?',
    answer: 'The slant',
    distractors: ['The fade', 'The checkdown only', 'The post'],
    explain:
      'Slant-flat is a two-man quick game. Widen with the back → slant is open. Sit on the slant → throw the flat.',
    group: 'slant-flat',
  },
  {
    id: 'pass-china',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'Double China (two 5-yard ins + a corner) is especially useful where?',
    answer: 'Red zone and short yardage',
    distractors: ['Kickoff return', 'Punt protection', 'Victory formation'],
    explain:
      'The ins pull linebackers inside and the corner finds the vacated space — a high-percentage red-zone combination.',
    group: 'china',
  },

  // --- Running concepts ---
  {
    id: 'run-man-def',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'In man-blocking run concepts, what are linemen assigned?',
    answer: 'Specific defenders (hat-on-hat)',
    distractors: [
      'A zone they step to, then climb',
      'A predetermined pull path only',
      'No one — they release immediately',
    ],
    explain:
      'Man concepts: you block your guy. Zone concepts block areas. Gap concepts use down blocks and pullers to a designed hole.',
    group: 'scheme',
  },
  {
    id: 'run-zone-def',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'What is the running back’s inside-zone read called?',
    answer: 'Bang, bend, bounce',
    distractors: ['High to low', 'Hat-on-hat', 'Kick out, then wrap'],
    explain:
      'Press the designed crease (bang). If the frontside is lost, cut back (bend). If there is no cutback, bounce outside.',
    group: 'inside-zone',
  },
  {
    id: 'run-gap-def',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'What do gap-scheme runs use to create a point of attack?',
    answer: 'Down blocks and pulling linemen',
    distractors: [
      'Only hat-on-hat with no movement',
      'Four verticals to clear the box',
      'A quarterback sneak every snap',
    ],
    explain:
      'Gap runs wall off a lane with down blocks, then add a puller (and often a kick-out) so the back has a designed hole.',
    group: 'gap',
  },
  {
    id: 'run-power-id',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'What is the signature block that identifies Power O?',
    answer: 'The backside guard pulling to the point of attack',
    distractors: [
      'The center snapping and going to the flat',
      'Both tackles releasing on wheel routes',
      'The quarterback reading the slot corner',
    ],
    explain:
      'Power uses down blocks, a kick-out on the end, and that backside guard wrapping to a linebacker at the C-gap.',
    group: 'power',
  },
  {
    id: 'run-counter',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'How is counter different from Power O?',
    answer: 'Two pullers (usually backside guard and tackle)',
    distractors: [
      'No pullers; only double teams',
      'The running back never has a lead blocker',
      'It is always a quarterback draw',
    ],
    explain:
      'Counter is Power with a second puller. The guard often kick-outs; the tackle wraps. The back takes a false step to let them clear.',
    group: 'counter',
  },
  {
    id: 'run-duo',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'On duo (inside gap), who does the running back read?',
    answer: 'The Mike linebacker',
    distractors: ['The free safety', 'The slot receiver', 'The punter'],
    explain:
      'Duo double-teams the defensive tackles with no puller. If Mike scrapes outside the double, run inside; if he dives inside, bang the B-gap.',
    group: 'duo',
  },
  {
    id: 'run-zone-read',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'On zone read, when does the quarterback keep the ball?',
    answer: 'When the unblocked backside end crashes the running back',
    distractors: [
      'When the free safety rotates to Cover 3',
      'When the center is uncovered',
      'On every first-and-10',
    ],
    explain:
      'The end is left unblocked. Crash to the back → QB keeps outside. Stay wide to contain → hand the ball off.',
    group: 'zone-read',
  },
  {
    id: 'run-holes-even',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'In the hole-number system used in these play calls, even numbers are where?',
    answer: 'The right side of the formation',
    distractors: ['The left side of the formation', 'Only the A-gaps', 'Always the quarterback sneak'],
    explain:
      'Even = right (2 A-gap, 4 B-gap, 6 C-gap, 8 outside). Odd = left. 0 is the quarterback sneak behind center.',
    group: 'holes',
  },
  {
    id: 'run-carrier-2',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'In a call like 28 zone, who is ball-carrier number 2?',
    answer: 'The halfback / tailback',
    distractors: ['The quarterback', 'The fullback', 'The motion receiver'],
    explain:
      'QB is 1, halfback/tailback is 2, fullback is 3, motion/flanker back is 4. 28 zone = 2-back through the 8-hole, zone scheme.',
    group: 'holes',
  },
  {
    id: 'run-wide-hole',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'Outside / wide zone is designed to attack which hole?',
    answer: '8 (outside the tight end)',
    distractors: ['0 (quarterback sneak)', '2 (right A-gap)', '4 (right B-gap)'],
    explain:
      'The back aims at the 8-hole (or the ghost tight-end spot) and still uses bang / bend / bounce as the stretch develops.',
    group: 'outside-zone',
  },

  // --- Fronts ---
  {
    id: 'front-43-count',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'What is a 4-3 defense?',
    answer: '4 linemen, 3 linebackers, 4 defensive backs',
    distractors: [
      '3 linemen, 4 linebackers, 4 defensive backs',
      '6 linemen, 2 linebackers, 3 defensive backs',
      '4 linemen, 1 linebacker, 6 defensive backs',
    ],
    explain: '4-3 is the common base front: four down linemen, three linebackers, four DBs.',
    group: '4-3',
  },
  {
    id: 'front-34-count',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'What is a 3-4 defense?',
    answer: '3 linemen, 4 linebackers, 4 defensive backs',
    distractors: [
      '4 linemen, 3 linebackers, 4 defensive backs',
      '5 linemen, 3 linebackers, 3 defensive backs',
      '3 linemen, 3 linebackers, 5 defensive backs',
    ],
    explain:
      'The extra linebacker creates multiplicity — the offense cannot tell pre-snap who is rushing and who is dropping.',
    group: '3-4',
  },
  {
    id: 'front-62-use',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'When do teams typically bring a 6-2 (six down linemen)?',
    answer: 'Short yardage and goal line, expecting run',
    distractors: [
      'Two-minute drill, expecting four verticals',
      'Punt return',
      'Opening kickoff',
    ],
    explain:
      'Six linemen plug A, B, and C gaps. Only three DBs remain, so it is a run stand — not a passing-down look.',
    group: '6-2',
  },
  {
    id: 'front-nickel-db',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'How many defensive backs are on the field in nickel?',
    answer: '5',
    distractors: ['3', '4', '6'],
    explain:
      'Nickel is five DBs. The fifth is the nickel corner, usually covering the slot when the offense has three receivers.',
    group: 'nickel',
  },
  {
    id: 'front-dime-db',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'How many defensive backs are on the field in dime?',
    answer: '6',
    distractors: ['4', '5', '7'],
    explain:
      'Dime adds a second nickel (two nickels = a dime): typically 4 linemen, 1 linebacker, 6 DBs on third-and-long.',
    group: 'dime',
  },
  {
    id: 'front-nickel-job',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'Who does the nickel corner usually cover?',
    answer: 'The slot receiver',
    distractors: ['The left tackle', 'The punter', 'The deep middle only'],
    explain:
      'With 11 personnel, a base 4-3 leaves a linebacker on the slot. Nickel puts a faster DB there instead.',
    group: 'nickel',
  },
  {
    id: 'front-46-name',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'The 46 Bear front is named after whose jersey number?',
    answer: 'Doug Plank',
    distractors: ['Lawrence Taylor', 'Ray Lewis', 'Reggie White'],
    explain:
      'The 1985 Bears named it for safety Doug Plank’s #46. Three linemen shade the center and both guards (the Bear front).',
    group: 'bear',
  },
  {
    id: 'front-44-box',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'A 4-4 puts how many defenders in the box?',
    answer: '8 (4 linemen + 4 linebackers)',
    distractors: ['5', '6', '11'],
    explain:
      'Eight in the box controls every gap and the edge — a common answer to option / RPO teams. Only three DBs remain.',
    group: '4-4',
  },

  // --- Coverages ---
  {
    id: 'cov-0-deep',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'How many deep safeties are in Cover 0?',
    answer: 'None — everyone is in man or blitzing',
    distractors: ['One', 'Two', 'Three'],
    explain:
      'Cover 0 is an all-in bet: no deep help. Beat one defender and there is a clear path to the end zone.',
    group: 'cover-0',
  },
  {
    id: 'cov-1-shell',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'Cover 1 (man-free) has what deep help?',
    answer: 'One safety in the deep middle; everyone else is man',
    distractors: [
      'Two safeties each taking a deep half',
      'Four defensive backs each taking a quarter',
      'No one deep',
    ],
    explain:
      'One free safety patrols center field. Windows are tight, but a beaten corner has only that one helper.',
    group: 'cover-1',
  },
  {
    id: 'cov-1-robber',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'What does the robber do in Cover 1 robber?',
    answer: 'Lurks 5–10 yards off the ball to jump slants and crosses',
    distractors: [
      'Plays a deep half of the field',
      'Always blitzes the A-gap',
      'Covers the punt returner',
    ],
    explain:
      'The robber baits the hot middle throw. Attack the sideline or look him off before throwing inside.',
    group: 'cover-1-robber',
  },
  {
    id: 'cov-2-weak',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'What is the classic deep weakness of Cover 2 zone?',
    answer: 'The deep middle between the two safeties',
    distractors: [
      'The boundary fade against press',
      'The A-gap versus a sneak',
      'There is no deep weakness',
    ],
    explain:
      'Each safety owns a deep half. The hole is the seam / deep middle — smash and four verticals live there.',
    group: 'cover-2',
  },
  {
    id: 'cov-tampa2',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'What makes Tampa 2 different from regular Cover 2?',
    answer: 'The middle linebacker drops to become a third deep defender',
    distractors: [
      'Both corners play press man',
      'There are no safeties',
      'The nickel always blitzes',
    ],
    explain:
      'The dropping Mike closes Cover 2’s deep-middle hole. The trade-off is more room underneath and versus the run.',
    group: 'tampa-2',
  },
  {
    id: 'cov-3-deep',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'Cover 3 assigns how many deep defenders?',
    answer: 'Three (each a deep third)',
    distractors: ['One', 'Two', 'Four'],
    explain:
      'Usually two corners and a safety split the deep field into thirds. Attack the flats and the seams between those thirds.',
    group: 'cover-3',
  },
  {
    id: 'cov-3-attack',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'Which concept is a textbook Cover 3 beater?',
    answer: 'Flood (three routes at different depths on one side)',
    distractors: ['Lead dive', 'Punt safe', 'Victory kneel'],
    explain:
      'Cover 3 has two underneath defenders on a side and three deep. Flood puts three receivers on that side at different depths.',
    group: 'cover-3',
  },
  {
    id: 'cov-4-job',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'What is Cover 4 (quarters) designed to stop?',
    answer: 'Explosive shots down the field',
    distractors: ['All runs up the A-gap', 'Onside kicks', 'Punt blocks'],
    explain:
      'Four deep defenders wall off the end zone. Take the underneath completions until those DBs creep up.',
    group: 'cover-4',
  },
  {
    id: 'cov-6-mix',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'Cover 6 is a combination of which two coverages?',
    answer: 'Cover 2 on one side and Cover 4 on the other',
    distractors: [
      'Cover 0 and Cover 1',
      'Cover 3 and man-free',
      'Tampa 2 and Cover 0',
    ],
    explain:
      'The quarterback sees different rules depending on which side he reads. Identify the Cover 2 side (one deep) and attack it.',
    group: 'cover-6',
  },
  {
    id: 'cov-2-man',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'How does Cover 2 man differ from Cover 2 zone?',
    answer: 'Two deep safeties, but everyone else is man-to-man',
    distractors: [
      'There are no safeties',
      'All eleven defenders play zone',
      'Only the Mike plays man',
    ],
    explain:
      'Receivers still have to win man, but two safeties protect the deep sidelines. The seam between those safeties is still a target.',
    group: 'cover-2-man',
  },

  // --- Pressures ---
  {
    id: 'pr-sim',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What is simulated pressure?',
    answer: 'The defense shows extra rushers but only sends four',
    distractors: [
      'Seven rushers with no one deep',
      'A four-man rush with no movement',
      'A fake punt',
    ],
    explain:
      'If it is not more than four rushers, it is not a blitz. A dropping lineman replaces the late rusher so coverage is not empty.',
    group: 'simulated',
  },
  {
    id: 'pr-blitz-count',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'When does a rush become a true blitz?',
    answer: 'When a fifth (or sixth) rusher is added',
    distractors: [
      'When any lineman stunts',
      'When the offense is in shotgun',
      'On first down only',
    ],
    explain:
      'Four rushers is a standard rush or a simulated look. A second-level linebacker making it five is a blitz.',
    group: 'blitz',
  },
  {
    id: 'pr-sam',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'Where does the Sam linebacker line up?',
    answer: 'To the strength of the formation (usually the tight-end side)',
    distractors: [
      'Always to the boundary regardless of the tight end',
      'Over the center',
      'Deep middle like a free safety',
    ],
    explain: 'Sam = strong side. Will = weak side. Mike = middle. Strength is typically the tight-end side.',
    group: 'labels',
  },
  {
    id: 'pr-will',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'Where does the Will linebacker line up?',
    answer: 'To the weak side, opposite the tight end',
    distractors: [
      'Always attached to the tight end',
      'In the slot as a nickel',
      'As the deep middle safety',
    ],
    explain: 'Will is the weak-side linebacker — the side away from declared offensive strength.',
    group: 'labels',
  },
  {
    id: 'pr-fire',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What is a fire zone?',
    answer: 'A five-man pressure with zone coverage behind it',
    distractors: [
      'A four-man rush with man coverage',
      'A punt rush',
      'Cover 0 with seven rushers',
    ],
    explain:
      'Send one extra rusher and drop an unexpected defender (often a lineman) into coverage. It looks like a blitz but keeps a zone shell.',
    group: 'fire-zone',
  },
  {
    id: 'pr-stunt',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What is a stunt?',
    answer: 'A planned defensive-line movement to create a free rusher',
    distractors: [
      'A running-back spin move',
      'A kickoff onside',
      'A hard count only',
    ],
    explain:
      'Stunt is the umbrella: twists, loops, spikes, overloads. Two defenders swapping gaps is a twist.',
    group: 'stunt',
  },
  {
    id: 'pr-twist',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What happens on a twist?',
    answer: 'Two defensive linemen swap the gaps they rush',
    distractors: [
      'Both linebackers drop to the deep middle',
      'The nickel covers the tight end man-to-man',
      'The offense pulls both guards',
    ],
    explain:
      'Each rusher crosses the offensive lineman’s face into the other gap, hoping a protection handoff is missed.',
    group: 'stunt',
  },
  {
    id: 'pr-allout',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What is the big risk of an all-out pressure?',
    answer: 'No one is deep — a completion can be a touchdown',
    distractors: [
      'Too many defenders in coverage',
      'The punter must rush',
      'The offense cannot snap the ball',
    ],
    explain:
      'Seven rushers vs six or seven blockers: someone is free. If the quarterback wins the hot throw, there is no safety net.',
    group: 'zero',
  },
  {
    id: 'pr-rb-read',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'How does a running back typically pick up the blitz?',
    answer: 'Read inside first, then work out to the edge',
    distractors: [
      'Always block the corner, then the Mike',
      'Release immediately on a wheel',
      'Block the free safety',
    ],
    explain:
      'Inside-out pickup is why a fast nickel off the edge can win — the back may still be checking the A-gap when the DB arrives.',
    group: 'protection',
  },
];

export function factsForTopic(topic: TrainingTopic): QuizFact[] {
  return QUIZ_FACTS.filter((fact) => fact.topic === topic);
}
