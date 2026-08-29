# Integration Architecture Document

**Phase:** 1 - Canonical Payload Adapter  
**Document Version:** 1.0.0  
**Last Updated:** 2026-08-29  

---

## 1. Overview

This document describes the integration architecture for the Möbius Muse scheduling pipeline, specifically the **Phase 1 canonical payload adapter/translation layer** that establishes an explicit, deterministic boundary between:
- **Source:** Möbius 3D Intake canonical payload output
- **Targets:** GateChecker v2 and Workload Balancer input contracts

The adapter addresses the contract incompatibilities identified in the integration-contract-audit-report.md without modifying the core scheduling algorithms, validation semantics, or UI behavior of any repository.

---

## 2. Architecture Decision

### 2.1 Adapter Location

**Decision:** The adapter is implemented in the **mobius-3d-intake** repository as a standalone ES module (`js/adapter.js`).

**Rationale:**
1. **Proximity to source:** Möbius 3D Intake is the single source of truth for payload construction
2. **Decoupling:** Keeping the transformation close to the source maintains architectural clarity
3. **No fourth repository:** A dedicated integration module is not warranted at this phase
4. **Repository structure:** The existing `js/` directory structure naturally accommodates utility modules
5. **Single responsibility:** The adapter has one clear purpose: transform Möbius output to downstream format

### 2.2 Design Principles

- **Deterministic:** Same input always produces same output
- **Side-effect free:** No mutations to source payload or global state
- **Explicit:** Transformation rules are clearly documented and testable
- **Fail-fast:** Clear error messages when transformation cannot be performed
- **Decoupled:** Adapter does not embed downstream-specific logic in intake code
- **Visible boundary:** The integration boundary is explicit in the codebase

---

## 3. Contracts

### 3.1 Source Contract (Möbius 3D Intake Output)

The adapter accepts the exact payload produced by `buildPayload()` in `js/schema.js`:

```javascript
{
  "schema_version": "1.0.0",
  "school": {
    "name": string,              // Non-blank
    "filled_by": string,         // Non-blank
    "filled_at": string          // YYYY-MM-DD format
  },
  "policy": {
    "generalists_grade_scope": string,    // "explicit_only" | "unrestricted"
    "overload_policy": string,            // "block" | "allow_overload"
    "ambiguous_data_policy": string,      // "use_default_and_warn" | "block_until_resolved"
    "specialist_scope_lock": boolean      // default: true
  },
  "subjects": [
    {
      "subject_code": string,      // Non-blank, uppercase
      "subject_name": string,      // Non-blank
      "grade_levels": number[],    // Numeric grades [4, 5, 6, 7, 8, 9, 10]
      "periods_per_week": number[],// Aligned with grade_levels, integers 1-20
      "double_lessons_allowed": boolean // default: true
    }
  ],
  "teachers": [
    {
      "teacher_id": string,        // Non-blank, format: "T-XXX"
      "teacher_name": string,      // Non-blank
      "max_periods_week": number,  // Integer 0-100
      "specialist": boolean,       // default: false
      "confidence": number,        // 0.0-1.0, default: 1.0
      "flag_note": string | null   // default: null
    }
  ],
  "capabilities": [
    {
      "teacher_id": string,        // Non-blank
      "subject_code": string,      // Non-blank
      "grades_can_teach": number[] // Numeric grades [4, 5, 6, 7, 8, 9, 10]
    }
  ],
  "preferences": [
    {
      "teacher_id": string,        // Non-blank
      "subject_code": string,      // Non-blank
      "grades": number[],          // Numeric grades [4, 5, 6, 7, 8, 9, 10]
      "priority": number,          // Integer 1-3
      "granularity": string        // "subject_level"
    }
  ]
}
```

### 3.2 Target Contract (GateChecker v2 & Workload Balancer Input)

The adapter produces a payload compatible with both downstream systems:

