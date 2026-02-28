async function loadConfig() {
  const res = await fetch('/config');
  return res.json();
}

let collectedAnswers = {};

function buildForm(config) {
  const form = document.getElementById('questions');
  form.innerHTML = '';

  let current = 0;
  collectedAnswers = {};

  const qText = document.createElement('div');
  qText.id = 'question-text';
  qText.className = 'question';

  const sliderWrapper = document.createElement('div');
  sliderWrapper.className = 'slider-wrapper';

  const valueDisplay = document.createElement('input');
  valueDisplay.type = 'number';
  valueDisplay.id = 'value-display';
  valueDisplay.className = 'value-display';
  valueDisplay.step = '0.1';


  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = 'question-slider';
  slider.min = config.meta.scale_min;
  slider.max = config.meta.scale_max;
  slider.step = '0.1';

  sliderWrapper.appendChild(slider);
  sliderWrapper.appendChild(valueDisplay);

  const nav = document.createElement('div');
  nav.className = 'question-nav';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.id = 'next-question';
  nextBtn.textContent = 'Weiter';

  const progress = document.createElement('div');
  progress.id = 'question-progress';

  nav.appendChild(progress);
  nav.appendChild(nextBtn);

  form.appendChild(qText);
  form.appendChild(sliderWrapper);
  form.appendChild(nav);

  function showQuestion(i) {
    const q = config.questions[i];
    qText.textContent = q.text;
    slider.dataset.qid = q.id;
    // set default value (middle of range) or previous answer
    const mid = (parseFloat(slider.min) + parseFloat(slider.max)) / 2;
    slider.value = (collectedAnswers[q.id] !== undefined) ? collectedAnswers[q.id] : mid;
    // set numeric input value (formatted)
    valueDisplay.value = parseFloat(slider.value).toFixed(1);
    // provide min/max on the numeric input and inputmode for mobile
    valueDisplay.min = slider.min;
    valueDisplay.max = slider.max;
    valueDisplay.inputMode = 'decimal';
    progress.textContent = `${i + 1} / ${config.questions.length} Fragen`;
    // update next button text on last question
    nextBtn.textContent = (i === config.questions.length - 1) ? 'Fertig' : 'Weiter';
  }

  slider.addEventListener('input', () => {
    const v = parseFloat(slider.value);
    // update numeric input
    valueDisplay.value = v.toFixed(1);
  });

  // allow manual edits in the numeric input and sync back to the slider
  // NOTE: do not aggressively reformat while typing so Backspace and edits work.
  valueDisplay.addEventListener('input', () => {
    const raw = valueDisplay.value.replace(',','.');
    // allow empty string while editing
    if (raw === '' || raw === '-' ) return;
    const v = parseFloat(raw);
    if (isNaN(v)) return;
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const clamped = Math.min(max, Math.max(min, v));
    // update slider but keep the user's current text untouched
    slider.value = clamped;
  });

  // click/focus behavior: click to focus and select all for easy typing
  valueDisplay.addEventListener('click', (e) => {
    valueDisplay.focus();
    valueDisplay.select();
  });
  valueDisplay.addEventListener('focus', () => valueDisplay.select());

  // prevent mouse wheel from changing value accidentally
  valueDisplay.addEventListener('wheel', (e) => e.preventDefault(), {passive:false});

  // Enter confirms input (blur -> will sync via input/blur handlers)
  valueDisplay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      valueDisplay.blur();
    }
  });

  // on blur ensure formatting/clamping and sync to slider
  valueDisplay.addEventListener('blur', () => {
    const raw = (valueDisplay.value || '').toString().replace(',','.');
    let v = parseFloat(raw);
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    if (isNaN(v)) v = (min + max) / 2;
    const clamped = Math.min(max, Math.max(min, v));
    const formatted = clamped.toFixed(1);
    valueDisplay.value = formatted;
    slider.value = clamped;
  });

  nextBtn.addEventListener('click', () => {
    const qid = slider.dataset.qid;
    collectedAnswers[qid] = parseFloat(slider.value);
    current += 1;
    if (current < config.questions.length) {
      showQuestion(current);
    } else {
      // finished all questions — show a short message and auto-submit
      form.innerHTML = '<p>Alle Fragen beantwortet. Ergebnisse werden geladen…</p>';
      submitAnswers();
    }
  });

  // start
  showQuestion(0);
  // start with UI ready
}

async function submitAnswers() {
  const config = await loadConfig();
  const payload = {};
  // use collectedAnswers (filled by slider flow); fall back to defaults if missing
  config.questions.forEach(q => {
    payload[q.id] = (collectedAnswers[q.id] !== undefined) ? collectedAnswers[q.id] : (parseFloat(config.meta.scale_min) + parseFloat(config.meta.scale_max)) / 2;
  });

  const res = await fetch('/score', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  const results = await res.json();
  showResults(results);
}

function showResults(results) {
  const list = document.getElementById('results');
  list.innerHTML = '';
  results.forEach(r => {
    const li = document.createElement('li');
    li.textContent = `${r.name}: ${r.score.toFixed(1)}%`;
    list.appendChild(li);
  });
  // reveal leaderboard when results are available
  const lb = document.getElementById('leaderboard');
  if (lb) lb.style.display = 'block';
}


// init
(async function () {
  const config = await loadConfig();
  document.getElementById('title').textContent = config.meta.title || 'Chooser';
  document.getElementById('description').textContent = config.meta.description || '';
  buildForm(config);
})();
