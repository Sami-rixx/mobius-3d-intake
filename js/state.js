// Single source of truth for form state
const state = {
  school: {
    name: '',
    filled_by: '',
    filled_at: new Date().toISOString().split('T')[0]
  },
  policy: {
    generalists_grade_scope: 'explicit_only',
    overload_policy: 'block',
    ambiguous_data_policy: 'use_default_and_warn',
    specialist_scope_lock: true
  },
  subjects: [],
  teachers: [],
  capabilities: [],
  preferences: []
};

// Helper to get a deep copy of state
export function getState() {
  return JSON.parse(JSON.stringify(state));
}

// Helper to update state
export function updateState(newPartialState) {
  Object.assign(state, newPartialState);
}

// Helper to reset state
export function resetState() {
  state.school = { name: '', filled_by: '', filled_at: new Date().toISOString().split('T')[0] };
  state.policy = { generalists_grade_scope: 'explicit_only', overload_policy: 'block', ambiguous_data_policy: 'use_default_and_warn', specialist_scope_lock: true };
  state.subjects = [];
  state.teachers = [];
  state.capabilities = [];
  state.preferences = [];
}

export { state };
