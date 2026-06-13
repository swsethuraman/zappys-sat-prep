// Shared types for a user's adaptive-learning progress. This mirrors the
// `state` object in the HTML prototype, minus UI/view fields — this is
// the data that eventually gets persisted to Firestore in Phase 4
// (users/{uid} + users/{uid}/mastery/{conceptId}).

import { ALL_CONCEPTS, type ConceptId } from '../data/concepts';

/** Mastery value per concept, in [0.05, 0.97]. Starts at 0.3 for everyone. */
export type MasteryMap = Record<ConceptId, number>;

/** Session index (1-based) at which each concept was last practiced. 0 = never. */
export type LastSeenMap = Record<ConceptId, number>;

/** Cursor into each concept's practice-session question pool (indices 1 and 3, cycling). */
export type PoolIndexMap = Record<ConceptId, number>;

export interface SessionHistoryEntry {
  /** Session number; 0 = the initial diagnostic. */
  n: number;
  label: string;
  score: number;
  delta: number;
}

export interface UserProgress {
  mastery: MasteryMap;
  lastSeen: LastSeenMap;
  poolIndex: PoolIndexMap;
  sessionCount: number;
  targetScore: number;
  baselineScore: number | null;
  currentScore: number | null;
  history: SessionHistoryEntry[];
  diagnosticDone: boolean;
  actualScore: number | null;
  actualDate: string | null;
}

const DEFAULT_MASTERY = 0.3;

function mapAllConcepts<T>(value: T): Record<ConceptId, T> {
  const result = {} as Record<ConceptId, T>;
  ALL_CONCEPTS.forEach((c) => {
    result[c] = value;
  });
  return result;
}

/** A fresh profile for a brand-new user, before the diagnostic runs. */
export function createInitialProgress(targetScore = 1200): UserProgress {
  return {
    mastery: mapAllConcepts(DEFAULT_MASTERY),
    lastSeen: mapAllConcepts(0),
    poolIndex: mapAllConcepts(0),
    sessionCount: 0,
    targetScore,
    baselineScore: null,
    currentScore: null,
    history: [],
    diagnosticDone: false,
    actualScore: null,
    actualDate: null,
  };
}
