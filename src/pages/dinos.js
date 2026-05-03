import {
  createState, step,
  PHASE, BIOMES, SCORE_WEIGHT_GENERATIONS, SCORE_WEIGHT_BIOMES, SCORE_PEAKPOP_DIVISOR,
  BIOME_ORIGIN, BIOME_SIZE,
} from '../games/dinos/logic/index.js';
import { render, CANVAS_SIZE, canvasToWorld } from '../games/dinos/renderer.js';
import { bindControls } from '../games/dinos/controls.js';
import { saveScore } from '../api/scores.js';
import { getUser } from '../api/auth.js';
import { renderLeaderboard, invalidate } from '../ui/leaderboard.js';

const BIOME_LABEL = {
  forest: 'Wald',
  plain:  'Steppe',
  rocks:  'Felsen',
  river:  'Fluss',
};

const PHASE_LABEL = {
  [PHASE.SIMULATING]: 'Leben',
  [PHASE.EVALUATING]: 'Bewerten…',
  [PHASE.SELECTING]:  'Auswählen…',
  [PHASE.BREEDING]:   'Kreuzen…',
  [PHASE.MUTATING]:   'Mutieren…',
  [PHASE.SPAWNING]:   'Spawnen…',
};

function computeScore(state) {
  return (
    state.metrics.generationsSurvived * SCORE_WEIGHT_GENERATIONS
    + state.metrics.biomesExplored.length * SCORE_WEIGHT_BIOMES
    + Math.floor(state.metrics.peakPop / SCORE_PEAKPOP_DIVISOR)
  );
}

