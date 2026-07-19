# Question Bank Merge + Seen-Question Tracking

Handoff for Claude Code to (1) integrate 208 new pool questions (26 per
concept × 8 concepts) from the staged `QUESTIONS-*-EXPANSION.md` files into
`src/data/questions.ts`, and (2) add per-concept **seen-question tracking**
to `ProgressContext` + the session builder so practice sessions stop
repeating questions.

Drop this in the project root (`zappys-sat-prep/QUESTION-BANK-MERGE-PLAN.md`)
and point Claude Code at it.

This task touches `questions.ts`, `ProgressContext.tsx`, and the session
builder simultaneously. It is **purely additive to the pool** and must not
alter the diagnostic set (HN-09). It adds **no new packages** and **no
native-only APIs**, so it is fully testable and verifiable on web
(`npx expo start --web`) — target state on completion is 🌐 WEB-VERIFIED.

---

## Scope decisions — read before starting

- **Additive to the pool only.** The 16 diagnostic questions (2 per
  concept) are tied to APDE calibration (HN-09) and must not change —
  not content, not IDs, not answer keys, not ordering relative to how the
  diagnostic selects them. The merge only *adds pool questions*.
- **Current vs. target counts (resolves a doc inconsistency).**
  - **Current** (README, Phases 1–3): 32 questions = **2 diagnostic + 2
    pool** per concept.
  - **Target** (post-merge): 240 questions = **2 diagnostic + 28 pool**
    per concept (28 = 2 existing pool + 26 new).
  - HN-09 describes the *target* (2 diag + 28 pool) in the present tense.
    Do **not** read it as "28 pool questions already exist" — today there
    are 2 pool questions per concept, and this merge brings that to 28.
- **Seen-tracking is ID-based, and supersedes `poolIndex`.** The existing
  `poolIndex` cursor wraps immediately when a concept has only 2 pool
  questions — that is the root of the repetition bug. Index cursors are
  also unstable across a pool that changes size/order (which this merge
  does), so switch to an **explicit seen-set keyed by stable question
  IDs**. Leave the `poolIndex` field in the Firestore doc untouched (no
  destructive migration); just stop reading/advancing it. Do **not** run
  both mechanisms at once.
- **No new dependencies, no native APIs.** Pure data + pure logic + one
  new Firestore field. HN-04 (`--legacy-peer-deps`) and HN-02
  (`Platform.OS` guarding) do not apply here.
- Reuse the established `ProgressContext` mutator pattern
  (`setScheduledSAT` / `setActualScore`) for the new field, and keep the
  pure logic in `src/lib/` with tests (per the house convention).

---

## Expected outcome + failure modes to guard against

**Expected outcome:** `questions.ts` grows 32 → 240 (2 diag + 28 pool per
concept), diagnostic questions byte-for-byte unchanged, and the session
builder draws from a per-concept *unseen* set persisted in a new
`seenQuestions` field. No screen changes. `tsc`/`eslint`/`jest` clean.

**Diagnostic/pool boundary (HN-09) — highest risk:**
- **F1.** If diagnostic questions are identified *positionally* rather than
  by an explicit flag, appending/re-sorting silently reassigns the
  diagnostic set. → **Step 1 verifies** the marker before anything else;
  the pool is always derived by *filtering out* diagnostic questions.
- **F2.** A bulk regenerate of `questions.ts` could overwrite/renumber the
  diagnostic questions. → Merge is strictly additive; a snapshot test locks
  the 16 diagnostic IDs.
- **F3.** Diagnostic questions must never enter `seenQuestions` and must
  never be draw-eligible in practice sessions.

**Seen-tracking / Firestore:**
- **F4.** Keeping `poolIndex` *and* `seenQuestions` live invites desync. →
  `seenQuestions` is the single source of truth; `poolIndex` is read-never,
  write-never (left in the doc only for backward compat).
- **F5.** New field must be added in **all three** places (`types.ts`,
  `createInitialProgress()`, `userDocFields()`) + a mutator, mirroring
  Phase 5's `setScheduledSAT`. Missing one leaves existing docs reading
  `undefined`.
- **F6.** Existing docs predate the field → the Firestore→`UserProgress`
  mapper must default absent `seenQuestions` to empty per concept, never
  crash (SECURITY-REVIEW A3).
