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
- Assignments: “install” or collection assigned to individuals or the whole team with due dates.
- Knowledge dashboard: per-player SRS / quiz performance, plays marked weak or overdue, team-wide heatmaps by concept or formation.
- Coach actions: assign remedial sets, pin priority plays, notes visible to staff (not necessarily to all players).

**Dependencies / notes:** Likely needs sync/auth and a backend (or team invite + shared storage). Today the app explicitly avoids team/collab without backend; this item is the main driver for that infrastructure.

---

## 4. Stat tracking and game analytics

**Goal:** **Stat tracking** and an **analytics** section to prepare for upcoming opponents and review past games.

**Possible capabilities:**

- Log games (opponent, date, home/away) and drive-level or play-level stats (down/distance, result, personnel, play type).
- Trend views: success rate by down, red zone, personnel, tendency vs what was trained.
- Pre-game prep: link opponent tendencies (manual entry or imported) to recommended installs from the playbook library.
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

## Suggested sequencing (informal)

| Phase | Focus | Rationale |
|-------|--------|-----------|
| A | Personal mode shell + pro playbook compare (2, 5 lite) | Extends current local app; no backend |
| B | Playbook matchup analysis (1) | Needs classification/metrics on existing plays |
| C | On-device game log + analytics (4 lite) | Value before sync |
| D | Team management + sync (3) + full analytics (4) | Backend and permissions |

---

## Related planning docs

- [playbook-real-features.md](./playbook-real-features.md) — playbook tab and play detail (largely shipped)
- [dashboard-real-features.md](./dashboard-real-features.md) — dashboard and learn flows
- [learn-dashboard-real-features.md](./learn-dashboard-real-features.md) — learn dashboard details
