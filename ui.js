/* =============================================
   EXAMFORGE — UI.JS
   ============================================= */

// ── TOAST ─────────────────────────────────────
function showToast(msg, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3100);
}

// ── QUESTION BUILDER ──────────────────────────
let questionCounter = 0;

function buildQuestionCard(qData) {
  questionCounter++;
  const q = qData || {
    text: '', image: null,
    options: [{text:''},{text:''},{text:''},{text:''}],
    correctIndex: 0
  };

  const card = document.createElement('div');
  card.className = 'question-card';
  card.dataset.qnum = questionCounter;
  card._correctIndex = typeof q.correctIndex === 'number' ? q.correctIndex : 0;

  // Header
  const header = document.createElement('div');
  header.className = 'question-card-header';
  header.innerHTML = `<span class="question-num">Question #${questionCounter}</span>`;
  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn-danger';
  removeBtn.textContent = '✕ Remove';
  removeBtn.addEventListener('click', () => { card.remove(); renumberQuestions(); });
  header.appendChild(removeBtn);
  card.appendChild(header);

  // Question textarea
  const qta = document.createElement('textarea');
  qta.className = 'q-text-input';
  qta.placeholder = 'Type your question here...';
  qta.rows = 2;
  qta.value = q.text || '';
  card.appendChild(qta);

  // Image
  const imgSec = document.createElement('div');
  imgSec.className = 'question-image-section';
  imgSec.innerHTML = `<label>🖼️ Attach Image (optional)</label>`;
  const imgInput = document.createElement('input');
  imgInput.type = 'file'; imgInput.className = 'q-img-file'; imgInput.accept = 'image/*';
  const imgPrev = document.createElement('img');
  imgPrev.className = 'q-img-preview';
  if (q.image) { imgPrev.src = q.image; imgPrev.style.display = 'block'; }
  imgInput.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => { imgPrev.src = ev.target.result; imgPrev.style.display = 'block'; };
    r.readAsDataURL(file);
  });
  imgSec.appendChild(imgInput);
  imgSec.appendChild(imgPrev);
  card.appendChild(imgSec);

  // Options
  const optSec = document.createElement('div');
  optSec.className = 'options-section';
  const optLabel = document.createElement('div');
  optLabel.className = 'options-label';
  optLabel.textContent = '📝 Answer Options — click "Mark Correct" on the right answer';
  const optList = document.createElement('div');
  optList.className = 'options-list';
  optSec.appendChild(optLabel);
  optSec.appendChild(optList);
  card.appendChild(optSec);

  // Build 4 option rows
  const rows = [];
  for (let i = 0; i < 4; i++) {
    const row = _buildOptionRow(i, q.options[i]?.text || '', i === card._correctIndex, card, rows);
    rows.push(row);
    optList.appendChild(row.el);
  }

  return card;
}

function _buildOptionRow(index, text, isCorrect, card, rows) {
  const el = document.createElement('div');
  el.className = 'option-row' + (isCorrect ? ' is-correct' : '');

  const letterEl = document.createElement('div');
  letterEl.className = 'option-letter' + (isCorrect ? ' correct-opt' : '');
  letterEl.textContent = ['A','B','C','D'][index];

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.className = 'option-text-input';
  textInput.placeholder = `Option ${['A','B','C','D'][index]}...`;
  textInput.value = text;
  textInput.addEventListener('keydown', e => e.stopPropagation());
  textInput.addEventListener('click', e => e.stopPropagation());

  const markBtn = document.createElement('button');
  markBtn.className = 'mark-correct-btn';
  markBtn.textContent = isCorrect ? '✓ Correct' : 'Mark Correct';
  markBtn.type = 'button';
  markBtn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    rows.forEach(r => {
      r.el.classList.remove('is-correct');
      r.letterEl.classList.remove('correct-opt');
      r.markBtn.textContent = 'Mark Correct';
    });
    el.classList.add('is-correct');
    letterEl.classList.add('correct-opt');
    markBtn.textContent = '✓ Correct';
    card._correctIndex = index;
  });

  el.appendChild(letterEl);
  el.appendChild(textInput);
  el.appendChild(markBtn);
  return { el, letterEl, markBtn, textInput, index };
}

function renumberQuestions() {
  document.querySelectorAll('.question-card').forEach((c, i) => {
    c.dataset.qnum = i + 1;
    c.querySelector('.question-num').textContent = `Question #${i + 1}`;
  });
  questionCounter = document.querySelectorAll('.question-card').length;
}

