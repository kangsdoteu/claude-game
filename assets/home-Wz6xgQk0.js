import{r as t}from"./leaderboard-B8-5zKqY.js";import{g as n}from"./index-CgoAAGTd.js";function m(d){let r=!1;return d.innerHTML=`
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
    </div>`,t(document.getElementById("home-leaderboard"),"tetris"),d.querySelectorAll(".game-card[data-route]").forEach(e=>{const i=e.dataset.route;(async()=>{const a=await n(i);if(!r&&!a.enabled&&(e.classList.add("game-card--disabled"),a.disabled_message)){e.title=a.disabled_message;const s=document.createElement("span");s.className="game-card-disabled-msg",s.textContent=a.disabled_message,e.appendChild(s)}})()}),function(){r=!0}}export{m as mount};
