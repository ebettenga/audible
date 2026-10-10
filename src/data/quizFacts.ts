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
  /** Display label tying related questions together (e.g. an offensive scheme). */
  theme?: string;
  /** Play call drawn on the card; falls back to a topic diagram when it does not parse. */
  playcall?: string;
}

export const QUIZ_CORE_FACTS: QuizFact[] = [
  // --- Formations (Every Offensive Formation Explained) ---
  {
    id: 'form-purpose',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'What trade-off does every offensive formation make before the snap?',
    answer: 'Better blocking, more receivers, or surprise — you cannot have all three',
    distractors: [
      'The defense must declare Cover 0 or Cover 4',
      'The quarterback must be under center',
      'You always keep a fullback and a tight end',
    ],
    explain:
      'Each set stacks the deck one way: extra blockers, extra receivers, or an unexpected snap. The rest of the field gets thinner.',
    group: 'purpose',
  },
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
    id: 'form-t-qb',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'What did the T formation change about who handles the snap?',
    answer: 'One player — the quarterback — decides every play',
    distractors: [
      'The ball is snapped to a different back each play',
      'The center keeps the ball and pitches',
      'A running back always takes the snap',
    ],
    explain:
      'Single wing snapped to different players. The T put one decision-maker in charge — handoff, pitch, or keep — and created the modern QB.',
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
    id: 'form-i-fb',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'What is the fullback’s job on most I-formation runs?',
    answer: 'Lead as a battering ram so the tailback runs free',
    distractors: [
      'Split out as a slot receiver',
      'Take every snap in Wildcat',
      'Drop into coverage',
    ],
    explain:
      'The fullback takes on the first linebacker or safety. The tailback follows with fresh legs through the hole that bodyguard opened.',
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
    id: 'form-ace-slot',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'What mismatch does single-back / ace create by adding a slot receiver?',
    answer: 'A linebacker often has to cover a faster slot receiver',
    distractors: [
      'The nose tackle must cover the tight end',
      'The free safety must walk down into the box',
      'The weak-side tackle must split out wide',
    ],
    explain:
      'One back frees a receiver between tackle and wideout. Bring an extra box defender and the slot is open; cover the slot with a DB and the box is light.',
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
    id: 'form-pro-died',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'Why did pro set fade as a base offense?',
    answer: 'Only two wideouts cannot stress a six- or seven-DB defense',
    distractors: [
      'It cannot run the football at all',
      'The quarterback must stand in shotgun',
      'Two backs cannot max-protect',
    ],
    explain:
      'A third receiver is worth more than a second back against modern secondaries. Pro set still shows up in short yardage.',
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
    id: 'form-gun-why',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'What is the main pre-snap advantage of shotgun?',
    answer: 'The QB already sees the field and is set to throw',
    distractors: [
      'The running back starts closer to the line than in I',
      'The center can audible the coverage',
      'The defense cannot blitz',
    ],
    explain:
      'No seven-step drop. The quarterback identifies leverage before the snap and has more time because he is already in the pocket.',
    group: 'shotgun',
  },
  {
    id: 'form-zone-read',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'On a shotgun zone read, which defender does the quarterback usually read?',
    answer: 'The backside defensive end',
    distractors: ['The free safety', 'The nose tackle', 'The slot corner'],
    explain:
      'If that end crashes the back, the quarterback keeps. If he stays wide to contain, the quarterback hands it off.',
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
    id: 'form-pistol-rb',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'Why is the pistol running game stronger than traditional shotgun?',
    answer: 'The back attacks downhill instead of starting sideways',
    distractors: [
      'The quarterback is under center',
      'There are two fullbacks',
      'The tight end always motions empty',
    ],
    explain:
      'A back who takes the handoff moving forward is more dangerous than one who starts offset and has to redirect to the line.',
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
    id: 'form-spread-math',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'If a defense uses dime to cover four spread receivers, how many are left in the box?',
    answer: 'Five defenders versus five OL plus the running back',
    distractors: [
      'Eight defenders versus three blockers',
      'Eleven defenders on the line',
      'No one left to stop the run',
    ],
    explain:
      'Six DBs cover four wideouts. That leaves five in the box. Keep extra bodies in the box and the four receivers are under-covered.',
    group: 'spread',
  },
  {
    id: 'form-spread-time',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'How fast do most spread concepts need the ball out?',
    answer: 'Under 2.5 seconds on three-step routes',
    distractors: [
      'After a seven-step drop every snap',
      'Only on fourth down',
      'The quarterback must scramble first',
    ],
    explain:
      'No tight end to help protect. Spread lives on quick game so the rush cannot get home.',
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
    id: 'form-wildcat-plus',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'What extra number does Wildcat create for the runner?',
    answer: 'Ten blockers instead of nine, because the QB is a receiver or is replaced',
    distractors: [
      'Two extra safeties in the box',
      'A second center',
      'Legal linemen downfield on every pass',
    ],
    explain:
      'On a normal handoff the quarterback is a spectator. Wildcat turns that unused body into a blocker or a route.',
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
    id: 'form-empty-draw',
    topic: 'formations',
    type: 'name-formation',
    prompt: 'What run can empty still threaten when defenders spread to cover five receivers?',
    answer: 'A quarterback draw up the vacated middle',
    distractors: [
      'Power O with two pullers',
      'I-formation isolation',
      'A fullback dive',
    ],
    explain:
      'With no back and five routes, the box is empty. A mobile quarterback can take the middle if the rush does not squeeze it.',
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

  // --- Personnel (Personnel Packages Explained) ---
  {
    id: 'pers-five-skill',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'Besides five linemen and a quarterback, how many skill players are on the field?',
    answer: 'Five (some mix of RB, TE, and WR)',
    distractors: ['Three', 'Seven', 'Eleven'],
    explain:
      'Every 11-man offense is 5 OL + QB + 5 skill. Personnel is just how you split those five among backs, tight ends, and receivers.',
    group: 'code',
  },
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
    id: 'pers-wr-math',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'How do you find the number of wide receivers from a personnel code?',
    answer: '5 minus backs minus tight ends',
    distractors: [
      'Add the two digits together',
      'Always three, no matter the code',
      'Count only players on the left',
    ],
    explain: '11 is 1 + 1, so 5 − 2 = 3 receivers. 12 is 1 + 2, so 2 receivers. 21 is 2 + 1, so 2 receivers.',
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
    id: 'pers-11-tempo',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'Why does 11 personnel help an offense play faster?',
    answer: 'It can run or pass without substituting',
    distractors: [
      'The referee automatically shorts the play clock',
      'The defense is not allowed to substitute',
      'There is no huddle rule in 11',
    ],
    explain:
      'One grouping that is credible both ways means you do not have to swap people — that is tempo.',
    group: '11',
  },
  {
    id: 'pers-box-light',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'How many defenders in the box is a light box?',
    answer: 'Six or fewer',
    distractors: ['Seven', 'Eight or more', 'Eleven'],
    explain:
      'The box is the linemen plus the players within about five yards behind them. Six or fewer is light (pass-first, run-vulnerable).',
    group: 'box',
  },
  {
    id: 'pers-box-heavy',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'How many defenders in the box is a heavy box?',
    answer: 'Eight or more',
    distractors: ['Four', 'Five', 'Exactly seven'],
    explain: 'Eight or more bodies near the ball stop the run. Seven is the balanced number.',
    group: 'box',
  },
  {
    id: 'pers-box-balanced',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'What is a balanced box?',
    answer: 'Seven defenders near the ball',
    distractors: ['Three safeties deep', 'Only the four down linemen', 'Nine in the box every snap'],
    explain: 'Seven is the usual answer to both run and pass. 11 personnel is built to pull that number down.',
    group: 'box',
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
  {
    id: 'pers-12-base',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'What defensive personnel does 12 often force?',
    answer: 'Base 4-3 or 3-4 instead of nickel',
    distractors: ['Dime with six DBs', 'A punt-safe shell', 'Cover 0 every snap'],
    explain:
      'Two tight ends make a nickel corner a liability vs the run. Base puts a real linebacker back on the field — and that LB may have to cover a TE.',
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
    id: 'pers-21-max',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'How many blockers can 21 personnel put in max protection?',
    answer: 'Seven or eight (five OL plus the two backs and the TE)',
    distractors: ['Only the five linemen', 'All eleven offensive players', 'Three blockers'],
    explain:
      'A back in the backfield can scan pressure from either side. That is why 21 is used for deep play-action that needs time.',
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
    id: 'pers-13-leak',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'What is a tight-end leak off a bootleg?',
    answer: 'QB rolls one way and throws back across to a TE going the other way',
    distractors: [
      'The tight end always stays in to pass-protect',
      'The quarterback spikes the ball',
      'Both guards pull to the same flat',
    ],
    explain:
      'A normal boot throws with the QB’s roll. A leak adds a second fake: defenders flow with the boot, then the TE comes open the other way.',
    group: '13',
  },
  {
    id: 'pers-10-mix',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'What is 10 personnel?',
    answer: '1 RB, 0 TE, 4 WR',
    distractors: ['1 RB, 1 TE, 3 WR', '0 RB, 1 TE, 4 WR', '2 RB, 0 TE, 3 WR'],
    explain: 'No tight end, four receivers — the spread / empty-adjacent grouping that lightens the box.',
    group: '10',
  },
  {
    id: 'pers-22-mix',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'What is 22 personnel?',
    answer: '2 RB, 2 TE, 1 WR',
    distractors: ['2 RB, 1 TE, 2 WR', '1 RB, 2 TE, 2 WR', '0 RB, 2 TE, 3 WR'],
    explain: 'Two backs and two tight ends — heavy / jumbo. T-lead is often called from 22.',
    group: '22',
  },
  {
    id: 'pers-xz',
    topic: 'personnel',
    type: 'name-personnel',
    prompt: 'In these play calls, who is usually the X receiver?',
    answer: 'The backside wideout — often the best one-on-one receiver',
    distractors: [
      'The running back',
      'The playside tight end',
      'The motion fullback',
    ],
    explain:
      'X is typically on the line on the weak side and cannot motion. Z (flanker) is off the ball and is the usual motion man.',
    group: 'labels',
  },

  // --- Passing concepts (Every Passing Concept Explained) ---
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
    id: 'pass-mesh-read',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'What is the quarterback’s progression on mesh?',
    answer: 'The crossing routes after the mesh point, then the back in the flat',
    distractors: [
      'Deep post first, then a sneak',
      'Only the fade, never a checkdown',
      'High to low on the flood side, then the backside post',
    ],
    explain:
      'Throw whoever separates after the two shallows cross. If both are covered, the running back in the flat is the outlet.',
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
      'A single deep post with no underneath route',
    ],
    explain:
      'Levels staggers receivers at different depths so a zone defender who sits on one layer leaves a window at another.',
    group: 'levels',
  },
  {
    id: 'pass-levels-read',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'How does the quarterback read levels?',
    answer: 'High to low — deep, then intermediate, then the checkdown',
    distractors: [
      'Low to high only',
      'Always throw the first hitch',
      'Read the backside tackle',
    ],
    explain:
      'Start on the dig or post. If a zone sits on it, come down to the intermediate cross, then the outlet.',
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
    id: 'pass-flood-weak',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'Which coverage is the classic weakness of flood?',
    answer: 'Cover 2, because a safety can take the corner route',
    distractors: ['Cover 3', 'Cover 0', 'Cover 1 robber'],
    explain:
      'Flood is built to put three on two in Cover 3. Cover 2 has a deep half safety who can carry the corner; backside pressure also wrecks boot timing.',
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
    id: 'pass-smash-read',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'On smash, what tells the quarterback hitch vs corner?',
    answer: 'Cornerback leverage — sits down, throw the corner; drops deep, take the hitch',
    distractors: [
      'Whether the Mike drops to Tampa 2',
      'Whether the center is covered',
      'Pre-snap motion by the running back only',
    ],
    explain:
      'It is a two-man high-low. The corner cannot be in both places. Tampa 2 is a common counter because the Mike helps the deep middle.',
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
    id: 'pass-ycross-read',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'Who does the quarterback read first on Y cross?',
    answer: 'The middle-field defender — if he leaves, throw the cross',
    distractors: ['The boundary corner only', 'The playside tackle', 'The running back in the flat first'],
    explain:
      'If the cross is covered, progress to the deep or outside clear-out. Robbers and deep middle help are the counters.',
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
    id: 'pass-4v-pre',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'On four verticals, what does the quarterback use as the first clue?',
    answer: 'Pre-snap safety alignment — single-high vs two-high',
    distractors: ['Corner press vs off alignment only', 'Whether the tight end reported eligible', 'The hash the ball is on only'],
    explain:
      'Single high: work the seams on either side of that safety. Two high: look for the hole between them. Quarters is the counter.',
    group: 'four-verticals',
  },
  {
    id: 'pass-stick-read',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'On stick, who does the quarterback read first after the snap?',
    answer: 'The flat defender',
    distractors: ['The free safety', 'The middle linebacker', 'The boundary corner only'],
    explain:
      'If the flat defender widens, throw the 5-yard stick. If he sits on the stick, throw the back in the flat.',
    group: 'stick',
  },
  {
    id: 'pass-stick-shape',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'What three pieces make the stick triangle?',
    answer: 'An outside vertical, a 5-yard stick from the slot, and a back in the flat',
    distractors: [
      'Four gos and a sneak',
      'Two posts and a wheel',
      'A smash hitch and a fade only',
    ],
    explain:
      'Quick-game triangle vs pressure and soft Cover 2/3. Press man, cloud, or a buzz defender on the stick are the counters.',
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
    distractors: ['Opening first-and-10 from midfield', 'Third-and-long from their own 5', 'Two-minute drill only'],
    explain:
      'The ins pull linebackers inside and the corner finds the vacated space — a high-percentage red-zone combination.',
    group: 'china',
  },
  {
    id: 'pass-shallow',
    topic: 'passing-routes',
    type: 'name-route',
    prompt: 'How deep is the featured route in Air Raid shallow cross?',
    answer: 'A drag at 3 to 5 yards',
    distractors: ['A 20-yard corner', 'A go at 40 yards', 'A fade in the end zone only'],
    explain:
      'One receiver drags the field at 3–5 yards while verticals, digs, or outs clear. The QB goes shallow → dig → checkdown. Rhythm, YAC, tempo.',
    group: 'shallow-cross',
  },

  // --- Running concepts (Every Running Concept Explained) ---
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
      'Zone steps with no designed hole',
      'A quarterback sneak every snap',
    ],
    explain:
      'Gap runs wall off a lane with down blocks, then add a puller (and often a kick-out) so the back has a designed hole.',
    group: 'gap',
  },
  {
    id: 'run-gaps-abc',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'Where is the A-gap?',
    answer: 'Between the center and the guards',
    distractors: [
      'Between the guards and tackles',
      'Outside the tight end',
      'Behind the quarterback',
    ],
    explain: 'A = center–guard, B = guard–tackle, C = tackle–tight end. Playside is the designed run direction; backside is the other side.',
    group: 'gaps',
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
    id: 'run-carrier-0',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'What does the 0-hole mean?',
    answer: 'A quarterback sneak behind center',
    distractors: ['A toss to the left flat', 'A jet sweep', 'The right C-gap'],
    explain: 'Hole 0 is the sneak. Even holes are right; odd holes are left.',
    group: 'holes',
  },
  {
    id: 'run-lead-dive',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'What makes lead dive a man-concept short-yardage run?',
    answer: 'The back follows a lead blocker through the A or B gap',
    distractors: [
      'Two guards pull to the edge',
      'The quarterback always keeps',
      'A receiver takes a jet handoff',
    ],
    explain:
      'Hat-on-hat, often with double teams that stay on. The fullback hits the first linebacker in the hole. Goal line and short yardage.',
    group: 'lead-dive',
  },
  {
    id: 'run-iso',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'On isolation (ISO), who does the lead blocker attack?',
    answer: 'One predetermined, isolated linebacker',
    distractors: [
      'Whoever shows first in the A-gap',
      'The free safety every snap',
      'The playside defensive end',
    ],
    explain:
      'Combo blocks climb, leaving one LB uncovered. The lead back knows that man before the snap — unlike lead dive, which takes the first LB in the hole.',
    group: 'iso',
  },
  {
    id: 'run-man-dive',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'Why call man dive (no “lead”) from a single-back set?',
    answer: 'Same look as a pass, so the defense cannot load the box pre-snap',
    distractors: [
      'It requires two fullbacks',
      'It can only be run from I formation',
      'The center must pull',
    ],
    explain:
      'If you only run from I, the defense swaps DBs for LBs. Single-back man dive keeps the pass threat alive and still hits A/B quickly.',
    group: 'man-dive',
  },
  {
    id: 'run-split-zone',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'What extra block turns inside zone into split zone?',
    answer: 'A back or tight end crosses to seal the backside defensive end',
    distractors: [
      'Both tackles release on wheels',
      'The quarterback always keeps',
      'The center snaps and goes to the flat',
    ],
    explain:
      'Zone often leaves the backside end free. Split zone kicks him so the cutback lane stays clean.',
    group: 'split-zone',
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
  {
    id: 'run-jet',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'What makes jet zone different from outside zone?',
    answer: 'A motion receiver takes the handoff or shovel in stride',
    distractors: [
      'The fullback always dives A-gap',
      'The center is the ball carrier',
      'There is no blocking',
    ],
    explain:
      'Same stretch rules, but a pre-snap jet forces the defense to honor the whole width — or get caught cheating on a fake jet.',
    group: 'jet-zone',
  },
  {
    id: 'run-power-id',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'What is the signature block that identifies Power O?',
    answer: 'The backside guard pulling to the point of attack',
    distractors: [
      'The playside tackle pulling to the edge',
      'Both guards double-teaming the nose with no wrap',
      'The quarterback reading the slot corner',
    ],
    explain:
      'Power uses down blocks, a kick-out on the end, and that backside guard wrapping to a linebacker at the C-gap.',
    group: 'power',
  },
  {
    id: 'run-power-read',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'On Power O, what does the running back read first?',
    answer: 'The kick-out — if the end is sealed outside, follow the lead through C-gap',
    distractors: [
      'The free safety’s deep half',
      'Whether the slot is pressed',
      'The backside guard’s first step only',
    ],
    explain:
      'If the kick-out spills the end inside, bounce. If it seals him out, run through the C-gap behind the wrap.',
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
    distractors: ['The free safety', 'The slot receiver', 'The backside defensive end'],
    explain:
      'Duo double-teams the defensive tackles with no puller. If Mike scrapes outside the double, run inside; if he dives inside, bang the B-gap.',
    group: 'duo',
  },
  {
    id: 'run-trap',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'What is the bait on a trap run?',
    answer: 'The playside guard influences a DT, then a backside guard kicks him',
    distractors: [
      'The quarterback spikes the ball',
      'Both receivers run gos',
      'The fullback goes in motion empty',
    ],
    explain:
      'The DT thinks he is free and charges. The pulling backside guard hits him from the side and the back cuts behind into the A-gap.',
    group: 'trap',
  },
  {
    id: 'run-wham',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'How is wham different from trap?',
    answer: 'A tight end or H-back makes the surprise block on the DT',
    distractors: [
      'The quarterback is the only blocker',
      'No one blocks the defensive tackle',
      'It is a four-verticals pass',
    ],
    explain:
      'Useful when guards are not mobile enough to trap a shooting DT. You need a physical TE or halfback who can actually block a tackle.',
    group: 'wham',
  },
  {
    id: 'run-glead',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'On G-lead, who becomes the lead blocker through the C-gap?',
    answer: 'The playside guard',
    distractors: ['The playside tackle', 'The backside guard', 'The fullback'],
    explain:
      'The playside guard pulls and leads on the playside linebacker. The tight end must hold the end alone — no tackle help.',
    group: 'g-lead',
  },
  {
    id: 'run-tlead',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'T-lead is typically called from which personnel?',
    answer: '22 (two backs, two tight ends)',
    distractors: ['00 empty', '10 four-wide', '11 three-wide'],
    explain: 'The playside tackle pulls around the tight end. You want two TEs so the edge still has a body when that tackle leaves.',
    group: 't-lead',
  },
  {
    id: 'run-dart',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'What does dart ask the backside tackle to do?',
    answer: 'Pull and lead through the playside B-gap',
    distractors: [
      'Release on a wheel route',
      'Down-block the 3-technique and stay',
      'Kick out the playside end',
    ],
    explain:
      'Like Power, but the backside tackle is the traveler. Best vs a 1-technique so the playside guard can down-block with leverage.',
    group: 'dart',
  },
  {
    id: 'run-speed-opt',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'On speed option, what choice does the edge defender face?',
    answer: 'Tackle the QB or take the pitch — both are threatening the sideline',
    distractors: [
      'Cover four verticals',
      'Spy the running back in the A-gap',
      'Drop into the flat as a buzz defender',
    ],
    explain:
      'Unlike zone read, both players are already racing outside. The QB pitches off the edge defender’s commitment.',
    group: 'speed-option',
  },
  {
    id: 'run-tech-3',
    topic: 'running-routes',
    type: 'name-route',
    prompt: 'Where does a 3-technique defensive tackle line up?',
    answer: 'In the B-gap, outside shade of the guard',
    distractors: [
      'Head-up on the center',
      'Outside the tight end',
      'Deep middle as a safety',
    ],
    explain:
      '0-tech is over the center, 1-tech on the center’s shoulder, 2-tech over the guard, 3-tech in the B-gap. Trap loves a 3-tech.',
    group: 'techniques',
  },

  // --- Fronts (Every Defensive Formation Explained) ---
  {
    id: 'front-62-count',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'What is a 6-2 defense?',
    answer: '6 linemen, 2 linebackers, 3 defensive backs',
    distractors: [
      '4 linemen, 3 linebackers, 4 defensive backs',
      '3 linemen, 4 linebackers, 4 defensive backs',
      '4 linemen, 1 linebacker, 6 defensive backs',
    ],
    explain:
      'Extreme run stand: six down guys plug A, B, and C gaps. Only three DBs remain, so a pass has an uncovered receiver.',
    group: '6-2',
  },
  {
    id: 'front-62-use',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'When do teams typically bring a 6-2?',
    answer: 'Short yardage and goal line, expecting run',
    distractors: [
      'Two-minute drill, expecting four verticals',
      'Third-and-long, expecting empty',
      'First-and-10 from midfield as a base look',
    ],
    explain:
      'Third-and-1, fourth-and-1, or two yards or less. The corners are on islands — a slant or anything over 10 yards is likely complete.',
    group: '6-2',
  },
  {
    id: 'front-53',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'How does a 5-3 differ from a 6-2?',
    answer: 'One fewer lineman and one extra linebacker for a bit more pass coverage',
    distractors: [
      'It adds two safeties and removes the nose',
      'It is a four-wide offense',
      'It drops all five linemen into coverage',
    ],
    explain:
      '5 DL, 3 LB, 3 DB. The Mike can still fill vs run or drop on play-action. Every NFL team keeps 5-3 in the goal-line package.',
    group: '5-3',
  },
  {
    id: 'front-52-eagle',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'What is the 52 Eagle?',
    answer: '5 linemen, 2 linebackers, 4 defensive backs',
    distractors: [
      '4 linemen, 4 linebackers, 3 defensive backs',
      '6 linemen, 2 linebackers, 3 defensive backs',
      '3 linemen, 3 linebackers, 5 defensive backs',
    ],
    explain:
      'Named for the 1950s Eagles. Better vs receivers than 5-3, but those five linemen are run-stoppers, not a four-man rush — the QB has time.',
    group: '52-eagle',
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
  {
    id: 'front-44-rpo',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'Why is a 4-4 useful against RPO / option?',
    answer: 'Eight in the box can account for keep, pitch, and give',
    distractors: [
      'It covers four verticals with three DBs easily',
      'It removes both linebackers for extra corners',
      'It is a man-free coverage',
    ],
    explain:
      'With only seven in the box, one of keep / pitch / give is usually free. Four linebackers own the edge and every gap.',
    group: '4-4',
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
    id: 'front-34-nt',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'What job does the 3-4 nose tackle do that frees the linebackers?',
    answer: 'Occupy the center, often drawing a double team',
    distractors: [
      'Cover the slot on every snap',
      'Spy the quarterback on every drop',
      'Play a deep half',
    ],
    explain:
      'A two-gapping nose lets OLBs come from unexpected angles. It needs a NT who can eat two blockers and athletic OLBs who can rush or cover.',
    group: '3-4',
  },
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
    id: 'front-43-11',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'What is the 4-3’s problem against 11 personnel?',
    answer: 'The weak-side linebacker often has to cover the slot',
    distractors: [
      'There are no defensive linemen',
      'The free safety must cover the slot',
      'It cannot stop first-and-10 runs',
    ],
    explain:
      'Three receivers put a slot on the weak side. A 4.7 LB vs a 4.4 slot is why most teams answer with nickel.',
    group: '4-3',
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
    id: 'front-46-weak',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'Why do modern offenses punish a 46 Bear look?',
    answer: 'Quick three-step and bubble vs only two corners and a single safety',
    distractors: [
      'It cannot stop a sneak',
      'The extra linebacker must cover four verticals',
      'The nose cannot line up over the center',
    ],
    explain:
      'Eight bodies crowd the LOS. Four receivers leave someone free. 1980s under-center drops were slower; today’s quick game is the answer.',
    group: 'bear',
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
    id: 'front-nickel-job',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'Who does the nickel corner usually cover?',
    answer: 'The slot receiver',
    distractors: ['The left tackle', 'The tight end', 'The deep middle only'],
    explain:
      'With 11 personnel, a base 4-3 leaves a linebacker on the slot. Nickel puts a faster DB there instead.',
    group: 'nickel',
  },
  {
    id: 'front-nickel-run',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'What is nickel’s run weakness?',
    answer: 'Only two linebackers, and the nickel is a poor tackler vs a 220-lb back',
    distractors: [
      'There are eight linebackers',
      'The nose cannot rush',
      'It has no cornerbacks',
    ],
    explain:
      'Modern offenses are in 3+ WR about 65% of the time, so nickel is the real base. Inside runs can still break if OL wins.',
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
    id: 'front-dime-when',
    topic: 'fronts',
    type: 'name-front',
    prompt: 'When do you typically see dime?',
    answer: 'Third-and-long (12+), two-minute, or four-plus receivers',
    distractors: ['First-and-goal sneak', 'Short-yardage from the 1', 'Base first-and-10'],
    explain:
      'You are saying “we know you’re throwing.” The lone linebacker covers the back or TE. Runs are open — and they also eat clock.',
    group: 'dime',
  },

  // --- Coverages (Every Defensive Coverage Explained) ---
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
    id: 'cov-0-when',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'When do you usually see Cover 0?',
    answer: 'Critical third-and-long when the defense needs a sack',
    distractors: ['Short-yardage from the 1', 'First-and-10 from midfield', 'Every first-and-10'],
    explain:
      'Look for no deep safeties, press corners, and extra rushers. QB answer: hot slant or fade before the hit.',
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
    id: 'cov-1-qb',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'How can a quarterback create space vs Cover 1’s single-high safety?',
    answer: 'Look the safety off, then throw the vacated window',
    distractors: [
      'Always throw the first hitch no matter what',
      'Spike the ball',
      'Hand off to the center',
    ],
    explain:
      'Motion IDs man. Eyes move the free safety. Attack the mismatch — slot vs LB, or a bigger WR on a jump ball.',
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
      'Plays the boundary flat as a cloud corner',
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
    id: 'cov-2-under',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'In Cover 2 zone, how many defenders play the short zones underneath?',
    answer: 'Five',
    distractors: ['One', 'Two', 'Eight'],
    explain:
      'Two deep halves, five underneath. Corners are off, not pressed. Bend-but-don’t-break: swarm the short stuff, protect the sideline.',
    group: 'cover-2',
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
  {
    id: 'cov-2-buzz',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'What deception is Cover 2 buzz?',
    answer: 'It shows Cover 3, then the safety buzzes the flat and the corner drops deep',
    distractors: [
      'It is Cover 0 with no one deep',
      'Both linebackers blitz the A-gap',
      'The nickel walks out to cover the slot only',
    ],
    explain:
      'Inverted coverage: safety down, corner over the top. Kills screens. The “open” Cover 3 seam is a trap until the QB confirms post-snap.',
    group: 'cover-2-buzz',
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
    id: 'cov-tampa2-beat',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'How do you attack Tampa 2 after the Mike drops?',
    answer: 'Shallow crosses / slants in the vacated hole, or play-action to freeze him',
    distractors: [
      'Four verts only into the deep middle',
      'A sneak every snap',
      'A deep post into the dropped Mike',
    ],
    explain:
      'The deep middle is gone. Throw where the Mike left, or fake the run so he cannot get depth. Corner routes also stretch the two safeties.',
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
    distractors: ['Lead dive', 'Smash hitch and corner', 'Inside zone'],
    explain:
      'Cover 3 has two underneath defenders on a side and three deep. Flood puts three receivers on that side at different depths.',
    group: 'cover-3',
  },
  {
    id: 'cov-3-cloud',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'What is Cover 3 cloud?',
    answer: 'One corner stays shallow to jam and play the flat; a safety rotates to that deep third',
    distractors: [
      'Four deep quarters',
      'No one covers the flat',
      'Both safeties blitz',
    ],
    explain:
      'Disrupts timing and helps the run on that edge. If the rotating safety is late, the cloud side is vulnerable to a deep post or slot go.',
    group: 'cover-3-cloud',
  },
  {
    id: 'cov-3-buzz',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'What is Cover 3 buzz?',
    answer: 'It shows two-high Cover 2, then one safety buzzes down and the corners bail to thirds',
    distractors: [
      'It is man-free with no buzz',
      'The nose drops into the flat',
      'Everyone rushes',
    ],
    explain:
      'Offenses prepare for Cover 2’s middle seam and suddenly face Cover 3. Hold the first read and confirm the rotation.',
    group: 'cover-3-buzz',
  },
  {
    id: 'cov-4-job',
    topic: 'coverages',
    type: 'name-coverage',
    prompt: 'What is Cover 4 (quarters) designed to stop?',
    answer: 'Explosive shots down the field',
    distractors: ['All runs up the A-gap', 'Quick slants and screens', 'Option keep-and-pitch'],
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

  // --- Pressures (Every Blitz Concept Explained) ---
  {
    id: 'pr-sim',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What is simulated pressure?',
    answer: 'The defense shows extra rushers but only sends four',
    distractors: [
      'Seven rushers with no one deep',
      'A four-man rush with no movement',
      'A five-man fire zone with no dropper',
    ],
    explain:
      'If it is not more than four rushers, it is not a blitz. A dropping lineman replaces the late rusher so coverage is not empty.',
    group: 'simulated',
  },
  {
    id: 'pr-sim-hot',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What mistake does simulated pressure bait from the quarterback?',
    answer: 'A hot throw into the zone the dropping lineman just occupied',
    distractors: [
      'A sneak on third-and-20',
      'Holding the ball to wait out the rush',
      'Checking to a dive at the extra rusher',
    ],
    explain:
      'The nickel rushes, the QB thinks that flat is empty, and the defensive end who dropped is waiting for the throw.',
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
    id: 'pr-mike-plug',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What is a Mike plug?',
    answer: 'The middle linebacker shoots an A-gap as the fifth rusher',
    distractors: [
      'The Mike drops to a deep half',
      'The nickel covers the tight end',
      'The Will walks out to cover the slot',
    ],
    explain:
      'Interior A-gap is the shortest path to the QB. Second-level blitzes (Mike plug, dogs, double A) stress the OL’s ID.',
    group: 'second-level',
  },
  {
    id: 'pr-dog',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What is a Sam dog or Will dog?',
    answer: 'An outside linebacker rushing, usually through a B- or C-gap',
    distractors: [
      'A coverage drop to the deep middle',
      'A stunt by the two interior linemen only',
      'The Sam walking out to cover the slot',
    ],
    explain:
      'Dog = that linebacker is coming. Cross dog has the LBs exchange gaps. Double A sends both through the A-gaps.',
    group: 'second-level',
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
    id: 'pr-slide',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What does the offensive line ID first for slide protection?',
    answer: 'Which defender they are treating as the Mike',
    distractors: [
      'The corner’s press alignment only',
      'The safety’s depth only',
      'Which receiver is the X',
    ],
    explain:
      'Slide toward the ID’d Mike (zone that side, man the backside). Mis-ID the rusher and a Sam or Will comes free.',
    group: 'protection',
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
  {
    id: 'pr-hot',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What is a hot replace vs a blitz?',
    answer: 'Throw immediately into the zone the blitzer vacated',
    distractors: [
      'Run a dive at the blitzer',
      'Call timeout',
      'Snap to the guard',
    ],
    explain:
      'Extra rushers leave an empty zone. Elite answers are a hot route there plus a slide that IDs the Mike correctly.',
    group: 'protection',
  },
  {
    id: 'pr-peri',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What is a perimeter blitz?',
    answer: 'A corner, nickel, or safety rushing the edge or slot',
    distractors: [
      'Only the nose tackle twisting',
      'A Mike plug through the A-gap',
      'The Mike dropping to Cover 4',
    ],
    explain:
      'The back’s inside-out read is late to the edge. The DE on that side often spills inside so the nickel has a clean lane; the backside end contains so the QB cannot escape.',
    group: 'perimeter',
  },
  {
    id: 'pr-fire',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What is a fire zone?',
    answer: 'A five-man pressure with zone coverage behind it',
    distractors: [
      'A four-man rush with man coverage',
      'A six-man zero blitz with no dropper',
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
      'A coverage rotation after the snap',
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
    id: 'pr-loop',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What is a loop stunt?',
    answer: 'One rusher crashes inside; a teammate loops behind him into the vacated lane',
    distractors: [
      'Both corners blitz the flat',
      'The safety plays Cover 4',
      'The offense runs four verts',
    ],
    explain:
      'The crashing DT takes the guard with him. If the center climbs, the looping end has a clean A-gap.',
    group: 'stunt',
  },
  {
    id: 'pr-spike',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'What does a spike do for a nickel rusher?',
    answer: 'A lineman crosses a tackle’s face to occupy him and open the edge lane',
    distractors: [
      'The nickel drops into Cover 3',
      'The Mike plays a deep half',
      'The offense spikes the ball',
    ],
    explain:
      'The end slants across the OT/OG so both are occupied. The nickel comes free unless the back or a hot throw answers.',
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
      'The extra rusher must drop into the hole',
      'The offense cannot snap the ball',
    ],
    explain:
      'Seven rushers vs six or seven blockers: someone is free. If the quarterback wins the hot throw, there is no safety net.',
    group: 'zero',
  },
  {
    id: 'pr-bunch',
    topic: 'pressures',
    type: 'name-pressure',
    prompt: 'How do offenses often answer all-out pressure?',
    answer: 'Bunch the receivers so natural picks free a hot throw',
    distractors: [
      'Take a delay of game',
      'Send the center downfield',
      'Max-protect and throw a jump ball late',
    ],
    explain:
      'Three receivers in a tight triangle create traffic for man defenders. A half-step is enough if no one is deep.',
    group: 'zero',
  },
];