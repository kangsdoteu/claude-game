const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-modal-CbDLVnIa.js","assets/index-Cuo8J4Js.js","assets/index-IZQovrY2.css"])))=>i.map(i=>d[i]);
import{g as D,_ as L}from"./index-Cuo8J4Js.js";import{r as b,s as A}from"./leaderboard-NlByvmLu.js";const u=20;function I(){const n=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];return{snake:n,dir:{x:1,y:0},nextDir:{x:1,y:0},food:k(n),score:0,speed:150,alive:!0,startTime:Date.now()}}function C(n){if(!n.alive)return n;const a=n.nextDir,e=n.snake[0],t={x:e.x+a.x,y:e.y+a.y};if(t.x<0||t.x>=u||t.y<0||t.y>=u)return{...n,dir:a,alive:!1};if(n.snake.some(v=>v.x===t.x&&v.y===t.y))return{...n,dir:a,alive:!1};const o=[t,...n.snake],s=t.x===n.food.x&&t.y===n.food.y;s||o.pop();const r=s?n.score+10:n.score,i=s&&r%50===0?Math.max(60,n.speed-10):n.speed;return{...n,snake:o,dir:a,nextDir:a,food:s?k(o):n.food,score:r,speed:i}}function k(n){const a=new Set(n.map(t=>`${t.x},${t.y}`));let e;do e={x:Math.floor(Math.random()*u),y:Math.floor(Math.random()*u)};while(a.has(`${e.x},${e.y}`));return e}const d=20,y=u*d;function M(n,a){const e=n.getContext("2d");e.fillStyle="#0a0a0f",e.fillRect(0,0,n.width,n.height),e.strokeStyle="rgba(255,255,255,0.03)",e.lineWidth=1;for(let t=0;t<=u;t++)e.beginPath(),e.moveTo(t*d,0),e.lineTo(t*d,y),e.stroke(),e.beginPath(),e.moveTo(0,t*d),e.lineTo(y,t*d),e.stroke();if(a.snake.forEach(({x:t,y:o},s)=>{const r=s/a.snake.length;e.fillStyle=`hsl(120, 80%, ${60-r*35}%)`,e.fillRect(t*d+1,o*d+1,d-2,d-2)}),a.snake.length>0){e.fillStyle="#7fff00";const{x:t,y:o}=a.snake[0];e.fillRect(t*d+1,o*d+1,d-2,d-2)}e.fillStyle="#ff4444",e.beginPath(),e.arc(a.food.x*d+d/2,a.food.y*d+d/2,d/2-2,0,Math.PI*2),e.fill()}const T={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}};function _(n,a){function e(t){const o=T[t.key];!o||(t.preventDefault(),!n().alive)||a(r=>o.x===-r.dir.x&&o.y===-r.dir.y?r:{...r,nextDir:o})}return document.addEventListener("keydown",e),()=>document.removeEventListener("keydown",e)}function B(n,a,e){const t=document.createElement("div");return t.className="touch-controls",t.innerHTML=`
    <div class="dpad-row">
      <button class="dpad-btn" data-x="0" data-y="-1">↑</button>
    </div>
    <div class="dpad-row">
      <button class="dpad-btn" data-x="-1" data-y="0">←</button>
      <button class="dpad-btn" data-x="0" data-y="1">↓</button>
      <button class="dpad-btn" data-x="1" data-y="0">→</button>
    </div>`,t.querySelectorAll(".dpad-btn").forEach(o=>{o.addEventListener("touchstart",s=>{s.preventDefault();const r={x:+o.dataset.x,y:+o.dataset.y};e(i=>r.x===-i.dir.x&&r.y===-i.dir.y?i:{...i,nextDir:r})},{passive:!1})}),n.appendChild(t),()=>t.remove()}function P(n){let a=I(),e=null,t=0,o=0,s=!1,r=null,i=null;n.innerHTML=`
    <div class="game-page">
      <div class="game-layout">
        <div class="game-area">
          <canvas id="snake-canvas" width="${y}" height="${y}"></canvas>
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
    </div>`;const v=document.getElementById("snake-canvas"),w=document.getElementById("snake-over");function x(){return a}function h(l){a=l(a)}r=_(x,h),i=B(n.querySelector(".game-area"),x,h);function g(l){const c=l-t;if(t=l,!s){if(o+=c,o>=a.speed&&(o-=a.speed,a=C(a),document.getElementById("score-val").textContent=a.score.toLocaleString("de-DE"),document.getElementById("length-val").textContent=a.snake.length,!a.alive)){E();return}M(v,a)}e=requestAnimationFrame(g)}async function E(){s=!0,cancelAnimationFrame(e),e=null;const l=Math.max(5,Math.floor((Date.now()-a.startTime)/1e3));w.classList.remove("hidden"),document.getElementById("final-score").textContent=a.score.toLocaleString("de-DE");const c=document.getElementById("save-status");if(await D()){c.textContent="Score wird gespeichert…";try{await A("snake",a.score,l),c.textContent="✓ Score gespeichert!",await b(document.getElementById("leaderboard-area"),"snake")}catch(m){c.textContent="⚠ "+m.message}}else{const m=document.createElement("span");m.textContent="Zum Speichern bitte ";const f=document.createElement("button");f.className="link-btn",f.textContent="anmelden",f.addEventListener("click",()=>L(()=>import("./auth-modal-CbDLVnIa.js"),__vite__mapDeps([0,1,2])).then(S=>S.initAuthModal().open())),c.append(m,f)}}document.getElementById("restart-btn").addEventListener("click",()=>{p(),P(n)}),b(document.getElementById("leaderboard-area"),"snake"),t=performance.now(),e=requestAnimationFrame(g);function p(){cancelAnimationFrame(e),e=null,r==null||r(),i==null||i()}return p}export{P as mount};
