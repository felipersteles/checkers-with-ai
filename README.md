# Checkers

A classic Checkers (Draughts) game built with pure **HTML**, **CSS**, and **JavaScript** — no frameworks, no dependencies.

## Features

- **Two game modes** — local multiplayer or vs AI
- **Two rule versions** — Italian or English checkers
- **Three difficulty levels** — Easy, Medium, Hard
- **King promotion** — pieces that reach the back row become Kings
- **Multi-jump captures** — chain captures in a single turn
- **Player names** — customizable before each game
- **Resign button** — concede at any point
- **Responsive layout** — works on desktop and mobile

## Getting Started

```bash
git clone https://github.com/felipersteles/learning-checkers.git
cd learning-checkers
open index.html
```

No build step required. Just open `index.html` in any modern browser.

## Project Structure

```
.
├── index.html              # Markup and layout
├── style.css               # Styles and animations
├── script.js               # Core game logic and board rendering
├── game.js                 # Game state management
├── machine.js              # AI opponent logic
├── menu.js                 # Menu and mode selection
├── checker-rules.test.js   # Rule regression tests
└── favicon.ico
```

## How to Play

1. Choose **Two Players** for local multiplayer or **vs Machine** for AI
2. Choose **Italian** or **English** rules
3. (Optional) Set player names and difficulty
4. Click **Start Game**
5. Click a piece to select it — valid moves highlight in green
6. Click a highlighted square to move
7. Capture all enemy pieces or leave them with no moves to win

## Rules

- Pieces move diagonally forward one square at a time
- Capture by jumping over an enemy piece to an empty square behind it
- Multiple captures in one turn are allowed
- Reach the opponent's back row to promote to a **King**
- Kings can move and capture in all four diagonal directions
- **Italian** — White starts, men cannot capture Kings, and the longest capture is mandatory
- **English** — Black starts, men can capture Kings, and any available capture is valid

## Rule Tests

`checker-rules.test.js` is a small Node.js regression test for the Italian and English rule engines. It is not used by the browser game at runtime, but it helps verify that future changes do not break captures, Kings, mandatory captures, or AI move generation.

Run it with:

```bash
node checker-rules.test.js
```

## Contributing

Pull requests are welcome. Feel free to open an issue for bugs, feature ideas, or improvements.

## License

MIT