- **F7.** Pool exhaustion (all 28 seen) must **recycle**, not return an
  empty session or throw.
- **F8.** Write `seenQuestions` once per session at `completeSession`,
  batched with the history append — never per-question (SECURITY-REVIEW D2
  atomicity, cost).

**ID scheme / validation:**
- **F9.** New IDs must not collide with existing ones and must not
  renumber diagnostic IDs.
- **F10.** Existing count-based test assertions ("32 questions", "4 per
  concept") will fail and must be updated to the new counts — *tightened*,
  not loosened. Loosening a boundary assertion to make a test pass is the
  wrong fix.

---

## 1. Verify the current structure (do this first, change nothing yet)

Read and confirm, before editing:
- `src/data/questions.ts` — how is a question shaped (`Question` type)? How
  is a **diagnostic** question distinguished from a **pool** question — an
  explicit field (e.g. `diagnostic: true`), two separate arrays, or
  position? **This determines the whole merge.** Note the existing ID
  scheme and the current per-concept counts.
- `src/lib/sessionBuilder.ts` — how does it currently pick pool questions?
  Where does `poolIndex` come in? Confirm the repetition mechanism.
- `src/context/ProgressContext.tsx` — the mapper (Firestore doc ⇄
  `UserProgress`), `userDocFields()`, and the `completeSession` write path
  (history `addDoc` + user-doc `updateDoc`).
- `src/lib/types.ts` — `UserProgress` and `ConceptId`.
- One `QUESTIONS-*-EXPANSION.md` file — confirm each new question carries
  everything `Question` requires (options, correct index, and OPACC
  feedback for **every** wrong answer).

Report back the diagnostic/pool marker and the ID scheme before proceeding.
If diagnostic questions are only positionally distinguished, **stop and
flag it** — that needs an explicit marker added first, and that's a
diagnostic-baseline-adjacent change worth confirming with Swami.

## 2. Merge the pool questions (additive only)

- Transcribe the 26 new questions per concept from each
  `QUESTIONS-*-EXPANSION.md` into `questions.ts` as **pool** questions
  (matching whatever marker Step 1 identified), faithfully preserving
  option text, correct answer, and OPACC feedback.
- **Do not touch** the 2 diagnostic questions per concept.
- **Do not renumber** the 2 existing pool questions per concept.
- Assign new IDs with a stable, collision-free scheme consistent with the
  existing convention found in Step 1 (e.g. continue the pool sequence per
  concept). Every ID unique across the whole bank.
- End state per concept: 2 diagnostic + 28 pool = 30; 240 total.

Run `npx tsc --noEmit` and `npx eslint .` — the type shape and lint must be
clean before moving on.

## 3. Add the `seenQuestions` field to `UserProgress`

Mirror the Phase 5 `setScheduledSAT` pattern exactly:
- **`types.ts`**: `seenQuestions: Record<ConceptId, string[]>` on
  `UserProgress`.
- **`createInitialProgress()`**: initialize all 8 concepts to `[]`.
- **`userDocFields()`**: include `seenQuestions` in the Firestore write
  shape.
- **Mapper (Firestore → `UserProgress`)**: default absent `seenQuestions`
  (and any absent per-concept key) to `[]` — existing docs won't have it
  (F6).
- Leave `poolIndex` in the schema and mapper as-is; do not delete it.

No new mutator is strictly required if `seenQuestions` is only updated
inside `completeSession` (Step 5). Do **not** expose a per-question write.

## 4. Seen-aware selection (pure logic in `src/lib/`)

Factor the selection into a pure, testable function in `src/lib/` (e.g.
`selectPoolQuestions(concept, count, seenIds)`):
- Pool for a concept = all questions for that concept **minus** diagnostic
  questions (F1/F3).
- Candidates = pool questions whose ID is **not** in `seenIds[concept]`.
- If candidates ≥ needed: draw from candidates (shuffle as today).
- If candidates run short / empty (all seen): **recycle** — reset that
  concept's seen-set and draw fresh (F7). (V1: full reset is fine; a
  least-recently-seen tail is a nice-to-have, not required.)
- Returns the selected question IDs so the caller can record them.

Wire the session builder to call this instead of advancing `poolIndex`.

## 5. Record seen questions on session completion

