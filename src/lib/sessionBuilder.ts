// Zappy's SAT Prep — session builder, ported from the HTML prototype.
//
// Three pieces of VijAI-derived logic live here:
//   - WAD (warm-up-as-diagnostic): each session opens with 2 questions
//     from the concepts least recently practiced (spaced repetition).
//   - APDE (adaptive prerequisite-aware targeting): the main set drills
//     the single weakest concept, inserting a "refresher" question on
//     its prerequisite first if that prerequisite is also weak.
//   - Score projection: a best-case / worst-case simulation of how much
//     a session could move the total score, without mutating real state.

import { ALL_CONCEPTS, CONCEPTS, type ConceptId } from '../data/concepts';
import { QUESTIONS } from '../data/questions';
import {
  clamp,
  LEARNING_RATE,
  MASTERY_MAX,
  MASTERY_MIN,
  sectionScore,
  totalScore,
  updateMastery,
  weakestConcept,
} from './scoring';
import type { MasteryMap, PoolIndexMap, SessionHistoryEntry, UserProgress } from './types';

/** Practice-session question pool: indices 1 (difficulty 1) and 3 (difficulty 3), cycling. */
const SESSION_POOL = [1, 3] as const;

export type SessionItemKind = 'warmup' | 'prereq' | 'main';

export interface SessionQueueItem {
  concept: ConceptId;
  /** Index into QUESTIONS[concept] (0-3). */
  qi: number;
  kind: SessionItemKind;
}

export interface SessionAnswer {
  concept: ConceptId;
  correct: boolean;
  kind: SessionItemKind;
}

export interface BuiltSession {
  queue: SessionQueueItem[];
  /** Updated pool cursors — persist these back onto UserProgress.poolIndex. */
  poolIndex: PoolIndexMap;
}

function nextPoolQuestion(poolIndex: PoolIndexMap, concept: ConceptId): { qi: number; poolIndex: PoolIndexMap } {
  const cursor = poolIndex[concept] ?? 0;
  const qi = SESSION_POOL[cursor % SESSION_POOL.length];
  return { qi, poolIndex: { ...poolIndex, [concept]: cursor + 1 } };
}

/**
 * Concepts ordered by how overdue they are for review: the concept whose
 * `lastSeen` session is furthest in the past comes first. Ties are broken
 * by lowest mastery first (review the weaker of two equally-stale topics).
 */
export function conceptsByRecency(progress: Pick<UserProgress, 'mastery' | 'lastSeen' | 'sessionCount'>): ConceptId[] {
  return [...ALL_CONCEPTS].sort((a, b) => {
    const staleA = progress.sessionCount - progress.lastSeen[a];
    const staleB = progress.sessionCount - progress.lastSeen[b];
    if (staleB !== staleA) return staleB - staleA;
    return progress.mastery[a] - progress.mastery[b];
  });
}

/**
 * Builds the next practice session's question queue:
 *  1. WAD warm-up — 2 questions from the most overdue concepts.
 *  2. APDE prerequisite check — if the weakest concept's prerequisite is
 *     also below mastery 0.6 and wasn't already covered by the warm-up,
 *     insert one refresher question on it.
 *  3. Main set — 2 questions on the weakest concept itself.
 */
export function buildSession(progress: UserProgress): BuiltSession {
  let poolIndex = progress.poolIndex;
  const queue: SessionQueueItem[] = [];

  const warmupConcepts = conceptsByRecency(progress).slice(0, 2);
  warmupConcepts.forEach((concept) => {
    const next = nextPoolQuestion(poolIndex, concept);
    poolIndex = next.poolIndex;
    queue.push({ concept, qi: next.qi, kind: 'warmup' });
  });

  const target = weakestConcept(progress.mastery);
  const prereq = CONCEPTS[target].prereq;
  if (prereq && progress.mastery[prereq] < 0.6 && !warmupConcepts.includes(prereq)) {
    const next = nextPoolQuestion(poolIndex, prereq);
    poolIndex = next.poolIndex;
    queue.push({ concept: prereq, qi: next.qi, kind: 'prereq' });
  }

  for (let i = 0; i < 2; i++) {
    const next = nextPoolQuestion(poolIndex, target);
    poolIndex = next.poolIndex;
    queue.push({ concept: target, qi: next.qi, kind: 'main' });
  }

  return { queue, poolIndex };
}

export interface ProjectedGain {
  /** Smaller (possibly negative) end of the projected point swing. */
  lo: number;
  /** Larger end of the projected point swing. */
  hi: number;
}

/**
 * Estimates how many total-score points the *next* session could add,
 * without mutating progress or advancing pool cursors. Simulates the same
 * set of "touched" concepts that buildSession() would target, then
 * computes the resulting score if every question in the session were
 * answered correctly (best case) vs. incorrectly (worst case).
 */
