# Zappy's SAT Prep — Mobile App (Expo / React Native)

Phases 1–3 of the [launch playbook](../zappys-launch-playbook.md): the app
is fully playable end to end on-device (diagnostic → dashboard →
sessions → profile), backed by local persistence. No backend yet — that's
Phase 4.

## Setup

```bash
npm install
npx expo start
```

Then press `i` for the iOS simulator, `a` for Android, or scan the QR
code with Expo Go on your phone.

> Note: this was built in a sandboxed environment without access to
> `api.expo.dev`, so `expo export` / the dependency "doctor" check
> couldn't run here. `npx tsc --noEmit`, `npx eslint .`, and `npx jest`
> all pass cleanly (41/41 tests). Running `npx expo start` on your
> machine (with normal internet access) should work without changes. If
> `expo install` complains about version mismatches, run
> `npx expo install --fix`.

## What's here

### Navigation (`src/navigation/`)
Root stack switches between the Onboarding flow (Welcome → Diagnostic →
DiagResults) and the Main tab bar (Dashboard, Practice, Schedule,
Profile), plus full-screen Session / SessionSummary modals. The initial
route is driven by `progress.diagnosticDone` from `ProgressContext`, so a
returning user lands straight on the Dashboard.

### Theme (`src/theme/`)
Color palette, font tokens (Space Grotesk / Inter / JetBrains Mono via
`@expo-google-fonts`), and the `masteryColor` / `masteryLabel` helpers.

### Data & scoring engine (`src/data/`, `src/lib/`)
- `data/concepts.ts` — the 8-concept taxonomy (6 Math, 2 Reading &
  Writing) with prerequisite links.
- `data/questions.ts` — 32-question bank (4 per concept) with OPACC-style
  pre-written misconception feedback for every wrong answer.
- `lib/scoring.ts` — mastery → 200-800 section score → 400-1600 total
  score, mastery updates, weakest-concept lookup.
- `lib/sessionBuilder.ts` — WAD warm-ups (spaced repetition), APDE
  prerequisite-aware targeting, diagnostic queue, and best/worst-case
  score projection.
- `lib/__tests__/` — 41 Jest tests covering all of the above.

### State (`src/context/ProgressContext.tsx`)
Wraps `UserProgress` (mastery map, history, target/baseline/current/actual
scores, pool cursors) in a React context, persisted to AsyncStorage under
`zappySAT:progress:v1`. **This is the seam Phase 4 swaps for Firestore** —
the same `setTargetScore` / `completeDiagnostic` / `completeSession` /
`raiseTarget` / `setActualScore` / `reset` API can be backed by Firestore
reads/writes instead of AsyncStorage without touching any screen.

### Shared UI (`src/components/`)
`Screen`, `Card`, `Eyebrow`, `BrandHeader`, `Button`, `NumberField` (basic
primitives), plus app-specific pieces: `QuestionCard` (shared by
diagnostic and practice sessions, with OPACC feedback), `MasteryBar`,
`ChargeMeter` (SVG lightning-bolt fill toward target score), and
`ScoreTrajectory` (history bar chart).

### Screens (`src/screens/`)
- **WelcomeScreen** — target-score input (400-1600, step 10).
- **DiagnosticScreen** — 16 shuffled questions, then hands off to
  DiagResultsScreen.
- **DiagResultsScreen** — starting score, Math/R&W split, mastery bars
  sorted weakest-first with prerequisite call-outs.
- **DashboardScreen** — projected score, charge meter, score trajectory,
  top-3 focus areas, next-session preview with projected point range, and
  an "exceeded target" banner with a one-tap target raise.
- **SessionScreen** — runs a built session (warm-up → optional prereq
  refresher → main set) through `QuestionCard`.
- **SessionSummaryScreen** — score delta, correct/total, updated mastery
  for touched concepts, and the "ready to exceed target" banner.
- **PracticeScreen** — session history + start CTA.
- **ProfileScreen** — target editor, baseline/projection/target/actual
  comparison, actual-SAT-score logging, and a reset option.
- **ScheduleScreen** — still a placeholder (Phase 5: SAT date picker +
  `expo-notifications` reminders).

## Next: Phase 4 (Firebase)

- Firebase Auth (email / Google / Apple — Apple Sign-In is required by
  App Store guideline 4.8 since the app will support other social logins
  eventually).
- Firestore schema: `users/{uid}` (targetScore, baselineScore,
  currentScore, sessionCount, scheduledSAT, actualScore, actualDate),
  `users/{uid}/mastery/{conceptId}`, `users/{uid}/history/{sessionId}`.
- Swap `ProgressContext`'s AsyncStorage calls for Firestore
  reads/writes/listeners — the public API (`progress`, `setTargetScore`,
  `completeDiagnostic`, etc.) shouldn't need to change.
- Add an AuthNavigator in front of `RootNavigator`.

See the playbook for ready-to-paste prompts for Phases 4-10.
