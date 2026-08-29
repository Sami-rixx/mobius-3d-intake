// Canonical payload builder and validator
import { SCHOOL_GRADE_RANGE, GRADE_BANDS, NA_EXCLUSIONS } from './config.js';

/**
 * Builds the exact payload from the current state
 * @param {Object} state - The form state
 * @returns {Object} The payload matching the contract
 */
export function buildPayload(state) {
  // Ensure we don't mutate the original state
  const s = JSON.parse(JSON.stringify(state));
  
  // Build the payload according to the contract
  const payload = {
    schema_version: "1.0.0",
    school: {
      name: s.school.name || "",
      filled_by: s.school.filled_by || "",
      filled_at: s.school.filled_at || ""
    },
    policy: {
      generalists_grade_scope: s.policy.generalists_grade_scope || "explicit_only",
      overload_policy: s.policy.overload_policy || "block",
      ambiguous_data_policy: s.policy.ambiguous_data_policy || "use_default_and_warn",
      specialist_scope_lock: s.policy.specialist_scope_lock !== false // default true
    },
    subjects: (s.subjects || []).map(subj => ({
      subject_code: subj.subject_code || "",
      subject_name: subj.subject_name || "",
      grade_levels: subj.grade_levels || [],
      periods_per_week: subj.periods_per_week || [],
      double_lessons_allowed: subj.double_lessons_allowed !== false // default true
    })),
    teachers: (s.teachers || []).map(teacher => ({
      teacher_id: teacher.teacher_id || "",
      teacher_name: teacher.teacher_name || "",
      max_periods_week: teacher.max_periods_week || 0,
      specialist: teacher.specialist || false,
      confidence: teacher.confidence !== undefined ? teacher.confidence : 1.0,
      flag_note: teacher.flag_note || null
    })),
    capabilities: (s.capabilities || []).map(cap => ({
      teacher_id: cap.teacher_id || "",
      subject_code: cap.subject_code || "",
      grades_can_teach: cap.grades_can_teach || []
    })),
    preferences: (s.preferences || []).map(pref => ({
      teacher_id: pref.teacher_id || "",
      subject_code: pref.subject_code || "",
      grades: pref.grades || [],
      priority: pref.priority || 2,
      granularity: pref.granularity || "subject_level"
    }))
  };
  
  return payload;
}

/**
 * Validates the payload against the contract
 * @param {Object} payload - The payload to validate
 * @returns {Array<string>} List of human-readable error messages
 */
