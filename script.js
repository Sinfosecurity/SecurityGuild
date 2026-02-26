// NYS Security Guard Quiz JS

const QUESTION_FILES = [
  'questions/role_of_security_guard.json',
  'questions/legal_powers_limitations.json',
  'questions/emergency_situations.json',
  'questions/communications_public_relations.json',
  'questions/access_control.json',
  'questions/ethics_conduct.json'
];
const CATEGORY_LABELS = {
  'role_of_security_guard': 'Role of Security Guard',
  'legal_powers_limitations': 'Legal Powers & Limitations',
  'emergency_situations': 'Emergency Situations',
  'communications_public_relations': 'Communications & Public Relations',
  'access_control': 'Access Control',
  'ethics_conduct': 'Ethics & Conduct'
};
const PASSING_SCORE = 0.7;
let allQuestions = {};
let quizQuestions = [];
let userAnswers = [];
let quizCategory = null;
let quizIndex = 0;
let timer = null;
let startTime = null;
let timeLimit = 60 * 60; // 60 min for mock exam mode

document.addEventListener('DOMContentLoaded', async () => {
  setCategoryControlsEnabled(false);
  try {
    await loadAllQuestions();
    setupCategoryListeners();
    document.getElementById('start-mock-exam').addEventListener('click', startMockExam);
    setCategoryControlsEnabled(true);
  } catch (err) {
    console.error(err);
    showCategoryNotice(
      'Could not load questions.',
      'If you opened this with file://, your browser may block loading JSON files. Run a local server instead (see README), then refresh.'
    );
  }
});

