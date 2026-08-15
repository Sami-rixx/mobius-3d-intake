# 01 — Canonical Schema & Payload Ledger

**Audit scope:** read-only reconstruction of the payload emitted by the current browser application.  
**Evidence inspected:** `js/schema.js`, `js/state.js`, `js/config.js`, `js/step1-school-policy.js`, `js/step2-subjects.js`, `js/step3-teachers.js`, `js/output.js`, `js/main.js`, `README.md`, and `PROGRESS.md`.  
**Boundary:** This report establishes the current implementation contract only. GateChecker and Workload Balancer source, schemas, API definitions, fixtures, and endpoints are not in this repository; no downstream requirement is asserted as fact.

## Status vocabulary

- **OBSERVED FACT** — directly evidenced by the current repository.
- **INFERENCE** — conclusion drawn from control/data flow, not a statement made by a downstream system.
- **UNKNOWN** — cannot be established from the inspected repository.

## 1. Actual construction and output path

### Authoritative current path

1. `state` is initialized in `js/state.js` with school and policy objects and four empty arrays. `getState()` makes a JSON deep copy; UI modules generally mutate another copy and replace top-level state through `updateState()`.
2. Step 1 writes school/policy input values into state. Step 2 seeds subjects on initialization when `state.subjects` is empty and then writes subject edits. Step 3 creates teachers, capabilities, and preferences.
3. On the final **Finish** action, `main.js:handleFinalSubmit()` calls **`buildPayload(getState())`** and then `validatePayload(payload)` (`js/main.js:112-123`).
4. The only payload-construction function is **`buildPayload(state)`** in `js/schema.js:8-55`. It JSON-clones its argument again, constructs a new object with all top-level fields, and discards every state property not explicitly copied.
5. If validation succeeds, the active path is the local `main.js:showReviewScreen(payload)` and its local download/copy functions (`js/main.js:152-219`). The final review previews and exports `JSON.stringify(payload, null, 2)`.

**OBSERVED FACT:** `index.html` loads `js/output.js`, but `main.js` does not import any of its exports. The active finalization path uses the duplicate local functions in `main.js`; `output.js:showReviewScreen()` is not invoked from application boot/finish flow.

**OBSERVED FACT:** both GateChecker endpoint constants are `null` (`js/main.js:223`, `js/output.js:4`). The active review button is hard-disabled in `main.js`; no HTTP payload is sent by the current UI.

**INFERENCE:** The canonical artifact available to users today is the JSON displayed, copied, or downloaded from `main.js`, not a delivered GateChecker request.

## 2. State-to-payload map and normalization

| State branch / UI area | State initialization | UI mutation | `buildPayload` transformation |
|---|---|---|---|
| `school` | `{name:"", filled_by:"", filled_at: UTC YYYY-MM-DD}` | Three input events replace string values. | Emits all three keys; `name`/`filled_by` use `|| ""`; falsy `filled_at` is replaced with the current UTC date. |
| `policy` | Four defaults: `explicit_only`, `block`, `use_default_and_warn`, `true` | Toggle buttons replace exact enumerations/boolean. | Emits all keys; the three string fields fall back on falsy values; `specialist_scope_lock` is `false` only when state is exactly boolean `false`, otherwise `true`. |
| `subjects` | `[]` | Step 2 first seeds six records. Inputs update code/name and numeric periods; zero removes the corresponding grade/period pair. | Emits an array (empty if state is falsy), mapping only five listed subject properties. Falsy code/name become `""`; missing/falsy arrays become `[]`; only exact `false` preserves disabled doubles. |
| `teachers` | `[]` | Add action appends a generated ID and defaults; inputs update name/load/role/note. | Emits an array mapping six listed teacher properties. Falsy ID/name become `""`; falsy load becomes `0`; truthy `specialist` is retained and falsy becomes `false`; only `undefined` confidence becomes `1.0`; falsy note becomes `null`. |
| `capabilities` | `[]` | Checking a grade creates/fetches record keyed by teacher ID + subject code; unchecking removes that grade only. | Emits only `teacher_id`, `subject_code`, `grades_can_teach`; falsy strings become `""`, falsy grades becomes `[]`. |
| `preferences` | `[]` | Changing a priority creates/fetches record keyed by teacher ID + subject code. Its grade list is set to the current subject grade list. | Emits only `teacher_id`, `subject_code`, `grades`, `priority`, `granularity`; falsy priority becomes `2`; falsy granularity becomes `subject_level`. |

