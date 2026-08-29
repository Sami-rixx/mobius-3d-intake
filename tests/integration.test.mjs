// ============================================================
// Integration Tests: Adapter with GateChecker and Workload Balancer
// These tests verify that the adapter output is compatible with the actual
// downstream implementations by using their TypeScript source directly.
// ============================================================

import assert from 'node:assert/strict';
import { transformToDownstream } from '../js/adapter.js';
import { buildPayload } from '../js/schema.js';
import { SAMPLE_DATA as GC_SAMPLE_DATA } from '../../gatechecker-v2/src/engine/sampleData.ts';
import { SAMPLE_DATA as WB_SAMPLE_DATA } from '../../workload-balancer/src/engine/sampleData.ts';

console.log('\n=== Integration Tests: Adapter with Downstream Systems ===\n');

// ============================================================
// Test 1: Verify GateChecker sample data structure
// ============================================================
console.log('Test 1: GateChecker Sample Data Structure');

// Verify that GateChecker sample data uses string grades and 'name' field
assert.ok(GC_SAMPLE_DATA.subjects[0].grade_levels[0].startsWith('G'), 
  'GateChecker sample should use string grades');
assert.ok('name' in GC_SAMPLE_DATA.teachers[0], 
  'GateChecker sample should have name field');
assert.ok(!('teacher_name' in GC_SAMPLE_DATA.teachers[0]), 
  'GateChecker sample should NOT have teacher_name field');
console.log('✓ GateChecker uses string grades and name field (confirmed)');

// ============================================================
// Test 2: Verify Workload Balancer sample data structure
// ============================================================
console.log('\nTest 2: Workload Balancer Sample Data Structure');

// Verify that Workload Balancer sample data uses string grades and 'teacher_name' field
assert.ok(WB_SAMPLE_DATA.subjects[0].grade_levels[0].startsWith('G'), 
  'Workload Balancer sample should use string grades');
assert.ok('teacher_name' in WB_SAMPLE_DATA.teachers[0], 
  'Workload Balancer sample should have teacher_name field');
console.log('✓ Workload Balancer uses string grades and teacher_name field (confirmed)');

// ============================================================
// Test 3: Adapter output matches GateChecker expectations
// ============================================================
console.log('\nTest 3: Adapter Output Compatible with GateChecker');

// Create a Möbius payload and transform it
const mobiusState = {
  school: { name: 'Integration Test School', filled_by: 'Test', filled_at: '2026-08-29' },
  policy: {
    generalists_grade_scope: 'explicit_only',
    overload_policy: 'block',
    ambiguous_data_policy: 'use_default_and_warn',
    specialist_scope_lock: true,
  },
  subjects: [
    { subject_code: 'MATH', subject_name: 'Mathematics', grade_levels: [7, 8, 9], periods_per_week: [5, 5, 5], double_lessons_allowed: true },
    { subject_code: 'ENG', subject_name: 'English', grade_levels: [4, 5, 6, 7, 8, 9], periods_per_week: [5, 5, 5, 5, 5, 5], double_lessons_allowed: true },
  ],
  teachers: [
    { teacher_id: 'T1', teacher_name: 'Mr. Otieno', max_periods_week: 24, specialist: false, confidence: 0.95 },
    { teacher_id: 'T2', teacher_name: 'Ms. Wanjiku', max_periods_week: 24, specialist: false, confidence: 0.90 },
  ],
  capabilities: [
    { teacher_id: 'T1', subject_code: 'MATH', grades_can_teach: [7, 8, 9] },
    { teacher_id: 'T1', subject_code: 'ENG', grades_can_teach: [4, 5, 6, 7, 8, 9] },
    { teacher_id: 'T2', subject_code: 'MATH', grades_can_teach: [7, 8, 9] },
  ],
  preferences: [
    { teacher_id: 'T1', subject_code: 'MATH', grades: [7, 8, 9], priority: 1, granularity: 'subject_level' },
    { teacher_id: 'T1', subject_code: 'ENG', grades: [4, 5, 6, 7, 8, 9], priority: 1, granularity: 'subject_level' },
  ],
};

const mobiusPayload = buildPayload(mobiusState);
const downstreamPayload = transformToDownstream(mobiusPayload);

// Verify adapter output has GateChecker-compatible structure
assert.strictEqual(downstreamPayload.schema_version, '1.0.0', 'schema_version should be 1.0.0');
assert.ok(downstreamPayload.school, 'school should be present');
assert.ok(downstreamPayload.policy, 'policy should be present');
assert.ok(Array.isArray(downstreamPayload.subjects), 'subjects should be array');
assert.ok(Array.isArray(downstreamPayload.teachers), 'teachers should be array');
assert.ok(Array.isArray(downstreamPayload.capabilities), 'capabilities should be array');
assert.ok(Array.isArray(downstreamPayload.preferences), 'preferences should be array');

// Verify all grade arrays are strings
for (const subject of downstreamPayload.subjects) {
  for (const grade of subject.grade_levels) {
    assert.ok(typeof grade === 'string' && grade.startsWith('G'), 
      `Subject grade ${grade} should be canonical string`);
  }
}

for (const cap of downstreamPayload.capabilities) {
  for (const grade of cap.grades_can_teach) {
    assert.ok(typeof grade === 'string' && grade.startsWith('G'), 
      `Capability grade ${grade} should be canonical string`);
  }
}

