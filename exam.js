/* =============================================
   EXAMFORGE — EXAM.JS
   One-question-at-a-time exam session
   ============================================= */

const ExamSession = {
  current: null,
  studentName: '',
  answers: {},
  timerInterval: null,
  secondsLeft: 0,
  totalSeconds: 0,
  submitted: false,
  startTime: null,
  log: [],
  currentQ: 0,   // index of displayed question

  _log(msg) {
    const ts = new Date().toISOString();
    const entry = `[${ts}] ${msg}`;
    this.log.push(entry);
    console.log('%c[ExamForge] ' + entry, 'color:#f4831f;font-weight:bold;');
  },

  start(exam, studentName) {
    this.current     = exam;
    this.studentName = studentName;
    this.answers     = {};
    this.submitted   = false;
    this.log         = [];
    this.startTime   = new Date();
    this.currentQ    = 0;

    this._log(`SESSION START — Exam:"${exam.title}" | Student:"${studentName}" | Qs:${exam.questions.length} | Time:${exam.timeLimit > 0 ? exam.timeLimit+'min' : 'Unlimited'}`);

    this._buildTopBar();
    this._renderQuestion(0, 'right');
    this._updateNav();
    this._updateProgress();
    this._startTimer();
  },

  _buildTopBar() {
    const exam = this.current;
    document.getElementById('taking-exam-title').textContent = exam.title;
    document.getElementById('taking-student').textContent = '👤 ' + this.studentName +
      '  |  🏆 ' + exam.maxScore + '  |  ✅ Pass:' + exam.passScore;
  },

  _renderQuestion(idx, dir) {
    const exam = this.current;
    const q    = exam.questions[idx];
    const stage = document.getElementById('exam-question-stage');

    const card = document.createElement('div');
    card.className = 'q-stage-card' + (dir === 'left' ? ' slide-left' : '');

    const selectedOI = this.answers[q.id];

    let optHtml = '';
    q.options.forEach((opt, oi) => {
      const sel = selectedOI === oi ? 'selected' : '';
      optHtml += `
        <div class="stage-option ${sel}" data-oi="${oi}">
          <div class="stage-opt-letter">${['A','B','C','D'][oi] || oi+1}</div>
          <div class="stage-opt-text">${escHtml(opt.text)}</div>
        </div>`;
    });

    card.innerHTML = `
      <div class="stage-q-num">QUESTION ${idx+1} OF ${exam.questions.length}</div>
      <div class="stage-q-text">${escHtml(q.text)}</div>
      ${q.image ? `<img class="stage-q-img" src="${q.image}" alt="Question image"/>` : ''}
      <div class="stage-options">${optHtml}</div>
    `;

    // Option click handlers
    card.querySelectorAll('.stage-option').forEach(el => {
      el.addEventListener('click', () => {
        const oi = parseInt(el.dataset.oi);
        this.answers[q.id] = oi;
        card.querySelectorAll('.stage-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        this._log(`Q${idx+1} answered: ${['A','B','C','D'][oi]} — "${q.options[oi].text}"`);
        this._updateNav();
        this._updateProgress();
      });
    });

    stage.innerHTML = '';
    stage.appendChild(card);
  },

  goTo(idx) {
    const exam = this.current;
    if (idx < 0 || idx >= exam.questions.length) return;
    const dir = idx > this.currentQ ? 'right' : 'left';
    this.currentQ = idx;
    this._renderQuestion(idx, dir);
    this._updateNav();
    this._updateProgress();
  },

  _updateNav() {
    const exam  = this.current;
    const total = exam.questions.length;
    const idx   = this.currentQ;

    const prevBtn = document.getElementById('exam-prev-btn');
    const nextBtn = document.getElementById('exam-next-btn');
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;

    // Dots
    const dotsEl = document.getElementById('exam-nav-dots');
    if (dotsEl) {
      dotsEl.innerHTML = '';
      // Only show up to 12 dots to avoid overflow on phone
      const maxDots = Math.min(total, 12);
      for (let i = 0; i < maxDots; i++) {
        const qid = exam.questions[i]?.id;
        const dot = document.createElement('div');
        dot.className = 'nav-dot' +
          (i === idx ? ' current' : '') +
          (this.answers[qid] !== undefined ? ' answered' : '');
        dot.addEventListener('click', () => this.goTo(i));
        dotsEl.appendChild(dot);
      }
      if (total > 12) {
        const more = document.createElement('div');
        more.style.cssText = 'font-size:.7rem;color:var(--text3);font-weight:700;';
        more.textContent = '+' + (total - 12);
        dotsEl.appendChild(more);
      }
    }
  },

  _updateProgress() {
    const exam     = this.current;
    const answered = Object.keys(this.answers).length;
    const total    = exam.questions.length;
    const pct      = ((this.currentQ + 1) / total) * 100;

    const fill  = document.getElementById('exam-progress-fill');
    const label = document.getElementById('exam-progress-label');
    if (fill)  fill.style.width = pct + '%';
    if (label) label.textContent = `Q ${this.currentQ + 1} / ${total}  (${answered} answered)`;
  },

  _startTimer() {
    const exam    = this.current;
    const display = document.getElementById('timer-display');
    const widget  = document.getElementById('timer-widget');
    const ring    = document.getElementById('timer-ring-fill');
    const CIRCUM  = 150.8; // 2 * pi * 24

    if (exam.timeLimit <= 0) {
      if (display) display.textContent = '∞';
      if (ring)    ring.style.strokeDashoffset = 0;
      return;
    }

    this.totalSeconds  = exam.timeLimit * 60;
    this.secondsLeft   = this.totalSeconds;
    clearInterval(this.timerInterval);

    const tick = () => {
      const m   = Math.floor(this.secondsLeft / 60);
      const s   = this.secondsLeft % 60;
      const txt = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      if (display) display.textContent = txt;

      // Ring progress (shrinks as time passes)
      const ratio = this.secondsLeft / this.totalSeconds;
      if (ring) {
        ring.style.strokeDashoffset = CIRCUM * (1 - ratio);
        if (ratio < 0.25) {
          ring.classList.add('warning');
          // widget element carries the warning class for shake + red text
          const w = document.getElementById('timer-widget');
          if (w) w.classList.add('warning');
        }
      }

      if (this.secondsLeft <= 0) {
        clearInterval(this.timerInterval);
        this._log('⏰ TIME EXPIRED — Auto-submitting');
        showToast('⏰ Time is up! Submitting...', 'error');
        setTimeout(() => this.submit('timeout'), 1200);
        return;
      }
      this.secondsLeft--;
    };

    tick();
    this.timerInterval = setInterval(tick, 1000);
  },

  submit(reason = 'manual') {
    if (this.submitted) return;
    this.submitted = true;
    clearInterval(this.timerInterval);
    document.querySelectorAll('.exam-pencil').forEach(p => p.remove());

    const exam     = this.current;
    const duration = Math.round((new Date() - this.startTime) / 1000);
    this._log(`SUBMISSION — Reason:${reason} | Duration:${duration}s | Answered:${Object.keys(this.answers).length}/${exam.questions.length}`);

    let correct = 0;
    exam.questions.forEach((q, i) => {
      const ans = this.answers[q.id];
      const ok  = ans === q.correctIndex;
      if (ok) correct++;
      this._log(`  Q${i+1}: ans=${ans!==undefined?['A','B','C','D'][ans]:'SKIP'} correct=${['A','B','C','D'][q.correctIndex]} ${ok?'✅':'❌'}`);
    });

    const score   = Math.round((correct / exam.questions.length) * exam.maxScore);
    const percent = Math.round((correct / exam.questions.length) * 100);
    const grade   = calcGrade(percent);
    const passed  = score >= exam.passScore;
    const remark  = getRandomRemark(percent);

    this._log(`RESULT — Score:${score}/${exam.maxScore} | ${percent}% | Grade:${grade} | Passed:${passed}`);
    this._log(`REMARK — "${remark}"`);
    this._log('--- SESSION LOG COMPLETE ---');

    const resultData = {
      studentName: this.studentName, score, percent, grade, passed, remark,
      answers: { ...this.answers }, submittedAt: new Date().toISOString(), reason
    };
    DB.markTaken(exam.id, resultData);
    this._showResults(score, percent, grade, passed, remark);
  },

  _showResults(score, percent, grade, passed, remark) {
    const exam = this.current;
    document.getElementById('results-grade-badge').textContent  = grade;
    document.getElementById('results-title').textContent        = passed ? '🎉 Exam Complete!' : '📋 Exam Complete';
    document.getElementById('results-student-name').textContent = this.studentName;
    document.getElementById('res-score').textContent            = `${score}/${exam.maxScore}`;
    document.getElementById('res-percent').textContent          = percent + '%';
    document.getElementById('res-grade').textContent            = grade;
    document.getElementById('results-remark').textContent       = remark;

    const pf = document.getElementById('results-pass-fail');
    pf.textContent = passed ? '🎓 PASSED' : '❌ FAILED';
    pf.className   = 'results-pass-fail ' + (passed ? 'pass' : 'fail');

    // Bestie final roast
    const bestieEl = document.getElementById('bestie-final');
    if (bestieEl) {
      const comment = Bestie.getFinalComment(this.answers, exam.questions, score, percent, grade);
      bestieEl.innerHTML = '👀 <strong>Your bestie says:</strong><br>' + comment;
      bestieEl.style.display = 'block';
    }

    document.getElementById('results-overlay').style.display = 'flex';
    if (passed) setTimeout(() => launchConfetti('results-confetti'), 400);
  }
};

// ── hook Bestie into exam session ──
// Patch start
const _origStart = ExamSession.start.bind(ExamSession);
ExamSession.start = function(exam, studentName) {
  Bestie.reset();
  Bestie.enable();
  _origStart(exam, studentName);
  Bestie.watchQuestion(0, exam.title);
};

// Patch goTo
const _origGoTo = ExamSession.goTo.bind(ExamSession);
ExamSession.goTo = function(idx) {
  if (Bestie.active) Bestie.leaveQuestion(ExamSession.currentQ, ExamSession.answers[ExamSession.current?.questions[ExamSession.currentQ]?.id] !== undefined);
  _origGoTo(idx);
  if (Bestie.active && ExamSession.current) Bestie.watchQuestion(idx, ExamSession.current.title);
};

// Patch submit
const _origSubmit = ExamSession.submit.bind(ExamSession);
ExamSession.submit = function(reason) {
  if (Bestie.active) {
    Bestie.leaveQuestion(ExamSession.currentQ, false);
    Bestie.disable();
  }
  _origSubmit(reason);
};
