import { ALL_CONCEPTS, CONCEPTS } from '../../data/concepts';
import { getQuestionById } from '../../data/questions';
import { totalScore } from '../scoring';
import {
  applyDiagnosticResults,
  applySessionResults,
  buildDiagnosticQueue,
  buildFocusedSession,
  buildSession,
  conceptsByRecency,
  poolQuestionIds,
  projectSessionGain,
  recordSeenQuestions,
  selectPoolQuestions,
  shuffle,
} from '../sessionBuilder';
import { createInitialProgress, emptySeenQuestions } from '../types';

describe('buildDiagnosticQueue', () => {
  it('contains the 2 diagnostic-flagged questions for every concept', () => {
    const queue = buildDiagnosticQueue();
    expect(queue).toHaveLength(ALL_CONCEPTS.length * 2);
    ALL_CONCEPTS.forEach((concept) => {
      const items = queue.filter((q) => q.concept === concept);
      expect(items).toHaveLength(2);
      items.forEach((i) => {
        const q = getQuestionById(i.questionId);
        expect(q.concept).toBe(concept);
        expect(q.diagnostic).toBe(true);
      });
    });
  });

  it('only ever references diagnostic questions (never pool)', () => {
    buildDiagnosticQueue().forEach(({ questionId }) => {
      expect(getQuestionById(questionId).diagnostic).toBe(true);
    });
  });
});

describe('shuffle', () => {
  it('is a permutation of the input (same elements, same length)', () => {
    const input = [1, 2, 3, 4, 5];
    const shuffled = shuffle(input, () => 0.999); // deterministic-ish
    expect(shuffled).toHaveLength(input.length);
    expect([...shuffled].sort()).toEqual([...input].sort());
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3];
    const copy = [...input];
    shuffle(input, () => 0.5);
    expect(input).toEqual(copy);
  });
});

describe('applyDiagnosticResults', () => {
  it('sets mastery to 0.85 for a concept answered 2/2 correct', () => {
    const progress = createInitialProgress();
    const answers = ALL_CONCEPTS.flatMap((concept) => [
      { concept, correct: concept === 'linear' },
      { concept, correct: concept === 'linear' },
    ]);
    const result = applyDiagnosticResults(progress, answers);
    expect(result.mastery.linear).toBeCloseTo(0.85, 5);
  });

  it('sets mastery to 0.5 for a concept answered 1/2 correct', () => {
    const progress = createInitialProgress();
    const answers = [
      { concept: 'linear' as const, correct: true },
      { concept: 'linear' as const, correct: false },
    ];
    const result = applyDiagnosticResults(progress, answers);
    expect(result.mastery.linear).toBeCloseTo(0.5, 5);
  });

  it('sets mastery to 0.15 for a concept answered 0/2 correct', () => {
    const progress = createInitialProgress();
    const answers = [
      { concept: 'linear' as const, correct: false },
      { concept: 'linear' as const, correct: false },
    ];
    const result = applyDiagnosticResults(progress, answers);
    expect(result.mastery.linear).toBeCloseTo(0.15, 5);
  });

  it('sets baselineScore and currentScore to the resulting total score, and marks diagnosticDone', () => {
    const progress = createInitialProgress();
    const answers = ALL_CONCEPTS.flatMap((concept) => [
      { concept, correct: true },
      { concept, correct: true },
    ]);
    const result = applyDiagnosticResults(progress, answers);
    const expected = totalScore(result.mastery);
    expect(result.baselineScore).toBe(expected);
    expect(result.currentScore).toBe(expected);
    expect(result.diagnosticDone).toBe(true);
    expect(result.history).toEqual([{ n: 0, label: 'Diagnostic', score: expected, delta: 0 }]);
  });
});

describe('conceptsByRecency', () => {
  it('puts never-seen concepts (lastSeen 0) first when sessionCount > 0', () => {
    const progress = createInitialProgress();
    progress.sessionCount = 1;
    progress.lastSeen.linear = 1; // just practiced
    // everything else still 0 (never seen) -> more "stale"
    const ordered = conceptsByRecency(progress);
    expect(ordered[0]).not.toBe('linear');
  });

  it('breaks ties by lowest mastery first', () => {
    const progress = createInitialProgress();
    progress.mastery.trig = 0.05;
    progress.mastery.quad = 0.1;
    // all lastSeen / sessionCount equal -> pure mastery tie-break
    const ordered = conceptsByRecency(progress);
    expect(ordered[0]).toBe('trig');
    expect(ordered[1]).toBe('quad');
  });
});

