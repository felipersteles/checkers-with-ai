'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoDir = __dirname;

function loadCheckerLogic() {
  const context = {
    console,
    document: null,
    checkersRules(version) {
      const rules = {
        italian: {
          version: 'italian',
          whiteStarts: true,
          menCanCaptureKings: false,
          strictCapturePriority: true,
        },
        english: {
          version: 'english',
          whiteStarts: false,
          menCanCaptureKings: true,
          strictCapturePriority: false,
        },
      };

      return rules[version] || rules.italian;
    },
  };

  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(repoDir, 'game.js'), 'utf8') +
      '\nthis.MoveEngine = MoveEngine;',
    context
  );
  vm.runInContext(
    fs.readFileSync(path.join(repoDir, 'machine.js'), 'utf8') +
      '\nthis.LogicalBoard = LogicalBoard; this.LogicalMoveEngine = LogicalMoveEngine;',
    context
  );
  return context;
}

function buildBoard(pieces) {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));

  pieces.forEach(piece => {
    board[piece.y][piece.x] = {
      color: piece.color,
      isQueen: !!piece.isQueen,
    };
  });

  return board;
}

function movesFor(pieces, color, version = 'italian') {
  const { LogicalBoard, LogicalMoveEngine } = loadCheckerLogic();
  return LogicalMoveEngine.getAllMoves(new LogicalBoard(buildBoard(pieces)), color, version);
}

function captureMovesFor(pieces, color, version = 'italian') {
  return movesFor(pieces, color, version).filter(move => move.eatPositions.length > 0);
}

function plainPositions(positions) {
  return Array.from(positions, pos => ({ x: pos.x, y: pos.y }));
}

{
  const captures = captureMovesFor([
    { x: 3, y: 5, color: 'white' },
    { x: 2, y: 4, color: 'black', isQueen: true },
  ], 'white');

  assert.equal(captures.length, 0, 'Italian men must not capture kings');
}

{
  const captures = captureMovesFor([
    { x: 3, y: 5, color: 'white' },
    { x: 2, y: 4, color: 'black', isQueen: true },
  ], 'white', 'english');

  assert.equal(captures.length, 1, 'English men must capture kings');
  assert.deepEqual(plainPositions(captures[0].eatPositions), [{ x: 2, y: 4 }]);
}

{
  const captures = captureMovesFor([
    { x: 3, y: 5, color: 'white' },
    { x: 2, y: 4, color: 'black' },
  ], 'white');

  assert.equal(captures.length, 1, 'men must capture regular pieces');
  assert.deepEqual(plainPositions(captures[0].eatPositions), [{ x: 2, y: 4 }]);
}

{
  const captures = captureMovesFor([
    { x: 3, y: 5, color: 'white', isQueen: true },
    { x: 2, y: 4, color: 'black', isQueen: true },
  ], 'white');

  assert.equal(captures.length, 1, 'queens must capture queens');
}

{
  const moves = movesFor([
    { x: 3, y: 5, color: 'white', isQueen: true },
  ], 'white');

  assert.equal(moves.some(move => move.toX === 1 && move.toY === 3), false, 'kings must not slide multiple squares');
  assert.equal(moves.some(move => move.toX === 2 && move.toY === 4), true, 'kings must move one diagonal square');
}

{
  const captures = captureMovesFor([
    { x: 5, y: 5, color: 'white', isQueen: true },
    { x: 3, y: 3, color: 'black' },
  ], 'white');

  assert.equal(captures.length, 0, 'kings must not capture from distance');
}

{
  const captures = captureMovesFor([
    { x: 4, y: 4, color: 'white', isQueen: true },
    { x: 3, y: 3, color: 'black' },
  ], 'white');

  assert.equal(captures.length, 1, 'kings must capture adjacent enemy pieces');
  assert.deepEqual(plainPositions(captures[0].eatPositions), [{ x: 3, y: 3 }]);
}

{
  const moves = movesFor([
    { x: 3, y: 5, color: 'white' },
    { x: 2, y: 4, color: 'black' },
  ], 'white', 'italian');

  assert.equal(moves.every(move => move.eatPositions.length > 0), true, 'Italian capture must be mandatory');
}

{
  const moves = movesFor([
    { x: 3, y: 2, color: 'black' },
    { x: 2, y: 3, color: 'white' },
  ], 'black', 'english');

  assert.equal(moves.every(move => move.eatPositions.length > 0), true, 'English capture must be mandatory');
}

{
  const moves = movesFor([
    { x: 1, y: 5, color: 'white' },
    { x: 2, y: 4, color: 'black' },
    { x: 4, y: 2, color: 'black' },
    { x: 5, y: 5, color: 'white' },
    { x: 6, y: 4, color: 'black' },
  ], 'white', 'italian');

  assert.equal(moves.length, 1, 'Italian rules must prefer the longest capture');
  assert.equal(moves[0].eatPositions.length, 2);
}

{
  const moves = movesFor([
    { x: 1, y: 5, color: 'white' },
    { x: 2, y: 4, color: 'black' },
    { x: 4, y: 2, color: 'black' },
    { x: 5, y: 5, color: 'white' },
    { x: 6, y: 4, color: 'black' },
  ], 'white', 'english');

  assert.equal(moves.length, 2, 'English rules must not force the longest capture');
  assert.equal(moves.every(move => move.eatPositions.length > 0), true, 'English capture must be mandatory');
}

{
  const captures = captureMovesFor([
    { x: 3, y: 5, color: 'white', isQueen: true },
    { x: 2, y: 4, color: 'black' },
    { x: 5, y: 5, color: 'white' },
    { x: 6, y: 4, color: 'black' },
  ], 'white', 'italian');

  assert.equal(captures.length, 1, 'Italian equal captures must prefer king over man');
  assert.equal(captures[0].fromX, 3);
  assert.equal(captures[0].fromY, 5);
}
