import {
  RETRY_DELAY_HOURS,
  dueRetries,
  dueRetriesForConcept,
  updateJournal,
  type QuestionResult,
} from '../errorJournal';
import type { ConceptId } from '../../data/concepts';
import type { MissedQuestionsMap } from '../types';

// Fixed, deterministic clock (Date.UTC is pure — unlike Date.now()).
const NOW = Date.UTC(2026, 6, 20, 12, 0, 0);
const DAY = RETRY_DELAY_HOURS * 60 * 60 * 1000;

const miss = (questionId: string, concept: ConceptId): QuestionResult => ({
  questionId,
  concept,
  correct: false,
  isPool: true,
});

const entry = (concept: ConceptId, dueMs: number, missCount = 1) => ({
  concept,
  missCount,
  lastMissedAt: new Date(dueMs - DAY).toISOString(),
  dueAt: new Date(dueMs).toISOString(),
});

describe('updateJournal', () => {
  it('creates a new entry with missCount 1 and dueAt = now + 24h', () => {
    const j = updateJournal({}, [miss('linear-p1', 'linear')], NOW);
    expect(j['linear-p1'].concept).toBe('linear');
    expect(j['linear-p1'].missCount).toBe(1);
    expect(Date.parse(j['linear-p1'].lastMissedAt)).toBe(NOW);
    expect(Date.parse(j['linear-p1'].dueAt)).toBe(NOW + DAY);
  });

  it('increments missCount and refreshes dueAt on a repeat miss', () => {
    const j1 = updateJournal({}, [miss('linear-p1', 'linear')], NOW);
    const j2 = updateJournal(j1, [miss('linear-p1', 'linear')], NOW + 2 * DAY);
    expect(j2['linear-p1'].missCount).toBe(2);
    expect(Date.parse(j2['linear-p1'].dueAt)).toBe(NOW + 3 * DAY);
  });

  it('clears an entry on ANY correct answer (not only a designated retry)', () => {
    const j1 = updateJournal({}, [miss('linear-p1', 'linear')], NOW);
    const j2 = updateJournal(
      j1,
      [{ questionId: 'linear-p1', concept: 'linear', correct: true, isPool: true }],
      NOW + DAY,
    );
    expect(j2['linear-p1']).toBeUndefined();
  });

  it('ignores diagnostic / non-pool misses (FJ2)', () => {
    const j = updateJournal(
      {},
      [{ questionId: 'linear-d1', concept: 'linear', correct: false, isPool: false }],
      NOW,
    );
    expect(Object.keys(j)).toHaveLength(0);
  });

  it('a correct answer to an un-journaled question is a harmless no-op', () => {
    const j = updateJournal(
      {},
      [{ questionId: 'quad-p5', concept: 'quad', correct: true, isPool: true }],
      NOW,
    );
    expect(Object.keys(j)).toHaveLength(0);
  });

  it('does not mutate the input journal', () => {
    const original: MissedQuestionsMap = {};
    updateJournal(original, [miss('linear-p1', 'linear')], NOW);
    expect(Object.keys(original)).toHaveLength(0);
  });
});

describe('dueRetries', () => {
  it('returns only due entries, most overdue first', () => {
    const journal: MissedQuestionsMap = {
      'linear-p1': entry('linear', NOW - DAY),
      'linear-p2': entry('linear', NOW - 2 * DAY),
      'linear-p3': entry('linear', NOW + DAY), // not due yet
    };
    expect(dueRetries(journal, NOW)).toEqual(['linear-p2', 'linear-p1']);
  });

  it('caps at max', () => {
    const journal: MissedQuestionsMap = {
      a: entry('linear', NOW - 1 * DAY),
      b: entry('linear', NOW - 2 * DAY),
      c: entry('linear', NOW - 3 * DAY),
      d: entry('linear', NOW - 4 * DAY),
    };
    expect(dueRetries(journal, NOW, 2)).toEqual(['d', 'c']);
  });

  it('breaks dueAt ties by higher missCount, then by questionId', () => {
    const journal: MissedQuestionsMap = {
      b: entry('linear', NOW - DAY, 1),
      a: entry('linear', NOW - DAY, 1),
      hi: entry('linear', NOW - DAY, 3),
    };
    expect(dueRetries(journal, NOW)).toEqual(['hi', 'a', 'b']);
  });

  it('returns [] for an empty journal', () => {
    expect(dueRetries({}, NOW)).toEqual([]);
  });
});

describe('dueRetriesForConcept', () => {
  it('returns only due entries for the given concept', () => {
    const journal: MissedQuestionsMap = {
      'linear-p1': entry('linear', NOW - DAY),
      'quad-p1': entry('quad', NOW - 2 * DAY),
      'linear-p2': entry('linear', NOW + DAY), // not due
    };
    expect(dueRetriesForConcept(journal, 'linear', NOW)).toEqual(['linear-p1']);
    expect(dueRetriesForConcept(journal, 'quad', NOW)).toEqual(['quad-p1']);
  });
});
