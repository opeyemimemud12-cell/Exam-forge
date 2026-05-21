/* =============================================
   EXAMFORGE — MAIN.JS
   ============================================= */

let pendingExamId  = null;
let pendingEditId  = null;
let pendingResetId = null;

window.addEventListener('DOMContentLoaded', () => {
  console.log('%c📚 ExamForge — School Exam Platform', 'font-size:18px;font-weight:bold;color:#f4831f;');
  console.log('%cMaster reset code is confidential — check with your administrator.', 'color:#6b5e4e;font-style:italic;');

  const loadScreen = document.getElementById('loading-screen');
  setTimeout(() => {
    loadScreen.classList.add('fade-out');
    setTimeout(() => { loadScreen.style.display = 'none'; showMenu(); }, 700);
  }, 2700);

  bindEvents();
});

function bindEvents() {

  // ── MAIN MENU ──
  document.getElementById('menu-create').addEventListener('click', () => showApp('create'));
  document.getElementById('menu-exams').addEventListener('click',  () => { renderExamsList(); showApp('exams'); });
  document.getElementById('menu-import').addEventListener('click', () => document.getElementById('menu-import-file').click());
  document.getElementById('menu-import-file').addEventListener('change', importExam);

  // ── HEADER ──
  document.getElementById('home-btn').addEventListener('click', showMenu);
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === 'exams') renderExamsList();
      switchTab(btn.dataset.tab);
    });
  });

  // ── CREATE TAB ──
  document.getElementById('add-question-btn').addEventListener('click', () => {
    const card = buildQuestionCard();
    document.getElementById('questions-list').appendChild(card);
    card.scrollIntoView({ behavior:'smooth', block:'center' });
  });
  document.getElementById('save-exam-btn').addEventListener('click', saveExam);
  document.getElementById('export-exam-btn').addEventListener('click', exportCurrentForm);
  document.getElementById('clear-form-btn').addEventListener('click', () => {
    if (confirm('Clear the form? Unsaved data will be lost.')) clearCreateForm();
  });

  // ── EXAMS TAB (delegated — covers both .exam-card and .exam-card-footer) ──
  document.getElementById('exams-list').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('start-exam-btn'))       startExamFlow(id);
    if (btn.classList.contains('edit-exam-btn'))        editExamFlow(id);
    if (btn.classList.contains('delete-exam-btn'))      deleteExamFlow(id);
    if (btn.classList.contains('reset-exam-btn'))       resetExamFlow(id);
    if (btn.classList.contains('export-single-btn'))    exportSingleExam(id);
    if (btn.classList.contains('corrections-exam-btn')) viewCorrectionsForExam(id);
  });

  // ── NAME OVERLAY ──
  document.getElementById('name-continue-btn').addEventListener('click', proceedToAnticheat);
  document.getElementById('student-name-input').addEventListener('keydown', e => { if(e.key==='Enter') proceedToAnticheat(); });

  // ── ANTICHEAT ──
  document.getElementById('ac-accept-btn').addEventListener('click', beginExam);
  document.getElementById('ac-cancel-btn').addEventListener('click', () => {
    document.getElementById('anticheat-overlay').style.display = 'none';
    document.getElementById('name-overlay').style.display = 'flex';
  });

  // ── EDIT CODE ──
  document.getElementById('editcode-confirm').addEventListener('click', confirmEditCode);
  document.getElementById('editcode-cancel').addEventListener('click', () => {
    document.getElementById('editcode-overlay').style.display = 'none';
    pendingEditId = null;
  });
  document.getElementById('editcode-input').addEventListener('keydown', e => { if(e.key==='Enter') confirmEditCode(); });

  // ── RESET CODE ──
  document.getElementById('resetcode-confirm').addEventListener('click', confirmResetCode);
  document.getElementById('resetcode-cancel').addEventListener('click', () => {
    document.getElementById('resetcode-overlay').style.display = 'none';
    pendingResetId = null;
  });
  document.getElementById('resetcode-input').addEventListener('keydown', e => { if(e.key==='Enter') confirmResetCode(); });

  // ── EXAM NAVIGATION ──
  document.getElementById('exam-prev-btn').addEventListener('click', () => ExamSession.goTo(ExamSession.currentQ - 1));
  document.getElementById('exam-next-btn').addEventListener('click', () => ExamSession.goTo(ExamSession.currentQ + 1));

  // ── SUBMIT ──
  document.getElementById('submit-exam-btn').addEventListener('click', () => {
    const total    = ExamSession.current?.questions.length || 0;
    const answered = Object.keys(ExamSession.answers).length;
    const unanswered = total - answered;
    const msg = unanswered > 0
      ? `You have ${unanswered} unanswered question(s). Submit anyway?`
      : 'Submit your exam? This cannot be undone.';
    if (confirm(msg)) { AntiCheat.disable(); ExamSession.submit('manual'); }
  });

  // ── RESULTS ──
  document.getElementById('results-done-btn').addEventListener('click', () => {
    document.getElementById('results-overlay').style.display = 'none';
    renderExamsList();
    showApp('exams');
  });

  // ── CORRECTIONS ──
  document.getElementById('back-to-exams-btn').addEventListener('click', () => {
    renderExamsList(); switchTab('exams');
  });
}

