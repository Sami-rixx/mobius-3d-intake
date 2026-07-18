// Step 3: Teachers
import { getState, updateState } from './state.js';
import { navigateToStep } from './main.js';
import { SCHOOL_GRADE_RANGE, GRADE_BANDS, NA_EXCLUSIONS, PRIORITY_MAP, PRIORITY_VALUES } from './config.js';

// DOM elements
const stepContainer = document.getElementById('step-3');

// Priority chip classes
const PRIORITY_CLASSES = {
  'preferred': 'priority-preferred',
  'normal': 'priority-normal',
  'last-resort': 'priority-last-resort'
};

// Initialize
function init() {
  render();
  setupEventListeners();
  
  // Validate on step change
  window.addEventListener('stepChange', (e) => {
    if (e.detail.step === 3) {
      validateAndUpdateButton();
    }
  });
}

// Get subjects from state
function getSubjects() {
  const state = getState();
  return state.subjects || [];
}

// Get applicable grades for a subject (respecting N/A exclusions)
function getApplicableGrades(subjectCode) {
  const state = getState();
  const subject = state.subjects.find(s => s.subject_code === subjectCode);
  if (subject) {
    return subject.grade_levels || [];
  }
  return [];
}

// Generate teacher ID
function generateTeacherId() {
  const state = getState();
  const maxId = state.teachers.reduce((max, t) => {
    const num = parseInt(t.teacher_id.replace('T-', '')) || 0;
    return Math.max(max, num);
  }, 0);
  return `T-${String(maxId + 1).padStart(3, '0')}`;
}

