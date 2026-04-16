# Daily Log App

A personal daily habit-tracking web app. Opens once a day, walks through a series of questions one at a time, and saves everything to a Google Sheet for analysis.

**Live app:** https://jordan-hollinger.github.io/DailyDataApp/

---

## What it does

- Wizard-style questionnaire covering sleep, food, exercise, substances, learning, mood, wellness scores, weight, and more
- Conditional questions (e.g. breakfast food only appears if you answered Yes to breakfast)
- Data saved to a Google Sheet in your own Google Drive after each session
- History view at `/history.html`
- CSV download for analysis in Excel or Google Sheets

---

## Tech stack

| Layer | Technology |
|---|---|
| Hosting | GitHub Pages (static) |
| Auth | Google Identity Services (OAuth 2.0 token flow) |
| Storage | Google Sheets API v4 |
| Frontend | Vanilla HTML / CSS / JavaScript — no build step |
| Draft buffer | Browser localStorage (in-progress sessions only) |

No backend server. No database. Everything runs in the browser.

---

## File structure

```
DailyDataApp/
├── index.html               # Main wizard page
├── history.html             # History / summary table
├── static/
│   ├── css/style.css        # All styles
│   └── js/
│       ├── config.js        # Google OAuth Client ID (safe to commit — not a secret)
│       ├── auth.js          # OAuth token lifecycle, sign-in/out
│       ├── sheets.js        # Google Sheets API calls + CSV export
│       ├── storage.js       # localStorage draft buffer only
│       ├── wizard.js        # Question definitions + wizard flow logic
│       └── history.js       # History page rendering
├── app.py                   # Flask local server (optional — for running offline)
├── database.py              # SQLite helpers (optional local use)
├── export.py                # CSV export for local Flask version
├── Start App.bat            # Double-click launcher for local Flask version
└── requirements.txt         # flask
```

---

## Google Cloud setup (already done)

- **Project:** Daily Log
- **API enabled:** Google Sheets API
- **OAuth client:** Web application
- **Authorized JavaScript origin:** `https://jordan-hollinger.github.io`
- **Test users:** jordan.a.hollinger@gmail.com
- **Client ID:** stored in `static/js/config.js`

To add more authorized users later: Google Cloud Console → APIs & Services → OAuth consent screen → Test users.

To publish beyond test mode (removes the test user restriction): OAuth consent screen → Publish App. For a personal app this isn't necessary.

---

## Making changes

All questions are defined in `static/js/wizard.js` in the `ALL_STEPS` array at the top of the file. Each step looks like:

```javascript
{ id: 'field_name', label: 'Question text?', type: 'yn' }
```

Types: `yn`, `likert`, `number`, `text`, `textarea`, `date`

Conditional steps use `showIf`:
```javascript
{ id: 'breakfast_food', label: 'What did you eat?', type: 'text',
  showIf: { field: 'ate_breakfast', value: true } }
```

**To add a new question:**
1. Add a column to the `COLUMNS` array in `static/js/sheets.js`
2. Add the step to `ALL_STEPS` in `static/js/wizard.js`
3. Commit and push — the new column will appear in the Sheet automatically on next save

**To deploy changes:**
```bash
git add .
git commit -m "description of change"
git push
```
GitHub Pages deploys automatically within ~1 minute. Hard refresh (Ctrl+Shift+R) to clear cache.

---

## Running locally (optional, no internet required)

The repo also includes a Python/Flask version that stores data in a local SQLite file instead of Google Sheets. Useful if you want to work offline or analyze data directly with Python.

```bash
pip install flask
python app.py
# Open http://localhost:5000
```

Or double-click `Start App.bat`.

---

## Data

Your Google Sheet is at: https://docs.google.com/spreadsheets/d/ *(link shown in app after sign-in)*

- One row per day
- Booleans stored as 0/1 in the sheet
- CSV download (Yes/No strings) available from the completion screen and history page
- The sheet is in your own Google Drive — you own it entirely
