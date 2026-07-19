# Trainer Content Format & Lesson 1: Linear Equations & Systems

This doc establishes the format for all 8 Trainer lessons, using Lesson 1
as the worked template. Once this format is approved, the remaining 7
lessons follow the same shape.

---

## Content schema

```ts
interface LessonIllustration {
  /** Used as the asset filename: assets/lessons/{id}.png */
  id: string;
  altText: string;
  /** Kept for reference/regeneration — not used at runtime */
  geminiPrompt: string;
}

interface LessonSection {
  heading: string;
  body: string;
  example?: { problem: string; solution: string };
  illustration?: LessonIllustration;
}

interface Lesson {
  concept: ConceptId;
  title: string;
  sections: LessonSection[];
}
```

## Illustration approach: placeholder now, swap later

Rather than dynamic image loading (which Metro doesn't handle well with
variable paths), every illustration gets a **fixed filename** at
`assets/lessons/{id}.png`, referenced with a normal static `require()`.

- **Now**: Claude Code generates simple placeholder images at each path —
  e.g. a dark card with the Zappy palette and a label like "⚡ Illustration:
  Balance Scale" — so `LessonScreen` is fully built and testable today.
- **Later**: run the Gemini prompts below, save the output PNGs with the
  *exact same filenames*, drop them into `assets/lessons/`, and they
  replace the placeholders automatically — **zero code changes**.

Style guideline for all Gemini prompts (keep consistent across all 8
lessons): dark navy background (`#14132B`), glowing flat-design /
minimalist geometric style, accent colors from Zappy's palette (`#FFD23F`
yellow, `#5EE6C8` mint, `#FF6B81` coral, `#363468` grid/outline gray),
square aspect ratio, no extraneous text beyond what's specified.

---

## Lesson 1: Linear Equations & Systems

### Section 1: Solving for One Unknown

Think of an equation like a balance scale: whatever's on the left weighs
the same as whatever's on the right. Your job is to get the unknown
(usually `x` or `y`) alone on one side — and the rule is simple:
**whatever you do to one side, you must do to the other**, so the scale
stays balanced.

The trickiest part isn't the math itself — it's the *order*. When you're
solving, you undo operations in the **reverse order they were applied**.
If `x` was multiplied, then had something subtracted, you undo the
subtraction *first* (by adding it back), and the multiplication *last* (by
dividing).

**Worked example**: Solve `2y − 4 = 10`

1. The `4` was subtracted last, so undo that first: add 4 to both sides →
   `2y = 14`
2. The `2` was multiplied first, so undo that last: divide both sides by 2
   → `y = 7`

Quick check: plug it back in — `2(7) − 4 = 14 − 4 = 10`. ✓

The #1 mistake here is doing these steps in the wrong order — for
example, dividing by 2 *before* dealing with the `−4`, which gives a wrong
answer that "looks" reasonable. If your answer doesn't check out when you
plug it back in, this is the first thing to look for.

**Illustration**: `linear-balance-scale`
> A literal balance scale, level/balanced, with the left pan holding a
> card reading "2y − 4" and the right pan holding "10". Below the scale,
> two small annotated steps in sequence: a "+4" arrow applied to both
> pans (scale stays level, left pan now reads "2y", right pan reads "14"),
> then a "÷2" arrow applied to both pans (left pan reads "y", right pan
> reads "7").

**Gemini prompt**:
```
A clean, modern flat-design illustration of a balance scale for a math
education app. Dark navy background (#14132B). The scale is rendered in a
glowing yellow (#FFD23F) outline style, perfectly level. The left pan
holds a card reading "2y − 4" and the right pan holds a card reading "10".
Below the scale, show two small annotated steps in sequence, each with a
mint green (#5EE6C8) arrow: step one labeled "+4" showing the pans now
reading "2y" and "14"; step two labeled "÷2" showing the pans now reading
"y" and "7". Minimalist, geometric, glowing accent style, square aspect
ratio, no text beyond what's specified, suitable for a dark-mode mobile
app.
```

### Section 2: Systems of Equations — Two Clues, Two Unknowns

