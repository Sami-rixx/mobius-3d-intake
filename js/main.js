// Boot and step router
import { getState, resetState } from './state.js';
import { buildPayload, validatePayload } from './schema.js';

// DOM elements
const stepperItems = document.querySelectorAll('.stepper-item');
const stepContainers = document.querySelectorAll('.step-container');
const prevBtn = document.getElementById('prev-step');
const nextBtn = document.getElementById('next-step');

let currentStep = 1;
const totalSteps = 3;

// Initialize
function init() {
  renderStepper();
  updateButtonStates();
  
  // Load step-specific scripts dynamically
  loadStepScripts();
  
  // Set up event listeners
  prevBtn.addEventListener('click', () => navigateToStep(currentStep - 1));
  nextBtn.addEventListener('click', () => handleNext());
  
  // Stepper click navigation
  stepperItems.forEach(item => {
    item.addEventListener('click', () => {
      const step = parseInt(item.dataset.step);
      if (step <= currentStep) {
        navigateToStep(step);
      }
    });
  });
}

// Load step-specific scripts
function loadStepScripts() {
  // Scripts are already loaded via <script> tags in index.html
  // This function is a placeholder for future dynamic loading if needed
}

// Navigate to a specific step
function navigateToStep(step) {
  if (step < 1 || step > totalSteps + 1) return;
  
  currentStep = step;
  renderStepper();
  renderStep();
  updateButtonStates();
  
  // Scroll to top of main content
  document.querySelector('.main-content').scrollTop = 0;
}

// Render stepper UI
function renderStepper() {
  stepperItems.forEach((item, index) => {
    const step = index + 1;
    item.classList.toggle('active', step === currentStep);
  });
}

// Render the current step
function renderStep() {
  stepContainers.forEach(container => {
    const step = parseInt(container.id.split('-')[1]);
    container.classList.toggle('active', step === currentStep);
  });
  
  // Dispatch custom event to notify step scripts
  window.dispatchEvent(new CustomEvent('stepChange', { detail: { step: currentStep } }));
}

// Update button states
function updateButtonStates() {
  prevBtn.disabled = currentStep <= 1;
  
  if (currentStep > totalSteps) {
    nextBtn.textContent = 'Finish';
    nextBtn.disabled = false;
  } else {
    nextBtn.textContent = 'Continue';
    // Step-specific validation will enable/disable this
  }
}

// Handle next button click
function handleNext() {
  if (currentStep <= totalSteps) {
    // Validate current step before proceeding
    if (validateCurrentStep()) {
      navigateToStep(currentStep + 1);
    }
  } else {
    // Final step: build and validate payload
    handleFinalSubmit();
  }
}

// Validate current step (delegated to step scripts)
function validateCurrentStep() {
  const event = new CustomEvent('validateStep', { 
    detail: { step: currentStep }, 
    bubbles: true,
    cancelable: true 
  });
  window.dispatchEvent(event);
  return !event.defaultPrevented;
}

// Handle final submission
function handleFinalSubmit() {
  const payload = buildPayload(getState());
  const errors = validatePayload(payload);
  
  if (errors.length > 0) {
    showValidationErrors(errors);
    return;
  }
  
  // Show review screen
  showReviewScreen(payload);
}

// Show validation errors
function showValidationErrors(errors) {
  const reviewContainer = document.getElementById('step-review');
  reviewContainer.innerHTML = `
    <div class="validation-summary">
      <h3>Please fix the following issues:</h3>
      <ul>
        ${errors.map(error => `<li>${error}</li>`).join('')}
      </ul>
    </div>
    <button id="back-to-edit" class="btn btn-primary">Back to Edit</button>
  `;
  
  reviewContainer.classList.add('active');
  document.getElementById('step-3').classList.remove('active');
  currentStep = totalSteps + 1;
  updateButtonStates();
  
  document.getElementById('back-to-edit').addEventListener('click', () => {
    reviewContainer.classList.remove('active');
    document.getElementById('step-3').classList.add('active');
    currentStep = totalSteps;
    updateButtonStates();
  });
}

// Show review screen
function showReviewScreen(payload) {
  const reviewContainer = document.getElementById('step-review');
  reviewContainer.innerHTML = `
    <div class="card">
      <h2>Review Your Data</h2>
      <p>Your intake form is ready. Choose an action:</p>
      <pre class="output-preview">${JSON.stringify(payload, null, 2)}</pre>
      <div class="output-actions">
        <button id="download-json" class="btn btn-primary">Download JSON</button>
        <button id="copy-json" class="btn btn-secondary">Copy JSON</button>
        <button id="send-to-gatechecker" class="btn btn-secondary" disabled>Send to Gatechecker</button>
      </div>
      <button id="back-to-edit-final" class="btn btn-danger" style="margin-top: 1rem;">Back to Edit</button>
    </div>
  `;
  
  reviewContainer.classList.add('active');
  document.getElementById('step-3').classList.remove('active');
  currentStep = totalSteps + 1;
  updateButtonStates();
  
  // Set up output actions
  document.getElementById('download-json').addEventListener('click', () => {
    downloadJSON(payload);
  });
  
  document.getElementById('copy-json').addEventListener('click', () => {
    copyJSON(payload);
  });
  
  document.getElementById('send-to-gatechecker').addEventListener('click', () => {
    sendToGatechecker(payload);
  });
  
  document.getElementById('back-to-edit-final').addEventListener('click', () => {
    reviewContainer.classList.remove('active');
    document.getElementById('step-3').classList.add('active');
    currentStep = totalSteps;
    updateButtonStates();
  });
}

// Download JSON
function downloadJSON(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mobius-intake-${payload.school.name || 'data'}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Copy JSON to clipboard
async function copyJSON(payload) {
  try {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    const btn = document.getElementById('copy-json');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = originalText; }, 2000);
  } catch (err) {
    alert('Failed to copy: ' + err.message);
  }
}

// Send to Gatechecker (stub)
function sendToGatechecker(payload) {
  const GATECHECKER_ENDPOINT = null; // TODO(Sam): set this once the live URL is available
  if (!GATECHECKER_ENDPOINT) {
    alert('Gatechecker endpoint not configured. Please set GATECHECKER_ENDPOINT in output.js');
    return;
  }
  // Implementation for when endpoint is available
  fetch(GATECHECKER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(response => response.json())
    .then(data => alert('Sent to Gatechecker: ' + JSON.stringify(data)))
    .catch(err => alert('Error: ' + err.message));
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);

// Export for step scripts to use
export { navigateToStep, currentStep, totalSteps, updateButtonStates };
