const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-modal-DxCDuf9M.js","assets/index-_fBGyYWH.js","assets/index-YJyARh-L.css"])))=>i.map(i=>d[i]);
import{g as M,_ as P}from"./index-_fBGyYWH.js";import{r as E,s as _,i as R}from"./leaderboard-nxGQXlLc.js";const f=20;function N(){const e=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];return{snake:e,dir:{x:1,y:0},nextDir:{x:1,y:0},food:w(e),score:0,speed:150,alive:!0,started:!1,startTime:null}}function S(e){return e.started?e:{...e,started:!0,startTime:Date.now()}}function $(e){if(!e.started||!e.alive)return e;const a=e.nextDir,t=e.snake[0],n={x:t.x+a.x,y:t.y+a.y};if(n.x<0||n.x>=f||n.y<0||n.y>=f)return{...e,dir:a,alive:!1};if(e.snake.some(l=>l.x===n.x&&l.y===n.y))return{...e,dir:a,alive:!1};const s=[n,...e.snake],o=n.x===e.food.x&&n.y===e.food.y;o||s.pop();const d=o?e.score+10:e.score,i=o&&d%50===0?Math.max(60,e.speed-10):e.speed;return{...e,snake:s,dir:a,nextDir:a,food:o?w(s):e.food,score:d,speed:i}}function w(e){const a=new Set(e.map(n=>`${n.x},${n.y}`));let t;do t={x:Math.floor(Math.random()*f),y:Math.floor(Math.random()*f)};while(a.has(`${t.x},${t.y}`));return t}const r=20,p=f*r;function F(e,a){const t=e.getContext("2d");t.fillStyle="#0a0a0f",t.fillRect(0,0,e.width,e.height),t.strokeStyle="rgba(255,255,255,0.03)",t.lineWidth=1;for(let n=0;n<=f;n++)t.beginPath(),t.moveTo(n*r,0),t.lineTo(n*r,p),t.stroke(),t.beginPath(),t.moveTo(0,n*r),t.lineTo(p,n*r),t.stroke();if(a.snake.forEach(({x:n,y:s},o)=>{const d=o/a.snake.length;t.fillStyle=`hsl(120, 80%, ${60-d*35}%)`,t.fillRect(n*r+1,s*r+1,r-2,r-2)}),a.snake.length>0){t.fillStyle="#7fff00";const{x:n,y:s}=a.snake[0];t.fillRect(n*r+1,s*r+1,r-2,r-2)}t.fillStyle="#ff4444",t.beginPath(),t.arc(a.food.x*r+r/2,a.food.y*r+r/2,r/2-2,0,Math.PI*2),t.fill()}const O={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}},q=new Set(["p","P","Escape"]);function U(e,a,t){function n(s){var i;if(s.target.tagName==="INPUT"||s.target.tagName==="TEXTAREA"||s.target.closest("dialog[open]")||s.repeat)return;if(q.has(s.key)){s.preventDefault(),(i=e.pause)==null||i.call(e);return}const o=O[s.key];!o||(s.preventDefault(),!a().alive)||(t(S),t(l=>o.x===-l.dir.x&&o.y===-l.dir.y?l:{...l,nextDir:o}))}return document.addEventListener("keydown",n),()=>document.removeEventListener("keydown",n)}function G(e,a,t){const n=document.createElement("div");return n.className="touch-controls",n.innerHTML=`
    <div class="dpad-row">
      <button class="dpad-btn" data-x="0" data-y="-1">↑</button>
    </div>
    <div class="dpad-row">
      <button class="dpad-btn" data-x="-1" data-y="0">←</button>
      <button class="dpad-btn" data-x="0" data-y="1">↓</button>
      <button class="dpad-btn" data-x="1" data-y="0">→</button>
    </div>`,n.querySelectorAll(".dpad-btn").forEach(s=>{s.addEventListener("touchstart",o=>{o.preventDefault();const d={x:+s.dataset.x,y:+s.dataset.y};t(S),t(i=>d.x===-i.dir.x&&d.y===-i.dir.y?i:{...i,nextDir:d})},{passive:!1})}),e.appendChild(n),()=>n.remove()}function H(e){let a=N(),t=null,n=0,s=0,o=!1,d=!1,i=!1,l=null,m=null;e.innerHTML=`
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
          <canvas id="snake-canvas" width="${p}" height="${p}"></canvas>
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
    </div>`;const D=document.getElementById("snake-canvas"),I=document.getElementById("snake-over"),L=document.getElementById("snake-start"),A=document.getElementById("snake-pause");function C(){i||(d=!d,A.classList.toggle("hidden",!d))}function x(){return a}function h(u){d||i||(a=u(a))}l=U({pause:C},x,h),m=G(e.querySelector(".game-page"),x,h);function b(u){const v=u-n;if(n=u,!d&&!i){if(a.started&&L.classList.add("hidden"),a.started&&!o&&(o=!0,s=0),s+=v,s>=a.speed){s-=a.speed,a=$(a);const g=a.score.toLocaleString("de-DE"),c=a.snake.length;if(document.getElementById("score-val").textContent=g,document.getElementById("length-val").textContent=c,document.getElementById("score-val-strip").textContent=g,document.getElementById("length-val-strip").textContent=c,!a.alive){T();return}}F(D,a)}t=requestAnimationFrame(b)}async function T(){i=!0,cancelAnimationFrame(t),t=null;const u=Math.max(5,Math.floor((Date.now()-(a.startTime??Date.now()))/1e3));I.classList.remove("hidden"),document.getElementById("final-score").textContent=a.score.toLocaleString("de-DE");const v=document.getElementById("save-status");if(await M()){v.textContent="Score wird gespeichert…";try{await _("snake",a.score,u),v.textContent="✓ Score gespeichert!",R("snake"),await E(document.getElementById("leaderboard-area"),"snake")}catch(c){v.textContent="⚠ "+c.message}}else{const c=document.createElement("span");c.textContent="Zum Speichern bitte ";const y=document.createElement("button");y.className="link-btn",y.textContent="anmelden",y.addEventListener("click",()=>P(()=>import("./auth-modal-DxCDuf9M.js"),__vite__mapDeps([0,1,2])).then(B=>B.initAuthModal().open())),v.append(c,y)}}document.getElementById("restart-btn").addEventListener("click",()=>{k(),H(e)}),E(document.getElementById("leaderboard-area"),"snake"),n=performance.now(),t=requestAnimationFrame(b);function k(){cancelAnimationFrame(t),t=null,l==null||l(),m==null||m()}return k}export{H as mount};
