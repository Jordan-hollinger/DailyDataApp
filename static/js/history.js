function dash(val) {
  return (val !== null && val !== undefined && val !== '') ? val : '—';
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function renderHistory() {
  const el = document.getElementById('historyContent');
  el.innerHTML = '<p class="no-data">Loading…</p>';

  try {
    const entries = await sheets.getRecentEntries(60);
    const sheetUrl = sheets.getSheetUrl();

    if (sheetUrl) {
      document.getElementById('openSheetBtn').href = sheetUrl;
      document.getElementById('openSheetBtn').style.display = 'inline-flex';
    }

    if (!entries.length) {
      el.innerHTML = '<p class="no-data">No entries yet. <a href="index.html">Log your first day.</a></p>';
      return;
    }

    const rows = entries.map(e => `
      <tr>
        <td>${dash(e.log_date)}</td>
        <td>${dash(e.sleep_hours)}</td>
        <td>${dash(e.sleep_quality)}</td>
        <td>${dash(e.overall_mood)}</td>
        <td>${dash(e.energy_level)}</td>
        <td>${dash(e.anxiety_level)}</td>
        <td>${dash(e.stress_level)}</td>
        <td>${dash(e.weight_lbs)}</td>
        <td>${e.exercised === 1 ? dash(e.exercise_minutes) + ' min' : 'No'}</td>
        <td>${e.drank_alcohol === 1 ? dash(e.alcohol_drinks) : 'No'}</td>
        <td>${dash(e.caffeine_cups)}</td>
        <td>${dash(e.water_cups)}</td>
        <td>${dash(e.outdoor_minutes)}</td>
        <td>${dash(e.bowel_movements)}</td>
        <td class="notes-cell">${e.personal_notes ? escHtml(e.personal_notes) : ''}</td>
      </tr>`).join('');

    el.innerHTML = `
      <div class="table-wrapper">
        <table class="history-table">
          <thead>
            <tr>
              <th>Date</th><th>Sleep hrs</th><th>Sleep Q</th>
              <th>Mood</th><th>Energy</th><th>Anxiety</th><th>Stress</th>
              <th>Weight</th><th>Exercise</th><th>Alcohol</th>
              <th>Caffeine</th><th>Water</th><th>Outdoor min</th>
              <th>BMs</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  } catch (err) {
    if (err.message === 'token_expired') {
      el.innerHTML = '<p class="no-data">Session expired. <a href="index.html">Sign in again.</a></p>';
    } else {
      el.innerHTML = `<p class="no-data">Error loading data: ${escHtml(err.message)}</p>`;
    }
  }
}

window.addEventListener('authReady', async () => {
  await sheets.init();
  renderHistory();
});