- In `completeSession` (ProgressContext), after a session's questions are
  served, append their IDs to `seenQuestions[concept]` (dedup per concept),
  and write it in the **same** Firestore update as the existing history
  append (F8). Prefer a `writeBatch` / transaction so the history `addDoc`
  and the user-doc `updateDoc` are atomic (SECURITY-REVIEW D2); if the
  current code does them sequentially, batching them is a small, safe
  improvement — otherwise keep the existing ordering and note it.
- `reset()` must also clear `seenQuestions` back to 8 empty arrays
  (alongside whatever it already resets).

## 6. Validate

Run `npx tsc --noEmit`, `npx eslint .`, `npx jest` — all clean.

Update existing count assertions to the new totals (240 total; 30/concept;
2 diag + 28 pool). Add tests in `src/lib/__tests__/`:
- **Bank shape**: exactly 30 per concept = 2 diagnostic + 28 pool; 240
  total.
- **ID uniqueness**: every question ID unique across the bank.
- **Diagnostic snapshot**: the 16 diagnostic question IDs match a
  hard-coded expected list (locks HN-09 — fails loudly if a diagnostic ID
  ever changes).
- **OPACC completeness**: every pool question has feedback for every wrong
  answer.
- **Selection logic**: given a seen-set, `selectPoolQuestions` excludes
  seen IDs; when all are seen it recycles and still returns a full set;
  diagnostic questions are never returned.

## 7. STOP — manual web test with Swami

Do not commit yet. Hand back for a web test (`npx expo start --web`):
1. Fresh account → complete the diagnostic (confirms the 16 diagnostic
   questions still flow correctly and scoring baseline is unaffected).
2. Run several back-to-back practice sessions on one concept → confirm
   questions **don't repeat** until the 28-question pool is exhausted, then
   confirm it recycles cleanly.
3. Refresh the page mid-way → confirm `seenQuestions` persisted (Firestore)
   and the next session continues without repeating.
4. Existing account (yours, pre-dating the field) → confirm it loads
   without error (absent `seenQuestions` defaults to empty) and behaves the
   same.
5. `reset()` → confirm seen-tracking clears.

Target status on pass: **🌐 WEB-VERIFIED** for the merge + seen-tracking.
(No native path to verify here — nothing device-only was added.)

## 8. Commit (only after Swami confirms the manual test)

```bash
git add .
git commit -m "Question bank merge (240 questions) + seen-question tracking"
```

Update HUMAN_NOTES.md HN-09 if appropriate to reflect the now-current
counts, and (optionally) add a note that `poolIndex` is deprecated in favor
of `seenQuestions`.

---

## Prompt to paste into Claude Code

```
New task on zappys-sat-prep: the question bank merge + seen-question
tracking. Read HUMAN_NOTES.md first (esp. HN-09 diagnostic/pool boundary,
HN-04, HN-02), then QUESTION-BANK-MERGE-PLAN.md in the project root for the
full plan, failure modes, and checklist.

This is purely additive to the pool — the 16 diagnostic questions (2/concept)
are tied to APDE calibration and must NOT change (content, IDs, answer keys,
or ordering). Note the doc reconciliation in the plan: today there are 2 pool
questions per concept; this merge brings that to 28 (2 existing + 26 new),
for 240 total. HN-09's "28 pool" is the target, not current state.

Start with Step 1: read questions.ts, sessionBuilder.ts, ProgressContext.tsx,
and types.ts and tell me how diagnostic vs. pool questions are distinguished
and what the current ID scheme is — before editing anything. If diagnostic
questions are only distinguished positionally, STOP and flag it.

Then work Steps 2–6 in order, running tsc/eslint/jest after each step that
touches code and not moving on until clean. Key design points: switch pool
selection from the poolIndex cursor to an ID-based seenQuestions set
(Record<ConceptId, string[]>) added to UserProgress in types.ts +
createInitialProgress() + userDocFields() + the mapper (defaulting absent to
empty for existing docs); leave poolIndex in the doc but stop using it;
record seenQuestions once per session in completeSession, batched with the
history write; recycle when a concept's pool is exhausted.

Stop before Step 7 (manual web test) — I'll drive that myself — and stop
again before the Step 8 commit until I confirm the web test passed.
```
