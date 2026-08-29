import assert from 'node:assert/strict';
import { SCHOOL_GRADE_RANGE, GRADE_BANDS, SEED_SUBJECTS } from '../js/config.js';
import { parseNumericInput } from '../js/numbers.js';
import { renameSubjectCode } from '../js/subject-relations.js';
import { buildPayload, validatePayload } from '../js/schema.js';

function validState() {
  return {
    school: { name: 'Acacia Academy', filled_by: 'M. Otieno', filled_at: '2026-08-15' },
    policy: {
      generalists_grade_scope: 'explicit_only',
      overload_policy: 'block',
      ambiguous_data_policy: 'use_default_and_warn',
      specialist_scope_lock: true
    },
    subjects: [{ subject_code: 'ART', subject_name: 'Art', grade_levels: [4], periods_per_week: [5], double_lessons_allowed: true }],
    teachers: [{ teacher_id: 'T-001', teacher_name: 'Amina Njeri', max_periods_week: 30, specialist: false, confidence: 1, flag_note: null }],
    capabilities: [{ teacher_id: 'T-001', subject_code: 'ART', grades_can_teach: [4] }],
    preferences: [{ teacher_id: 'T-001', subject_code: 'ART', grades: [4], priority: 2, granularity: 'subject_level' }]
  };
}

function errorsFor(mutator) {
  const state = validState();
  mutator(state);
  return validatePayload(buildPayload(state));
}

function expectInvalid(mutator, message) {
  assert.ok(errorsFor(mutator).length > 0, message);
}

for (const code of ['INTSCI', 'PRETECH']) {
  const subject = SEED_SUBJECTS.find(item => item.subject_code === code);
  assert.equal(subject.grade_levels.length, subject.periods_per_week.length, `${code} seed periods must align with grades`);
}
const seededState = validState();
seededState.subjects = structuredClone(SEED_SUBJECTS);
seededState.capabilities = [];
seededState.preferences = [];
assert.deepEqual(validatePayload(buildPayload(seededState)), [], 'the initial subject seed must pass canonical validation');

assert.equal(parseNumericInput('12.8'), 12.8, 'decimal input must not be truncated');
assert.equal(parseNumericInput(''), 0, 'blank input keeps the existing zero/removal behavior');
expectInvalid(state => { state.subjects[0].periods_per_week[0] = 12.8; }, 'decimal periods must be rejected');
expectInvalid(state => { state.subjects[0].periods_per_week[0] = -1; }, 'negative periods must be rejected');
expectInvalid(state => { state.subjects[0].periods_per_week[0] = 21; }, 'periods above the UI maximum must be rejected');
assert.deepEqual(errorsFor(state => { state.teachers[0].max_periods_week = 0; }), [], 'zero teacher load remains valid');
assert.deepEqual(errorsFor(state => { state.teachers[0].max_periods_week = 100; }), [], 'maximum teacher load remains valid');
expectInvalid(state => { state.teachers[0].max_periods_week = -1; }, 'negative teacher load must be rejected');
expectInvalid(state => { state.teachers[0].max_periods_week = 101; }, 'teacher load above UI maximum must be rejected');
expectInvalid(state => { state.teachers[0].max_periods_week = 12.8; }, 'decimal teacher load must be rejected');

const missingDate = validState();
missingDate.school.filled_at = '';
const missingDatePayload = buildPayload(missingDate);
assert.equal(missingDatePayload.school.filled_at, '', 'serialization must not fabricate a missing date');
assert.ok(validatePayload(missingDatePayload).includes('Filled at date is required'));

const missingFilledBy = validState();
missingFilledBy.school.filled_by = '';
assert.ok(validatePayload(buildPayload(missingFilledBy)).includes('Filled by is required'));

expectInvalid(state => { state.capabilities[0].teacher_id = 'T-404'; }, 'dangling capability teacher references must be rejected');
expectInvalid(state => { state.preferences[0].subject_code = 'MISSING'; }, 'dangling preference subject references must be rejected');
expectInvalid(state => { state.capabilities.push({ ...state.capabilities[0] }); }, 'duplicate capability pairs must be rejected');
expectInvalid(state => { state.preferences.push({ ...state.preferences[0] }); }, 'duplicate preference pairs must be rejected');