describe('buildSession', () => {
  it('starts with 2 warmup questions from the most overdue concepts', () => {
    const progress = createInitialProgress();
    progress.sessionCount = 3;
    progress.lastSeen.linear = 3; // recently seen -> not overdue
    progress.lastSeen.quad = 0; // never seen -> very overdue
    progress.lastSeen.trig = 0; // also never seen, but higher mastery

    const { queue } = buildSession(progress);
    const warmups = queue.filter((q) => q.kind === 'warmup');
    expect(warmups).toHaveLength(2);
    expect(warmups.some((q) => q.concept === 'linear')).toBe(false);
  });

  it('ends with 2 "main" questions targeting the weakest concept', () => {
    const progress = createInitialProgress();
    progress.mastery.geometry = 0.05; // clearly weakest, no prereq
    const { queue } = buildSession(progress);
    const mains = queue.filter((q) => q.kind === 'main');
    expect(mains).toHaveLength(2);
    mains.forEach((m) => expect(m.concept).toBe('geometry'));
  });

  it('inserts a prereq refresher when the weakest concept\'s prerequisite is also weak', () => {
    const progress = createInitialProgress();
    // trig's prereq is geometry
    progress.mastery.trig = 0.05;
    progress.mastery.geometry = 0.3; // below 0.6 threshold
    // keep warm-up concepts away from trig/geometry by making them recently seen
    progress.sessionCount = 1;
    progress.lastSeen.trig = 1;
    progress.lastSeen.geometry = 1;

    const { queue } = buildSession(progress);
    const prereqItems = queue.filter((q) => q.kind === 'prereq');
    expect(prereqItems).toHaveLength(1);
    expect(prereqItems[0].concept).toBe(CONCEPTS.trig.prereq);
  });

  it('omits the prereq refresher when the prerequisite mastery is >= 0.6', () => {
    const progress = createInitialProgress();
    progress.mastery.trig = 0.05;
    progress.mastery.geometry = 0.8; // strong prereq, no refresher needed
    const { queue } = buildSession(progress);
    expect(queue.some((q) => q.kind === 'prereq')).toBe(false);
  });

  it('draws two distinct non-diagnostic questions for the weakest concept', () => {
    const progress = createInitialProgress();
    progress.mastery.geometry = 0.05;
    // Keep geometry out of the warm-up slot so the "main" items below reflect
    // only the target-concept draw.
    progress.sessionCount = 1;
    progress.lastSeen.geometry = 1;

    const { queue } = buildSession(progress);
    const mains = queue.filter((q) => q.kind === 'main');
    expect(mains).toHaveLength(2);

    const ids = mains.map((m) => m.questionId);
    expect(new Set(ids).size).toBe(2); // distinct within the session
    mains.forEach((m) => {
      const q = getQuestionById(m.questionId);
      expect(q.concept).toBe('geometry');
      expect(q.diagnostic).toBe(false);
    });
  });
});

describe('projectSessionGain', () => {
  it('returns lo <= hi', () => {
    const progress = createInitialProgress();
    progress.currentScore = totalScore(progress.mastery);
    const { lo, hi } = projectSessionGain(progress);
    expect(lo).toBeLessThanOrEqual(hi);
  });

  it('best case (hi) is non-negative and worst case (lo) is non-positive for a mid-mastery profile', () => {
    const progress = createInitialProgress();
    progress.currentScore = totalScore(progress.mastery);
    const { lo, hi } = projectSessionGain(progress);
    expect(hi).toBeGreaterThanOrEqual(0);
    expect(lo).toBeLessThanOrEqual(0);
  });

  it('does not mutate progress', () => {
    const progress = createInitialProgress();
    progress.currentScore = totalScore(progress.mastery);
    const before = JSON.parse(JSON.stringify(progress));
    projectSessionGain(progress);
    expect(progress).toEqual(before);
  });
});

