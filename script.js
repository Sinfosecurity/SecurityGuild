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
  quizQuestions = shuffle(combined).slice(0, 100);
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
  const total = quizQuestions.length;
  const current = quizIndex + 1;
  const progressPct = (current / total) * 100;

  let html = `<div class="quiz-progress" role="progressbar" aria-valuenow="${current}" aria-valuemin="1" aria-valuemax="${total}">
    <div class="quiz-progress__bar" style="width: ${progressPct}%"></div>
    <div class="quiz-progress__meta">
      <span class="quiz-progress__counter">${current} of ${total}</span>
      <span class="timer-badge" id="timer"></span>
    </div>
  </div>`;
  html += `<div class="quiz-card card">
    <p class="question-number">Question ${current}</p>
    <h2 class="question">${q.question}</h2>
    <div class="options" role="group" aria-label="Answer options">`;
  for (let key of Object.keys(q.options)) {
    html += `<button type="button" class="option-btn" data-opt="${key}">${key}. ${q.options[key]}</button>`;
  }
  html += `</div>
    <button type="button" class="btn btn--primary btn--next" id="next-btn" disabled>Next Question</button>
  </div>`;
  document.getElementById('quiz').innerHTML = html;

  let selected = null;
  const optionBtns = document.querySelectorAll('.options button');
  optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (selected) return;
      btn.classList.add(btn.dataset.opt === q.correct ? 'correct' : 'incorrect');
      if (btn.dataset.opt !== q.correct) {
        document.querySelector('.options button[data-opt="'+q.correct+'"]').classList.add('correct');
      }
      selected = btn;
      optionBtns.forEach(b => { b.disabled = true; });
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
  let html = `<div class="results-card card results-card--${pass ? 'pass' : 'fail'}">
    <div class="results-score">
      <div class="score-ring ${pass ? 'score-ring--pass' : 'score-ring--fail'}" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <circle class="score-ring__bg" cx="60" cy="60" r="54" />
          <circle class="score-ring__fill" cx="60" cy="60" r="54" style="stroke-dasharray: ${(percent / 100) * 339} 339" />
        </svg>
        <span class="score-ring__value">${percent}%</span>
      </div>
      <h2 class="results-title">${pass ? 'Passed' : 'Not Passed'}</h2>
      <p class="results-detail">${correctCount} of ${quizQuestions.length} correct</p>
    </div>
    <div class="results-actions">
      <button type="button" class="btn btn--primary" id="review-answers">Review Answers</button>
      <button type="button" class="btn btn--secondary" onclick="location.reload()">Retake Exam</button>
      <button type="button" class="btn btn--ghost" onclick="switchScreen('category')">Back to Categories</button>
    </div>
  </div>`;
  document.getElementById('results').innerHTML = html;
  switchScreen('results');
  document.getElementById('review-answers').addEventListener('click', reviewAnswers);
}

function reviewAnswers() {
  let html = '<div class="review-card card"><h2 class="review-title">Review Answers</h2><ul class="review-list">';
  quizQuestions.forEach((q, i) => {
    let ans = userAnswers[i];
    const isCorrect = ans.picked === ans.correct;
    html += `<li class="review-item ${isCorrect ? 'review-item--correct' : 'review-item--incorrect'}">
      <div class="review-item__header">
        <span class="review-item__num">Q${i+1}</span>
        <span class="review-item__badge">${isCorrect ? 'Correct' : 'Incorrect'}</span>
      </div>
      <p class="review-item__q">${q.question}</p>
      <p class="review-item__ans"><strong>Your answer:</strong> ${ans.picked}. ${q.options[ans.picked] || 'Did not answer'}</p>
      ${!isCorrect ? `<p class="review-item__correct"><strong>Correct:</strong> ${q.correct}. ${q.options[q.correct]}</p>` : ''}
      <p class="review-item__explain">${ans.explanation}</p>
    </li>`;
  });
  html += '</ul><button type="button" class="btn btn--ghost" onclick="switchScreen(\'category\')">Back to Categories</button></div>';
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
  const timerEl = document.getElementById('timer');
  if (timerEl) timerEl.textContent = `${min}:${sec}`;
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
    if (timerEl) timerEl.textContent = '';
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
    <div class="card notice">
      <h2 class="notice-title">${escapeHtml(title)}</h2>
      <p class="notice-message">${escapeHtml(message)}</p>
      <button type="button" class="btn btn--ghost" onclick="switchScreen('category')">Back to Categories</button>
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