export function validatePayload(payload) {
  const errors = [];
  
  // Check schema version
  if (!payload.schema_version) {
    errors.push("Missing required field: schema_version");
  } else if (payload.schema_version !== "1.0.0") {
    errors.push(`Invalid schema_version: expected "1.0.0", got "${payload.schema_version}"`);
  }
  
  // Validate school
  if (!payload.school) {
    errors.push("Missing required section: school");
  } else {
    if (!payload.school.name || payload.school.name.trim() === "") {
      errors.push("School name is required");
    }
    if (!payload.school.filled_by || payload.school.filled_by.trim() === "") {
      errors.push("Filled by is required");
    }
    if (!payload.school.filled_at) {
      errors.push("Filled at date is required");
    }
  }
  
  // Validate policy
  if (!payload.policy) {
    errors.push("Missing required section: policy");
  } else {
    const validGeneralistScopes = ["explicit_only", "unrestricted"];
    if (!validGeneralistScopes.includes(payload.policy.generalists_grade_scope)) {
      errors.push(`Invalid generalists_grade_scope: must be one of ${validGeneralistScopes.join(", ")}`);
    }
    
    const validOverloadPolicies = ["block", "allow_overload"];
    if (!validOverloadPolicies.includes(payload.policy.overload_policy)) {
      errors.push(`Invalid overload_policy: must be one of ${validOverloadPolicies.join(", ")}`);
    }
    
    const validAmbiguousPolicies = ["use_default_and_warn", "block_until_resolved"];
    if (!validAmbiguousPolicies.includes(payload.policy.ambiguous_data_policy)) {
      errors.push(`Invalid ambiguous_data_policy: must be one of ${validAmbiguousPolicies.join(", ")}`);
    }
    
    if (typeof payload.policy.specialist_scope_lock !== "boolean") {
      errors.push("specialist_scope_lock must be a boolean");
    }
  }
  
  // Validate subjects
  if (!payload.subjects || !Array.isArray(payload.subjects)) {
    errors.push("Missing required section: subjects (must be an array)");
  } else {
    payload.subjects.forEach((subject, index) => {
      if (!subject.subject_code || subject.subject_code.trim() === "") {
        errors.push(`Subject ${index + 1}: subject_code is required`);
      }
      
      if (!subject.subject_name || subject.subject_name.trim() === "") {
        errors.push(`Subject ${index + 1} (${subject.subject_code}): subject_name is required`);
      }
      
      // Validate grade_levels and periods_per_week
      if (!subject.grade_levels || !Array.isArray(subject.grade_levels)) {
        errors.push(`Subject ${index + 1} (${subject.subject_code}): grade_levels must be an array`);
      }
      
      if (!subject.periods_per_week || !Array.isArray(subject.periods_per_week)) {
        errors.push(`Subject ${index + 1} (${subject.subject_code}): periods_per_week must be an array`);
      }
      
      if (subject.grade_levels && subject.periods_per_week) {
        if (subject.grade_levels.length !== subject.periods_per_week.length) {
          errors.push(`Subject ${index + 1} (${subject.subject_code}): grade_levels and periods_per_week must have the same length`);
        }
        
        // Period inputs are constrained to whole numbers from 1 through 20.
        for (let i = 0; i < subject.periods_per_week.length; i++) {
          const periods = subject.periods_per_week[i];
          if (periods === 0) {
            errors.push(`Subject ${index + 1} (${subject.subject_code}): grade ${subject.grade_levels[i]} has 0 periods - this grade should be excluded entirely, not set to 0`);
          } else if (!Number.isInteger(periods) || periods < 1 || periods > 20) {
            errors.push(`Subject ${index + 1} (${subject.subject_code}): grade ${subject.grade_levels[i]} periods/week must be a whole number from 1 to 20`);
          }
        }
        
        // Validate types
        for (let i = 0; i < subject.grade_levels.length; i++) {
          if (typeof subject.grade_levels[i] !== "number") {
            errors.push(`Subject ${index + 1} (${subject.subject_code}): grade_levels must contain numbers, got ${typeof subject.grade_levels[i]}`);
          }
          if (typeof subject.periods_per_week[i] !== "number") {
            errors.push(`Subject ${index + 1} (${subject.subject_code}): periods_per_week must contain numbers, got ${typeof subject.periods_per_week[i]}`);
          }
        }
        
        // Validate grade values are within the school grade range
        for (let i = 0; i < subject.grade_levels.length; i++) {
          const grade = subject.grade_levels[i];
          if (typeof grade === "number" && !SCHOOL_GRADE_RANGE.includes(grade)) {
            errors.push(`Subject ${index + 1} (${subject.subject_code}): grade ${grade} is outside the valid range [${SCHOOL_GRADE_RANGE.join(", ")}]`);
          }
        }
      }
      
      if (typeof subject.double_lessons_allowed !== "boolean") {
        errors.push(`Subject ${index + 1} (${subject.subject_code}): double_lessons_allowed must be a boolean`);
      }
    });
    
    // Check for duplicate subject codes
    const subjectCodes = payload.subjects.map(s => s.subject_code);
    const duplicateCodes = subjectCodes.filter((code, index) => subjectCodes.indexOf(code) !== index);
    if (duplicateCodes.length > 0) {
      errors.push(`Duplicate subject codes found: ${duplicateCodes.join(", ")}`);
    }
  }
  
  // Validate teachers
  if (!payload.teachers || !Array.isArray(payload.teachers)) {
    errors.push("Missing required section: teachers (must be an array)");
  } else {
    payload.teachers.forEach((teacher, index) => {
      if (!teacher.teacher_id || teacher.teacher_id.trim() === "") {
        errors.push(`Teacher ${index + 1}: teacher_id is required`);
      }
      
      // CRITICAL: Check for bare 'name' key
      if (teacher.name !== undefined && teacher.teacher_name === undefined) {
        errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): uses 'name' instead of 'teacher_name' - this is a known bug`);
      }
      
      if (!teacher.teacher_name || teacher.teacher_name.trim() === "") {
        errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): teacher_name is required`);
      }
      
      if (!Number.isInteger(teacher.max_periods_week) || teacher.max_periods_week < 0 || teacher.max_periods_week > 100) {
        errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): max_periods_week must be a whole number from 0 to 100`);
      }
      
      if (typeof teacher.specialist !== "boolean") {
        errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): specialist must be a boolean`);
      }
      
      if (typeof teacher.confidence !== "number") {
        errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): confidence must be a number`);
      } else if (teacher.confidence < 0 || teacher.confidence > 1) {
        errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): confidence must be a number between 0 and 1`);
      }
      
      if (teacher.flag_note !== null && typeof teacher.flag_note !== "string") {
        errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): flag_note must be a string or null`);
      }
    });
    
    // Check for duplicate teacher IDs
    const teacherIds = payload.teachers.map(t => t.teacher_id);
    const duplicateIds = teacherIds.filter((id, index) => teacherIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate teacher IDs found: ${duplicateIds.join(", ")}`);
    }
  }
  
  // Validate capabilities
  if (!payload.capabilities || !Array.isArray(payload.capabilities)) {
    errors.push("Missing required section: capabilities (must be an array)");
  } else {
    payload.capabilities.forEach((cap, index) => {
      if (!cap.teacher_id || cap.teacher_id.trim() === "") {
        errors.push(`Capability ${index + 1}: teacher_id is required`);
      }
      
      if (!cap.subject_code || cap.subject_code.trim() === "") {
        errors.push(`Capability ${index + 1}: subject_code is required`);
      }
      
      if (!cap.grades_can_teach || !Array.isArray(cap.grades_can_teach)) {
        errors.push(`Capability ${index + 1} (${cap.teacher_id} -> ${cap.subject_code}): grades_can_teach must be an array`);
      } else {
        // Validate grade elements in capabilities
        for (let i = 0; i < cap.grades_can_teach.length; i++) {
          const grade = cap.grades_can_teach[i];
          if (typeof grade !== "number") {
            errors.push(`Capability ${index + 1} (${cap.teacher_id} -> ${cap.subject_code}): grades_can_teach must contain numbers, got ${typeof grade}`);
          } else if (!SCHOOL_GRADE_RANGE.includes(grade)) {
            errors.push(`Capability ${index + 1} (${cap.teacher_id} -> ${cap.subject_code}): grade ${grade} is outside the valid range [${SCHOOL_GRADE_RANGE.join(", ")}]`);
          }
        }
      }
    });
  }
  
  // Validate preferences
  if (!payload.preferences || !Array.isArray(payload.preferences)) {
    errors.push("Missing required section: preferences (must be an array)");
  } else {
    payload.preferences.forEach((pref, index) => {
      if (!pref.teacher_id || pref.teacher_id.trim() === "") {
        errors.push(`Preference ${index + 1}: teacher_id is required`);
      }
      
      if (!pref.subject_code || pref.subject_code.trim() === "") {
        errors.push(`Preference ${index + 1}: subject_code is required`);
      }
      
      if (!pref.grades || !Array.isArray(pref.grades)) {
        errors.push(`Preference ${index + 1} (${pref.teacher_id} -> ${pref.subject_code}): grades must be an array`);
      } else {
        // Validate grade elements in preferences
        for (let i = 0; i < pref.grades.length; i++) {
          const grade = pref.grades[i];
          if (typeof grade !== "number") {
            errors.push(`Preference ${index + 1} (${pref.teacher_id} -> ${pref.subject_code}): grades must contain numbers, got ${typeof grade}`);
          } else if (!SCHOOL_GRADE_RANGE.includes(grade)) {
            errors.push(`Preference ${index + 1} (${pref.teacher_id} -> ${pref.subject_code}): grade ${grade} is outside the valid range [${SCHOOL_GRADE_RANGE.join(", ")}]`);
          }
        }
      }
      
      if (![1, 2, 3].includes(pref.priority)) {
        errors.push(`Preference ${index + 1} (${pref.teacher_id} -> ${pref.subject_code}): priority must be 1, 2, or 3`);
      }
      
      if (pref.granularity !== "subject_level") {
        errors.push(`Preference ${index + 1} (${pref.teacher_id} -> ${pref.subject_code}): granularity must be "subject_level"`);
      }
    });
  }

  // Capabilities and preferences are relationships within this payload. Their
  // endpoints and teacher/subject pairs must be internally consistent.
  if (Array.isArray(payload.teachers) && Array.isArray(payload.subjects)) {
    const teacherIds = new Set(payload.teachers.map(teacher => teacher.teacher_id));
    const subjectCodes = new Set(payload.subjects.map(subject => subject.subject_code));
    const subjectGradeMap = new Map();
    payload.subjects.forEach(subj => {
      subjectGradeMap.set(subj.subject_code, new Set(subj.grade_levels || []));
    });
    
    const validateRelations = (relations, relationName) => {
      if (!Array.isArray(relations)) return;

      const pairs = new Set();
      relations.forEach((relation, index) => {
        const label = `${relationName} ${index + 1} (${relation.teacher_id} -> ${relation.subject_code})`;
        if (!teacherIds.has(relation.teacher_id)) {
          errors.push(`${label}: references an unknown teacher_id`);
        }
        if (!subjectCodes.has(relation.subject_code)) {
          errors.push(`${label}: references an unknown subject_code`);
        }
        
        // Validate grades in relation are applicable to the subject
        const subjectGrades = subjectGradeMap.get(relation.subject_code);
        if (subjectGrades) {
          const gradesToCheck = relation.grades_can_teach || relation.grades || [];
          for (const grade of gradesToCheck) {
            if (typeof grade === "number" && !subjectGrades.has(grade)) {
              errors.push(`${label}: grade ${grade} is not in the subject's grade_levels [${Array.from(subjectGrades).sort((a,b) => a-b).join(", ")}]`);
            }
          }
        }

        const pair = JSON.stringify([relation.teacher_id, relation.subject_code]);
        if (pairs.has(pair)) {
          errors.push(`Duplicate ${relationName.toLowerCase()} relation found: ${relation.teacher_id} -> ${relation.subject_code}`);
        }
        pairs.add(pair);
      });
    };

    validateRelations(payload.capabilities, 'Capability');
    validateRelations(payload.preferences, 'Preference');
  }
  
  // Use the same local exclusion configuration as Step 2. This aligns the
  // intake validator with the UI without asserting any external business rule.
  if (Array.isArray(payload.subjects)) {
    Object.entries(NA_EXCLUSIONS).forEach(([subjectCode, exclusion]) => {
      const subject = payload.subjects.find(item => item.subject_code === subjectCode);
      if (!subject || !Array.isArray(subject.grade_levels)) return;

      const excludedGrades = exclusion.excluded_bands.flatMap(band => GRADE_BANDS[band] || []);
      if (subject.grade_levels.some(grade => excludedGrades.includes(grade))) {
        errors.push(`${subjectCode} must NOT include configured excluded grades (${excludedGrades.join(', ')})`);
      }
    });
  }
  
  return errors;
}

