// ============================================================
// Canonical Payload Integration Adapter - Test Suite
// Phase 1: Unit, Integration, and Regression Tests
// ============================================================

import assert from 'node:assert/strict';
import {
  transformToDownstream,
  canTransform,
  gradeToCanonical,
  gradeFromCanonical,
} from '../js/adapter.js';
import { buildPayload, validatePayload } from '../js/schema.js';

// ============================================================
// Helper: Create a valid Möbius state for testing
// ============================================================
function createValidState() {
  return {
    school: { name: 'Test Academy', filled_by: 'Test User', filled_at: '2026-08-29' },
    policy: {
      generalists_grade_scope: 'explicit_only',
      overload_policy: 'block',
      ambiguous_data_policy: 'use_default_and_warn',
      specialist_scope_lock: true,
    },
    subjects: [
      {
        subject_code: 'ENG',
        subject_name: 'English',
        grade_levels: [4, 5, 6, 7, 8, 9, 10],
        periods_per_week: [5, 5, 5, 5, 5, 5, 5],
        double_lessons_allowed: true,
      },
      {
        subject_code: 'MATH',
        subject_name: 'Mathematics',
        grade_levels: [4, 5, 6],
        periods_per_week: [5, 5, 5],
        double_lessons_allowed: true,
      },
    ],
    teachers: [
      {
        teacher_id: 'T-001',
        teacher_name: 'Alice Johnson',
        max_periods_week: 30,
        specialist: false,
        confidence: 0.95,
        flag_note: null,
      },
      {
        teacher_id: 'T-002',
        teacher_name: 'Bob Smith',
        max_periods_week: 25,
        specialist: true,
        confidence: 0.85,
        flag_note: 'Experienced teacher',
      },
    ],
    capabilities: [
      { teacher_id: 'T-001', subject_code: 'ENG', grades_can_teach: [4, 5, 6, 7, 8, 9, 10] },
      { teacher_id: 'T-001', subject_code: 'MATH', grades_can_teach: [4, 5, 6] },
      { teacher_id: 'T-002', subject_code: 'ENG', grades_can_teach: [7, 8, 9, 10] },
    ],
    preferences: [
      { teacher_id: 'T-001', subject_code: 'ENG', grades: [4, 5, 6, 7, 8, 9, 10], priority: 1, granularity: 'subject_level' },
      { teacher_id: 'T-001', subject_code: 'MATH', grades: [4, 5, 6], priority: 2, granularity: 'subject_level' },
      { teacher_id: 'T-002', subject_code: 'ENG', grades: [7, 8, 9, 10], priority: 1, granularity: 'subject_level' },
    ],
  };
}

// ============================================================
// Test 1: Grade Conversion Utilities
// ============================================================
console.log('\n=== Test 1: Grade Conversion Utilities ===');

// Test gradeToCanonical with valid grades
for (const grade of [4, 5, 6, 7, 8, 9, 10]) {
  const result = gradeToCanonical(grade);
  assert.strictEqual(result, `G${grade}`, `gradeToCanonical(${grade}) should return "G${grade}"`);
}
console.log('✓ gradeToCanonical: All valid grades convert correctly');

// Test gradeToCanonical with invalid grades
const invalidGrades = [3, 11, 15, 0, -1, 100, 3.5, '4', null, undefined];
for (const grade of invalidGrades) {
  try {
    gradeToCanonical(grade);
    assert.fail(`gradeToCanonical(${grade}) should throw an error`);
  } catch (e) {
    assert.ok(e.message.includes('Invalid numeric grade'), `Error message should mention invalid grade: ${e.message}`);
  }
}
console.log('✓ gradeToCanonical: Invalid grades throw errors');

// Test gradeFromCanonical with valid canonical grades
for (const grade of [4, 5, 6, 7, 8, 9, 10]) {
  const canonical = `G${grade}`;
  const result = gradeFromCanonical(canonical);
  assert.strictEqual(result, grade, `gradeFromCanonical("${canonical}") should return ${grade}`);
}
console.log('✓ gradeFromCanonical: All valid canonical grades convert correctly');

// Test gradeFromCanonical with invalid formats
const invalidCanonical = ['4', 'G', 'G11', 'G3.5', '', 'G-1', 'G100', null, undefined];
for (const gradeStr of invalidCanonical) {
  try {
    gradeFromCanonical(gradeStr);
    assert.fail(`gradeFromCanonical("${gradeStr}") should throw an error`);
  } catch (e) {
    assert.ok(
      e.message.includes('Invalid canonical grade string') || e.message.includes('Invalid grade number'),
      `Error message should mention invalid format: ${e.message}`
    );
  }
}
console.log('✓ gradeFromCanonical: Invalid formats throw errors');

