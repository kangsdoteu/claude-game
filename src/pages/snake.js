import { createState, tick } from '../games/snake/logic.js';
import { render, CANVAS_SIZE } from '../games/snake/renderer.js';
import { bindControls, bindTouchControls } from '../games/snake/controls.js';
import { saveScore } from '../api/scores.js';
import { getUser } from '../api/auth.js';
import { renderLeaderboard, invalidate } from '../ui/leaderboard.js';

export function mount(container) {
  let state = createState();
  let rafId = null;
  let lastTime = 0;
  let tickAcc = 0;
  let prevStarted = false;
  let paused = false;
  let gameOver = false;
  let cleanupControls = null;
  let cleanupTouch = null;

  container.innerHTML = `
    <div class="game-page">
      <!-- Mobile score strip (sticky, above canvas) -->
      <div class="sidebar-stats--strip">
        <div class="stat-box">
          <div class="stat-label">Score</div>
          <div class="stat-value" id="score-val-strip">0</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Länge</div>
          <div class="stat-value" id="length-val-strip">3</div>
        </div>
      </div>
      <div class="game-layout">
        <div class="game-area">
          <canvas id="snake-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          <div class="start-overlay" id="snake-start">
            <h2>Snake</h2>
            <p>Drücke eine Pfeiltaste oder W/A/S/D zum Starten</p>
          </div>
          <div class="pause-overlay hidden" id="snake-pause">⏸ Pause</div>
          <div class="game-over-overlay hidden" id="snake-over">
            <h2>Game Over</h2>
            <p>Score: <strong id="final-score"></strong></p>
            <div id="save-status" class="save-status"></div>
            <button id="restart-btn" class="btn-primary">Nochmal</button>
          </div>
        </div>
        <aside class="game-sidebar">
          <!-- Desktop sidebar stats (Score/Länge) -->
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

  const canvas       = document.getElementById('snake-canvas');
  const overlay      = document.getElementById('snake-over');
  const startOverlay = document.getElementById('snake-start');
  const pauseOverlay = document.getElementById('snake-pause');

  function togglePause() {
    if (gameOver) return;
    paused = !paused;
    pauseOverlay.classList.toggle('hidden', !paused);
  }

  function getState() { return state; }
  function setState(updater) {
    if (paused || gameOver) return;
    state = updater(state);
  }

  cleanupControls = bindControls({ pause: togglePause }, getState, setState);
  cleanupTouch = bindTouchControls(container.querySelector('.game-page'), getState, setState);

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    if (!paused && !gameOver) {
      if (state.started) startOverlay.classList.add('hidden');
      if (state.started && !prevStarted) {
        prevStarted = true;
        tickAcc = 0;
      }
      tickAcc += delta;
      if (tickAcc >= state.speed) {
        tickAcc -= state.speed;
        state = tick(state);
        const score = state.score.toLocaleString('de-DE');
        const length = state.snake.length;
        document.getElementById('score-val').textContent = score;
        document.getElementById('length-val').textContent = length;
        document.getElementById('score-val-strip').textContent = score;
        document.getElementById('length-val-strip').textContent = length;
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

    const duration = Math.max(5, Math.floor((Date.now() - (state.startTime ?? Date.now())) / 1000));
    overlay.classList.remove('hidden');
    document.getElementById('final-score').textContent = state.score.toLocaleString('de-DE');

    const statusEl = document.getElementById('save-status');
    const user = await getUser();
    if (user) {
      statusEl.textContent = 'Score wird gespeichert…';
      try {
        await saveScore('snake', state.score, duration);
        statusEl.textContent = '✓ Score gespeichert!';
        invalidate('snake');
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