A "system" is just two equations that are both true at the same time, with
two unknowns. Since you have two clues, you can often combine them to make
one of the unknowns disappear entirely.

**Worked example**: Solve `x + y = 10` and `x − y = 2`

Notice that one equation has `+y` and the other has `−y`. If you **add the
two equations together**, the `y`'s cancel out:

```
  x + y = 10
+ x − y =  2
-----------
 2x      = 12
```

So `2x = 12`, which means `x = 6`. Now plug `x = 6` back into either
original equation — say `x + y = 10` → `6 + y = 10` → `y = 4`.

Always double-check with the *other* equation too: `x − y = 2` →
`6 − 4 = 2`. ✓ Both equations agree, so you know the answer is right.

The key habit: look for a variable that has **opposite signs** (`+y` and
`−y`, or `+x` and `−x`) across the two equations — that's your signal that
adding them will eliminate it.

**Illustration**: `linear-systems-intersection`
> A coordinate grid showing two straight lines crossing at a single point.
> One line represents `x + y = 10` (a downward-sloping line through
> roughly (10,0) and (0,10)), the other represents `x − y = 2` (an
> upward-sloping line through roughly (2,0) and (0,−2)). Their
> intersection, at `(6, 4)`, is highlighted with a glowing dot and labeled.
> Visually reinforces: solving a system = finding where two lines meet.

**Gemini prompt**:
```
A clean, modern flat-design coordinate grid illustration for a math
education app. Dark navy background (#14132B), subtle grid lines in gray
(#363468). Two straight lines crossing: one in yellow (#FFD23F) labeled
"x + y = 10" running from upper-left to lower-right, one in coral
(#FF6B81) labeled "x − y = 2" running from lower-left to upper-right. The
two lines intersect at a single point, marked with a glowing mint
(#5EE6C8) dot and labeled "(6, 4)". Minimalist, geometric, glowing accent
style, square aspect ratio, no text beyond what's specified, suitable for
a dark-mode mobile app.
```

### Section 3: Slope — How Steep Is the Line?

Slope measures **steepness** — specifically, how much `y` changes for
every step `x` takes. The formula is:

```
slope = (change in y) / (change in x) = rise / run
```

**Worked example**: Find the slope between the points `(2, 3)` and `(4, 7)`

- Change in y (rise): `7 − 3 = 4`
- Change in x (run): `4 − 2 = 2`
- Slope: `4 / 2 = 2`

A slope of `2` means: for every 1 step right, the line goes up 2. A common
slip-up is **flipping the fraction** — calculating run/rise instead of
rise/run — which gives you the *reciprocal* of the real answer (here,
`1/2` instead of `2`). If your slope answer is a small fraction but the
line in the picture looks steep, that's a sign you might've flipped it.

**Illustration**: `linear-slope-triangle`
> A coordinate grid with a line passing through two labeled points, `(2,
> 3)` and `(4, 7)`. A right triangle is drawn between them showing the
> vertical leg ("rise = 4") and horizontal leg ("run = 2"), making the
> rise/run relationship visually concrete.

**Gemini prompt**:
```
A clean, modern flat-design coordinate grid illustration for a math
education app. Dark navy background (#14132B), subtle grid lines in gray
(#363468). A straight line in yellow (#FFD23F) passing through two glowing
mint (#5EE6C8) points labeled "(2, 3)" and "(4, 7)". Between the two
points, draw a right triangle with a coral (#FF6B81) outline: the vertical
leg labeled "rise = 4" and the horizontal leg labeled "run = 2".
Minimalist, geometric, glowing accent style, square aspect ratio, no text
beyond what's specified, suitable for a dark-mode mobile app.
```

---

## Open question

This adds 3 illustrations to Lesson 1. Across all 8 lessons, that's
roughly **20-24 illustrations total** (some lessons may need fewer, e.g.
Grammar/Reading might lean on 1-2 diagrams rather than 3). Before I write
the remaining 7 lessons in this same format — does the illustration count
per lesson feel right (≈2-3), or would you rather cap it lower (e.g. 1 key
illustration per lesson) to keep the Gemini-generation workload more
manageable?
