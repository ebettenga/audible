# Audible

Deterministic football play builder + flashcard trainer (Expo / React Native).

Defaults to **Packers 2026** (offense + defense) and **Bears 2026** playbooks seeded on device.

A playcall string such as `I Right 999 Y-Pop` is parsed against dictionaries of formations, routes, protections, runs, fronts, and coverages, then resolved into a serializable `PlayScene`. `FieldCanvas` is the shared play drawing surface (turf, LOS, hashes, yard numbers, players, routes, and zones) — same input always yields the same diagram.

## Install on Android (APK)

Download the latest APK from [`releases/audible-1.0.0.apk`](./releases/audible-1.0.0.apk) (arm64 phone build).

1. On your phone: Settings → allow installs from this source / unknown apps for your browser or Files.
2. Open the APK and install.
3. Launch **Audible** — Packers + Bears seeds load automatically.

## Quick start (dev)

```bash
npm install
npm start          # Expo dev server
npm test           # Golden + unit tests
npm run typecheck
```

### Local Android APK rebuild

Requires JDK 17 + Android SDK. Then:

```bash
export JAVA_HOME="$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
npx expo prebuild --platform android
cd android && ./gradlew app:assembleRelease -PreactNativeArchitectures=arm64-v8a
# APK: android/app/build/outputs/apk/release/app-release.apk
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

## Future expansion (wish list)

Product ideas for later phases (matchup comparison, coach team management, positional and weekly game-prep learning, stats/analytics, personal/fan mode) are captured in [plans/expansion-wishlist.md](./plans/expansion-wishlist.md).
