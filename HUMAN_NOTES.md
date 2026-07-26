# HUMAN_NOTES.md — Zappy's SAT Prep

Human-maintained. Do NOT overwrite or auto-generate. Each entry captures
a decision, a gotcha, or a "why we did it this weird way" that should
survive across Claude Code sessions. Update when something surprising
happens or a non-obvious architectural choice is made.

Last updated: 2026-07 (post Reminders v2)

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

**Why Individual**: Organization enrollment (for Beneficus AI branding
— company renamed from AltruistAI in 2026-07 after a name clash)
requires a D-U-N-S number and Apple verification (days of wait vs.
minutes for Individual). Since the app is pre-release and internal-only,
Individual was chosen for speed.

**Future migration path**: If Beneficus AI Organization enrollment
completes later, re-registering the app under that team is a config
change (new bundle ID, new App Store Connect listing), NOT a rebuild of
the codebase. The code is identical; only the EAS/Apple configuration
changes.

**Bundle ID**: `com.swaminathan.zappysatprep` — tied to Individual
account. An Organization account would use a different bundle ID (e.g.,
`com.beneficusai.zappysatprep`).

**Update (2026-07)**: Beneficus AI is now a registered legal entity.
D-U-N-S number applied for via Apple's lookup tool (free path; ~5–30
business days). Chosen migration path: **convert** the existing
Individual membership to Organization (Apple Developer Support request
once the D-U-N-S arrives) rather than enrolling a separate new account —
one membership, credentials and app records carry over, and this
supersedes the "new bundle ID required" assumption above (conversion can
keep the existing bundle ID; renaming to `com.beneficusai.*` pre-release
is still tidier but optional). After conversion, cut a fresh EAS build so
signatures/profiles show Beneficus AI. Do the conversion BEFORE any App
Store submission so the seller name is the company, not a person. Play
Console ($25 one-time), when needed, gets registered under Beneficus from
day one.

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

## Product direction

### HN-13: Generative AI in the student path — the gate comes first
**Standing rule (2026-07)**: Zappy's currently has ZERO generative AI in
the student path — questions, lessons, and OPACC coaching are all
human-authored, pre-computed content. That is a deliberate feature, not a
gap. No LLM-generated content (questions, explanations, feedback, advice,
or recommendations) reaches a student without first passing a verification
gate: answer-key/fact verification, human method review, and calibration
against real response data. **The catching system gets built before the
generative feature — never the reverse.** An AI confidently teaching a
wrong method, or recommending a scholarship with a hallucinated deadline,
is a false axiom a 16-year-old cannot catch. (Same propose → verify →
ship discipline as the Claude Code workflow, promoted to a product rule:
the burden of catching mistakes lives in the system, before the student —
never with the student.)

**Applications decided so far**:
- **Scholarship matching** (idea, unbuilt): a verified-and-fresh listings
  database is the prerequisite; the matching agent comes second. The moat
  is the verified data, not the algorithm.
- **AI counselor** (idea, unbuilt): highest-stakes case — advice to
  minors about consequential decisions, with no cheap automated way to
  verify advice quality. Fully behind the gate; no timeline.
- **Social/leaderboards**: if ever built, effort-based and opt-in ONLY —
  never rank students by scores or projections. Score comparison is
  anxiety machinery for this audience and inverts the product's
  compete-with-your-past-self thesis.
- **Parent visibility**: parent-as-supporter, not surveillance —
  aggregate effort/trajectory only (sessions, trend, countdown), never
  per-question detail or live monitoring. v1 is a weekly digest email,
  not a dashboard. Any cross-user Firestore access is a deliberate
  security-rules extension (see SECURITY-REVIEW B1–B4), never a casual
  one.
- **Equity/schools distribution**: the offline-first OPACC architecture
  and the web build are the intended path to low-connectivity, low-cost
  hardware settings (Chromebooks, budget Android). Protect offline
  viability in future architecture decisions.
- **Skilled trades (lateral market, identified 2026-07)**: apprenticeship
  entry tests and trade licensing exams are the same shape of problem as
  the SAT (gated exams, weak incumbent prep, math/reading overlap with
  the existing bank). Entry-aptitude tests are the natural beachhead;
  licensing exams fragment by state and need trade-expert content
  authoring. Deep Research landscape pass commissioned; NOTHING gets
  built until the current SAT queue ships. Named on the vision one-pager
  as the "beyond college" arc.

---


## Distribution & testing

### HN-14: Remote testers need PREVIEW builds, not development builds
**Why**: a `development`-profile build is a dev-client shell with no
bundled JS — it requires a live Metro connection (`npx expo start
--dev-client`) on the same network to run at all. A remote tester
(Varun) opening a development build sees only the "connect to a
development server" screen. The `preview` profile bundles the JS
self-contained: installs and runs standalone. Rule: builds for anyone
who can't reach your Metro get `--profile preview`.

Related facts learned the hard way:
- EAS internal-distribution artifacts (the .ipa/.apk files) are deleted
  after ~30 days; install links die with them. Reinstalls after that
  need a fresh build. Install pages/links are unlisted-but-unauthenticated
  (anyone with the link can install; Android has no device-registration
  gate, unlike iOS) — share privately, fine at 2-tester scale, revisit at
  beta.
