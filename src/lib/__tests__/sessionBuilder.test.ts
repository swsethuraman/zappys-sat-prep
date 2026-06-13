import { ALL_CONCEPTS, CONCEPTS } from '../../data/concepts';
import { QUESTIONS } from '../../data/questions';
import { totalScore } from '../scoring';
import {
  applyDiagnosticResults,
  applySessionResults,
  buildDiagnosticQueue,
  buildSession,
  conceptsByRecency,
  projectSessionGain,
  shuffle,
} from '../sessionBuilder';
import { createInitialProgress } from '../types';

describe('buildDiagnosticQueue', () => {
  it('contains 2 questions (indices 0 and 2) for every concept', () => {
    const queue = buildDiagnosticQueue();
    expect(queue).toHaveLength(ALL_CONCEPTS.length * 2);
    ALL_CONCEPTS.forEach((concept) => {
      const items = queue.filter((q) => q.concept === concept);
      expect(items.map((i) => i.qi).sort()).toEqual([0, 2]);
    });
  });

  it('every referenced question exists in the question bank', () => {
    const queue = buildDiagnosticQueue();
    queue.forEach(({ concept, qi }) => {
      expect(QUESTIONS[concept][qi]).toBeDefined();
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

  it('cycles the practice pool between question indices 1 and 3', () => {
    const progress = createInitialProgress();
    progress.mastery.geometry = 0.05;
    // Keep geometry out of the warm-up slot (which would also be drawn
    // toward it as the lowest-mastery concept) so the "main" qis below
    // reflect only the target-concept pool cursor.
    progress.sessionCount = 1;
    progress.lastSeen.geometry = 1;

    const first = buildSession(progress);
    const mainQis = first.queue.filter((q) => q.kind === 'main').map((q) => q.qi);
    expect(mainQis).toEqual([1, 3]);

    const progress2 = { ...progress, poolIndex: first.poolIndex };
    const second = buildSession(progress2);
    const mainQis2 = second.queue.filter((q) => q.kind === 'main').map((q) => q.qi);
    // cursor continues cycling: started at 2 -> [1,3] again
    expect(mainQis2).toEqual([1, 3]);
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
      { concept: 'geometry', correct: true, kind: 'main' },
      { concept: 'geometry', correct: true, kind: 'main' },
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
      { concept: 'linear', correct: true, kind: 'warmup' },
    ]);
    expect(next.lastSeen.linear).toBe(1);
    expect(next.lastSeen.quad).toBe(0); // untouched
  });

  it('sets justExceeded when the session crosses the target score', () => {
    const progress = createInitialProgress(410); // very low target, easy to cross
    progress.currentScore = 400; // flatMastery(0) territory
    progress.mastery = Object.fromEntries(ALL_CONCEPTS.map((c) => [c, 0.05])) as typeof progress.mastery;

    const { justExceeded } = applySessionResults(progress, [
      { concept: 'linear', correct: true, kind: 'main' },
      { concept: 'linear', correct: true, kind: 'main' },
    ]);
    expect(justExceeded).toBe(true);
  });

  it('does not set justExceeded when already above target before the session', () => {
    const progress = createInitialProgress(400);
    progress.currentScore = 1000;
    progress.mastery = Object.fromEntries(ALL_CONCEPTS.map((c) => [c, 0.5])) as typeof progress.mastery;

    const { justExceeded } = applySessionResults(progress, [
      { concept: 'linear', correct: true, kind: 'main' },
    ]);
    expect(justExceeded).toBe(false);
  });
});
