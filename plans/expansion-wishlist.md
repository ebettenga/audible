# Expansion wish list

Future directions for Audible beyond the current on-device training, playbook, and playground experience. These are **ideas only** — not committed scope. Use this doc to prioritize product work and split features into shippable phases.

App context: deterministic play builder + flashcard trainer (Expo / React Native). Today everything is local-first with seeded NFL-style playbooks (e.g. Packers / Bears).

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

## 4. Stat tracking and game analytics

**Goal:** **Stat tracking** and an **analytics** section to prepare for upcoming opponents and review past games.

**Possible capabilities:**

- Log games (opponent, date, home/away) and drive-level or play-level stats (down/distance, result, personnel, play type).
- Trend views: success rate by down, red zone, personnel, tendency vs what was trained.
- Pre-game prep: link opponent tendencies (manual entry or imported) to recommended installs from the playbook library; feeds [weekly game-prep learning (7)](#7-weekly-game-prep-learning-offense--defense-schemes).
- Post-game review: flag plays/concepts that broke down and tie them back to training gaps.

**Dependencies / notes:** Can start on-device only (single coach/team); richer workflows pair with (3) and optional import from spreadsheets or future integrations.

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
| A | Personal mode shell + pro playbook compare (2, 5 lite) | Extends current local app; no backend |
| B | Playbook matchup analysis (1) | Needs classification/metrics on existing plays |
| C | On-device game log + analytics (4 lite), manual weekly learning packs (7 lite) | Value before sync; coach-built collections per opponent |
| D | Team management + sync (3), roles/permissions + admin tabs (8), positional learning (6), weekly scheme learning (7), full analytics (4) | Backend, roster, schedule, RBAC, and curated game-week content |

---

## Related planning docs

- [playbook-real-features.md](./playbook-real-features.md) — playbook tab and play detail (largely shipped)
- [dashboard-real-features.md](./dashboard-real-features.md) — dashboard and learn flows
- [learn-dashboard-real-features.md](./learn-dashboard-real-features.md) — learn dashboard details
