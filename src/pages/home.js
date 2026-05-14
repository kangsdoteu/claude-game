import { renderLeaderboard } from '../ui/leaderboard.js';
import { getRouteAvailability } from '../ui/game-availability.js';

export function mount(container) {
  let destroyed = false;

  container.innerHTML = `
    <div class="home-page">
      <header class="hero">
        <h1>GameHub</h1>
        <p>Tetris, Snake & Dino-Evo — wähle dein Spiel</p>
      </header>
      <div class="game-cards">
        <a href="#/tetris" class="game-card" data-route="tetris">
          <div class="game-card-icon">🟦</div>
          <h2>Tetris</h2>
          <p>Klassischer Fallblock-Spaß</p>
          <span class="btn-primary">Spielen</span>
        </a>
        <a href="#/snake" class="game-card" data-route="snake">
          <div class="game-card-icon">🐍</div>
          <h2>Snake</h2>
          <p>Schlange wachsen lassen</p>
          <span class="btn-primary">Spielen</span>
        </a>
        <a href="#/dinos" class="game-card" data-route="dinos">
          <div class="game-card-icon">🦖</div>
          <h2>Dino-Evo</h2>
          <p>Führe deine Herde durch die Generationen</p>
          <span class="btn-primary">Spielen</span>
        </a>
      </div>
      <div id="home-leaderboard"></div>
    </div>`;

  renderLeaderboard(document.getElementById('home-leaderboard'), 'tetris');

  // Async: mark disabled cards without blocking initial render
  const cards = container.querySelectorAll('.game-card[data-route]');
  cards.forEach(card => {
    const route = card.dataset.route;
    (async () => {
      const avail = await getRouteAvailability(route);
      if (destroyed) return;
      if (!avail.enabled) {
        card.classList.add('game-card--disabled');
        if (avail.disabled_message) {
          card.title = avail.disabled_message;
          const msg = document.createElement('span');
          msg.className = 'game-card-disabled-msg';
          msg.textContent = avail.disabled_message;
          card.appendChild(msg);
        }
      }
    })();
  });

  return function destroy() {
    destroyed = true;
  };
}
