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
        brazilian: {
          version: 'brazilian',
          whiteStarts: true,
          menCanCaptureKings: true,
          strictCapturePriority: true,
          flyingKings: true,
          menCaptureBackward: true,
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

// ─── Tiny test runner ──────────────────────────────────────────────────────────
// Logs a pass/fail line per test and a summary, exiting non-zero on any failure.

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓ PASS\x1b[0m  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  \x1b[31m✗ FAIL\x1b[0m  ${name}`);
    console.log(`         ${String(err.message).split('\n')[0]}`);
  }
}

console.log('\nItalian / English rules');

test('Italian men must not capture kings', () => {
  const captures = captureMovesFor([
    { x: 3, y: 5, color: 'white' },
    { x: 2, y: 4, color: 'black', isQueen: true },
  ], 'white');

  assert.equal(captures.length, 0, 'Italian men must not capture kings');
});

test('English men must capture kings', () => {
  const captures = captureMovesFor([
    { x: 3, y: 5, color: 'white' },
    { x: 2, y: 4, color: 'black', isQueen: true },
  ], 'white', 'english');

  assert.equal(captures.length, 1, 'English men must capture kings');
  assert.deepEqual(plainPositions(captures[0].eatPositions), [{ x: 2, y: 4 }]);
});

test('men must capture regular pieces', () => {
  const captures = captureMovesFor([
    { x: 3, y: 5, color: 'white' },
    { x: 2, y: 4, color: 'black' },
  ], 'white');

  assert.equal(captures.length, 1, 'men must capture regular pieces');
  assert.deepEqual(plainPositions(captures[0].eatPositions), [{ x: 2, y: 4 }]);
});

test('queens must capture queens', () => {
  const captures = captureMovesFor([
    { x: 3, y: 5, color: 'white', isQueen: true },
    { x: 2, y: 4, color: 'black', isQueen: true },
  ], 'white');

  assert.equal(captures.length, 1, 'queens must capture queens');
});

test('kings move one diagonal square (no flying)', () => {
  const moves = movesFor([
    { x: 3, y: 5, color: 'white', isQueen: true },
  ], 'white');

  assert.equal(moves.some(move => move.toX === 1 && move.toY === 3), false, 'kings must not slide multiple squares');
  assert.equal(moves.some(move => move.toX === 2 && move.toY === 4), true, 'kings must move one diagonal square');
});

test('kings must not capture from distance', () => {
  const captures = captureMovesFor([
    { x: 5, y: 5, color: 'white', isQueen: true },
    { x: 3, y: 3, color: 'black' },
  ], 'white');

  assert.equal(captures.length, 0, 'kings must not capture from distance');
});

test('kings must capture adjacent enemy pieces', () => {
  const captures = captureMovesFor([
    { x: 4, y: 4, color: 'white', isQueen: true },
    { x: 3, y: 3, color: 'black' },
  ], 'white');

  assert.equal(captures.length, 1, 'kings must capture adjacent enemy pieces');
  assert.deepEqual(plainPositions(captures[0].eatPositions), [{ x: 3, y: 3 }]);
});

test('Italian capture must be mandatory', () => {
  const moves = movesFor([
    { x: 3, y: 5, color: 'white' },
    { x: 2, y: 4, color: 'black' },
  ], 'white', 'italian');

  assert.equal(moves.every(move => move.eatPositions.length > 0), true, 'Italian capture must be mandatory');
});

test('English capture must be mandatory', () => {
  const moves = movesFor([
    { x: 3, y: 2, color: 'black' },
    { x: 2, y: 3, color: 'white' },
  ], 'black', 'english');

  assert.equal(moves.every(move => move.eatPositions.length > 0), true, 'English capture must be mandatory');
});

test('Italian rules must prefer the longest capture', () => {
  const moves = movesFor([
    { x: 1, y: 5, color: 'white' },
    { x: 2, y: 4, color: 'black' },
    { x: 4, y: 2, color: 'black' },
    { x: 5, y: 5, color: 'white' },
    { x: 6, y: 4, color: 'black' },
  ], 'white', 'italian');

  assert.equal(moves.length, 1, 'Italian rules must prefer the longest capture');
  assert.equal(moves[0].eatPositions.length, 2);
});

test('English rules must not force the longest capture', () => {
  const moves = movesFor([
    { x: 1, y: 5, color: 'white' },
    { x: 2, y: 4, color: 'black' },
    { x: 4, y: 2, color: 'black' },
    { x: 5, y: 5, color: 'white' },
    { x: 6, y: 4, color: 'black' },
  ], 'white', 'english');

  assert.equal(moves.length, 2, 'English rules must not force the longest capture');
  assert.equal(moves.every(move => move.eatPositions.length > 0), true, 'English capture must be mandatory');
});

test('Italian equal captures must prefer king over man', () => {
  const captures = captureMovesFor([
    { x: 3, y: 5, color: 'white', isQueen: true },
    { x: 2, y: 4, color: 'black' },
    { x: 5, y: 5, color: 'white' },
    { x: 6, y: 4, color: 'black' },
  ], 'white', 'italian');

  assert.equal(captures.length, 1, 'Italian equal captures must prefer king over man');
  assert.equal(captures[0].fromX, 3);
  assert.equal(captures[0].fromY, 5);
});

console.log('\nBrazilian rules');

test('Brazilian kings must fly multiple squares', () => {
  const moves = movesFor([
    { x: 3, y: 5, color: 'white', isQueen: true },
  ], 'white', 'brazilian');

  assert.equal(moves.some(move => move.toX === 1 && move.toY === 3), true, 'Brazilian kings must fly multiple squares');
  assert.equal(moves.some(move => move.toX === 0 && move.toY === 2), true, 'Brazilian kings reach the board edge');
});

test('Brazilian kings capture from a distance, landing anywhere beyond', () => {
  const captures = captureMovesFor([
    { x: 5, y: 5, color: 'white', isQueen: true },
    { x: 3, y: 3, color: 'black' },
  ], 'white', 'brazilian');

  assert.equal(captures.length, 3, 'Brazilian kings capture from a distance and may land on any square beyond');
  assert.equal(captures.every(move => move.eatPositions.length === 1), true, 'each landing captures the same single piece');
  assert.deepEqual(plainPositions(captures[0].eatPositions), [{ x: 3, y: 3 }]);
});

test('Brazilian men must capture backward', () => {
  const captures = captureMovesFor([
    { x: 3, y: 5, color: 'white' },
    { x: 2, y: 6, color: 'black' },
  ], 'white', 'brazilian');

  assert.equal(captures.length, 1, 'Brazilian men must capture backward');
  assert.deepEqual(plainPositions(captures[0].eatPositions), [{ x: 2, y: 6 }]);
});

test('Italian men must not capture backward', () => {
  const captures = captureMovesFor([
    { x: 3, y: 5, color: 'white' },
    { x: 2, y: 6, color: 'black' },
  ], 'white', 'italian');

  assert.equal(captures.length, 0, 'Italian men must not capture backward');
});

// ─── Summary ────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n${passed}/${total} passed` + (failed ? `, \x1b[31m${failed} failed\x1b[0m` : ', \x1b[32mall green\x1b[0m'));
if (failed) process.exitCode = 1;