// ── SAVE ─────────────────────────────────────
function saveExam() {
  const data = collectExamData();
  if (!data) return;
  if (window._editingExamId) {
    DB.update(window._editingExamId, { ...data, taken:false, lastResult:null });
    showToast('✅ Exam updated!', 'success');
    window._editingExamId = null;
  } else {
    DB.add(data);
    showToast('✅ Exam saved!', 'success');
  }
  clearCreateForm();
  renderExamsList();
}

// ── EXPORT ───────────────────────────────────
function exportCurrentForm() {
  const data = collectExamData(); if (!data) return;
  _downloadJSON(data, (data.title||'exam')+'.json');
  showToast('📤 Exported!','info');
}
function exportSingleExam(id) {
  const exam = DB.getById(id); if (!exam) return;
  const {taken,lastResult,takenAt,...exp} = exam;
  _downloadJSON(exp, (exam.title||'exam')+'.json');
  showToast('📤 Exported!','info');
}
function _downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

// ── IMPORT ───────────────────────────────────
function importExam(e) {
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.title || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('Missing title or questions array');
      }
      // Force numeric fields so pass/fail works correctly
      data.timeLimit  = parseInt(data.timeLimit)  || 0;
      data.maxScore   = parseInt(data.maxScore)   || 100;
      data.passScore  = parseInt(data.passScore)  || 50;
      // Force correctIndex to number on each question
      data.questions = data.questions.map(q => ({
        ...q,
        correctIndex: parseInt(q.correctIndex) || 0,
        options: (q.options || []).map(o => typeof o === 'string' ? { text: o } : o)
      }));
      delete data.id;
      data.taken = false; data.lastResult = null; data.takenAt = null;
      DB.add(data);
      renderExamsList();
      showToast('📥 Exam imported!', 'success');
      showApp('exams');
    } catch(err) {
      console.error('[ExamForge] Import failed:', err);
      showToast('❌ Import failed: ' + err.message, 'error');
    }
    e.target.value = ''; // clear AFTER read is done
  };
  r.onerror = () => { showToast('❌ Could not read file', 'error'); e.target.value = ''; };
  r.readAsText(file);
}