// ============================================================
// Test 2: Basic Transformation
// ============================================================
console.log('\n=== Test 2: Basic Transformation ===');

const validState = createValidState();
const mobiusPayload = buildPayload(validState);

// Verify it's a valid Möbius payload
const validationErrors = validatePayload(mobiusPayload);
assert.deepStrictEqual(validationErrors, [], 'Valid state should produce a valid payload');

// Transform to downstream
const downstreamPayload = transformToDownstream(mobiusPayload);

// Verify schema_version is preserved
assert.strictEqual(downstreamPayload.schema_version, '1.0.0', 'schema_version should be preserved');
console.log('✓ schema_version preserved');

// Verify school is preserved
assert.deepStrictEqual(downstreamPayload.school, mobiusPayload.school, 'school should be preserved');
console.log('✓ school preserved');

// Verify policy is preserved
assert.deepStrictEqual(downstreamPayload.policy, mobiusPayload.policy, 'policy should be preserved');
console.log('✓ policy preserved');

// ============================================================
// Test 3: Grade Representation Transformation (CRITICAL)
// ============================================================
console.log('\n=== Test 3: Grade Representation Transformation ===');

// Test subjects grade_levels transformation
for (let i = 0; i < downstreamPayload.subjects.length; i++) {
  const mobiusSubject = mobiusPayload.subjects[i];
  const downstreamSubject = downstreamPayload.subjects[i];
  
  assert.strictEqual(
    downstreamSubject.grade_levels.length,
    mobiusSubject.grade_levels.length,
    `Subject ${i} grade_levels length should match`
  );
  
  for (let j = 0; j < mobiusSubject.grade_levels.length; j++) {
    const expectedGrade = `G${mobiusSubject.grade_levels[j]}`;
    assert.strictEqual(
      downstreamSubject.grade_levels[j],
      expectedGrade,
      `Subject ${i} grade ${j} should be "${expectedGrade}"`
    );
  }
}
console.log('✓ subjects.grade_levels: Numeric grades converted to canonical strings');

// Test capabilities grades_can_teach transformation
for (let i = 0; i < downstreamPayload.capabilities.length; i++) {
  const mobiusCap = mobiusPayload.capabilities[i];
  const downstreamCap = downstreamPayload.capabilities[i];
  
  for (let j = 0; j < mobiusCap.grades_can_teach.length; j++) {
    const expectedGrade = `G${mobiusCap.grades_can_teach[j]}`;
    assert.strictEqual(
      downstreamCap.grades_can_teach[j],
      expectedGrade,
      `Capability ${i} grade ${j} should be "${expectedGrade}"`
    );
  }
}
console.log('✓ capabilities.grades_can_teach: Numeric grades converted to canonical strings');

// Test preferences grades transformation
for (let i = 0; i < downstreamPayload.preferences.length; i++) {
  const mobiusPref = mobiusPayload.preferences[i];
  const downstreamPref = downstreamPayload.preferences[i];
  
  for (let j = 0; j < mobiusPref.grades.length; j++) {
    const expectedGrade = `G${mobiusPref.grades[j]}`;
    assert.strictEqual(
      downstreamPref.grades[j],
      expectedGrade,
      `Preference ${i} grade ${j} should be "${expectedGrade}"`
    );
  }
}
console.log('✓ preferences.grades: Numeric grades converted to canonical strings');

// ============================================================
// Test 4: Teacher Name Field Transformation (CRITICAL)
// ============================================================
console.log('\n=== Test 4: Teacher Name Field Transformation ===');

for (let i = 0; i < downstreamPayload.teachers.length; i++) {
  const mobiusTeacher = mobiusPayload.teachers[i];
  const downstreamTeacher = downstreamPayload.teachers[i];
  
  // Verify teacher_name is preserved
  assert.strictEqual(
    downstreamTeacher.teacher_name,
    mobiusTeacher.teacher_name,
    `Teacher ${i} teacher_name should be preserved`
  );
  
  // Verify name field is added (copy of teacher_name)
  assert.strictEqual(
    downstreamTeacher.name,
    mobiusTeacher.teacher_name,
    `Teacher ${i} name should equal teacher_name`
  );
  
  // Verify both fields exist
  assert.ok('name' in downstreamTeacher, `Teacher ${i} should have 'name' field`);
  assert.ok('teacher_name' in downstreamTeacher, `Teacher ${i} should have 'teacher_name' field`);
}
console.log('✓ Teacher name: Both name and teacher_name fields present');

