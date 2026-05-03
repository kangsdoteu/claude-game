const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-modal-DGF08FHy.js","assets/index-CPdNiNqQ.js","assets/index-BeAjaPJV.css"])))=>i.map(i=>d[i]);
import{g as B,_ as M}from"./index-CPdNiNqQ.js";import{r as E,s as _,i as R}from"./leaderboard-Ciazhf4m.js";const f=20;function N(){const e=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];return{snake:e,dir:{x:1,y:0},nextDir:{x:1,y:0},food:w(e),score:0,speed:150,alive:!0,started:!1,startTime:null}}function S(e){return e.started?e:{...e,started:!0,startTime:Date.now()}}function $(e){if(!e.started||!e.alive)return e;const a=e.nextDir,t=e.snake[0],n={x:t.x+a.x,y:t.y+a.y};if(n.x<0||n.x>=f||n.y<0||n.y>=f)return{...e,dir:a,alive:!1};if(e.snake.some(l=>l.x===n.x&&l.y===n.y))return{...e,dir:a,alive:!1};const d=[n,...e.snake],r=n.x===e.food.x&&n.y===e.food.y;r||d.pop();const o=r?e.score+10:e.score,i=r&&o%50===0?Math.max(60,e.speed-10):e.speed;return{...e,snake:d,dir:a,nextDir:a,food:r?w(d):e.food,score:o,speed:i}}function w(e){const a=new Set(e.map(n=>`${n.x},${n.y}`));let t;do t={x:Math.floor(Math.random()*f),y:Math.floor(Math.random()*f)};while(a.has(`${t.x},${t.y}`));return t}const s=20,g=f*s;function F(e,a){const t=e.getContext("2d");t.fillStyle="#0a0a0f",t.fillRect(0,0,e.width,e.height),t.strokeStyle="rgba(255,255,255,0.03)",t.lineWidth=1;for(let n=0;n<=f;n++)t.beginPath(),t.moveTo(n*s,0),t.lineTo(n*s,g),t.stroke(),t.beginPath(),t.moveTo(0,n*s),t.lineTo(g,n*s),t.stroke();if(a.snake.forEach(({x:n,y:d},r)=>{const o=r/a.snake.length;t.fillStyle=`hsl(120, 80%, ${60-o*35}%)`,t.fillRect(n*s+1,d*s+1,s-2,s-2)}),a.snake.length>0){t.fillStyle="#7fff00";const{x:n,y:d}=a.snake[0];t.fillRect(n*s+1,d*s+1,s-2,s-2)}t.fillStyle="#ff4444",t.beginPath(),t.arc(a.food.x*s+s/2,a.food.y*s+s/2,s/2-2,0,Math.PI*2),t.fill()}const O={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}},q=new Set(["p","P","Escape"]);function U(e,a,t){function n(d){var i;if(d.target.tagName==="INPUT"||d.target.tagName==="TEXTAREA"||d.target.closest("dialog[open]")||d.repeat)return;if(q.has(d.key)){d.preventDefault(),(i=e.pause)==null||i.call(e);return}const r=O[d.key];!r||(d.preventDefault(),!a().alive)||(t(S),t(l=>r.x===-l.dir.x&&r.y===-l.dir.y?l:{...l,nextDir:r}))}return document.addEventListener("keydown",n),()=>document.removeEventListener("keydown",n)}function G(e,a,t){const n=document.createElement("div");return n.className="touch-controls",n.innerHTML=`
    <div class="dpad-row">
      <button class="dpad-btn" data-x="0" data-y="-1">↑</button>
    </div>
    <div class="dpad-row">
      <button class="dpad-btn" data-x="-1" data-y="0">←</button>
      <button class="dpad-btn" data-x="0" data-y="1">↓</button>
      <button class="dpad-btn" data-x="1" data-y="0">→</button>
    </div>`,n.querySelectorAll(".dpad-btn").forEach(d=>{d.addEventListener("touchstart",r=>{r.preventDefault();const o={x:+d.dataset.x,y:+d.dataset.y};t(S),t(i=>o.x===-i.dir.x&&o.y===-i.dir.y?i:{...i,nextDir:o})},{passive:!1})}),e.appendChild(n),()=>n.remove()}function H(e){let a=N(),t=null,n=0,d=0,r=!1,o=!1,i=!1,l=null,m=null;e.innerHTML=`
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
          <canvas id="snake-canvas" width="${g}" height="${g}"></canvas>
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
            <div class="stat-box controls-help">
              <div class="stat-label">Steuerung</div>
              <dl class="controls-list">
                <dt><kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd></dt><dd>Richtung</dd>
                <dt><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></dt><dd>Richtung</dd>
                <dt><kbd>P</kbd> <kbd>Esc</kbd></dt><dd>Pause</dd>
              </dl>
            </div>
          </div>
          <div id="leaderboard-area"></div>
        </aside>
      </div>
    </div>`;const D=document.getElementById("snake-canvas"),A=document.getElementById("snake-over"),I=document.getElementById("snake-start"),L=document.getElementById("snake-pause");function C(){i||(o=!o,L.classList.toggle("hidden",!o))}function b(){return a}function x(u){o||i||(a=u(a))}l=U({pause:C},b,x),m=G(e.querySelector(".game-page"),b,x);function h(u){const v=u-n;if(n=u,!o&&!i){if(a.started&&I.classList.add("hidden"),a.started&&!r&&(r=!0,d=0),d+=v,d>=a.speed){d-=a.speed,a=$(a);const p=a.score.toLocaleString("de-DE"),c=a.snake.length;if(document.getElementById("score-val").textContent=p,document.getElementById("length-val").textContent=c,document.getElementById("score-val-strip").textContent=p,document.getElementById("length-val-strip").textContent=c,!a.alive){P();return}}F(D,a)}t=requestAnimationFrame(h)}async function P(){i=!0,cancelAnimationFrame(t),t=null;const u=Math.max(5,Math.floor((Date.now()-(a.startTime??Date.now()))/1e3));A.classList.remove("hidden"),document.getElementById("final-score").textContent=a.score.toLocaleString("de-DE");const v=document.getElementById("save-status");if(await B()){v.textContent="Score wird gespeichert…";try{await _("snake",a.score,u),v.textContent="✓ Score gespeichert!",R("snake"),await E(document.getElementById("leaderboard-area"),"snake")}catch(c){v.textContent="⚠ "+c.message}}else{const c=document.createElement("span");c.textContent="Zum Speichern bitte ";const y=document.createElement("button");y.className="link-btn",y.textContent="anmelden",y.addEventListener("click",()=>M(()=>import("./auth-modal-DGF08FHy.js"),__vite__mapDeps([0,1,2])).then(T=>T.initAuthModal().open())),v.append(c,y)}}document.getElementById("restart-btn").addEventListener("click",()=>{k(),H(e)}),E(document.getElementById("leaderboard-area"),"snake"),n=performance.now(),t=requestAnimationFrame(h);function k(){cancelAnimationFrame(t),t=null,l==null||l(),m==null||m()}return k}export{H as mount};
