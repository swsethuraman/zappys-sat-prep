// Zappy's SAT Prep — error journal (delayed retry of missed questions).
//
// Missed POOL questions are tracked per user and resurfaced for a retry a day
// later; a correct answer (in any slot) clears the entry. All logic here is
// pure and takes an injectable `now` (ms epoch) so due-ness is testable
// without touching the device clock (FJ8). The journal is keyed by questionId,
// so it is naturally bounded by the pool size — no cap logic needed (FJ9).

import type { ConceptId } from '../data/concepts';
import type { MissedQuestion, MissedQuestionsMap } from './types';

/** A retry becomes due this many hours after the miss. */
export const RETRY_DELAY_HOURS = 24;
const RETRY_DELAY_MS = RETRY_DELAY_HOURS * 60 * 60 * 1000;

/** One answered question from a completed session, as fed to the journal. */
export interface QuestionResult {
  questionId: string;
  concept: ConceptId;
  correct: boolean;
  /** True only for real pool questions; diagnostic/unknown IDs are false (FJ2). */
  isPool: boolean;
}

/**
 * Folds a completed session's results into the journal (pure). For every
 * answered question:
 *   - correct  → remove any existing entry (FJ5 — clears via ANY correct
 *     answer, not only designated retries);
 *   - wrong & pool → upsert the entry with `missCount` incremented (or 1) and
 *     a fresh 24h `dueAt` (FJ2 pool-only, FJ6 upsert-not-append).
 * Diagnostic/non-pool misses are ignored.
 */
export function updateJournal(
  journal: MissedQuestionsMap,
  results: QuestionResult[],
  now: number,
): MissedQuestionsMap {
  const next: MissedQuestionsMap = { ...journal };
  results.forEach(({ questionId, concept, correct, isPool }) => {
    if (correct) {
      delete next[questionId];
      return;
    }
    if (!isPool) return;
    const prev = next[questionId];
    next[questionId] = {
      concept,
      missCount: (prev?.missCount ?? 0) + 1,
      lastMissedAt: new Date(now).toISOString(),
      dueAt: new Date(now + RETRY_DELAY_MS).toISOString(),
    };
  });
  return next;
}

/**
 * Returns the questionIds of journal entries whose retry is due (`dueAt <=
 * now`), most overdue first, capped at `max`. Ties break by higher missCount,
 * then by questionId for stable/deterministic ordering.
 */
export function dueRetries(journal: MissedQuestionsMap, now: number, max = 3): string[] {
  return Object.entries(journal)
    .filter(([, entry]) => Date.parse(entry.dueAt) <= now)
    .sort(([idA, a], [idB, b]) => {
      const dueA = Date.parse(a.dueAt);
      const dueB = Date.parse(b.dueAt);
      if (dueA !== dueB) return dueA - dueB; // oldest due first
      if (a.missCount !== b.missCount) return b.missCount - a.missCount; // more misses first
      return idA < idB ? -1 : idA > idB ? 1 : 0; // stable by id
    })
    .slice(0, max)
    .map(([id]) => id);
}

/** Due retries for a single concept only (used by focused practice). */
export function dueRetriesForConcept(
  journal: MissedQuestionsMap,
  concept: ConceptId,
  now: number,
  max = 3,
): string[] {
  return dueRetries(journal, now, Number.POSITIVE_INFINITY)
    .filter((id) => journal[id].concept === concept)
    .slice(0, max);
}

/** Re-export the entry type for callers importing from this module. */
export type { MissedQuestion };
