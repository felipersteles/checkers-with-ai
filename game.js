'use strict';

// ─── Position ─────────────────────────────────────────────────────────────────

class Position {
  constructor(x, y) {
    this.x = Number(x);
    this.y = Number(y);
  }

  inBounds() {
    return this.x >= 0 && this.x < 8 && this.y >= 0 && this.y < 8;
  }

  nw() { return new Position(this.x - 1, this.y - 1); }
  ne() { return new Position(this.x + 1, this.y - 1); }
  sw() { return new Position(this.x - 1, this.y + 1); }
  se() { return new Position(this.x + 1, this.y + 1); }
}

// ─── Movement ─────────────────────────────────────────────────────────────────
// Represents one possible move for a DOM piece.
// toSquare  — the td element the piece lands on
// eatSquares — td elements that must be cleared (captured pieces)

class Movement {
  constructor(toSquare, eatSquares = []) {
    this.toSquare = toSquare;
    this.eatSquares = eatSquares;
  }
}

// ─── MoveEngine ───────────────────────────────────────────────────────────────
// Generates all legal Movement objects for a piece on the DOM board.

class MoveEngine {
  static _sq(pos) {
    if (!pos || !pos.inBounds()) return null;
    return document.querySelector(`td[pos="${pos.x},${pos.y}"]`);
  }

  static _empty(sq) { return sq && sq.firstChild === null; }

  static _hasEnemy(sq, ownColor) {
    return sq && sq.firstChild && !sq.firstChild.classList.contains(ownColor);
  }

  static _canCapture(sq, ownColor, isQueenPiece, rules = null) {
    if (!MoveEngine._hasEnemy(sq, ownColor)) return false;
    return isQueenPiece || MoveEngine._rules(rules).menCanCaptureKings || sq.firstChild.id !== 'dama';
  }

  static _rules(rules) {
    if (typeof checkersRules !== 'function') return rules || {};
    if (typeof rules === 'string') return checkersRules(rules);
    return checkersRules(rules && rules.version);
  }

  static _moveWeight(move) {
    return {
      captures: move.eatSquares.length,
      queenCaptures: move.eatSquares.filter(sq => sq.firstChild && sq.firstChild.id === 'dama').length,
    };
  }

  static _maxWeight(moves) {
    return moves.reduce((best, move) => {
      const weight = MoveEngine._moveWeight(move);
      if (weight.captures > best.captures) return weight;
      if (weight.captures === best.captures && weight.queenCaptures > best.queenCaptures) return weight;
      return best;
    }, { captures: 0, queenCaptures: 0 });
  }

  static _filterPieceMoves(moves, isQueenPiece, rules) {
    const activeRules = MoveEngine._rules(rules);
    const captures = moves.filter(move => move.eatSquares.length > 0);

    if (!captures.length) return moves;
    if (!activeRules.strictCapturePriority) return captures;

    const max = MoveEngine._maxWeight(captures);
    return captures.filter(move => {
      const weight = MoveEngine._moveWeight(move);
      return weight.captures === max.captures && weight.queenCaptures === max.queenCaptures;
    }).filter(move => isQueenPiece || max.captures > 0);
  }

