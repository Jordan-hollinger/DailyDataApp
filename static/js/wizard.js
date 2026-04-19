const ALL_STEPS = [
  { id: 'log_date',          label: 'What date are you logging?',                       type: 'date' },
  { id: 'sleep_hours',       label: 'How many hours of sleep did you get?',             type: 'number', step: 0.5, min: 0, max: 24 },
  { id: 'sleep_quality',     label: 'How would you rate your sleep quality?',           type: 'likert', scale: 5,  low: 'Terrible', high: 'Great' },
  { id: 'ate_breakfast',     label: 'Did you eat breakfast?',                           type: 'yn' },
  { id: 'breakfast_food',    label: 'What did you eat for breakfast?',                  type: 'text',   showIf: { field: 'ate_breakfast',  value: true } },
  { id: 'worked_today',      label: 'Did you work today?',                              type: 'yn' },
  { id: 'worked_in_office',  label: 'Were you in the office?',                         type: 'yn',     showIf: { field: 'worked_today',   value: true } },
  { id: 'exercised',         label: 'Did you exercise?',                                type: 'yn' },
  { id: 'exercise_type',     label: 'What type of exercise?',                           type: 'text',   showIf: { field: 'exercised',      value: true } },
  { id: 'exercise_minutes',  label: 'How many minutes did you exercise?',               type: 'number', min: 0, max: 600, showIf: { field: 'exercised',     value: true } },
  { id: 'ate_lunch',         label: 'Did you eat lunch?',                               type: 'yn' },
  { id: 'lunch_food',        label: 'What did you eat for lunch?',                      type: 'text',   showIf: { field: 'ate_lunch',      value: true } },
  { id: 'drank_alcohol',     label: 'Did you drink alcohol?',                           type: 'yn' },
  { id: 'alcohol_drinks',    label: 'How many alcoholic drinks did you have?',          type: 'number', min: 0, max: 50, showIf: { field: 'drank_alcohol',  value: true } },
  { id: 'ate_dinner',        label: 'Did you eat dinner?',                              type: 'yn' },
  { id: 'dinner_food',       label: 'What did you eat for dinner?',                     type: 'text',   showIf: { field: 'ate_dinner',     value: true } },
  { id: 'snacked',           label: 'Did you have any snacks?',                         type: 'yn' },
  { id: 'snack_food',        label: 'What did you snack on?',                           type: 'text',   showIf: { field: 'snacked',        value: true } },
  { id: 'read_today',        label: 'Did you read today?',                              type: 'yn' },
  { id: 'read_minutes',      label: 'How many minutes did you read?',                   type: 'number', min: 0, max: 600, showIf: { field: 'read_today',    value: true } },
  { id: 'learned_today',     label: 'Did you spend time learning something new?',       type: 'yn' },
  { id: 'learning_topic',    label: 'What did you learn about?',                        type: 'text',   showIf: { field: 'learned_today',  value: true } },
  { id: 'learning_minutes',  label: 'How many minutes did you spend learning?',         type: 'number', min: 0, max: 600, showIf: { field: 'learned_today', value: true } },
  { id: 'bowel_movements',   label: 'How many bowel movements did you have?',           type: 'number', min: 0, max: 20 },
  { id: 'caffeine_cups',     label: 'How many cups of caffeinated beverages did you drink?', type: 'number', min: 0, max: 20 },
  { id: 'water_cups',        label: 'How many cups of water did you drink?',            type: 'number', min: 0, max: 30 },
  { id: 'outdoor_minutes',   label: 'How many minutes did you spend outdoors?',         type: 'number', min: 0, max: 720 },
  { id: 'weight_lbs',        label: 'What is your weight today? (lbs)',                 type: 'number', step: 0.1, min: 50, max: 500 },
  { id: 'energy_level',      label: 'How was your energy level today?',                 type: 'likert', scale: 10, low: 'Exhausted',  high: 'Energized' },
  { id: 'stress_level',      label: 'How stressed were you today?',                     type: 'likert', scale: 10, low: 'None',       high: 'Extreme' },
  { id: 'anxiety_level',     label: 'How anxious did you feel today?',                  type: 'likert', scale: 10, low: 'None',       high: 'Extreme' },
  { id: 'overall_mood',      label: 'What was your overall mood today?',                type: 'likert', scale: 10, low: 'Terrible',   high: 'Amazing' },
  { id: 'personal_notes',    label: 'Anything unique or notable about today?',          type: 'textarea', hint: 'Optional — travel, illness, special events, etc.' },
];

