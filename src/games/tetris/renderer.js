import { COLS, ROWS, COLORS, getGhostY } from './logic.js';

export const CELL = 30;
export const CANVAS_W = COLS * CELL;
export const CANVAS_H = ROWS * CELL;

export function render(canvas, state) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background grid
  ctx.fillStyle = '#0d0d14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(CANVAS_W, y * CELL); ctx.stroke();
  }

  // Locked board
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      if (state.board[y][x]) drawCell(ctx, x, y, COLORS[state.board[y][x]]);

  // Ghost piece
  const ghostY = getGhostY(state);
  if (ghostY !== state.current.y) {
    state.current.shape.forEach((row, dy) =>
      row.forEach((cell, dx) => {
        if (cell) drawCell(ctx, state.current.x + dx, ghostY + dy, state.current.color, 0.2);
      })
    );
  }

  // Active piece
  state.current.shape.forEach((row, dy) =>
    row.forEach((cell, dx) => {
      if (cell) drawCell(ctx, state.current.x + dx, state.current.y + dy, state.current.color);
    })
  );
}

function drawCell(ctx, x, y, color, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  if (alpha > 0.5) {
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, 5);
  }
  ctx.globalAlpha = 1;
}

export function renderMini(canvas, piece) {
  if (!canvas || !piece) return;
  const ctx = canvas.getContext('2d');
  const size = 24;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0d0d14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const shape = piece.shape;
  const offX = Math.floor((canvas.width / size - shape[0].length) / 2);
  const offY = Math.floor((canvas.height / size - shape.length) / 2);

  shape.forEach((row, dy) =>
    row.forEach((cell, dx) => {
      if (!cell) return;
      ctx.fillStyle = piece.color;
      ctx.fillRect((offX + dx) * size + 1, (offY + dy) * size + 1, size - 2, size - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect((offX + dx) * size + 1, (offY + dy) * size + 1, size - 2, 5);
    })
  );
}
