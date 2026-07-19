# Trainer v1 Plan: Lessons for All 8 Concepts

Implementation plan for the Trainer feature. Pairs with
`TRAINER-LESSON-1-LINEAR.md` and `TRAINER-LESSONS-2-8.md` (drop all three
in the project root before starting).

---

## Scope decisions — read before starting

- **8 lessons, one per existing `ConceptId`** (`linear`, `quad`, `ratios`,
  `stats`, `geometry`, `trig`, `grammar`, `reading`). No new concepts, no
  changes to scoring/mastery/APDE — this feature is purely additive on top
  of what exists.
- **Lessons are static content, not user data.** They live in a new
  `src/data/lessons.ts`, the same way the question bank does — no Firestore
  schema changes, no new `ProgressContext` fields. Completing a lesson does
  **not** affect mastery; mastery stays 100% quiz-based, as now.
- **One illustration per lesson** (8 total), using the placeholder-now/
  swap-later approach: fixed filenames at `assets/lessons/{id}.png`,
  referenced via static `require()`. Generate simple placeholder images now
  (dark navy background, Zappy palette accent, a label like "⚡
  Illustration: <title>"); real Gemini-generated art can replace these
  files later with zero code changes.
- **Important note on Lesson 1**: `TRAINER-LESSON-1-LINEAR.md` was drafted
  before we settled on "1 illustration per lesson" and still shows three
  illustration specs (`linear-balance-scale`, `linear-systems-intersection`,
  `linear-slope-triangle`). **Use only `linear-slope-triangle`** for Lesson
  1 — the other two are left in that doc for reference only and should not
  be used.

## Data model

```ts
interface LessonIllustration {
  /** assets/lessons/{id}.png */
  id: string;
  altText: string;
}

interface LessonSection {
  heading: string;
  body: string;
  example?: { problem: string; solution: string };
}

interface Lesson {
  concept: ConceptId;
  title: string;
  sections: LessonSection[];
  illustration: LessonIllustration;
}
```

## Content transcription

Transcribe the 8 lessons from the two markdown docs into
`src/data/lessons.ts` as `export const LESSONS: Lesson[]`. Preserve section
headings, body text, and worked examples faithfully — these were carefully
written for clarity and tone, so this should be a faithful transcription,
not a rewrite.

**Formatting note**: the source content uses a few lightweight markdown
conventions — `` `inline code` `` for math expressions (e.g. `` `2y − 4 =
10` ``), `**bold**` for emphasis, and one triple-backtick multi-line code
block (the equation-addition layout in Lesson 1, Section 2). Rather than
pulling in a full markdown library, write a small inline-formatting helper
that handles just these three patterns — render inline code in a
monospace/highlighted style, bold as bold text, and the one code block as a
multi-line monospace block. This should be ~30-50 lines, not a new
dependency.

## LessonScreen

New screen that renders a single lesson:

1. Title at top
2. Illustration (the placeholder/real image for that lesson's
   `illustration.id`)
3. Each section in order: heading, body (with inline formatting per above),
   then the worked example if present (visually distinguished, e.g. in a
   `Card`)
4. At the end, a **"Practice this topic"** button that starts a focused
   session using only that lesson's `concept`'s question pool — check
   whether the existing session-builder already supports filtering by a
   single concept; if so reuse it, otherwise add a minimal concept-filtered
   variant.

## Navigation entry points

- **Dashboard**: next to each concept's mastery bar, add a small "Learn"
  link/button that navigates to `LessonScreen` for that concept. Especially
  useful for weak concepts, but available for all.
- **DiagResultsScreen**: same pattern, next to each concept's result.
- A dedicated "Learn" tab (a syllabus-style list of all 8 lessons) is a
  nice-to-have, not required for v1 — use your judgment on whether it fits
  cleanly given time, but the Dashboard/DiagResults entry points are the
  must-have.

## Illustration placeholders

Create placeholder images at these 8 paths (all referenced via static
`require()` from `LessonScreen`):

```
assets/lessons/linear-slope-triangle.png
assets/lessons/quadratics-parabola-roots-vertex.png
assets/lessons/ratios-percent-bar-model.png
assets/lessons/stats-bell-curve-sd.png
assets/lessons/geometry-pythagorean-squares.png
assets/lessons/trig-soh-cah-toa-triangle.png
assets/lessons/grammar-subject-verb-bracket.png
assets/lessons/reading-context-clue-focus.png
```

Each placeholder: dark navy (`#14132B`) background with the lesson title
overlaid in the Zappy palette — simple enough to generate with a quick
script (e.g. an HTML/canvas-to-PNG step, or any image library already
available). These get replaced 1:1 by Gemini-generated art later — same
filenames, no code changes.

## Validation

- `tsc`/`eslint`/`jest` as usual.
- Add a small test confirming `LESSONS` has exactly 8 entries, one per
  `ConceptId`, each with a non-empty `title`, at least one section, and a
  valid `illustration.id` matching the placeholder filenames above.

## Manual test (web)

1. From Dashboard, tap "Learn" on any concept → `LessonScreen` renders:
   title, illustration placeholder (not a broken image), all sections with
   correct formatting (inline code/bold rendering correctly, the Lesson 1
   code block rendering as a monospace block), and worked examples.
2. Tap "Practice this topic" → starts a session using only that concept's
   questions.
3. Confirm mastery scores are unchanged by viewing a lesson (only quiz
   answers should move mastery).
4. Spot-check 2-3 other lessons for correct rendering, especially the
   special characters in Geometry/Trig/Stats (`π`, `θ`, `√`, etc.).

---

## Prompt for Claude Code

```
New feature: the Trainer. Read TRAINER-V1-PLAN.md in the project root for
the full plan, along with TRAINER-LESSON-1-LINEAR.md and
TRAINER-LESSONS-2-8.md for the lesson content to transcribe.

Key points: this is purely additive — no Firestore/ProgressContext changes,
mastery stays quiz-based only. For Lesson 1, use only the
linear-slope-triangle illustration (the plan doc explains why the other two
specs in that file should be ignored).

Work through: data model + content transcription into src/data/lessons.ts,
then LessonScreen, then placeholder images at the 8 specified paths, then
Dashboard/DiagResults navigation entry points. Run tsc/eslint/jest after
each major step. Stop for a manual web test before committing — I'll check
lesson rendering (including special characters and the Lesson 1 code block)
and the practice-session handoff.
```