```javascript
{
  "schema_version": "1.0.0",
  "school": {
    "name": string,
    "filled_by": string,
    "filled_at": string
  },
  "policy": {
    "generalists_grade_scope": string,
    "overload_policy": string,
    "ambiguous_data_policy": string,
    "specialist_scope_lock": boolean
  },
  "subjects": [
    {
      "subject_code": string,
      "subject_name": string,
      "grade_levels": string[],    // Canonical grade strings ["G4", "G5", ...]
      "periods_per_week": number[],
      "double_lessons_allowed": boolean // Preserved from source
    }
  ],
  "teachers": [
    {
      "teacher_id": string,
      "name": string,               // ADDED: Copy of teacher_name for GC compatibility
      "teacher_name": string,      // PRESERVED: For WB compatibility
      "max_periods_week": number,
      "specialist": boolean,
      "confidence": number,        // Ensured present (default: 1.0)
      "flag_note": string | null   // Ensured present (default: null)
    }
  ],
  "capabilities": [
    {
      "teacher_id": string,
      "subject_code": string,
      "grades_can_teach": string[], // Canonical grade strings
      "confidence": number,         // ADDED: default 1.0 if missing
      "flag_note": string | null    // ADDED: default null if missing
    }
  ],
  "preferences": [
    {
      "teacher_id": string,
      "subject_code": string,
      "grades": string[],           // Canonical grade strings
      "priority": number,
      "granularity": string,       // Preserved from source
      "confidence": number,        // ADDED: default 1.0 if missing
      "flag_note": string | null    // ADDED: default null if missing
    }
  ]
}
```

---

## 4. Transformations Performed

### 4.1 Grade Representation Normalization (CRITICAL)

**Problem:** Möbius uses numeric grades `[4, 5, 6, 7, 8, 9, 10]` while GateChecker and Workload Balancer use canonical string grades `["G4", "G5", "G6", "G7", "G8", "G9", "G10"]`.

**Solution:** All numeric grade arrays are converted to canonical string format:
- `subjects[].grade_levels: number[]` → `string[]`
- `capabilities[].grades_can_teach: number[]` → `string[]`
- `preferences[].grades: number[]` → `string[]`

**Format:** `"G" + grade` (e.g., `4` → `"G4"`)

**Validation:** Each numeric grade must be in `SCHOOL_GRADE_RANGE` (`[4, 5, 6, 7, 8, 9, 10]`)

### 4.2 Teacher Name Field Compatibility (CRITICAL)

**Problem:** 
- Möbius produces: `teacher_name`
- GateChecker expects: `name` (in TypeScript interface and sample data)
- Workload Balancer expects: `teacher_name`

**Solution:** Add a `name` field as a copy of `teacher_name`, preserving the original `teacher_name` for Workload Balancer compatibility.

**Result:** Each teacher object has both `name` and `teacher_name` fields with identical values.

### 4.3 Missing Optional Fields (COMPATIBILITY IMPROVEMENT)

**Problem:** Möbius does not produce `confidence` and `flag_note` fields for capabilities and preferences.

**Solution:** Add these fields with safe defaults:
- `capabilities[].confidence`: default `1.0`
- `capabilities[].flag_note`: default `null`
- `preferences[].confidence`: default `1.0`
- `preferences[].flag_note`: default `null`

**Rationale:** Both GateChecker and Workload Balancer use these fields in their processing (confidence propagation, flag aggregation) and provide these defaults internally. Adding them explicitly makes the contract complete.

### 4.4 Field Preservation

The following fields are **preserved unchanged** from the source:
- `schema_version`
- All `school` fields
- All `policy` fields
- `subjects[].subject_code`, `subjects[].subject_name`, `subjects[].periods_per_week`, `subjects[].double_lessons_allowed`
- `teachers[].teacher_id`, `teachers[].max_periods_week`, `teachers[].specialist`, `teachers[].confidence`, `teachers[].flag_note`
- `capabilities[].teacher_id`, `capabilities[].subject_code`
- `preferences[].teacher_id`, `preferences[].subject_code`, `preferences[].priority`, `preferences[].granularity`

---

## 5. Transformations NOT Performed

### 5.1 Deliberate Omissions

The adapter **does not** perform the following transformations:

1. **Policy field removal:** `policy.generalists_grade_scope` and `policy.ambiguous_data_policy` are preserved even though Workload Balancer does not use them. This maintains contract completeness.

2. **Extra field removal:** `subjects[].double_lessons_allowed` and `preferences[].granularity` are preserved even though they are not declared in downstream TypeScript interfaces. They are harmless (JavaScript ignores extra fields) and may have future use.

