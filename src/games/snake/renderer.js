import { GRID } from './logic.js';

export const CELL = 20;
export const CANVAS_SIZE = GRID * CELL;

export function render(canvas, state) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, CANVAS_SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(CANVAS_SIZE, i * CELL); ctx.stroke();
  }

  // Snake body (gradient from head to tail)
  state.snake.forEach(({ x, y }, i) => {
    const t = i / state.snake.length;
    ctx.fillStyle = `hsl(120, 80%, ${60 - t * 35}%)`;
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  });

  // Head highlight
  if (state.snake.length > 0) {
    ctx.fillStyle = '#7fff00';
    const { x, y } = state.snake[0];
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  }

  // Food
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.arc(
    state.food.x * CELL + CELL / 2,
    state.food.y * CELL + CELL / 2,
    CELL / 2 - 2, 0, Math.PI * 2
  );
  ctx.fill();
}
