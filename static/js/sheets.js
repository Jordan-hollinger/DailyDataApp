const sheets = (() => {
  const SHEET_ID_KEY = 'dailylog_sheet_id';
  const SHEET_NAME   = 'Entries';
  const BASE_URL     = 'https://sheets.googleapis.com/v4/spreadsheets';

  const COLUMNS = [
    ['log_date',         'Date'],
    ['sleep_hours',      'Sleep Hours'],
    ['sleep_quality',    'Sleep Quality (1-5)'],
    ['ate_breakfast',    'Ate Breakfast'],
    ['breakfast_food',   'Breakfast Food'],
    ['worked_today',     'Worked Today'],
    ['worked_in_office', 'In Office'],
    ['exercised',        'Exercised'],
    ['exercise_type',    'Exercise Type'],
    ['exercise_minutes', 'Exercise Minutes'],
    ['ate_lunch',        'Ate Lunch'],
    ['lunch_food',       'Lunch Food'],
    ['drank_alcohol',    'Drank Alcohol'],
    ['alcohol_drinks',   'Number of Drinks'],
    ['ate_dinner',       'Ate Dinner'],
    ['dinner_food',      'Dinner Food'],
    ['snacked',          'Snacked'],
    ['snack_food',       'Snack Food'],
    ['read_today',       'Read Today'],
    ['read_minutes',     'Minutes Read'],
    ['learned_today',    'Spent Time Learning'],
    ['learning_topic',   'Learning Topic'],
    ['learning_minutes', 'Learning Minutes'],
    ['bowel_movements',  'Bowel Movements'],
    ['caffeine_cups',    'Caffeine Cups'],
    ['water_cups',       'Water Cups'],
    ['outdoor_minutes',  'Outdoor Minutes'],
    ['weight_lbs',       'Weight (lbs)'],
    ['energy_level',     'Energy Level (1-10)'],
    ['stress_level',     'Stress Level (1-10)'],
    ['anxiety_level',    'Anxiety Level (1-10)'],
    ['overall_mood',     'Overall Mood (1-10)'],
    ['personal_notes',   'Notes'],
  ];

  const BOOL_FIELDS = new Set([
    'ate_breakfast','worked_today','worked_in_office','exercised',
    'ate_lunch','drank_alcohol','ate_dinner','snacked','read_today','learned_today',
  ]);

  // Column range: A through AG (33 columns)
  const LAST_COL = 'AG';
  const FULL_RANGE = `${SHEET_NAME}!A:${LAST_COL}`;

  let _sheetId = localStorage.getItem(SHEET_ID_KEY);
  let _cache   = null; // cached array of entry objects

  function headers() { return { 'Authorization': `Bearer ${auth.getToken()}`, 'Content-Type': 'application/json' }; }

  async function apiFetch(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
    if (res.status === 401) {
      auth.clearToken();
      throw new Error('token_expired');
    }
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Sheets API ${res.status}: ${err}`);
    }
    return res.status === 204 ? null : res.json();
  }

  function dataToRow(data) {
    return COLUMNS.map(([field]) => {
      const v = data[field];
      return (v === null || v === undefined) ? '' : v;
    });
  }

  function rowToData(row) {
    const obj = {};
    COLUMNS.forEach(([field], i) => {
      const raw = row[i];
      if (raw === '' || raw === undefined || raw === null) { obj[field] = null; return; }
      const num = Number(raw);
      obj[field] = (!isNaN(num) && raw !== '') ? num : raw;
    });
    return obj;
  }

  async function readAllRows() {
    const json = await apiFetch(`/${_sheetId}/values/${FULL_RANGE}`, { method: 'GET', headers: {} });
    const rows = json.values || [];
    if (rows.length <= 1) return []; // header only or empty
    return rows.slice(1).map(rowToData); // skip header row
  }

  async function getOrCreateSheet() {
    if (_sheetId) return _sheetId;

    // Create new spreadsheet
    const created = await apiFetch('', {
      method: 'POST',
      body: JSON.stringify({
        properties: { title: 'Daily Log' },
        sheets: [{ properties: { title: SHEET_NAME } }],
      }),
    });
    _sheetId = created.spreadsheetId;
    localStorage.setItem(SHEET_ID_KEY, _sheetId);

    // Write headers
    await apiFetch(`/${_sheetId}/values/${SHEET_NAME}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      body: JSON.stringify({ values: [COLUMNS.map(([, label]) => label)] }),
    });

    return _sheetId;
  }

  return {
    async init() {
      await getOrCreateSheet();
    },

    async saveEntry(data) {
      _cache = null;
      const allRows = await readAllRows();
      const rowIdx = allRows.findIndex(r => r.log_date === data.log_date);

      if (rowIdx === -1) {
        // Append new row
        await apiFetch(`/${_sheetId}/values/${SHEET_NAME}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
          method: 'POST',
          body: JSON.stringify({ values: [dataToRow(data)] }),
        });
      } else {
        // Update existing row (rowIdx 0 = sheet row 2, since row 1 is headers)
        const sheetRow = rowIdx + 2;
        await apiFetch(`/${_sheetId}/values/${SHEET_NAME}!A${sheetRow}:${LAST_COL}${sheetRow}?valueInputOption=RAW`, {
          method: 'PUT',
          body: JSON.stringify({ values: [dataToRow(data)] }),
        });
      }
    },

    async getEntry(dateStr) {
      const all = await this.getAllEntries();
      return all.find(e => e.log_date === dateStr) || null;
    },

    async getAllEntries() {
      if (_cache) return _cache;
      _cache = await readAllRows();
      return _cache;
    },

    async getRecentEntries(limit = 60) {
      const all = await this.getAllEntries();
      return [...all].sort((a, b) => b.log_date.localeCompare(a.log_date)).slice(0, limit);
    },

    async exportCSV() {
      const rows = await this.getAllEntries();
      const sorted = [...rows].sort((a, b) => a.log_date.localeCompare(b.log_date));
      const lines = [COLUMNS.map(([, label]) => label).join(',')];
      for (const row of sorted) {
        const cells = COLUMNS.map(([field]) => {
          const val = row[field];
          if (val === null || val === undefined || val === '') return '';
          if (BOOL_FIELDS.has(field)) return val === 1 ? 'Yes' : 'No';
          const s = String(val);
          return (s.includes(',') || s.includes('"') || s.includes('\n'))
            ? `"${s.replace(/"/g,'""')}"` : s;
        });
        lines.push(cells.join(','));
      }
      const blob = new Blob([lines.join('\r\n')], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: 'daily_data.csv' });
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    },

    getSheetUrl() {
      return _sheetId ? `https://docs.google.com/spreadsheets/d/${_sheetId}` : null;
    },
  };
})();
