import { createState, start, dispatch as gameDispatch, getLevelSpeed } from '../games/tetris/logic.js';
import { render, renderMini, CANVAS_W, CANVAS_H } from '../games/tetris/renderer.js';
import { bindControls, bindTouchControls } from '../games/tetris/controls.js';
import { saveScore, getLeaderboard } from '../api/scores.js';
import { getUser } from '../api/auth.js';
import { renderLeaderboard, invalidate } from '../ui/leaderboard.js';

export function mount(container) {
  let state = createState();
  let rafId = null;
  let lastTime = 0;
  let dropAcc = 0;
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
          <div class="stat-label">Level</div>
          <div class="stat-value" id="level-val-strip">1</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Lines</div>
          <div class="stat-value" id="lines-val-strip">0</div>
        </div>
      </div>
      <div class="game-layout">
        <div class="game-area">
          <canvas id="tetris-canvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
          <div class="start-overlay" id="tetris-start">
            <h2>Tetris</h2>
            <p>Drücke eine Taste zum Starten</p>
          </div>
          <div class="pause-overlay hidden" id="tetris-pause">⏸ Pause</div>
          <div class="game-over-overlay hidden" id="tetris-over">
            <h2>Game Over</h2>
            <p>Score: <strong id="final-score"></strong></p>
            <div id="save-status" class="save-status"></div>
            <button id="restart-btn" class="btn-primary">Nochmal</button>
          </div>
        </div>
        <aside class="game-sidebar">
          <!-- Desktop sidebar stats (Score/Level/Lines) -->
          <div class="sidebar-stats">
            <div class="stat-box">
              <div class="stat-label">Score</div>
              <div class="stat-value" id="score-val">0</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Level</div>
              <div class="stat-value" id="level-val">1</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Lines</div>
              <div class="stat-value" id="lines-val">0</div>
            </div>
          </div>
          <!-- Next + Hold: visible on desktop in sidebar, scrollable below fold on mobile -->
          <div class="sidebar-extras">
            <div class="stat-box">
              <div class="stat-label">Nächstes</div>
              <canvas id="next-canvas" width="96" height="96"></canvas>
            </div>
            <div class="stat-box">
              <div class="stat-label">Hold (C)</div>
              <canvas id="hold-canvas" width="96" height="96"></canvas>
            </div>
          </div>
          <div id="leaderboard-area"></div>
        </aside>
      </div>
    </div>`;

  const canvas       = document.getElementById('tetris-canvas');
  const nextCanvas   = document.getElementById('next-canvas');
  const holdCanvas   = document.getElementById('hold-canvas');
  const overlay      = document.getElementById('tetris-over');
  const startOverlay = document.getElementById('tetris-start');
  const pauseOverlay = document.getElementById('tetris-pause');

  function togglePause() {
    if (gameOver) return;
    paused = !paused;
    pauseOverlay.classList.toggle('hidden', !paused);
  }

  function updateStats() {
    const score = state.score.toLocaleString('de-DE');
    const level = state.level + 1;
    const lines = state.lines;
    document.getElementById('score-val').textContent = score;
    document.getElementById('level-val').textContent = level;
    document.getElementById('lines-val').textContent = lines;
    document.getElementById('score-val-strip').textContent = score;
    document.getElementById('level-val-strip').textContent = level;
    document.getElementById('lines-val-strip').textContent = lines;
    renderMini(nextCanvas, state.next);
    renderMini(holdCanvas, state.held);
  }

  function dispatchAction(action) {
    if (paused || gameOver) return;
    if (action === 'hold' && !state.started) return;
    if (!state.started) {
      state = start(state);
      startOverlay.classList.add('hidden');
    }
    state = gameDispatch(state, action);
    render(canvas, state);
    updateStats();
    if (!state.alive) endGame();
  }

  cleanupControls = bindControls(
    { pause: togglePause },
    () => state,
    dispatchAction
  );
  cleanupTouch = bindTouchControls(container.querySelector('.game-page'), dispatchAction);

  function loop(timestamp) {
    if (!paused && !gameOver) {
      const delta = timestamp - lastTime;
      if (state.started) {
        dropAcc += delta;
        const speed = getLevelSpeed(state.level);
        if (dropAcc >= speed) {
          dropAcc -= speed;
          state = gameDispatch(state, 'softDrop');
          if (!state.alive) { endGame(); return; }
        }
      }
      render(canvas, state);
      updateStats();
    }
    lastTime = timestamp;
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
        await saveScore('tetris', state.score, duration);
        statusEl.textContent = '✓ Score gespeichert!';
        invalidate('tetris');
        await renderLeaderboard(document.getElementById('leaderboard-area'), 'tetris');
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

  renderLeaderboard(document.getElementById('leaderboard-area'), 'tetris');
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
