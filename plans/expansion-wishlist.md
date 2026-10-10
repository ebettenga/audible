# Expansion wish list

Future directions for Audible beyond the current on-device training, playbook, and playground experience. These are **ideas only** — not committed scope. Use this doc to prioritize product work and split features into shippable phases.

App context: deterministic play builder + flashcard trainer (Expo / React Native). Today everything is local-first with seeded NFL-style playbooks (e.g. Packers / Bears).

---

## Product thesis: execution readiness + play intelligence

Audible should organize its roadmap around two questions:

1. **Can our players execute the play?**
2. **Is the play working, in which contexts, to what extent, and how can we improve it?**

These form one closed learning loop:

> Define the play → teach each position → verify understanding → observe practice/game reps → grade execution → analyze outcomes in context → improve the play or teaching plan → repeat.

### Pillar 1: Can players execute?

Readiness should distinguish three levels instead of treating quiz completion as proof of execution:

- **Knowledge:** can the player identify the call, assignment, read, adjustment, and responsibility?
- **Practice execution:** can the player perform it correctly at speed against representative looks?
- **Game execution:** can the player recognize the context and execute under game conditions?

Each play should connect position-specific learning, quiz evidence, coach-graded practice/game reps, mistakes, and film clips. Coordinators should be able to see readiness by player, position group, play, concept, and weekly install.

### Pillar 2: Are plays working?

Play intelligence must separate **design effectiveness** from **execution quality**. A bad outcome does not prove a bad play if an assignment was missed; a good result does not prove a sound design if it depended on a broken tackle.

Every recorded rep should link:

- **Play identity and version:** exact play, tags/checks, and which revision was run.
- **Context:** practice/game, opponent, down/distance, field zone/hash, score/clock, personnel, formation/motion, and observed front/coverage/pressure.
- **Outcome:** yards, success/explosive/negative result, score/turnover, pressure, or coach-defined objective.
- **Execution grades:** assignment, decision/read, technique, timing, and position/player responsible.
- **Evidence:** film clip, coach notes, and corrections/learning assigned afterward.

Analytics should expose sample size and uncertainty, compare like contexts, and avoid declaring a play “good” or “bad” from a few reps. The useful output is actionable: **keep it, change it, teach it differently, call it only in specific contexts, or remove it.**

---

## 1. Playbook comparison (matchup analysis)

**Goal:** Compare two playbooks side by side to surface strengths and weaknesses in a hypothetical team-vs-team matchup.

**Possible capabilities:**

- Pick offense playbook A vs defense playbook B (or full team vs full team).
- Highlight conceptual gaps: run vs front, pass concepts vs coverage families, personnel mismatches.
- Summarize “advantage” areas (where one playbook’s tendencies exploit the other’s structure) without requiring live game film.
- Export or share a short matchup report for coaches or study groups.

**Dependencies / notes:** Builds on existing play parsing, `PlayScene`, and dictionary coverage. May need tagging or classification of plays (run/pass, concept family) beyond raw playcall strings.

---

## 2. Professional team playbook comparison

**Goal:** Compare **professional** (or curated pro-style) team playbooks to see how teams stack up at a schematic level.

**Possible capabilities:**

- Library of named team playbooks (already seeded locally; could expand).
- Aggregate stats: formation mix, run/pass tendency proxies, route/concept diversity, defensive front and coverage distribution.
- Head-to-head comparison view (Team X vs Team Y) using the same metrics as (1), oriented toward fan/education use as well as coaching prep.

**Dependencies / notes:** Requires consistent metadata across seeded playbooks and clear licensing/branding boundaries for “pro team” content.

---

## 3. Team management (coach mode)

**Goal:** A **team management** area where coaches assign playbooks for players to train on and monitor knowledge at the play level.

**Possible capabilities:**

