// ============================================================
// Canonical Payload Integration Adapter
// Phase 1: Transformation layer between Möbius 3D Intake output
// and GateChecker/Workload Balancer input contracts
//
// This module provides explicit, deterministic transformation
// from the Möbius canonical payload format to the downstream
// canonical payload format expected by GateChecker v2 and
// Workload Balancer.
//
// Contract differences addressed:
// 1. Grade representation: number[] -> string[] (e.g., 4 -> "G4")
// 2. Teacher name field: teacher_name -> name + teacher_name (dual output)
// 3. Missing optional fields: Add confidence/flag_note to capabilities/preferences
// ============================================================

import { SCHOOL_GRADE_RANGE } from './config.js';

// Valid grade range for Möbius intake (G4-G9: Upper Primary + Junior Secondary)
const VALID_GRADES = new Set(SCHOOL_GRADE_RANGE); // [4, 5, 6, 7, 8, 9]

/**
 * Validates that a grade is a valid numeric grade in the Möbius system
 * @param {number} grade - The grade to validate
 * @returns {boolean} True if valid
 */
function isValidGrade(grade) {
  return typeof grade === 'number' && Number.isInteger(grade) && VALID_GRADES.has(grade);
}

/**
 * Converts a numeric grade to canonical string format (e.g., 4 -> "G4")
 * @param {number} grade - Numeric grade
 * @returns {string} Canonical grade string
 */
function numericGradeToCanonical(grade) {
  if (!isValidGrade(grade)) {
    throw new Error(`Invalid numeric grade: ${grade}. Must be integer in [${Array.from(VALID_GRADES).sort((a, b) => a - b).join(', ')}]`);
  }
  return `G${grade}`;
}

/**
 * Validates that a value is a non-empty string
 * @param {*} value - Value to check
 * @param {string} fieldName - Name of the field for error messages
 * @returns {string} The validated string
 */