let answers = {};
let currentIndex = 0;
let visibleSteps = [];

function isStepVisible(step) {
  if (!step.showIf) return true;
  return answers[step.showIf.field] === step.showIf.value;
}

function buildVisibleSteps() {
  visibleSteps = ALL_STEPS.filter(isStepVisible);
}

function today() {
  return new Date().toLocaleDateString('en-CA');
}

async function wizardInit() {
  const dateStr = today();
  try {
    const saved = await sheets.getEntry(dateStr);
    if (saved) {
      answers = {};
      for (const [k, v] of Object.entries(saved)) {
        if (v === null || v === undefined) continue;
        const step = ALL_STEPS.find(s => s.id === k);
        if (step && step.type === 'yn') {
          answers[k] = v === 1 || v === true;
        } else {
          answers[k] = v;
        }
      }
    } else {
      const draft = storage.loadDraft();
      if (draft) answers = draft;
    }
  } catch (err) {
    console.warn('Could not load entry from Sheets, using local draft:', err);
    const draft = storage.loadDraft();
    if (draft) answers = draft;
  }
  if (!answers.log_date) answers.log_date = dateStr;
  currentIndex = 0;
  buildVisibleSteps();
  renderStep();
}

function saveDraft() {
  storage.saveDraft(answers);
}

function renderStep() {
  buildVisibleSteps();
  const step = visibleSteps[currentIndex];
  if (!step) return;

  const total = visibleSteps.length;
  document.getElementById('progressBar').style.width = `${((currentIndex + 1) / total) * 100}%`;
  document.getElementById('progressLabel').textContent = `Step ${currentIndex + 1} of ${total}`;

  document.getElementById('btnBack').disabled = currentIndex === 0;
  document.getElementById('btnNext').textContent = currentIndex === visibleSteps.length - 1 ? 'Submit' : 'Next';

  const area = document.getElementById('questionArea');
  area.classList.remove('slide-in', 'slide-out');
  void area.offsetWidth;
  area.classList.add('slide-in');
  area.innerHTML = buildStepHTML(step);
  focusInput(step);
}

function buildStepHTML(step) {
  const val = answers[step.id];
  let inputHTML = '';

  if (step.type === 'date') {
    inputHTML = `<input class="date-input" id="stepInput" type="date" value="${val || today()}"
      onchange="answers['${step.id}']=this.value; saveDraft()">`;

  } else if (step.type === 'yn') {
    const yesSelected = val === true  ? 'selected' : '';
    const noSelected  = val === false ? 'selected' : '';
    inputHTML = `
      <div class="yn-row">
        <button class="yn-btn yes ${yesSelected}" onclick="selectYN('${step.id}', true)">Yes</button>
        <button class="yn-btn no  ${noSelected}"  onclick="selectYN('${step.id}', false)">No</button>
      </div>`;

  } else if (step.type === 'likert') {
    const btns = Array.from({length: step.scale}, (_, i) => i + 1).map(n => {
      const sel = val === n ? 'selected' : '';
      return `<button class="likert-btn ${sel}" onclick="selectLikert('${step.id}', ${n})">${n}</button>`;
    }).join('');
    inputHTML = `
      <div class="likert-row">${btns}</div>
      <div class="likert-anchors"><span>${step.low}</span><span>${step.high}</span></div>`;

  } else if (step.type === 'number') {
    const stepAttr = step.step || 1;
    const minAttr  = step.min !== undefined ? `min="${step.min}"` : '';
    const maxAttr  = step.max !== undefined ? `max="${step.max}"` : '';
    const curVal   = val !== undefined && val !== null ? val : '';
    inputHTML = `
      <div class="number-row">
        <button class="stepper-btn" onclick="stepNum('${step.id}', -${stepAttr})">−</button>
        <div class="number-input-wrap">
          <input class="question-input" id="stepInput" type="number"
            ${minAttr} ${maxAttr} step="${stepAttr}" value="${curVal}"
            oninput="answers['${step.id}']=parseFloat(this.value)||null; saveDraft()">
        </div>
        <button class="stepper-btn" onclick="stepNum('${step.id}', ${stepAttr})">+</button>
      </div>`;

  } else if (step.type === 'text') {
    inputHTML = `<input class="question-input" id="stepInput" type="text" value="${escHtml(val || '')}"
      oninput="answers['${step.id}']=this.value; saveDraft()"
      onkeydown="if(event.key==='Enter'){event.preventDefault();nextStep();}">`;

  } else if (step.type === 'textarea') {
    inputHTML = `<textarea class="question-textarea" id="stepInput"
      oninput="answers['${step.id}']=this.value; saveDraft()"
      onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();nextStep();}"
      >${escHtml(val || '')}</textarea>`;
  }

  const hint = step.hint ? `<p class="question-hint">${step.hint}</p>` : '';
  return `<p class="question-label">${step.label}</p>${hint}${inputHTML}`;
}

