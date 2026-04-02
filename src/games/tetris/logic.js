export const COLS = 10;
export const ROWS = 20;

export const TETROMINOES = {
  I: { id: 1, color: '#00f0f0', shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
  O: { id: 2, color: '#f0f000', shape: [[1,1],[1,1]] },
  T: { id: 3, color: '#a000f0', shape: [[0,1,0],[1,1,1],[0,0,0]] },
  S: { id: 4, color: '#00f000', shape: [[0,1,1],[1,1,0],[0,0,0]] },
  Z: { id: 5, color: '#f00000', shape: [[1,1,0],[0,1,1],[0,0,0]] },
  J: { id: 6, color: '#0000f0', shape: [[1,0,0],[1,1,1],[0,0,0]] },
  L: { id: 7, color: '#f0a000', shape: [[0,0,1],[1,1,1],[0,0,0]] },
};

export const COLORS = ['#111', '#00f0f0', '#f0f000', '#a000f0', '#00f000', '#f00000', '#0000f0', '#f0a000'];

// Drop speed in ms per level (0-9)
const LEVEL_SPEEDS = [800, 720, 630, 550, 470, 380, 300, 220, 130, 100];

// 7-bag randomizer: Fisher-Yates shuffle
function createBag() {
  const bag = ['I','O','T','S','Z','J','L'];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function spawnPiece(key) {
  const t = TETROMINOES[key];
  return {
    id: t.id,
    color: t.color,
    shape: t.shape.map(r => [...r]),
    x: Math.floor((COLS - t.shape[0].length) / 2),
    y: 0,
  };
}

export function createState() {
  let bag = createBag();
  let nextBag = createBag();

  const current = spawnPiece(bag.shift());
  const next = spawnPiece(bag.length ? bag[0] : nextBag[0]);

  return {
    board: createBoard(),
    current,
    next,
    held: null,
    holdUsed: false,
    bag,
    nextBag,
    score: 0,
    level: 0,
    lines: 0,
    alive: true,
    startTime: Date.now(),
  };
}

function nextPiece(state) {
  let { bag, nextBag } = state;
  if (!bag.length) { bag = nextBag; nextBag = createBag(); }
  const key = bag.shift();
  if (!bag.length) { bag = nextBag; nextBag = createBag(); }
  return { piece: spawnPiece(key), bag, nextBag, nextPieceKey: bag[0] ?? nextBag[0] };
}

// Clockwise rotation via matrix transpose + row reverse
export function rotateMatrix(matrix) {
  const N = matrix.length;
  const r = matrix.map(row => [...row]);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < y; x++)
      [r[y][x], r[x][y]] = [r[x][y], r[y][x]];
  r.forEach(row => row.reverse());
  return r;
}

export function collides(board, shape, ox, oy) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const nx = ox + x, ny = oy + y;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

const WALL_KICKS = [[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1]];

export function dispatch(state, action) {
  if (!state.alive) return state;
  let { current, board } = state;

  switch (action) {
    case 'moveLeft':
      if (!collides(board, current.shape, current.x - 1, current.y))
        return { ...state, current: { ...current, x: current.x - 1 } };
      break;

    case 'moveRight':
      if (!collides(board, current.shape, current.x + 1, current.y))
        return { ...state, current: { ...current, x: current.x + 1 } };
      break;

    case 'softDrop': {
      if (!collides(board, current.shape, current.x, current.y + 1))
        return { ...state, current: { ...current, y: current.y + 1 }, score: state.score + 1 };
      return lockPiece(state);
    }

    case 'hardDrop': {
      let dy = 0;
      while (!collides(board, current.shape, current.x, current.y + dy + 1)) dy++;
      return lockPiece({ ...state, current: { ...current, y: current.y + dy }, score: state.score + dy * 2 });
    }

    case 'rotate': {
      const rotated = rotateMatrix(current.shape);
      for (const [dx, dy] of WALL_KICKS) {
        if (!collides(board, rotated, current.x + dx, current.y + dy))
          return { ...state, current: { ...current, shape: rotated, x: current.x + dx, y: current.y + dy } };
      }
      break;
    }

    case 'hold': {
      if (state.holdUsed) break;
      const heldKey = state.held;
      const newHeld = { id: current.id, color: current.color, shape: TETROMINOES[
        Object.keys(TETROMINOES).find(k => TETROMINOES[k].id === current.id)
      ].shape.map(r => [...r]) };
      const nextCurrent = heldKey
        ? spawnPiece(Object.keys(TETROMINOES).find(k => TETROMINOES[k].id === heldKey.id))
        : (() => { const n = nextPiece(state); return n.piece; })();
      if (collides(board, nextCurrent.shape, nextCurrent.x, nextCurrent.y))
        return { ...state, alive: false };
      return { ...state, current: nextCurrent, held: newHeld, holdUsed: true };
    }
  }
  return state;
}

function lockPiece(state) {
  const { current, board } = state;
  const newBoard = board.map(row => [...row]);

  for (let y = 0; y < current.shape.length; y++)
    for (let x = 0; x < current.shape[y].length; x++)
      if (current.shape[y][x] && current.y + y >= 0)
        newBoard[current.y + y][current.x + x] = current.id;

  // Clear lines
  const cleared = newBoard.filter(row => row.every(c => c !== 0));
  const linesCleared = cleared.length;
  const remaining = newBoard.filter(row => row.some(c => c === 0));
  const empties = Array.from({ length: linesCleared }, () => new Array(COLS).fill(0));
  const finalBoard = [...empties, ...remaining];

  const LINE_SCORES = [0, 100, 300, 500, 800];
  const newLines = state.lines + linesCleared;
  const newLevel = Math.floor(newLines / 10);
  const newScore = state.score + LINE_SCORES[linesCleared] * (state.level + 1);

  // Spawn next piece
  const { piece: newCurrent, bag, nextBag } = nextPiece({ ...state, bag: [...state.bag], nextBag: [...state.nextBag] });

  if (collides(finalBoard, newCurrent.shape, newCurrent.x, newCurrent.y))
    return { ...state, board: finalBoard, score: newScore, lines: newLines, level: newLevel, alive: false };

  return {
    ...state,
    board: finalBoard,
    current: newCurrent,
    bag,
    nextBag,
    holdUsed: false,
    score: newScore,
    lines: newLines,
    level: newLevel,
  };
}

export function getGhostY(state) {
  let dy = 0;
  while (!collides(state.board, state.current.shape, state.current.x, state.current.y + dy + 1)) dy++;
  return state.current.y + dy;
}

export function getLevelSpeed(level) {
  return LEVEL_SPEEDS[Math.min(level, 9)];
}