  /**
   * Returns all legal Movement[] for the piece currently on pieceSquare.
   *
   * pieceSquare — td element containing the piece
   * isWhitePiece — true if the piece is white
   * isQueenPiece — true if the piece is a queen
   * eatChain    — td[] already consumed in the current capture chain
   * isChained   — true when called recursively inside a capture chain
   */
  static forPiece(pieceSquare, isWhitePiece, isQueenPiece, eatChain = [], isChained = false, rules = null) {
    const results = [];
    const activeRules = MoveEngine._rules(rules);
    const posAttr = pieceSquare.getAttribute('pos');
    if (!posAttr) return results;

    const [px, py] = posAttr.split(',').map(Number);
    const pos = new Position(px, py);
    const color = isWhitePiece ? 'white' : 'black';
    const flying = isQueenPiece && activeRules.flyingKings;

    const allDirs = [p => p.nw(), p => p.ne(), p => p.sw(), p => p.se()];
    const fwdDirs = isWhitePiece ? allDirs.slice(0, 2) : allDirs.slice(2, 4);
    const moveDirs = isQueenPiece ? allDirs : fwdDirs;
    const captureDirs = (isQueenPiece || activeRules.menCaptureBackward) ? allDirs : fwdDirs;

    const addResult = m => {
      if (!results.find(r => r.toSquare === m.toSquare && r.eatSquares.length === m.eatSquares.length))
        results.push(m);
    };

    // Simple slides — flying kings glide over any run of empty squares.
    if (!isChained) {
      moveDirs.forEach(step => {
        let nPos = step(pos);
        let nSq = MoveEngine._sq(nPos);
        if (flying) {
          while (MoveEngine._empty(nSq)) {
            results.push(new Movement(nSq, []));
            nPos = step(nPos);
            nSq = MoveEngine._sq(nPos);
          }
        } else if (MoveEngine._empty(nSq)) {
          results.push(new Movement(nSq, []));
        }
      });
    }

    // Captures.
    captureDirs.forEach(step => {
      let nPos = step(pos);
      let nSq = MoveEngine._sq(nPos);

      // Flying kings skip empty squares until they reach the captured piece.
      if (flying) {
        while (MoveEngine._empty(nSq)) { nPos = step(nPos); nSq = MoveEngine._sq(nPos); }
      }

      if (!MoveEngine._canCapture(nSq, color, isQueenPiece, activeRules) || eatChain.includes(nSq)) return;

      // Candidate landing squares lie just beyond the captured piece; a flying
      // king may stop on any empty square along the same diagonal.
      let jPos = step(nPos);
      let jSq = MoveEngine._sq(jPos);
      while (MoveEngine._empty(jSq)) {
        const chain = [...eatChain, nSq];
        const further = MoveEngine.forPiece(jSq, isWhitePiece, isQueenPiece, chain, true, activeRules);
        const continued = further.filter(m => m.eatSquares.length > chain.length);

        if (continued.length) {
          continued.forEach(addResult);
        } else {
          addResult(new Movement(jSq, chain));
          further.forEach(addResult);
        }

        if (!flying) break;
        jPos = step(jPos);
        jSq = MoveEngine._sq(jPos);
      }
    });

    return MoveEngine._filterPieceMoves(results, isQueenPiece, activeRules);
  }

  static forColor(isWhitePiece, rules = null) {
    const activeRules = MoveEngine._rules(rules);
    const color = isWhitePiece ? 'white' : 'black';
    const candidates = [];
    const pieces = document.querySelectorAll(`#peca.${color}, #dama.${color}`);

    pieces.forEach(piece => {
      const isQueenPiece = piece.id === 'dama';
      const moves = MoveEngine.forPiece(piece.parentNode, isWhitePiece, isQueenPiece, [], false, activeRules);
      moves.forEach(move => candidates.push({ piece, isQueenPiece, move }));
    });

    const captures = candidates.filter(candidate => candidate.move.eatSquares.length > 0);
    if (!captures.length) return candidates;
    if (!activeRules.strictCapturePriority) return captures;

    const maxCaptures = Math.max(...captures.map(candidate => candidate.move.eatSquares.length));
    let filtered = captures.filter(candidate => candidate.move.eatSquares.length === maxCaptures);
    const hasQueenCapture = filtered.some(candidate => candidate.isQueenPiece);
    if (hasQueenCapture) filtered = filtered.filter(candidate => candidate.isQueenPiece);

    const maxQueenCaptures = Math.max(...filtered.map(candidate => MoveEngine._moveWeight(candidate.move).queenCaptures));
    return filtered.filter(candidate => MoveEngine._moveWeight(candidate.move).queenCaptures === maxQueenCaptures);
  }