expectInvalid(state => {
  state.subjects = [{ subject_code: 'SCI', subject_name: 'Science & Technology', grade_levels: [4, 7], periods_per_week: [4, 4], double_lessons_allowed: true }];
  state.capabilities[0].subject_code = 'SCI';
  state.preferences[0].subject_code = 'SCI';
}, 'SCI must NOT include grades 7-9 (JR_SCHOOL band exclusion)');

const renamed = validState();
renameSubjectCode(renamed, 0, 'VISART');
assert.equal(renamed.subjects[0].subject_code, 'VISART');
assert.equal(renamed.capabilities[0].subject_code, 'VISART');
assert.equal(renamed.preferences[0].subject_code, 'VISART');
assert.deepEqual(validatePayload(buildPayload(renamed)), []);

// Phase 2: Grade range validation
console.log('\n--- Phase 2 Tests ---');
console.log('Testing grade range validation...');
expectInvalid(state => { state.subjects[0].grade_levels = [3]; state.subjects[0].periods_per_week = [5]; }, 'grade 3 is outside valid range 4-9');
expectInvalid(state => { state.subjects[0].grade_levels = [10]; state.subjects[0].periods_per_week = [5]; }, 'grade 10 is outside valid range 4-9');
expectInvalid(state => { state.subjects[0].grade_levels = [11]; state.subjects[0].periods_per_week = [5]; }, 'grade 11 is outside valid range 4-9');
expectInvalid(state => { state.capabilities[0].grades_can_teach = [3]; }, 'capability grade 3 is outside valid range 4-9');
expectInvalid(state => { state.capabilities[0].grades_can_teach = [10]; }, 'capability grade 10 is outside valid range 4-9');
expectInvalid(state => { state.capabilities[0].grades_can_teach = [11]; }, 'capability grade 11 is outside valid range 4-9');
expectInvalid(state => { state.preferences[0].grades = [3]; }, 'preference grade 3 is outside valid range 4-9');
expectInvalid(state => { state.preferences[0].grades = [10]; }, 'preference grade 10 is outside valid range 4-9');
expectInvalid(state => { state.preferences[0].grades = [11]; }, 'preference grade 11 is outside valid range 4-9');

// Phase 2: Confidence range validation
console.log('Testing confidence range validation...');
expectInvalid(state => { state.teachers[0].confidence = -0.1; }, 'confidence below 0 must be rejected');
expectInvalid(state => { state.teachers[0].confidence = 1.1; }, 'confidence above 1 must be rejected');
assert.deepEqual(errorsFor(state => { state.teachers[0].confidence = 0; }), [], 'confidence of 0 is valid');
assert.deepEqual(errorsFor(state => { state.teachers[0].confidence = 1; }), [], 'confidence of 1 is valid');
assert.deepEqual(errorsFor(state => { state.teachers[0].confidence = 0.5; }), [], 'confidence of 0.5 is valid');

// Phase 2: Grade type validation in capabilities and preferences
console.log('Testing grade type validation...');
expectInvalid(state => { state.capabilities[0].grades_can_teach = ['4']; }, 'capability grades must be numbers');
expectInvalid(state => { state.capabilities[0].grades_can_teach = [null]; }, 'capability grades must be numbers');
expectInvalid(state => { state.preferences[0].grades = ['4']; }, 'preference grades must be numbers');
expectInvalid(state => { state.preferences[0].grades = [null]; }, 'preference grades must be numbers');

// Phase 2: Grade applicability validation (stale data detection)
console.log('Testing grade applicability validation...');
// Capability references a grade not in the subject's grade_levels
expectInvalid(state => {
  state.subjects[0].grade_levels = [4, 5];
  state.subjects[0].periods_per_week = [5, 5];
  state.capabilities[0].grades_can_teach = [4, 6]; // 6 is not in subject grades
}, 'capability with grade not in subject grade_levels must be rejected');