### Normalization rules actually implemented

- **No string normalization:** no trim, case-folding, uppercasing, whitespace collapse, ID canonicalization, or subject-code canonicalization occurs. Validation uses `.trim()` only to decide whether certain strings are blank.
- **Numbers:** Step 2 and Step 3 use `parseInt(value) || 0`; therefore a typed decimal is truncated, blank/non-numeric input becomes `0`, and zero in a subject-period input removes a grade/period pair. No builder coercion occurs for arbitrary state.
- **Booleans:** UI controls write booleans. Builder defaults `specialist`, `double_lessons_allowed`, and `specialist_scope_lock` using truthiness/exact-false logic described above rather than type coercion.
- **Arrays:** Builder preserves ordering and values exactly for truthy arrays. It does not sort, deduplicate, range-check, or reconcile them.
- **Omission:** all payload top-level keys and all object keys listed below are always emitted by `buildPayload`; a missing/falsy value is usually serialized as an empty string, empty array, numeric `0`, boolean default, or `null`. Grade entries are omitted only by Step 2's zero-period event handler, not by `buildPayload` itself.

## 3. Field-by-field ledger

“Required?” below means **required by `validatePayload` after construction**, not necessarily required by the visible step. “Confidence” is confidence in the implementation finding, not teacher confidence.

