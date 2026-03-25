'use strict';

// ─── LogicalBoard ─────────────────────────────────────────────────────────────
// Pure data structure — no DOM dependency.
// cells[y][x] = null | { color: 'white'|'black', isQueen: boolean }

class LogicalBoard {
  constructor(cells) {
    this.cells = cells;
  }

  get(x, y) { return this.cells[y][x]; }
  set(x, y, val) { this.cells[y][x] = val; }

  clone() {
    return new LogicalBoard(this.cells.map(row => row.map(c => c ? { ...c } : null)));
  }

  /** Applies a logical move in-place and returns this for chaining. */
  applyMove(mv) {
    const piece = { ...this.get(mv.fromX, mv.fromY) };
    this.set(mv.fromX, mv.fromY, null);
    mv.eatPositions.forEach(({ x, y }) => this.set(x, y, null));
    const promoted = piece.color === 'white' ? mv.toY === 0 : mv.toY === 7;
    this.set(mv.toX, mv.toY, { color: piece.color, isQueen: piece.isQueen || promoted });
    return this;
  }

  /** True when one side has no pieces left. */
  isTerminal() {
    let hasWhite = false, hasBlack = false;
    for (const row of this.cells) {
      for (const c of row) {
        if (!c) continue;
        if (c.color === 'white') hasWhite = true;
        else hasBlack = true;
        if (hasWhite && hasBlack) return false;
      }
    }
    return true;
  }
}

// ─── LogicalMoveEngine ────────────────────────────────────────────────────────
// Generates all legal moves for a given color on a LogicalBoard.
// Each move: { fromX, fromY, toX, toY, eatPositions: [{x,y}] }

class LogicalMoveEngine {
  static _inBounds(x, y) { return x >= 0 && x < 8 && y >= 0 && y < 8; }

  static _DIRS = [
    (x, y) => [x - 1, y - 1], // nw
    (x, y) => [x + 1, y - 1], // ne
    (x, y) => [x - 1, y + 1], // sw
    (x, y) => [x + 1, y + 1], // se
  ];

  static getAllMoves(board, color) {
    const moves = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const cell = board.get(x, y);
        if (!cell || cell.color !== color) continue;
        LogicalMoveEngine._collect(board, x, y, x, y, cell.isQueen, color, [], moves, false);
      }
    }
    return moves;
  }

  /**
   * fromX/fromY — original piece position (fixed for the whole chain)
   * curX/curY   — current position used to scan neighbours
   * inChain     — true when inside a capture chain (suppresses simple slides)
   */
  static _collect(board, fromX, fromY, curX, curY, isQueen, color, eatChain, moves, inChain) {
    const opp = color === 'white' ? 'black' : 'white';
    const fwdDirs = color === 'white'
      ? [LogicalMoveEngine._DIRS[0], LogicalMoveEngine._DIRS[1]]
      : [LogicalMoveEngine._DIRS[2], LogicalMoveEngine._DIRS[3]];
    const dirs = isQueen ? LogicalMoveEngine._DIRS : fwdDirs;

    dirs.forEach(step => {
      if (isQueen) {
        let cx = curX, cy = curY, enemyPos = null;

        while (true) {
          [cx, cy] = step(cx, cy);
          if (!LogicalMoveEngine._inBounds(cx, cy)) break;
          if (eatChain.some(e => e.x === cx && e.y === cy)) continue;

          const cell = board.get(cx, cy);

          if (!cell) {
            if (enemyPos === null) {
              if (!inChain) moves.push({ fromX, fromY, toX: cx, toY: cy, eatPositions: [] });
            } else {
              const chain = [...eatChain, enemyPos];
              if (!moves.find(m => m.toX === cx && m.toY === cy && m.eatPositions.length === chain.length)) {
                moves.push({ fromX, fromY, toX: cx, toY: cy, eatPositions: chain });
                LogicalMoveEngine._collect(board, fromX, fromY, cx, cy, true, color, chain, moves, true);
              }
            }
          } else if (cell.color === opp) {
            if (enemyPos !== null) break;
            enemyPos = { x: cx, y: cy };
          } else {
            break;
          }
        }
      } else {
        const [nx, ny] = step(curX, curY);
        if (!LogicalMoveEngine._inBounds(nx, ny)) return;

        const cell = board.get(nx, ny);
        if (!cell && !inChain) {
          moves.push({ fromX, fromY, toX: nx, toY: ny, eatPositions: [] });
        }

        const alreadyEaten = eatChain.some(e => e.x === nx && e.y === ny);
        if (cell && cell.color === opp && !alreadyEaten) {
          const [jx, jy] = step(nx, ny);
          if (LogicalMoveEngine._inBounds(jx, jy) && !board.get(jx, jy)) {
            const chain = [...eatChain, { x: nx, y: ny }];
            moves.push({ fromX, fromY, toX: jx, toY: jy, eatPositions: chain });
            LogicalMoveEngine._collect(board, fromX, fromY, jx, jy, false, color, chain, moves, true);
          }
        }
      }
    });
  }
}