function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing or empty required field: ${fieldName}`);
  }
  return value;
}

/**
 * Validates that a value is a non-blank string (allows empty string but not null/undefined)
 * @param {*} value - Value to check
 * @param {string} fieldName - Name of the field for error messages
 * @returns {string} The validated string or empty string
 */
function requireString(value, fieldName) {
  if (value !== null && value !== undefined && typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    throw new Error(`Missing required field: ${fieldName}`);
  }
  throw new Error(`Invalid type for field ${fieldName}: expected string, got ${typeof value}`);
}

/**
 * Validates that a value is a positive integer
 * @param {*} value - Value to check
 * @param {string} fieldName - Name of the field for error messages
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} The validated number
 */
function requirePositiveInteger(value, fieldName, min = 0, max = Infinity) {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`Invalid type for field ${fieldName}: expected integer, got ${typeof value} (${value})`);
  }
  if (value < min || value > max) {
    throw new Error(`Field ${fieldName} out of range: ${value} must be between ${min} and ${max}`);
  }
  return value;
}

/**
 * Converts a numeric grade array to canonical string grade array
 * @param {number[]} numericGrades - Array of numeric grades
 * @param {string} fieldPath - Path to the field for error messages (e.g., "subjects[0].grade_levels")
 * @returns {string[]} Array of canonical grade strings
 */
function convertGradeArray(numericGrades, fieldPath) {
  if (!Array.isArray(numericGrades)) {
    throw new Error(`Field ${fieldPath} must be an array, got ${typeof numericGrades}`);
  }
  
  if (numericGrades.length === 0) {
    return [];
  }
  
  const result = [];
  for (let i = 0; i < numericGrades.length; i++) {
    const grade = numericGrades[i];
    try {
      result.push(numericGradeToCanonical(grade));
    } catch (e) {
      throw new Error(`At ${fieldPath}[${i}]: ${e.message}`);
    }
  }
  return result;
}

/**
 * Input contract: Möbius 3D Intake canonical payload (v1.0.0)
 * This is the exact payload produced by buildPayload() in schema.js
 * @typedef {Object} MobiusPayload
 * @property {string} schema_version - Always "1.0.0"
 * @property {Object} school - School information
 * @property {string} school.name
 * @property {string} school.filled_by
 * @property {string} school.filled_at
 * @property {Object} policy - Policy settings
 * @property {string} policy.generalists_grade_scope
 * @property {string} policy.overload_policy
 * @property {string} policy.ambiguous_data_policy
 * @property {boolean} policy.specialist_scope_lock
 * @property {Array<Object>} subjects - Subject definitions
 * @property {string} subjects[].subject_code
 * @property {string} subjects[].subject_name
 * @property {number[]} subjects[].grade_levels - Numeric grades
 * @property {number[]} subjects[].periods_per_week
 * @property {boolean} subjects[].double_lessons_allowed
 * @property {Array<Object>} teachers - Teacher definitions
 * @property {string} teachers[].teacher_id
 * @property {string} teachers[].teacher_name
 * @property {number} teachers[].max_periods_week
 * @property {boolean} teachers[].specialist
 * @property {number} teachers[].confidence
 * @property {string|null} teachers[].flag_note
 * @property {Array<Object>} capabilities - Teacher capabilities
 * @property {string} capabilities[].teacher_id
 * @property {string} capabilities[].subject_code
 * @property {number[]} capabilities[].grades_can_teach - Numeric grades
 * @property {Array<Object>} preferences - Teacher preferences
 * @property {string} preferences[].teacher_id
 * @property {string} preferences[].subject_code
 * @property {number[]} preferences[].grades - Numeric grades
 * @property {number} preferences[].priority
 * @property {string} preferences[].granularity
 */

/**
 * Output contract: Downstream canonical payload (v1.0.0)
 * Compatible with both GateChecker v2 and Workload Balancer
 * @typedef {Object} DownstreamPayload
 * @property {string} schema_version - Always "1.0.0"
 * @property {Object} school - School information (unchanged)
 * @property {string} school.name
 * @property {string} school.filled_by
 * @property {string} school.filled_at
 * @property {Object} policy - Policy settings (unchanged)
 * @property {string} policy.generalists_grade_scope
 * @property {string} policy.overload_policy
 * @property {string} policy.ambiguous_data_policy
 * @property {boolean} policy.specialist_scope_lock
 * @property {Array<Object>} subjects - Subject definitions
 * @property {string} subjects[].subject_code
 * @property {string} subjects[].subject_name
 * @property {string[]} subjects[].grade_levels - Canonical grade strings
 * @property {number[]} subjects[].periods_per_week
 * @property {boolean} [subjects[].double_lessons_allowed] - Preserved from source
 * @property {Array<Object>} teachers - Teacher definitions
 * @property {string} teachers[].teacher_id
 * @property {string} teachers[].name - Copied from teacher_name for GC compatibility
 * @property {string} teachers[].teacher_name - Preserved from source for WB compatibility
 * @property {number} teachers[].max_periods_week
 * @property {boolean} teachers[].specialist
 * @property {number} teachers[].confidence
 * @property {string|null} teachers[].flag_note
 * @property {Array<Object>} capabilities - Teacher capabilities
 * @property {string} capabilities[].teacher_id
 * @property {string} capabilities[].subject_code
 * @property {string[]} capabilities[].grades_can_teach - Canonical grade strings
 * @property {number} [capabilities[].confidence] - Added with default 1.0 if missing
 * @property {string|null} [capabilities[].flag_note] - Added with default null if missing
 * @property {Array<Object>} preferences - Teacher preferences
 * @property {string} preferences[].teacher_id
 * @property {string} preferences[].subject_code
 * @property {string[]} preferences[].grades - Canonical grade strings
 * @property {number} preferences[].priority
 * @property {number} [preferences[].confidence] - Added with default 1.0 if missing
 * @property {string|null} [preferences[].flag_note] - Added with default null if missing
 * @property {string} [preferences[].granularity] - Preserved from source
 */

/**
 * Transforms a Möbius canonical payload to a downstream-compatible payload.
 * 
 * This transformation addresses the contract incompatibilities identified
 * in the integration audit:
 * - Grade representation: number[] -> string[] (e.g., [4,5,6] -> ["G4","G5","G6"])
 * - Teacher name: Adds 'name' field (copy of teacher_name) for GateChecker
 * - Missing optional fields: Adds confidence/flag_note to capabilities/preferences
 * 
 * The transformation is deterministic, side-effect free, and does not mutate
 * the source payload.
 * 
 * @param {Object} mobiusPayload - The Möbius canonical payload to transform
 * @returns {Object} The downstream-compatible payload
 * @throws {Error} If a required transformation cannot be performed
 */
export function transformToDownstream(mobiusPayload) {
  // Validate input is an object
  if (typeof mobiusPayload !== 'object' || mobiusPayload === null) {
    throw new Error('Adapter input must be a non-null object (Mobius canonical payload)');
  }

  // Create a deep copy to avoid mutating the source
  const payload = JSON.parse(JSON.stringify(mobiusPayload));

  // ============================================================
  // Step 1: Validate and transform top-level structure
  // ============================================================

  // Validate schema_version
  if (!payload.schema_version) {
    throw new Error('Missing required field: schema_version');
  }
  if (payload.schema_version !== '1.0.0') {
    throw new Error(`Unsupported schema_version: ${payload.schema_version}. Expected "1.0.0".`);
  }

  // Validate school
  if (!payload.school) {
    throw new Error('Missing required section: school');
  }
  requireNonEmptyString(payload.school.name, 'school.name');
  requireNonEmptyString(payload.school.filled_by, 'school.filled_by');
  requireNonEmptyString(payload.school.filled_at, 'school.filled_at');

  // Validate policy
  if (!payload.policy) {
    throw new Error('Missing required section: policy');
  }

  // ============================================================
  // Step 2: Transform subjects - convert numeric grade_levels to strings
  // ============================================================

  if (!payload.subjects) {
    throw new Error('Missing required section: subjects');
  }
  if (!Array.isArray(payload.subjects)) {
    throw new Error('Field subjects must be an array');
  }

  for (let i = 0; i < payload.subjects.length; i++) {
    const subject = payload.subjects[i];
    
    // Validate required fields
    requireNonEmptyString(subject.subject_code, `subjects[${i}].subject_code`);
    requireNonEmptyString(subject.subject_name, `subjects[${i}].subject_name`);
    
    // Validate and transform grade_levels
    if (!subject.grade_levels) {
      throw new Error(`Missing required field: subjects[${i}].grade_levels`);
    }
    subject.grade_levels = convertGradeArray(subject.grade_levels, `subjects[${i}].grade_levels`);
    
    // Validate and preserve periods_per_week (must be array of same length)
    if (!subject.periods_per_week || !Array.isArray(subject.periods_per_week)) {
      throw new Error(`Missing or invalid field: subjects[${i}].periods_per_week must be an array`);
    }
    if (subject.grade_levels.length !== subject.periods_per_week.length) {
      throw new Error(
        `Array length mismatch at subjects[${i}]: grade_levels has ${subject.grade_levels.length} elements, ` +
        `periods_per_week has ${subject.periods_per_week.length} elements`
      );
    }
    // Validate each period is a positive integer
    for (let j = 0; j < subject.periods_per_week.length; j++) {
      requirePositiveInteger(subject.periods_per_week[j], `subjects[${i}].periods_per_week[${j}]`, 1, 20);
    }
    
    // Validate and preserve double_lessons_allowed
    if (subject.double_lessons_allowed !== undefined && typeof subject.double_lessons_allowed !== 'boolean') {
      throw new Error(`Field subjects[${i}].double_lessons_allowed must be a boolean`);
    }
  }

  // ============================================================
  // Step 3: Transform teachers - add 'name' field for GateChecker compatibility
  // ============================================================

  if (!payload.teachers) {
    throw new Error('Missing required section: teachers');
  }
  if (!Array.isArray(payload.teachers)) {
    throw new Error('Field teachers must be an array');
  }

  for (let i = 0; i < payload.teachers.length; i++) {
    const teacher = payload.teachers[i];
    
    // Validate required fields
    requireNonEmptyString(teacher.teacher_id, `teachers[${i}].teacher_id`);
    const teacherName = requireNonEmptyString(teacher.teacher_name, `teachers[${i}].teacher_name`);
    
    // Add 'name' field for GateChecker compatibility (copy of teacher_name)
    teacher.name = teacherName;
    
    // Validate and preserve max_periods_week
    requirePositiveInteger(teacher.max_periods_week, `teachers[${i}].max_periods_week`, 0, 100);
    
    // Validate and preserve specialist
    if (teacher.specialist !== undefined && typeof teacher.specialist !== 'boolean') {
      throw new Error(`Field teachers[${i}].specialist must be a boolean`);
    }
    
    // Validate and preserve confidence (default to 1.0 if missing)
    if (teacher.confidence !== undefined) {
      if (typeof teacher.confidence !== 'number') {
        throw new Error(`Field teachers[${i}].confidence must be a number`);
      }
      if (teacher.confidence < 0 || teacher.confidence > 1) {
        throw new Error(`Field teachers[${i}].confidence must be between 0 and 1`);
      }
    } else {
      teacher.confidence = 1.0;
    }
    
    // Validate and preserve flag_note
    if (teacher.flag_note !== undefined && teacher.flag_note !== null) {
      if (typeof teacher.flag_note !== 'string') {
        throw new Error(`Field teachers[${i}].flag_note must be a string or null`);
      }
    } else {
      teacher.flag_note = null;
    }
  }

  // ============================================================
  // Step 4: Transform capabilities - convert numeric grades to strings
  // ============================================================

  if (!payload.capabilities) {
    throw new Error('Missing required section: capabilities');
  }
  if (!Array.isArray(payload.capabilities)) {
    throw new Error('Field capabilities must be an array');
  }

  for (let i = 0; i < payload.capabilities.length; i++) {
    const cap = payload.capabilities[i];
    
    // Validate required fields
    requireNonEmptyString(cap.teacher_id, `capabilities[${i}].teacher_id`);
    requireNonEmptyString(cap.subject_code, `capabilities[${i}].subject_code`);
    
    // Validate and transform grades_can_teach
    if (!cap.grades_can_teach) {
      throw new Error(`Missing required field: capabilities[${i}].grades_can_teach`);
    }
    cap.grades_can_teach = convertGradeArray(cap.grades_can_teach, `capabilities[${i}].grades_can_teach`);
    
    // Add optional fields with defaults if missing
    if (cap.confidence === undefined) {
      cap.confidence = 1.0;
    } else {
      if (typeof cap.confidence !== 'number' || cap.confidence < 0 || cap.confidence > 1) {
        throw new Error(`Field capabilities[${i}].confidence must be a number between 0 and 1`);
      }
    }
    
    if (cap.flag_note === undefined) {
      cap.flag_note = null;
    } else if (cap.flag_note !== null && typeof cap.flag_note !== 'string') {
      throw new Error(`Field capabilities[${i}].flag_note must be a string or null`);
    }
  }

  // ============================================================
  // Step 5: Transform preferences - convert numeric grades to strings
  // ============================================================

  if (!payload.preferences) {
    throw new Error('Missing required section: preferences');
  }
  if (!Array.isArray(payload.preferences)) {
    throw new Error('Field preferences must be an array');
  }

  for (let i = 0; i < payload.preferences.length; i++) {
    const pref = payload.preferences[i];
    
    // Validate required fields
    requireNonEmptyString(pref.teacher_id, `preferences[${i}].teacher_id`);
    requireNonEmptyString(pref.subject_code, `preferences[${i}].subject_code`);
    
    // Validate and transform grades
    if (!pref.grades) {
      throw new Error(`Missing required field: preferences[${i}].grades`);
    }
    pref.grades = convertGradeArray(pref.grades, `preferences[${i}].grades`);
    
    // Validate priority
    requirePositiveInteger(pref.priority, `preferences[${i}].priority`, 1, 3);
    
    // Validate and preserve granularity
    if (pref.granularity !== undefined) {
      if (typeof pref.granularity !== 'string' || pref.granularity !== 'subject_level') {
        throw new Error(`Field preferences[${i}].granularity must be "subject_level"`);
      }
    } else {
      pref.granularity = 'subject_level';
    }
    
    // Add optional fields with defaults if missing
    if (pref.confidence === undefined) {
      pref.confidence = 1.0;
    } else {
      if (typeof pref.confidence !== 'number' || pref.confidence < 0 || pref.confidence > 1) {
        throw new Error(`Field preferences[${i}].confidence must be a number between 0 and 1`);
      }
    }
    
    if (pref.flag_note === undefined) {
      pref.flag_note = null;
    } else if (pref.flag_note !== null && typeof pref.flag_note !== 'string') {
      throw new Error(`Field preferences[${i}].flag_note must be a string or null`);
    }
  }

  return payload;
}

/**
 * Validates that a Möbius payload is valid for transformation.
 * This is a lighter-weight check that doesn't perform the full transformation.
 * 
 * @param {Object} mobiusPayload - The payload to validate
 * @returns {boolean} True if the payload can be transformed
 */
export function canTransform(mobiusPayload) {
  try {
    // Quick checks for the most common issues
    if (typeof mobiusPayload !== 'object' || mobiusPayload === null) {
      return false;
    }
    if (mobiusPayload.schema_version !== '1.0.0') {
      return false;
    }
    if (!mobiusPayload.school || !mobiusPayload.school.name) {
      return false;
    }
    if (!mobiusPayload.teachers || !mobiusPayload.subjects) {
      return false;
    }
    
    // Check that grade arrays exist and contain valid grades
    if (mobiusPayload.subjects && Array.isArray(mobiusPayload.subjects)) {
      for (const subject of mobiusPayload.subjects) {
        if (subject.grade_levels && Array.isArray(subject.grade_levels)) {
          for (const grade of subject.grade_levels) {
            if (!isValidGrade(grade)) {
              return false;
            }
          }
        }
      }
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Returns the canonical string representation of a numeric grade
 * @param {number} grade - Numeric grade (4-9)
 * @returns {string} Canonical grade string (e.g., "G4")
 */
export function gradeToCanonical(grade) {
  return numericGradeToCanonical(grade);
}

/**
 * Returns the numeric grade from a canonical string representation
 * @param {string} gradeStr - Canonical grade string (e.g., "G4")
 * @returns {number} Numeric grade
 */
export function gradeFromCanonical(gradeStr) {
  if (typeof gradeStr !== 'string' || !gradeStr.startsWith('G')) {
    throw new Error(`Invalid canonical grade string: ${gradeStr}. Expected format "G{number}"`);
  }
  const num = parseInt(gradeStr.substring(1), 10);
  if (isNaN(num) || !isValidGrade(num)) {
    throw new Error(`Invalid grade number in canonical string: ${gradeStr}`);
  }
  return num;
}

export default {
  transformToDownstream,
  canTransform,
  gradeToCanonical,
  gradeFromCanonical,
};