// ============================================================
// Test 5: Missing Optional Fields
// ============================================================
console.log('\n=== Test 5: Missing Optional Fields ===');

// Test that missing confidence/flag_note are added to capabilities
for (const cap of downstreamPayload.capabilities) {
  assert.ok('confidence' in cap, 'Capability should have confidence field');
  assert.strictEqual(cap.confidence, 1.0, 'Capability confidence should default to 1.0');
  assert.ok('flag_note' in cap, 'Capability should have flag_note field');
  assert.strictEqual(cap.flag_note, null, 'Capability flag_note should default to null');
}
console.log('✓ capabilities: Missing confidence/flag_note added with defaults');

// Test that missing confidence/flag_note are added to preferences
for (const pref of downstreamPayload.preferences) {
  assert.ok('confidence' in pref, 'Preference should have confidence field');
  assert.strictEqual(pref.confidence, 1.0, 'Preference confidence should default to 1.0');
  assert.ok('flag_note' in pref, 'Preference should have flag_note field');
  assert.strictEqual(pref.flag_note, null, 'Preference flag_note should default to null');
}
console.log('✓ preferences: Missing confidence/flag_note added with defaults');

// ============================================================
// Test 6: Field Preservation
// ============================================================
console.log('\n=== Test 6: Field Preservation ===');

// Verify periods_per_week is preserved
for (let i = 0; i < downstreamPayload.subjects.length; i++) {
  assert.deepStrictEqual(
    downstreamPayload.subjects[i].periods_per_week,
    mobiusPayload.subjects[i].periods_per_week,
    `Subject ${i} periods_per_week should be preserved`
  );
}
console.log('✓ subjects.periods_per_week preserved');

// Verify double_lessons_allowed is preserved
for (let i = 0; i < downstreamPayload.subjects.length; i++) {
  assert.strictEqual(
    downstreamPayload.subjects[i].double_lessons_allowed,
    mobiusPayload.subjects[i].double_lessons_allowed,
    `Subject ${i} double_lessons_allowed should be preserved`
  );
}
console.log('✓ subjects.double_lessons_allowed preserved');

// Verify teacher fields are preserved
for (let i = 0; i < downstreamPayload.teachers.length; i++) {
  const mobiusTeacher = mobiusPayload.teachers[i];
  const downstreamTeacher = downstreamPayload.teachers[i];
  
  assert.strictEqual(
    downstreamTeacher.teacher_id,
    mobiusTeacher.teacher_id,
    `Teacher ${i} teacher_id should be preserved`
  );
  assert.strictEqual(
    downstreamTeacher.max_periods_week,
    mobiusTeacher.max_periods_week,
    `Teacher ${i} max_periods_week should be preserved`
  );
  assert.strictEqual(
    downstreamTeacher.specialist,
    mobiusTeacher.specialist,
    `Teacher ${i} specialist should be preserved`
  );
  assert.strictEqual(
    downstreamTeacher.confidence,
    mobiusTeacher.confidence,
    `Teacher ${i} confidence should be preserved`
  );
  assert.strictEqual(
    downstreamTeacher.flag_note,
    mobiusTeacher.flag_note,
    `Teacher ${i} flag_note should be preserved`
  );
}
console.log('✓ teachers: All fields preserved');

// ============================================================
// Test 7: Immutability (Source Not Mutated)
// ============================================================
console.log('\n=== Test 7: Immutability ===');

const stateForImmutability = createValidState();
const payloadBefore = buildPayload(stateForImmutability);
const originalSubjectGrades = JSON.stringify(payloadBefore.subjects[0].grade_levels);
const originalTeacherName = payloadBefore.teachers[0].teacher_name;

// Transform
transformToDownstream(payloadBefore);

// Verify source is unchanged
assert.strictEqual(
  JSON.stringify(payloadBefore.subjects[0].grade_levels),
  originalSubjectGrades,
  'Source subjects[0].grade_levels should not be mutated'
);
assert.strictEqual(
  payloadBefore.teachers[0].teacher_name,
  originalTeacherName,
  'Source teachers[0].teacher_name should not be mutated'
);
assert.strictEqual(
  'name' in payloadBefore.teachers[0],
  false,
  'Source teachers[0] should not have name field added'
);
console.log('✓ Source payload not mutated by transformation');

