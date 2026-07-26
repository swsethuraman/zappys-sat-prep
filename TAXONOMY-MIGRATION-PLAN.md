# Taxonomy Migration: 4+4 Blueprint Alignment

Handoff for Claude Code to restructure Zappy's 8-concept taxonomy from
the legacy 6-math/2-R&W split to the College Board's official 4+4
domain structure, per the digital-SAT blueprint research verdict. Drop
this in the project root (`zappys-sat-prep/TAXONOMY-MIGRATION-PLAN.md`).

This is the largest structural change since Phase 4. It is phased, and
**Phase A (this doc's implementation scope) contains three explicit
HUMAN GATES** where Claude Code stops and Swami approves before
proceeding. Phases B (content build-out) and C (SPR format) are scoped
here for context but implemented later under their own tasks.

---

## Why, and what the research actually established

The blueprint research graded the current taxonomy structurally
misaligned. Diligence against the actual code (scoring.ts read-out)
confirmed part and refuted part:

- **Already correct (report overstated):** the 400–1600 projection
  computes Math and R&W section scores separately from their concept
  groups and sums them — the 50/50 top-level weighting exists today.
- **Confirmed problems:** (1) within-section weighting is an equal
  mean, so geometry+trig = 33% of the Math band vs ~15% of the real
  test, and each R&W concept swings 50% of an 800-point band; (2) the
  R&W side has half the score resolved by 2 concepts and 4 of 16
  diagnostic questions; (3) Expression of Ideas (~20% of R&W) has zero
  content; (4) "quadratics" covers a fraction of the real Advanced
  Math domain; (5) the "reading" concept conflates two domains
  (Craft & Structure vs Information & Ideas) needing different
  remediation.
- **Architecture validated:** prerequisite graph, mastery→diagnostic→
  lesson→pool progression all survive. This is a data/content
  migration, not a rewrite.

## Target structure

Eight concepts — same count as today (which preserves the 16-question
diagnostic shape, the `correct/2` seeding in `applyDiagnosticResults`,
and the MasteryMap size) — but 4 Math + 4 R&W, mapped 1:1 onto the
official domains:

| New ConceptId | Official domain | Blueprint weight (of section) | Comes from |
|---|---|---|---|
| `algebra` | Algebra | ~35% | rename of `linear` |
| `advmath` | Advanced Math | ~35% | rename of `quad` (content expands in Phase B) |
| `psda` | Problem-Solving & Data Analysis | ~15% | MERGE of `ratios` + `stats` |
| `geotrig` | Geometry & Trigonometry | ~15% | MERGE of `geometry` + `trig` |
| `conventions` | Standard English Conventions | ~26% | rename of `grammar` |
| `craft` | Craft & Structure | ~28% | SPLIT of `reading` (part) |
| `ideas` | Information & Ideas | ~26% | SPLIT of `reading` (part) |
| `expression` | Expression of Ideas | ~20% | NEW (empty until Phase B) |

## Scope decisions — read before starting

- **Weighted section scoring.** `sectionScore` moves from an equal mean
  to a weighted mean using the blueprint weights above (normalized).
  Small change — the function already takes the concept array; it gains
  a weights map in `concepts.ts` beside `MATH_CONCEPTS`/`RW_CONCEPTS`.
  `totalScore`'s two-section sum is untouched.
- **Clean reset of user data, not migration code.** Pre-launch with two
  real users, we reset rather than write mastery-merging migration
  logic: after deploy, Swami and Varun re-run the diagnostic under the
  new taxonomy. This also cleanly handles `seenQuestions`/
  `missedQuestions`/history referencing old question IDs. **This
  luxury expires the day real students exist — which is an argument
  for doing this migration now, before College Targets and beta.**
  Mechanics: existing user docs get reset via the existing `reset()`
  path (or console deletion) — no schema-migration mapper is built.
- **Question IDs are re-issued** under the new concept prefixes
  (`{newConcept}-d{n}` / `-p{n}`), preserving the HN-09 scheme shape.
  The diagnostic snapshot test is REWRITTEN for the new 16 IDs — this
  is a deliberate HN-09 re-baseline, executed through Gate 2 below,
  not a silent test edit.
- **Interim pool skew is accepted.** After Phase A, per-concept pool
  sizes will be lopsided (psda and geotrig ~56 pool questions each;
  craft/ideas ~13-15 each; expression 0 pool). Sessions still function
  (selection is per-concept); Phase B rebalances toward the blueprint
  distribution (Math 42/42/18/18, R&W 34/31/31/24 for a 240 bank).
  `expression` ships in Phase A with diagnostic questions only + a
  minimal lesson, and is excluded from practice-session targeting
  until Phase B gives it a pool (flag it, don't special-case deeper
  than needed).
- **HN-13 applies to new content**: the 2 new `expression` diagnostic
  questions in Phase A are human-authored (drafted in chat with Swami,
  not generated). Phase B's larger content build decides
  authoring-vs-gated-generation separately.
- **No native module changes.** Fully web-testable; device pass is a
  sanity run on the existing dev build.

---

## Phase A — implementation steps (this task)

### Step 1 — Restructure `concepts.ts` and types
New `ConceptId` union (8 new ids), `MATH_CONCEPTS`/`RW_CONCEPTS`
arrays, new `SECTION_WEIGHTS` map (blueprint weights above), updated
concept display names/descriptions, and a **proposed new prerequisite
graph** over the new nodes.

**🛑 GATE 1 (prerequisite graph):** present the proposed graph to Swami
as a short rationale (which nodes feed which, e.g. algebra → advmath;
conventions → expression) and WAIT for approval before wiring it in.

### Step 2 — Weighted `sectionScore`
Weighted mean per `SECTION_WEIGHTS`; `applyDiagnosticResults`' `/2`
seeding survives unchanged (still 2 diagnostic questions per concept).
Update scoring tests for the new weighting math.

### Step 3 — Question bank retag and re-ID
- Mechanical (scripted): `linear-*` → `algebra-*`; `quad-*` →
  `advmath-*`; `grammar-*` → `conventions-*`; `ratios-*` + `stats-*` →
  `psda-*` (renumber pool sequentially); `geometry-*` + `trig-*` →
  `geotrig-*`.
- Diagnostic selection for merged concepts: the merges each bring 4
  diagnostic questions (2+2) but each new concept needs exactly 2.
  Propose which 2 of each merged pair's 4 remain diagnostic (the other
  2 are demoted to pool — content untouched, flags/IDs only), with a
  one-line rationale each.
