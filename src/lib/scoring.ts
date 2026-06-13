// Zappy's SAT Prep — scoring engine, ported from the HTML prototype.
//
// The model: each concept has a "mastery" value in [0.05, 0.97]. A
// section score (Math, or Reading & Writing) is the average mastery
// across that section's concepts, mapped linearly onto the 200-800 SAT
// sub-score range and rounded to the nearest 10 (as real SAT scores are
// reported). Total score is the sum of the two section scores.

import { ALL_CONCEPTS, MATH_CONCEPTS, RW_CONCEPTS, type ConceptId } from '../data/concepts';
import { masteryColor, masteryLabel } from '../theme/colors';
import type { MasteryMap } from './types';

export const MASTERY_MIN = 0.05;
export const MASTERY_MAX = 0.97;

/** Mastery moves 18% of the way toward 1 (correct) or 0 (incorrect) per answer. */
export const LEARNING_RATE = 0.18;

export function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

/**
 * Average mastery across a set of concepts, mapped onto the 200-800 SAT
 * sub-score scale and rounded to the nearest 10.
 */
export function sectionScore(mastery: MasteryMap, concepts: ConceptId[]): number {
  const avg = concepts.reduce((sum, c) => sum + mastery[c], 0) / concepts.length;
  const raw = clamp(200 + 600 * avg, 200, 800);
  return Math.round(raw / 10) * 10;
}

/** Sum of the Math and Reading & Writing section scores (400-1600). */
export function totalScore(mastery: MasteryMap): number {
  return sectionScore(mastery, MATH_CONCEPTS) + sectionScore(mastery, RW_CONCEPTS);
}

/**
 * Returns a new mastery map with `concept` nudged toward 1 (correct) or 0
 * (incorrect) by LEARNING_RATE, clamped to [MASTERY_MIN, MASTERY_MAX].
 * Pure — does not mutate the input.
 */
export function updateMastery(mastery: MasteryMap, concept: ConceptId, correct: boolean): MasteryMap {
  const target = correct ? 1 : 0;
  const next = mastery[concept] + LEARNING_RATE * (target - mastery[concept]);
  return {
    ...mastery,
    [concept]: clamp(next, MASTERY_MIN, MASTERY_MAX),
  };
}

/**
 * The concept with the lowest mastery, excluding any in `exclude`.
 * Ties broken by concept order in ALL_CONCEPTS.
 */
export function weakestConcept(mastery: MasteryMap, exclude: ConceptId[] = []): ConceptId {
  let best: ConceptId | null = null;
  ALL_CONCEPTS.forEach((c) => {
    if (exclude.includes(c)) return;
    if (best === null || mastery[c] < mastery[best]) best = c;
  });
  // ALL_CONCEPTS is non-empty and exclude should never cover every concept
  // in normal use, but fall back to the first concept defensively.
  return best ?? ALL_CONCEPTS[0];
}

/** Concepts sorted weakest-first — used for the diagnostic results screen. */
export function sortByMastery(mastery: MasteryMap, concepts: ConceptId[] = ALL_CONCEPTS): ConceptId[] {
  return [...concepts].sort((a, b) => mastery[a] - mastery[b]);
}

// Re-exported for convenience so screens can `import { masteryColor } from
// '../lib/scoring'` alongside the rest of the scoring helpers, without
// duplicating the implementation (which lives in theme/colors.ts since
// it's also a styling concern).
export { masteryColor, masteryLabel };