// Preference references a grade not in the subject's grade_levels
expectInvalid(state => {
  state.subjects[0].grade_levels = [4, 5];
  state.subjects[0].periods_per_week = [5, 5];
  state.preferences[0].grades = [4, 6]; // 6 is not in subject grades
}, 'preference with grade not in subject grade_levels must be rejected');

// Valid: capability grades are subset of subject grades
assert.deepEqual(errorsFor(state => {
  state.subjects[0].grade_levels = [4, 5, 6];
  state.subjects[0].periods_per_week = [5, 5, 5];
  state.capabilities[0].grades_can_teach = [4, 5];
  state.preferences[0].grades = [4, 5];
}), [], 'capability and preference grades that are subset of subject grades are valid');

// Valid: capability grades exactly match subject grades
assert.deepEqual(errorsFor(state => {
  state.subjects[0].grade_levels = [4, 5];
  state.subjects[0].periods_per_week = [5, 5];
  state.capabilities[0].grades_can_teach = [4, 5];
  state.preferences[0].grades = [4, 5];
}), [], 'capability and preference grades matching subject grades are valid');

// Phase 3: G4-G9 CBC grade range and seed subject tests
console.log('\n--- Phase 3 Tests: G4-G9 CBC Grade Range ---');

// Test supported grade range is exactly 4-9
console.log('Testing supported grade range 4-9...');
const gradeRangeTests = validState();
gradeRangeTests.subjects = structuredClone(SEED_SUBJECTS);
gradeRangeTests.teachers = [];
gradeRangeTests.capabilities = [];
gradeRangeTests.preferences = [];
assert.deepEqual(validatePayload(buildPayload(gradeRangeTests)), [], 'SEED_SUBJECTS with G4-G9 should pass validation');

// Test that G10 is rejected in subjects
expectInvalid(state => { 
  state.subjects[0].grade_levels = [10]; 
  state.subjects[0].periods_per_week = [5]; 
}, 'grade 10 must be rejected in subjects');

// Test that G10 is rejected in capabilities
expectInvalid(state => { 
  state.capabilities[0].grades_can_teach = [10]; 
}, 'grade 10 must be rejected in capabilities');

// Test that G10 is rejected in preferences
expectInvalid(state => { 
  state.preferences[0].grades = [10]; 
}, 'grade 10 must be rejected in preferences');

// Test grade band configuration
console.log('Testing grade band configuration...');
assert.deepEqual(GRADE_BANDS.UPPER_PRIMARY, [4, 5, 6], 'UPPER_PRIMARY must be exactly [4,5,6]');
assert.deepEqual(GRADE_BANDS.JR_SCHOOL, [7, 8, 9], 'JR_SCHOOL must be exactly [7,8,9]');
assert.equal(Object.keys(GRADE_BANDS).length, 2, 'GRADE_BANDS must have exactly 2 bands (UPPER_PRIMARY and JR_SCHOOL)');

// Test seed subject alignment
console.log('Testing seed subject alignment...');
SEED_SUBJECTS.forEach(subject => {
  // Every subject must have aligned grade_levels and periods_per_week arrays
  assert.equal(subject.grade_levels.length, subject.periods_per_week.length, 
    `${subject.subject_code} must have aligned grade_levels and periods_per_week arrays`);
  
  // Every grade must be in the valid range
  subject.grade_levels.forEach(grade => {
    assert.ok(SCHOOL_GRADE_RANGE.includes(grade), 
      `${subject.subject_code} grade ${grade} must be in SCHOOL_GRADE_RANGE [${SCHOOL_GRADE_RANGE.join(', ')}]`);
  });
  
  // No subject should have grade 10
  assert.ok(!subject.grade_levels.includes(10), 
    `${subject.subject_code} must NOT include grade 10`);
  
  // No zero periods allowed
  subject.periods_per_week.forEach((periods, index) => {
    assert.ok(periods >= 1 && periods <= 20, 
      `${subject.subject_code} grade ${subject.grade_levels[index]} periods must be 1-20`);
  });
});

// Test that default roster is populated with complete CBC learning areas
console.log('Testing default roster population...');
const defaultRosterTests = validState();
defaultRosterTests.subjects = structuredClone(SEED_SUBJECTS);
assert.equal(defaultRosterTests.subjects.length, 6, 'Default roster should have 6 seeded subjects');