// ============================================================
// Test 8: Edge Cases
// ============================================================
console.log('\n=== Test 8: Edge Cases ===');

// Test with empty arrays
const emptyState = {
  school: { name: 'Empty School', filled_by: 'User', filled_at: '2026-08-29' },
  policy: {
    generalists_grade_scope: 'explicit_only',
    overload_policy: 'block',
    ambiguous_data_policy: 'use_default_and_warn',
    specialist_scope_lock: true,
  },
  subjects: [],
  teachers: [],
  capabilities: [],
  preferences: [],
};
const emptyPayload = buildPayload(emptyState);
const emptyDownstream = transformToDownstream(emptyPayload);
assert.deepStrictEqual(emptyDownstream.subjects, [], 'Empty subjects array should remain empty');
assert.deepStrictEqual(emptyDownstream.teachers, [], 'Empty teachers array should remain empty');
assert.deepStrictEqual(emptyDownstream.capabilities, [], 'Empty capabilities array should remain empty');
assert.deepStrictEqual(emptyDownstream.preferences, [], 'Empty preferences array should remain empty');
console.log('✓ Empty arrays handled correctly');

// Test with single grade
const singleGradeState = createValidState();
singleGradeState.subjects[0].grade_levels = [4];
singleGradeState.subjects[0].periods_per_week = [5];
singleGradeState.capabilities[0].grades_can_teach = [4];
singleGradeState.preferences[0].grades = [4];
const singleGradePayload = buildPayload(singleGradeState);
const singleGradeDownstream = transformToDownstream(singleGradePayload);
assert.deepStrictEqual(singleGradeDownstream.subjects[0].grade_levels, ['G4']);
assert.deepStrictEqual(singleGradeDownstream.capabilities[0].grades_can_teach, ['G4']);
assert.deepStrictEqual(singleGradeDownstream.preferences[0].grades, ['G4']);
console.log('✓ Single grade handled correctly');

// Test with boundary values
const boundaryState = createValidState();
boundaryState.teachers[0].max_periods_week = 0;
boundaryState.teachers[1].max_periods_week = 100;
const boundaryPayload = buildPayload(boundaryState);
const boundaryDownstream = transformToDownstream(boundaryPayload);
assert.strictEqual(boundaryDownstream.teachers[0].max_periods_week, 0);
assert.strictEqual(boundaryDownstream.teachers[1].max_periods_week, 100);
console.log('✓ Boundary values handled correctly');

// ============================================================
// Test 9: Error Cases
// ============================================================
console.log('\n=== Test 9: Error Cases ===');

// Test missing schema_version
try {
  transformToDownstream({ school: { name: 'Test' } });
  assert.fail('Should throw for missing schema_version');
} catch (e) {
  assert.ok(e.message.includes('Missing required field: schema_version'));
}
console.log('✓ Missing schema_version throws error');

// Test wrong schema_version
try {
  transformToDownstream({ schema_version: '2.0.0', school: { name: 'Test', filled_by: 'U', filled_at: '2026-01-01' }, policy: {}, subjects: [], teachers: [], capabilities: [], preferences: [] });
  assert.fail('Should throw for unsupported schema_version');
} catch (e) {
  assert.ok(e.message.includes('Unsupported schema_version'));
}
console.log('✓ Unsupported schema_version throws error');

// Test missing school
try {
  transformToDownstream({ schema_version: '1.0.0', policy: {}, subjects: [], teachers: [], capabilities: [], preferences: [] });
  assert.fail('Should throw for missing school');
} catch (e) {
  assert.ok(e.message.includes('Missing required section: school'));
}
console.log('✓ Missing school throws error');

// Test invalid grade (out of range)
try {
  const invalidGradeState = createValidState();
  invalidGradeState.subjects[0].grade_levels = [3, 5, 6];
  const invalidGradePayload = buildPayload(invalidGradeState);
  transformToDownstream(invalidGradePayload);
  assert.fail('Should throw for invalid grade 3');
} catch (e) {
  assert.ok(e.message.includes('Invalid numeric grade: 3'));
}
console.log('✓ Invalid grade throws error');

// Test non-integer grade
try {
  const nonIntegerState = createValidState();
  nonIntegerState.subjects[0].grade_levels = [4.5, 5, 6];
  const nonIntegerPayload = buildPayload(nonIntegerState);
  transformToDownstream(nonIntegerPayload);
  assert.fail('Should throw for non-integer grade');
} catch (e) {
  assert.ok(e.message.includes('Invalid numeric grade'));
}
console.log('✓ Non-integer grade throws error');

