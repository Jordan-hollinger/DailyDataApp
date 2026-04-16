// localStorage data layer — replaces the Flask/SQLite backend

const STORAGE_KEY = 'dailylog_entries';

const BOOL_FIELDS = new Set([
  'ate_breakfast','worked_today','worked_in_office','exercised',
  'ate_lunch','drank_alcohol','ate_dinner','snacked',
  'read_today','learned_today',
]);

const CSV_COLUMNS = [
  ['log_date',          'Date'],
  ['sleep_hours',       'Sleep Hours'],
  ['sleep_quality',     'Sleep Quality (1-5)'],
  ['ate_breakfast',     'Ate Breakfast'],
  ['breakfast_food',    'Breakfast Food'],
  ['worked_today',      'Worked Today'],
  ['worked_in_office',  'In Office'],
  ['exercised',         'Exercised'],
  ['exercise_type',     'Exercise Type'],
  ['exercise_minutes',  'Exercise Minutes'],
  ['ate_lunch',         'Ate Lunch'],
  ['lunch_food',        'Lunch Food'],
  ['drank_alcohol',     'Drank Alcohol'],
  ['alcohol_drinks',    'Number of Drinks'],
  ['ate_dinner',        'Ate Dinner'],
  ['dinner_food',       'Dinner Food'],
  ['snacked',           'Snacked'],
  ['snack_food',        'Snack Food'],
  ['read_today',        'Read Today'],
  ['read_minutes',      'Minutes Read'],
  ['learned_today',     'Spent Time Learning'],
  ['learning_topic',    'Learning Topic'],
  ['learning_minutes',  'Learning Minutes'],
  ['bowel_movements',   'Bowel Movements'],
  ['caffeine_cups',     'Caffeine Cups'],
  ['water_cups',        'Water Cups'],
  ['outdoor_minutes',   'Outdoor Minutes'],
  ['weight_lbs',        'Weight (lbs)'],
  ['energy_level',      'Energy Level (1-10)'],
  ['stress_level',      'Stress Level (1-10)'],
  ['anxiety_level',     'Anxiety Level (1-10)'],
  ['overall_mood',      'Overall Mood (1-10)'],
  ['personal_notes',    'Notes'],
];

function _loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (_) {
    return {};
  }
}

function _saveAll(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

const storage = {
  getEntry(dateStr) {
    return _loadAll()[dateStr] || null;
  },

  saveEntry(data) {
    const entries = _loadAll();
    entries[data.log_date] = { ...entries[data.log_date], ...data, updated_at: new Date().toISOString() };
    if (!entries[data.log_date].created_at) {
      entries[data.log_date].created_at = new Date().toISOString();
    }
    _saveAll(entries);
    return data.log_date;
  },

  getAllEntries(start, end) {
    const entries = _loadAll();
    return Object.values(entries)
      .filter(e => {
        if (start && e.log_date < start) return false;
        if (end   && e.log_date > end)   return false;
        return true;
      })
      .sort((a, b) => a.log_date.localeCompare(b.log_date));
  },

  getRecentEntries(limit = 60) {
    const entries = _loadAll();
    return Object.values(entries)
      .sort((a, b) => b.log_date.localeCompare(a.log_date))
      .slice(0, limit);
  },

  exportCSV(start, end, numeric = false) {
    const rows = this.getAllEntries(start, end);
    const lines = [CSV_COLUMNS.map(([, label]) => label).join(',')];
    for (const row of rows) {
      const cells = CSV_COLUMNS.map(([field]) => {
        const val = row[field];
        if (val === null || val === undefined || val === '') return '';
        if (BOOL_FIELDS.has(field) && !numeric) return val === 1 ? 'Yes' : 'No';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"` : str;
      });
      lines.push(cells.join(','));
    }
    const csv = lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = start && end ? `daily_data_${start}_to_${end}.csv` : 'daily_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
