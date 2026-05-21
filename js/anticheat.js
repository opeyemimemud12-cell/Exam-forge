/* =============================================
   EXAMFORGE — ANTICHEAT.JS
   Tab visibility monitoring & enforcement
   ============================================= */

const AntiCheat = {
  active: false,
  violations: 0,

  enable() {
    this.active = true;
    this.violations = 0;
    ExamSession._log('🔒 ANTI-CHEAT SYSTEM ENABLED');
    document.addEventListener('visibilitychange', this._onVisibilityChange.bind(this));
    window.addEventListener('blur', this._onWindowBlur.bind(this));
  },

  disable() {
    this.active = false;
    document.removeEventListener('visibilitychange', this._onVisibilityChange.bind(this));
    window.removeEventListener('blur', this._onWindowBlur.bind(this));
    ExamSession._log('🔓 ANTI-CHEAT SYSTEM DISABLED');
  },

  _onVisibilityChange() {
    if (!this.active || ExamSession.submitted) return;
    if (document.visibilityState === 'hidden') {
      this.violations++;
      ExamSession._log(`⚠️ ANTI-CHEAT: Tab hidden! Violation #${this.violations} — AUTO-SUBMITTING`);
      showToast('⚠️ Tab switch detected! Auto-submitting...', 'error');
      setTimeout(() => {
        if (!ExamSession.submitted) {
          AntiCheat.disable();
          ExamSession.submit('anticheat_tab_switch');
        }
      }, 800);
    }
  },

  _onWindowBlur() {
    if (!this.active || ExamSession.submitted) return;
    // Only trigger if the document itself is also hidden (not just a click elsewhere on page)
    setTimeout(() => {
      if (document.visibilityState === 'hidden' && !ExamSession.submitted) {
        this.violations++;
        ExamSession._log(`⚠️ ANTI-CHEAT: Window blur + hidden. Violation #${this.violations}`);
      }
    }, 200);
  }
};