describe('applySessionResults', () => {
  it('increments sessionCount and appends a history entry', () => {
    const progress = applyDiagnosticResults(
      createInitialProgress(),
      ALL_CONCEPTS.flatMap((concept) => [
        { concept, correct: true },
        { concept, correct: false },
      ]),
    );

    const { progress: next, delta } = applySessionResults(progress, [
      { concept: 'geometry', questionId: 'geometry-p1', correct: true, kind: 'main' },
      { concept: 'geometry', questionId: 'geometry-p2', correct: true, kind: 'main' },
    ]);

    expect(next.sessionCount).toBe(1);
    expect(next.history).toHaveLength(2);
    expect(next.history[1].n).toBe(1);
    expect(next.history[1].score).toBe(next.currentScore);
    expect(next.history[1].delta).toBe(delta);
  });

  it('marks touched concepts as seen at the new session number', () => {
    const progress = createInitialProgress();
    const { progress: next } = applySessionResults(progress, [
      { concept: 'linear', questionId: 'linear-p1', correct: true, kind: 'warmup' },
    ]);
    expect(next.lastSeen.linear).toBe(1);
    expect(next.lastSeen.quad).toBe(0); // untouched
  });

  it('sets justExceeded when the session crosses the target score', () => {
    const progress = createInitialProgress(410); // very low target, easy to cross
    progress.currentScore = 400; // flatMastery(0) territory
    progress.mastery = Object.fromEntries(ALL_CONCEPTS.map((c) => [c, 0.05])) as typeof progress.mastery;

    const { justExceeded } = applySessionResults(progress, [
      { concept: 'linear', questionId: 'linear-p1', correct: true, kind: 'main' },
      { concept: 'linear', questionId: 'linear-p2', correct: true, kind: 'main' },
    ]);
    expect(justExceeded).toBe(true);
  });

  it('does not set justExceeded when already above target before the session', () => {
    const progress = createInitialProgress(400);
    progress.currentScore = 1000;
    progress.mastery = Object.fromEntries(ALL_CONCEPTS.map((c) => [c, 0.5])) as typeof progress.mastery;

    const { justExceeded } = applySessionResults(progress, [
      { concept: 'linear', questionId: 'linear-p1', correct: true, kind: 'main' },
    ]);
    expect(justExceeded).toBe(false);
  });
});

describe('selectPoolQuestions', () => {
  it('never returns diagnostic questions', () => {
    const { ids } = selectPoolQuestions('linear', 6, []);
    ids.forEach((id) => expect(getQuestionById(id).diagnostic).toBe(false));
  });

  it('returns the requested count of distinct unseen ids', () => {
    const { ids, recycled } = selectPoolQuestions('linear', 4, []);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(recycled).toBe(false);
  });

  it('excludes already-seen ids when enough unseen remain', () => {
    const pool = poolQuestionIds('linear');
    const seen = pool.slice(0, 20);
    const { ids, recycled } = selectPoolQuestions('linear', 4, seen);
    ids.forEach((id) => expect(seen).not.toContain(id));
    expect(recycled).toBe(false);
  });

  it('recycles when the whole pool is seen, still returning a full distinct set', () => {
    const pool = poolQuestionIds('linear'); // every pool id already seen
    const { ids, recycled } = selectPoolQuestions('linear', 4, pool);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(recycled).toBe(true);
    ids.forEach((id) => expect(getQuestionById(id).diagnostic).toBe(false));
  });

  it('serves the last unseen id before repeating any seen one', () => {
    const pool = poolQuestionIds('linear');
    const seen = pool.slice(0, pool.length - 1); // exactly one unseen left
    const lastUnseen = pool[pool.length - 1];
    const { ids } = selectPoolQuestions('linear', 4, seen);
    expect(ids).toContain(lastUnseen);
  });
});

describe('recordSeenQuestions', () => {
  it('appends served pool ids per concept, deduped, leaving others untouched', () => {
    const next = recordSeenQuestions(emptySeenQuestions(), [
      { concept: 'linear', questionId: 'linear-p1' },
      { concept: 'linear', questionId: 'linear-p1' }, // duplicate
      { concept: 'quad', questionId: 'quad-p3' },
    ]);
    expect(next.linear).toEqual(['linear-p1']);
    expect(next.quad).toEqual(['quad-p3']);
    expect(next.geometry).toEqual([]);
  });

  it('ignores diagnostic and unknown ids (never tracked)', () => {
    const next = recordSeenQuestions(emptySeenQuestions(), [
      { concept: 'linear', questionId: 'linear-d1' }, // diagnostic
      { concept: 'linear', questionId: 'not-a-real-id' },
    ]);
    expect(next.linear).toEqual([]);
  });

  it('recycles a concept when the seen-set would cover its entire pool', () => {
    const pool = poolQuestionIds('linear'); // 28 ids
    const seen = { ...emptySeenQuestions(), linear: pool.slice(0, pool.length - 1) };
    const last = pool[pool.length - 1];
    const next = recordSeenQuestions(seen, [{ concept: 'linear', questionId: last }]);
    // Completing the pool resets to just the freshly-served id.
    expect(next.linear).toEqual([last]);
  });
});