| Field path | Type in emitted payload | Required? | Default / empty representation | UI source and transformation | Validation | Example | Downstream significance | Evidence | Confidence |
|---|---|---|---|---|---|---|---|---|---|
| `$` | object | Yes in practice | Always constructed with 8 keys | `buildPayload(getState())`; unknown state keys discarded | `validatePayload` assumes this shape | object below | Complete interchange envelope | `schema.js:8-55`; `main.js:112-115` | High |
| `schema_version` | string literal | Yes | Always `"1.0.0"` | No UI/state source | Must equal `"1.0.0"` | `"1.0.0"` | Version discriminator; consumer semantics UNKNOWN | `schema.js:13-14,66-71` | High |
| `school` | object | Yes | Always emitted | Step 1 school section | Presence checked, then children | `{...}` | School metadata; consumer meaning UNKNOWN | `schema.js:15-19,73-86` | High |
| `school.name` | normally string | Yes | `""` for any falsy state value | `#school-name`, assigned verbatim on `input` | must be truthy after trim; no type check before `.trim()` | `"Acacia Academy"` | Used in download filename and school identity; uniqueness UNKNOWN | `step1...:9-12,render/setup`; `schema.js:16,77-79`; `main.js:201` | High |
| `school.filled_by` | normally string | Yes final / **not required in UI** | `""` for falsy | `#filled-by`, assigned verbatim | must be truthy after trim | `"M. Otieno"` | Provenance metadata; consumer rule UNKNOWN | `step1...`; `schema.js:17,80-82` | High |
| `school.filled_at` | normally `YYYY-MM-DD` string | Nonempty required; format not validated | state initializes to current **UTC** date; builder replaces any falsy value with current UTC date | `#filled-at` native date input writes its string | only truthiness checked | `"2026-08-11"` | Date/provenance; timezone and accepted format UNKNOWN | `state.js:3-7,31-33`; `schema.js:18,83-85` | High |
| `policy` | object | Yes | Always emitted | Step 1 policy toggles | presence and children | `{...}` | Allocation behavior claimed by docs; downstream semantics UNKNOWN | `schema.js:20-25,88-110` | High |
| `policy.generalists_grade_scope` | string enum | Yes | falsy → `"explicit_only"` | Q1 yes → `unrestricted`; no → `explicit_only` | only `explicit_only`/`unrestricted` | `"explicit_only"` | Policy signal; actual consumer handling UNKNOWN | `step1...:13-14`; `schema.js:21,92-95` | High |
| `policy.overload_policy` | string enum | Yes | falsy → `"block"` | Q2 stop → `block`; go → `allow_overload` | only `block`/`allow_overload` | `"block"` | Capacity behavior; consumer handling UNKNOWN | `step1...:15-16`; `schema.js:22,97-100`; `PROGRESS.md:24-29` | High implementation / low external |
| `policy.ambiguous_data_policy` | string enum | Yes | falsy → `"use_default_and_warn"` | Q3 default/block toggle | only stated two values | `"use_default_and_warn"` | Ambiguity handling; consumer handling UNKNOWN | `step1...:17-18`; `schema.js:23,102-105` | High |
| `policy.specialist_scope_lock` | boolean on UI path | Yes | exact state `false` → false; **all other values** → true | Q4 yes → true; no → false | `typeof === "boolean"` | `true` | Specialist constraint; consumer meaning UNKNOWN | `step1...:19-20`; `schema.js:24,107-109`; `PROGRESS.md:27` | High |
| `subjects` | array | Array presence required; may be empty | `[]` when state is falsy; empty passes final validator | Step 2 seeds on initialization if empty | only array check plus per-element checks | six seeded/edited records | Demand model; required cardinality UNKNOWN | `state.js:14`; `step2...:init`; `schema.js:26,112-168` | High |
| `subjects[]` | object | If present, fields as below | All five keys always emitted | Seed, custom Add Subject, and edits | Per-element validation | `{subject_code:"ENG",...}` | A subject is referenced by exact `subject_code` string | `schema.js:26-32,116-160` | High |
| `subjects[].subject_code` | normally string | Yes per present subject | falsy → `""` | Seed codes are readonly; custom code is free text and verbatim | nonblank after trim; duplicate exact strings rejected | `"ENG"` | Foreign-key target for capability/preference; casing/spacing significant | `step2...:SEED_SUBJECTS`, input handler/validation; `schema.js:27,117-119,162-167` | High |
| `subjects[].subject_name` | normally string | Yes per subject | falsy → `""` | Editable text, verbatim | nonblank after trim | `"English"` | Display metadata; consumer meaning UNKNOWN | `step2...`; `schema.js:28,121-123` | High |
| `subjects[].grade_levels` | array of numbers on UI path | Array required; may be empty | missing/falsy → `[]` | Seed/config arrays; period input adds/removes numeric grade | each value must be `number`; aligned length required | `[4,5,6]` | Positional pairing with periods; applicable grades used by teacher UI | `config.js:6-20`; `step2...:getApplicableGrades/input`; `schema.js:29,125-154` | High |
| `subjects[].periods_per_week` | array of numbers on UI path | Array required; may be empty | missing/falsy → `[]` | Seeds or `parseInt(input) || 0`; zero removes grade/period | each value must be `number`; same length; exact zero rejected | `[5,5,5]` | Positional weekly load paired with grade at same index | `step2...:SEED_SUBJECTS/input`; `schema.js:30,125-154` | High |
| `subjects[].double_lessons_allowed` | boolean on UI path | Yes | exact state false → false; all other values → true | checkbox writes `checked` boolean | must be boolean | `true` | Timetable constraint; consumer meaning UNKNOWN | `step2...`; `schema.js:31,157-159` | High |
| `teachers` | array | Array presence required; may be empty | `[]` when falsy; empty passes final validator | Step 3 add/delete | only array check plus per-element checks | `[ {...} ]` | Capacity roster; required cardinality UNKNOWN | `state.js:15`; `step3...`; `schema.js:33,170-211` | High |
| `teachers[].teacher_id` | string on UI path | Yes per teacher | falsy → `""` | Add teacher calls `generateTeacherId()`; field readonly | nonblank after trim; duplicate exact strings rejected | `"T-001"` | Foreign-key target in capabilities/preferences | `step3...:generateTeacherId/addTeacher`; `schema.js:34,175-177,205-210` | High |
| `teachers[].teacher_name` | normally string | Yes per teacher | falsy → `""` | `#teacher-name-*`, verbatim | nonblank after trim | `"Amina Njeri"` | Human identity; consumer rule UNKNOWN | `step3...`; `schema.js:35,179-186` | High |
| `teachers[].max_periods_week` | number on UI path | Must be number; `0` accepted | falsy → `0` | number input `parseInt(value) || 0` | only `typeof number`; no positivity/range check in final schema | `30` | Capacity quantity; units/valid range UNKNOWN | `step3...`; `schema.js:36,188-190` | High |
| `teachers[].specialist` | boolean on UI path | Yes | falsy → false | Generalist/specialist toggle writes boolean | must be boolean | `false` | Scope behavior may relate to policy; relationship unvalidated | `step3...`; `schema.js:37,192-194` | High |
| `teachers[].confidence` | number | Must be number | `1.0` only when state property is `undefined` | No UI field; add action sets `1.0` | only `typeof number`; no range | `1.0` | Provenance/quality semantics UNKNOWN | `step3...:addTeacher`; `schema.js:38,196-198`; `PROGRESS.md:20,28` | High |
| `teachers[].flag_note` | string or null on UI path | Optional | falsy → `null` (including empty string, `0`, false) | textarea assigns `value || null` | string or null | `null` | Free-text exception; semantic use UNKNOWN | `step3...`; `schema.js:39,200-202` | High |
| `capabilities` | array | Array presence required; may be empty | missing/falsy → `[]`; empty passes | Grade checkbox events | only per-element shape | `[{...}]` | Assignment eligibility relation | `schema.js:41-45,213-230` | High |
| `capabilities[].teacher_id` | normally string | Yes per record | falsy → `""` | Copied from selected teacher’s ID at event time | nonblank only; **no foreign-key check** | `"T-001"` | Intended reference to `teachers[].teacher_id` | `step3...:grade handler`; `schema.js:42,218-220` | High |
| `capabilities[].subject_code` | normally string | Yes per record | falsy → `""` | From rendered subject code at event time | nonblank only; **no subject foreign-key check** | `"ENG"` | Intended reference to `subjects[].subject_code` | `step3...:grade handler`; `schema.js:43,222-224` | High |
| `capabilities[].grades_can_teach` | array of numbers on UI path | Array required; may be empty | missing/falsy → `[]` | selected checkbox grades; unchecking final grade leaves empty record | only array check; no element type/range/applicability/nonempty/duplicate validation | `[4,5]` | Eligibility grade subset is not enforced | `step3...:grade handler`; `schema.js:44,226-228` | High |
| `preferences` | array | Array presence required; may be empty | missing/falsy → `[]`; empty passes | Priority radio change events | only per-element shape | `[{...}]` | Assignment preference relation | `schema.js:46-52,232-256` | High |
| `preferences[].teacher_id` | normally string | Yes per record | falsy → `""` | Copied from selected teacher’s ID at event time | nonblank only; no foreign key | `"T-001"` | Intended teacher reference | `step3...:priority handler`; `schema.js:47,237-239` | High |
| `preferences[].subject_code` | normally string | Yes per record | falsy → `""` | Rendered subject code at event time | nonblank only; no foreign key | `"ENG"` | Intended subject reference | `step3...:priority handler`; `schema.js:48,241-243` | High |
| `preferences[].grades` | array of numbers on UI path | Array required; may be empty | missing/falsy → `[]` | Set to current `subject.grade_levels` when priority changes | only array check; no type/range/applicability/nonempty/duplicate validation | `[4,5,6]` | Snapshot, not a live derived field after subject edits | `step3...:priority handler`; `schema.js:49,245-247` | High |
| `preferences[].priority` | number integer on UI path | Yes | falsy → `2` | radio `1`, `2`, or `3` parsed with `parseInt` | only 1, 2, 3 | `2` | Preference ranking; semantics UNKNOWN | `config.js:22-34`; `step3...`; `schema.js:50,249-251` | High |
| `preferences[].granularity` | string literal on UI path | Yes | falsy → `"subject_level"` | No direct UI; creation sets literal | must equal literal | `"subject_level"` | Repository calls this v1 subject-level preference; consumer acceptance UNKNOWN | `step3...`; `schema.js:51,253-255`; `PROGRESS.md:18,32` | High |

