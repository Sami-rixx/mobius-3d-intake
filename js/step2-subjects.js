// Step 2: Subject Roster
import { getState, updateState } from './state.js';
import { navigateToStep } from './main.js';
import { SCHOOL_GRADE_RANGE, GRADE_BANDS, NA_EXCLUSIONS } from './config.js';

// DOM elements
const stepContainer = document.getElementById('step-2');

// Seed subjects from the spec
const SEED_SUBJECTS = [
  { subject_code: 'ENG', subject_name: 'English', grade_levels: [...GRADE_BANDS.UPPER_PRIMARY, ...GRADE_BANDS.JR_SCHOOL, ...GRADE_BANDS.SENIOR_SCHOOL], periods_per_week: [5, 5, 5, 5, 5, 5, 5], double_lessons_allowed: true },
  { subject_code: 'MATH', subject_name: 'Mathematics', grade_levels: [...GRADE_BANDS.UPPER_PRIMARY, ...GRADE_BANDS.JR_SCHOOL, ...GRADE_BANDS.SENIOR_SCHOOL], periods_per_week: [5, 5, 5, 5, 5, 5, 5], double_lessons_allowed: true },
  { subject_code: 'AGRI', subject_name: 'Agriculture & Nutrition', grade_levels: [...GRADE_BANDS.UPPER_PRIMARY, ...GRADE_BANDS.JR_SCHOOL, ...GRADE_BANDS.SENIOR_SCHOOL], periods_per_week: [3, 3, 3, 3, 3, 3, 3], double_lessons_allowed: false },
  { subject_code: 'SCI', subject_name: 'Science & Technology', grade_levels: [...GRADE_BANDS.UPPER_PRIMARY], periods_per_week: [4, 4, 4], double_lessons_allowed: true },
  { subject_code: 'INTSCI', subject_name: 'Integrated Science', grade_levels: [...GRADE_BANDS.JR_SCHOOL, ...GRADE_BANDS.SENIOR_SCHOOL], periods_per_week: [5, 5, 5], double_lessons_allowed: true },
  { subject_code: 'PRETECH', subject_name: 'Pre-Technical', grade_levels: [...GRADE_BANDS.JR_SCHOOL, ...GRADE_BANDS.SENIOR_SCHOOL], periods_per_week: [4, 4, 4], double_lessons_allowed: true }
];

// Initialize
function init() {
  // Initialize state with seed subjects if empty
  const state = getState();
  if (state.subjects.length === 0) {
    const newState = getState();
    newState.subjects = JSON.parse(JSON.stringify(SEED_SUBJECTS));
    updateState(newState);
  }
  
  render();
  setupEventListeners();
  
  // Validate on step change
  window.addEventListener('stepChange', (e) => {
    if (e.detail.step === 2) {
      validateAndUpdateButton();
    }
  });
}

// Get applicable grades for a subject (respecting N/A exclusions)
function getApplicableGrades(subjectCode) {
  const exclusions = NA_EXCLUSIONS[subjectCode];
  if (!exclusions) {
    return [...SCHOOL_GRADE_RANGE];
  }
  
  let applicable = [];
  if (!exclusions.excluded_bands.includes('UPPER_PRIMARY')) {
    applicable = applicable.concat(GRADE_BANDS.UPPER_PRIMARY);
  }
  if (!exclusions.excluded_bands.includes('JR_SCHOOL')) {
    applicable = applicable.concat(GRADE_BANDS.JR_SCHOOL);
  }
  if (!exclusions.excluded_bands.includes('SENIOR_SCHOOL')) {
    applicable = applicable.concat(GRADE_BANDS.SENIOR_SCHOOL);
  }
  
  return applicable;
}

