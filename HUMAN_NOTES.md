# HUMAN_NOTES.md — Zappy's SAT Prep

Human-maintained. Do NOT overwrite or auto-generate. Each entry captures
a decision, a gotcha, or a "why we did it this weird way" that should
survive across Claude Code sessions. Update when something surprising
happens or a non-obvious architectural choice is made.

Last updated: 2026-07

---

## Stack decisions

### HN-01: JS Firebase SDK, not @react-native-firebase
**Decision**: We use the official `firebase` JavaScript SDK (initialized
in `src/firebase/config.ts`), not the `@react-native-firebase` native
module package.

**Why**: At project start, Expo SDK 56 + bare RN workflow compatibility
with `@react-native-firebase` was uncertain, and the JS SDK is
well-tested with Expo. The JS SDK supports Auth, Firestore, and
`onSnapshot` listeners — everything we need — without native module
compilation.

**Implication**: Every new Firebase feature (e.g., FCM push
notifications at scale, offline persistence beyond the default 1-tab
cache) should be checked against JS SDK capability before assuming it
works. If we ever need `@react-native-firebase`, it's a significant
migration, not a swap.

---

### HN-02: Platform.OS guarding is mandatory for all native-only APIs
**Convention**: Any API that doesn't exist on web must be wrapped with
a `Platform.OS` check. The pattern is:

```ts
if (Platform.OS === 'web') {
  // graceful fallback — show a message, skip, or no-op
  return;
}
// native-only code here
```

**Affected packages (as of Phase 7)**:
- `expo-notifications` — scheduling/permissions don't exist on web
- `react-native-view-shot` — capture doesn't work on web
- `expo-sharing` — share sheet doesn't exist on web
- `@react-native-community/datetimepicker` — works on web via
  `<input type="date">` fallback but styling is bare-HTML, not native
- `expo-apple-authentication` — iOS only, guard against both web AND
  Android
- `@react-native-google-signin/google-signin` — native only

**Why this matters**: `npx expo start --web` is the primary dev/test
loop. Any native-only code that isn't guarded will crash the web build
and block development. A graceful web message is always the right
fallback — we don't need web parity, just non-crashing behavior.

---

### HN-03: Expo Go is NOT usable for this project
**Why**: Expo SDK 56 was not available in the Expo Go App Store release
at project start. Expo Go ships a fixed SDK version; once your project
exceeds it, you need a dev client build via EAS.

**What this means in practice**: Any new developer joining the project
cannot use Expo Go. They need to run `eas build --profile development`
to get a dev client build on their device, then connect to Metro via
`npx expo start --dev-client`. This is the correct workflow. Do NOT
direct anyone to use Expo Go.

---

### HN-04: npm install always needs --legacy-peer-deps
**Problem**: Node v24.x + npm v11.x enforce strict peer dependency
resolution. Several Expo/React Native packages have peer dependency
ranges that conflict with each other at that strictness level, causing
`npm install` to fail without the flag.

