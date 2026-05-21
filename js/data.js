/* =============================================
   EXAMFORGE — DATA.JS
   Handles all localStorage persistence
   ============================================= */

const DB = {
  KEY: 'examforge_exams_v2',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || '[]');
    } catch { return []; }
  },

  save(exams) {
    localStorage.setItem(this.KEY, JSON.stringify(exams));
  },

  add(exam) {
    const exams = this.getAll();
    exam.id = exam.id || ('exam_' + Date.now() + '_' + Math.random().toString(36).slice(2,7));
    exam.createdAt = exam.createdAt || new Date().toISOString();
    exams.push(exam);
    this.save(exams);
    return exam;
  },

  update(id, updates) {
    const exams = this.getAll();
    const idx = exams.findIndex(e => e.id === id);
    if (idx !== -1) {
      exams[idx] = { ...exams[idx], ...updates };
      this.save(exams);
      return exams[idx];
    }
    return null;
  },

  remove(id) {
    const exams = this.getAll().filter(e => e.id !== id);
    this.save(exams);
  },

  getById(id) {
    return this.getAll().find(e => e.id === id) || null;
  },

  markTaken(id, resultData) {
    return this.update(id, { taken: true, lastResult: resultData, takenAt: new Date().toISOString() });
  },

  resetExam(id) {
    return this.update(id, { taken: false, lastResult: null, takenAt: null });
  }
};

// Exam schema reference:
// {
//   id: string,
//   title: string,
//   timeLimit: number (minutes, 0=none),
//   maxScore: number,
//   passScore: number,
//   editCode: string,
//   questions: [
//     {
//       id: string,
//       text: string,
//       image: string (base64 or null),
//       options: [ { text: string } ],
//       correctIndex: number
//     }
//   ],
//   taken: boolean,
//   lastResult: { studentName, score, percent, grade, answers } | null,
//   createdAt: string,
//   takenAt: string | null
// }