3. **Type coercion:** The adapter validates types strictly and throws errors for invalid types rather than silently coercing them.

4. **Reference validation:** The adapter does not validate that teacher_id/subject_code references exist in their respective arrays. This is the responsibility of GateChecker's integrity validation (I011).

5. **Alignment validation:** While the adapter validates that `grade_levels` and `periods_per_week` have the same length, it does not validate that capability/preference grades are subsets of subject grades. This is GateChecker's responsibility (I013).

### 5.2 Rationale

These omissions follow the **single responsibility principle**: the adapter's job is to transform the data format, not to replicate downstream validation logic. Each system should perform its own validation according to its contract.

---

## 6. Error Behavior

The adapter follows a **fail-fast** approach with clear, actionable error messages:

### 6.1 Error Types

| Error Condition | Error Message Format | Example |
|----------------|---------------------|---------|
| Missing required field | `Missing required field: {fieldPath}` | `Missing required field: schema_version` |
| Invalid type | `Invalid type for field {fieldPath}: expected {expected}, got {actual}` | `Invalid type for field teachers[0].max_periods_week: expected integer, got string` |
| Out of range | `Field {fieldPath} out of range: {value} must be between {min} and {max}` | `Field teachers[0].max_periods_week out of range: 150 must be between 0 and 100` |
| Invalid grade | `Invalid numeric grade: {grade}. Must be integer in [4, 5, 6, 7, 8, 9, 10]` | `Invalid numeric grade: 11. Must be integer in [4, 5, 6, 7, 8, 9, 10]` |
| Array length mismatch | `Array length mismatch at {path}: {field1} has X elements, {field2} has Y elements` | `Array length mismatch at subjects[0]: grade_levels has 3 elements, periods_per_week has 2 elements` |
| Invalid input | `Adapter input must be a non-null object (Mobius canonical payload)` | (self-explanatory) |

### 6.2 Error Handling Strategy

- All errors are `Error` instances with descriptive messages
- Errors identify the specific field and transformation that failed
- Errors are thrown immediately upon detection (fail-fast)
- No partial transformations are returned on error
- The source payload is never mutated

---

## 7. API Reference

### 7.1 Main Transformation Function

```javascript
import { transformToDownstream } from './js/adapter.js';

const downstreamPayload = transformToDownstream(mobiusPayload);
```

**Parameters:**
- `mobiusPayload` (Object): The Möbius canonical payload

**Returns:** (Object): The downstream-compatible payload

**Throws:** (Error): If transformation cannot be performed

### 7.2 Validation Function

```javascript
import { canTransform } from './js/adapter.js';

if (canTransform(mobiusPayload)) {
  const downstreamPayload = transformToDownstream(mobiusPayload);
}
```

**Parameters:**
- `mobiusPayload` (Object): The payload to check

**Returns:** (boolean): True if the payload can be transformed

### 7.3 Grade Conversion Utilities

```javascript
import { gradeToCanonical, gradeFromCanonical } from './js/adapter.js';

// Convert numeric grade to canonical string
const gradeStr = gradeToCanonical(4); // "G4"

// Convert canonical string back to numeric grade
const gradeNum = gradeFromCanonical("G4"); // 4
```

**Parameters:**
- `gradeToCanonical`: (number) numeric grade (4-10)
- `gradeFromCanonical`: (string) canonical grade string (e.g., "G4")

**Returns:** 
- `gradeToCanonical`: (string) canonical grade string
- `gradeFromCanonical`: (number) numeric grade

**Throws:** (Error): If input is invalid

---

## 8. Testing Strategy

### 8.1 Unit Tests

The adapter includes comprehensive unit tests covering:

1. **Grade conversion:** Numeric to string grade transformation
2. **Field preservation:** All non-transformed fields remain unchanged
3. **Multiple subjects/grades:** Complex payloads with multiple subjects and grade levels
4. **Aligned arrays:** `periods_per_week` alignment with `grade_levels`
5. **Teacher references:** Teacher name field addition
6. **Capabilities/preferences:** Optional field defaults
7. **Immutability:** Source payload is not mutated
8. **Edge cases:** Empty arrays, boundary values, missing optional fields
9. **Error cases:** Invalid grades, wrong types, missing fields