for (const pref of downstreamPayload.preferences) {
  for (const grade of pref.grades) {
    assert.ok(typeof grade === 'string' && grade.startsWith('G'), 
      `Preference grade ${grade} should be canonical string`);
  }
}

// Verify all teachers have 'name' field (for GateChecker)
for (const teacher of downstreamPayload.teachers) {
  assert.ok('name' in teacher, 'Teacher should have name field');
  assert.ok('teacher_name' in teacher, 'Teacher should have teacher_name field');
  assert.strictEqual(teacher.name, teacher.teacher_name, 'name should equal teacher_name');
}

// Verify optional fields are present
for (const cap of downstreamPayload.capabilities) {
  assert.ok('confidence' in cap, 'Capability should have confidence field');
  assert.ok('flag_note' in cap, 'Capability should have flag_note field');
}

for (const pref of downstreamPayload.preferences) {
  assert.ok('confidence' in pref, 'Preference should have confidence field');
  assert.ok('flag_note' in pref, 'Preference should have flag_note field');
}

console.log('✓ Adapter output has GateChecker-compatible structure');

// ============================================================
// Test 4: Adapter output matches Workload Balancer expectations
// ============================================================
console.log('\nTest 4: Adapter Output Compatible with Workload Balancer');

// The same downstream payload should also be compatible with Workload Balancer
// Workload Balancer expects teacher_name, and the adapter preserves it
for (const teacher of downstreamPayload.teachers) {
  assert.ok('teacher_name' in teacher, 'Teacher should have teacher_name field for WB');
}

// Workload Balancer also uses string grades, which we've already verified
console.log('✓ Adapter output has Workload Balancer-compatible structure');

// ============================================================
// Test 5: Contract alignment verification
// ============================================================
console.log('\nTest 5: Contract Alignment Verification');

// Verify that the adapter addresses the exact issues from the audit:
// 1. Grade representation: Möbius numeric → downstream string
const mobiusSubject = mobiusPayload.subjects[0];
const downstreamSubject = downstreamPayload.subjects[0];
assert.ok(
  Array.isArray(mobiusSubject.grade_levels) && 
  mobiusSubject.grade_levels.every(g => typeof g === 'number'),
  'Möbius should have numeric grades'
);
assert.ok(
  Array.isArray(downstreamSubject.grade_levels) && 
  downstreamSubject.grade_levels.every(g => typeof g === 'string' && g.startsWith('G')),
  'Downstream should have string grades'
);

// 2. Teacher name: Möbius teacher_name → downstream name + teacher_name
const mobiusTeacher = mobiusPayload.teachers[0];
const downstreamTeacher = downstreamPayload.teachers[0];
assert.ok('teacher_name' in mobiusTeacher, 'Möbius should have teacher_name');
assert.ok(!('name' in mobiusTeacher), 'Möbius should NOT have name');
assert.ok('name' in downstreamTeacher, 'Downstream should have name');
assert.ok('teacher_name' in downstreamTeacher, 'Downstream should have teacher_name');

// 3. Missing optional fields
const mobiusCap = mobiusPayload.capabilities[0];
const downstreamCap = downstreamPayload.capabilities[0];
assert.ok(!('confidence' in mobiusCap), 'Möbius capability should NOT have confidence');
assert.ok(!('flag_note' in mobiusCap), 'Möbius capability should NOT have flag_note');
assert.ok('confidence' in downstreamCap, 'Downstream capability should have confidence');
assert.ok('flag_note' in downstreamCap, 'Downstream capability should have flag_note');

const mobiusPref = mobiusPayload.preferences[0];
const downstreamPref = downstreamPayload.preferences[0];
assert.ok(!('confidence' in mobiusPref), 'Möbius preference should NOT have confidence');
assert.ok(!('flag_note' in mobiusPref), 'Möbius preference should NOT have flag_note');
assert.ok('confidence' in downstreamPref, 'Downstream preference should have confidence');
assert.ok('flag_note' in downstreamPref, 'Downstream preference should have flag_note');

console.log('✓ All contract incompatibilities addressed');

// ============================================================
// Test 6: Type compatibility check
// ============================================================
console.log('\nTest 6: Type Compatibility Check');

// Verify that the transformed payload can be stringified and parsed
const jsonString = JSON.stringify(downstreamPayload);
const reparsed = JSON.parse(jsonString);
assert.deepStrictEqual(reparsed, downstreamPayload, 'Payload should survive JSON round-trip');

// Verify that all values are JSON-serializable (no functions, circular refs, etc.)
function isSerializable(obj) {
  try {
    JSON.stringify(obj);
    return true;
  } catch (e) {
    return false;
  }
}

assert.ok(isSerializable(downstreamPayload), 'Downstream payload should be JSON-serializable');
console.log('✓ Downstream payload is JSON-serializable');

// ============================================================
// Summary
// ============================================================
console.log('\n=== All Integration Tests Passed ===');
console.log('\nIntegration Test Coverage:');
console.log('  ✓ GateChecker sample data structure verified');
console.log('  ✓ Workload Balancer sample data structure verified');
console.log('  ✓ Adapter output compatible with GateChecker');
console.log('  ✓ Adapter output compatible with Workload Balancer');
console.log('  ✓ Contract alignment verified');
console.log('  ✓ Type compatibility verified');
console.log('\nTotal integration tests: 6 passed');