- The `reading` split: classify all 30 reading questions (2 diagnostic
  + 28 pool) as `craft` (vocabulary-in-context, text structure,
  purpose, cross-text) or `ideas` (central ideas, evidence,
  inference). Propose the classification as a table for review.
- Author NOTHING new except placeholders: `expression` gets its 2
  diagnostic slots left EMPTY pending Gate 2 (Swami supplies the
  human-authored questions in chat).

**🛑 GATE 2 (diagnostic re-baseline, HN-09):** present (a) the proposed
demotions for merged concepts, (b) the reading-question classification
table, (c) the resulting new 16-diagnostic-ID list (14 from existing +
2 `expression` slots to be filled by Swami's authored questions). WAIT
for approval + the 2 authored questions. Then rewrite the snapshot test
to the approved 16 and update HN-09's expected list.

### Step 4 — Lessons remap
`linear`→`algebra`, `quad`→`advmath`, `grammar`→`conventions` (retitle
as needed); merge the `ratios`+`stats` lessons into one `psda` lesson
and `geometry`+`trig` into one `geotrig` lesson (combine sections,
keep both illustrations or pick one); the `reading` lesson becomes the
`craft` lesson; write minimal placeholder lessons for `ideas` and
`expression` (a few sections each, honest "more coming" tone — Phase B
replaces them). Update the lessons test (8 entries, one per new
ConceptId).

### Step 5 — Sweep the hardcoded couplings
Per the scoring.ts read-out: `MasteryMap`/`createInitialProgress` keys,
`seenQuestions`/`missedQuestions` concept keys, sessionBuilder's
concept iteration, Dashboard/DiagResults concept displays, the
diagnostic queue (emergent 16 should just work), and any ConceptId
string literals anywhere (grep the union's old members — must be zero
hits when done).

### Step 6 — Validate
tsc/eslint/jest clean; bank tests updated (still 240 total; per-concept
counts now uneven — assert the actual expected numbers, don't loosen);
new snapshot test locked to the Gate-2-approved 16; weighted-scoring
tests; lessons test.

**🛑 GATE 3 (reset + manual test):** stop before any commit. Swami
resets the two user accounts, runs the manual test (below), and
approves.

### Manual test (web, then device sanity)
1. Fresh diagnostic under the new taxonomy: 16 questions, 8 Math /
   8 R&W, lands on DiagResults showing the 8 new concepts.
2. Dashboard: 8 new mastery bars, projection computes, Learn links
   open the remapped lessons (including the two placeholders).
3. Practice sessions target new concepts; `expression` is not
   targeted (no pool) and nothing crashes on its account.
4. Error journal + seen-tracking function under new IDs (miss a
   question, verify Firestore entries carry new-scheme IDs).
5. Device sanity via Metro: boot, one session, Schedule tab intact.

### Commit
Scoped commit; standalone-verify per HN-12; push. Then a substantial
HUMAN_NOTES update (drafted as text): HN-09 rewritten for the new
taxonomy + new snapshot list, and a new entry recording the 4+4
migration, the weighted scoring, and the clean-reset decision.

---

## Phase B — content build-out (separate task, for context)
Rebalance the bank toward the blueprint distribution: expand `advmath`
beyond quadratics (exponentials, polynomials, radicals, rationals,
absolute value), build the `expression` pool (~24+ questions) and a
real lesson, grow `craft`/`ideas` toward ~34/31, trim-or-tolerate the
psda/geotrig surplus. Authoring-vs-gated-generation decided then
(HN-13: R&W held to the stricter standard; math generation may use the
computational-verification pipeline). Item conventions from the
research apply: R&W passages 25–150 words, one question per passage;
distractors analytically defensible.

## Phase C — SPR format (separate task, for context)
Student-Produced Response support: new answer-input mode on
QuestionCard (numeric entry), the no-negative-answers validation rule,
~25% of math items eventually SPR. UI + data-model work; independent
of Phases A/B ordering beyond needing the new taxonomy's IDs.

---

## Prompt to paste into Claude Code

```
Major phase on zappys-sat-prep: the taxonomy migration to the College
Board 4+4 domain structure. Read HUMAN_NOTES.md first (HN-09
especially — this task deliberately re-baselines it through an
explicit gate — plus HN-11, HN-12), then TAXONOMY-MIGRATION-PLAN.md in
the project root for the full plan.

Headline design: same 8-concept count, new membership — Math becomes
algebra / advmath / psda (ratios+stats merged) / geotrig
(geometry+trig merged); R&W becomes conventions / craft / ideas
(reading split) / expression (new, diagnostic-only until Phase B).
sectionScore gains blueprint weights (35/35/15/15 math,
28/26/26/20 R&W). Question IDs re-issue under new prefixes; user data
is handled by clean reset (two users re-diagnose), NOT migration code.

This task has THREE HUMAN GATES where you stop and wait for my
approval: Gate 1 the proposed prerequisite graph; Gate 2 the
diagnostic re-baseline (merged-concept demotions, the reading
classification table, the new 16-ID list — I will author the 2
expression diagnostic questions myself and supply them at this gate);
Gate 3 the pre-commit manual test after I reset the user accounts.

Work Steps 1-6 in order, tsc/eslint/jest after each step, stopping at
each gate. Phase A only — Phases B and C in the plan are context, not
scope. Confirm git status is clean at start and finish, per HN-12.
```
