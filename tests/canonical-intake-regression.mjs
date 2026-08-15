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

console.log('canonical intake regression tests passed');
