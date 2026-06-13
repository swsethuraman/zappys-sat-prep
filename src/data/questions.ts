// Zappy's SAT Prep — question bank, ported from the HTML prototype.
//
// Each concept has 4 questions at difficulties [1, 1, 2, 3]:
//   - index 0 (difficulty 1) and index 2 (difficulty 2) make up the
//     16-question diagnostic.
//   - index 1 (difficulty 1) and index 3 (difficulty 3) form the
//     repeating practice-session pool.
//
// `misconceptionByChoice` is index-aligned with `choices`; the entry at
// `correctIndex` is an empty string and unused (the correct-answer
// feedback uses `explanation` instead). This mirrors OPACC-style
// pre-computed misconception feedback — no live LLM call needed.

import type { ConceptId } from './concepts';

export interface Question {
  concept: ConceptId;
  difficulty: 1 | 2 | 3;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  misconceptionByChoice: string[];
}

const DIFFICULTIES: (1 | 2 | 3)[] = [1, 1, 2, 3];

function buildConcept(
  concept: ConceptId,
  entries: {
    q: string;
    c: string[];
    a: number;
    exp: string;
    w: string[];
  }[],
): Question[] {
  return entries.map((entry, i) => ({
    concept,
    difficulty: DIFFICULTIES[i],
    prompt: entry.q,
    choices: entry.c,
    correctIndex: entry.a,
    explanation: entry.exp,
    misconceptionByChoice: entry.w,
  }));
}

