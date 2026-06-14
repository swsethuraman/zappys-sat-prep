# Phase 4 Kickoff: Firebase Auth + Firestore

This doc is the handoff for Claude Code to implement Phase 4 of
**Zappy's SAT Prep**: replacing the local-only `AsyncStorage` persistence
in `ProgressContext` with a real account system backed by Firebase
Authentication and Firestore — without changing how any screen consumes
`useProgress()`.

Drop this file in the project root (`zappys-sat-prep/PHASE4-FIREBASE-PLAN.md`)
and point Claude Code at it.

---

## Scope decisions — read before starting

- **Use the modular Firebase JS SDK** (`firebase` npm package, v9+), *not*
  `@react-native-firebase`. The latter requires native modules and a
  custom dev build (EAS), which would break the Expo Go / web testing
  loop we just got working. The JS SDK runs fine in Expo Go and on web.
- **Phase 4 = email/password auth only.** Google and Apple Sign-In need
  native redirect handling that's unreliable in Expo Go. Defer both to
  "Phase 4b" once we're building a custom dev client with EAS. (Apple
  Sign-In is only *required* by App Store guideline 4.8 once another
  social login — e.g. Google — ships, so deferring both together is
  fine.)
- **Firestore becomes the source of truth.** AsyncStorage can stay as an
  optional local cache for offline support, but that's a nice-to-have —
  don't block on it.
