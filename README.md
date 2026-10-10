# Football Flashcards

Deterministic football play builder + flashcard trainer (Expo / React Native).

A playcall string such as `I Right 999 Y-Pop` is parsed against dictionaries of formations, routes, protections, runs, fronts, and coverages, then resolved into a serializable `PlayScene`. `FieldCanvas` is the shared play drawing surface (turf, LOS, hashes, yard numbers, players, routes, and zones) — same input always yields the same diagram.

## Quick start

```bash
npm install
npm start          # Expo dev server
npm test           # Golden + unit tests
npm run typecheck
```

## Playcall grammar

```
Formation  Strength?  Modifier*  (Fake)? Run?  RouteDigits?  Tag*  Protection?
```

Examples:

- `I Right 999 Y-Pop` — I formation, three go routes, Y highlighted
- `I Right Slot Fake 24 Lead 989 F Angle 68` — slot, run fake, routes, FB angle, gap labels
- `Shotgun Right 979`
- `I Left 888 Cover 3` — strength mirror + coverage overlay

## Project layout

| Path | Role |
|------|------|
| `src/core/` | Pure TS: field math, Zod schemas, parser, resolver (no RN imports) |
| `src/data/` | Dictionaries: formations, routes, runs, protections, fronts, coverages, zones |
| `src/render/` | Play drawing surface: turf field, player chips, route arrows, coverage zones |
| `src/training/` | Card generator, SM-2-lite SRS, AsyncStorage playbooks |
| `app/` | Expo Router screens: Train, Playground, Playbook |

## Apps screens

1. **Train** — topic tiles (personnel, formations, play calls, routes, zones, coverages, field positions)
2. **Playground** — live playcall → diagram with defense/coverage toggles
3. **Playbook** — collections/installs, real FieldCanvas previews, sort/filter, play detail with notes/activity