export const QUESTIONS: Record<ConceptId, Question[]> = {
  linear: buildConcept('linear', [
    {
      q: 'If 3x + 5 = 20, what is x?',
      c: ['5', '6', '15', '25'],
      a: 0,
      exp: 'Subtract 5 from both sides to get 3x = 15, then divide by 3: x = 5.',
      w: [
        '',
        'Looks like an arithmetic slip on 20 minus 5 — recheck that subtraction first.',
        'This is the value of 3x, not x — you still need to divide by 3.',
        'This comes from adding 5 instead of subtracting it.',
      ],
    },
    {
      q: 'Solve for y: 2y − 4 = 10',
      c: ['3', '6', '7', '14'],
      a: 2,
      exp: 'Add 4 to both sides: 2y = 14, then divide by 2: y = 7.',
      w: [
        'This treats the operations out of order — undo subtraction (add 4) before dividing.',
        'Close — recheck by adding 4 to 10 first, then dividing by 2.',
        '',
        'This is the value of 2y, not y — the final division by 2 is missing.',
      ],
    },
    {
      q: 'System: x + y = 10 and x − y = 2. What is x?',
      c: ['4', '6', '8', '2'],
      a: 1,
      exp: 'Add the two equations: 2x = 12, so x = 6.',
      w: [
        'This is the value of y, not x — double check which variable you solved for.',
        '',
        'Test it: 8 + 2 = 10 works, but 8 − 2 = 6 ≠ 2, so this doesn\u2019t satisfy both equations.',
        'This is x − y, not x itself.',
      ],
    },
    {
      q: 'A line passes through (2,3) and (4,7). What is its slope?',
      c: ['1', '2', '4', '0.5'],
      a: 1,
      exp: 'Slope = (7−3)/(4−2) = 4/2 = 2.',
      w: [
        'Check the rise — it\u2019s 4, not 2.',
        '',
        'This is the rise alone, not rise over run.',
        'This is run over rise (the reciprocal of slope).',
      ],
    },
  ]),

  quad: buildConcept('quad', [
    {
      q: 'If f(x) = x² − 4, what is f(3)?',
      c: ['5', '9', '1', '13'],
      a: 0,
      exp: 'f(3) = 3² − 4 = 9 − 4 = 5.',
      w: [
        '',
        'This is 3² alone — the −4 still needs to be applied.',
        'This would be true for 4 − x² instead.',
        'This comes from adding 4 instead of subtracting it.',
      ],
    },
    {
      q: 'Factor: x² − 9',
      c: ['(x−3)(x+3)', '(x−9)(x+1)', '(x−3)²', '(x+9)(x−1)'],
      a: 0,
      exp: 'x² − 9 is a difference of squares: x² − 3² = (x−3)(x+3).',
      w: [
        '',
        'This pair multiplies to x² − 8x − 9, not x² − 9 — the constants must be ±3.',
        '(x−3)² expands to x² − 6x + 9, which has a middle term — this expression has none.',
        'Expanding gives x² + 8x − 9, which doesn\u2019t match.',
      ],
    },
    {
      q: 'Solve x² − 5x + 6 = 0. What is the smaller root?',
      c: ['2', '3', '−2', '−3'],
      a: 0,
      exp: 'Factors to (x−2)(x−3) = 0, so x = 2 or 3 — the smaller root is 2.',
      w: [
        '',
        '3 is a root, but it\u2019s the larger one — the question asks for the smaller.',
        'The roots here are positive — check the signs in (x−2)(x−3).',
        'The roots here are positive — check the signs in (x−2)(x−3).',
      ],
    },
    {
      q: 'For f(x) = 2x² − 8x + 3, what is the x-coordinate of the vertex?',
      c: ['2', '4', '−2', '1'],
      a: 0,
      exp: 'Vertex x = −b/(2a) = −(−8)/(2·2) = 8/4 = 2.',
      w: [
        '',
        'This is b/a, not b/(2a) — the 2a in the denominator was missed.',
        'Watch the sign: −b/(2a) with b = −8 gives a positive result.',
        'This would be correct if a were 4, but here a = 2.',
      ],
    },
  ]),

  ratios: buildConcept('ratios', [
    {
      q: 'A recipe uses 2 cups flour for every 3 cups sugar. For 9 cups sugar, how many cups of flour are needed?',
      c: ['6', '4.5', '8', '12'],
      a: 0,
      exp: '2/3 = x/9. Since 9 = 3×3, x = 2×3 = 6.',
      w: [
        '',
        'This is half of 9, but the ratio is 2:3, not 1:2.',
        'This breaks the 2:3 ratio — scale both numbers by the same factor.',
        'This scales sugar by 3 but flour by 6 — both should scale by the same factor.',
      ],
    },
    {
      q: 'What is 25% of 80?',
      c: ['20', '16', '25', '30'],
      a: 0,
      exp: '25% = 1/4, and 80 ÷ 4 = 20.',
      w: [
        '',
        'This is 20% of 80, not 25%.',
        'This is the percentage itself, not the result of applying it to 80.',
        'Recheck — this is closer to 37.5% of 80.',
      ],
    },
    {
      q: 'A shirt priced at $40 is discounted 15%. What is the sale price?',
      c: ['$34', '$36', '$38', '$32'],
      a: 0,
      exp: '15% of 40 is 6, and 40 − 6 = 34.',
      w: [
        '',
        'This subtracts 10% rather than 15%.',
        'This subtracts only 5%.',
        'This subtracts 20%, more than the actual 15% discount.',
      ],
    },
    {
      q: 'A quantity increases from 80 to 100. What is the percent increase?',
      c: ['25%', '20%', '15%', '30%'],
      a: 0,
      exp: 'Percent increase = (change/original)×100 = (20/80)×100 = 25%.',
      w: [
        '',
        'This is the change as a percent of the new value, not the original.',
        'Divide the change (20) by the original (80), not an estimate.',
        'Divide the change (20) by the original (80), not an estimate.',
      ],
    },
  ]),

  stats: buildConcept('stats', [
    {
      q: 'The mean of 4, 8, 6, 10 is?',
      c: ['7', '8', '6', '9'],
      a: 0,
      exp: 'Sum = 28, and 28 ÷ 4 = 7.',
      w: [
        '',
        'Recompute the sum: 4+8+6+10 = 28, then divide by 4.',
        '6 is one data point, not the average of all four.',
        'That would require a sum of 36, but the actual sum is 28.',
      ],
    },
    {
      q: 'A bag has 5 red and 3 blue marbles. What is the probability of drawing a red marble?',
      c: ['5/8', '3/8', '5/3', '1/2'],
      a: 0,
      exp: 'Probability = favorable/total = 5/(5+3) = 5/8.',
      w: [
        '',
        'This is the probability of drawing blue, not red.',
        'Probabilities can\u2019t exceed 1 — the denominator should be the total count (8).',
        'This assumes equal red and blue, but there are 5 red and 3 blue.',
      ],
    },
    {
      q: 'Data set: 2, 2, 3, 5, 8. What is the median?',
      c: ['3', '2', '5', '4'],
      a: 0,
      exp: 'With 5 values in order, the median is the middle (3rd) value: 3.',
      w: [
        '',
        '2 is the mode (most frequent), not the median.',
        '5 is the 4th value, not the middle one.',
        '4 isn\u2019t even in the data set — the median is an actual middle value here.',
      ],
    },
    {
      q: 'A test has mean 500 and standard deviation 100. A score of 650 is how many standard deviations above the mean?',
      c: ['1.5', '1', '2', '0.65'],
      a: 0,
      exp: '(650 − 500) / 100 = 150/100 = 1.5.',
      w: [
        '',
        'That would correspond to a score of 600, not 650.',
        'That would correspond to a score of 700.',
        'Find the difference from the mean first, then divide by the SD.',
      ],
    },
  ]),

  geometry: buildConcept('geometry', [
    {
      q: 'A rectangle has length 8 and width 5. What is its area?',
      c: ['40', '26', '13', '45'],
      a: 0,
      exp: 'Area = length × width = 8 × 5 = 40.',
      w: [
        '',
        '26 is the perimeter (2×(8+5)), not the area.',
        '13 is just the sum of the side lengths, not the area.',
        'Recheck the multiplication — 8 × 5 = 40.',
      ],
    },
    {
      q: 'What is the sum of the interior angles of a triangle?',
      c: ['180°', '360°', '90°', '270°'],
      a: 0,
      exp: 'The interior angles of any triangle always sum to 180°.',
      w: [
        '',
        '360° is the angle sum for a quadrilateral, not a triangle.',
        '90° is a single right angle, not the total for all three angles.',
        'Triangles always total 180°, not 270°.',
      ],
    },
    {
      q: 'A circle has radius 6. What is its circumference?',
      c: ['12π', '6π', '36π', '3π'],
      a: 0,
      exp: 'Circumference = 2πr = 2π(6) = 12π.',
      w: [
        '',
        'This skips the factor of 2 — C = 2πr, not πr.',
        '36π is the area\u2019s r² term (πr²), not the circumference.',
        'Recheck the formula C = 2πr.',
      ],
    },
    {
      q: 'In a right triangle, the legs are 6 and 8. What is the hypotenuse?',
      c: ['10', '12', '14', '9'],
      a: 0,
      exp: 'By the Pythagorean theorem, √(6²+8²) = √(36+64) = √100 = 10.',
      w: [
        '',
        'Recheck with the actual legs 6 and 8 — 12 doesn\u2019t fit here.',
        '14 is just 6+8 — the theorem requires squaring and a square root, not addition.',
        '9²=81, but 6²+8²=100, so the hypotenuse must be √100=10.',
      ],
    },
  ]),

  trig: buildConcept('trig', [
    {
      q: 'In a right triangle, sin(θ) = opposite ÷ ?',
      c: ['hypotenuse', 'adjacent', 'opposite', 'perimeter'],
      a: 0,
      exp: 'By definition, sine is the ratio of the opposite side to the hypotenuse.',
      w: [
        '',
        'Opposite/adjacent is the definition of tangent, not sine.',
        'A ratio of a side to itself would always equal 1 — sine varies with the angle.',
        'The perimeter isn\u2019t part of any standard trig ratio.',
      ],
    },
    {
      q: 'If θ = 30°, sin(θ) = ?',
      c: ['1/2', '√2/2', '√3/2', '1'],
      a: 0,
      exp: 'sin(30°) = 1/2 is a standard value from the 30-60-90 triangle.',
      w: [
        '',
        '√2/2 is sin(45°), not sin(30°).',
        '√3/2 is sin(60°) (or cos(30°)) — these two are often swapped.',
        'sin(θ) = 1 only at θ = 90°.',
      ],
    },
    {
      q: 'A right triangle has hypotenuse 10 and one leg 6 (opposite angle θ). What is cos(θ)?',
      c: ['4/5', '3/5', '6/8', '8/6'],
      a: 0,
      exp: 'The other leg = √(10²−6²) = 8. cos(θ) = adjacent/hypotenuse = 8/10 = 4/5.',
      w: [
        '',
        'This swaps which side is adjacent vs. opposite — cosine uses the adjacent leg over the hypotenuse.',
        'Leg/leg is the tangent ratio, not cosine — cosine must have the hypotenuse in the denominator.',
        'This is the reciprocal of a tangent ratio, not cosine.',
      ],
    },
    {
      q: 'tan(45°) = ?',
      c: ['1', '0', '√2', '1/2'],
      a: 0,
      exp: 'At 45°, the opposite and adjacent sides are equal, so tan(45°) = 1.',
      w: [
        '',
        'tan(θ) = 0 only at θ = 0°.',
        '√2 relates to the hypotenuse of a 45-45-90 triangle, not the tangent ratio.',
        'tan(45°) is exactly 1 because the legs of a 45-45-90 triangle are equal.',
      ],
    },
  ]),

  grammar: buildConcept('grammar', [
    {
      q: 'Choose the correct verb: "The team ___ practicing every day."',
      c: ['is', 'are', 'were', 'be'],
      a: 0,
      exp: '"Team" is a singular collective noun, so it takes the singular verb "is."',
      w: [
        '',
        '"Team" is treated as a single unit in standard grammar, so it pairs with a singular verb.',
        '"Were" is both plural and past tense — the sentence describes an ongoing present routine.',
        '"Be" needs a helper (e.g., "will be") — it can\u2019t stand alone as the main verb here.',
      ],
    },
    {
      q: 'Which sentence uses the correct possessive form for one dog?',
      c: [
        "The dog's bone is buried.",
        "The dogs' bone is buried.",
        "The dog bone's is buried.",
        'Dogs bone is buried.',
      ],
      a: 0,
      exp: 'For a single dog owning the bone, add \u2019s: "the dog\u2019s bone."',
      w: [
        '',
        'Dogs\u2019 (apostrophe after s) implies multiple dogs, but the sentence specifies one.',
        'The possessive \u2019s belongs on "dog," the owner — not on "bone," the thing owned.',
        'This is missing the possessive apostrophe entirely.',
      ],
    },
    {
      q: 'Choose the correctly punctuated sentence.',
      c: [
        'I went to the store, and I bought milk.',
        'I went to the store, I bought milk.',
        'I went to the store I bought milk.',
        'I went to the store; and I bought milk.',
      ],
      a: 0,
      exp: 'A comma plus a coordinating conjunction ("and") correctly joins two independent clauses.',
      w: [
        '',
        'This is a comma splice — two independent clauses joined by only a comma.',
        'This is a run-on — two independent clauses with no punctuation or conjunction.',
        'A semicolon shouldn\u2019t be followed by "and" — use either a semicolon alone or comma+and.',
      ],
    },
    {
      q: 'Choose the verb that agrees with the subject: "The list of items ___ on the table."',
      c: ['is', 'are', 'were', 'have been'],
      a: 0,
      exp: 'The subject is "list" (singular), not "items" — so the verb must be singular: "is."',
      w: [
        '',
        'This agrees with "items," but "items" is part of a prepositional phrase, not the subject.',
        'Besides the agreement issue, "were" is past tense, but the sentence is present.',
        '"Have been" is plural and doesn\u2019t match the singular subject "list."',
      ],
    },
  ]),

  reading: buildConcept('reading', [
    {
      q: '"Her approach to the problem was novel, unlike any method attempted before." As used in the text, "novel" most nearly means',
      c: ['new and original', 'famous', 'fictional', 'traditional'],
      a: 0,
      exp: '"Unlike any method attempted before" signals that "novel" here means new and original.',
      w: [
        '',
        'Nothing suggests the approach was widely known — only that it differed from prior methods.',
        'This confuses "novel" (a type of book) with the adjective meaning new.',
        'This is the opposite of the intended meaning — the context emphasizes how different the approach was.',
      ],
    },
    {
      q: '"Coral reefs, often called the rainforests of the sea, support nearly a quarter of all marine species despite covering less than one percent of the ocean floor." The main purpose of this sentence is to',
      c: [
        'highlight the disproportionate ecological importance of coral reefs',
        'describe the physical structure of coral reefs',
        'compare coral reefs to rainforests in appearance',
        'argue that coral reefs cover most of the ocean',
      ],
      a: 0,
      exp: 'The contrast between \u2018a quarter of all species\u2019 and \u2018less than one percent of the ocean floor\u2019 emphasizes how significant reefs are relative to their size.',
      w: [
        '',
        'The sentence gives statistics about species and area, not physical structure.',
        'The rainforest comparison is about ecological richness, not appearance.',
        'The sentence explicitly says reefs cover less than one percent of the ocean floor.',
      ],
    },
    {
      q: '"Although the museum\u2019s new wing was completed on schedule, its opening was delayed for months while curators debated how to arrange the controversial exhibit." It can reasonably be inferred that',
      c: [
        'the delay was caused by disagreement rather than construction issues',
        'the museum was never finished',
        'the exhibit was removed entirely',
        'the curators agreed quickly on the arrangement',
      ],
      a: 0,
      exp: 'The contrast between on-schedule construction and a delay due to \u2018debate\u2019 implies the holdup was about disagreement, not building work.',
      w: [
        '',
        'The text says the wing "was completed on schedule," so it was finished.',
        'There\u2019s no mention of the exhibit being removed — only that its arrangement was debated.',
        '"Debated for months" indicates disagreement, the opposite of quick agreement.',
      ],
    },
    {
      q: 'Sentence 1: The festival attracts thousands of visitors each year. Sentence 2: Many local businesses depend on this seasonal income. Which choice most effectively combines the two while preserving the relationship between the ideas?',
      c: [
        'The festival, which attracts thousands of visitors each year, provides seasonal income that many local businesses depend on.',
        'The festival attracts thousands of visitors, but local businesses are unrelated.',
        'Visitors attend the festival, and businesses exist locally.',
        'Thousands attend yearly; income is seasonal for some.',
      ],
      a: 0,
      exp: 'This choice links both ideas with a relative clause, preserving the cause-effect relationship between visitors and business income.',
      w: [
        '',
        '"But...unrelated" contradicts the original relationship — the sentences show a connection.',
        'This drops the key link between visitor numbers and business income entirely.',
        'This is vague and loses the clear link between the festival and the businesses\u2019 income.',
      ],
    },
  ]),
};

/** Returns the Question at a given concept + index (0-3). */
export function getQuestion(concept: ConceptId, qi: number): Question {
  return QUESTIONS[concept][qi];
}