## 4. Implemented seeds, bands, and special exclusion behavior

**OBSERVED FACT:** `SCHOOL_GRADE_RANGE` is `[4,5,6,7,8,9,10]`, with Upper Primary `[4,5,6]`, Jr School `[7,8,9]`, and Senior School `[10]` (`js/config.js:3-20`). Step 2 runs its seed routine when the subject array is empty.

| Seed code | Seed grade levels | Seed periods | Double lessons | Observed issue / special rule |
|---|---:|---:|---:|---|
| `ENG` | `[4,5,6,7,8,9,10]` | seven 5s | true | aligned |
| `MATH` | `[4,5,6,7,8,9,10]` | seven 5s | true | aligned |
| `AGRI` | `[4,5,6,7,8,9,10]` | seven 3s | false | aligned |
| `SCI` | `[4,5,6]` | `[4,4,4]` | true | UI/config excludes Jr and Senior bands. Final validator rejects only 7–9, not grade 10. |
| `INTSCI` | `[7,8,9,10]` | `[5,5,5]` | true | **initial seed length mismatch** (4 grades, 3 periods). |
| `PRETECH` | `[7,8,9,10]` | `[4,4,4]` | true | **initial seed length mismatch** (4 grades, 3 periods). |

**OBSERVED FACT:** the default initialized Step 2 state cannot pass Step 2 or final payload validation until a value is entered for each missing Grade 10 period on `INTSCI` and `PRETECH`; their displayed Grade 10 input derives from an absent period entry. Entering a positive integer supplies index 3 and can make those pairs aligned.

