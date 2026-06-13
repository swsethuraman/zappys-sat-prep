// Zappy's SAT Prep — concept taxonomy, ported from the HTML prototype's
// CONCEPTS map. Each concept belongs to a section (math or reading/writing)
// and may declare a prerequisite concept used by the APDE-style session
// builder to insert a "refresher" question when a weak topic's foundation
// is also shaky.

export type ConceptId =
  | 'linear'
  | 'quad'
  | 'ratios'
  | 'stats'
  | 'geometry'
  | 'trig'
  | 'grammar'
  | 'reading';

export type Section = 'math' | 'rw';

export interface ConceptInfo {
  name: string;
  short: string;
  section: Section;
  prereq: ConceptId | null;
}

export const CONCEPTS: Record<ConceptId, ConceptInfo> = {
  linear: { name: 'Linear Equations & Systems', short: 'Linear Eq.', section: 'math', prereq: null },
  quad: { name: 'Quadratics & Functions', short: 'Quadratics', section: 'math', prereq: 'linear' },
  ratios: { name: 'Ratios, Rates & Percent', short: 'Ratios %', section: 'math', prereq: null },
  stats: { name: 'Statistics & Probability', short: 'Stats/Prob.', section: 'math', prereq: 'ratios' },
  geometry: { name: 'Geometry', short: 'Geometry', section: 'math', prereq: null },
  trig: { name: 'Trigonometry', short: 'Trig', section: 'math', prereq: 'geometry' },
  grammar: { name: 'Standard English Conventions', short: 'Grammar', section: 'rw', prereq: null },
  reading: { name: 'Reading & Vocab in Context', short: 'Reading', section: 'rw', prereq: 'grammar' },
};

export const MATH_CONCEPTS: ConceptId[] = ['linear', 'quad', 'ratios', 'stats', 'geometry', 'trig'];
export const RW_CONCEPTS: ConceptId[] = ['grammar', 'reading'];
export const ALL_CONCEPTS: ConceptId[] = [...MATH_CONCEPTS, ...RW_CONCEPTS];