function focusInput(step) {
  if (['text', 'number', 'date', 'textarea'].includes(step.type)) {
    requestAnimationFrame(() => { const el = document.getElementById('stepInput'); if (el) el.focus(); });
  }
}

function selectYN(field, value) {
  answers[field] = value;
  saveDraft();
  ALL_STEPS.forEach(s => {
    if (s.showIf && s.showIf.field === field && s.showIf.value !== value) delete answers[s.id];
  });
  setTimeout(() => nextStep(), 200);
}

function selectLikert(field, value) {
  answers[field] = value;
  saveDraft();
  document.querySelectorAll('.likert-btn').forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.textContent) === value);
  });
}

function stepNum(field, delta) {
  const step = ALL_STEPS.find(s => s.id === field);
  const cur  = answers[field] ?? 0;
  let next   = Math.round((cur + delta) * 100) / 100;
  if (step.min !== undefined) next = Math.max(step.min, next);
  if (step.max !== undefined) next = Math.min(step.max, next);
  answers[field] = next;
  saveDraft();
  const el = document.getElementById('stepInput');
  if (el) el.value = next;
}

function nextStep() {
  buildVisibleSteps();
  if (currentIndex >= visibleSteps.length - 1) { submitWizard(); return; }
  currentIndex++;
  renderStep();
}

function prevStep() {
  if (currentIndex > 0) { currentIndex--; renderStep(); }
}

async function submitWizard() {
  const btnNext = document.getElementById('btnNext');
  btnNext.textContent = 'Saving…';
  btnNext.disabled = true;

  const payload = {};
  for (const [k, v] of Object.entries(answers)) {
    if (v === null || v === undefined || v === '') continue;
    payload[k] = typeof v === 'boolean' ? (v ? 1 : 0) : v;
  }

  try {
    await sheets.saveEntry(payload);
    storage.clearDraft();
    showCompletion();
  } catch (err) {
    btnNext.textContent = 'Submit';
    btnNext.disabled = false;
    if (err.message === 'token_expired') {
      alert('Your session expired. Please sign in again.');
      auth.signOut();
    } else {
      alert('Failed to save. Please try again.\n\n' + err.message);
    }
  }
}

function showCompletion() {
  document.getElementById('card').style.display = 'none';
  document.getElementById('progressBar').style.width = '100%';
  document.getElementById('progressLabel').textContent = 'Complete';

  const url = sheets.getSheetUrl();
  document.getElementById('sheetLink').href     = url || '#';
  document.getElementById('sheetLink').style.display = url ? 'inline-flex' : 'none';

  document.getElementById('summaryList').innerHTML = ALL_STEPS
    .filter(s => answers[s.id] !== undefined && answers[s.id] !== null && answers[s.id] !== '')
    .map(s => {
      let val = answers[s.id];
      if (s.type === 'yn') val = val ? 'Yes' : 'No';
      return `<span class="summary-key">${s.label.replace('?','')}</span><span class="summary-value">${escHtml(String(val))}</span>`;
    }).join('');

  document.getElementById('completionCard').style.display = 'block';
}

function startNew() {
  answers = { log_date: today() };
  currentIndex = 0;
  document.getElementById('completionCard').style.display = 'none';
  document.getElementById('card').style.display = 'block';
  buildVisibleSteps();
  renderStep();
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.addEventListener('keydown', e => {
  if (document.getElementById('completionCard').style.display !== 'none') return;
  const active = document.activeElement;
  const tag = active ? active.tagName : '';
  if (tag === 'TEXTAREA') return;
  if (tag === 'INPUT' && active.type !== 'number') return;
  if (e.key === 'Enter')    { e.preventDefault(); nextStep(); }
  if (e.key === 'Backspace' && tag !== 'INPUT') { e.preventDefault(); prevStep(); }
});

window.addEventListener('authReady', async (e) => {
  sheets.init().then(wizardInit).catch(console.error);
});
window.addEventListener('authSignedOut', () => {
  document.getElementById('card').style.display = 'block';
  document.getElementById('completionCard').style.display = 'none';
  answers = {};
});
