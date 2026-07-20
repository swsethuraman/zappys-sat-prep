/**
 * DRAFT curated college dataset for the College Targets feature.
 * Eventually: src/data/colleges.ts
 *
 * ── PROVENANCE & VERIFICATION STATUS ─────────────────────────────────
 * • testPolicy values for the selective tier come from the July 2026
 *   admissions-policy research pass (Deep Research report 1) and are
 *   current as of that report. Policies marked in policyNote with a
 *   future effective date should be displayed with that date.
 * • sat25/sat75 and admitRate values are DRAFT APPROXIMATIONS from
 *   2023–2025 reported cohorts. Per report 1, ranges from test-optional
 *   years are INFLATED by submission selection bias — treat every
 *   verified:false entry as "directionally right, not shippable."
 * • Before ship: verify each school against its latest Common Data Set
 *   (sections C7/C9) or official admissions page, fill submissionRate
 *   where published, set dataYear to the entering class year verified,
 *   and flip verified → true. UC/CSU entries stay sat=null (test-blind:
 *   scores not considered — the app must NOT show a score comparison).
 * ─────────────────────────────────────────────────────────────────────
 */

export type TestPolicy = 'required' | 'optional' | 'blind' | 'conditional';

export interface College {
  id: string;            // stable slug
  name: string;
  state: string;         // USPS code
  admitRate: number;     // 0–1, approximate
  sat25: number | null;  // null when policy === 'blind'
  sat75: number | null;
  testPolicy: TestPolicy;
  policyNote?: string;   // effective dates, conditions
  submissionRate: number | null; // fraction of enrolled who submitted; null = unknown
  dataYear: number;      // entering-class year the numbers describe
  verified: boolean;     // false until checked against CDS/official page
}