  /** Returns true if the given side has at least one legal move. */
  static hasAnyMoves(isWhitePiece, rules = null) {
    return MoveEngine.forColor(isWhitePiece, rules).length > 0;
  }

  /** Counts pieces of a given color currently on the board. */
  static countPieces(color) {
    return document.querySelectorAll(`#peca.${color}, #dama.${color}`).length;
  }
}

// ─── CheckersGame ─────────────────────────────────────────────────────────────
// Owns the DOM board, handles user input, and exposes applyMoveByPosition for AI.

class CheckersGame {
  constructor(boardElement) {
    this._boardEl = boardElement;
    this._selectedPiece = null;  // currently selected piece element
    this._highlighted = [];      // Movement[] shown in green
    this.whiteTurn = true;
    this._rules = MoveEngine._rules('italian');

    this._onMoveComplete = null; // (whiteTurn: boolean) => void
    this._onGameOver = null;     // (winnerColor: string) => void
  }

  /** Register a callback invoked after each successful move (before AI turn). */
  onMoveComplete(cb) { this._onMoveComplete = cb; }

  /** Register a callback invoked when the game ends. */
  onGameOver(cb) { this._onGameOver = cb; }

  // ── Initialisation ─────────────────────────────────────────────────────────

  init(pieces, version = 'italian') {
    this._rules = MoveEngine._rules(version);
    this.whiteTurn = this._rules.whiteStarts;
    this._selectedPiece = null;
    this._highlighted = [];
    this._generateGrid();
    this._placePieces(pieces);
    this._bindClick();
  }

  _generateGrid() {
    this._boardEl.innerHTML = '';
    for (let row = 0; row < 8; row++) {
      const tr = document.createElement('tr');
      for (let col = 0; col < 8; col++) {
        const td = document.createElement('td');
        td.setAttribute('id', 'casa');
        td.setAttribute('pos', `${col},${row}`);
        tr.appendChild(td);
      }
      this._boardEl.appendChild(tr);
    }
  }

  _placePieces(pieces) {
    pieces.forEach(p => {
      const el = document.createElement('div');
      el.setAttribute('id', 'peca');
      el.classList.add(p.color);
      const sq = this._boardEl.querySelector(`td[pos="${p.posX},${p.posY}"]`);
      if (sq) sq.appendChild(el);
    });
  }

  _bindClick() {
    // Replace previous handler so restarting the game doesn't stack listeners
    this._boardEl.onclick = e => this._handleClick(e.target);
  }

  // ── Input handling ─────────────────────────────────────────────────────────

  _handleClick(el) {
    const isPieceEl = el.id === 'peca' || el.id === 'dama';
    const isWhiteEl = el.classList.value === 'white';

    if (isPieceEl) {
      const isOwnPiece = this.whiteTurn ? isWhiteEl : !isWhiteEl;

      if (!isOwnPiece) {
        // Clicked enemy piece — only alert when nothing is selected
        if (!this._selectedPiece) {
          const t = typeof I18n !== 'undefined'
            ? I18n.t(this.whiteTurn ? 'whiteTurn' : 'blackTurn')
            : (this.whiteTurn ? "White's turn." : "Black's turn.");
          alert(t);
        }
        return;
      }

      // Select this piece
      this._clearHighlight();
      this._selectedPiece = el;
      const legalMoves = MoveEngine.forColor(this.whiteTurn, this._rules)
        .filter(candidate => candidate.piece === el)
        .map(candidate => candidate.move);
      this._highlighted = legalMoves;
      this._drawHighlight();
      return;
    }

    // Clicked a square — attempt move if a piece is selected
    if (this._selectedPiece && !isPieceEl) {
      const match = this._highlighted.find(m => m.toSquare === el);
      if (match) this._executeMove(this._selectedPiece, match);
    }
  }

  // ── Move execution ─────────────────────────────────────────────────────────