**OBSERVED FACT:** Step 2 validation rejects `SCI` grades 7–10, whereas `validatePayload` rejects only 7–9. Both reject `INTSCI`/`PRETECH` grades 4–6. This makes final validation broader than no UI check in several ways, but *narrower* for SCI Grade 10.

**UNKNOWN:** whether these subject codes, grade ranges, exclusions, periods, and double-lesson rules are correct CBC, GateChecker, or Balancer requirements. `README.md` and `PROGRESS.md` assert/flag them, but neither is a downstream contract artifact.

## 5. Identifier and reference integrity

### Teacher IDs

**OBSERVED FACT:** `generateTeacherId()` parses each existing ID after removing `T-`, takes the maximum numeric result (nonmatching IDs count as zero), and emits `T-` plus `(max + 1)` padded to three digits. The input is readonly; normal UI entry cannot change it.

- Within a monotonically growing normal UI session, generated IDs are distinct.
- IDs are **not stable across delete/re-add**: deleting the current highest ID permits its value to be reused by the next added teacher.
- There is no persistence, UUID, school namespace, or cross-session state. **INFERENCE:** two independent form sessions will commonly produce the same `T-001` IDs.
- Final validation catches duplicate exact IDs in the serialized teacher array but cannot prevent an ID collision with an external system.

### References and stale structures

**OBSERVED FACT:** capabilities and preferences use exact string pairs of teacher ID and subject code, but `validatePayload` checks neither that their teacher exists nor that their subject exists. It also does not require uniqueness of these relation pairs.

**OBSERVED FACT:** deleting a teacher filters records with the deleted `teacher_id`; this is normal-path cleanup. If duplicated IDs already exist, deleting either duplicate removes relations for both IDs.