### 8.2 Integration Tests

Integration-level tests verify that adapter output works with actual downstream implementations:

1. **GateChecker validation:** Adapter output passes GateChecker's `runValidation()` without parse errors
2. **Workload Balancer processing:** Adapter output passes Workload Balancer's `runBalancer()` without parse errors
3. **End-to-end flow:** Möbius payload → Adapter → GateChecker → Workload Balancer

### 8.3 Regression Tests

Tests specifically target the compatibility blockers identified in the audit:

1. **Grade representation blocker:** Möbius numeric grades → downstream string grades
2. **Teacher name blocker:** Möbius `teacher_name` → downstream `name` + `teacher_name`

---

## 9. File Structure

```
mobius-3d-intake/
├── js/
│   ├── adapter.js          # Main adapter implementation
│   └── ...                 # Existing files unchanged
├── tests/
│   └── adapter.test.mjs    # Adapter test suite
├── INTEGRATION-ARCHITECTURE.md  # This document
└── ...                     # Existing files unchanged
```

---

## 10. Pipeline Integration

### 10.1 Current Flow (Without Adapter)

```
Möbius 3D Intake → buildPayload() → JSON Payload (numeric grades, teacher_name)
                          ↓
                    User copies/pastes manually
                          ↓
                    GateChecker → FAILS (type mismatch)
                    Workload Balancer → FAILS (type mismatch)
```

### 10.2 New Flow (With Adapter)

```
Möbius 3D Intake → buildPayload() → JSON Payload (numeric grades, teacher_name)
                          ↓
                    transformToDownstream() → Downstream Payload
                          ↓
                    User copies/pastes adapted payload
                          ↓
                    GateChecker → VALIDATION PASSES
                    Workload Balancer → ASSIGNMENT PASSES
```

### 10.3 Future Flow (Automated Integration)

```
Möbius 3D Intake → buildPayload() → transformToDownstream() → HTTP POST
                          ↓
                    GateChecker API (when available)
                          ↓
                    GateChecker → runValidation() → GateReport
                          ↓
                    Workload Balancer API (when available)
                          ↓
                    Workload Balancer → runBalancer() → BalancerReport
```

---

## 11. Known Limitations

1. **No runtime type validation in downstream systems:** GateChecker and Workload Balancer accept any JSON that parses; type errors are caught during property access. The adapter's validation provides early detection.

2. **No reference integrity validation:** The adapter does not validate that capability/preference references match existing teachers/subjects. This is GateChecker's responsibility (I011 rule).

3. **No grade applicability validation:** The adapter does not validate that capability/preference grades are valid for the referenced subject. This is GateChecker's responsibility (I013 rule).

4. **Grade range limitation:** The adapter only supports the Möbius school grade range [4, 5, 6, 7, 8, 9, 10]. Future grade expansions would require adapter updates.

5. **No schema version negotiation:** The adapter expects and produces schema_version "1.0.0". Future schema versions would require explicit handling.

---

## 12. Future Enhancements

### 12.1 Phase 2 (Recommended)

1. **Add missing optional fields to Möbius:** Update `buildPayload()` in `schema.js` to produce `capabilities.confidence`, `capabilities.flag_note`, `preferences.confidence`, `preferences.flag_note`
2. **Remove unused fields:** Optionally remove `subjects.double_lessons_allowed` and `preferences.granularity` from Möbius payload
3. **Integration tests:** Add tests that exercise actual GateChecker and Workload Balancer engines

### 12.2 Phase 3 (Optional)

1. **HTTP client integration:** Add adapter integration with actual HTTP endpoints when available
2. **Streaming/large payload support:** Optimize for very large school datasets
3. **Performance optimization:** Benchmark and optimize for production use

---

## 13. References

- **Audit Report:** `integration-contract-audit-report.md` (authoritative basis)
- **Möbius Schema:** `js/schema.js` (source contract)
- **GateChecker Types:** `gatechecker-v2/src/types/gatechecker.ts` (target contract)
- **Workload Balancer Types:** `workload-balancer/src/types/balancer.ts` (target contract)

---

*Document maintained as part of Phase 1 Integration Architecture implementation.*