export const COLLEGES: College[] = [
  // ── Ivy League ──────────────────────────────────────────────────────
  { id: 'princeton',    name: 'Princeton University',            state: 'NJ', admitRate: 0.04,  sat25: 1500, sat75: 1580, testPolicy: 'optional', policyNote: 'Required from Fall 2028 entry',            submissionRate: null, dataYear: 2024, verified: false },
  { id: 'harvard',      name: 'Harvard University',              state: 'MA', admitRate: 0.035, sat25: 1490, sat75: 1580, testPolicy: 'required', policyNote: 'Reinstated for Fall 2025 onward',          submissionRate: null, dataYear: 2024, verified: false },
  { id: 'yale',         name: 'Yale University',                 state: 'CT', admitRate: 0.045, sat25: 1500, sat75: 1580, testPolicy: 'required', policyNote: 'Reinstated for Fall 2025 onward',          submissionRate: null, dataYear: 2024, verified: false },
  { id: 'columbia',     name: 'Columbia University',             state: 'NY', admitRate: 0.04,  sat25: 1500, sat75: 1570, testPolicy: 'optional', policyNote: 'Required from Fall 2028 entry',            submissionRate: null, dataYear: 2024, verified: false },
  { id: 'upenn',        name: 'University of Pennsylvania',      state: 'PA', admitRate: 0.06,  sat25: 1500, sat75: 1570, testPolicy: 'required', policyNote: 'Scores must be from last 5 years',         submissionRate: null, dataYear: 2024, verified: false },
  { id: 'brown',        name: 'Brown University',                state: 'RI', admitRate: 0.05,  sat25: 1500, sat75: 1570, testPolicy: 'required', policyNote: 'Superscores both exams',                   submissionRate: null, dataYear: 2024, verified: false },
  { id: 'cornell',      name: 'Cornell University',              state: 'NY', admitRate: 0.07,  sat25: 1470, sat75: 1550, testPolicy: 'required', policyNote: 'Required from Fall 2026 entry',            submissionRate: null, dataYear: 2024, verified: false },
  { id: 'dartmouth',    name: 'Dartmouth College',               state: 'NH', admitRate: 0.06,  sat25: 1490, sat75: 1570, testPolicy: 'required', policyNote: 'First Ivy to reinstate (2024)',            submissionRate: null, dataYear: 2024, verified: false },

  // ── Elite private (non-Ivy) ────────────────────────────────────────
  { id: 'mit',          name: 'MIT',                             state: 'MA', admitRate: 0.045, sat25: 1520, sat75: 1580, testPolicy: 'required', policyNote: 'Reinstated 2022',                          submissionRate: null, dataYear: 2024, verified: false },
  { id: 'stanford',     name: 'Stanford University',             state: 'CA', admitRate: 0.04,  sat25: 1500, sat75: 1580, testPolicy: 'required', policyNote: 'Required from Fall 2026 entry',            submissionRate: null, dataYear: 2024, verified: false },
  { id: 'caltech',      name: 'Caltech',                         state: 'CA', admitRate: 0.03,  sat25: 1530, sat75: 1580, testPolicy: 'required', policyNote: 'Reinstated Apr 2024; buckets 780–800 math', submissionRate: null, dataYear: 2024, verified: false },
  { id: 'jhu',          name: 'Johns Hopkins University',        state: 'MD', admitRate: 0.07,  sat25: 1520, sat75: 1570, testPolicy: 'required', policyNote: 'Required from Fall 2026 entry',            submissionRate: null, dataYear: 2024, verified: false },
  { id: 'uchicago',     name: 'University of Chicago',           state: 'IL', admitRate: 0.05,  sat25: 1510, sat75: 1580, testPolicy: 'optional', policyNote: 'Test-optional extended/permanent',         submissionRate: null, dataYear: 2024, verified: false },
  { id: 'northwestern', name: 'Northwestern University',         state: 'IL', admitRate: 0.07,  sat25: 1490, sat75: 1570, testPolicy: 'optional', policyNote: 'Test-optional through 2026–27',            submissionRate: null, dataYear: 2024, verified: false },
  { id: 'duke',         name: 'Duke University',                 state: 'NC', admitRate: 0.06,  sat25: 1490, sat75: 1570, testPolicy: 'optional', policyNote: 'Test-optional through 2026–27',            submissionRate: null, dataYear: 2024, verified: false },
  { id: 'vanderbilt',   name: 'Vanderbilt University',           state: 'TN', admitRate: 0.055, sat25: 1500, sat75: 1570, testPolicy: 'optional', policyNote: 'Test-optional through 2026–27',            submissionRate: null, dataYear: 2024, verified: false },
  { id: 'rice',         name: 'Rice University',                 state: 'TX', admitRate: 0.08,  sat25: 1500, sat75: 1570, testPolicy: 'optional', policyNote: 'VERIFY current policy',                    submissionRate: null, dataYear: 2024, verified: false },
  { id: 'notredame',    name: 'University of Notre Dame',        state: 'IN', admitRate: 0.12,  sat25: 1420, sat75: 1550, testPolicy: 'optional', policyNote: 'VERIFY current policy',                    submissionRate: null, dataYear: 2024, verified: false },
  { id: 'georgetown',   name: 'Georgetown University',           state: 'DC', admitRate: 0.12,  sat25: 1410, sat75: 1550, testPolicy: 'required', policyNote: 'VERIFY — historically test-required',      submissionRate: null, dataYear: 2024, verified: false },
  { id: 'cmu',          name: 'Carnegie Mellon University',      state: 'PA', admitRate: 0.11,  sat25: 1500, sat75: 1570, testPolicy: 'optional', policyNote: 'VERIFY current policy',                    submissionRate: null, dataYear: 2024, verified: false },

  // ── Selective private, large-draw ──────────────────────────────────
  { id: 'nyu',          name: 'New York University',             state: 'NY', admitRate: 0.09,  sat25: 1470, sat75: 1570, testPolicy: 'optional', submissionRate: null, dataYear: 2024, verified: false },
  { id: 'usc',          name: 'University of Southern California', state: 'CA', admitRate: 0.10, sat25: 1450, sat75: 1550, testPolicy: 'optional', submissionRate: null, dataYear: 2024, verified: false },
  { id: 'tufts',        name: 'Tufts University',                state: 'MA', admitRate: 0.10,  sat25: 1450, sat75: 1550, testPolicy: 'optional', submissionRate: null, dataYear: 2024, verified: false },
  { id: 'emory',        name: 'Emory University',                state: 'GA', admitRate: 0.11,  sat25: 1440, sat75: 1550, testPolicy: 'optional', submissionRate: null, dataYear: 2024, verified: false },
  { id: 'northeastern', name: 'Northeastern University',         state: 'MA', admitRate: 0.06,  sat25: 1430, sat75: 1530, testPolicy: 'optional', submissionRate: null, dataYear: 2024, verified: false },
  { id: 'bc',           name: 'Boston College',                  state: 'MA', admitRate: 0.15,  sat25: 1420, sat75: 1530, testPolicy: 'optional', submissionRate: null, dataYear: 2024, verified: false },
  { id: 'bu',           name: 'Boston University',               state: 'MA', admitRate: 0.11,  sat25: 1410, sat75: 1520, testPolicy: 'optional', submissionRate: null, dataYear: 2024, verified: false },
  { id: 'villanova',    name: 'Villanova University',            state: 'PA', admitRate: 0.25,  sat25: 1380, sat75: 1500, testPolicy: 'optional', submissionRate: null, dataYear: 2024, verified: false },
  { id: 'lehigh',       name: 'Lehigh University',               state: 'PA', admitRate: 0.30,  sat25: 1330, sat75: 1480, testPolicy: 'optional', submissionRate: null, dataYear: 2024, verified: false },
  { id: 'fordham',      name: 'Fordham University',              state: 'NY', admitRate: 0.54,  sat25: 1290, sat75: 1440, testPolicy: 'optional', submissionRate: null, dataYear: 2024, verified: false },

  // ── Public flagships & major publics ───────────────────────────────
  { id: 'gatech',       name: 'Georgia Tech',                    state: 'GA', admitRate: 0.16,  sat25: 1400, sat75: 1540, testPolicy: 'required', policyNote: 'GA system mandate',                        submissionRate: null, dataYear: 2024, verified: false },
  { id: 'uga',          name: 'University of Georgia',           state: 'GA', admitRate: 0.37,  sat25: 1220, sat75: 1420, testPolicy: 'required', policyNote: 'GA system mandate',                        submissionRate: null, dataYear: 2024, verified: false },
  { id: 'uf',           name: 'University of Florida',           state: 'FL', admitRate: 0.24,  sat25: 1300, sat75: 1470, testPolicy: 'required', policyNote: 'FL system mandate',                        submissionRate: null, dataYear: 2024, verified: false },
  { id: 'fsu',          name: 'Florida State University',        state: 'FL', admitRate: 0.25,  sat25: 1220, sat75: 1360, testPolicy: 'required', policyNote: 'FL system mandate',                        submissionRate: null, dataYear: 2024, verified: false },
  { id: 'utaustin',     name: 'UT Austin',                       state: 'TX', admitRate: 0.29,  sat25: 1230, sat75: 1500, testPolicy: 'required', policyNote: 'Reinstated 2024',                          submissionRate: null, dataYear: 2024, verified: false },
  { id: 'unc',          name: 'UNC Chapel Hill',                 state: 'NC', admitRate: 0.19,  sat25: 1330, sat75: 1500, testPolicy: 'conditional', policyNote: 'Weighted GPA < 2.8 must submit',        submissionRate: null, dataYear: 2024, verified: false },
  { id: 'uva',          name: 'University of Virginia',          state: 'VA', admitRate: 0.17,  sat25: 1400, sat75: 1540, testPolicy: 'optional', policyNote: 'VERIFY current policy',                    submissionRate: null, dataYear: 2024, verified: false },
  { id: 'umich',        name: 'University of Michigan',          state: 'MI', admitRate: 0.18,  sat25: 1350, sat75: 1530, testPolicy: 'optional', policyNote: 'Formally adopted ongoing TO (2024)',       submissionRate: null, dataYear: 2024, verified: false },
  { id: 'osu',          name: 'Ohio State University',           state: 'OH', admitRate: 0.50,  sat25: 1240, sat75: 1440, testPolicy: 'required', policyNote: 'Required from 2026 cycle',                 submissionRate: null, dataYear: 2024, verified: false },
  { id: 'purdue',       name: 'Purdue University',               state: 'IN', admitRate: 0.50,  sat25: 1190, sat75: 1420, testPolicy: 'required', policyNote: 'Reinstated Fall 2024',                     submissionRate: null, dataYear: 2024, verified: false },
  { id: 'wisc',         name: 'UW–Madison',                      state: 'WI', admitRate: 0.43,  sat25: 1310, sat75: 1480, testPolicy: 'required', policyNote: 'Required from 2025–26 cycle',              submissionRate: null, dataYear: 2024, verified: false },
  { id: 'uiuc',         name: 'UIUC',                            state: 'IL', admitRate: 0.44,  sat25: 1290, sat75: 1500, testPolicy: 'optional', policyNote: 'VERIFY current policy',                    submissionRate: null, dataYear: 2024, verified: false },
  { id: 'pennstate',    name: 'Penn State (University Park)',    state: 'PA', admitRate: 0.55,  sat25: 1160, sat75: 1360, testPolicy: 'optional', policyNote: 'VERIFY current policy',                    submissionRate: null, dataYear: 2024, verified: false },
  { id: 'umd',          name: 'University of Maryland',          state: 'MD', admitRate: 0.44,  sat25: 1350, sat75: 1510, testPolicy: 'optional', policyNote: 'VERIFY current policy',                    submissionRate: null, dataYear: 2024, verified: false },
  { id: 'vtech',        name: 'Virginia Tech',                   state: 'VA', admitRate: 0.57,  sat25: 1180, sat75: 1390, testPolicy: 'optional', policyNote: 'VERIFY current policy',                    submissionRate: null, dataYear: 2024, verified: false },
  { id: 'auburn',       name: 'Auburn University',               state: 'AL', admitRate: 0.44,  sat25: 1150, sat75: 1320, testPolicy: 'required', policyNote: 'Required for all from Fall 2027',          submissionRate: null, dataYear: 2024, verified: false },
  { id: 'alabama',      name: 'University of Alabama',           state: 'AL', admitRate: 0.80,  sat25: 1080, sat75: 1360, testPolicy: 'required', policyNote: 'Required from 2027 cycle',                 submissionRate: null, dataYear: 2024, verified: false },
  { id: 'lsu',          name: 'LSU',                             state: 'LA', admitRate: 0.76,  sat25: 1130, sat75: 1310, testPolicy: 'required', policyNote: 'Required from 2027 cycle',                 submissionRate: null, dataYear: 2024, verified: false },

  // ── Test-blind (UC system representatives) ─────────────────────────
  // Scores NOT considered — the app must show the policy, never a range.
  { id: 'ucla',         name: 'UCLA',                            state: 'CA', admitRate: 0.09,  sat25: null, sat75: null, testPolicy: 'blind', policyNote: 'UC system: scores not considered',            submissionRate: null, dataYear: 2024, verified: false },
  { id: 'berkeley',     name: 'UC Berkeley',                     state: 'CA', admitRate: 0.12,  sat25: null, sat75: null, testPolicy: 'blind', policyNote: 'UC system: scores not considered',            submissionRate: null, dataYear: 2024, verified: false },
  { id: 'ucsd',         name: 'UC San Diego',                    state: 'CA', admitRate: 0.25,  sat25: null, sat75: null, testPolicy: 'blind', policyNote: 'UC system: scores not considered',            submissionRate: null, dataYear: 2024, verified: false },

  // ── New Jersey / local ─────────────────────────────────────────────
  { id: 'rutgersnb',    name: 'Rutgers–New Brunswick',           state: 'NJ', admitRate: 0.65,  sat25: 1190, sat75: 1410, testPolicy: 'optional', policyNote: 'VERIFY current policy',                    submissionRate: null, dataYear: 2024, verified: false },
  { id: 'stevens',      name: 'Stevens Institute of Technology', state: 'NJ', admitRate: 0.48,  sat25: 1340, sat75: 1500, testPolicy: 'optional', policyNote: 'VERIFY current policy',                    submissionRate: null, dataYear: 2024, verified: false },
  { id: 'njit',         name: 'NJIT',                            state: 'NJ', admitRate: 0.66,  sat25: 1190, sat75: 1390, testPolicy: 'optional', policyNote: 'VERIFY current policy',                    submissionRate: null, dataYear: 2024, verified: false },
  { id: 'tcnj',         name: 'The College of New Jersey',       state: 'NJ', admitRate: 0.49,  sat25: 1120, sat75: 1330, testPolicy: 'optional', policyNote: 'VERIFY current policy',                    submissionRate: null, dataYear: 2024, verified: false },
];

// Derived helpers the feature will want (implement in the college phase):
// satMid(college)       -> (sat25 + sat75) / 2, the honest anchor for
//                          ChargeMeter targets per the research pass
// alignment(score, c)   -> 'strong' | 'competitive' | 'reach-for-all',
//                          with the hardcoded rule: admitRate < 0.25 can
//                          NEVER return 'strong' regardless of score