**Fix**: Always use:
```powershell
npm install <package> --legacy-peer-deps
```
Or, for `npx expo install` (which shells out to npm internally and
doesn't pass this flag):
```powershell
npm install <package> --legacy-peer-deps
# then verify compatibility:
npx expo install --check
```
**Do NOT** attempt to resolve the peer dependency conflicts themselves —
they're false positives from npm's resolver, not actual runtime
incompatibilities.

---

## Bugs and gotchas

### HN-05: Alert.alert silently does nothing on React Native Web
**Discovered**: Phase 6 (ShareCard "Share" button).

**Root cause**: The RNW (React Native Web) shim for `Alert.alert` only
calls `window.confirm` when a `buttons` array is passed. The simple
two-argument form (`Alert.alert(title, message)`) is a no-op on web —
no dialog appears, no error thrown.

**Fix applied**: Don't use `Alert.alert` for web-facing UI. Either use a
`Platform.OS` branch (native path uses `Alert.alert`, web path shows a
static message or a React component), or replace the button entirely
with a visible static note on web.

**Example**: The Share button on ProfileScreen was replaced entirely on
web with a mint-colored text line: "⚡ Sharing is available on the Zappy
mobile app."

---

### HN-06: getReactNativePersistence doesn't exist in web bundle
**Discovered**: Phase 4 (Firebase Auth).

**Root cause**: `getReactNativePersistence` from `firebase/auth` is only
available in the React Native bundle, not the web bundle. Calling it
unconditionally causes a runtime error in the browser.

**Fix applied**: Platform.OS branch at Firebase auth initialization:
```ts
const persistence =
  Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage);
initializeAuth(app, { persistence });
```

**Also needed**: A module augmentation in
`src/types/firebase-auth-rn.d.ts` because the TS types for
`getReactNativePersistence` aren't included in the main `firebase/auth`
type definitions. See that file for the declaration.

---

### HN-07: EAS credential steps require interactive TTY — Claude Code cannot run them
**Discovered**: Phase 7.

**Affected steps** (must be run by a human in their own terminal, NOT
through Claude Code):
- `eas login` — opens browser for OAuth
- `eas device:create` — interactive prompts + Apple ID auth + profile
  installation on physical device
- `eas build` (first time per project) — Apple certificate and
  provisioning profile generation requires confirming interactive prompts

**Pattern**: Claude Code can run `eas build:configure` and subsequent
builds (once credentials exist), but any first-time credential flow or
device registration must be done manually. When handing Phase 7 to
Claude Code, it will correctly identify these steps and prompt you to
run them yourself.

---

### HN-08: Firebase console navigation changed — Authentication is under "Security," not "Build"
**Discovered**: During Phase 7 password reset troubleshooting.

**Old path**: Build → Authentication → Users
**Current path (as of 2026)**: Security → Authentication → Users

This affects any instructions in plan docs or README that reference
the old navigation path — they're stale and should be updated if
encountered.

---

## Architecture decisions

### HN-09: Question bank — diagnostic questions vs. pool questions are distinct
**Updated 2026-07 (question bank merge).**

**Structure**: Each concept has exactly 30 questions (2 diagnostic +
28 pool), 240 total. The boundary is enforced by **data, not position**:
every question carries a stable `id` (`{concept}-d{n}` for diagnostic,
`{concept}-p{n}` for pool) and a **required** `diagnostic: boolean`
flag. Diagnostic and pool sets are always derived by filtering on the
flag — never by array position or index.

**Diagnostic questions**: The fixed 16 (`{concept}-d1`/`-d2`) used in
the initial diagnostic. They are tied to APDE calibration and must NOT
change — not content, not IDs, not answer keys. A snapshot test in
`src/data/__tests__/questions.test.ts` hard-codes the 16 expected IDs
and fails loudly if any drift. Do not "update" that test to make a
change pass — a failure there means the change itself is wrong (or is a
deliberate re-baselining, which requires revalidating diagnostic
scoring).

**Pool questions**: The 28 per concept used in practice sessions,
subject to seen-question tracking (HN-11). Adding new pool questions is
safe (continue the `-p{n}` ID sequence); it doesn't affect the
diagnostic.

**Standing decision (2026-07, research-backed)**: the fixed 16-question
diagnostic stays. Full IRT-based adaptive testing is structurally
unviable at this bank size (needs 8–10× pool and ~500 responses/item to
calibrate), and even a two-stage MST split would require an equating
study against the current APDE baseline that isn't worth the cost at
this scale. Don't propose making the diagnostic adaptive without
reading the CAT/IRT research summary first.

---

### HN-10: Apple Developer account is Individual, not Organization
**Account**: Swami Sethuraman (Individual), Team ID `9AHMN5N4DL`.

**Why Individual**: Organization enrollment (for AltruistAI branding)
requires a D-U-N-S number and Apple verification (days of wait vs.
minutes for Individual). Since the app is pre-release and internal-only,
Individual was chosen for speed.

**Future migration path**: If AltruistAI Organization enrollment
completes later, re-registering the app under that team is a config
change (new bundle ID, new App Store Connect listing), NOT a rebuild of
the codebase. The code is identical; only the EAS/Apple configuration
changes.

**Bundle ID**: `com.swaminathan.zappysatprep` — tied to Individual
account. An Organization account would use a different bundle ID (e.g.,
`com.altruistai.zappysatprep`).

---

### HN-11: poolIndex is deprecated — seenQuestions is the pool-selection mechanism
**Since**: Question bank merge (2026-07).

**What**: Practice-session pool selection is driven by
`seenQuestions: Record<ConceptId, string[]>` on `UserProgress` — an
ID-based seen-set — NOT by the old `poolIndex` cursor. `poolIndex`
remains in existing Firestore docs untouched for backward compatibility
but is never read or written. Do not resurrect it: index cursors
silently desync whenever the pool changes size or order.

**Semantics**:
- Seen IDs burn on session **completion**, not start — an abandoned
  session doesn't consume questions. The write happens in
  `completeSession` in the same `writeBatch` as the history append
  (atomic).
- When a concept's full 28-question pool is exhausted, recycle resets
  that concept's seen-set to just the newly-served IDs, so a recycled
  pool never immediately repeats the previous session.
- A defensive filter ensures only real pool IDs enter the seen-set —
  diagnostic or unknown IDs are rejected.
- The Firestore→UserProgress mapper defaults an absent `seenQuestions`
  to empty (accounts predating the field load cleanly).

**Pattern to reuse**: any new per-user question-tracking field (e.g. the
error journal's `missedQuestions`) should follow this same shape:
types.ts + `createInitialProgress()` + `userDocFields()` + mapper
default + updated only in `completeSession`'s atomic batch.

---

## Process

### HN-12: A green working tree does not mean green commits
**Discovered**: Question bank merge commit. The commit didn't typecheck
standalone (`SessionScreen.tsx` referenced a route param typed in an
uncommitted `navigation/types.ts`), because every tsc/jest run during
the task validated the **working tree**, which silently included
uncommitted Trainer files the committed code depended on. Separately
discovered in the same cleanup: Trainer v1 and the Phase 7 EAS config
had never been committed at all — "device-verified" said nothing about
git state, and a disk failure would have lost both.

**Rules**:
1. Start Claude Code tasks from a clean `git status` whenever possible;
   end every task prompt with "confirm `git status` is clean at finish."
2. Before declaring a commit done, verify it **standalone**: stash
   uncommitted work, run `npx tsc --noEmit`, restore the stash.
3. "Done" claims include a git claim — verified features must also be
   committed. Use the COMMITTED tag below when the distinction matters.

---

## Status taxonomy (for phase docs)

Use these tags when describing feature status. Never use "done" alone —
always specify what "done" means.

| Tag | Meaning |
|-----|---------|
| ✅ DEVICE-VERIFIED | Tested on physical iPhone (dev build) |
| 🌐 WEB-VERIFIED | Tested on web only; native path untested |
| 🔲 GRACEFUL-STUB | Intentional degraded fallback (e.g., web share message) |
| 📋 PLANNED | Designed/specced, not yet implemented |
| ⚠️ KNOWN-GAP | Limitation logged; not blocking; future work |
| 📦 COMMITTED | In git history as a standalone-verified commit (see HN-12) |

**Current state of Phase 5/6 native features (as of Phase 7 commit):**
- expo-notifications scheduling: ✅ DEVICE-VERIFIED (permission prompt
  confirmed on-device)
- react-native-view-shot capture: ✅ DEVICE-VERIFIED (Share button
  confirmed working on-device, shared to WhatsApp)
- expo-sharing share sheet: ✅ DEVICE-VERIFIED
- DateTimePicker native styling: ⚠️ KNOWN-GAP (dark-mode contrast issue;
  TODO comment added near component)
- Varun's device: 📋 PLANNED (registration link sent; build pending his
  confirmation)

**As of the 2026-07 repo cleanup:**
- Question bank merge + seenQuestions: 🌐 WEB-VERIFIED, 📦 COMMITTED
- Trainer v1 (8 lessons): ✅ DEVICE-VERIFIED (spot-checked), 📦 COMMITTED
  in cleanup — was uncommitted working-tree code until then (HN-12)
- Phase 7 EAS config: ✅ DEVICE-VERIFIED, 📦 COMMITTED in cleanup,
  tagged v0.7.0