**OBSERVED FACT:** editing a custom subject code/name does not cascade to existing capability or preference records. Preferences store a copy of applicable grades only at the time a priority is changed; later subject-grade edits do not synchronize that stored `preferences[].grades` value.

**INFERENCE:** custom-subject editing after teacher configuration can emit orphaned subject references or stale preference-grade lists while passing final validation.

## 6. Representative payload that current code can validate

The following is a representative **constructible** and final-validator-valid payload. It differs from the initial seed only by adding the required G10 periods for `INTSCI` and `PRETECH`, adding one teacher, one capability, and one preference. It does not claim downstream acceptance.

```json
{
  "schema_version": "1.0.0",
  "school": {
    "name": "Acacia Academy",
    "filled_by": "M. Otieno",
    "filled_at": "2026-08-11"
  },
  "policy": {
    "generalists_grade_scope": "explicit_only",
    "overload_policy": "block",
    "ambiguous_data_policy": "use_default_and_warn",
    "specialist_scope_lock": true
  },
  "subjects": [
    { "subject_code": "ENG", "subject_name": "English", "grade_levels": [4, 5, 6, 7, 8, 9, 10], "periods_per_week": [5, 5, 5, 5, 5, 5, 5], "double_lessons_allowed": true },
    { "subject_code": "MATH", "subject_name": "Mathematics", "grade_levels": [4, 5, 6, 7, 8, 9, 10], "periods_per_week": [5, 5, 5, 5, 5, 5, 5], "double_lessons_allowed": true },
    { "subject_code": "AGRI", "subject_name": "Agriculture & Nutrition", "grade_levels": [4, 5, 6, 7, 8, 9, 10], "periods_per_week": [3, 3, 3, 3, 3, 3, 3], "double_lessons_allowed": false },
    { "subject_code": "SCI", "subject_name": "Science & Technology", "grade_levels": [4, 5, 6], "periods_per_week": [4, 4, 4], "double_lessons_allowed": true },
    { "subject_code": "INTSCI", "subject_name": "Integrated Science", "grade_levels": [7, 8, 9, 10], "periods_per_week": [5, 5, 5, 5], "double_lessons_allowed": true },
    { "subject_code": "PRETECH", "subject_name": "Pre-Technical", "grade_levels": [7, 8, 9, 10], "periods_per_week": [4, 4, 4, 4], "double_lessons_allowed": true }
  ],
  "teachers": [
    { "teacher_id": "T-001", "teacher_name": "Amina Njeri", "max_periods_week": 30, "specialist": false, "confidence": 1, "flag_note": null }
  ],
  "capabilities": [
    { "teacher_id": "T-001", "subject_code": "ENG", "grades_can_teach": [4, 5, 6] }
  ],
  "preferences": [
    { "teacher_id": "T-001", "subject_code": "ENG", "grades": [4, 5, 6, 7, 8, 9, 10], "priority": 2, "granularity": "subject_level" }
  ]
}
```

## 7. Edge-case matrix

