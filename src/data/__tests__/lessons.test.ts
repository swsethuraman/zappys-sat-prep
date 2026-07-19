import { ALL_CONCEPTS } from '../concepts';
import { LESSONS, LESSON_BY_CONCEPT } from '../lessons';

const ILLUSTRATION_IDS = [
  'linear-slope-triangle',
  'quadratics-parabola-roots-vertex',
  'ratios-percent-bar-model',
  'stats-bell-curve-sd',
  'geometry-pythagorean-squares',
  'trig-soh-cah-toa-triangle',
  'grammar-subject-verb-bracket',
  'reading-context-clue-focus',
];

describe('LESSONS', () => {
  it('has exactly 8 entries', () => {
    expect(LESSONS).toHaveLength(8);
  });

  it('has exactly one lesson per ConceptId', () => {
    const concepts = LESSONS.map((l) => l.concept).sort();
    expect(concepts).toEqual([...ALL_CONCEPTS].sort());
  });

  it('every lesson has a non-empty title and at least one section', () => {
    LESSONS.forEach((lesson) => {
      expect(lesson.title.length).toBeGreaterThan(0);
      expect(lesson.sections.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('every section has a non-empty heading and body', () => {
    LESSONS.forEach((lesson) => {
      lesson.sections.forEach((section) => {
        expect(section.heading.length).toBeGreaterThan(0);
        expect(section.body.length).toBeGreaterThan(0);
      });
    });
  });

  it('every illustration id matches one of the 8 expected placeholder filenames', () => {
    LESSONS.forEach((lesson) => {
      expect(ILLUSTRATION_IDS).toContain(lesson.illustration.id);
    });
  });

  it('illustration ids are all distinct', () => {
    const ids = LESSONS.map((l) => l.illustration.id);
    expect(new Set(ids).size).toBe(LESSONS.length);
  });

  it('LESSON_BY_CONCEPT provides O(1) lookup for every ConceptId', () => {
    ALL_CONCEPTS.forEach((c) => {
      expect(LESSON_BY_CONCEPT[c]).toBeDefined();
      expect(LESSON_BY_CONCEPT[c].concept).toBe(c);
    });
  });
});