- **Don't over-engineer config secrecy.** Firebase web config (apiKey,
  projectId, etc.) is not a secret — security comes from Firestore
  Security Rules, not from hiding the config. It's fine to commit
  `src/firebase/config.ts` as-is. (A `.env` + `app.json` "extra" setup is
  a fine nice-to-have, but don't spend time on it if it adds friction.)

---

## 0. What the human (Swami) does first — Firebase Console setup

This part can't be done by Claude Code — it requires logging into Google.
Do this before/alongside Step 1:

1. Go to `console.firebase.google.com`, create a project (e.g.
   "zappys-sat-prep").
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → Create database → production mode → pick a
   region.
4. Project settings → "Your apps" → add a **Web app** → copy the config
   object (`apiKey`, `authDomain`, `projectId`, `storageBucket`,
   `messagingSenderId`, `appId`).

Hand that config object to Claude Code once it's reached Step 2 below.

---

## 1. Firestore schema

```
users/{uid}
  targetScore: number
  baselineScore: number | null
  currentScore: number | null
  sessionCount: number
  diagnosticDone: boolean
  actualScore: number | null
  actualDate: string | null
  mastery:   { linear: number, quad: number, ratios: number, stats: number,
               geometry: number, trig: number, grammar: number, reading: number }
  lastSeen:  { ...same 8 keys, numbers }
  poolIndex: { ...same 8 keys, numbers }
  createdAt: timestamp
  updatedAt: timestamp

users/{uid}/history/{sessionId}      (subcollection, append-only)
  n: number
  label: string
  score: number
  delta: number
  createdAt: timestamp
```

This mirrors `UserProgress` in `src/lib/types.ts` almost exactly — the
mastery/lastSeen/poolIndex maps and top-level scalars map 1:1 onto the
user doc, and `history` becomes a subcollection instead of an array (so
it scales and can be paginated later).

## 2. Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /history/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

---

## 3. Implementation checklist

Work through these **in order**, running `npx tsc --noEmit`, `npx eslint .`,
and `npx jest` after each step that touches code. Don't move on until the
current step is clean.

1. **Install**: `npx expo install firebase` — then confirm `npx expo
   start --web` still boots cleanly (the JS SDK can occasionally need a
   metro config tweak for web; if so, check Expo's Firebase web guide).

2. **`src/firebase/config.ts`** — initialize the Firebase app with the
   config object Swami provides. Export `auth` (from
   `getAuth(app)`) and `db` (from `getFirestore(app)`).

3. **`src/context/AuthContext.tsx`** — wraps Firebase Auth:
   - State: `user: User | null`, `isLoading: boolean`
   - `onAuthStateChanged` listener on mount
   - `signUp(email, password)`, `signIn(email, password)`, `signOut()`
   - On `signUp`, also create the initial `users/{uid}` doc via
     `setDoc(..., createInitialProgress())` plus `createdAt`/`updatedAt`.

4. **`src/screens/SignInScreen.tsx`** and **`SignUpScreen.tsx`** — simple
   email/password forms, styled like `WelcomeScreen` (reuse `Card`,
   `NumberField`-style text inputs, `Button`). Inline error display for
   "wrong password," "email already in use," etc. (Firebase error codes
   map to `error.code` — translate the common ones to friendly text.)

5. **`src/navigation/AuthNavigator.tsx`** — SignIn ⇄ SignUp. Wire into
   `RootNavigator`:
   - No `authUser` → `AuthNavigator`
   - `authUser` present, `progress.diagnosticDone === false` →
     `OnboardingNavigator`
   - `authUser` present, `diagnosticDone === true` → `MainTabs`
   - Wrap the whole tree in `AuthProvider` (outside `ProgressProvider`,
     since `ProgressProvider` now needs `authUser.uid`).

6. **Rewrite `ProgressContext.tsx`** to use Firestore instead of
   AsyncStorage, **keeping the exact same public API** (`progress`,
   `isLoading`, `setTargetScore`, `completeDiagnostic`, `completeSession`,
   `raiseTarget`, `setActualScore`, `setPoolIndex`, `reset`) so no screen
   needs to change:
   - On `authUser` change: subscribe to `users/{uid}` via `onSnapshot`
     (or a one-time `getDoc` + manual refetch — `onSnapshot` is nicer for
     keeping `currentScore` etc. live).
   - If the doc doesn't exist yet, create it with
     `createInitialProgress()`.
   - Every mutator (`setTargetScore`, `completeDiagnostic`, etc.) computes
     the new `UserProgress` exactly as today (reuse
     `applyDiagnosticResults` / `applySessionResults` / etc. from
     `lib/sessionBuilder.ts` and `lib/scoring.ts` — **don't touch those,
     they're pure and already tested**), then writes it back via
     `updateDoc` (or `setDoc` with merge).
   - `completeSession` additionally appends a doc to
     `users/{uid}/history` via `addDoc`.
   - `reset()` → overwrite the user doc with `createInitialProgress()`
     and (optionally) clear the `history` subcollection.

7. **Validate**: `npx tsc --noEmit`, `npx eslint .`, `npx jest`. If you
   factor out any new pure logic (e.g. a Firestore-doc ↔ `UserProgress`
   mapper), add unit tests for it alongside the existing ones in
   `src/lib/__tests__/`.

8. **STOP — manual test with Swami**: sign up with a real email/password
   in the running app, complete the diagnostic, confirm the doc appears
   in the Firestore console under `users/{uid}`, sign out, sign back in,
   confirm progress is restored. This needs Swami's actual Firebase
   project, so don't try to fake it.

9. **Commit**: `git add . && git commit -m "Phase 4: Firebase Auth + Firestore persistence"`

---

## Prompt to paste into Claude Code

```
I'm starting Phase 4 of zappys-sat-prep: Firebase Authentication +
Firestore persistence, replacing the AsyncStorage-only ProgressContext.

First read README.md and src/context/ProgressContext.tsx so you
understand the current architecture and the "seam" design — the public
API of useProgress() must not change. Then read PHASE4-FIREBASE-PLAN.md
in the project root for the full plan, schema, security rules, and
checklist.

I've created a Firebase project. Work through the checklist in
PHASE4-FIREBASE-PLAN.md in order, running tsc/eslint/jest after each step
that touches code, and don't move to the next step until the current one
is clean. When you reach the point of needing my Firebase web config
object, stop and ask me for it. Stop again before step 8 (manual
Firestore testing) since I'll need to drive that part myself.
```