/**
 * Run explicit tests for known bug traps
 */
export function runExplicitTests(payload) {
  console.log("=== Running Explicit Tests ===");
  
  // Test 1: SCI/INTSCI/PRETECH exclusion
  console.log("\nTest 1: N/A grade-band exclusion");
  
  const sciSubject = payload.subjects.find(s => s.subject_code === "SCI");
  if (sciSubject) {
    const hasJrGrades = sciSubject.grade_levels.some(g => [7, 8, 9].includes(g));
    console.log(`SCI grade_levels: [${sciSubject.grade_levels.join(", ")}]`);
    console.log(`SCI has Jr grades (7-9): ${hasJrGrades} - ${hasJrGrades ? "FAIL" : "PASS"}`);
  } else {
    console.log("SCI subject not found in payload");
  }
  
  const intSciSubject = payload.subjects.find(s => s.subject_code === "INTSCI");
  if (intSciSubject) {
    const hasUpperPrimaryGrades = intSciSubject.grade_levels.some(g => [4, 5, 6].includes(g));
    console.log(`INTSCI grade_levels: [${intSciSubject.grade_levels.join(", ")}]`);
    console.log(`INTSCI has Upper Primary grades (4-6): ${hasUpperPrimaryGrades} - ${hasUpperPrimaryGrades ? "FAIL" : "PASS"}`);
  } else {
    console.log("INTSCI subject not found in payload");
  }
  
  const preTechSubject = payload.subjects.find(s => s.subject_code === "PRETECH");
  if (preTechSubject) {
    const hasUpperPrimaryGrades = preTechSubject.grade_levels.some(g => [4, 5, 6].includes(g));
    console.log(`PRETECH grade_levels: [${preTechSubject.grade_levels.join(", ")}]`);
    console.log(`PRETECH has Upper Primary grades (4-6): ${hasUpperPrimaryGrades} - ${hasUpperPrimaryGrades ? "FAIL" : "PASS"}`);
  } else {
    console.log("PRETECH subject not found in payload");
  }
  
  // Test 2: teacher_name field
  console.log("\nTest 2: teacher_name field (not 'name')");
  let hasNameBug = false;
  payload.teachers.forEach(teacher => {
    if (teacher.name !== undefined && teacher.teacher_name === undefined) {
      console.log(`FAIL: Teacher has 'name' instead of 'teacher_name': ${JSON.stringify(teacher)}`);
      hasNameBug = true;
    }
  });
  if (!hasNameBug) {
    console.log("PASS: No teachers use bare 'name' key");
  }
  
  console.log("\n=== Explicit Tests Complete ===");
}
