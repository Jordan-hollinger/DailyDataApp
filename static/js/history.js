function yn(val) {
  if (val === 1 || val === true)  return 'Yes';
  if (val === 0 || val === false) return 'No';
  return '—';
}

function dash(val) {
  return (val !== null && val !== undefined && val !== '') ? val : '—';
}

function renderHistory() {
  const entries = storage.getRecentEntries(60);
  const el = document.getElementById('historyContent');

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
      <td>${e.exercised === 1 ? (dash(e.exercise_minutes) + ' min') : 'No'}</td>
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
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

renderHistory();
