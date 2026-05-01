const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-modal-DqaHq-1_.js","assets/index-DurTxyMH.js","assets/index-Bhv0n2Ht.css"])))=>i.map(i=>d[i]);
import{g as P,_ as M}from"./index-DurTxyMH.js";import{r as E,s as B,i as _}from"./leaderboard-C_MKienO.js";const v=20;function R(){const e=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];return{snake:e,dir:{x:1,y:0},nextDir:{x:1,y:0},food:S(e),score:0,speed:150,alive:!0,started:!1,startTime:null}}function b(e){return e.started?e:{...e,started:!0,startTime:Date.now()}}function N(e){if(!e.started||!e.alive)return e;const a=e.nextDir,t=e.snake[0],n={x:t.x+a.x,y:t.y+a.y};if(n.x<0||n.x>=v||n.y<0||n.y>=v)return{...e,dir:a,alive:!1};if(e.snake.some(l=>l.x===n.x&&l.y===n.y))return{...e,dir:a,alive:!1};const r=[n,...e.snake],s=n.x===e.food.x&&n.y===e.food.y;s||r.pop();const d=s?e.score+10:e.score,i=s&&d%50===0?Math.max(60,e.speed-10):e.speed;return{...e,snake:r,dir:a,nextDir:a,food:s?S(r):e.food,score:d,speed:i}}function S(e){const a=new Set(e.map(n=>`${n.x},${n.y}`));let t;do t={x:Math.floor(Math.random()*v),y:Math.floor(Math.random()*v)};while(a.has(`${t.x},${t.y}`));return t}const o=20,x=v*o;function $(e,a){const t=e.getContext("2d");t.fillStyle="#0a0a0f",t.fillRect(0,0,e.width,e.height),t.strokeStyle="rgba(255,255,255,0.03)",t.lineWidth=1;for(let n=0;n<=v;n++)t.beginPath(),t.moveTo(n*o,0),t.lineTo(n*o,x),t.stroke(),t.beginPath(),t.moveTo(0,n*o),t.lineTo(x,n*o),t.stroke();if(a.snake.forEach(({x:n,y:r},s)=>{const d=s/a.snake.length;t.fillStyle=`hsl(120, 80%, ${60-d*35}%)`,t.fillRect(n*o+1,r*o+1,o-2,o-2)}),a.snake.length>0){t.fillStyle="#7fff00";const{x:n,y:r}=a.snake[0];t.fillRect(n*o+1,r*o+1,o-2,o-2)}t.fillStyle="#ff4444",t.beginPath(),t.arc(a.food.x*o+o/2,a.food.y*o+o/2,o/2-2,0,Math.PI*2),t.fill()}const F={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}},O=new Set(["p","P","Escape"]);function q(e,a,t){function n(r){var i;if(r.target.tagName==="INPUT"||r.target.tagName==="TEXTAREA"||r.target.closest("dialog[open]")||r.repeat)return;if(O.has(r.key)){r.preventDefault(),(i=e.pause)==null||i.call(e);return}const s=F[r.key];!s||(r.preventDefault(),!a().alive)||(t(b),t(l=>s.x===-l.dir.x&&s.y===-l.dir.y?l:{...l,nextDir:s}))}return document.addEventListener("keydown",n),()=>document.removeEventListener("keydown",n)}function U(e,a,t){const n=document.createElement("div");return n.className="touch-controls",n.innerHTML=`
    <div class="dpad-row">
      <button class="dpad-btn" data-x="0" data-y="-1">↑</button>
    </div>
    <div class="dpad-row">
      <button class="dpad-btn" data-x="-1" data-y="0">←</button>
      <button class="dpad-btn" data-x="0" data-y="1">↓</button>
      <button class="dpad-btn" data-x="1" data-y="0">→</button>
    </div>`,n.querySelectorAll(".dpad-btn").forEach(r=>{r.addEventListener("touchstart",s=>{s.preventDefault();const d={x:+r.dataset.x,y:+r.dataset.y};t(b),t(i=>d.x===-i.dir.x&&d.y===-i.dir.y?i:{...i,nextDir:d})},{passive:!1})}),e.appendChild(n),()=>n.remove()}function G(e){let a=R(),t=null,n=0,r=0,s=!1,d=!1,i=!1,l=null,f=null;e.innerHTML=`
    <div class="game-page">
      <div class="game-layout">
        <div class="game-area">
          <canvas id="snake-canvas" width="${x}" height="${x}"></canvas>
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
    </div>`;const w=document.getElementById("snake-canvas"),D=document.getElementById("snake-over"),A=document.getElementById("snake-start"),I=document.getElementById("snake-pause");function L(){i||(d=!d,I.classList.toggle("hidden",!d))}function p(){return a}function g(c){d||i||(a=c(a))}l=q({pause:L},p,g),f=U(e.querySelector(".game-area"),p,g);function h(c){const u=c-n;if(n=c,!d&&!i){if(a.started&&A.classList.add("hidden"),a.started&&!s&&(s=!0,r=0),r+=u,r>=a.speed&&(r-=a.speed,a=N(a),document.getElementById("score-val").textContent=a.score.toLocaleString("de-DE"),document.getElementById("length-val").textContent=a.snake.length,!a.alive)){T();return}$(w,a)}t=requestAnimationFrame(h)}async function T(){i=!0,cancelAnimationFrame(t),t=null;const c=Math.max(5,Math.floor((Date.now()-(a.startTime??Date.now()))/1e3));D.classList.remove("hidden"),document.getElementById("final-score").textContent=a.score.toLocaleString("de-DE");const u=document.getElementById("save-status");if(await P()){u.textContent="Score wird gespeichert…";try{await B("snake",a.score,c),u.textContent="✓ Score gespeichert!",_("snake"),await E(document.getElementById("leaderboard-area"),"snake")}catch(m){u.textContent="⚠ "+m.message}}else{const m=document.createElement("span");m.textContent="Zum Speichern bitte ";const y=document.createElement("button");y.className="link-btn",y.textContent="anmelden",y.addEventListener("click",()=>M(()=>import("./auth-modal-DqaHq-1_.js"),__vite__mapDeps([0,1,2])).then(C=>C.initAuthModal().open())),u.append(m,y)}}document.getElementById("restart-btn").addEventListener("click",()=>{k(),G(e)}),E(document.getElementById("leaderboard-area"),"snake"),n=performance.now(),t=requestAnimationFrame(h);function k(){cancelAnimationFrame(t),t=null,l==null||l(),f==null||f()}return k}export{G as mount};
