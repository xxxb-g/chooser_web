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

  const valueDisplay = document.createElement('div');
  valueDisplay.id = 'value-display';
  valueDisplay.className = 'value-display';

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
    valueDisplay.textContent = parseFloat(slider.value).toFixed(1);
    progress.textContent = `${i + 1} / ${config.questions.length}`;
    // update next button text on last question
    nextBtn.textContent = (i === config.questions.length - 1) ? 'Fertig' : 'Weiter';
  }

  slider.addEventListener('input', () => {
    const v = parseFloat(slider.value);
    document.getElementById('value-display').textContent = v.toFixed(1);
  });

  nextBtn.addEventListener('click', () => {
    const qid = slider.dataset.qid;
    collectedAnswers[qid] = parseFloat(slider.value);
    current += 1;
    if (current < config.questions.length) {
      showQuestion(current);
    } else {
      // finished all questions
      document.getElementById('submit').disabled = false;
      // hide the question UI or show summary
      form.innerHTML = '<p>Alle Fragen beantwortet. Klicke auf "Auswerten".</p>';
    }
  });

  // start
  showQuestion(0);
  // disable submit until finished
  document.getElementById('submit').disabled = true;
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
}

document.getElementById('submit').addEventListener('click', function (e) {
  e.preventDefault();
  submitAnswers();
});

// init
(async function () {
  const config = await loadConfig();
  document.getElementById('title').textContent = config.meta.title || 'Chooser';
  document.getElementById('description').textContent = config.meta.description || '';
  buildForm(config);
})();