// Render the step
function render() {
  const state = getState();
  
  let html = `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2>Subject Roster</h2>
        <button id="add-subject" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.75rem;">+ Add Subject</button>
      </div>
      
      <p style="margin-bottom: 1rem; font-size: 0.875rem; opacity: 0.8;">
        Enter the subjects taught at your school. For each subject, specify which grades it covers and how many periods per week.
      </p>
      
      <div id="subjects-list">
  `;
  
  // Render each subject
  state.subjects.forEach((subject, index) => {
    const applicableGrades = getApplicableGrades(subject.subject_code);
    const isSeedSubject = SEED_SUBJECTS.some(s => s.subject_code === subject.subject_code);
    
    html += `
      <div class="card" data-subject-index="${index}" style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div style="flex: 1;">
            <div class="form-group" style="margin-bottom: 0.5rem;">
              <label class="form-label" for="subject-code-${index}">Subject Code <span class="code">${escapeHtml(subject.subject_code)}</span></label>
              <input 
                type="text" 
                id="subject-code-${index}" 
                class="form-input code" 
                value="${escapeHtml(subject.subject_code || '')}"
                placeholder="e.g., ENG"
                style="font-family: var(--font-mono); width: 100px;"
                ${isSeedSubject ? 'readonly' : ''}
              >
            </div>
            <div class="form-group">
              <label class="form-label" for="subject-name-${index}">Subject Name</label>
              <input 
                type="text" 
                id="subject-name-${index}" 
                class="form-input" 
                value="${escapeHtml(subject.subject_name || '')}"
                placeholder="e.g., English"
              >
            </div>
          </div>
          <button type="button" class="btn btn-danger delete-subject" data-index="${index}" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;" ${isSeedSubject ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>×</button>
        </div>
        
        <div class="form-group">
          <label class="form-label">Grade Levels & Periods per Week</label>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem;">
  `;
    
    // Render grade inputs
    applicableGrades.forEach((grade, gradeIndex) => {
      const periodIndex = subject.grade_levels.indexOf(grade);
      const period = periodIndex >= 0 ? subject.periods_per_week[periodIndex] : 0;
      
      html += `
        <div style="display: flex; align-items: center; gap: 0.25rem;">
          <span class="grade-label">G${grade}</span>
          <input 
            type="number" 
            class="form-input period-input" 
            data-index="${index}" 
            data-grade="${grade}"
            value="${period}"
            min="1"
            max="20"
            style="width: 60px; font-family: var(--font-mono);"
          >
        </div>
      `;
    });
    
    html += `
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">
            <input 
              type="checkbox" 
              id="double-lessons-${index}" 
              class="form-input" 
              style="width: auto; margin-right: 0.5rem;"
              ${subject.double_lessons_allowed ? 'checked' : ''}
            >
            Double lessons allowed
          </label>
        </div>
        
        <div id="subject-error-${index}" class="error-message" style="display: none;"></div>
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  stepContainer.innerHTML = html;
  
  // Re-setup event listeners after render
  setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
  // Add subject button
  const addBtn = document.getElementById('add-subject');
  if (addBtn) {
    addBtn.addEventListener('click', addSubject);
  }
  
  // Subject code and name inputs
  document.querySelectorAll('[id^="subject-code-"], [id^="subject-name-"]').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = e.target.id;
      const index = parseInt(id.split('-')[2]);
      const field = id.startsWith('subject-code') ? 'subject_code' : 'subject_name';
      
      const newState = getState();
      newState.subjects[index][field] = e.target.value;
      updateState(newState);
      validateAndUpdateButton();
    });
  });
  
  // Period inputs
  document.querySelectorAll('.period-input').forEach(el => {
    el.addEventListener('input', (e) => {
      const index = parseInt(el.dataset.index);
      const grade = parseInt(el.dataset.grade);
      const value = parseInt(e.target.value) || 0;
      
      const newState = getState();
      const subject = newState.subjects[index];
      
      // Update or add grade/period
      const gradeIndex = subject.grade_levels.indexOf(grade);
      if (gradeIndex >= 0) {
        subject.periods_per_week[gradeIndex] = value;
      } else {
        subject.grade_levels.push(grade);
        subject.periods_per_week.push(value);
      }
      
      // Remove zero periods (N/A exclusion rule)
      if (value === 0) {
        const zeroIndex = subject.periods_per_week.indexOf(0);
        if (zeroIndex >= 0) {
          subject.grade_levels.splice(zeroIndex, 1);
          subject.periods_per_week.splice(zeroIndex, 1);
        }
      }
      
      updateState(newState);
      validateAndUpdateButton();
    });
  });
  
  // Double lessons checkboxes
  document.querySelectorAll('[id^="double-lessons-"]').forEach(el => {
    el.addEventListener('change', (e) => {
      const index = parseInt(e.target.id.split('-')[2]);
      const newState = getState();
      newState.subjects[index].double_lessons_allowed = e.target.checked;
      updateState(newState);
      validateAndUpdateButton();
    });
  });
  
  // Delete subject buttons
  document.querySelectorAll('.delete-subject').forEach(el => {
    el.addEventListener('click', (e) => {
      const index = parseInt(el.dataset.index);
      const newState = getState();
      newState.subjects.splice(index, 1);
      updateState(newState);
      render();
      validateAndUpdateButton();
    });
  });
}

// Add a new subject
function addSubject() {
  const newState = getState();
  const newSubject = {
    subject_code: '',
    subject_name: '',
    grade_levels: [...SCHOOL_GRADE_RANGE],
    periods_per_week: Array(SCHOOL_GRADE_RANGE.length).fill(5),
    double_lessons_allowed: true
  };
  newState.subjects.push(newSubject);
  updateState(newState);
  render();
  validateAndUpdateButton();
  
  // Scroll to new subject
  setTimeout(() => {
    const lastSubject = document.querySelector('[data-subject-index]:last-child');
    if (lastSubject) lastSubject.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

// Validate the step
function validateStep() {
  const state = getState();
  const errors = [];
  const seenCodes = new Set();
  
  state.subjects.forEach((subject, index) => {
    // Check for duplicate codes
    if (subject.subject_code && seenCodes.has(subject.subject_code)) {
      errors.push(`Duplicate subject code: "${subject.subject_code}"`);
    } else if (subject.subject_code) {
      seenCodes.add(subject.subject_code);
    }
    
    // Check required fields
    if (!subject.subject_code || subject.subject_code.trim() === '') {
      errors.push(`Subject ${index + 1}: Subject code is required`);
    }
    
    if (!subject.subject_name || subject.subject_name.trim() === '') {
      errors.push(`Subject ${index + 1} (${subject.subject_code}): Subject name is required`);
    }
    
    // Check grade_levels and periods_per_week consistency
    if (subject.grade_levels.length !== subject.periods_per_week.length) {
      errors.push(`Subject ${index + 1} (${subject.subject_code}): grade_levels and periods_per_week must have the same length`);
    }
    
    // Check for zero periods (should be excluded, not zero)
    for (let i = 0; i < subject.periods_per_week.length; i++) {
      if (subject.periods_per_week[i] === 0) {
        errors.push(`Subject ${index + 1} (${subject.subject_code}): grade ${subject.grade_levels[i]} has 0 periods - this grade should be excluded entirely`);
      }
    }
  });
  
  // Specific test: SCI/INTSCI/PRETECH exclusions
  const sciSubject = state.subjects.find(s => s.subject_code === 'SCI');
  if (sciSubject) {
    const hasJrGrades = sciSubject.grade_levels.some(g => [7, 8, 9, 10].includes(g));
    if (hasJrGrades) {
      errors.push('SCI (Science & Technology) must NOT include grades 7, 8, 9, or 10 - these should be completely excluded');
    }
  }
  
  const intSciSubject = state.subjects.find(s => s.subject_code === 'INTSCI');
  if (intSciSubject) {
    const hasUpperPrimaryGrades = intSciSubject.grade_levels.some(g => [4, 5, 6].includes(g));
    if (hasUpperPrimaryGrades) {
      errors.push('INTSCI (Integrated Science) must NOT include grades 4, 5, or 6 - these should be completely excluded');
    }
  }
  
  const preTechSubject = state.subjects.find(s => s.subject_code === 'PRETECH');
  if (preTechSubject) {
    const hasUpperPrimaryGrades = preTechSubject.grade_levels.some(g => [4, 5, 6].includes(g));
    if (hasUpperPrimaryGrades) {
      errors.push('PRETECH (Pre-Technical) must NOT include grades 4, 5, or 6 - these should be completely excluded');
    }
  }
  
  return errors;
}

// Validate and update button state
function validateAndUpdateButton() {
  const errors = validateStep();
  const nextBtn = document.getElementById('next-step');
  
  if (nextBtn) {
    nextBtn.disabled = errors.length > 0;
    
    // Set title for hover
    if (errors.length > 0) {
      nextBtn.title = errors.join('; ');
    } else {
      nextBtn.title = '';
    }
  }
  
  // Dispatch validation event for main.js
  const event = new CustomEvent('validateStep', { 
    detail: { step: 2, valid: errors.length === 0 } 
  });
  window.dispatchEvent(event);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