// Render the step
function render() {
  const state = getState();
  const subjects = getSubjects();
  
  let html = `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2>Teachers</h2>
        <button id="add-teacher" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.75rem;">+ Add Another Teacher</button>
      </div>
      
      <p style="margin-bottom: 1rem; font-size: 0.875rem; opacity: 0.8;">
        Add all teachers at your school. For each teacher, specify their capabilities and preferences for each subject.
      </p>
      
      <div id="teachers-list">
  `;
  
  // Render each teacher
  state.teachers.forEach((teacher, teacherIndex) => {
    html += `
      <div class="card" data-teacher-index="${teacherIndex}" style="margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
          <div style="flex: 1;">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem;">Teacher ${teacherIndex + 1}: ${escapeHtml(teacher.teacher_name || teacher.teacher_id || 'New Teacher')}</h3>
          </div>
          <button type="button" class="btn btn-danger delete-teacher" data-index="${teacherIndex}" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;">×</button>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label" for="teacher-name-${teacherIndex}">Teacher Name *</label>
            <input 
              type="text" 
              id="teacher-name-${teacherIndex}" 
              class="form-input" 
              value="${escapeHtml(teacher.teacher_name || '')}"
              placeholder="Teacher name"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label" for="teacher-id-${teacherIndex}">Teacher ID</label>
            <input 
              type="text" 
              id="teacher-id-${teacherIndex}" 
              class="form-input code" 
              value="${escapeHtml(teacher.teacher_id || '')}"
              placeholder="Auto-generated"
              readonly
            >
          </div>
          
          <div class="form-group">
            <label class="form-label" for="max-periods-${teacherIndex}">Max Periods/Week</label>
            <input 
              type="number" 
              id="max-periods-${teacherIndex}" 
              class="form-input" 
              value="${teacher.max_periods_week || 0}"
              min="0"
              max="100"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label">Role</label>
            <div class="chip-grid">
              <button 
                type="button" 
                class="toggle-chip ${teacher.specialist === false ? 'selected' : ''}" 
                data-teacher-index="${teacherIndex}" 
                data-field="specialist" 
                data-value="false"
              >Generalist</button>
              <button 
                type="button" 
                class="toggle-chip ${teacher.specialist === true ? 'selected' : ''}" 
                data-teacher-index="${teacherIndex}" 
                data-field="specialist" 
                data-value="true"
              >Specialist</button>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="flag-note-${teacherIndex}">Notes / Exceptions</label>
          <textarea 
            id="flag-note-${teacherIndex}" 
            class="form-textarea" 
            placeholder="Any special notes about this teacher..."
          >${escapeHtml(teacher.flag_note || '')}</textarea>
        </div>
        
        <div style="margin-top: 1rem;">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.875rem;">Capabilities & Preferences</h4>
          <p style="margin: 0 0 0.5rem 0; font-size: 0.75rem; opacity: 0.8;">
            Select which grades this teacher can teach for each subject, and their preference priority.
          </p>
          
          <div style="overflow-x: auto;">
            <table class="table-like">
              <thead>
                <tr>
                  <th>Subject</th>
                  ${SCHOOL_GRADE_RANGE.map(g => `<th class="grade-label">G${g}</th>`).join('')}
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
  `;
    
    // Render subject rows for this teacher
    subjects.forEach((subject, subjectIndex) => {
      const applicableGrades = getApplicableGrades(subject.subject_code);
      const capability = state.capabilities.find(c => 
        c.teacher_id === teacher.teacher_id && c.subject_code === subject.subject_code
      );
      const preference = state.preferences.find(p => 
        p.teacher_id === teacher.teacher_id && p.subject_code === subject.subject_code
      );
      
      const gradesCanTeach = capability ? capability.grades_can_teach : [];
      const priority = preference ? preference.priority : 2;
      const priorityKey = PRIORITY_VALUES[priority] || 'normal';
      
      // Generate a unique radio group name for this subject/teacher
      const radioGroupName = `priority-${teacher.teacher_id}-${subject.subject_code}`;
      
      html += `
        <tr>
          <td>
            <span class="code">${escapeHtml(subject.subject_code)}</span>
            <span style="margin-left: 0.25rem;">${escapeHtml(subject.subject_name)}</span>
          </td>
  `;
      
      // Render grade checkboxes
      SCHOOL_GRADE_RANGE.forEach(g => {
        const isApplicable = applicableGrades.includes(g);
        const isChecked = gradesCanTeach.includes(g);
        
        if (isApplicable) {
          html += `
            <td>
              <input 
                type="checkbox" 
                class="grade-checkbox" 
                data-teacher-index="${teacherIndex}" 
                data-subject-code="${subject.subject_code}"
                data-grade="${g}"
                ${isChecked ? 'checked' : ''}
              >
            </td>
          `;
        } else {
          html += `<td style="opacity: 0.3;">—</td>`;
        }
      });
      
      html += `
        <td>
          <div class="priority-radio-group" style="display: flex; gap: 0.25rem; flex-wrap: nowrap;">
            <label class="priority-chip priority-preferred" style="cursor: pointer;">
              <input 
                type="radio" 
                name="${radioGroupName}"
                value="1"
                data-teacher-index="${teacherIndex}"
                data-subject-code="${subject.subject_code}"
                ${priority === 1 ? 'checked' : ''}
                style="display: none;"
              >
              <span>Preferred</span>
            </label>
            <label class="priority-chip priority-normal" style="cursor: pointer;">
              <input 
                type="radio" 
                name="${radioGroupName}"
                value="2"
                data-teacher-index="${teacherIndex}"
                data-subject-code="${subject.subject_code}"
                ${priority === 2 ? 'checked' : ''}
                style="display: none;"
              >
              <span>Normal</span>
            </label>
            <label class="priority-chip priority-last-resort" style="cursor: pointer;">
              <input 
                type="radio" 
                name="${radioGroupName}"
                value="3"
                data-teacher-index="${teacherIndex}"
                data-subject-code="${subject.subject_code}"
                ${priority === 3 ? 'checked' : ''}
                style="display: none;"
              >
              <span>Last resort</span>
            </label>
          </div>
        </td>
        </tr>
      `;
    });
    
    html += `
              </tbody>
            </table>
          </div>
        </div>
        
        <div id="teacher-error-${teacherIndex}" class="error-message" style="display: none;"></div>
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  stepContainer.innerHTML = html;
  
  // Update priority chip visual states
  updatePriorityChipStates();
  
  // Re-setup event listeners after render
  setupEventListeners();
}

// Update visual state of priority chips based on radio selection
function updatePriorityChipStates() {
  document.querySelectorAll('.priority-radio-group').forEach(group => {
    const radio = group.querySelector('input[type="radio"]:checked');
    if (radio) {
      // Remove selected class from all chips in this group
      group.querySelectorAll('.priority-chip').forEach(chip => {
        chip.classList.remove('selected');
      });
      // Add selected class to the checked chip
      const checkedLabel = group.querySelector(`label[for="${radio.id}"]`) || radio.closest('label');
      if (checkedLabel) {
        checkedLabel.classList.add('selected');
      }
    }
  });
}

// Setup event listeners
function setupEventListeners() {
  // Add teacher button
  const addBtn = document.getElementById('add-teacher');
  if (addBtn) {
    addBtn.addEventListener('click', addTeacher);
  }
  
  // Teacher name inputs
  document.querySelectorAll('[id^="teacher-name-"]').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = e.target.id;
      const index = parseInt(id.split('-')[2]);
      const newState = getState();
      newState.teachers[index].teacher_name = e.target.value;
      updateState(newState);
      validateAndUpdateButton();
    });
  });
  
  // Max periods inputs
  document.querySelectorAll('[id^="max-periods-"]').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = e.target.id;
      const index = parseInt(id.split('-')[2]);
      const value = parseInt(e.target.value) || 0;
      const newState = getState();
      newState.teachers[index].max_periods_week = value;
      updateState(newState);
      validateAndUpdateButton();
    });
  });
  
  // Flag note textareas
  document.querySelectorAll('[id^="flag-note-"]').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = e.target.id;
      const index = parseInt(id.split('-')[2]);
      const newState = getState();
      newState.teachers[index].flag_note = e.target.value || null;
      updateState(newState);
    });
  });
  
  // Role toggle chips
  document.querySelectorAll('.toggle-chip[data-field="specialist"]').forEach(el => {
    el.addEventListener('click', (e) => {
      const teacherIndex = parseInt(el.dataset.teacherIndex);
      const value = el.dataset.value === 'true';
      
      // Deselect siblings
      document.querySelectorAll(`[data-teacher-index="${teacherIndex}"][data-field="specialist"]`).forEach(sibling => {
        sibling.classList.remove('selected');
      });
      
      // Select clicked
      el.classList.add('selected');
      
      // Update state
      const newState = getState();
      newState.teachers[teacherIndex].specialist = value;
      updateState(newState);
      validateAndUpdateButton();
    });
  });
  
  // Grade checkboxes
  document.querySelectorAll('.grade-checkbox').forEach(el => {
    el.addEventListener('change', (e) => {
      const teacherIndex = parseInt(el.dataset.teacherIndex);
      const subjectCode = el.dataset.subjectCode;
      const grade = parseInt(el.dataset.grade);
      const isChecked = e.target.checked;
      
      const newState = getState();
      const teacher = newState.teachers[teacherIndex];
      
      // Find or create capability
      let capability = newState.capabilities.find(c => 
        c.teacher_id === teacher.teacher_id && c.subject_code === subjectCode
      );
      
      if (!capability) {
        capability = {
          teacher_id: teacher.teacher_id,
          subject_code: subjectCode,
          grades_can_teach: []
        };
        newState.capabilities.push(capability);
      }
      
      // Update grades
      if (isChecked) {
        if (!capability.grades_can_teach.includes(grade)) {
          capability.grades_can_teach.push(grade);
        }
      } else {
        capability.grades_can_teach = capability.grades_can_teach.filter(g => g !== grade);
      }
      
      updateState(newState);
    });
  });
  
  // Priority radio buttons
  document.querySelectorAll('input[type="radio"][name^="priority-"]').forEach(el => {
    el.addEventListener('change', (e) => {
      const teacherIndex = parseInt(el.dataset.teacherIndex);
      const subjectCode = el.dataset.subjectCode;
      const priority = parseInt(el.value);
      
      const newState = getState();
      const teacher = newState.teachers[teacherIndex];
      
      // Find or create preference
      let preference = newState.preferences.find(p => 
        p.teacher_id === teacher.teacher_id && p.subject_code === subjectCode
      );
      
      if (!preference) {
        preference = {
          teacher_id: teacher.teacher_id,
          subject_code: subjectCode,
          grades: getApplicableGrades(subjectCode),
          priority: 2,
          granularity: 'subject_level'
        };
        newState.preferences.push(preference);
      }
      
      preference.priority = priority;
      preference.grades = getApplicableGrades(subjectCode);
      preference.granularity = 'subject_level';
      
      updateState(newState);
      
      // Update visual state
      updatePriorityChipStates();
    });
  });
  
  // Delete teacher buttons
  document.querySelectorAll('.delete-teacher').forEach(el => {
    el.addEventListener('click', (e) => {
      const index = parseInt(el.dataset.index);
      const newState = getState();
      const teacherId = newState.teachers[index].teacher_id;
      
      // Remove teacher
      newState.teachers.splice(index, 1);
      
      // Remove related capabilities and preferences
      newState.capabilities = newState.capabilities.filter(c => c.teacher_id !== teacherId);
      newState.preferences = newState.preferences.filter(p => p.teacher_id !== teacherId);
      
      updateState(newState);
      render();
      validateAndUpdateButton();
    });
  });
}

// Add a new teacher
function addTeacher() {
  const newState = getState();
  const newTeacher = {
    teacher_id: generateTeacherId(),
    teacher_name: '',
    max_periods_week: 0,
    specialist: false,
    confidence: 1.0,
    flag_note: null
  };
  newState.teachers.push(newTeacher);
  updateState(newState);
  render();
  validateAndUpdateButton();
  
  // Scroll to new teacher
  setTimeout(() => {
    const lastTeacher = document.querySelector('[data-teacher-index]:last-child');
    if (lastTeacher) lastTeacher.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

// Validate the step
function validateStep() {
  const state = getState();
  const errors = [];
  
  state.teachers.forEach((teacher, index) => {
    // Check required fields
    if (!teacher.teacher_name || teacher.teacher_name.trim() === '') {
      errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): Teacher name is required`);
    }
    
    // CRITICAL: Check for bare 'name' key
    if (teacher.name !== undefined && teacher.teacher_name === undefined) {
      errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): uses 'name' instead of 'teacher_name' - this is a known bug`);
    }
    
    if (typeof teacher.max_periods_week !== 'number') {
      errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): Max periods/week must be a number`);
    }
    
    if (typeof teacher.specialist !== 'boolean') {
      errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): Specialist must be a boolean`);
    }
    
    // Check capabilities
    const teacherCaps = state.capabilities.filter(c => c.teacher_id === teacher.teacher_id);
    teacherCaps.forEach(cap => {
      if (!cap.grades_can_teach || !Array.isArray(cap.grades_can_teach)) {
        errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): Capability for ${cap.subject_code} has invalid grades_can_teach`);
      }
    });
    
    // Check preferences
    const teacherPrefs = state.preferences.filter(p => p.teacher_id === teacher.teacher_id);
    teacherPrefs.forEach(pref => {
      if (![1, 2, 3].includes(pref.priority)) {
        errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): Preference for ${pref.subject_code} has invalid priority`);
      }
      if (pref.granularity !== 'subject_level') {
        errors.push(`Teacher ${index + 1} (${teacher.teacher_id}): Preference for ${pref.subject_code} has invalid granularity`);
      }
    });
  });
  
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
    detail: { step: 3, valid: errors.length === 0 } 
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
