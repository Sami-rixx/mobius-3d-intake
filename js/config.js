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
