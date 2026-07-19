# Trainer Lessons 2-8

Continuation of `TRAINER-LESSON-1-LINEAR.md`. Same schema, same style
guideline for Gemini prompts (dark navy `#14132B` background, glowing flat
geometric style, Zappy palette: `#FFD23F` yellow, `#5EE6C8` mint, `#FF6B81`
coral, `#363468` gray). One illustration per lesson.

---

## Lesson 2: Quadratics & Functions

### Function Notation — Plugging In

A function is a machine: you feed it an input, it gives you an output.
`f(x) = x² − 4` means "take whatever's in the parentheses, square it, then
subtract 4." The notation can look intimidating, but `f(3)` just means
"run the machine with `3` as the input."

**Worked example**: If `f(x) = x² − 4`, find `f(3)`.

Replace every `x` with `3`: `f(3) = 3² − 4 = 9 − 4 = 5`.

The most common slip: stopping after squaring (`3² = 9`) and forgetting
the `− 4` is still part of the function — giving `9` instead of `5`.
Whatever comes after the squared term in the function's definition still
applies to your answer.

### Factoring — Finding the Roots

Factoring is "unmultiplying" — turning `x² − 5x + 6` back into
`(x − 2)(x − 3)`. The roots (where the graph crosses the x-axis) are the
values that make each factor zero.

**Worked example**: Solve `x² − 5x + 6 = 0`.

Find two numbers that multiply to `6` and add to `−5`: those are `−2` and
`−3`. So `x² − 5x + 6 = (x − 2)(x − 3)`. Setting each factor to zero gives
`x = 2` or `x = 3`.

Watch the signs carefully — a factor pair that multiplies correctly but
adds to the wrong sign (e.g., `2` and `3` instead of `−2` and `−3`) is the
#1 source of factoring errors.

### The Vertex — The Turning Point

Every parabola has one highest or lowest point: the vertex. For
`f(x) = ax² + bx + c`, the vertex's x-coordinate is `−b / (2a)`.

**Worked example**: For `f(x) = 2x² − 8x + 3`, find the vertex's
x-coordinate.

`x = −b / (2a) = −(−8) / (2 × 2) = 8 / 4 = 2`.

A common mistake is forgetting the `2` in the denominator — computing
`−b/a` instead of `−b/(2a)`, which gives double the correct answer.

**Illustration**: `quadratics-parabola-roots-vertex`
> A parabola opening upward, crossing the x-axis at two points (the
> roots), with the vertex (lowest point) marked between them. Labels show
> "roots" at the x-intercepts and "vertex" at the turning point — visually
> connecting factoring (roots) and the vertex formula in one picture.

**Gemini prompt**:
```
A clean, modern flat-design coordinate grid illustration for a math
education app. Dark navy background (#14132B), subtle grid lines in gray
(#363468). A smooth upward-opening parabola in yellow (#FFD23F). Two
points where the curve crosses the x-axis are marked with glowing mint
(#5EE6C8) dots and labeled "roots". The lowest point of the parabola is
marked with a glowing coral (#FF6B81) dot and labeled "vertex". Minimalist,
geometric, glowing accent style, square aspect ratio, no text beyond what's
specified, suitable for a dark-mode mobile app.
```

---

## Lesson 3: Ratios, Rates & Percent

### Ratios & Proportions — Scale Both Sides Together

A ratio is a fixed relationship between two quantities. If a recipe uses
2 cups flour for every 3 cups sugar, that `2:3` relationship doesn't
change no matter how big a batch you make — **both numbers scale by the
same factor**.

**Worked example**: A recipe uses 2 cups flour for every 3 cups sugar. For
9 cups of sugar, how much flour?

`9` is `3 × 3`, so scale flour the same way: `2 × 3 = 6` cups.

The most common error is changing only one number — e.g., assuming "more
sugar just means a little more flour" without scaling by the *same*
factor. Always ask: "what did I multiply the *other* quantity by?" and do
the same thing here.

### Percent — Part Out of a Hundred

"Percent" literally means "per hundred." `25%` is the fraction `25/100`,
or `0.25`. To find a percentage *of* a number, multiply.

**Worked examples**:
- `25%` of `80` → `0.25 × 80 = 20`
- A `$40` shirt discounted `15%`: the discount is `0.15 × 40 = $6`, so the
  sale price is `40 − 6 = $34`
- A quantity goes from `80` to `100`. Percent increase = `(change /
  original) × 100 = (20 / 80) × 100 = 25%`

