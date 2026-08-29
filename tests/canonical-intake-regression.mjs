import assert from 'node:assert/strict';
import { SEED_SUBJECTS } from '../js/config.js';
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
  state.subjects = [{ subject_code: 'SCI', subject_name: 'Science & Technology', grade_levels: [4, 10], periods_per_week: [4, 4], double_lessons_allowed: true }];
  state.capabilities[0].subject_code = 'SCI';
  state.preferences[0].subject_code = 'SCI';
}, 'SCI Grade 10 must agree with the configured UI exclusion');

const renamed = validState();
renameSubjectCode(renamed, 0, 'VISART');
assert.equal(renamed.subjects[0].subject_code, 'VISART');
assert.equal(renamed.capabilities[0].subject_code, 'VISART');
assert.equal(renamed.preferences[0].subject_code, 'VISART');
assert.deepEqual(validatePayload(buildPayload(renamed)), []);

// Phase 2: Grade range validation
console.log('\n--- Phase 2 Tests ---');
console.log('Testing grade range validation...');
expectInvalid(state => { state.subjects[0].grade_levels = [3]; state.subjects[0].periods_per_week = [5]; }, 'grade 3 is outside valid range 4-10');
expectInvalid(state => { state.subjects[0].grade_levels = [11]; state.subjects[0].periods_per_week = [5]; }, 'grade 11 is outside valid range 4-10');
expectInvalid(state => { state.capabilities[0].grades_can_teach = [3]; }, 'capability grade 3 is outside valid range');
expectInvalid(state => { state.capabilities[0].grades_can_teach = [11]; }, 'capability grade 11 is outside valid range');
expectInvalid(state => { state.preferences[0].grades = [3]; }, 'preference grade 3 is outside valid range');
expectInvalid(state => { state.preferences[0].grades = [11]; }, 'preference grade 11 is outside valid range');

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

console.log('\ncanonical intake regression tests passed (Phase 1 + Phase 2)');