export function mount(container) {
  // ----- Lifecycle-State -----
  let mode      = null;            // 'realtime' | 'turn'
  let state     = null;
  let rafId     = null;
  let lastTime  = 0;
  let cleanupControls = null;
  let gameOver  = false;
  let destroyed = false;           // gesetzt von destroy() — async-Pfade müssen das nach jedem await prüfen
  let startedAt = null;            // wall-clock für Save-Dauer

  // ----- DOM -----
  container.innerHTML = `
    <div class="game-page">
      <div class="sidebar-stats--strip">
        <div class="stat-box"><div class="stat-label">Gen</div><div class="stat-value" id="dn-gen-strip">0</div></div>
        <div class="stat-box"><div class="stat-label">Score</div><div class="stat-value" id="dn-score-strip">0</div></div>
        <div class="stat-box"><div class="stat-label">Biom</div><div class="stat-value" id="dn-biome-strip">—</div></div>
      </div>
      <div class="game-layout">
        <div class="game-area">
          <canvas id="dn-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>

          <div class="start-overlay" id="dn-start">
            <h2>Dino-Evo</h2>
            <p>Führe deine Herde durch die Generationen.</p>
            <div class="dn-mode-picker">
              <button class="btn-primary" id="dn-mode-realtime">Echtzeit</button>
              <button class="btn-ghost"   id="dn-mode-turn">Rundenbasiert</button>
            </div>
            <p class="dn-hint">
              <strong>Klick</strong> auf Karte = Wegpunkt für die Herde ·
              <strong>F</strong>/<strong>R</strong> = Kämpfen / Fliehen ·
              <strong>Leertaste</strong> = Trab/Lauf
              <span id="dn-hint-turn" class="hidden"> · <strong>Q</strong> = Zug beenden</span>
            </p>
          </div>

          <div class="dn-encounter hidden" id="dn-encounter">
            <h3>Predator gesichtet!</h3>
            <p id="dn-encounter-detail">Im aktuellen Biom nähern sich Jäger.</p>
            <div class="dn-encounter-buttons">
              <button class="btn-primary" id="dn-fight">Kämpfen <kbd>F</kbd></button>
              <button class="btn-ghost"   id="dn-flee">Fliehen <kbd>R</kbd></button>
            </div>
          </div>

          <div class="game-over-overlay hidden" id="dn-over">
            <h2>Herde verloren</h2>
            <p>Score: <strong id="dn-final-score">0</strong></p>
            <p class="dn-final-detail" id="dn-final-detail"></p>
            <div id="dn-save-status" class="save-status"></div>
            <button id="dn-restart-btn" class="btn-primary">Nochmal</button>
          </div>
        </div>
        <aside class="game-sidebar">
          <div class="sidebar-stats">
            <div class="stat-box"><div class="stat-label">Generation</div><div class="stat-value" id="dn-gen">0</div></div>
            <div class="stat-box"><div class="stat-label">Score</div><div class="stat-value" id="dn-score">0</div></div>
            <div class="stat-box"><div class="stat-label">Phase</div><div class="stat-value" id="dn-phase">—</div></div>
            <div class="stat-box"><div class="stat-label">Peak Pop</div><div class="stat-value" id="dn-peak">0</div></div>

            <div class="stat-box dn-biome-list">
              <div class="stat-label">Biome</div>
              <div class="dn-biomes" id="dn-biomes"></div>
            </div>

            <div class="stat-box controls-help">
              <div class="stat-label">Steuerung</div>
              <dl class="controls-list">
                <dt>Klick auf Karte</dt><dd>Wegpunkt</dd>
                <dt>Klick auf Biom</dt><dd>Hinwandern</dd>
                <dt><kbd>F</kbd> / <kbd>R</kbd></dt><dd>Kämpfen / Fliehen</dd>
                <dt><kbd>Leer</kbd></dt><dd>Trab / Lauf</dd>
                <dt id="dn-help-q-row" class="hidden"><kbd>Q</kbd></dt><dd id="dn-help-q-desc" class="hidden">Zug beenden</dd>
              </dl>
            </div>
          </div>
          <div id="dn-leaderboard"></div>
        </aside>
      </div>
    </div>`;

  const canvas        = document.getElementById('dn-canvas');
  const startOverlay  = document.getElementById('dn-start');
  const overOverlay   = document.getElementById('dn-over');
  const encOverlay    = document.getElementById('dn-encounter');
  const biomeListEl   = document.getElementById('dn-biomes');

  // Biom-Karten (Sidebar)
  for (const b of BIOMES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dn-biome-card';
    btn.dataset.biome = b;
    btn.innerHTML = `
      <span class="dn-biome-name"></span>
      <span class="dn-biome-pop" data-role="pop">0</span>`;
    btn.querySelector('.dn-biome-name').textContent = BIOME_LABEL[b];
    btn.addEventListener('click', () => {
      if (!state || !state.alive || !state.started) return;
      if (state.encounters.length > 0) return;
      const o = BIOME_ORIGIN[b];
      const target = { x: o.x + BIOME_SIZE / 2, y: o.y + BIOME_SIZE / 2 };
      state = step(state, 0, { type: 'setWaypoint', x: target.x, y: target.y });
    });
    biomeListEl.appendChild(btn);
  }

  // ----- Mode-Picker -----
  document.getElementById('dn-mode-realtime').addEventListener('click', () => startGame('realtime'));
  document.getElementById('dn-mode-turn').addEventListener('click',     () => startGame('turn'));

  // Restart
  document.getElementById('dn-restart-btn').addEventListener('click', () => {
    destroy();
    mount(container);
  });

  // Encounter-Buttons
  document.getElementById('dn-fight').addEventListener('click', () => { if (state) state = step(state, 0, 'fight'); });
  document.getElementById('dn-flee').addEventListener('click',  () => { if (state) state = step(state, 0, 'flee');  });

  // Leaderboard initial laden — Realtime-Tab ist Default; user kann im LB-Tab umschalten.
  renderLeaderboard(document.getElementById('dn-leaderboard'), 'dinos_realtime');

  function dispatch(action) {
    if (!state) return;
    state = step(state, 0, action);
  }

  function startGame(selectedMode) {
    mode = selectedMode;
    // Nicht-kryptografische Seed: einzige Date.now()-Stelle in Logic-nahem Code, da
    // Page-Layer (CLAUDE.md erlaubt Date.now hier — analog zu Tetris/Snake startTime).
    const seed = (Date.now() & 0xFFFFFFFF) >>> 0;
    state = createState({ mode, seed });
    state = step(state, 0, 'start');
    startedAt = Date.now();

    startOverlay.classList.add('hidden');
    if (mode === 'turn') {
      document.getElementById('dn-help-q-row').classList.remove('hidden');
      document.getElementById('dn-help-q-desc').classList.remove('hidden');
      document.getElementById('dn-hint-turn').classList.remove('hidden');
    }

    cleanupControls = bindControls(canvas, dispatch, () => state);
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function loop(ts) {
    // Bail-out wenn die Page entsorgt oder die Runde vorbei ist — sonst plant sich
    // der RAF-Callback unten endlos selbst neu, obwohl der Body skipped wäre.
    if (destroyed || gameOver) return;

    const dt = Math.min(0.1, (ts - lastTime) / 1000);  // Clamp auf 100ms — gegen Tab-Switch-Spike
    lastTime = ts;

    // Im Turn-Mode laufen GA-Phasen synchron via step(); im Realtime-Mode pacen wir mit dt.
    if (mode === 'realtime') {
      state = step(state, dt, null);
    } else {
      // Turn-Mode: advance simulating only via dt=0 (kein automatisches Vorrücken),
      // GA-Phasen werden durch endTurn-Action ausgelöst.
      // dt=0 sorgt dafür, dass tick nicht steigt — Spieler kontrolliert Zeit.
    }

    if (!state.alive) {
      endGame();
      return;
    }

    updateHud();
    render(canvas, state);

    rafId = requestAnimationFrame(loop);
  }

  function updateHud() {
    const score = computeScore(state);
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
    setText('dn-gen',         state.metrics.generationsSurvived);
    setText('dn-gen-strip',   state.metrics.generationsSurvived);
    setText('dn-score',       score);
    setText('dn-score-strip', score);
    setText('dn-peak',        state.metrics.peakPop);
    setText('dn-phase',       PHASE_LABEL[state.phase] ?? state.phase);
    setText('dn-biome-strip', BIOME_LABEL[state.player.biome] ?? state.player.biome);

    // Biom-Karten: Pop-Zahlen + aktive-Markierung
    biomeListEl.querySelectorAll('.dn-biome-card').forEach(card => {
      const b = card.dataset.biome;
      const popN = state.populations.predator[b].length
                 + state.populations.herbivore[b].length
                 + state.populations.plant[b].length;
      const popEl = card.querySelector('[data-role=pop]');
      if (popEl) popEl.textContent = popN;
      card.classList.toggle('active', state.player.biome === b);
    });

    // Encounter-Overlay synchronisieren
    if (state.encounters.length > 0) {
      const e = state.encounters[0];
      encOverlay.classList.remove('hidden');
      const detail = document.getElementById('dn-encounter-detail');
      detail.textContent = `${e.predators.length} Jäger im ${BIOME_LABEL[e.biome]} — kämpfen oder fliehen?`;
    } else {
      encOverlay.classList.add('hidden');
    }
  }

  async function endGame() {
    gameOver = true;
    cancelAnimationFrame(rafId);
    rafId = null;

    const rawScore = computeScore(state);
    const duration = Math.max(5, Math.floor(((Date.now()) - (startedAt ?? Date.now())) / 1000));

    // DOM-Refs vor jedem await snapshotten — destroy() könnte währenddessen feuern,
    // dann sind die Knoten weg und getElementById liefert null. Wir prüfen `destroyed`
    // nach jedem await und brechen sauber ab, statt auf einem detached Node weiterzuschreiben.
    overOverlay.classList.remove('hidden');
    document.getElementById('dn-final-score').textContent = String(rawScore);
    document.getElementById('dn-final-detail').textContent =
      `${state.metrics.generationsSurvived} Generationen · ${state.metrics.biomesExplored.length}/4 Biome · Peak ${state.metrics.peakPop}`;

    const statusEl     = document.getElementById('dn-save-status');
    const leaderboardEl = document.getElementById('dn-leaderboard');

    // DB-Cap (realtime): score ≤ 200 UND score/duration ≤ 0.05.
    // Der Server lehnt sonst mit 42501 ab — wir cappen defensiv, damit der Save klappt.
    const game        = mode === 'turn' ? 'dinos_turn' : 'dinos_realtime';
    const ratioCap    = mode === 'turn' ? Infinity : Math.floor(0.05 * duration);
    const absCap      = mode === 'turn' ? 5000 : 200;
    const saveScoreVal = Math.max(0, Math.min(rawScore, absCap, ratioCap));

    const user = await getUser();
    if (destroyed) return;
    if (!user) {
      const span = document.createElement('span');
      span.textContent = 'Zum Speichern bitte ';
      const btn = document.createElement('button');
      btn.className = 'link-btn';
      btn.textContent = 'anmelden';
      btn.addEventListener('click', () => import('../ui/auth-modal.js').then(m => m.initAuthModal().open()));
      statusEl.append(span, btn);
      return;
    }

    if (saveScoreVal < rawScore) {
      statusEl.textContent = `Score wird gespeichert (${saveScoreVal} nach Balance-Cap)…`;
    } else {
      statusEl.textContent = 'Score wird gespeichert…';
    }
    try {
      await saveScore(game, saveScoreVal, duration);
      if (destroyed) return;
      statusEl.textContent = '✓ Score gespeichert!';
      invalidate(game);
      await renderLeaderboard(leaderboardEl, game);
    } catch (e) {
      if (destroyed) return;
      statusEl.textContent = '⚠ ' + e.message;
    }
  }

  function destroy() {
    destroyed = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    cleanupControls?.();
    cleanupControls = null;
    state = null;
  }

  return destroy;
}