That last one is where most mistakes happen: percent *change* always
divides by the **original** (starting) value — not the new value, and not
just an estimate. If a problem gives you a "before" and "after," the
"before" goes on the bottom.

**Illustration**: `ratios-percent-bar-model`
> A horizontal bar divided into segments to show part-whole relationships.
> One version shows a 2:3 ratio split (2 segments one color, 3 segments
> another); below it, a second bar of 100 equal units with 25 units shaded
> to represent "25%". Visually ties ratios and percent together as the same
> "part of a whole" idea.

**Gemini prompt**:
```
A clean, modern flat-design illustration for a math education app showing
two horizontal bar models stacked vertically. Dark navy background
(#14132B). Top bar: divided into 5 equal segments, 2 segments filled in
yellow (#FFD23F) and 3 segments filled in mint (#5EE6C8), labeled "2 : 3".
Bottom bar: divided into 4 equal segments representing 100 units total,
with 1 segment (25%) filled in coral (#FF6B81) and the rest in a muted
gray (#363468), labeled "25%". Minimalist, geometric, glowing accent style,
square aspect ratio, no text beyond what's specified, suitable for a
dark-mode mobile app.
```

---

## Lesson 4: Statistics & Probability

### Mean & Median — Two Different "Middles"

The **mean** (average) is the sum divided by the count. The **median** is
the middle value *after sorting*.

**Worked examples**:
- Mean of `4, 8, 6, 10`: sum is `28`, count is `4`, so mean = `28 / 4 = 7`
- Median of `2, 2, 3, 5, 8`: already sorted, 5 values, the middle (3rd)
  value is `3`

A frequent mix-up: the median requires the data to be **sorted first** —
if you take the "middle" of an unsorted list, you'll likely get the wrong
value. Also, don't confuse median (the middle value) with mode (the most
frequent value) — `2` is the mode of that data set, but `3` is the median.

### Probability — Favorable Over Total

Probability is a fraction: `favorable outcomes / total outcomes`.

**Worked example**: A bag has 5 red and 3 blue marbles. What's the
probability of drawing red?

Total marbles = `5 + 3 = 8`. Probability of red = `5 / 8`.

The denominator is always the **total** — all possible outcomes, not just
the "other" category. A probability of `5/3` would be impossible (greater
than 1), which is a good sanity check: probabilities are always between 0
and 1.

### Standard Deviation — Measuring "How Far From Normal"

Standard deviation (SD) measures typical spread from the mean. A value's
distance from the mean, measured in SDs, tells you how unusual it is.

**Worked example**: A test has mean `500` and SD `100`. How many SDs above
the mean is a score of `650`?

`(650 − 500) / 100 = 150 / 100 = 1.5` SDs above the mean.

Always find the **difference from the mean first**, then divide by the SD
— dividing the raw score by the SD directly (skipping the subtraction)
gives a meaningless number.

**Illustration**: `stats-bell-curve-sd`
> A bell-shaped (normal distribution) curve, with a vertical line at the
> center labeled "mean", and additional vertical lines at +1 SD and +1.5
> SD, with the +1.5 SD line highlighted and labeled with an example score
> — visually grounding "how many SDs away" as a position along the curve.

**Gemini prompt**:
```
A clean, modern flat-design illustration of a bell curve (normal
distribution) for a math education app. Dark navy background (#14132B).
The curve is drawn in mint (#5EE6C8). A vertical dashed line at the center
of the curve is labeled "mean" in yellow (#FFD23F). Additional vertical
dashed lines to the right at one and one-and-a-half standard deviations
from center, in gray (#363468), with the one-and-a-half-SD line
highlighted in coral (#FF6B81) and labeled "+1.5 SD". Minimalist,
geometric, glowing accent style, square aspect ratio, no text beyond
what's specified, suitable for a dark-mode mobile app.
```

---

## Lesson 5: Geometry

### Area & Perimeter — Inside vs. Around

**Area** is the space *inside* a shape; **perimeter** is the distance
*around* it. For a rectangle: area = length × width, perimeter =
2 × (length + width).

**Worked example**: A rectangle has length 8 and width 5.

Area = `8 × 5 = 40`. Perimeter = `2 × (8 + 5) = 26`.

These two formulas get swapped constantly — if a problem asks for area but
you add the sides instead of multiplying, you've calculated perimeter (or
something else entirely). Always double-check: area has units *squared*
(like sq. ft.), perimeter doesn't.

### Circles — Everything Comes From the Radius

For a circle with radius `r`: circumference = `2πr`, area = `πr²`.