// ─── MachinePlayer ────────────────────────────────────────────────────────────

class MachinePlayer {
  static DEPTHS = { easy: 1, medium: 3, hard: 5 };

  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
  }

  /**
   * Given a logical board snapshot and the machine's color, returns the best
   * move: { fromX, fromY, toX, toY, eatPositions } or null if no moves exist.
   */
  chooseBestMove(boardCells, machineColor) {
    const board = new LogicalBoard(boardCells);
    const depth = MachinePlayer.DEPTHS[this.difficulty] || 3;
    const result = this._minimax(board, depth, true, machineColor, machineColor, true);

    if (!result || typeof result !== 'object') return null;

    let best = null, bestVal = -Infinity;
    for (const { value, move } of Object.values(result)) {
      if (value > bestVal) { bestVal = value; best = move; }
    }
    return best;
  }

  /**
   * Minimax with configurable depth.
   *
   * board       — LogicalBoard to evaluate
   * depth       — remaining plies
   * isMax       — true on the machine's turn (maximising)
   * moveColor   — whose pieces to move this ply (alternates each call)
   * machineColor — the machine's color (fixed across all recursive calls)
   * firstCall   — when true, returns a { key → {value, move} } map instead of a score
   */
  _minimax(board, depth, isMax, moveColor, machineColor, firstCall) {
    // Always evaluate from the machine's perspective so the heuristic
    // stays consistent regardless of which ply we are on.
    if (depth === 0 || board.isTerminal()) {
      return this._heuristic(board, machineColor);
    }

    const opp = moveColor === 'white' ? 'black' : 'white';
    const moves = LogicalMoveEngine.getAllMoves(board, moveColor);
    if (!moves.length) return this._heuristic(board, machineColor);

    if (isMax) {
      let maxEval = -Infinity;
      const moveValues = {};

      for (const mv of moves) {
        const next = board.clone().applyMove(mv);
        const value = this._minimax(next, depth - 1, false, opp, machineColor, false);
        if (value > maxEval) maxEval = value;
        moveValues[`${mv.fromX},${mv.fromY},${mv.toX},${mv.toY}`] = { value, move: mv };
      }

      return firstCall ? moveValues : maxEval;
    } else {
      let minEval = Infinity;

      for (const mv of moves) {
        const next = board.clone().applyMove(mv);
        const value = this._minimax(next, depth - 1, true, opp, machineColor, false);
        if (value < minEval) minEval = value;
      }

      return minEval;
    }
  }

  /**
   * Heuristic evaluated always from machineColor's perspective.
   * Queens are worth 3, regular pieces worth 1.
   */
  _heuristic(board, machineColor) {
    let score = 0;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const cell = board.get(x, y);
        if (!cell) continue;
        const val = cell.isQueen ? 3 : 1;
        score += cell.color === machineColor ? val : -val;
      }
    }
    return score;
  }
}
