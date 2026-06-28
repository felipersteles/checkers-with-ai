'use strict';

// ─── Translations ───────────────────────────────────────────────────────────
// All user-facing strings, keyed by a stable identifier. Values may contain
// inline HTML (e.g. <kbd>, <strong>) — they are trusted, author-provided text.
//
// Static DOM text is wired via `data-i18n` / `data-i18n-placeholder` attributes
// and applied by I18n.apply(). Dynamic strings (turn alerts, win banner, rule
// text) are looked up directly through I18n.t() / I18n.ruleText().

const TRANSLATIONS = {
  en: {
    // Sidebar
    madeBy: 'made by',
    tabTips: 'Tips',
    tabRules: 'Rules',
    tabControls: 'Controls',
    settings: 'Settings',
    theme: 'Theme',
    themeLight: '☀️ Light',
    themeDark: '🌙 Dark',
    language: 'Language',

    // Tips
    tip1: 'Control the center of the board early on.',
    tip2: "Keep your back row intact to prevent your opponent from getting kings.",
    tip3: 'Move in groups — lone pieces are easy targets.',
    tip4: 'Force your opponent into double jumps you can block.',
    tip5: "Trade pieces when you're ahead; avoid trades when behind.",
    tip6: 'Green squares show where a selected piece can move.',

    // Rules (static items)
    rulePieces: 'Each player starts with 12 pieces on dark squares.',
    ruleMove: 'Pieces move diagonally forward one square at a time.',
    ruleCapture: 'Captures are made by jumping over an enemy piece to an empty square.',
    ruleMandatory: 'Captures are mandatory when available.',
    ruleMulti: 'Multiple captures in one turn are allowed and encouraged.',
    ruleKing: "Reach the opponent's back row to become a <strong>King</strong>.",
    ruleKingMove: 'Kings can move and capture both forward and backward.',
    ruleWinAll: 'The player who captures all enemy pieces wins.',
    ruleNoMoves: 'If a player has no moves left, the player with more pieces wins.',

    // Controls
    ctrl1: '<kbd>Click</kbd> a piece to select it.',
    ctrl2: 'Green squares highlight valid moves.',
    ctrl3: '<kbd>Click</kbd> a green square to move there.',
    ctrl4: 'Turns alternate between White and Black.',
    ctrl5: 'Press <kbd>New Game</kbd> to reset the board.',

    // Menu
    menuTitle: 'Checkers',
    menuSubtitle: 'Choose a game mode to start',
    modeMultiName: 'Two Players',
    modeMultiDesc: 'Local multiplayer',
    modeMachineName: 'vs Machine',
    modeMachineDesc: 'Play against AI',
    versionLabel: 'Version',
    verItalian: '🇮🇹 Italian',
    verEnglish: '🇬🇧 English',
    verBrazilian: '🇧🇷 Brazilian',
    difficultyLabel: 'Difficulty',
    diffEasy: 'Easy',
    diffMedium: 'Medium',
    diffHard: 'Hard',
    labelWhite: 'White player',
    labelBlack: 'Black player',
    phWhite: 'Player 1',
    phBlack: 'Player 2',
    startBtn: 'Start Game',

    // Game
    turnLabel: 'Your turn',
    resign: 'Resign',
    backBtn: '← Menu',
    newGame: 'New Game',

    // Dynamic
    whiteTurn: "White's turn.",
    blackTurn: "Black's turn.",
    wins: '{name} wins!',
    defaultWhite: 'Player 1',
    defaultBlack: 'Player 2',
    machine: 'Machine',

    // Rule text (per version) shown in the Rules tab
    ruleText: {
      italian: {
        start: 'White starts.',
        menKings: 'Men cannot capture Kings.',
        captureChoice: 'When multiple captures are available, the longest capture is mandatory.',
      },
      english: {
        start: 'Black starts.',
        menKings: 'Men can capture Kings.',
        captureChoice: 'When captures are available, any capture is valid.',
      },
      brazilian: {
        start: 'White starts.',
        menKings: 'Men can capture Kings, and capture both forward and backward.',
        captureChoice: 'Kings fly any distance; the longest capture is mandatory.',
      },
    },
  },

  es: {
    // Sidebar
    madeBy: 'hecho por',
    tabTips: 'Consejos',
    tabRules: 'Reglas',
    tabControls: 'Controles',
    settings: 'Ajustes',
    theme: 'Tema',
    themeLight: '☀️ Claro',
    themeDark: '🌙 Oscuro',
    language: 'Idioma',

    // Tips
    tip1: 'Controla el centro del tablero desde el principio.',
    tip2: 'Mantén tu última fila intacta para evitar que el rival corone damas.',
    tip3: 'Mueve en grupo — las piezas solitarias son presa fácil.',
    tip4: 'Obliga al rival a saltos dobles que puedas bloquear.',
    tip5: 'Cambia piezas cuando vas ganando; evítalo cuando vas perdiendo.',
    tip6: 'Las casillas verdes muestran a dónde puede mover la pieza elegida.',

    // Rules (static items)
    rulePieces: 'Cada jugador empieza con 12 piezas en las casillas oscuras.',
    ruleMove: 'Las piezas se mueven en diagonal hacia adelante, una casilla a la vez.',
    ruleCapture: 'Se captura saltando sobre una pieza enemiga hacia una casilla vacía.',
    ruleMandatory: 'Las capturas son obligatorias cuando están disponibles.',
    ruleMulti: 'Se permiten y se recomiendan las capturas múltiples en un turno.',
    ruleKing: 'Llega a la última fila del rival para convertirte en <strong>Dama</strong>.',
    ruleKingMove: 'Las damas pueden mover y capturar hacia adelante y hacia atrás.',
    ruleWinAll: 'Gana quien capture todas las piezas enemigas.',
    ruleNoMoves: 'Si un jugador no tiene movimientos, gana quien tenga más piezas.',

    // Controls
    ctrl1: '<kbd>Clic</kbd> en una pieza para seleccionarla.',
    ctrl2: 'Las casillas verdes resaltan los movimientos válidos.',
    ctrl3: '<kbd>Clic</kbd> en una casilla verde para mover allí.',
    ctrl4: 'Los turnos se alternan entre Blancas y Negras.',
    ctrl5: 'Pulsa <kbd>Nueva partida</kbd> para reiniciar el tablero.',

    // Menu
    menuTitle: 'Damas',
    menuSubtitle: 'Elige un modo de juego para empezar',
    modeMultiName: 'Dos Jugadores',
    modeMultiDesc: 'Multijugador local',
    modeMachineName: 'vs Máquina',
    modeMachineDesc: 'Juega contra la IA',
    versionLabel: 'Versión',
    verItalian: '🇮🇹 Italiana',
    verEnglish: '🇬🇧 Inglesa',
    verBrazilian: '🇧🇷 Brasileña',
    difficultyLabel: 'Dificultad',
    diffEasy: 'Fácil',
    diffMedium: 'Media',
    diffHard: 'Difícil',
    labelWhite: 'Jugador blanco',
    labelBlack: 'Jugador negro',
    phWhite: 'Jugador 1',
    phBlack: 'Jugador 2',
    startBtn: 'Empezar',

    // Game
    turnLabel: 'Tu turno',
    resign: 'Rendirse',
    backBtn: '← Menú',
    newGame: 'Nueva partida',

    // Dynamic
    whiteTurn: 'Turno de las blancas.',
    blackTurn: 'Turno de las negras.',
    wins: '¡{name} gana!',
    defaultWhite: 'Jugador 1',
    defaultBlack: 'Jugador 2',
    machine: 'Máquina',

    // Rule text (per version)
    ruleText: {
      italian: {
        start: 'Empiezan las blancas.',
        menKings: 'Los peones no pueden capturar damas.',
        captureChoice: 'Cuando hay varias capturas, la más larga es obligatoria.',
      },
      english: {
        start: 'Empiezan las negras.',
        menKings: 'Los peones pueden capturar damas.',
        captureChoice: 'Cuando hay capturas disponibles, cualquiera es válida.',
      },
      brazilian: {
        start: 'Empiezan las blancas.',
        menKings: 'Los peones capturan damas y capturan hacia adelante y atrás.',
        captureChoice: 'Las damas vuelan cualquier distancia; la captura más larga es obligatoria.',
      },
    },
  },

  pt: {
    // Sidebar
    madeBy: 'feito por',
    tabTips: 'Dicas',
    tabRules: 'Regras',
    tabControls: 'Controles',
    settings: 'Ajustes',
    theme: 'Tema',
    themeLight: '☀️ Claro',
    themeDark: '🌙 Escuro',
    language: 'Idioma',

    // Tips
    tip1: 'Controle o centro do tabuleiro desde cedo.',
    tip2: 'Mantenha sua última fileira intacta para impedir damas do adversário.',
    tip3: 'Mova em grupo — peças isoladas são alvos fáceis.',
    tip4: 'Force o adversário a saltos duplos que você possa bloquear.',
    tip5: 'Troque peças quando estiver à frente; evite trocas quando atrás.',
    tip6: 'As casas verdes mostram para onde a peça selecionada pode ir.',

    // Rules (static items)
    rulePieces: 'Cada jogador começa com 12 peças nas casas escuras.',
    ruleMove: 'As peças movem na diagonal para frente, uma casa por vez.',
    ruleCapture: 'A captura é feita saltando sobre uma peça inimiga para uma casa vazia.',
    ruleMandatory: 'As capturas são obrigatórias quando disponíveis.',
    ruleMulti: 'Capturas múltiplas em um turno são permitidas e incentivadas.',
    ruleKing: 'Chegue à última fileira do adversário para virar <strong>Dama</strong>.',
    ruleKingMove: 'As damas movem e capturam para frente e para trás.',
    ruleWinAll: 'Vence quem capturar todas as peças inimigas.',
    ruleNoMoves: 'Se um jogador não tem jogadas, vence quem tiver mais peças.',

    // Controls
    ctrl1: '<kbd>Clique</kbd> em uma peça para selecioná-la.',
    ctrl2: 'As casas verdes destacam as jogadas válidas.',
    ctrl3: '<kbd>Clique</kbd> em uma casa verde para mover até lá.',
    ctrl4: 'Os turnos alternam entre Brancas e Pretas.',
    ctrl5: 'Pressione <kbd>Novo Jogo</kbd> para reiniciar o tabuleiro.',

    // Menu
    menuTitle: 'Damas',
    menuSubtitle: 'Escolha um modo de jogo para começar',
    modeMultiName: 'Dois Jogadores',
    modeMultiDesc: 'Multijogador local',
    modeMachineName: 'vs Máquina',
    modeMachineDesc: 'Jogue contra a IA',
    versionLabel: 'Versão',
    verItalian: '🇮🇹 Italiana',
    verEnglish: '🇬🇧 Inglesa',
    verBrazilian: '🇧🇷 Brasileira',
    difficultyLabel: 'Dificuldade',
    diffEasy: 'Fácil',
    diffMedium: 'Média',
    diffHard: 'Difícil',
    labelWhite: 'Jogador branco',
    labelBlack: 'Jogador preto',
    phWhite: 'Jogador 1',
    phBlack: 'Jogador 2',
    startBtn: 'Iniciar Jogo',

    // Game
    turnLabel: 'Sua vez',
    resign: 'Desistir',
    backBtn: '← Menu',
    newGame: 'Novo Jogo',

    // Dynamic
    whiteTurn: 'Vez das brancas.',
    blackTurn: 'Vez das pretas.',
    wins: '{name} venceu!',
    defaultWhite: 'Jogador 1',
    defaultBlack: 'Jogador 2',
    machine: 'Máquina',

    // Rule text (per version)
    ruleText: {
      italian: {
        start: 'As brancas começam.',
        menKings: 'Peças simples não capturam damas.',
        captureChoice: 'Quando há várias capturas, a mais longa é obrigatória.',
      },
      english: {
        start: 'As pretas começam.',
        menKings: 'Peças simples podem capturar damas.',
        captureChoice: 'Quando há capturas disponíveis, qualquer uma é válida.',
      },
      brazilian: {
        start: 'As brancas começam.',
        menKings: 'Peças simples capturam damas e capturam para frente e para trás.',
        captureChoice: 'As damas voam qualquer distância; a captura mais longa é obrigatória.',
      },
    },
  },
};