**Worked example**: A circle has radius `6`. Find its circumference.

`Circumference = 2πr = 2π(6) = 12π`.

The two formulas are easy to confuse — circumference has a `2` and no
exponent; area has no `2` but squares the radius. If you see an answer
choice that's just `πr` (missing the `2`) or `r²π` (squared, when you
wanted circumference), that's the trap.

### The Pythagorean Theorem — Right Triangles' Best-Kept Secret

For any right triangle with legs `a` and `b` and hypotenuse `c`:
`a² + b² = c²`. The hypotenuse is always the *longest* side, opposite the
right angle.

**Worked example**: A right triangle has legs `6` and `8`. Find the
hypotenuse.

`6² + 8² = 36 + 64 = 100`, so `c = √100 = 10`.

Don't just add the legs (`6 + 8 = 14`) — that's not how this works. You
square, add, *then* take the square root. (Fun fact: `6-8-10` is just the
`3-4-5` triangle scaled up by 2 — recognizing these common "Pythagorean
triples" can save you time.)

**Illustration**: `geometry-pythagorean-squares`
> A right triangle with squares built on each of its three sides (the
> classic visual proof). The squares on the two legs are labeled with
> their areas, and the square on the hypotenuse is labeled with its area —
> visually showing that the two smaller areas add up to the larger one.

**Gemini prompt**:
```
A clean, modern flat-design illustration of the Pythagorean theorem for a
math education app. Dark navy background (#14132B). A right triangle
outlined in yellow (#FFD23F), with a square built on each of its three
sides. The squares on the two legs are filled in mint (#5EE6C8) and
labeled "36" and "64"; the square on the hypotenuse is filled in coral
(#FF6B81) and labeled "100". Minimalist, geometric, glowing accent style,
square aspect ratio, no text beyond what's specified, suitable for a
dark-mode mobile app.
```

---

## Lesson 6: Trigonometry

### SOH-CAH-TOA — Three Ratios, One Triangle

In a right triangle, pick one of the non-right angles and call it `θ`.
Relative to `θ`, the three sides have names: **hypotenuse** (always
opposite the right angle), **opposite** (across from `θ`), and
**adjacent** (next to `θ`, not the hypotenuse). The three trig ratios are:

- `sin(θ) = opposite / hypotenuse`
- `cos(θ) = adjacent / hypotenuse`
- `tan(θ) = opposite / adjacent`

**Worked example**: A right triangle has hypotenuse `10` and one leg `6`
(opposite `θ`). Find `cos(θ)`.

First find the missing leg: `10² − 6² = 100 − 36 = 64`, so the other leg
(adjacent to `θ`) is `8`. Then `cos(θ) = adjacent / hypotenuse = 8 / 10 =
4/5`.

The #1 trig mistake is mixing up **opposite vs. adjacent** — which one is
which depends entirely on *which angle* you're looking from. Always
re-identify opposite/adjacent for the *specific* angle the question asks
about.

### Special Angles — Memorize the Triangle, Not the Table

Two triangles generate almost every "special angle" value on the SAT: the
`45-45-90` (an isoceles right triangle, legs equal) and the `30-60-90`.

**Worked example**: Find `tan(45°)`.

In a `45-45-90` triangle, both legs are equal length. Since
`tan(θ) = opposite/adjacent` and those two sides are equal, `tan(45°) =
1`.

The classic trap: swapping `sin(30°) = 1/2` and `sin(60°) = √3/2` — they're
often presented as answer choices for each other. If you remember *why*
(from the actual triangle's side lengths) rather than memorizing two
similar-looking fractions, you're much less likely to swap them.

**Illustration**: `trig-soh-cah-toa-triangle`
> A right triangle with the right angle marked, one acute angle labeled
> `θ`, and the three sides labeled "opposite", "adjacent", and
> "hypotenuse" relative to `θ`. The three ratio definitions (SOH-CAH-TOA)
> are shown alongside as the foundational reference.

**Gemini prompt**:
```
A clean, modern flat-design illustration of a right triangle for a math
education app. Dark navy background (#14132B). The triangle is outlined in
yellow (#FFD23F), with the right angle marked with a small square. One
acute angle is labeled with the Greek letter theta. The three sides are
labeled in mint (#5EE6C8): the side across from theta labeled "opposite",
the side next to theta (not the longest) labeled "adjacent", and the
longest side labeled "hypotenuse". Minimalist, geometric, glowing accent
style, square aspect ratio, no text beyond what's specified, suitable for
a dark-mode mobile app.
```

---

## Lesson 7: Standard English Conventions

### Subject-Verb Agreement — Find the Real Subject

The verb must agree with its **subject** — but the subject isn't always
the closest noun. Prepositional phrases and other modifiers often sit
between the subject and verb, and they don't count.

**Worked example**: "The list of items ___ on the table." (is/are)

Mentally bracket out the prepositional phrase: "The list [of items] ___ on
the table." The subject is "list" (singular), so the verb is "is" — even
though "items" (plural) sits right before the blank.

This is one of the SAT's favorite traps: a plural noun placed right before
the verb, tempting you to match it, when the *actual* subject (often
earlier in the sentence) requires something different.

### Joining Two Complete Sentences

If you have two complete sentences (each could stand alone), you need one
of: a period, a semicolon, or a comma + a connecting word like "and," "but,"
"or" (FANBOYS). A comma *by itself* is not enough — that's a "comma
splice."

**Worked example**: Which is correct?
- "I went to the store, I bought milk." (comma splice — incorrect)
- "I went to the store, and I bought milk." (correct)

If you can mentally split a sentence into two parts, each a complete
thought on its own, check what's joining them. A lone comma is the most
commonly-tested error here.

**Illustration**: `grammar-subject-verb-bracket`
> A sentence with a prepositional phrase visually bracketed/grayed out
> (e.g., "The list [of items] is on the table"), with an arrow drawn
> directly connecting the true subject ("list") to the verb ("is"),
> skipping over the bracketed phrase — visualizing the "cross it out"
> strategy.

**Gemini prompt**:
```
A clean, modern flat-design illustration for an English grammar education
app, dark navy background (#14132B). A short sentence is shown as text in
white: "The list [of items] is on the table." The bracketed phrase "of
items" is rendered in muted gray (#363468) with a strikethrough, visually
de-emphasized. A glowing yellow (#FFD23F) curved arrow connects the word
"list" directly to the word "is", arcing over the grayed-out phrase.
Minimalist, clean typography-focused illustration, square aspect ratio, no
additional text beyond what's specified, suitable for a dark-mode mobile
app.
```

---

## Lesson 8: Reading & Vocab in Context

### Vocabulary in Context — Let the Sentence Decide

Words can mean different things in different contexts, and the SAT often
picks words with multiple possible meanings. Don't reach for the *most
common* definition — reach for the one that fits *this* sentence,
especially using contrast words like "unlike," "although," "despite," or
"but."

**Worked example**: "Her approach to the problem was novel, unlike any
method attempted before." What does "novel" mean here?

The phrase "unlike any method attempted before" is a huge clue — it's
signaling *difference from the past*. That points to "new and original,"
not "famous" (a different meaning of "novel") and not "fictional" (a noun
meaning of "novel").

The trap: picking a *real* meaning of the word that just doesn't fit *this*
sentence. Context words — especially contrast signals — tell you which
meaning is in play.

### Main Idea — What Is This Passage *Doing*?

Every passage has a job: describing, arguing, comparing, explaining a
cause-and-effect. The main idea is usually revealed by how the sentences
*relate* to each other — especially contrast and emphasis words.

**Worked example**: "Coral reefs... support nearly a quarter of all marine
species despite covering less than one percent of the ocean floor." What's
the main point?

The word "despite" sets up a contrast between *tiny size* and *huge
importance* — that contrast *is* the point. The main idea is the
disproportionate ecological importance of reefs, not just "reefs are small"
or "reefs have many species" on their own.

The trap: choosing an answer that's *true* based on the passage but is too
narrow — a supporting detail, not the overall point the contrast is making.

**Illustration**: `reading-context-clue-focus`
> A sentence with a target vocabulary word highlighted, and a stylized
> magnifying glass focused on a nearby contrast word (like "unlike" or
> "despite") — visualizing how context clues, especially contrast signals,
> point to a word's meaning in a specific sentence.

**Gemini prompt**:
```
A clean, modern flat-design illustration for a reading-comprehension
education app, dark navy background (#14132B). A short sentence is shown
as text in white, with one word highlighted in yellow (#FFD23F) (the
target vocabulary word) and another word highlighted in coral (#FF6B81)
(a contrast signal word like "unlike"). A glowing mint (#5EE6C8) stylized
magnifying glass icon is positioned over the coral-highlighted word,
visually connecting it to the yellow word with a thin glowing line.
Minimalist, clean typography-focused illustration, square aspect ratio, no
additional text beyond what's specified, suitable for a dark-mode mobile
app.
```
