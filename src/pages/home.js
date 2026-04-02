import { renderLeaderboard } from '../ui/leaderboard.js';

export function mount(container) {
  container.innerHTML = `
    <div class="home-page">
      <header class="hero">
        <h1>GameHub</h1>
        <p>Tetris & Snake — wähle dein Spiel</p>
      </header>
      <div class="game-cards">
        <a href="#/tetris" class="game-card">
          <div class="game-card-icon">🟦</div>
          <h2>Tetris</h2>
          <p>Klassischer Fallblock-Spaß</p>
          <span class="btn-primary">Spielen</span>
        </a>
        <a href="#/snake" class="game-card">
          <div class="game-card-icon">🐍</div>
          <h2>Snake</h2>
          <p>Schlange wachsen lassen</p>
          <span class="btn-primary">Spielen</span>
        </a>
      </div>
      <div id="home-leaderboard"></div>
    </div>`;

  renderLeaderboard(document.getElementById('home-leaderboard'), 'tetris');

  return function destroy() {};
}
