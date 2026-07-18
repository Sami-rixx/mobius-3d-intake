// Step 1: School & Policy
import { getState, updateState } from './state.js';
import { navigateToStep, currentStep, totalSteps } from './main.js';

// DOM elements
const stepContainer = document.getElementById('step-1');

// Field mappings
const fieldMappings = {
  'school-name': 'school.name',
  'filled-by': 'school.filled_by',
  'filled-at': 'school.filled_at',
  'q1-yes': { path: 'policy.generalists_grade_scope', value: 'unrestricted' },
  'q1-no': { path: 'policy.generalists_grade_scope', value: 'explicit_only' },
  'q2-stop': { path: 'policy.overload_policy', value: 'block' },
  'q2-go': { path: 'policy.overload_policy', value: 'allow_overload' },
  'q3-default': { path: 'policy.ambiguous_data_policy', value: 'use_default_and_warn' },
  'q3-block': { path: 'policy.ambiguous_data_policy', value: 'block_until_resolved' },
  'q4-yes': { path: 'policy.specialist_scope_lock', value: true },
  'q4-no': { path: 'policy.specialist_scope_lock', value: false }
};

// Toggle chip groups
const toggleGroups = {
  'q1': ['q1-yes', 'q1-no'],
  'q2': ['q2-stop', 'q2-go'],
  'q3': ['q3-default', 'q3-block'],
  'q4': ['q4-yes', 'q4-no']
};

// Initialize
function init() {
  render();
  setupEventListeners();
  
  // Validate on step change
  window.addEventListener('stepChange', (e) => {
    if (e.detail.step === 1) {
      validateAndUpdateButton();
    }
  });
  
  // Listen for validation requests from main.js
  window.addEventListener('validateStep', (e) => {
    if (e.detail.step === 1) {
      const errors = validateStep();
      if (errors.length > 0) {
        e.preventDefault();
      }
    }
  });
  
  // Validate on load
  validateAndUpdateButton();
}

// Render the step
function render() {
  const state = getState();
  
  stepContainer.innerHTML = `
    <div class="card">
      <h2>School Information</h2>
      
      <div class="form-group">
        <label class="form-label" for="school-name">School Name *</label>
        <input 
          type="text" 
          id="school-name" 
          class="form-input" 
          placeholder="Enter school name"
          value="${escapeHtml(state.school.name || '')}"
          required
        >
      </div>
      
      <div class="form-group">
        <label class="form-label" for="filled-by">Filled By</label>
        <input 
          type="text" 
          id="filled-by" 
          class="form-input" 
          placeholder="Your name"
          value="${escapeHtml(state.school.filled_by || '')}"
        >
      </div>
      
      <div class="form-group">
        <label class="form-label" for="filled-at">Date</label>
        <input 
          type="date" 
          id="filled-at" 
          class="form-input" 
          value="${state.school.filled_at || new Date().toISOString().split('T')[0]}"
        >
      </div>
    </div>
    
    <div class="card">
      <h2>Policy Questions</h2>
      
      <div class="form-group">
        <label class="form-label">Q1: Can generalist teachers be assigned to any grade, or only the ones you explicitly approve?</label>
        <div class="chip-grid">
          <button 
            type="button" 
            id="q1-yes" 
            class="toggle-chip ${state.policy.generalists_grade_scope === 'unrestricted' ? 'selected' : ''}"
          >Yes (any grade)</button>
          <button 
            type="button" 
            id="q1-no" 
            class="toggle-chip ${state.policy.generalists_grade_scope === 'explicit_only' ? 'selected' : ''}"
          >No (explicit only)</button>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Q2: If a teacher doesn't have enough hours to cover their load, what should happen?</label>
        <div class="chip-grid">
          <button 
            type="button" 
            id="q2-stop" 
            class="toggle-chip ${state.policy.overload_policy === 'block' ? 'selected' : ''}"
          >Stop and tell me</button>
          <button 
            type="button" 
            id="q2-go" 
            class="toggle-chip ${state.policy.overload_policy === 'allow_overload' ? 'selected' : ''}"
          >Go ahead anyway</button>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Q3: If some data is unclear or missing, what should happen?</label>
        <div class="chip-grid">
          <button 
            type="button" 
            id="q3-default" 
            class="toggle-chip ${state.policy.ambiguous_data_policy === 'use_default_and_warn' ? 'selected' : ''}"
          >Use a sensible default and warn me</button>
          <button 
            type="button" 
            id="q3-block" 
            class="toggle-chip ${state.policy.ambiguous_data_policy === 'block_until_resolved' ? 'selected' : ''}"
          >Stop and ask me to resolve it</button>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Q4: Does this school have subject specialists (teachers who only teach specific subjects)?</label>
        <div class="chip-grid">
          <button 
            type="button" 
            id="q4-yes" 
            class="toggle-chip ${state.policy.specialist_scope_lock === true ? 'selected' : ''}"
          >Yes</button>
          <button 
            type="button" 
            id="q4-no" 
            class="toggle-chip ${state.policy.specialist_scope_lock === false ? 'selected' : ''}"
          >No</button>
        </div>
      </div>
    </div>
  `;
  
  // Re-setup event listeners after render
  setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
  // Text inputs
  ['school-name', 'filled-by', 'filled-at'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        const field = fieldMappings[id];
        if (typeof field === 'string') {
          const [section, key] = field.split('.');
          const newState = getState();
          newState[section][key] = e.target.value;
          updateState(newState);
          validateAndUpdateButton();
        }
      });
    }
  });
  
  // Toggle chips
  Object.entries(toggleGroups).forEach(([group, ids]) => {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => {
          // Deselect all in group
          ids.forEach(otherId => {
            const otherEl = document.getElementById(otherId);
            if (otherEl) otherEl.classList.remove('selected');
          });
          
          // Select clicked
          el.classList.add('selected');
          
          // Update state
          const mapping = fieldMappings[id];
          if (mapping && mapping.path) {
            const newState = getState();
            const [section, key] = mapping.path.split('.');
            newState[section][key] = mapping.value;
            updateState(newState);
            validateAndUpdateButton();
          }
        });
      }
    });
  });
}

// Validate the step
function validateStep() {
  const state = getState();
  const errors = [];
  
  if (!state.school.name || state.school.name.trim() === '') {
    errors.push('School name is required');
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