// Verify specific seed subjects exist
const seedCodes = SEED_SUBJECTS.map(s => s.subject_code);
assert.ok(seedCodes.includes('ENG'), 'Default roster must include ENG');
assert.ok(seedCodes.includes('MATH'), 'Default roster must include MATH');
assert.ok(seedCodes.includes('AGRI'), 'Default roster must include AGRI');
assert.ok(seedCodes.includes('SCI'), 'Default roster must include SCI');
assert.ok(seedCodes.includes('INTSCI'), 'Default roster must include INTSCI');
assert.ok(seedCodes.includes('PRETECH'), 'Default roster must include PRETECH');

// Test grade-band awareness
console.log('Testing grade-band aware subject seeding...');
const engSubject = SEED_SUBJECTS.find(s => s.subject_code === 'ENG');
assert.deepEqual(engSubject.grade_levels, [4, 5, 6, 7, 8, 9], 'ENG should span all grades 4-9');

const sciSubject = SEED_SUBJECTS.find(s => s.subject_code === 'SCI');
assert.deepEqual(sciSubject.grade_levels, [4, 5, 6], 'SCI should only include Upper Primary grades 4-6');

const intSciSubject = SEED_SUBJECTS.find(s => s.subject_code === 'INTSCI');
assert.deepEqual(intSciSubject.grade_levels, [7, 8, 9], 'INTSCI should only include JR_SCHOOL grades 7-9');

const preTechSubject = SEED_SUBJECTS.find(s => s.subject_code === 'PRETECH');
assert.deepEqual(preTechSubject.grade_levels, [7, 8, 9], 'PRETECH should only include JR_SCHOOL grades 7-9');

// Test that editing still works (subjects can be modified)
console.log('Testing that editing still works...');
const editingTests = validState();
editingTests.subjects = structuredClone(SEED_SUBJECTS);
// Modify a seeded subject's periods
editingTests.subjects[0].periods_per_week[0] = 6;
// Update capabilities and preferences to reference the actual seed subjects
editingTests.capabilities = [{ teacher_id: 'T-001', subject_code: 'ENG', grades_can_teach: [4] }];
editingTests.preferences = [{ teacher_id: 'T-001', subject_code: 'ENG', grades: [4], priority: 2, granularity: 'subject_level' }];
assert.deepEqual(validatePayload(buildPayload(editingTests)), [], 'Modified seeded subject periods should still pass validation');

// Test that removing a seeded subject still works
console.log('Testing that removing a seeded subject still works...');
const removeTests = validState();
removeTests.subjects = structuredClone(SEED_SUBJECTS);
removeTests.subjects = removeTests.subjects.filter(s => s.subject_code !== 'AGRI');
// Update capabilities and preferences to reference the actual seed subjects
removeTests.capabilities = [{ teacher_id: 'T-001', subject_code: 'ENG', grades_can_teach: [4] }];
removeTests.preferences = [{ teacher_id: 'T-001', subject_code: 'ENG', grades: [4], priority: 2, granularity: 'subject_level' }];
assert.deepEqual(validatePayload(buildPayload(removeTests)), [], 'Removing a seeded subject should pass validation');

// Test that adding a custom subject still works
console.log('Testing that adding a custom subject still works...');
const addTests = validState();
addTests.subjects = structuredClone(SEED_SUBJECTS);
addTests.subjects.push({ subject_code: 'KISW', subject_name: 'Kiswahili', grade_levels: [4, 5, 6, 7, 8, 9], periods_per_week: [5, 5, 5, 5, 5, 5], double_lessons_allowed: true });
// Update capabilities and preferences to reference the actual subjects
addTests.capabilities = [{ teacher_id: 'T-001', subject_code: 'KISW', grades_can_teach: [4] }];
addTests.preferences = [{ teacher_id: 'T-001', subject_code: 'KISW', grades: [4], priority: 2, granularity: 'subject_level' }];
assert.deepEqual(validatePayload(buildPayload(addTests)), [], 'Adding a custom subject should pass validation');

console.log('\ncanonical intake regression tests passed (Phase 1 + Phase 2 + Phase 3)');
