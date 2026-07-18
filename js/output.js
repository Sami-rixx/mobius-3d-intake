// Output actions for the intake form

// Gatechecker endpoint (stub)
const GATECHECKER_ENDPOINT = null; // TODO(Sam): set this once the live URL is available

/**
 * Download the payload as a JSON file
 * @param {Object} payload - The payload to download
 */
export function downloadJSON(payload) {
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

/**
 * Copy the payload to clipboard
 * @param {Object} payload - The payload to copy
 */
export async function copyJSON(payload) {
  try {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Send the payload to Gatechecker
 * @param {Object} payload - The payload to send
 */
export function sendToGatechecker(payload) {
  if (!GATECHECKER_ENDPOINT) {
    console.warn('Gatechecker endpoint not configured');
    return Promise.reject(new Error('Gatechecker endpoint not configured'));
  }
  
  return fetch(GATECHECKER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

/**
 * Show the review screen with output actions
 * @param {Object} payload - The payload to review
 */
export function showReviewScreen(payload) {
  const reviewContainer = document.getElementById('step-review');
  
  // Format the JSON for display
  const jsonString = JSON.stringify(payload, null, 2);
  
  reviewContainer.innerHTML = `
    <div class="card">
      <h2>Review Your Data</h2>
      <p style="margin-bottom: 1rem;">Your intake form is complete. Review the data below and choose an action:</p>
      
      <div style="background-color: rgba(27, 58, 92, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; overflow-x: auto;">
        <pre style="margin: 0; font-family: var(--font-mono); font-size: 0.75rem; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(jsonString)}</pre>
      </div>
      
      <div class="output-actions">
        <button id="download-json" class="btn btn-primary">Download JSON</button>
        <button id="copy-json" class="btn btn-secondary">Copy JSON</button>
        <button id="send-to-gatechecker" class="btn btn-secondary" ${GATECHECKER_ENDPOINT ? '' : 'disabled title="Gatechecker endpoint not configured"'}>Send to Gatechecker</button>
      </div>
      
      <div id="copy-confirmation" class="success-message" style="display: none; margin-top: 1rem;">
        JSON copied to clipboard!
      </div>
      
      <button id="back-to-edit-final" class="btn btn-danger" style="margin-top: 1rem;">Back to Edit</button>
    </div>
  `;
  
  reviewContainer.classList.add('active');
  
  // Set up event listeners
  document.getElementById('download-json').addEventListener('click', () => {
    downloadJSON(payload);
  });
  
  document.getElementById('copy-json').addEventListener('click', async () => {
    const success = await copyJSON(payload);
    if (success) {
      const confirmation = document.getElementById('copy-confirmation');
      confirmation.style.display = 'block';
      setTimeout(() => { confirmation.style.display = 'none'; }, 2000);
    } else {
      alert('Failed to copy to clipboard. Please try again.');
    }
  });
  
  document.getElementById('send-to-gatechecker').addEventListener('click', async () => {
    if (!GATECHECKER_ENDPOINT) {
      alert('Gatechecker endpoint is not configured. Please set GATECHECKER_ENDPOINT in output.js');
      return;
    }
    
    try {
      const response = await sendToGatechecker(payload);
      if (response.ok) {
        alert('Successfully sent to Gatechecker!');
      } else {
        alert(`Failed to send to Gatechecker: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      alert(`Error sending to Gatechecker: ${err.message}`);
    }
  });
  
  document.getElementById('back-to-edit-final').addEventListener('click', () => {
    reviewContainer.classList.remove('active');
    document.getElementById('step-3').classList.add('active');
    // Reset step navigation
    window.dispatchEvent(new CustomEvent('stepChange', { detail: { step: 3 } }));
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
