# Error Journal + Per-Question Response Logging

Handoff for Claude Code to implement the **error journal**: missed pool
questions are tracked per user and resurfaced for a delayed retry 24+
hours later, clearing only when answered correctly. Also bundles
**per-question response logging** into session history (instrumentation
for future item-difficulty calibration — cheap now, valuable later).

Drop this in the project root (`zappys-sat-prep/ERROR-JOURNAL-PLAN.md`).

Evidence basis: delayed re-attempt of missed questions is the
highest-impact prep tactic identified in our research pass (corroborated
independently by Khan Academy's 12-hour mastery-challenge gate). Retrying
immediately tests short-term memory of the answer letter; retrying after
a day tests whether the concept stuck.

---

## Scope decisions — read before starting

- **Rides on the seen-tracking rails.** `missedQuestions` follows the
  exact same house pattern as `seenQuestions` (types.ts +
  `createInitialProgress()` + `userDocFields()` + mapper default +
  updated in `completeSession`'s atomic batch). No new packages, no
  native APIs — fully 🌐 WEB-VERIFIABLE.
- **Pool questions only.** Diagnostic questions (the 16 with
  `diagnostic: true`) never enter the journal — same boundary discipline
  as HN-09 / the seen-set's defensive filter.
- **v1 clearing rule: one correct delayed retry clears the entry.**
  (Khan requires a streak; one is simpler and right for v1.)
- **Retry timing: due 24 hours after the miss.** On a missed *retry*,
  the entry stays with `missCount` incremented and a fresh 24h due time
  — no interval expansion, no reset-to-zero punishment.
- **Journal updates on session COMPLETION only**, consistent with the
  burn-on-complete decision for seen-tracking. Abandoned sessions change
  nothing.
- **UI is deliberately minimal in v1.** Retries flow into the existing
  warm-up slot of sessions — no new screen. Optional small touches only
  (see Step 5).

---

## Expected outcome + failure modes to guard against

**Expected outcome:** wrong answers on pool questions create journal
entries; sessions built 24h+ later serve up to 3 due retries at the top
of the warm-up; a correct retry clears the entry; history docs now
record per-question results. No screen API changes; tsc/eslint/jest
clean.

- **FJ1 — Retries must bypass the unseen filter.** Journal questions
  are by definition already in `seenQuestions`. The session builder's
  pool selection excludes seen IDs — due retries must be injected
  *before/around* that filter, not swallowed by it. Also ensure a
  question served as a retry isn't double-served in the same session's
  main set.
- **FJ2 — Diagnostic exclusion.** Filter journal writes to real pool
  IDs only (reuse/mirror the existing defensive filter from
  `recordSeenQuestions`).
- **FJ3 — Existing docs predate the field.** Mapper defaults absent
  `missedQuestions` to `{}`; never crash.
- **FJ4 — Atomicity.** Journal updates go in the same `writeBatch` as
  history + seenQuestions in `completeSession`.
- **FJ5 — Clearing must work through ANY correct answer**, not only
  designated retries: if a journaled question resurfaces via pool
  recycle in a normal slot and is answered correctly, it still clears.
  Rule: for every question answered in a completed session — correct →
  delete any journal entry; wrong (and pool) → upsert entry.
- **FJ6 — No duplicate entries.** Journal is keyed by questionId, so
  upsert semantics; a repeat miss updates, never appends.
- **FJ7 — reset() clears the journal** (should fall out of
  `userDocFields()` automatically — verify).
- **FJ8 — Time handling must be pure/testable.** Due-ness computation
  takes an injectable `now`; ISO strings in Firestore. No reliance on
  device-local quirks beyond `Date.now()`.
- **FJ9 — Natural size bound.** Keyed by questionId, the journal can't
  exceed the pool (224 entries theoretical max) — no cap logic needed;
  note this in a comment.

---

## 1. Data model

In `src/lib/types.ts`, on `UserProgress`:

```ts
missedQuestions: Record<string, MissedQuestion>;  // keyed by questionId

interface MissedQuestion {
  concept: ConceptId;
  missCount: number;
  lastMissedAt: string;  // ISO
  dueAt: string;         // ISO — lastMissedAt + 24h
}
```

Add to `createInitialProgress()` (`{}`), `userDocFields()`, and the
Firestore mapper (default absent → `{}`, FJ3).

Constant: `RETRY_DELAY_HOURS = 24` in `src/lib/` next to the journal
logic.

## 2. Pure journal logic (`src/lib/errorJournal.ts` + tests)

Pure functions, all taking `now` where relevant:

- `updateJournal(journal, results, now)` — `results` is
  `{questionId, concept, correct, isPool}[]` from the completed session.
  Correct → remove entry if present (FJ5). Wrong AND pool → upsert with
  `missCount + 1` (or 1) and fresh `dueAt` (FJ2, FJ6).
- `dueRetries(journal, now, max = 3)` — entries with `dueAt <= now`,
  oldest `dueAt` first, capped at `max`. Returns questionIds.

Unit tests in `src/lib/__tests__/`: new-miss creates entry with correct
dueAt; repeat miss increments missCount and refreshes dueAt; correct
answer clears (including non-retry path); diagnostic/unknown IDs
rejected; due selection respects timing, ordering, and cap; injectable
clock throughout.

## 3. Session builder integration

In `buildSession` (main practice path):

- Compute `dueRetries(...)` first. These occupy the first warm-up slots,
  before WAD material (they're the highest-value retrieval practice
  available). Fill any remaining warm-up capacity via WAD as today.
- Exclude retry IDs from the main-set selection for that session (FJ1's
  double-serve guard).
- `buildFocusedSession` (Trainer "Practice this topic"): include due
  retries **for that concept only**, same slot logic. Diagnostic queue:
  untouched.
- Queue items already carry `questionId` (from the merge) — tag retry
  items so the UI *could* label them (Step 5), but nothing downstream
  may depend on the tag.

## 4. completeSession + instrumentation

In `ProgressContext.completeSession`:

- Build the per-question `results` array (id, concept, correct, isPool)
  — the session flow already knows correctness per question for scoring;
  thread it through rather than recomputing.
- `updateJournal(...)` → write the new `missedQuestions` in the SAME
  `writeBatch` as history + seenQuestions (FJ4).
- **Instrumentation:** add `responses: {questionId: string, correct:
  boolean}[]` to the history doc written on completion. No reads, no UI
  — pure data collection for future item-difficulty calibration.

## 5. UI (minimal, optional-but-cheap)

- On `QuestionCard` when the item is a tagged retry: a small "⚡ Retry"
  chip/eyebrow — one conditional render, reusing existing tokens.
- On `PracticeScreen`, if any entries are currently due: one line, e.g.
  "3 questions are back for a rematch." Skip if it adds friction.
- Nice-to-have, skip freely: if an entry reaches `missCount >= 3`,
  surface the existing Trainer "Learn" link for that concept next to the
  journal line (ties the journal to lessons; zero new navigation).

## 6. Validate

`npx tsc --noEmit`, `npx eslint .`, `npx jest` after each step. New
tests per Step 2; confirm existing 75 still pass (session builder
changes must not disturb seen-tracking tests).

## 7. STOP — manual web test (Swami drives)

The 24h gate is tested by editing Firestore directly — no test-only code
paths needed:

1. Complete a session, deliberately missing 2–3 questions → in the
   Firestore console, confirm `missedQuestions` entries exist with
   correct concept, `missCount: 1`, and `dueAt` ≈ +24h. Correctly
   answered questions: absent.
2. Start the next session immediately → confirm NO retries appear (not
   due yet).
3. In the console, edit one entry's `dueAt` to yesterday → build a new
   session → confirm that question appears at the top of the warm-up
   (with the Retry chip if implemented) and does not repeat in the main
   set.
4. Answer the retry correctly, complete the session → entry gone from
   Firestore.
5. Repeat 3 but answer the retry WRONG → entry persists, `missCount: 2`,
   fresh `dueAt`.
6. Confirm a history doc now contains the `responses` array.
7. Old account loads cleanly (absent field → `{}`); `reset()` clears the
   journal.

Target status on pass: 🌐 WEB-VERIFIED.

## 8. Commit (only after Swami confirms)

```bash
git add . && git commit -m "Error journal: 24h delayed retry of missed questions + per-question response logging"
```

Then propose (as a diff for Swami to apply — HUMAN_NOTES is
human-maintained) a short HN entry: journal keyed by questionId,
24h retry, one-correct-clears, updates on completion only, history docs
now carry per-question responses.

---

## Prompt to paste into Claude Code

```
New feature on zappys-sat-prep: the error journal. Read HUMAN_NOTES.md
first, then ERROR-JOURNAL-PLAN.md in the project root for the full plan
and failure modes.

Core design: missed POOL questions (never diagnostic) go into a
missedQuestions map on UserProgress keyed by questionId, with a 24h dueAt;
sessions serve up to 3 due retries at the top of the warm-up slot; ANY
correct answer to a journaled question clears it; a missed retry
increments missCount and refreshes dueAt. Journal updates happen only in
completeSession, in the same writeBatch as history + seenQuestions. Also
add per-question response logging ({questionId, correct}[]) to history
docs — instrumentation only, no reads.

Follow the same house pattern as seenQuestions for the new field
(types.ts, createInitialProgress, userDocFields, mapper default to {}).
Keep the journal logic pure in src/lib/errorJournal.ts with an injectable
clock, and mind FJ1: retries must bypass the unseen filter and must not
double-serve in the same session.

Work Steps 1–6 in order, running tsc/eslint/jest after each step. Stop
before Step 7 — I'll drive the manual web test (using Firestore console
edits to fast-forward dueAt) — and stop again before the commit.
```
