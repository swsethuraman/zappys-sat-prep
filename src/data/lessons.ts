import type { ConceptId } from './concepts';

export interface LessonIllustration {
  /** Asset filename without path: assets/lessons/{id}.png */
  id: string;
  altText: string;
}

export interface LessonSection {
  heading: string;
  /** Body text supporting `backtick`, **bold**, and ```code block``` markers. */
  body: string;
  example?: { problem: string; solution: string };
}

export interface Lesson {
  concept: ConceptId;
  title: string;
  sections: LessonSection[];
  illustration: LessonIllustration;
}

export const LESSONS: Lesson[] = [
  {
    concept: 'linear',
    title: 'Linear Equations & Systems',
    illustration: {
      id: 'linear-slope-triangle',
      altText: 'A coordinate grid showing a line through (2,3) and (4,7) with a right triangle illustrating rise = 4 and run = 2.',
    },
    sections: [
      {
        heading: 'Solving for One Unknown',
        body:
          'Think of an equation like a balance scale: whatever\'s on the left weighs the same as whatever\'s on the right. Your job is to get the unknown (usually `x` or `y`) alone on one side — and the rule is simple: **whatever you do to one side, you must do to the other**, so the scale stays balanced.\n\nThe trickiest part isn\'t the math itself — it\'s the order. When you\'re solving, you undo operations in the **reverse order they were applied**. If `x` was multiplied, then had something subtracted, you undo the subtraction first (by adding it back), and the multiplication last (by dividing).',
        example: {
          problem: 'Solve `2y − 4 = 10`',
          solution:
            '1. The `4` was subtracted last, so undo that first: add 4 to both sides → `2y = 14`\n2. The `2` was multiplied first, so undo that last: divide both sides by 2 → `y = 7`\n\nQuick check: plug it back in — `2(7) − 4 = 14 − 4 = 10`. ✓\n\nThe #1 mistake here is doing these steps in the wrong order — for example, dividing by 2 before dealing with the `−4`, which gives a wrong answer that "looks" reasonable. If your answer doesn\'t check out when you plug it back in, this is the first thing to look for.',
        },
      },
      {
        heading: 'Systems of Equations — Two Clues, Two Unknowns',
        body:
          'A "system" is just two equations that are both true at the same time, with two unknowns. Since you have two clues, you can often combine them to make one of the unknowns disappear entirely.',
        example: {
          problem: 'Solve `x + y = 10` and `x − y = 2`',
          solution:
            'Notice that one equation has `+y` and the other has `−y`. If you **add the two equations together**, the `y`\'s cancel out:\n\n```\n  x + y = 10\n+ x − y =  2\n-----------\n 2x      = 12\n```\n\nSo `2x = 12`, which means `x = 6`. Now plug `x = 6` back into either original equation — say `x + y = 10` → `6 + y = 10` → `y = 4`.\n\nAlways double-check with the other equation too: `x − y = 2` → `6 − 4 = 2`. ✓ Both equations agree, so you know the answer is right.\n\nThe key habit: look for a variable that has **opposite signs** (`+y` and `−y`, or `+x` and `−x`) across the two equations — that\'s your signal that adding them will eliminate it.',
        },
      },
      {
        heading: 'Slope — How Steep Is the Line?',
        body:
          'Slope measures **steepness** — specifically, how much `y` changes for every step `x` takes. The formula is:\n\n```\nslope = (change in y) / (change in x) = rise / run\n```',
        example: {
          problem: 'Find the slope between the points `(2, 3)` and `(4, 7)`',
          solution:
            '- Change in y (rise): `7 − 3 = 4`\n- Change in x (run): `4 − 2 = 2`\n- Slope: `4 / 2 = 2`\n\nA slope of `2` means: for every 1 step right, the line goes up 2. A common slip-up is **flipping the fraction** — calculating run/rise instead of rise/run — which gives you the reciprocal of the real answer (here, `1/2` instead of `2`). If your slope answer is a small fraction but the line in the picture looks steep, that\'s a sign you might\'ve flipped it.',
        },
      },
    ],
  },

  {
    concept: 'quad',
    title: 'Quadratics & Functions',
    illustration: {
      id: 'quadratics-parabola-roots-vertex',
      altText: 'An upward-opening parabola with roots marked on the x-axis and the vertex (lowest point) highlighted.',
    },
    sections: [
      {
        heading: 'Function Notation — Plugging In',
        body:
          'A function is a machine: you feed it an input, it gives you an output. `f(x) = x² − 4` means "take whatever\'s in the parentheses, square it, then subtract 4." The notation can look intimidating, but `f(3)` just means "run the machine with `3` as the input."',
        example: {
          problem: 'If `f(x) = x² − 4`, find `f(3)`.',
          solution:
            'Replace every `x` with `3`: `f(3) = 3² − 4 = 9 − 4 = 5`.\n\nThe most common slip: stopping after squaring (`3² = 9`) and forgetting the `− 4` is still part of the function — giving `9` instead of `5`. Whatever comes after the squared term in the function\'s definition still applies to your answer.',
        },
      },
      {
        heading: 'Factoring — Finding the Roots',
        body:
          'Factoring is "unmultiplying" — turning `x² − 5x + 6` back into `(x − 2)(x − 3)`. The roots (where the graph crosses the x-axis) are the values that make each factor zero.',
        example: {
          problem: 'Solve `x² − 5x + 6 = 0`.',
          solution:
            'Find two numbers that multiply to `6` and add to `−5`: those are `−2` and `−3`. So `x² − 5x + 6 = (x − 2)(x − 3)`. Setting each factor to zero gives `x = 2` or `x = 3`.\n\nWatch the signs carefully — a factor pair that multiplies correctly but adds to the wrong sign (e.g., `2` and `3` instead of `−2` and `−3`) is the #1 source of factoring errors.',
        },
      },
      {
        heading: 'The Vertex — The Turning Point',
        body:
          'Every parabola has one highest or lowest point: the vertex. For `f(x) = ax² + bx + c`, the vertex\'s x-coordinate is `−b / (2a)`.',
        example: {
          problem: 'For `f(x) = 2x² − 8x + 3`, find the vertex\'s x-coordinate.',
          solution:
            '`x = −b / (2a) = −(−8) / (2 × 2) = 8 / 4 = 2`.\n\nA common mistake is forgetting the `2` in the denominator — computing `−b/a` instead of `−b/(2a)`, which gives double the correct answer.',
        },
      },
    ],
  },

  {
    concept: 'ratios',
    title: 'Ratios, Rates & Percent',
    illustration: {
      id: 'ratios-percent-bar-model',
      altText: 'Two horizontal bar models: a 2:3 ratio split (top) and a 100-unit bar with 25% shaded (bottom).',
    },
    sections: [
      {
        heading: 'Ratios & Proportions — Scale Both Sides Together',
        body:
          'A ratio is a fixed relationship between two quantities. If a recipe uses 2 cups flour for every 3 cups sugar, that `2:3` relationship doesn\'t change no matter how big a batch you make — **both numbers scale by the same factor**.',
        example: {
          problem:
            'A recipe uses 2 cups flour for every 3 cups sugar. For 9 cups of sugar, how much flour?',
          solution:
            '`9` is `3 × 3`, so scale flour the same way: `2 × 3 = 6` cups.\n\nThe most common error is changing only one number — e.g., assuming "more sugar just means a little more flour" without scaling by the same factor. Always ask: "what did I multiply the other quantity by?" and do the same thing here.',
        },
      },
      {
        heading: 'Percent — Part Out of a Hundred',
        body:
          '"Percent" literally means "per hundred." `25%` is the fraction `25/100`, or `0.25`. To find a percentage of a number, multiply.',
        example: {
          problem:
            'Find: (a) `25%` of `80`; (b) sale price of a `$40` shirt discounted `15%`; (c) percent increase from `80` to `100`.',
          solution:
            '(a) `0.25 × 80 = 20`\n(b) Discount: `0.15 × 40 = $6`, so sale price = `$40 − $6 = $34`\n(c) Percent increase = `(20 / 80) × 100 = 25%`\n\nPercent change always divides by the **original** (starting) value — not the new value. If a problem gives you a "before" and "after," the "before" goes on the bottom.',
        },
      },
    ],
  },

  {
    concept: 'stats',
    title: 'Statistics & Probability',
    illustration: {
      id: 'stats-bell-curve-sd',
      altText: 'A bell curve with a center "mean" line and a highlighted +1.5 SD marker to its right.',
    },
    sections: [
      {
        heading: 'Mean & Median — Two Different "Middles"',
        body:
          'The **mean** (average) is the sum divided by the count. The **median** is the middle value after sorting.',
        example: {
          problem: 'Find the mean of `4, 8, 6, 10`. Find the median of `2, 2, 3, 5, 8`.',
          solution:
            '- Mean: sum is `28`, count is `4`, so mean = `28 / 4 = 7`\n- Median: already sorted, 5 values, the middle (3rd) value is `3`\n\nA frequent mix-up: the median requires the data to be **sorted first** — if you take the "middle" of an unsorted list, you\'ll likely get the wrong value. Also, don\'t confuse median (middle value) with mode (most frequent value) — `2` is the mode of that data set, but `3` is the median.',
        },
      },
      {
        heading: 'Probability — Favorable Over Total',
        body: 'Probability is a fraction: `favorable outcomes / total outcomes`.',
        example: {
          problem: 'A bag has 5 red and 3 blue marbles. What\'s the probability of drawing red?',
          solution:
            'Total marbles = `5 + 3 = 8`. Probability of red = `5 / 8`.\n\nThe denominator is always the **total** — all possible outcomes, not just the "other" category. A probability of `5/3` would be impossible (greater than 1), which is a good sanity check: probabilities are always between 0 and 1.',
        },
      },
      {
        heading: 'Standard Deviation — Measuring "How Far From Normal"',
        body:
          'Standard deviation (SD) measures typical spread from the mean. A value\'s distance from the mean, measured in SDs, tells you how unusual it is.',
        example: {
          problem:
            'A test has mean `500` and SD `100`. How many SDs above the mean is a score of `650`?',
          solution:
            '`(650 − 500) / 100 = 150 / 100 = 1.5` SDs above the mean.\n\nAlways find the **difference from the mean first**, then divide by the SD — dividing the raw score by the SD directly (skipping the subtraction) gives a meaningless number.',
        },
      },
    ],
  },

  {
    concept: 'geometry',
    title: 'Geometry',
    illustration: {
      id: 'geometry-pythagorean-squares',
      altText: 'A right triangle with squares built on each side, labeled with areas 36, 64, and 100.',
    },
    sections: [
      {
        heading: 'Area & Perimeter — Inside vs. Around',
        body:
          '**Area** is the space inside a shape; **perimeter** is the distance around it. For a rectangle: area = length × width, perimeter = 2 × (length + width).',
        example: {
          problem: 'A rectangle has length 8 and width 5. Find the area and perimeter.',
          solution:
            'Area = `8 × 5 = 40`. Perimeter = `2 × (8 + 5) = 26`.\n\nThese two formulas get swapped constantly — if a problem asks for area but you add the sides instead of multiplying, you\'ve calculated perimeter. Always double-check: area has units squared (sq. ft., cm², etc.), perimeter doesn\'t.',
        },
      },
      {
        heading: 'Circles — Everything Comes From the Radius',
        body: 'For a circle with radius `r`: circumference = `2πr`, area = `πr²`.',
        example: {
          problem: 'A circle has radius `6`. Find its circumference.',
          solution:
            'Circumference = `2πr = 2π(6) = 12π`.\n\nThe two formulas are easy to confuse — circumference has a `2` and no exponent; area has no `2` but squares the radius. If you see an answer choice that\'s `πr` (missing the `2`) or `r²π` (squared, when you wanted circumference), that\'s the trap.',
        },
      },
      {
        heading: 'The Pythagorean Theorem — Right Triangles\' Best-Kept Secret',
        body:
          'For any right triangle with legs `a` and `b` and hypotenuse `c`: `a² + b² = c²`. The hypotenuse is always the longest side, opposite the right angle.',
        example: {
          problem: 'A right triangle has legs `6` and `8`. Find the hypotenuse.',
          solution:
            '`6² + 8² = 36 + 64 = 100`, so `c = √100 = 10`.\n\nDon\'t just add the legs (`6 + 8 = 14`) — you square, add, then take the square root. `6-8-10` is the `3-4-5` triangle scaled by 2 — recognizing common Pythagorean triples can save you time.',
        },
      },
    ],
  },

  {
    concept: 'trig',
    title: 'Trigonometry',
    illustration: {
      id: 'trig-soh-cah-toa-triangle',
      altText: 'A right triangle with the angle θ labeled and the three sides identified as opposite, adjacent, and hypotenuse.',
    },
    sections: [
      {
        heading: 'SOH-CAH-TOA — Three Ratios, One Triangle',
        body:
          'In a right triangle, pick one of the non-right angles and call it `θ`. Relative to `θ`, the three sides have names: **hypotenuse** (always opposite the right angle), **opposite** (across from `θ`), and **adjacent** (next to `θ`, not the hypotenuse). The three trig ratios are:\n\n- `sin(θ) = opposite / hypotenuse`\n- `cos(θ) = adjacent / hypotenuse`\n- `tan(θ) = opposite / adjacent`',
        example: {
          problem:
            'A right triangle has hypotenuse `10` and one leg `6` (opposite `θ`). Find `cos(θ)`.',
          solution:
            'First find the missing leg: `10² − 6² = 100 − 36 = 64`, so the other leg (adjacent to `θ`) is `8`. Then `cos(θ) = adjacent / hypotenuse = 8 / 10 = 4/5`.\n\nThe #1 trig mistake is mixing up **opposite vs. adjacent** — which one is which depends entirely on which angle you\'re looking from. Always re-identify opposite/adjacent for the specific angle the question asks about.',
        },
      },
      {
        heading: 'Special Angles — Memorize the Triangle, Not the Table',
        body:
          'Two triangles generate almost every "special angle" value on the SAT: the `45-45-90` (an isoceles right triangle, legs equal) and the `30-60-90`.',
        example: {
          problem: 'Find `tan(45°)`.',
          solution:
            'In a `45-45-90` triangle, both legs are equal length. Since `tan(θ) = opposite/adjacent` and those two sides are equal, `tan(45°) = 1`.\n\nThe classic trap: swapping `sin(30°) = 1/2` and `sin(60°) = √3/2` — they\'re often presented as answer choices for each other. If you remember why (from the actual triangle\'s side lengths) rather than memorizing two similar-looking fractions, you\'re much less likely to swap them.',
        },
      },
    ],
  },

  {
    concept: 'grammar',
    title: 'Standard English Conventions',
    illustration: {
      id: 'grammar-subject-verb-bracket',
      altText: 'The sentence "The list [of items] is on the table" with the bracketed phrase grayed out and an arrow connecting "list" to "is".',
    },
    sections: [
      {
        heading: 'Subject-Verb Agreement — Find the Real Subject',
        body:
          'The verb must agree with its **subject** — but the subject isn\'t always the closest noun. Prepositional phrases and other modifiers often sit between the subject and verb, and they don\'t count.',
        example: {
          problem: '"The list of items ___ on the table." (is / are)',
          solution:
            'Mentally bracket out the prepositional phrase: "The list [of items] ___ on the table." The subject is "list" (singular), so the verb is **is** — even though "items" (plural) sits right before the blank.\n\nThis is one of the SAT\'s favorite traps: a plural noun placed right before the verb, tempting you to match it, when the actual subject (often earlier in the sentence) requires something different.',
        },
      },
      {
        heading: 'Joining Two Complete Sentences',
        body:
          'If you have two complete sentences (each could stand alone), you need one of: a period, a semicolon, or a comma + a connecting word like "and," "but," "or" (FANBOYS). A comma by itself is not enough — that\'s a "comma splice."',
        example: {
          problem:
            'Which is correct?\nA) "I went to the store, I bought milk."\nB) "I went to the store, and I bought milk."',
          solution:
            'B is correct. A is a comma splice — two complete sentences joined by only a comma.\n\nIf you can mentally split a sentence into two parts, each a complete thought on its own, check what\'s joining them. A lone comma is the most commonly-tested error here.',
        },
      },
    ],
  },

  {
    concept: 'reading',
    title: 'Reading & Vocab in Context',
    illustration: {
      id: 'reading-context-clue-focus',
      altText: 'A sentence with a target word highlighted and a magnifying glass focused on the nearby contrast word.',
    },
    sections: [
      {
        heading: 'Vocabulary in Context — Let the Sentence Decide',
        body:
          'Words can mean different things in different contexts, and the SAT often picks words with multiple possible meanings. Don\'t reach for the most common definition — reach for the one that fits this sentence, especially using contrast words like "unlike," "although," "despite," or "but."',
        example: {
          problem:
            '"Her approach to the problem was novel, unlike any method attempted before." What does "novel" mean here?',
          solution:
            'The phrase "unlike any method attempted before" is a huge clue — it\'s signaling difference from the past. That points to "new and original," not "famous" (a different meaning of "novel") and not "fictional" (a noun meaning of "novel").\n\nThe trap: picking a real meaning of the word that just doesn\'t fit this sentence. Context words — especially contrast signals — tell you which meaning is in play.',
        },
      },
      {
        heading: 'Main Idea — What Is This Passage Doing?',
        body:
          'Every passage has a job: describing, arguing, comparing, explaining a cause-and-effect. The main idea is usually revealed by how the sentences relate to each other — especially contrast and emphasis words.',
        example: {
          problem:
            '"Coral reefs... support nearly a quarter of all marine species despite covering less than one percent of the ocean floor." What\'s the main point?',
          solution:
            'The word "despite" sets up a contrast between tiny size and huge importance — that contrast is the point. The main idea is the disproportionate ecological importance of reefs, not just "reefs are small" or "reefs have many species" on their own.\n\nThe trap: choosing an answer that\'s true based on the passage but is too narrow — a supporting detail, not the overall point the contrast is making.',
        },
      },
    ],
  },
];

/** Map from ConceptId to its lesson, for O(1) lookup. */
export const LESSON_BY_CONCEPT: Record<string, Lesson> = Object.fromEntries(
  LESSONS.map((l) => [l.concept, l]),
);
