'use strict';

// ─── Initial piece layout ─────────────────────────────────────────────────────

const INITIAL_PIECES = [
  { posY: 0, posX: 1, color: 'black' }, { posY: 0, posX: 3, color: 'black' },
  { posY: 0, posX: 5, color: 'black' }, { posY: 0, posX: 7, color: 'black' },
  { posY: 1, posX: 0, color: 'black' }, { posY: 1, posX: 2, color: 'black' },
  { posY: 1, posX: 4, color: 'black' }, { posY: 1, posX: 6, color: 'black' },
  { posY: 2, posX: 1, color: 'black' }, { posY: 2, posX: 3, color: 'black' },
  { posY: 2, posX: 5, color: 'black' }, { posY: 2, posX: 7, color: 'black' },
  { posY: 5, posX: 0, color: 'white' }, { posY: 5, posX: 2, color: 'white' },
  { posY: 5, posX: 4, color: 'white' }, { posY: 5, posX: 6, color: 'white' },
  { posY: 6, posX: 1, color: 'white' }, { posY: 6, posX: 3, color: 'white' },
  { posY: 6, posX: 5, color: 'white' }, { posY: 6, posX: 7, color: 'white' },
  { posY: 7, posX: 0, color: 'white' }, { posY: 7, posX: 2, color: 'white' },
  { posY: 7, posX: 4, color: 'white' }, { posY: 7, posX: 6, color: 'white' },
];

const CHECKERS_RULES = {
  italian: {
    version: 'italian',
    whiteStarts: true,
    menCanCaptureKings: false,
    strictCapturePriority: true,
    flyingKings: false,
    menCaptureBackward: false,
  },
  english: {
    version: 'english',
    whiteStarts: false,
    menCanCaptureKings: true,
    strictCapturePriority: false,
    flyingKings: false,
    menCaptureBackward: false,
  },
  brazilian: {
    version: 'brazilian',
    whiteStarts: true,
    menCanCaptureKings: true,
    strictCapturePriority: true,
    flyingKings: true,
    menCaptureBackward: true,
  },
};

function checkersRules(version) {
  return CHECKERS_RULES[version] || CHECKERS_RULES.italian;
}

// ─── GameController ───────────────────────────────────────────────────────────
// Wires together CheckersGame, MachinePlayer, and MenuController.
// This is the single orchestration point — no game logic lives here.

class GameController {
  constructor() {
    this._game    = null; // CheckersGame
    this._machine = null; // MachinePlayer | null
    this._menu    = null; // MenuController
    this._config  = null; // current game config snapshot
  }

  init() {
    const boardEl = document.getElementById('board');
    this._game = new CheckersGame(boardEl);
    this._menu = new MenuController();

    // Wire game events → controller
    this._game.onMoveComplete(whiteTurn => this._afterMove(whiteTurn));
    this._game.onGameOver(winner => this._handleGameOver(winner));

    // Wire menu events → controller
    this._menu.onStartGame(cfg => this._startGame(cfg));
    this._menu.onNewGame(() => this._startGame(this._config));
    this._menu.onResign(color => {
      const winner = color === 'white' ? 'black' : 'white';
      this._handleGameOver(winner);
    });
    this._menu.onBack(() => {
      this._machine = null;
      this._config  = null;
    });

    this._menu.init();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  _startGame(cfg) {
    this._config  = { ...cfg };
    this._machine = cfg.mode === 'machine' ? new MachinePlayer(cfg.difficulty, cfg.version) : null;
    this._game.init(INITIAL_PIECES, cfg.version);
    this._menu.updateTurn(this._game.whiteTurn);

    if (this._machine && !this._game.whiteTurn) {
      setTimeout(() => this._triggerMachineMove(), 400);
    }
  }

  _afterMove(whiteTurn) {
    this._menu.updateTurn(whiteTurn);

    // Trigger machine on black's turn
    if (this._machine && !whiteTurn) {
      setTimeout(() => this._triggerMachineMove(), 400);
    }
  }

  _triggerMachineMove() {
    // Guard: config may have changed (e.g. user went back to menu)
    if (!this._machine || this._game.whiteTurn) return;

    const board = this._game.getLogicalBoard();
    const best  = this._machine.chooseBestMove(board, 'black');
    if (best) this._game.applyMoveByPosition(best.fromX, best.fromY, best.toX, best.toY);
  }

  _handleGameOver(winner) {
    this._menu.gameOver(winner);
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
// Load the three module files in dependency order, then start the app.

function _loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

(async function boot() {
  await _loadScript('i18n.js');
  await _loadScript('game.js');
  await _loadScript('machine.js');
  await _loadScript('menu.js');

  const controller = new GameController();
  controller.init();
})();