- Android needs no paid account, no device registration, and no
  interactive credential steps for sideloaded internal builds — EAS
  auto-generates and stores the keystore on first build. The $25 Google
  fee applies only to Play Store distribution, not sideloading.
- Web deploys via Firebase Hosting (`npx expo export --platform web` →
  `firebase deploy --only hosting`) are the zero-install tester path;
  the project's `.web.app` domain is pre-authorized for Firebase Auth.
  Remember: hosting serves the JS bundled at export time — re-export and
  re-deploy after every change testers should see.

---


### HN-15: firebase.json's default node_modules ignore strips bundled fonts — and dev-web ≠ exported-web
**Discovered**: First Firebase Hosting deploy (infinite spinner on the
live site; 511× "Failed to decode downloaded font").

**Root cause**: `firebase init` writes `ignore: ["**/node_modules/**"]`
into firebase.json — sensible for source dirs, poison for an Expo web
export, whose dist/ legitimately contains
`assets/node_modules/@expo-google-fonts/…` TTFs. The ignore stripped
every font at deploy time; the SPA rewrite then served index.html for
those URLs; the browser tried to decode HTML as a font; `useFonts`
never resolved → infinite spinner. **Fix**: that pattern is removed
from firebase.json — do not re-add it. Plus `useZappyFonts` now
proceeds after load, error, or a 4s timeout, so the app can never hang
on fonts again.

**The larger lesson (HN-12's sibling)**: `expo start --web` dev-server
behavior ≠ the exported bundle. Hosted-web issues must be verified
against `npx expo export --platform web` output served statically —
the dev server had been masking this the whole time.

---

### HN-16: Reminders v2 — daily practice anchor + taper, not countdowns
**Since**: 2026-07 (replaces Phase 5 reminder logic entirely).

**What**: The Phase 5 milestone-countdown notifications (T-14 / T-3 /
day-of) are GONE. Replaced by (1) a user-chosen daily practice-time
reminder — `reminderTime: string | null` ("HH:mm", 24h local) on
`UserProgress` — and (2) one day-before "taper" notification at 19:00
local the evening before `scheduledSAT` (scheduled only if that evening
is still ahead).

**Why**: research pass — countdown notifications are anxiety-inducing
and breed extrinsic dependency (adherence collapses when nudges stop).
An implementation intention (student picks a routine-anchored time)
plus a single rest-and-confidence taper message is the evidence-backed
pattern.

**Field pattern**: `reminderTime` follows HN-11 exactly (types.ts +
createInitialProgress null + userDocFields + mapper default + a
`setReminderTime` mutator).

**Scheduling invariant**: cancel-ALL-then-reschedule — on any change to
`reminderTime` or `scheduledSAT`, and once on native startup
(idempotent reconciliation), cancel every scheduled notification and
schedule the current set fresh. The app schedules nothing else, so
cancel-all also cleared legacy Phase 5 notifications off existing
devices. Pure trigger/message logic in `src/lib/reminders.ts`
(injectable clock, tested); OS wiring in `src/lib/notifications.ts`.
Permission is requested when the user first SETS a time (not on
launch); denial still saves the time.

---

### HN-17: Dynamic import() of native modules fails on the dev client
**Discovered**: Reminders v2 device test (red screen on boot).

`const X = await import('expo-notifications')` throws "Requiring
unknown module" at runtime on the dev client, even though it bundles
fine for web. Use a STATIC top-level
`import * as Notifications from 'expo-notifications'` with
`Platform.OS === 'web'` early-returns around the CALLS (HN-02) —
importing a native-only module is web-safe; only its APIs are
native-only. This is the pattern Phase 5 used and the one that's
device-verified. Applies to any native-only module (notifications,
view-shot, sharing, etc.). Guard calls, never imports.

---

### HN-18: Daily notification triggers defer to tomorrow if the minute just passed
**Discovered**: Reminders v2 device test (looked like a non-fire).

An expo-notifications DAILY trigger whose target minute has already
passed today (even by seconds) correctly schedules for the NEXT day —
it does not fire moments later. A 1-minute test lead can put the target
minute effectively in the past and masquerade as a bug. When testing
daily reminders on-device, set the target 3+ minutes ahead.

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
- Error journal (24h delayed retry + response logging): 🌐 WEB-VERIFIED,
  📦 COMMITTED
- Reminders v2 (daily anchor + taper): ✅ DEVICE-VERIFIED (notification
  fired on-device), 🌐 WEB-VERIFIED, 📦 COMMITTED — web REDEPLOY pending
  so production stops showing the old countdown copy (HN-14 rule)
- Web app: LIVE on Firebase Hosting (zappys-sat-prep.web.app) post
  font fix (HN-15); Android preview APK built, link with Varun
- Taxonomy research verdict received: current 8-concept structure
  graded structurally misaligned vs the digital SAT blueprint — 4+4
  domain migration is the next major phase (plan doc forthcoming);
  College Targets and the stats-widget pilot deliberately wait behind it
- Question bank merge + seenQuestions: 🌐 WEB-VERIFIED, 📦 COMMITTED
- Trainer v1 (8 lessons): ✅ DEVICE-VERIFIED (spot-checked), 📦 COMMITTED
  in cleanup — was uncommitted working-tree code until then (HN-12)
- Phase 7 EAS config: ✅ DEVICE-VERIFIED, 📦 COMMITTED in cleanup,
  tagged v0.7.0
