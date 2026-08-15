// Shared configuration - single source of truth

// CBC School Grade Range: G4 through G10
// Note: CBC adds a new Senior School grade each year (10 now, 11 next)
// Keeping this as one constant means next year's bump is a one-line change
export const SCHOOL_GRADE_RANGE = [4, 5, 6, 7, 8, 9, 10];

// Grade bands for convenience
export const GRADE_BANDS = {
  UPPER_PRIMARY: [4, 5, 6],
  JR_SCHOOL: [7, 8, 9],
  SENIOR_SCHOOL: [10]
};

// N/A exclusions: subjects that don't apply to certain bands
export const NA_EXCLUSIONS = {
  SCI: { excluded_bands: ['JR_SCHOOL', 'SENIOR_SCHOOL'] }, // Science & Technology
  INTSCI: { excluded_bands: ['UPPER_PRIMARY'] }, // Integrated Science
  PRETECH: { excluded_bands: ['UPPER_PRIMARY'] } // Pre-Technical
};

// Default subjects shown when a new intake begins.
export const SEED_SUBJECTS = [
  { subject_code: 'ENG', subject_name: 'English', grade_levels: [...GRADE_BANDS.UPPER_PRIMARY, ...GRADE_BANDS.JR_SCHOOL, ...GRADE_BANDS.SENIOR_SCHOOL], periods_per_week: [5, 5, 5, 5, 5, 5, 5], double_lessons_allowed: true },
  { subject_code: 'MATH', subject_name: 'Mathematics', grade_levels: [...GRADE_BANDS.UPPER_PRIMARY, ...GRADE_BANDS.JR_SCHOOL, ...GRADE_BANDS.SENIOR_SCHOOL], periods_per_week: [5, 5, 5, 5, 5, 5, 5], double_lessons_allowed: true },
  { subject_code: 'AGRI', subject_name: 'Agriculture & Nutrition', grade_levels: [...GRADE_BANDS.UPPER_PRIMARY, ...GRADE_BANDS.JR_SCHOOL, ...GRADE_BANDS.SENIOR_SCHOOL], periods_per_week: [3, 3, 3, 3, 3, 3, 3], double_lessons_allowed: false },
  { subject_code: 'SCI', subject_name: 'Science & Technology', grade_levels: [...GRADE_BANDS.UPPER_PRIMARY], periods_per_week: [4, 4, 4], double_lessons_allowed: true },
  { subject_code: 'INTSCI', subject_name: 'Integrated Science', grade_levels: [...GRADE_BANDS.JR_SCHOOL, ...GRADE_BANDS.SENIOR_SCHOOL], periods_per_week: [5, 5, 5, 5], double_lessons_allowed: true },
  { subject_code: 'PRETECH', subject_name: 'Pre-Technical', grade_levels: [...GRADE_BANDS.JR_SCHOOL, ...GRADE_BANDS.SENIOR_SCHOOL], periods_per_week: [4, 4, 4, 4], double_lessons_allowed: true }
];

// Priority mapping
export const PRIORITY_MAP = {
  preferred: 1,
  normal: 2,
  last_resort: 3
};

// Priority values (reverse map)
export const PRIORITY_VALUES = {
  1: 'preferred',
  2: 'normal',
  3: 'last_resort'
};
