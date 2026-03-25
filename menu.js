'use strict';

// ─── MenuController ───────────────────────────────────────────────────────────
// Owns all menu / HUD DOM interactions and session-storage persistence.

class MenuController {
  static STORAGE_KEY = 'checkers_config';

  constructor() {
    // ── DOM refs ──────────────────────────────────────────────────────────────
    this._menuEl         = document.getElementById('menu');
    this._gameEl         = document.getElementById('game-container');
    this._modeCards      = document.querySelectorAll('.mode-card');
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

    // ── In-memory config (pre-game) ───────────────────────────────────────────
    this._config = {
      mode: 'multiplayer',
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
    this._bindModeCards();
    this._bindDifficultyBtns();
    this._bindStartBtn();
    this._bindBackBtn();
    this._bindResignBtns();
    this._bindNewGameBtn();
    this._bindTabs();
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

    const name = winnerColor === 'white' ? cfg.players.white : cfg.players.black;
    this._winTextEl.textContent = `${name} wins!`;
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

      this._config.players.white = whiteName || 'Player 1';
      this._config.players.black = this._config.mode === 'machine'
        ? 'Machine'
        : (blackName || 'Player 2');
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

  _bindTabs() {
    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.remove('hidden');
      });
    });
  }
}