// ── COLLECT FORM ──────────────────────────────
function collectExamData() {
  const title     = document.getElementById('exam-title').value.trim();
  const timeLimit = parseInt(document.getElementById('exam-time').value) || 0;
  const maxScore  = parseInt(document.getElementById('exam-max-score').value) || 100;
  const passScore = parseInt(document.getElementById('exam-pass-score').value) || 50;
  const editCode  = document.getElementById('exam-edit-code').value.trim();
  const resetCode = document.getElementById('exam-reset-code').value.trim();

  if (!title) { showToast('Please enter an exam title', 'error'); return null; }

  const cards = document.querySelectorAll('.question-card');
  if (!cards.length) { showToast('Add at least one question', 'error'); return null; }

  const questions = []; let valid = true;

  cards.forEach((card, idx) => {
    const text = card.querySelector('.q-text-input').value.trim();
    if (!text) { showToast(`Question ${idx+1} has no text`, 'error'); valid = false; return; }

    const imgEl = card.querySelector('.q-img-preview');
    const image = (imgEl && imgEl.style.display !== 'none' && imgEl.src &&
                   !imgEl.src.endsWith(window.location.href)) ? imgEl.src : null;

    const optInputs = card.querySelectorAll('.option-text-input');
    const options = []; let optValid = true;
    optInputs.forEach((inp, oi) => {
      const t = inp.value.trim();
      if (!t) { showToast(`Q${idx+1}: Option ${['A','B','C','D'][oi]} is empty`, 'error'); optValid = false; return; }
      options.push({ text: t });
    });
    if (!optValid) { valid = false; return; }

    questions.push({
      id: 'qs_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).slice(2,5),
      text, image, options,
      correctIndex: typeof card._correctIndex === 'number' ? card._correctIndex : 0
    });
  });

  if (!valid) return null;
  return { title, timeLimit, maxScore, passScore, editCode, resetCode, questions };
}

function clearCreateForm() {
  document.getElementById('exam-title').value = '';
  document.getElementById('exam-time').value = 0;
  document.getElementById('exam-max-score').value = 100;
  document.getElementById('exam-pass-score').value = 50;
  document.getElementById('exam-edit-code').value = '';
  document.getElementById('exam-reset-code').value = '';
  document.getElementById('questions-list').innerHTML = '';
  questionCounter = 0;
  window._editingExamId = null;
}

function populateCreateForm(exam) {
  document.getElementById('exam-title').value     = exam.title || '';
  document.getElementById('exam-time').value      = exam.timeLimit || 0;
  document.getElementById('exam-max-score').value = exam.maxScore || 100;
  document.getElementById('exam-pass-score').value= exam.passScore || 50;
  document.getElementById('exam-edit-code').value = exam.editCode || '';
  document.getElementById('exam-reset-code').value= exam.resetCode || '';
  document.getElementById('questions-list').innerHTML = '';
  questionCounter = 0;
  (exam.questions || []).forEach(q => {
    document.getElementById('questions-list').appendChild(buildQuestionCard(q));
  });
}