describe('buildFocusedSession', () => {
  it('returns 4 distinct non-diagnostic questions for the concept', () => {
    const { queue } = buildFocusedSession(createInitialProgress(), 'ratios');
    expect(queue).toHaveLength(4);
    expect(new Set(queue.map((q) => q.questionId)).size).toBe(4);
    queue.forEach((q) => {
      expect(q.kind).toBe('main');
      const question = getQuestionById(q.questionId);
      expect(question.concept).toBe('ratios');
      expect(question.diagnostic).toBe(false);
    });
  });
});

describe('error-journal retries in session building', () => {
  const NOW = Date.UTC(2026, 6, 20, 12, 0, 0);
  const DAY = 24 * 60 * 60 * 1000;
  const missed = (concept: 'linear' | 'quad' | 'ratios' | 'geometry', dueMs: number, missCount = 1) => ({
    concept,
    missCount,
    lastMissedAt: new Date(dueMs - DAY).toISOString(),
    dueAt: new Date(dueMs).toISOString(),
  });

  it('leads the warm-up with a due retry and never double-serves it (FJ1)', () => {
    const progress = createInitialProgress();
    progress.mastery.geometry = 0.05; // target concept (no prereq)
    progress.missedQuestions = { 'geometry-p1': missed('geometry', NOW - DAY) };

    const { queue } = buildSession(progress, undefined, NOW);
    expect(queue[0]).toMatchObject({ kind: 'retry', questionId: 'geometry-p1' });
    // The retry appears exactly once — never redrawn into a main/warm-up slot.
    expect(queue.filter((q) => q.questionId === 'geometry-p1')).toHaveLength(1);
  });

  it('retries consume warm-up capacity without growing the session', () => {
    const base = createInitialProgress();
    base.mastery.geometry = 0.05;
    const withoutRetry = buildSession(base, undefined, NOW).queue.length;

    const withRetry = { ...base, missedQuestions: { 'geometry-p1': missed('geometry', NOW - DAY) } };
    const q = buildSession(withRetry, undefined, NOW).queue;
    expect(q.length).toBe(withoutRetry); // same length
    expect(q.filter((i) => i.kind === 'warmup')).toHaveLength(1); // one warm-up displaced
    expect(q.filter((i) => i.kind === 'retry')).toHaveLength(1);
  });

  it('does not serve a retry that is not yet due', () => {
    const progress = createInitialProgress();
    progress.missedQuestions = { 'linear-p1': missed('linear', NOW + DAY) }; // due tomorrow
    const { queue } = buildSession(progress, undefined, NOW);
    expect(queue.some((q) => q.kind === 'retry')).toBe(false);
    expect(queue.filter((q) => q.kind === 'warmup')).toHaveLength(2);
  });

  it('caps retries at the warm-up capacity (2), leaving extras for later', () => {
    const progress = createInitialProgress();
    progress.missedQuestions = {
      'linear-p1': missed('linear', NOW - 3 * DAY),
      'quad-p1': missed('quad', NOW - 2 * DAY),
      'ratios-p1': missed('ratios', NOW - 1 * DAY),
    };
    const retries = buildSession(progress, undefined, NOW).queue.filter((q) => q.kind === 'retry');
    expect(retries).toHaveLength(2); // only 2 warm-up slots
    // The two most-overdue (linear, quad) are chosen.
    expect(retries.map((r) => r.questionId).sort()).toEqual(['linear-p1', 'quad-p1']);
  });

  it('buildFocusedSession leads with a due retry for that concept only', () => {
    const progress = createInitialProgress();
    progress.missedQuestions = {
      'ratios-p1': missed('ratios', NOW - DAY),
      'linear-p1': missed('linear', NOW - DAY), // other concept — must be ignored
    };
    const { queue } = buildFocusedSession(progress, 'ratios', undefined, NOW);
    expect(queue).toHaveLength(4);
    expect(queue[0]).toMatchObject({ kind: 'retry', questionId: 'ratios-p1' });
    expect(queue.filter((q) => q.questionId === 'ratios-p1')).toHaveLength(1);
    queue.forEach((q) => expect(getQuestionById(q.questionId).concept).toBe('ratios'));
  });
});
