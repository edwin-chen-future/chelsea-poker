const API_BASE = '/api/sessions';

// Set today's date as the default for the date field
(function setDefaultDate() {
  const dateInput = document.getElementById('session_date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
})();

// --- Form submission ---

document.getElementById('session-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const submitBtn = document.getElementById('submit-btn');
  const messageEl = document.getElementById('form-message');

  clearMessage(messageEl);
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  const payload = {
    stake: form.stake.value,
    duration_minutes: parseInt(form.duration_minutes.value, 10),
    result_amount: parseFloat(form.result_amount.value),
    location: form.location.value,
    session_date: form.session_date.value,
    notes: form.notes.value || null,
  };

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Unknown error');
    }

    showMessage(messageEl, 'Session saved!', 'success');
    form.reset();
    // Restore default date after reset
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('session_date').value = today;
    await loadSessions();
  } catch (err) {
    showMessage(messageEl, `Error: ${err.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Session';
  }
});

// --- Load and render session history ---

async function loadSessions() {
  const container = document.getElementById('history-container');

  try {
    const res = await fetch(API_BASE);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const sessions = await res.json();
    renderSessions(sessions);
    renderStats(sessions);
  } catch (err) {
    container.innerHTML = `<div class="message error" style="display:block">Failed to load sessions: ${err.message}</div>`;
  }
}

function renderSessions(sessions) {
  const container = document.getElementById('history-container');

  if (sessions.length === 0) {
    container.innerHTML = '<div class="empty-state">No sessions recorded yet. Add your first session above!</div>';
    return;
  }

  const rows = sessions.map((s) => {
    const resultClass = Number(s.result_amount) >= 0 ? 'win' : 'loss';
    const resultSign = Number(s.result_amount) >= 0 ? '+' : '';
    const durationText = formatDuration(s.duration_minutes);

    return `
      <tr>
        <td>${escapeHtml(s.session_date)}</td>
        <td>${escapeHtml(s.stake)}</td>
        <td>${escapeHtml(s.location)}</td>
        <td>${durationText}</td>
        <td class="${resultClass}">${resultSign}$${Math.abs(Number(s.result_amount)).toFixed(2)}</td>
        <td>${s.notes ? escapeHtml(s.notes) : '—'}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Stake</th>
          <th>Location</th>
          <th>Duration</th>
          <th>Result</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderStats(sessions) {
  const statsEl = document.getElementById('stats');
  if (sessions.length === 0) {
    statsEl.style.display = 'none';
    return;
  }

  const total = sessions.reduce((sum, s) => sum + Number(s.result_amount), 0);
  const avg = total / sessions.length;

  document.getElementById('stat-count').textContent = sessions.length;

  const totalEl = document.getElementById('stat-total');
  totalEl.textContent = `${total >= 0 ? '+' : ''}$${total.toFixed(2)}`;
  totalEl.className = total >= 0 ? 'positive' : 'negative';

  const avgEl = document.getElementById('stat-avg');
  avgEl.textContent = `${avg >= 0 ? '+' : ''}$${avg.toFixed(2)}`;
  avgEl.className = avg >= 0 ? 'positive' : 'negative';

  statsEl.style.display = 'flex';
}

// --- Utilities ---

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = `message ${type}`;
}

function clearMessage(el) {
  el.textContent = '';
  el.className = 'message';
}

// Initial load
loadSessions();