  _executeMove(pieceEl, movement) {
    const srcSquare = pieceEl.parentNode;

    // Remove captured pieces
    movement.eatSquares.forEach(sq => { sq.innerHTML = ''; });

    // Move piece to landing square
    srcSquare.removeChild(pieceEl);
    movement.toSquare.appendChild(pieceEl);

    // Promote to queen if reached the back row
    this._tryPromote(pieceEl, movement.toSquare);

    this._clearHighlight();
    this._selectedPiece = null;

    // Check all-captures win condition
    const captureWinner = this._checkCaptureWin();
    if (captureWinner) {
      this._onGameOver && this._onGameOver(captureWinner);
      return;
    }

    this.whiteTurn = !this.whiteTurn;

    // Check no-moves win condition
    if (!MoveEngine.hasAnyMoves(this.whiteTurn, this._rules)) {
      const wCount = MoveEngine.countPieces('white');
      const bCount = MoveEngine.countPieces('black');
      const noMoveWinner = wCount >= bCount ? 'white' : 'black';
      this._onGameOver && this._onGameOver(noMoveWinner);
      return;
    }

    this._onMoveComplete && this._onMoveComplete(this.whiteTurn);
  }

  /**
   * Public entry point for the AI to execute a move.
   * Finds the DOM movement matching from→to by position attribute and executes it.
   */
  applyMoveByPosition(fromX, fromY, toX, toY) {
    const srcSq = this._boardEl.querySelector(`td[pos="${fromX},${fromY}"]`);
    if (!srcSq || !srcSq.firstChild) return;

    const pieceEl = srcSq.firstChild;
    const isWhitePiece = pieceEl.classList.contains('white');
    const moves = MoveEngine.forColor(isWhitePiece, this._rules)
      .filter(candidate => candidate.piece === pieceEl)
      .map(candidate => candidate.move);

    // Match by position attribute string — avoids reference-equality pitfalls
    const match = moves.find(m => m.toSquare.getAttribute('pos') === `${toX},${toY}`);
    if (match) this._executeMove(pieceEl, match);
  }

  /**
   * Returns a logical board snapshot (board[y][x]) for the AI to analyse.
   * Each cell is null or { color: 'white'|'black', isQueen: boolean }.
   */
  getLogicalBoard() {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    this._boardEl.querySelectorAll('#peca, #dama').forEach(p => {
      const attr = p.parentNode.getAttribute('pos');
      if (!attr) return;
      const [x, y] = attr.split(',').map(Number);
      board[y][x] = {
        color: p.classList.contains('white') ? 'white' : 'black',
        isQueen: p.id === 'dama',
      };
    });
    return board;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  _tryPromote(pieceEl, toSquare) {
    const attr = toSquare.getAttribute('pos');
    if (!attr) return;
    const y = Number(attr.split(',')[1]);
    const isWhitePiece = pieceEl.classList.contains('white');
    const reachedEnd = isWhitePiece ? y === 0 : y === 7;
    if (reachedEnd && pieceEl.id !== 'dama') {
      pieceEl.setAttribute('id', 'dama');
      pieceEl.textContent = '👑';
    }
  }

  _checkCaptureWin() {
    const pieces = this._boardEl.querySelectorAll('#peca, #dama');
    const hasWhite = [...pieces].some(p => p.classList.contains('white'));
    const hasBlack = [...pieces].some(p => p.classList.contains('black'));
    if (!hasWhite) return 'black';
    if (!hasBlack) return 'white';
    return null;
  }

  _drawHighlight() {
    this._highlighted.forEach(m => {
      if (m.toSquare) {
        m.toSquare.className = '';
        m.toSquare.classList.add('verde');
      }
    });
  }

  _clearHighlight() {
    this._highlighted.forEach(m => {
      if (m.toSquare) m.toSquare.classList.remove('verde');
    });
    this._highlighted = [];
  }
}