- Roster: players, roles, optional groups (e.g. position groups).
- **Position assignment** per player (primary/secondary); feeds [positional learning (6)](#6-positional-learning-coach-curated).
- Assignments: “install” or collection assigned to individuals or the whole team with due dates; **game-week learning packs** for upcoming opponents (see [7](#7-weekly-game-prep-learning-offense--defense-schemes)).
- Knowledge dashboard: per-player SRS / quiz performance, plays marked weak or overdue, team-wide heatmaps by concept or formation.
- Coach actions: assign remedial sets, pin priority plays, notes visible to staff (not necessarily to all players).
- **Staff roles and permissions** — see [admin views & permissions (8)](#8-admin-views-permissions-and-play-review).

**Dependencies / notes:** Likely needs sync/auth and a backend (or team invite + shared storage). Today the app explicitly avoids team/collab without backend; this item is the main driver for that infrastructure. Player/student UX should hide coach-only surfaces per (8).

---

## 4. Stat tracking, contextual analytics, and play data mining

**Goal:** **Stat tracking** and contextual **play intelligence** that helps coordinators prepare for opponents, review past games, and decide whether a problem comes from the play design, play call, or execution.

**Possible capabilities:**

- Log games (opponent, date, home/away) and drive-level or play-level stats (down/distance, result, personnel, play type).
- Tag every rep with the play/version, situation, offensive and defensive looks, result, execution grade, and linked film.
- Trend views: success rate by down, field zone, hash, personnel, formation/motion, opponent front/coverage/pressure, and tendency vs what was trained.
- Compare **all reps** with **correctly executed reps** to expose whether poor results are driven by design/call context or player execution.
- Slice a play without losing the denominator: attempts, success/explosive/negative rates, yards or expected value where supported, execution score, sample size, and confidence/“not enough data” warnings.
- Surface actionable findings: best/worst contexts, recurring assignment failures, likely tendency tells, and candidate changes to the play or learning plan.
- Pre-game prep: link opponent tendencies (manual entry or imported) to recommended installs from the playbook library; feeds [weekly game-prep learning (7)](#7-weekly-game-prep-learning-offense--defense-schemes).
- Post-game review: flag plays/concepts that broke down and tie them back to training gaps.

**Dependencies / notes:** Requires stable play IDs/versioning and a shared rep/context/grade model so practice, film, games, learning, and analytics refer to the same play. Start with fast manual tagging and CSV import; automation should assist rather than invent context or grades. Richer workflows pair with (3), film-linked evidence, and optional integrations.

---

## 5. Personal mode (outside team mode)

**Goal:** A **personal mode** for users who are not on a team roster — learning tool and fan exploration.

**Possible capabilities:**

- Toggle or separate navigation from “team/coach” flows (when they exist).
- Self-directed learning paths: favorite team playbooks, compare how teams play (ties to 2).
- Personal progress only: streaks, mastery by topic, custom collections without roster assignment.
- Optional “follow team” bookmarks and notifications for new seeded content (future).

**Dependencies / notes:** Should reuse Train, Playbook, and Playground with simplified IA; no backend required for v1 of personal mode if content stays local.

---

## 6. Positional learning (coach-curated)

**Goal:** Coaches assign each player a **position** (or multiple), and the player gets a **learning section** curated to the understanding that role requires — not the full playbook generic view.

**Possible capabilities:**

- Coach sets position on roster (e.g. QB, Z, Mike LB, nickel); optional depth chart or side of ball (offense/defense/ST).
- **Position learning home:** topic tiles and drills filtered by role — assignments, reads, landmarks, route tree slice, front/ coverage responsibilities, etc.
- Tie installs to position: same team play, different emphasis (WR sees routes/tags; OL sees protection and calls; DB sees coverage rules and keys).
- Progress scoped by position competencies (e.g. “Mike: run fits weak”, “Z: option routes overdue”) visible to coach in (3).
- Player can still browse full playbook when allowed; default Train/Learn path follows assigned position.
- During game week, position path prioritizes plays and concepts from the active [weekly learning pack (7)](#7-weekly-game-prep-learning-offense--defense-schemes).

**Dependencies / notes:** Needs a position → curriculum map (metadata on plays/concepts and existing Train topics). Overlaps heavily with (3) for assignment and (5) for self-serve fans who pick a position without a coach. Can prototype on-device with a single coach managing a local roster before sync.

---

## 7. Weekly game-prep learning (offense & defense schemes)

**Goal:** Each week, coaches publish **learning sections** focused on the **offensive and defensive schemes** (and tendency package) the team must understand for the **upcoming opponent** — separate from generic install work and aligned to that game on the schedule.

**Possible capabilities:**

- **Game week object:** opponent, date, home/away; coach selects or builds an opponent schematic profile (fronts, coverages, run/pass looks, key concepts).
- **Weekly learning pack:** curated modules for offense side (“their defensive looks we must recognize / beat”) and defense side (“their offensive schemes we must defend”), plus special teams if needed.
- **Learn tab for the week:** dedicated entry point (“Week 6 vs …”) with flashcards, diagram quizzes, and playbook clips tied to those schemes; completion tracking per player and position group.
- **Auto-suggestions:** derive pack content from playbook comparison (1), opponent playbook library (2), and coach notes; coach edits before publish.
- **Roll-forward:** after the game, archive the week; tie review items to post-game analytics (4) for “we didn’t know their RPO package” style gaps.

**Dependencies / notes:** Connects schedule/opponent data (4), coach assignments (3), and position-filtered delivery (6). Can start as a manual “weekly collection” template before full opponent modeling.

---

## 8. Admin views, permissions, and play review

**Goal:** **Students/players** see a learning-focused app (Learn, assigned playbook views, Playground where appropriate) while **Build** and **Team** are **coach/admin-only** tabs, gated by a **permission system**. Staff can be granted scoped abilities (e.g. add offensive or defensive plays) with an optional **review workflow** before content reaches the team install.

**Possible capabilities:**

- **Role model:** at minimum `student`, `coach`, `admin` (head coach / program admin); optional custom staff titles mapped to permission bundles.
- **Tab & route visibility:** hide **Build** (play builder / `index` tab today) for students; hide **Team** (roster, assignments, analytics — when shipped) unless the user has team-admin permission. Deep links to builder or team routes redirect or show “not available for your role”.
- **Granular coach permissions** (assignable by admin):
  - View vs edit playbook / collections
  - **Add offensive plays** vs **add defensive plays** (side-of-ball scoped create)
  - Publish directly vs **submit for review** only
  - Manage roster, assign learning packs, view all player progress vs position group only
- **Review process:** submitted plays/edits enter a queue; reviewers (admin or designated coordinators) approve, request changes, or reject; approved items merge into the shared team playbook; students never see draft/submitted-unapproved content.
- **Audit trail:** who created/changed/approved a play (ties to play detail Activity concept).

**Dependencies / notes:** Requires authenticated team membership and server-side (or synced) policy enforcement — hiding tabs in the client alone is not sufficient. Overlaps (3) for Team tab, existing Play Builder for Build tab, and playbook storage today (local-only). Personal mode (5) treats the user as self-admin with full Build access unless they join a team as a student.

---

## Suggested sequencing (informal)

| Phase | Focus | Rationale |
|-------|--------|-----------|
| Foundation | Stable play/version IDs + rep/context/execution-grade model + film links | Makes readiness and play analytics trustworthy |
| A | Personal mode shell + pro playbook compare (2, 5 lite) | Extends current local app; no backend |
| B | Playbook matchup analysis (1) | Needs classification/metrics on existing plays |
| C | On-device rep grading + contextual analytics (4 lite), manual weekly learning packs (7 lite) | Closes the first execution-to-outcome learning loop |
| D | Team management + sync (3), roles/permissions + admin tabs (8), positional learning (6), weekly scheme learning (7), full analytics (4) | Backend, roster, schedule, RBAC, and curated game-week content |

---

## Related planning docs

- [playbook-real-features.md](./playbook-real-features.md) — playbook tab and play detail (largely shipped)
- [dashboard-real-features.md](./dashboard-real-features.md) — dashboard and learn flows
- [learn-dashboard-real-features.md](./learn-dashboard-real-features.md) — learn dashboard details
