'use strict';

// ─── MenuController ───────────────────────────────────────────────────────────
// Owns all menu / HUD DOM interactions and session-storage persistence.

class MenuController {
  static STORAGE_KEY = 'checkers_config';
  static THEME_KEY = 'checkers_theme';

  constructor() {
    // ── DOM refs ──────────────────────────────────────────────────────────────
    this._menuEl         = document.getElementById('menu');
    this._gameEl         = document.getElementById('game-container');
    this._sidebarBtn     = document.getElementById('sidebar-toggle');
    this._sidebarOverlay = document.getElementById('sidebar-backdrop');
    this._modeCards      = document.querySelectorAll('.mode-card');
    this._versionSelect  = document.getElementById('version-select');
    this._blackGroupEl   = document.getElementById('black-player-group');
    this._diffGroupEl    = document.getElementById('difficulty-group');
    this._diffBtns       = document.querySelectorAll('.diff-btn');
    this._playerWhiteEl  = document.getElementById('player-white');
    this._playerBlackEl  = document.getElementById('player-black');
    this._startBtn       = document.getElementById('start-btn');
    this._backBtn        = document.getElementById('back-btn');
    this._resignWhiteBtn = document.getElementById('resign-white');
    this._resignBlackBtn = document.getElementById('resign-black');
    this._nameWhiteEl    = document.getElementById('name-white');
    this._nameBlackEl    = document.getElementById('name-black');
    this._scoreWhiteEl   = document.getElementById('score-white');
    this._scoreBlackEl   = document.getElementById('score-black');
    this._panelWhiteEl   = document.getElementById('panel-white');
    this._panelBlackEl   = document.getElementById('panel-black');
    this._winBannerEl    = document.getElementById('win-banner');
    this._winTextEl      = document.getElementById('win-text');
    this._generateBtn    = document.getElementById('generate');
    this._ruleStartEl    = document.getElementById('rule-start');
    this._ruleMenKingsEl = document.getElementById('rule-men-kings');
    this._ruleCaptureEl  = document.getElementById('rule-capture-choice');
    this._themeToggleEl  = document.getElementById('theme-toggle');
    this._langSelectEl   = document.getElementById('lang-select');

    // ── In-memory config (pre-game) ───────────────────────────────────────────
    this._config = {
      mode: 'multiplayer',
      version: 'italian',
      difficulty: 'medium',
      players: { white: 'Player 1', black: 'Player 2' },
      scores: { white: 0, black: 0 },
    };

    // ── Callbacks ─────────────────────────────────────────────────────────────
    this._onStartGame = null; // (config) => void
    this._onNewGame   = null; // () => void
    this._onResign    = null; // (resigningColor) => void
    this._onBack      = null; // () => void
  }

  // ── Callback registration ──────────────────────────────────────────────────

  onStartGame(cb) { this._onStartGame = cb; }
  onNewGame(cb)   { this._onNewGame   = cb; }
  onResign(cb)    { this._onResign    = cb; }
  onBack(cb)      { this._onBack      = cb; }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  init() {
    this._initTheme();
    this._initLanguage();
    this._updateRulesText();
    this._bindModeCards();
    this._bindVersionSelect();
    this._bindDifficultyBtns();
    this._bindStartBtn();
    this._bindBackBtn();
    this._bindResignBtns();
    this._bindNewGameBtn();
    this._bindSidebar();
    this._bindTabs();
    this._bindThemeToggle();
    this._bindLanguageSelect();
  }

  // ── Public view methods ────────────────────────────────────────────────────

  showGame() {
    const cfg = this.getStoredConfig();
    if (!cfg) return;
    this._nameWhiteEl.textContent  = cfg.players.white;
    this._nameBlackEl.textContent  = cfg.players.black;
    this._scoreWhiteEl.textContent = cfg.scores.white;
    this._scoreBlackEl.textContent = cfg.scores.black;
    this._panelWhiteEl.classList.add('active');
    this._panelBlackEl.classList.remove('active');
    this._winBannerEl.classList.add('hidden');
    this._menuEl.classList.add('hidden');
    this._gameEl.classList.remove('hidden');
  }

  showMenu() {
    sessionStorage.removeItem(MenuController.STORAGE_KEY);
    this._gameEl.classList.add('hidden');
    this._menuEl.classList.remove('hidden');
    this._playerWhiteEl.value = '';
    this._playerBlackEl.value = '';
  }

  /** Called after every move to keep the turn-indicator panels in sync. */
  updateTurn(whiteTurn) {
    this._panelWhiteEl.classList.toggle('active', whiteTurn);
    this._panelBlackEl.classList.toggle('active', !whiteTurn);
  }

  /** Called when the game ends to update scores and show the win banner. */
  gameOver(winnerColor) {
    const cfg = this.getStoredConfig();
    if (!cfg) return;

    cfg.scores[winnerColor] = (cfg.scores[winnerColor] || 0) + 1;
    sessionStorage.setItem(MenuController.STORAGE_KEY, JSON.stringify(cfg));

    this._scoreWhiteEl.textContent = cfg.scores.white;
    this._scoreBlackEl.textContent = cfg.scores.black;

    this._lastWinner = winnerColor;
    const name = winnerColor === 'white' ? cfg.players.white : cfg.players.black;
    this._winTextEl.textContent = I18n.t('wins', { name });
    this._winBannerEl.classList.remove('hidden');
    this._panelWhiteEl.classList.remove('active');
    this._panelBlackEl.classList.remove('active');
  }