// ── RENDER EXAMS GRID ─────────────────────────
function renderExamsList() {
  const exams = DB.getAll();
  const grid  = document.getElementById('exams-list');
  grid.innerHTML = '';

  if (!exams.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No exams yet! Create one in the Create tab.</p></div>`;
    return;
  }

  exams.forEach((exam, i) => {
    const taken = !!exam.taken;

    // Outer wrapper — never blurred, holds everything
    const wrapper = document.createElement('div');
    wrapper.className = 'exam-card-wrapper';
    wrapper.style.animationDelay = (i * 0.07) + 's';

    // Inner card — this is the part that gets blurred + COMPLETED overlay
    const card = document.createElement('div');
    card.className = 'exam-card ' + (taken ? 'exam-card-taken' : 'exam-card-active');

    card.innerHTML = `
      <h3>${escHtml(exam.title)}</h3>
      <div class="exam-card-meta">
        <span class="chip chip-gold">🏆 ${exam.maxScore}</span>
        <span class="chip chip-green">✅ Pass:${exam.passScore}</span>
        ${exam.timeLimit > 0
          ? `<span class="chip chip-blue">⏱️ ${exam.timeLimit}min</span>`
          : '<span class="chip chip-purple">∞ No limit</span>'}
        ${exam.editCode ? '<span class="chip chip-red">🔐 Locked</span>' : ''}
        <span class="chip chip-blue">📋 ${exam.questions.length} Qs</span>
      </div>
      ${taken && exam.lastResult
        ? `<p style="font-size:.8rem;color:var(--text2);margin-top:4px;">
             Last: <strong>${escHtml(exam.lastResult.studentName)}</strong>
             — ${exam.lastResult.grade} (${exam.lastResult.percent}%)
           </p>`
        : ''}
    `;

    // Action buttons OUTSIDE the blurred card, in a separate footer strip
    const footer = document.createElement('div');
    footer.className = 'exam-card-footer';

    if (!taken) {
      footer.innerHTML = `
        <button class="btn-primary start-exam-btn" data-id="${exam.id}">▶ Start Exam</button>
        <button class="btn-secondary edit-exam-btn" data-id="${exam.id}">✏️ Edit</button>
        <button class="btn-danger delete-exam-btn" data-id="${exam.id}">🗑️ Delete</button>
      `;
    } else {
      footer.innerHTML = `
        <button class="btn-primary reset-exam-btn" data-id="${exam.id}">🔄 Reset</button>
        <button class="btn-secondary corrections-exam-btn" data-id="${exam.id}">📋 Corrections</button>
        <button class="btn-secondary export-single-btn" data-id="${exam.id}">📤 Export</button>
        <button class="btn-danger delete-exam-btn" data-id="${exam.id}">🗑️ Delete</button>
      `;
    }

    wrapper.appendChild(card);
    wrapper.appendChild(footer);
    grid.appendChild(wrapper);
  });
}

// ── CORRECTIONS ───────────────────────────────
function renderCorrections(exam, studentAnswers) {
  const container = document.getElementById('corrections-list');
  container.innerHTML = '';

  exam.questions.forEach((q, i) => {
    const studentAns = studentAnswers[q.id];
    const card = document.createElement('div');
    card.className = 'correction-card';

    let optHtml = '';
    q.options.forEach((opt, oi) => {
      let cls = 'neutral';
      let pre = ['A','B','C','D'][oi] + '. ';
      if (oi === q.correctIndex) { cls = 'correct'; pre = '✅ ' + pre; }
      else if (oi === studentAns) { cls = 'wrong'; pre = '❌ ' + pre; }
      optHtml += `<div class="cor-option ${cls}">${pre}${escHtml(opt.text)}</div>`;
    });

    const yourAns = studentAns !== undefined
      ? `${['A','B','C','D'][studentAns]}. ${escHtml(q.options[studentAns]?.text || 'Unknown')}`
      : 'Not answered';

    card.innerHTML = `
      <div class="correction-q">Q${i+1}: ${escHtml(q.text)}</div>
      ${q.image ? `<img src="${q.image}" style="max-width:min(260px,100%);max-height:140px;border-radius:8px;border:2px solid var(--border);margin-bottom:9px;object-fit:contain;display:block;"/>` : ''}
      <div style="font-size:.8rem;color:var(--text2);margin-bottom:6px;">Your answer: <strong>${yourAns}</strong></div>
      <div class="correction-options">${optHtml}</div>
    `;
    container.appendChild(card);
  });
}

// ── TAB SWITCHING ──────────────────────────────
function switchTab(name) {
  ['create','exams','take','corrections'].forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) el.style.display = 'none';
  });
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  const content = document.getElementById('tab-' + name);
  if (content) content.style.display = name === 'take' ? 'flex' : 'block';
  const btn = document.querySelector(`[data-tab="${name}"]`);
  if (btn) btn.classList.add('active');

  const deco = document.getElementById('floating-deco');
  if (deco) deco.style.display = (name === 'take') ? 'none' : '';
}

// ── SCREEN TRANSITIONS ────────────────────────
function showMenu() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('main-menu').style.display = 'flex';
}
function showApp(tab) {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  if (tab) switchTab(tab);
}

// ── CONFETTI ──────────────────────────────────
function launchConfetti(cid) {
  const c = document.getElementById(cid); if (!c) return;
  const cols = ['#f4831f','#eab308','#22c55e','#3b82f6','#8b5cf6','#ef4444','#fff'];
  for (let i = 0; i < 65; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `left:${Math.random()*100}%;background:${cols[Math.floor(Math.random()*cols.length)]};width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;border-radius:${Math.random()>.5?'50%':'2px'};animation-duration:${1.5+Math.random()*2}s;animation-delay:${Math.random()*.6}s;`;
    c.appendChild(p);
  }
  setTimeout(() => { if(c) c.innerHTML=''; }, 4500);
}

// ── GRADE + REMARKS ───────────────────────────
function calcGrade(p) {
  if (p>=90) return 'A+'; if (p>=80) return 'A'; if (p>=75) return 'B+';
  if (p>=70) return 'B';  if (p>=65) return 'C+';if (p>=60) return 'C';
  if (p>=50) return 'D';  return 'F';
}
const REMARKS = {
  excellent:['🌟 Outstanding! You\'ve set the bar for excellence!','🏆 Phenomenal! You\'re a true scholar!','🎓 Exceptional work! The classroom is proud!','⭐ Brilliant! Every question answered with mastery!','🌠 Extraordinary! You\'ve truly mastered this!'],
  good:['👍 Great job! You showed real understanding.','📚 Well done! A solid performance worth celebrating!','✅ Good work! Keep this momentum going!','🎯 Nice effort! You clearly studied hard.','💪 Strong performance! Be proud of yourself.'],
  average:['📖 Not bad! A bit more study and you\'ll nail it!','🤔 Average score. Review the material and try again!','📝 Room for improvement — you showed up and tried!','🔄 Decent attempt! Focus on the areas you missed.','💡 Halfway there! A little more effort goes a long way.'],
  poor:['😟 Tough one. Don\'t give up — review and try again!','📉 Below expectations. Ask your teacher for help!','🔁 You\'ll do better next time with more prep.','📌 Keep trying! Learning takes time and repetition.','💬 Don\'t be discouraged. Every mistake is a lesson!']
};
function getRandomRemark(p) {
  const pool = p>=80?REMARKS.excellent:p>=65?REMARKS.good:p>=50?REMARKS.average:REMARKS.poor;
  return pool[Math.floor(Math.random()*pool.length)];
}

// ── UTILS ─────────────────────────────────────
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