// Test misaligned arrays
try {
  const misalignedState = createValidState();
  misalignedState.subjects[0].grade_levels = [4, 5, 6];
  misalignedState.subjects[0].periods_per_week = [5, 5]; // Length mismatch
  const misalignedPayload = buildPayload(misalignedState);
  transformToDownstream(misalignedPayload);
  assert.fail('Should throw for array length mismatch');
} catch (e) {
  assert.ok(e.message.includes('Array length mismatch'));
}
console.log('✓ Array length mismatch throws error');

// Test missing teacher_name
try {
  const noTeacherNameState = createValidState();
  noTeacherNameState.teachers[0].teacher_name = '';
  const noTeacherNamePayload = buildPayload(noTeacherNameState);
  transformToDownstream(noTeacherNamePayload);
  assert.fail('Should throw for empty teacher_name');
} catch (e) {
  assert.ok(e.message.includes('Missing or empty required field: teachers[0].teacher_name'));
}
console.log('✓ Empty teacher_name throws error');

// Test invalid type for periods (direct payload, not through buildPayload)
try {
  const directPayload = {
    schema_version: '1.0.0',
    school: { name: 'Test', filled_by: 'User', filled_at: '2026-08-29' },
    policy: {
      generalists_grade_scope: 'explicit_only',
      overload_policy: 'block',
      ambiguous_data_policy: 'use_default_and_warn',
      specialist_scope_lock: true,
    },
    subjects: [
      { subject_code: 'ENG', subject_name: 'English', grade_levels: [4, 5], periods_per_week: [5, 'invalid'] },
    ],
    teachers: [],
    capabilities: [],
    preferences: [],
  };
  transformToDownstream(directPayload);
  assert.fail('Should throw for invalid period type');
} catch (e) {
  assert.ok(e.message.includes('Invalid type for field subjects[0].periods_per_week[1]'));
}
console.log('✓ Invalid period type throws error');

// Test null input
try {
  transformToDownstream(null);
  assert.fail('Should throw for null input');
} catch (e) {
  assert.ok(e.message.includes('non-null object'));
}
console.log('✓ Null input throws error');

// ============================================================
// Test 10: canTransform Function
// ============================================================
console.log('\n=== Test 10: canTransform Function ===');

// Valid payload should be transformable
assert.ok(canTransform(mobiusPayload), 'Valid payload should be transformable');
console.log('✓ canTransform returns true for valid payload');

// Invalid payloads should not be transformable
assert.strictEqual(canTransform(null), false, 'Null should not be transformable');
assert.strictEqual(canTransform(undefined), false, 'Undefined should not be transformable');
assert.strictEqual(canTransform({}), false, 'Empty object should not be transformable');
assert.strictEqual(canTransform({ schema_version: '2.0.0' }), false, 'Wrong schema_version should not be transformable');
assert.strictEqual(canTransform({ schema_version: '1.0.0' }), false, 'Missing school should not be transformable');
console.log('✓ canTransform returns false for invalid payloads');

// ============================================================
// Test 11: Regression Test - Exact Audit Blocker
// ============================================================
console.log('\n=== Test 11: Regression Test - Exact Audit Blocker ===');

// This test specifically covers the exact compatibility blocker identified in the audit:
// "Grade Representation: Möbius uses numeric grades [4,5,6,7,8,9,10] while 
//  GateChecker and Workload Balancer use string grades ["G4","G5","G6","G7","G8","G9","G10"]"

const regressionState = createValidState();
const regressionPayload = buildPayload(regressionState);
const regressionDownstream = transformToDownstream(regressionPayload);

// Verify ALL grade arrays are converted
const allGradeArrays = [
  ...regressionDownstream.subjects.map(s => s.grade_levels),
  ...regressionDownstream.capabilities.map(c => c.grades_can_teach),
  ...regressionDownstream.preferences.map(p => p.grades),
];

for (const gradeArray of allGradeArrays) {
  for (const grade of gradeArray) {
    assert.ok(
      typeof grade === 'string' && grade.startsWith('G'),
      `Grade ${grade} should be a canonical string starting with "G"`
    );
    const num = parseInt(grade.substring(1), 10);
    assert.ok(
      !isNaN(num) && num >= 4 && num <= 10,
      `Grade ${grade} should represent a valid numeric grade 4-10`
    );
  }
}
console.log('✓ Regression test: All numeric grades converted to canonical strings');