| Input / state scenario | Step-level result | Builder serialization | Final validator result | Classification |
|---|---|---|---|---|
| School name supplied; Filled By left empty | Step 1 allows Continue (only name checked) | `filled_by: ""` | rejects `Filled by is required` | observed validation gap |
| Date cleared/otherwise falsy in state | Step 1 has no date check | current UTC date inserted | accepts a nonempty replacement date | silent fabrication |
| Initial subjects after Step 2 first initialization | Step 2 rejects `INTSCI`/`PRETECH` array-length mismatch | serializes mismatched arrays | final rejects mismatch | observed bootstrap defect |
| No teacher added | Step 3 accepts (loop over empty array) | `teachers: []`, relations likely `[]` | accepts empty all three arrays | accepted incompleteness |
| Enter `12.8` periods or max load | handlers use `parseInt` | `12` | accepts (unless grade pairing issue) | numeric truncation |
| Enter `21` periods or `-1` in a number field by a browser/value manipulation path | UI has min/max attributes only | numeric value retained | accepts any nonzero number; final no range/sign check | insufficient final constraint |
| Clear a subject period | converts to `0`, then removes one zero pair | grade absent rather than period 0 | accepts if arrays remain aligned | implemented omission rule |
| Clear G4, then restore G4 | removal then append on later input | grade/period order can become `[5,6,...,4]` | accepts | same apparent schedule, different array order |
| Never touch a default Normal priority | no preference record created | `preferences: []` for that pair | accepts | structural ambiguity |
| Select Normal then leave it selected | creates preference with priority 2 and current subject grades | explicit preference record | accepts | equivalent UI intent, different structure |
| Check then uncheck a teacher-grade box | leaves relation record with `grades_can_teach: []` | empty capability retained | accepts | structural ambiguity |
| Change custom subject code after configuring teacher relationships | no step-level relation reconciliation | old capability/preference code retained | accepts orphaned code | stale reference |
| State teacher has only `{name:"A"}` (not reachable through normal UI) | N/A | builder emits `teacher_name: ""` and drops `name` | rejects missing `teacher_name`; special bare-name check cannot see dropped key | builder masks diagnostic |
| State `policy.specialist_scope_lock` is `0`, `null`, or `"false"` (not normal UI) | N/A | becomes `true` unless exact `false` | accepts boolean true | truthiness defaulting |
| `SCI` includes Grade 10 in externally altered state | Step 2 rejects 7–10 if it evaluates that state | serializes it | final schema accepts it (only checks 7–9) | validator inconsistency |
| Capability references `T-999` / `UNKNOWN` subject with grades `[]` (externally altered state) | Step-level may not see relation orphan | serialized verbatim | accepts if strings nonblank and arrays | unvalidated foreign key |

## 8. Observed facts, inferences, and unknowns

### OBSERVED FACTS

- `buildPayload` in `js/schema.js` is the sole constructor used by the current Finish flow.
- Final validation runs only after a user reaches Finish; it is broader than individual step validation for fields such as `filled_by`, complete payload object/type checks, duplicate teacher IDs, and all cross-array structure. It is not a strict superset: Step 2 prohibits SCI Grade 10 while final validation does not.
- The runtime subject model is hard-coded to G4–G10 and the six seeded records above. Custom subjects can be added; seed subjects cannot be deleted and their codes are readonly.
- No final validation checks foreign keys, relationship uniqueness, grade bounds, grade applicability in relationships, nonempty relation grade arrays, subject/teacher array cardinality, period positivity, period maximum, capacity maximum, date format, confidence range, or string type beyond operations that call `.trim()`.
- A default policy is emitted even if the policy was not deliberately selected; Step 1 initializes all four defaults.
- `filled_at` can be newly generated at build time; `filled_by` cannot and causes final rejection if empty.

### INFERENCES

- The current serialized contract is deterministic for a given final state, but semantically equivalent UI histories can produce structurally different payloads (array ordering, omitted versus explicit normal preferences, omitted versus empty capability records).
- The contract is not adequate to prove assignment/timetable integrity independently because cross-record references are not validated locally.
- Teacher IDs identify records only within a transient state session; they should not be treated as globally stable identifiers without external evidence.

### UNKNOWN / UNVERIFIED CONTRACT ASSUMPTIONS

- Whether GateChecker accepts this exact shape, defaults, enum spellings, date representation, integer grades, IDs, empty arrays, or subject-level preferences.
- Whether GateChecker requires a nonempty school roster, subject roster, capabilities, preferences, or positive teacher/scheduling values.
- Whether `allow_overload`, `specialist_scope_lock: false`, `confidence: 1.0`, `T-001` naming, and G4–G10 are valid downstream values. `PROGRESS.md:24-29` expressly flags several of these for verification.
- Whether the Workload Balancer consumes the raw payload or a GateChecker-transformed form, and what scheduling fields/constraints it requires.
- Whether the published README schema is independently validated by GateChecker; it matches the local field shape but is not evidence of external acceptance.

## 9. Current canonical payload summary

