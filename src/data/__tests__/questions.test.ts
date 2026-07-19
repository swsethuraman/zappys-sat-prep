import { ALL_CONCEPTS } from '../concepts';
import { QUESTIONS, type Question } from '../questions';

const ALL_QUESTIONS: Question[] = ALL_CONCEPTS.flatMap((c) => QUESTIONS[c]);

// Locks the HN-09 diagnostic/pool boundary. These 16 IDs — and ONLY these —
// must carry `diagnostic: true`. The additive pool merge must never add,
// remove, or renumber any of them; if it does, this list fails loudly.
const EXPECTED_DIAGNOSTIC_IDS = [
  'linear-d1',
  'linear-d2',
  'quad-d1',
  'quad-d2',
  'ratios-d1',
  'ratios-d2',
  'stats-d1',
  'stats-d2',
  'geometry-d1',
  'geometry-d2',
  'trig-d1',
  'trig-d2',
  'grammar-d1',
  'grammar-d2',
  'reading-d1',
  'reading-d2',
];

describe('question bank — diagnostic boundary (HN-09)', () => {
  it('exactly the 16 expected questions are marked diagnostic', () => {
    const diagIds = ALL_QUESTIONS.filter((q) => q.diagnostic)
      .map((q) => q.id)
      .sort();
    expect(diagIds).toEqual([...EXPECTED_DIAGNOSTIC_IDS].sort());
  });

  it('every concept has exactly 2 diagnostic questions', () => {
    ALL_CONCEPTS.forEach((concept) => {
      const diag = QUESTIONS[concept].filter((q) => q.diagnostic);
      expect(diag).toHaveLength(2);
    });
  });

  it('diagnostic IDs follow the {concept}-d{n} convention', () => {
    ALL_QUESTIONS.filter((q) => q.diagnostic).forEach((q) => {
      expect(q.id).toBe(`${q.concept}-d${q.id.endsWith('d1') ? 1 : 2}`);
    });
  });

  it('pool IDs follow the {concept}-p{n} convention', () => {
    ALL_QUESTIONS.filter((q) => !q.diagnostic).forEach((q) => {
      expect(q.id).toMatch(new RegExp(`^${q.concept}-p\\d+$`));
    });
  });
});

describe('question bank — integrity', () => {
  it('every question ID is unique across the whole bank', () => {
    const ids = ALL_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every question's concept matches the map it lives under", () => {
    ALL_CONCEPTS.forEach((concept) => {
      QUESTIONS[concept].forEach((q) => expect(q.concept).toBe(concept));
    });
  });

  it('every question has OPACC feedback for each wrong choice', () => {
    ALL_QUESTIONS.forEach((q) => {
      expect(q.misconceptionByChoice).toHaveLength(q.choices.length);
      q.choices.forEach((_, i) => {
        if (i === q.correctIndex) return;
        expect(q.misconceptionByChoice[i].length).toBeGreaterThan(0);
      });
    });
  });

  it('correctIndex is within range for every question', () => {
    ALL_QUESTIONS.forEach((q) => {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.choices.length);
    });
  });

  it('every difficulty is 1, 2, or 3', () => {
    ALL_QUESTIONS.forEach((q) => expect([1, 2, 3]).toContain(q.difficulty));
  });
});

describe('question bank — counts (post-merge)', () => {
  it('has exactly 240 questions, 30 per concept', () => {
    expect(ALL_QUESTIONS).toHaveLength(240);
    ALL_CONCEPTS.forEach((concept) => {
      expect(QUESTIONS[concept]).toHaveLength(30);
    });
  });

  it('has 2 diagnostic + 28 pool questions per concept', () => {
    ALL_CONCEPTS.forEach((concept) => {
      const diag = QUESTIONS[concept].filter((q) => q.diagnostic);
      const poolQ = QUESTIONS[concept].filter((q) => !q.diagnostic);
      expect(diag).toHaveLength(2);
      expect(poolQ).toHaveLength(28);
    });
  });
});