export function projectSessionGain(progress: UserProgress): ProjectedGain {
  const warmupConcepts = conceptsByRecency(progress).slice(0, 2);
  const target = weakestConcept(progress.mastery);
  const prereq = CONCEPTS[target].prereq;

  const touched: Partial<Record<ConceptId, number>> = {};
  const bump = (c: ConceptId) => {
    touched[c] = (touched[c] ?? 0) + 1;
  };
  warmupConcepts.forEach(bump);
  if (prereq && progress.mastery[prereq] < 0.6 && !warmupConcepts.includes(prereq)) {
    bump(prereq);
  }
  bump(target);
  bump(target);

  const simulate = (allCorrect: boolean): number => {
    let mastery: MasteryMap = { ...progress.mastery };
    (Object.keys(touched) as ConceptId[]).forEach((concept) => {
      const count = touched[concept] ?? 0;
      for (let i = 0; i < count; i++) {
        mastery = updateMastery(mastery, concept, allCorrect);
      }
    });
    return totalScore(mastery);
  };

  const currentScore = progress.currentScore ?? totalScore(progress.mastery);
  const bestCase = simulate(true) - currentScore;
  const worstCase = simulate(false) - currentScore;

  return { lo: Math.min(bestCase, worstCase), hi: Math.max(bestCase, worstCase) };
}

// ---------------------------------------------------------------------
// Diagnostic
// ---------------------------------------------------------------------

export interface DiagnosticQueueItem {
  concept: ConceptId;
  qi: number;
}

/**
 * The 16-question diagnostic: questions at index 0 (difficulty 1) and
 * index 2 (difficulty 2) for every concept, in a fixed (unshuffled) order.
 * Shuffle separately if desired — kept deterministic here for testability.
 */
export function buildDiagnosticQueue(): DiagnosticQueueItem[] {
  const queue: DiagnosticQueueItem[] = [];
  ALL_CONCEPTS.forEach((concept) => {
    queue.push({ concept, qi: 0 });
    queue.push({ concept, qi: 2 });
  });
  return queue;
}

/** Fisher-Yates shuffle. Pass a seeded RNG in tests for determinism. */
export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Given the diagnostic answers (2 per concept), sets initial mastery per
 * concept to 0.15 + 0.7 * (correctCount / 2) — i.e. 0.15 for 0/2 correct,
 * 0.5 for 1/2, 0.85 for 2/2 — clamped to [0.05, 0.95]. Records the
 * resulting total score as both baselineScore and currentScore, and seeds
 * history with a "Diagnostic" entry.
 */
export function applyDiagnosticResults(
  progress: UserProgress,
  answers: { concept: ConceptId; correct: boolean }[],
): UserProgress {
  const correctCounts: Partial<Record<ConceptId, number>> = {};
  answers.forEach(({ concept, correct }) => {
    if (correct) correctCounts[concept] = (correctCounts[concept] ?? 0) + 1;
  });

  const mastery: MasteryMap = { ...progress.mastery };
  ALL_CONCEPTS.forEach((concept) => {
    const correct = correctCounts[concept] ?? 0;
    mastery[concept] = clamp(0.15 + 0.7 * (correct / 2), MASTERY_MIN, 0.95);
  });

  const baselineScore = totalScore(mastery);
  const history: SessionHistoryEntry[] = [{ n: 0, label: 'Diagnostic', score: baselineScore, delta: 0 }];

  return {
    ...progress,
    mastery,
    baselineScore,
    currentScore: baselineScore,
    history,
    diagnosticDone: true,
  };
}

// ---------------------------------------------------------------------
// Applying a completed practice session
// ---------------------------------------------------------------------

export interface SessionResult {
  progress: UserProgress;
  /** Change in total score from this session. */
  delta: number;
  /** True if this session pushed currentScore from below target to >= target. */
  justExceeded: boolean;
}

/**
 * Applies a completed session's answers to a progress object: updates
 * mastery per answer, marks touched concepts as seen this session,
 * increments sessionCount, appends a history entry, and flags whether the
 * target score was just reached or exceeded.
 */
export function applySessionResults(progress: UserProgress, answers: SessionAnswer[]): SessionResult {
  let mastery: MasteryMap = { ...progress.mastery };
  const touched = new Set<ConceptId>();

  answers.forEach(({ concept, correct }) => {
    mastery = updateMastery(mastery, concept, correct);
    touched.add(concept);
  });

  const sessionCount = progress.sessionCount + 1;
  const lastSeen = { ...progress.lastSeen };
  touched.forEach((concept) => {
    lastSeen[concept] = sessionCount;
  });

  const startScore = progress.currentScore ?? totalScore(progress.mastery);
  const newScore = totalScore(mastery);
  const delta = newScore - startScore;

  const history = [
    ...progress.history,
    { n: sessionCount, label: `Session ${sessionCount}`, score: newScore, delta },
  ];

  const justExceeded = startScore < progress.targetScore && newScore >= progress.targetScore;

  return {
    progress: {
      ...progress,
      mastery,
      lastSeen,
      sessionCount,
      currentScore: newScore,
      history,
    },
    delta,
    justExceeded,
  };
}

// Re-export for screens that only need question lookups alongside session
// logic.
export { QUESTIONS, sectionScore, totalScore, LEARNING_RATE, MASTERY_MIN, MASTERY_MAX };