async function loadAllQuestions() {
  for (let file of QUESTION_FILES) {
    let key = file.split('/')[1].replace('.json', '');
    const res = await fetch(file);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${file} (${res.status} ${res.statusText})`);
    }
    const json = await res.json();
    if (!Array.isArray(json)) {
      throw new Error(`Invalid questions format in ${file}: expected an array`);
    }
    allQuestions[key] = json;
  }
}

function setupCategoryListeners() {
  document.querySelectorAll('.categories button').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      startQuiz(category);
    });
  });
}

function startQuiz(category) {
  quizCategory = category;
  const bank = allQuestions[category];
  if (!Array.isArray(bank) || bank.length === 0) {
    renderNoticeScreen(
      'No questions yet for this category.',
      `Add questions to questions/${category}.json, then refresh.`
    );
    return;
  }
  quizQuestions = shuffle([...bank]).slice(0, 25);
  quizIndex = 0;
  userAnswers = [];
  switchScreen('quiz');
  renderQuestion();
  clearTimer();
  document.querySelector('#quiz').scrollIntoView({behavior:'smooth'});
}

function startMockExam() {
  // Combine all, random 25 questions
  let combined = Object.values(allQuestions).flat();
  if (!Array.isArray(combined) || combined.length === 0) {
    renderNoticeScreen(
      'No questions available yet.',
      'Add questions to the JSON files in questions/, then refresh.'
    );
    return;
  }
  quizQuestions = shuffle(combined).slice(0, 25);
  quizCategory = 'mock';
  quizIndex = 0;
  userAnswers = [];
  switchScreen('quiz');
  renderQuestion();
  // Start timer
  startTime = Date.now();
  timer = setInterval(updateTimer, 1000);
  updateTimer();
}

function switchScreen(screen) {
  document.getElementById('category-selection').classList.toggle('hidden', screen !== 'category');
  document.getElementById('quiz').classList.toggle('hidden', screen !== 'quiz');
  document.getElementById('results').classList.toggle('hidden', screen !== 'results');
  document.getElementById('review').classList.toggle('hidden', screen !== 'review');
}

function renderQuestion() {
  const q = quizQuestions[quizIndex];
  if (!q) {
    renderNoticeScreen('No question to display.', 'Your question bank may be empty or malformed.');
    return;
  }
  let html = `<div class="timer" id="timer"></div>`;
  html += `<div class="question">Q${quizIndex + 1}: ${q.question}</div>`;
  html += '<div class="options">';
  for (let key of Object.keys(q.options)) {
    html += `<button data-opt="${key}">${key}. ${q.options[key]}</button>`;
  }
  html += '</div>';
  html += `<button class="next-btn" id="next-btn" disabled>Next</button>`;
  document.getElementById('quiz').innerHTML = html;

  let selected = null;
  document.querySelectorAll('.options button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (selected) return;
      btn.classList.add(btn.dataset.opt === q.correct ? 'correct' : 'incorrect');
      if (btn.dataset.opt !== q.correct) {
        // show correct
        document.querySelector('.options button[data-opt="'+q.correct+'"]').classList.add('correct');
      }
      selected = btn;
      userAnswers.push({ picked: btn.dataset.opt, correct: q.correct, explanation: q.explanation });
      document.getElementById('next-btn').disabled = false;
    });
  });
  document.getElementById('next-btn').addEventListener('click', nextQuestion);
  if (quizCategory === 'mock') updateTimer();
}

function nextQuestion() {
  quizIndex++;
  if (quizIndex < quizQuestions.length) {
    renderQuestion();
  } else {
    clearTimer();
    showResults();
  }
}

function showResults() {
  let correctCount = userAnswers.filter(ans => ans.picked === ans.correct).length;
  let percent = Math.round((correctCount / quizQuestions.length) * 100);
  let pass = percent >= PASSING_SCORE * 100;
  let html = `<div class="results-summary">
    <h2>Results</h2>
    <p>You scored ${correctCount} / ${quizQuestions.length}, or <span class="${pass ? 'score-pass' : 'score-fail'}">${percent}% (${pass ? 'PASS' : 'FAIL'})</span></p>
    <button id="review-answers">Review Answers</button>
    <button onclick="location.reload()">Try Again</button>
    <button onclick="switchScreen('category')">Back to Categories</button>
  </div>`;
  document.getElementById('results').innerHTML = html;
  switchScreen('results');
  document.getElementById('review-answers').addEventListener('click', reviewAnswers);
}

function reviewAnswers() {
  let html = '<div class="review-list"><h2>Review Answers</h2><ul>';
  quizQuestions.forEach((q, i) => {
    let ans = userAnswers[i];
    html += `<li><b>Q${i+1}:</b> ${q.question}<br>
      <b>Your answer:</b> ${ans.picked} (${q.options[ans.picked] || 'Did not answer'})<br>
      <b>Correct answer:</b> ${q.correct} (${q.options[q.correct]})<br>
      <i>Explanation: ${ans.explanation}</i>
    </li><hr>`;
  });
  html += '</ul><button onclick="switchScreen(\'category\')">Back to Categories</button></div>';
  document.getElementById('review').innerHTML = html;
  switchScreen('review');
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function updateTimer() {
  if (!startTime) return;
  let elapsed = Math.floor((Date.now() - startTime) / 1000);
  let remaining = Math.max(0, timeLimit - elapsed);
  let min = Math.floor(remaining / 60);
  let sec = (remaining % 60).toString().padStart(2, '0');
  document.getElementById('timer').innerText = `Time left: ${min}:${sec}`;
  if (remaining <= 0) {
    clearTimer();
    showResults();
  }
}
function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    startTime = null;
    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.innerText = '';
  }
}

function setCategoryControlsEnabled(enabled) {
  document.querySelectorAll('.categories button, #start-mock-exam').forEach(el => {
    el.disabled = !enabled;
  });
}

function showCategoryNotice(title, message) {
  const container = document.querySelector('#category-selection');
  if (!container) return;
  const existing = container.querySelector('.notice');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = 'notice';
  div.innerHTML = `<b>${escapeHtml(title)}</b><div>${escapeHtml(message)}</div>`;
  container.appendChild(div);
}

function renderNoticeScreen(title, message) {
  clearTimer();
  switchScreen('quiz');
  document.getElementById('quiz').innerHTML = `
    <div class="notice">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(message)}</p>
      <button class="next-btn" onclick="switchScreen('category')">Back to Categories</button>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