  getStoredConfig() {
    const raw = sessionStorage.getItem(MenuController.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  // ── Private bindings ───────────────────────────────────────────────────────

  _bindModeCards() {
    this._modeCards.forEach(card => {
      card.addEventListener('click', () => {
        this._modeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this._config.mode = card.dataset.mode;

        const isMachine = this._config.mode === 'machine';
        this._blackGroupEl.classList.toggle('hidden', isMachine);
        if (this._diffGroupEl) this._diffGroupEl.classList.toggle('hidden', !isMachine);
      });
    });
  }

  _bindVersionSelect() {
    if (!this._versionSelect) return;
    this._versionSelect.value = this._config.version;
    this._versionSelect.addEventListener('change', () => {
      this._config.version = this._versionSelect.value;
      this._updateRulesText();
    });
  }

  _updateRulesText() {
    const rules = I18n.ruleText(this._config.version);

    if (this._ruleStartEl) this._ruleStartEl.textContent = rules.start;
    if (this._ruleMenKingsEl) this._ruleMenKingsEl.textContent = rules.menKings;
    if (this._ruleCaptureEl) this._ruleCaptureEl.textContent = rules.captureChoice;
  }

  _bindDifficultyBtns() {
    this._diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this._diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._config.difficulty = btn.dataset.diff;
      });
    });
  }

  _bindStartBtn() {
    this._startBtn.addEventListener('click', () => {
      const whiteName = this._playerWhiteEl.value.trim();
      const blackName = this._playerBlackEl.value.trim();

      this._config.players.white = whiteName || I18n.t('defaultWhite');
      this._config.players.black = this._config.mode === 'machine'
        ? I18n.t('machine')
        : (blackName || I18n.t('defaultBlack'));
      this._config.scores = { white: 0, black: 0 };

      sessionStorage.setItem(MenuController.STORAGE_KEY, JSON.stringify(this._config));
      this.showGame();
      this._onStartGame && this._onStartGame({ ...this._config });
    });
  }

  _bindBackBtn() {
    this._backBtn.addEventListener('click', () => {
      this.showMenu();
      this._onBack && this._onBack();
    });
  }

  _bindResignBtns() {
    this._resignWhiteBtn.addEventListener('click', () => this._onResign && this._onResign('white'));
    this._resignBlackBtn.addEventListener('click', () => this._onResign && this._onResign('black'));
  }

  _bindNewGameBtn() {
    this._generateBtn.addEventListener('click', () => {
      this._winBannerEl.classList.add('hidden');
      this._onNewGame && this._onNewGame();
    });
  }

  _bindSidebar() {
    if (!this._sidebarBtn || !this._sidebarOverlay) return;

    this._sidebarBtn.addEventListener('click', () => {
      this._setSidebarOpen(!document.body.classList.contains('sidebar-open'));
    });

    this._sidebarOverlay.addEventListener('click', () => this._setSidebarOpen(false));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.body.classList.contains('sidebar-open'))
        this._setSidebarOpen(false);
    });
  }

  _setSidebarOpen(open) {
    document.body.classList.toggle('sidebar-open', open);
    if (!this._sidebarBtn) return;

    this._sidebarBtn.setAttribute('aria-expanded', String(open));
    this._sidebarBtn.setAttribute('aria-label', open ? 'Close sidebar' : 'Open sidebar');
    this._sidebarBtn.textContent = open ? '×' : '☰';
  }

  _bindTabs() {
    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.remove('hidden');
        this._setSidebarOpen(false);
      });
    });
  }

  // ── Theme ────────────────────────────────────────────────────────────────

  _initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(MenuController.THEME_KEY); } catch (_) {}
    this._applyTheme(saved === 'light');
  }

  _applyTheme(isLight) {
    document.body.classList.toggle('light-mode', isLight);
    try { localStorage.setItem(MenuController.THEME_KEY, isLight ? 'light' : 'dark'); } catch (_) {}
    if (this._themeToggleEl) {
      // Show the currently active theme on the toggle.
      this._themeToggleEl.dataset.i18n = isLight ? 'themeLight' : 'themeDark';
      this._themeToggleEl.textContent = I18n.t(isLight ? 'themeLight' : 'themeDark');
    }
  }

  _bindThemeToggle() {
    if (!this._themeToggleEl) return;
    this._themeToggleEl.addEventListener('click', () => {
      this._applyTheme(!document.body.classList.contains('light-mode'));
    });
  }

  // ── Language ─────────────────────────────────────────────────────────────

  _initLanguage() {
    I18n.init();
    I18n.apply();
    if (this._langSelectEl) this._langSelectEl.value = I18n.current;
  }

  _bindLanguageSelect() {
    if (!this._langSelectEl) return;
    this._langSelectEl.addEventListener('change', () => {
      I18n.setLang(this._langSelectEl.value);
      this._updateRulesText();
      // Re-render strings that aren't driven by data-i18n attributes.
      if (this._themeToggleEl) {
        this._themeToggleEl.textContent = I18n.t(this._themeToggleEl.dataset.i18n);
      }
      if (this._lastWinner && !this._winBannerEl.classList.contains('hidden')) {
        const cfg = this.getStoredConfig();
        const name = cfg && (this._lastWinner === 'white' ? cfg.players.white : cfg.players.black);
        if (name) this._winTextEl.textContent = I18n.t('wins', { name });
      }
    });
  }
}