The current implementation emits a seven-key JSON object: `schema_version`, `school`, `policy`, `subjects`, `teachers`, `capabilities`, and `preferences` (six named business sections plus version). All keys are constructed on every call. User input reaches it through in-memory state only; no persistence or server mutation occurs. Scalar defaults are implemented primarily with JavaScript truthiness, arrays default to empty arrays, and unknown state keys are omitted. The current Finish flow validates this local payload, then exposes it through the local `main.js` review/download/copy implementation.

## 10. Highest-risk schema/data-integrity findings

1. **Seeded data is internally invalid:** `INTSCI` and `PRETECH` seed four grades but three periods, blocking normal progression until manually repaired.
2. **No relational integrity:** capability/preference teacher IDs and subject codes are not verified, changes do not cascade from edited custom subjects, and preference grades can become stale.
3. **Silent/default normalization obscures data quality:** a falsy date is replaced with today's UTC date; policy and boolean defaults can substitute for malformed/missing state; empty arrays are accepted for all roster/relation arrays.
4. **Equivalent intent can serialize differently:** history controls grade ordering and whether default Normal preference/empty capability records exist.
5. **Validation inconsistency:** Step 2 and final validation differ on SCI Grade 10, and final validation leaves many scheduling-relevant ranges/subsets unconstrained.

## 11. Unresolved contract questions

- What exact JSON Schema/API contract does GateChecker enforce, including all requiredness, enums, nullability, format, array cardinality, and foreign-key semantics?
- Does GateChecker normalize, reject, or enrich duplicates, dangling relations, empty arrays, omitted preference records, and grade ordering?
- Which current hard-coded grade/subject/period rules are required curriculum rules versus initial defaults?
- What is the intended identity scope and stability requirement for `teacher_id` and `subject_code`?
- Are school completion date, confidence, notes, specialist behavior, and ambiguity/overload policies contractual inputs or only UI metadata?

## 12. Evidence required before compatibility can be certified

### From GateChecker

- Versioned input schema or source-level validation, including accepted/rejected example fixtures.
- HTTP endpoint, authentication, response/error contract, and whether JSON payloads are transformed before forwarding.
- Explicit rules for all field types, requiredness, null/empty handling, ranges, grade/date representation, uniqueness, references, enums, and the three special subject exclusions.
- Expected treatment of policies, `confidence`, `flag_note`, and subject-level preference granularity.

### From Workload Balancer

- Its input schema (raw intake versus GateChecker output) and a representative accepted input/output fixture.
- Exact demand, capacity, eligibility, priority, specialist, overload, ambiguity, double-lesson, grade, and timetable constraints it consumes.
- Identifier/reference semantics, ordering assumptions, required cardinalities, and behavior for incomplete/ambiguous data.

## 13. Phase 1 hardening note

This section records the locally justified implementation decisions made after the audit above. The preceding sections remain evidence of the source as inspected at audit time.

### OBSERVED FACTS

- Step 2's applicable-grade UI and `NA_EXCLUSIONS` both exclude SCI Grade 10, while the prior final validator did not. Final validation is aligned to that same local configuration; this is an internal-consistency change only.
- The number inputs advertise periods/week `1`–`20` and teacher maximum periods/week `0`–`100`. Final validation now enforces those integer bounds.
- Capability and preference records are explicitly built from a teacher ID and subject code selected from the current in-memory arrays. Their references and relation pairs are therefore validated within the payload; this does not assert a cross-session/global ID rule.

### UNKNOWN / DECISION REQUIRED FOR A LATER PHASE

- The repository does not establish whether its hard-coded SCI/INTSCI/PRETECH exclusions are correct external curriculum or downstream rules. Phase 1 only removes the discrepancy between the UI and local final validator.
- The repository does not establish whether an empty capability record means something different from no record, or whether omitting a preference differs from an explicit Normal preference. Phase 1 preserves both representations.
- The repository does not establish a downstream date format beyond a nonempty date value. Phase 1 stops build-time date fabrication and leaves a missing date explicit for existing validation to reject.
