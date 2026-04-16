// localStorage draft buffer — stores in-progress wizard sessions only.
// Completed entries go to Google Sheets via sheets.js.
const storage = {
  saveDraft(answers)  { localStorage.setItem('dailylog_draft', JSON.stringify(answers)); },
  loadDraft()         { try { return JSON.parse(localStorage.getItem('dailylog_draft')); } catch (_) { return null; } },
  clearDraft()        { localStorage.removeItem('dailylog_draft'); },
};
