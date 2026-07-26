// Shared types for a user's adaptive-learning progress. This mirrors the
// `state` object in the HTML prototype, minus UI/view fields — this is
// the data that eventually gets persisted to Firestore in Phase 4
// (users/{uid} + users/{uid}/mastery/{conceptId}).

import { ALL_CONCEPTS, type ConceptId } from '../data/concepts';

/** Mastery value per concept, in [0.05, 0.97]. Starts at 0.3 for everyone. */
export type MasteryMap = Record<ConceptId, number>;

/** Session index (1-based) at which each concept was last practiced. 0 = never. */
export type LastSeenMap = Record<ConceptId, number>;

/**
 * Cursor into each concept's practice-session question pool.
 * @deprecated Superseded by `seenQuestions` (ID-based). Retained in the
 * Firestore doc for backward compatibility only — no longer read or advanced.
 */
export type PoolIndexMap = Record<ConceptId, number>;

/** Stable IDs of pool questions already served per concept (seen-question tracking). */
export type SeenQuestionsMap = Record<ConceptId, string[]>;

/** A pool question the user missed, tracked for a delayed retry (error journal). */
export interface MissedQuestion {
  concept: ConceptId;
  /** How many times it has been missed (starts at 1). */
  missCount: number;
  /** ISO timestamp of the most recent miss. */
  lastMissedAt: string;
  /** ISO timestamp the retry becomes due (lastMissedAt + RETRY_DELAY_HOURS). */
  dueAt: string;
}

/**
 * Error journal, keyed by questionId. Naturally size-bounded by the pool
 * (≤ 224 entries: 8 concepts × 28 pool questions) — no cap logic needed (FJ9).
 */
export type MissedQuestionsMap = Record<string, MissedQuestion>;

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
  /** ISO date string ("YYYY-MM-DD") of the user's scheduled SAT, or null. */
  scheduledSAT: string | null;
  /** Daily practice-reminder time ("HH:mm", 24h local time), or null if unset. */
  reminderTime: string | null;
  /** Pool question IDs already served per concept, so sessions don't repeat. */
  seenQuestions: SeenQuestionsMap;
  /** Missed pool questions awaiting a delayed retry, keyed by questionId. */
  missedQuestions: MissedQuestionsMap;
}

const DEFAULT_MASTERY = 0.3;

function mapAllConcepts<T>(value: T): Record<ConceptId, T> {
  const result = {} as Record<ConceptId, T>;
  ALL_CONCEPTS.forEach((c) => {
    result[c] = value;
  });
  return result;
}

/**
 * A fresh `seenQuestions` map with an independent empty array per concept.
 * (Uses fresh arrays rather than `mapAllConcepts([])`, which would alias one
 * shared array across all concepts.)
 */
export function emptySeenQuestions(): SeenQuestionsMap {
  const result = {} as SeenQuestionsMap;
  ALL_CONCEPTS.forEach((c) => {
    result[c] = [];
  });
  return result;
}

/**
 * Normalizes a raw Firestore `seenQuestions` value into a complete map:
 * missing (pre-field docs) or malformed per-concept entries default to `[]`,
 * so existing users never crash on absent data (F6 / SECURITY-REVIEW A3).
 */
export function toSeenQuestions(raw: unknown): SeenQuestionsMap {
  const result = emptySeenQuestions();
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    ALL_CONCEPTS.forEach((c) => {
      const value = obj[c];
      if (Array.isArray(value)) {
        result[c] = value.filter((id): id is string => typeof id === 'string');
      }
    });
  }
  return result;
}

/**
 * Normalizes a raw Firestore `missedQuestions` value into a valid journal:
 * absent (pre-field docs) → `{}`; malformed entries are dropped rather than
 * crashing (FJ3). Only entries with a known concept and the expected shape
 * survive.
 */
export function toMissedQuestions(raw: unknown): MissedQuestionsMap {
  const result: MissedQuestionsMap = {};
  if (raw && typeof raw === 'object') {
    const concepts = new Set<string>(ALL_CONCEPTS);
    Object.entries(raw as Record<string, unknown>).forEach(([id, value]) => {
      if (!value || typeof value !== 'object') return;
      const v = value as Record<string, unknown>;
      if (
        typeof v['concept'] === 'string' &&
        concepts.has(v['concept']) &&
        typeof v['missCount'] === 'number' &&
        typeof v['lastMissedAt'] === 'string' &&
        typeof v['dueAt'] === 'string'
      ) {
        result[id] = {
          concept: v['concept'] as ConceptId,
          missCount: v['missCount'],
          lastMissedAt: v['lastMissedAt'],
          dueAt: v['dueAt'],
        };
      }
    });
  }
  return result;
}

/**
 * Returns all UserProgress fields except `history`, ready to write to
 * Firestore (where history lives as a subcollection, not an array field).
 */
export function userDocFields(p: UserProgress): Omit<UserProgress, 'history'> {
  return {
    mastery: p.mastery,
    lastSeen: p.lastSeen,
    poolIndex: p.poolIndex,
    sessionCount: p.sessionCount,
    targetScore: p.targetScore,
    baselineScore: p.baselineScore,
    currentScore: p.currentScore,
    diagnosticDone: p.diagnosticDone,
    actualScore: p.actualScore,
    actualDate: p.actualDate,
    scheduledSAT: p.scheduledSAT,
    reminderTime: p.reminderTime,
    seenQuestions: p.seenQuestions,
    missedQuestions: p.missedQuestions,
  };
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
    scheduledSAT: null,
    reminderTime: null,
    seenQuestions: emptySeenQuestions(),
    missedQuestions: {},
  };
}
