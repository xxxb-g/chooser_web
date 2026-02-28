async function loadConfig() {
  const res = await fetch('/config');
  return res.json();
}

function buildForm(config) {
  const form = document.getElementById('questions');
  form.innerHTML = '';

  config.questions.forEach(q => {
    const wrapper = document.createElement('div');
    wrapper.className = 'question';

    const label = document.createElement('label');
    label.textContent = q.text;
    label.htmlFor = q.id;

    const input = document.createElement('input');
    input.type = 'number';
    input.id = q.id;
    input.name = q.id;
    input.min = config.meta.scale_min;
    input.max = config.meta.scale_max;
    input.step = '0.1';
    input.value = (config.meta.scale_min + config.meta.scale_max) / 2;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });
}

async function submitAnswers() {
  const config = await loadConfig();
  const payload = {};
  config.questions.forEach(q => {
    const el = document.getElementById(q.id);
    payload[q.id] = parseFloat(el.value);
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