// ─── I18n ─────────────────────────────────────────────────────────────────────
// Tiny runtime helper. `current` is the active language code.

const I18n = {
  STORAGE_KEY: 'checkers_lang',
  current: 'en',
  available: ['en', 'es', 'pt'],
  langNames: { en: 'English', es: 'Español', pt: 'Português' },

  /** Loads the saved language (falling back to the browser locale, then 'en'). */
  init() {
    let lang = null;
    try { lang = localStorage.getItem(I18n.STORAGE_KEY); } catch (_) {}
    if (!lang) {
      const nav = (navigator.language || 'en').slice(0, 2);
      lang = I18n.available.includes(nav) ? nav : 'en';
    }
    I18n.current = TRANSLATIONS[lang] ? lang : 'en';
    return I18n.current;
  },

  /** Returns the translated string for `key`, with optional {placeholder} vars. */
  t(key, vars) {
    const dict = TRANSLATIONS[I18n.current] || TRANSLATIONS.en;
    let str = dict[key];
    if (str == null) str = TRANSLATIONS.en[key];
    if (str == null) return key;
    if (vars) str = str.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? vars[name] : m));
    return str;
  },

  /** Returns the per-version rule-text object for the active language. */
  ruleText(version) {
    const dict = TRANSLATIONS[I18n.current] || TRANSLATIONS.en;
    const table = dict.ruleText || TRANSLATIONS.en.ruleText;
    return table[version] || table.italian;
  },

  /** Persists and activates `lang`, then re-applies static DOM translations. */
  setLang(lang) {
    if (!TRANSLATIONS[lang]) return;
    I18n.current = lang;
    try { localStorage.setItem(I18n.STORAGE_KEY, lang); } catch (_) {}
    I18n.apply();
  },

  /** Walks the DOM and fills every [data-i18n] / [data-i18n-placeholder] node. */
  apply(root = document) {
    document.documentElement.lang = I18n.current;
    root.querySelectorAll('[data-i18n]').forEach(el => {
      el.innerHTML = I18n.t(el.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.setAttribute('placeholder', I18n.t(el.dataset.i18nPlaceholder));
    });
  },
};

// Expose for non-module consumers (script.js loads files via <script>).
if (typeof window !== 'undefined') {
  window.TRANSLATIONS = TRANSLATIONS;
  window.I18n = I18n;
}
