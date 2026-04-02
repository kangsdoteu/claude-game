export const GRID = 20;

export function createState() {
  const snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  return {
    snake,
    dir:     { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food:    spawnFood(snake),
    score:   0,
    speed:   150,
    alive:   true,
    startTime: Date.now(),
  };
}

export function tick(state) {
  if (!state.alive) return state;

  const dir = state.nextDir;
  const head = state.snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  // Wall collision
  if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID)
    return { ...state, dir, alive: false };

  // Self collision
  if (state.snake.some(s => s.x === newHead.x && s.y === newHead.y))
    return { ...state, dir, alive: false };

  const newSnake = [newHead, ...state.snake];
  const ateFood = newHead.x === state.food.x && newHead.y === state.food.y;

  if (!ateFood) newSnake.pop();

  const newScore = ateFood ? state.score + 10 : state.score;
  const newSpeed = ateFood && newScore % 50 === 0
    ? Math.max(60, state.speed - 10)
    : state.speed;

  return {
    ...state,
    snake:   newSnake,
    dir,
    nextDir: dir,
    food:    ateFood ? spawnFood(newSnake) : state.food,
    score:   newScore,
    speed:   newSpeed,
  };
}

export function setDirection(state, newDir) {
  // Prevent 180° turn
  if (newDir.x === -state.dir.x && newDir.y === -state.dir.y) return state;
  return { ...state, nextDir: newDir };
}

function spawnFood(snake) {
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (occupied.has(`${pos.x},${pos.y}`));
  return pos;
}
