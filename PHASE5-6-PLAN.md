# Phase 5 & 6 Kickoff: Scheduling, Reminders & Shareable Results

Handoff for Claude Code to implement Phase 5 (SAT date + reminders) and
Phase 6 (actual-score comparison + shareable results) together. Drop this
in the project root (`zappys-sat-prep/PHASE5-6-PLAN.md`).

---

## Scope decisions — read before starting

- **Both phases touch features that are partially or fully native-only**:
  local notifications (`expo-notifications`) and view-capture/sharing
  (`react-native-view-shot`, `expo-sharing`). Testing right now happens via
  `npx expo start --web`, and these APIs either don't exist or behave very
  differently on web.
- **Guard every native-only call with `Platform.OS` checks** so nothing
  crashes on web. On web, degrade gracefully — skip scheduling
  notifications, or show a "this works on your phone" style message
  instead of erroring.
- **Don't try to make these fully functional on web.** That's explicitly
  not a goal. What *should* work and get tested on web today: the new UI
  (date picker, countdown, comparison card), the underlying data/math
  (countdown calculation, Firestore sync of new fields), and confirming
  nothing throws when the native-only bits are skipped. Full device
  testing of notifications and native sharing happens in Phase 7.
- Reuse existing patterns: `Card`/`Eyebrow`/`Button`/`NumberField` from
  `src/components/ui.tsx`, the color/font tokens in `src/theme/colors.ts`,
  and the mutator pattern already established in `ProgressContext`
  (`setTargetScore`, `setActualScore`, etc.) for any new Firestore fields.

---

## Phase 5: SAT Scheduling + Reminders

### 1. Data model

- Add `scheduledSAT: string | null` (ISO date, `"YYYY-MM-DD"`) to
  `UserProgress` in `src/lib/types.ts`, `createInitialProgress()`, and
  `userDocFields()`.
- Add `setScheduledSAT(date: string | null)` to `ProgressContext`'s public
  API — same write-to-Firestore pattern as `setActualScore`.

### 2. ScheduleScreen rewrite

- `npx expo install @react-native-community/datetimepicker` (has a web
  fallback via `<input type="date">`, so it's safe to use even though we're
  primarily testing on web right now).
- Date picker to set/change the SAT date.
- A countdown card: "X days until your SAT" — or, if no date is set yet, a
  prompt to pick one.
- (Nice-to-have, skip if it adds friction) a small contextual line using
  existing data, e.g. relating days-remaining to `sessionCount` or the gap
  to `targetScore`.

### 3. Reminders (expo-notifications)

- `npx expo install expo-notifications`.
- When `scheduledSAT` is set/changed, (re)schedule local notifications at
  T-14 days, T-3 days, and day-of, with short Zappy-flavored messages.
- Request notification permissions on first use — **native only**
  (`if (Platform.OS === 'web') return;` before any permission/scheduling
  calls).
- If you factor out the "compute reminder dates from scheduledSAT" logic
  as a pure function, put it in `src/lib/` and add unit tests — that part
  *is* testable everywhere.

---

## Phase 6: Actual-Score Comparison + Shareable Results

### 1. ShareCard component

- New `src/components/ShareCard.tsx` — a nicely-styled card using the
  existing ink/zap/mint palette, showing baseline → projection → target →
  actual with deltas. Aim for a roughly square aspect ratio, since it's
  meant to be captured as a shareable image.

### 2. ProfileScreen additions

- Render `ShareCard` (it can be off-screen/in a hidden view used only for
  capture) once `actualScore` is set.
- `npx expo install react-native-view-shot expo-sharing`.
- "Share my results" button:
  - Capture `ShareCard` via `react-native-view-shot`'s `captureRef` →
    PNG.
  - Share via `expo-sharing`'s `shareAsync`.
  - **On web**: `react-native-view-shot` and `expo-sharing` have limited/no
    support. Guard accordingly — e.g. detect `Platform.OS === 'web'` and
    instead show the captured image (if capture works at all on web) in a
    modal with a "right-click to save" hint, or simply show a message like
    "Sharing is available on the mobile app." Don't let this block
    validation — a graceful message is a perfectly good outcome for web.

---

## Validation

Same as Phase 4: `npx tsc --noEmit`, `npx eslint .`, `npx jest` after each
step that touches code. Any new pure logic (countdown math, reminder-date
calculation) gets unit tests in `src/lib/__tests__/`.

## Manual test (human-driven, on web)

1. **Schedule tab**: set a SAT date, confirm the countdown shows the right
   number of days, refresh the page, confirm it persisted (Firestore).
2. **Profile tab**: with an `actualScore` already set (from Phase 3/4
   testing), confirm `ShareCard` renders with correct numbers and the
   "Share" button doesn't crash — whatever it does on web (real share
   sheet, fallback modal, or message) is fine as long as it's intentional,
   not an error.
3. Notifications and native image-sharing are **deferred** to Phase 7
   (real device build) — no need to test those today.

---

## Prompt for Claude Code

```
Continuing zappys-sat-prep: let's do Phase 5 (SAT scheduling + reminders)
and Phase 6 (actual-score comparison + shareable results) together.

Read PHASE5-6-PLAN.md in the project root for the full plan and checklist.
Key constraint: this app is currently tested via npx expo start --web, but
expo-notifications, react-native-view-shot, and expo-sharing are primarily
native features. Guard all such calls with Platform.OS checks so nothing
crashes on web — graceful degradation (skip, or show a "works on your
phone" message) is the correct outcome on web, not full functionality.
Don't spend time trying to make these fully work on web.

Work through Phase 5 first, then Phase 6, running tsc/eslint/jest after
each step that touches code. Stop at the end of each phase for a manual
web test before moving on, and stop again before any git commit so I can
confirm the manual test passed first.
```
