import { ALL_CONCEPTS, MATH_CONCEPTS, RW_CONCEPTS } from '../../data/concepts';
import {
  clamp,
  MASTERY_MAX,
  MASTERY_MIN,
  sectionScore,
  sortByMastery,
  totalScore,
  updateMastery,
  weakestConcept,
} from '../scoring';
import { createInitialProgress } from '../types';

function flatMastery(value: number) {
  const m = createInitialProgress().mastery;
  ALL_CONCEPTS.forEach((c) => (m[c] = value));
  return m;
}

describe('clamp', () => {
  it('clamps below the minimum', () => {
    expect(clamp(-1, 0, 1)).toBe(0);
  });
  it('clamps above the maximum', () => {
    expect(clamp(2, 0, 1)).toBe(1);
  });
  it('passes through in-range values', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});

describe('sectionScore', () => {
  it('maps mastery 0 to the floor (200), rounded to nearest 10', () => {
    const mastery = flatMastery(0);
    expect(sectionScore(mastery, MATH_CONCEPTS)).toBe(200);
  });

  it('maps mastery 1 to the ceiling (800)', () => {
    const mastery = flatMastery(1);
    expect(sectionScore(mastery, MATH_CONCEPTS)).toBe(800);
  });

  it('maps mastery 0.5 to the midpoint (500)', () => {
    const mastery = flatMastery(0.5);
    expect(sectionScore(mastery, RW_CONCEPTS)).toBe(500);
  });

  it('always rounds to the nearest 10', () => {
    const mastery = flatMastery(0.333);
    const score = sectionScore(mastery, MATH_CONCEPTS);
    expect(score % 10).toBe(0);
  });
});

describe('totalScore', () => {
  it('is the sum of both section scores', () => {
    const mastery = flatMastery(0.5);
    expect(totalScore(mastery)).toBe(sectionScore(mastery, MATH_CONCEPTS) + sectionScore(mastery, RW_CONCEPTS));
    expect(totalScore(mastery)).toBe(1000);
  });

  it('ranges from 400 to 1600 across the full mastery range', () => {
    expect(totalScore(flatMastery(0))).toBe(400);
    expect(totalScore(flatMastery(1))).toBe(1600);
  });
});

describe('updateMastery', () => {
  it('moves mastery toward 1 on a correct answer', () => {
    const mastery = flatMastery(0.3);
    const next = updateMastery(mastery, 'linear', true);
    expect(next.linear).toBeGreaterThan(mastery.linear);
    expect(next.linear).toBeCloseTo(0.3 + 0.18 * (1 - 0.3), 5);
  });

  it('moves mastery toward 0 on an incorrect answer', () => {
    const mastery = flatMastery(0.3);
    const next = updateMastery(mastery, 'linear', false);
    expect(next.linear).toBeLessThan(mastery.linear);
    expect(next.linear).toBeCloseTo(0.3 + 0.18 * (0 - 0.3), 5);
  });

  it('does not mutate the input map', () => {
    const mastery = flatMastery(0.3);
    const before = { ...mastery };
    updateMastery(mastery, 'linear', true);
    expect(mastery).toEqual(before);
  });

  it('never exceeds MASTERY_MAX even with many correct answers', () => {
    let mastery = flatMastery(0.9);
    for (let i = 0; i < 50; i++) {
      mastery = updateMastery(mastery, 'linear', true);
    }
    expect(mastery.linear).toBeLessThanOrEqual(MASTERY_MAX);
    expect(mastery.linear).toBeCloseTo(MASTERY_MAX, 5);
  });

  it('never drops below MASTERY_MIN even with many incorrect answers', () => {
    let mastery = flatMastery(0.1);
    for (let i = 0; i < 50; i++) {
      mastery = updateMastery(mastery, 'linear', false);
    }
    expect(mastery.linear).toBeGreaterThanOrEqual(MASTERY_MIN);
    expect(mastery.linear).toBeCloseTo(MASTERY_MIN, 5);
  });

  it('only changes the targeted concept', () => {
    const mastery = flatMastery(0.3);
    const next = updateMastery(mastery, 'linear', true);
    ALL_CONCEPTS.filter((c) => c !== 'linear').forEach((c) => {
      expect(next[c]).toBe(mastery[c]);
    });
  });
});

describe('weakestConcept', () => {
  it('returns the concept with the lowest mastery', () => {
    const mastery = flatMastery(0.5);
    mastery.trig = 0.1;
    expect(weakestConcept(mastery)).toBe('trig');
  });

  it('respects the exclude list', () => {
    const mastery = flatMastery(0.5);
    mastery.trig = 0.1;
    mastery.quad = 0.2;
    expect(weakestConcept(mastery, ['trig'])).toBe('quad');
  });

  it('breaks ties by ALL_CONCEPTS order', () => {
    const mastery = flatMastery(0.4);
    // all tied — should return the first concept in ALL_CONCEPTS
    expect(weakestConcept(mastery)).toBe(ALL_CONCEPTS[0]);
  });
});

describe('sortByMastery', () => {
  it('sorts concepts weakest-first', () => {
    const mastery = flatMastery(0.5);
    mastery.trig = 0.1;
    mastery.quad = 0.2;
    const sorted = sortByMastery(mastery);
    expect(sorted[0]).toBe('trig');
    expect(sorted[1]).toBe('quad');
  });
});