// Verify teacher name compatibility
for (const teacher of regressionDownstream.teachers) {
  assert.ok('name' in teacher, 'Teacher should have name field');
  assert.ok('teacher_name' in teacher, 'Teacher should have teacher_name field');
  assert.strictEqual(teacher.name, teacher.teacher_name, 'name should equal teacher_name');
}
console.log('✓ Regression test: Teacher name compatibility ensured');

// ============================================================
// Test 12: Integration Test Preparation
// ============================================================
console.log('\n=== Test 12: Integration Test Preparation ===');

// Create a payload that should work with GateChecker and Workload Balancer
const integrationState = createValidState();
const integrationMobiusPayload = buildPayload(integrationState);
const integrationDownstreamPayload = transformToDownstream(integrationMobiusPayload);

// Verify the transformed payload has the expected structure for downstream systems
assert.strictEqual(integrationDownstreamPayload.schema_version, '1.0.0');
assert.ok(integrationDownstreamPayload.school);
assert.ok(integrationDownstreamPayload.policy);
assert.ok(Array.isArray(integrationDownstreamPayload.subjects));
assert.ok(Array.isArray(integrationDownstreamPayload.teachers));
assert.ok(Array.isArray(integrationDownstreamPayload.capabilities));
assert.ok(Array.isArray(integrationDownstreamPayload.preferences));

// Verify all subjects have string grade_levels
for (const subject of integrationDownstreamPayload.subjects) {
  assert.ok(Array.isArray(subject.grade_levels));
  if (subject.grade_levels.length > 0) {
    assert.ok(typeof subject.grade_levels[0] === 'string');
  }
}

// Verify all capabilities have string grades_can_teach
for (const cap of integrationDownstreamPayload.capabilities) {
  assert.ok(Array.isArray(cap.grades_can_teach));
  if (cap.grades_can_teach.length > 0) {
    assert.ok(typeof cap.grades_can_teach[0] === 'string');
  }
}

// Verify all preferences have string grades
for (const pref of integrationDownstreamPayload.preferences) {
  assert.ok(Array.isArray(pref.grades));
  if (pref.grades.length > 0) {
    assert.ok(typeof pref.grades[0] === 'string');
  }
}

// Verify all teachers have both name and teacher_name
for (const teacher of integrationDownstreamPayload.teachers) {
  assert.ok(teacher.name);
  assert.ok(teacher.teacher_name);
  assert.strictEqual(teacher.name, teacher.teacher_name);
}

// Verify optional fields are present
for (const cap of integrationDownstreamPayload.capabilities) {
  assert.ok('confidence' in cap);
  assert.ok('flag_note' in cap);
}

for (const pref of integrationDownstreamPayload.preferences) {
  assert.ok('confidence' in pref);
  assert.ok('flag_note' in pref);
}

console.log('✓ Integration test preparation: Downstream payload structure verified');

// ============================================================
// Test 13: JSON Serialization
// ============================================================
console.log('\n=== Test 13: JSON Serialization ===');

const serializationState = createValidState();
const serializationMobiusPayload = buildPayload(serializationState);
const serializationDownstreamPayload = transformToDownstream(serializationMobiusPayload);

// Verify it can be serialized to JSON
const jsonString = JSON.stringify(serializationDownstreamPayload);
assert.ok(typeof jsonString === 'string', 'Downstream payload should be JSON-serializable');

// Verify it can be deserialized
const deserialized = JSON.parse(jsonString);
assert.deepStrictEqual(deserialized, serializationDownstreamPayload, 'Deserialized payload should match original');
console.log('✓ Downstream payload is JSON-serializable');

// ============================================================
// Summary
// ============================================================
console.log('\n=== All Adapter Tests Passed ===');
console.log('\nTest Coverage:');
console.log('  ✓ Grade conversion utilities');
console.log('  ✓ Basic transformation');
console.log('  ✓ Grade representation transformation (CRITICAL)');
console.log('  ✓ Teacher name field transformation (CRITICAL)');
console.log('  ✓ Missing optional fields');
console.log('  ✓ Field preservation');
console.log('  ✓ Immutability');
console.log('  ✓ Edge cases');
console.log('  ✓ Error cases');
console.log('  ✓ canTransform function');
console.log('  ✓ Regression tests for audit blockers');
console.log('  ✓ Integration test preparation');
console.log('  ✓ JSON serialization');
console.log('\nTotal tests: 13 suites passed');
