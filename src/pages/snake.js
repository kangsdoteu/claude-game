import { createState, tick } from '../games/snake/logic.js';
import { render, CANVAS_SIZE } from '../games/snake/renderer.js';
import { bindControls, bindTouchControls } from '../games/snake/controls.js';
import { saveScore } from '../api/scores.js';
import { getUser } from '../api/auth.js';
import { renderLeaderboard } from '../ui/leaderboard.js';

export function mount(container) {
  let state = createState();
  let rafId = null;
  let lastTime = 0;
  let tickAcc = 0;
  let paused = false;
  let gameOver = false;
  let cleanupControls = null;
  let cleanupTouch = null;

  container.innerHTML = `
    <div class="game-page">
      <div class="game-layout">
        <div class="game-area">
          <canvas id="snake-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          <div class="game-over-overlay hidden" id="snake-over">
            <h2>Game Over</h2>
            <p>Score: <strong id="final-score"></strong></p>
            <div id="save-status" class="save-status"></div>
            <button id="restart-btn" class="btn-primary">Nochmal</button>
          </div>
        </div>
        <aside class="game-sidebar">
          <div class="sidebar-stats">
            <div class="stat-box">
              <div class="stat-label">Score</div>
              <div class="stat-value" id="score-val">0</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Länge</div>
              <div class="stat-value" id="length-val">3</div>
            </div>
          </div>
          <div id="leaderboard-area"></div>
        </aside>
      </div>
    </div>`;

  const canvas  = document.getElementById('snake-canvas');
  const overlay = document.getElementById('snake-over');

  function getState() { return state; }
  function setState(updater) { state = updater(state); }

  cleanupControls = bindControls(getState, setState);
  cleanupTouch = bindTouchControls(container.querySelector('.game-area'), getState, setState);

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    if (!paused && !gameOver) {
      tickAcc += delta;
      if (tickAcc >= state.speed) {
        tickAcc -= state.speed;
        state = tick(state);
        document.getElementById('score-val').textContent = state.score.toLocaleString('de-DE');
        document.getElementById('length-val').textContent = state.snake.length;
        if (!state.alive) { endGame(); return; }
      }
      render(canvas, state);
    }

    rafId = requestAnimationFrame(loop);
  }

  async function endGame() {
    gameOver = true;
    cancelAnimationFrame(rafId);
    rafId = null;

    const duration = Math.max(5, Math.floor((Date.now() - state.startTime) / 1000));
    overlay.classList.remove('hidden');
    document.getElementById('final-score').textContent = state.score.toLocaleString('de-DE');

    const statusEl = document.getElementById('save-status');
    const user = await getUser();
    if (user) {
      statusEl.textContent = 'Score wird gespeichert…';
      try {
        await saveScore('snake', state.score, duration);
        statusEl.textContent = '✓ Score gespeichert!';
        await renderLeaderboard(document.getElementById('leaderboard-area'), 'snake');
      } catch (e) {
        statusEl.textContent = '⚠ ' + e.message;
      }
    } else {
      const msg = document.createElement('span');
      msg.textContent = 'Zum Speichern bitte ';
      const btn = document.createElement('button');
      btn.className = 'link-btn';
      btn.textContent = 'anmelden';
      btn.addEventListener('click', () => import('../ui/auth-modal.js').then(m => m.initAuthModal().open()));
      statusEl.append(msg, btn);
    }
  }

  document.getElementById('restart-btn').addEventListener('click', () => {
    destroy();
    mount(container);
  });

  renderLeaderboard(document.getElementById('leaderboard-area'), 'snake');
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);

  function destroy() {
    cancelAnimationFrame(rafId);
    rafId = null;
    cleanupControls?.();
    cleanupTouch?.();
  }

  return destroy;
}