// ── START EXAM FLOW ───────────────────────────
function startExamFlow(id) {
  const exam = DB.getById(id); if (!exam) return;
  if (exam.taken) { showToast('🔒 Exam locked. Reset it first.','error'); return; }
  pendingExamId = id;
  document.getElementById('name-exam-display').textContent = '📋 ' + exam.title;
  document.getElementById('student-name-input').value = '';
  document.getElementById('name-overlay').style.display = 'flex';
  setTimeout(() => document.getElementById('student-name-input').focus(), 120);
}
function proceedToAnticheat() {
  const name = document.getElementById('student-name-input').value.trim();
  if (!name) { showToast('Please enter your name','error'); return; }
  ExamSession.studentName = name;
  document.getElementById('name-overlay').style.display = 'none';
  document.getElementById('anticheat-overlay').style.display = 'flex';
}
function beginExam() {
  document.getElementById('anticheat-overlay').style.display = 'none';
  const exam = DB.getById(pendingExamId); if (!exam) { showToast('Exam not found','error'); return; }
  const name = ExamSession.studentName;
  pendingExamId = null;

  // Add decorative pencils
  ['✏️','📝','📚','🔬','📐'].forEach((icon, i) => {
    const el = document.createElement('div');
    el.className = 'exam-pencil';
    el.textContent = icon;
    el.style.cssText = `top:${10+i*16}%;left:${i%2===0?(1+Math.random()*3):(95+Math.random()*3)}%;--rot:${-15+Math.random()*30}deg;animation-duration:${5+Math.random()*5}s;animation-delay:${Math.random()*2}s;`;
    document.body.appendChild(el);
  });

  showApp('take');
  AntiCheat.enable();
  ExamSession.start(exam, name);
}

// ── EDIT FLOW ─────────────────────────────────
function editExamFlow(id) {
  const exam = DB.getById(id); if (!exam) return;
  if (exam.editCode) {
    pendingEditId = id;
    document.getElementById('editcode-input').value = '';
    document.getElementById('editcode-error').classList.add('hidden');
    document.getElementById('editcode-overlay').style.display = 'flex';
  } else { _loadExamForEdit(id); }
}
function confirmEditCode() {
  const input = document.getElementById('editcode-input').value;
  const exam  = DB.getById(pendingEditId); if (!exam) return;
  if (input === exam.editCode) {
    document.getElementById('editcode-overlay').style.display = 'none';
    _loadExamForEdit(pendingEditId); pendingEditId = null;
  } else {
    document.getElementById('editcode-error').classList.remove('hidden');
    document.getElementById('editcode-input').classList.add('shake');
    setTimeout(() => document.getElementById('editcode-input').classList.remove('shake'), 420);
  }
}
function _loadExamForEdit(id) {
  const exam = DB.getById(id); if (!exam) return;
  window._editingExamId = id;
  populateCreateForm(exam);
  showApp('create');
  showToast('✏️ Exam loaded for editing','info');
}

// ── DELETE ────────────────────────────────────
function deleteExamFlow(id) {
  const exam = DB.getById(id); if (!exam) return;
  if (!confirm(`Delete "${exam.title}"? Cannot be undone.`)) return;
  DB.remove(id); renderExamsList(); showToast('🗑️ Deleted','info');
}

// ── RESET FLOW ────────────────────────────────
function resetExamFlow(id) {
  pendingResetId = id;
  document.getElementById('resetcode-input').value = '';
  document.getElementById('resetcode-error').classList.add('hidden');
  document.getElementById('resetcode-overlay').style.display = 'flex';
}
function confirmResetCode() {
  const input = document.getElementById('resetcode-input').value;
  const exam  = DB.getById(pendingResetId); if (!exam) return;
  const MASTER = '/console.reset.log';
  const ok = input===MASTER || (exam.editCode&&input===exam.editCode) || (exam.resetCode&&input===exam.resetCode);
  if (ok) {
    DB.resetExam(pendingResetId);
    document.getElementById('resetcode-overlay').style.display = 'none';
    renderExamsList();
    showToast('🔄 Exam reset! Students can take it again.','success');
    console.log(`%c[ExamForge] "${exam.title}" reset at ${new Date().toLocaleString()}`,'color:#22c55e;font-weight:bold;');
    pendingResetId = null;
  } else {
    document.getElementById('resetcode-error').classList.remove('hidden');
    document.getElementById('resetcode-input').classList.add('shake');
    setTimeout(() => document.getElementById('resetcode-input').classList.remove('shake'), 420);
  }
}

// ── VIEW CORRECTIONS (from exam card) ────────
function viewCorrectionsForExam(id) {
  const exam = DB.getById(id); if (!exam || !exam.lastResult) return;
  renderCorrections(exam, exam.lastResult.answers);
  showApp('corrections');
}
