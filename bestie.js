/* =============================================
   EXAMFORGE — BESTIE.JS
   The toxic gen-z friend who won't shut up
   ============================================= */

const Bestie = {
  active: false,
  questionTimers: {},   // { qIndex: secondsSpent }
  toastInterval: null,
  currentQStart: null,
  currentQIdx: null,
  examSubject: '',
  interactions: [],     // log of all bestie moments
  questionRoastCount: {},  // how many times roasted per question

  // ── detect subject from exam title ──────────
  _detectSubject(title) {
    const t = title.toLowerCase();
    if (/bio|biology|cell|organ|plant|animal|genetics|evolution/.test(t)) return 'biology';
    if (/math|maths|algebra|calculus|geometry|trigon|arithmetic|number/.test(t)) return 'math';
    if (/chem|chemistry|periodic|element|molecule|atom|reaction/.test(t)) return 'chemistry';
    if (/phys|physics|force|motion|energy|wave|electric|magnet/.test(t)) return 'physics';
    if (/hist|history|war|empire|revolution|ancient|century|colonial/.test(t)) return 'history';
    if (/eng|english|grammar|literature|essay|poem|novel|shakespeare/.test(t)) return 'english';
    if (/geo|geography|map|continent|climate|country|capital|river/.test(t)) return 'geography';
    if (/comp|computer|programming|code|software|algorithm|data/.test(t)) return 'computer';
    if (/econ|economics|market|supply|demand|gdp|inflation|trade/.test(t)) return 'economics';
    if (/rel|religion|bible|quran|faith|church|mosque|spiritual/.test(t)) return 'religion';
    return 'general';
  },

  // ── subject-aware difficulty comments ────────
  _subjectTaunt(subject, severity) {
    const taunts = {
      biology: {
        mild: ["bro it's just cells 💀","this ain't even hard fr","a plant could answer this faster 🌿","mitochondria is the powerhouse bestie COME ON"],
        mid:  ["you're taking longer than photosynthesis takes 🌞","bro darwin did NOT evolve for this","even the amoeba is embarrassed rn 🦠","this question ate you UP no cap"],
        roast:["you FAILED biology AND common sense","the cell cycle moves faster than your brain rn 💀💀","bro said lemme just stare at this DNA question 😭","walahi you're cooked. the mitochondria has LEFT the chat"]
      },
      math: {
        mild: ["it's literally just numbers bro 😭","bro pull out a calculator at least","2+2 vibes energy rn fr","the numbers are RIGHT THERE bestie"],
        mid:  ["bro you've been on this for AGES","even a calculator is judging you rn 🔢","the equation is not gonna solve itself LMAO","my guy really said lemme think about 2x=4 for 10 mins 💀"],
        roast:["WALAHI U COOKED 😭😭😭 just guess at this point","the math is NOT mathing and neither are you","you're giving 'failed algebra twice' energy rn no cap","bro said x=... and then just FROZE 💀 touch grass"]
      },
      chemistry: {
        mild: ["it's just the periodic table bestie 😭","no actual atoms were harmed during your confusion","one mole of braincells needed rn fr","H2O is water. WATER. and you still look lost 💀"],
        mid:  ["bro you're more confused than a free radical rn","the reaction rate of your brain is ZERO 😭","even sodium would react faster than this","you've been staring at this longer than a half-life 💀"],
        roast:["walahi your braincells have reached activation energy and STILL nothing 😭","periodic table said 'not today' and honestly same","you're giving carbon-14 energy… DEAD for thousands of years 💀💀","bro said let me just vibe with this chem question for eternity LMAOO"]
      },
      physics: {
        mild: ["f=ma bestie it's not that deep 😭","gravity pulled your grade down already fr","Newton is rolling in his grave rn ","the force is NOT with you today lol"],
        mid:  ["your momentum on this question = ZERO 💀","bro said let me apply 0 physics knowledge here","even light travels faster than your answer rn 😭","this question has more energy than you do no cap"],
        roast:["walahi Einstein would cry seeing this 😭😭","the only thing accelerating here is your FAILURE","bro defied the law of getting answers quickly 💀","you're giving 'failed physics and the vibe check' energy"]
      },
      history: {
        mild: ["it literally already happened bro 😭","google would've answered this 10 mins ago","history is repeating itself… so is your confusion 💀","even a museum exhibit is judging you rn"],
        mid:  ["bro this happened CENTURIES ago and u still lost 😭","the romans didn't fall this slow no cap","you're giving 'slept through every class' energy fr","walahi even the pharaohs answered faster 💀"],
        roast:["you are HISTORICALLY cooked rn 😭😭😭","bro said let me forget ALL of human history real quick","this is the greatest failure since the fall of Rome no cap","walahi your grade is ancient history at this point 💀💀"]
      },
      english: {
        mild: ["bro it's ENGLISH. your first language maybe??😭","shakespeare didn't die for this fr","the irony of struggling with ENGLISH 💀","bestie it's just words. WORDS."],
        mid:  ["your comprehension comprehended NOTHING 😭","bro even autocorrect is giving up on you","the author's purpose was NOT for you to blank out 💀","you've been reading this longer than the actual novel"],
        roast:["walahi your English teacher is CRYING rn 😭😭","bro said 'to be or not to be' and chose NOT TO ANSWER 💀","you're giving 'never opened a book ever' energy no cap","the grammar police have arrested your entire thought process LMAOOO"]
      },
      geography: {
        mild: ["it's on a MAP bro 😭","even google maps knows this fr","the continent is still there bestie I promise 🗺️","bro said let me forget where countries are real quick"],
        mid:  ["you've been lost on this question like you lost on a map 😭","walahi even a GPS is confused by ur energy","the amazon river flows faster than your brain rn 💀","bro said Africa is a country and then FROZE 😭"],
        roast:["you're giving 'failed geography AND orientation' energy 💀💀","walahi you couldn't find this answer with a compass and a prayer 😭😭","bro doesn't know where they are IN LIFE rn and it shows","the only map you need is one OUT OF THIS EXAM 😭💀"]
      },
      computer: {
        mild: ["bro you're ON a computer right now 😭","404: answer not found in your brain fr","the irony of failing computer science ON a computer 💀","ctrl+z your confusion bestie"],
        mid:  ["your brain.exe has stopped working 😭","bro said let me buffer on this question for 5 mins","even internet explorer answered faster than this 💀","walahi your RAM is at 100% and still nothing"],
        roast:["your mental RAM has crashed and there's no recovery mode 😭😭","bro said reboot and it STILL didn't help 💀💀","you're running on Windows 98 energy in a 2024 exam fr","walahi even a floppy disk has more storage than your answers rn 😭"]
      },
      economics: {
        mild: ["supply: question. demand: your answer. market: CRASHED 😭","bro even inflation moved faster than you fr","the opportunity cost of your time rn is WILD 💀","GDP of your answers: ZERO no cap"],
        mid:  ["bro you've depreciated on this question for too long 😭","the market for your answers is bearish rn 💀","walahi your human capital is underperforming","you're giving 'studied zero chapters' energy fr"],
        roast:["walahi the economy of your grade is in RECESSION 😭😭","bro said let me create a deficit of correct answers 💀💀","you're giving 2008 financial crisis energy and it's giving COLLAPSE","the invisible hand slapped ur answer away no cap 😭"]
      },
      religion: {
        mild: ["bestie even a prayer won't save this answer 😭","bro the answer is literally in the holy book fr","walahi you need divine intervention rn 💀","you've spent more time on this than a whole sermon"],
        mid:  ["bro even the prophets answered faster than this 😭","walahi this is a TEST from the exam AND from above 💀","you're giving 'missed all the classes AND the sermons' energy","the faith required to pass this exam: SHAKEN fr"],
        roast:["walahi you are COOKED spiritually AND academically 😭😭💀","bro said let me question my entire faith AND this answer","even divine intervention can't save ur grade at this point 😭💀","you're giving 'lost in the wilderness for 40 years' energy fr LMAOOO"]
      },
      general: {
        mild: ["bro just pick one 😭","any answer is better than no answer fr","the clock is judging you rn 💀","bestie PLEASE 😭"],
        mid:  ["you've been on this longer than a whole episode 😭","walahi just guess at this point fr","bro said let me stare into the void real quick 💀","the question is not gonna get easier bestie"],
        roast:["walahi you are so cooked rn 😭😭😭","bro said 'let me fail in peace' and honestly respect but NO 💀","you're giving 'I didn't study a single thing' energy and it shows","the audacity to still be on this question 😭💀 sheesh"]
      }
    };

    const pool = (taunts[subject] || taunts.general)[severity];
    return pool[Math.floor(Math.random() * pool.length)];
  },

  // ── meme references ──────────────────────────
  _memeRef() {
    const memes = [
      "walahi SPIN 😭💀",
      "bro said haaa 💀",
      "this is giving 'i forgor 💀' energy",
      "NO CAP THIS IS EMBARRASSING 😭",
      "ratio + L + bozo 💀",
      "skill issue fr fr",
      "touch grass after this bestie 🌿",
      "the math ain't mathing 💀",
      "we are NOT the same 😭",
      "slay... but make it WRONG 💀",
      "bestie said 'let me cook' but burned everything 🔥😭",
      "bro really said 'it's giving' and gave NOTHING 💀",
      "this ain't it chief 😭",
      "caught in 4K struggling 💀📸",
      "bro said walahi spin and then FROZE 😭💀",
      "not the trauma response to a multiple choice question 😭",
      "lowkey ate but mostly choked no cap 💀",
      "the delulu to real pipeline failed fr 😭",
      "main character moment... of failure 💀",
      "POV: you forgot everything you ever learned 😭",
    ];
    return memes[Math.floor(Math.random() * memes.length)];
  },

  // ── emoji combos ────────────────────────────
  _emojiCombo() {
    const combos = [
      "💀😭🙏","😭💀✋","🗣️💀😭","😭🔥💀",
      "💀💀💀","😭😭😭","🫡💀😭","🤡💀😭",
      "👁️👄👁️","😭🌿💀","💅💀😭","🫠💀😭",
      "🏃‍♂️💨💀","🤦‍♂️😭💀","☠️😭🙏","🎭💀😭",
    ];
    return combos[Math.floor(Math.random() * combos.length)];
  },

  // ── show a toast in bestie style ────────────
  _showBestieToast(msg, urgent) {
    const div = document.createElement('div');
    div.className = 'bestie-toast' + (urgent ? ' bestie-urgent' : '');
    div.innerHTML = `<span class="bestie-avatar">👀</span><span class="bestie-msg">${msg}</span>`;
    document.body.appendChild(div);
    // stagger position if multiple toasts
    const existing = document.querySelectorAll('.bestie-toast');
    const offset = (existing.length - 1) * 64;
    div.style.bottom = (80 + offset) + 'px';
    setTimeout(() => div.classList.add('bestie-in'), 50);
    const lifetime = urgent ? 4500 : 3500;
    setTimeout(() => {
      div.classList.add('bestie-out');
      setTimeout(() => div.remove(), 400);
    }, lifetime);
  },

  // ── start watching a question ────────────────
  watchQuestion(idx, subject) {
    this.examSubject = this._detectSubject(subject);
    this.currentQIdx = idx;
    this.currentQStart = Date.now();
    if (!this.questionTimers[idx]) this.questionTimers[idx] = 0;
    if (!this.questionRoastCount[idx]) this.questionRoastCount[idx] = 0;

    clearInterval(this.toastInterval);
    clearTimeout(this._qTimer);

    let phase = 0;
    const start = () => {
      phase++;
      this.questionRoastCount[idx]++;

      let msg, urgent = false;
      if (phase === 1) {
        msg = this._subjectTaunt(this.examSubject, 'mild');
      } else if (phase === 2) {
        msg = this._subjectTaunt(this.examSubject, 'mild') + ' ' + this._emojiCombo();
      } else if (phase === 3) {
        msg = this._subjectTaunt(this.examSubject, 'mid'); urgent = true;
      } else if (phase === 4) {
        msg = this._memeRef(); urgent = true;
      } else if (phase === 5) {
        msg = this._subjectTaunt(this.examSubject, 'mid') + ' ' + this._emojiCombo(); urgent = true;
      } else {
        msg = this._subjectTaunt(this.examSubject, 'roast') + ' ' + this._emojiCombo(); urgent = true;
        if (phase >= 8) setTimeout(() => this._showBestieToast(this._memeRef(), true), 1400);
        if (phase >= 10) setTimeout(() => this._showBestieToast(this._subjectTaunt(this.examSubject, 'roast'), true), 2600);
      }

      this.interactions.push({ type: 'roast', qIdx: idx, phase, msg });
      this._showBestieToast(msg, urgent);
    };

    // first roast after 3 minutes, then every 15s (spams if they keep sitting there 😭)
    this.toastInterval = null;
    this._qTimer = setTimeout(() => {
      start();
      this.toastInterval = setInterval(start, 15000);
    }, 180000);
  },

  // ── called when student moves to next question ─
  leaveQuestion(idx, answeredNow) {
    clearTimeout(this._qTimer);
    clearInterval(this.toastInterval);
    const roastCount = this.questionRoastCount[idx] || 0;
    if (roastCount === 0) return; // left quickly, no comment

    const reactions = {
      finally: [
        "FINALLY omg I was about to call your parents 😭",
        "took you long enough bestie 💀 sheesh",
        "bro finally moved. the nation can rest 😭",
        "walahi I aged watching you do that 💀",
        "slay... but make it LATE 😭",
        "aight we move. finally. FINALLY. 💀",
        "bro said 'let me think' for 3 years then left 😭",
        "not the slow walk of shame to the next question 💀😭",
      ],
      slowpoke: [
        "bro really took THAT long on ONE question 💀💀",
        "the audacity of the timing 😭 we move tho",
        "walahi that was painful to watch fr 💀",
        "next question better be faster or I'm logging off 😭",
        "sir/ma'am that was NOT it but ok 💀",
      ]
    };

    const pool = roastCount >= 4 ? reactions.slowpoke : reactions.finally;
    const msg = pool[Math.floor(Math.random() * pool.length)];
    this.interactions.push({ type: 'left', qIdx: idx, roastCount, msg });
    setTimeout(() => this._showBestieToast(msg, false), 300);
  },

  // ── final exam summary from bestie ─────────
  getFinalComment(answers, questions, score, percent, grade) {
    const totalRoasts = Object.values(this.questionRoastCount).reduce((a,b) => a+b, 0);
    const slowQuestions = Object.values(this.questionRoastCount).filter(c => c >= 3).length;
    const unanswered = questions.filter(q => answers[q.id] === undefined).length;
    const subject = this.examSubject;

    // Build a personalised comment
    let lines = [];

    if (percent >= 90) {
      lines.push("ok ngl u actually cooked 🔥 I was roasting u for nothing 😭");
      if (totalRoasts > 5) lines.push("you took forever but somehow pulled through?? the audacity to be smart 💀");
      else lines.push("took it kinda fast too. slay era unlocked no cap 💅");
    } else if (percent >= 70) {
      lines.push("not bad bestie! could've been worse. could've been... you 5 mins ago 😭");
      if (slowQuestions > 0) lines.push(`you spent WAY too long on ${slowQuestions} question(s) tho 💀 fix that`);
      lines.push("solid attempt. not slay but not flop either. mid slay. 💅");
    } else if (percent >= 50) {
      lines.push("you PASSED but barely. this was a STRUGGLE to watch 😭");
      if (totalRoasts > 8) lines.push("bro I roasted you " + totalRoasts + " times and you STILL passed?? respect but also 💀");
      lines.push("walahi passing by the skin of your teeth is still passing I guess 😭");
    } else {
      lines.push("bro... bro. BRO. 😭💀");
      if (unanswered > 0) lines.push(`you left ${unanswered} questions blank?? walahi the audacity 😭`);
      lines.push("this is giving 'walahi spin' energy and not in a good way 💀");
      if (totalRoasts > 10) lines.push(`I roasted you ${totalRoasts} times and it didn't even help 😭 you're immune to shame`);
      lines.push("we gotta study together next time fr. or just study. ONCE. please. 🙏");
    }

    // Subject-specific closer
    const closers = {
      biology: ["the cells in your brain went on strike today fr 😭","photosynthesis understood the assignment more than you did 💀"],
      math:    ["the numbers never lied. your answers did 💀","x solved for itself and still got a better grade 😭"],
      chemistry: ["your grade has the energy of a noble gas: UNREACTIVE 💀","walahi even noble gases bonded faster than your answers 😭"],
      physics: ["your grade violated every law of physics 💀","Newton's 4th law: what goes up must come down, including your score 😭"],
      history: ["those who don't learn history are doomed to repeat this exam 💀","walahi your ancestors are disappointed 😭"],
      english: ["the words were RIGHT THERE bestie 💀","Shakespeare said 'all the world's a stage' and you flopped on it 😭"],
      geography: ["you are LOST. literally and figuratively 💀","couldn't find the answers on a map with coordinates 😭"],
      computer: ["your brain.exe crashed and the error log is just this exam 💀","404: answers not found 😭"],
      economics: ["the supply of correct answers was ZERO 💀","walahi ur grade went into recession and I'm worried 😭"],
      religion: ["we need to say a prayer for this grade 🙏💀","even faith can't explain what happened here 😭"],
      general:  ["this was a journey. a PAINFUL one. 💀","walahi I need a break after watching that 😭"]
    };
    const closer = (closers[subject] || closers.general);
    lines.push(closer[Math.floor(Math.random() * closer.length)]);

    return lines.join('<br><br>');
  },

  enable() { this.active = true; },
  disable() {
    this.active = false;
    clearTimeout(this._qTimer);
    clearInterval(this.toastInterval);
  },
  reset() {
    this.questionTimers = {};
    this.questionRoastCount = {};
    this.interactions = [];
    this.currentQIdx = null;
    this.disable();
  }
};
