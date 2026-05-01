const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-modal-CbLfjJW5.js","assets/index-C6q-p1mS.js","assets/index-BcCTZ-9d.css"])))=>i.map(i=>d[i]);
import{g as D,_ as I}from"./index-C6q-p1mS.js";import{r as b,s as L}from"./leaderboard-CrTmdtMf.js";const u=20;function C(){const n=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];return{snake:n,dir:{x:1,y:0},nextDir:{x:1,y:0},food:E(n),score:0,speed:150,alive:!0,startTime:Date.now()}}function T(n){if(!n.alive)return n;const a=n.nextDir,e=n.snake[0],t={x:e.x+a.x,y:e.y+a.y};if(t.x<0||t.x>=u||t.y<0||t.y>=u)return{...n,dir:a,alive:!1};if(n.snake.some(m=>m.x===t.x&&m.y===t.y))return{...n,dir:a,alive:!1};const o=[t,...n.snake],d=t.x===n.food.x&&t.y===n.food.y;d||o.pop();const s=d?n.score+10:n.score,i=d&&s%50===0?Math.max(60,n.speed-10):n.speed;return{...n,snake:o,dir:a,nextDir:a,food:d?E(o):n.food,score:s,speed:i}}function k(n,a){return a.x===-n.nextDir.x&&a.y===-n.nextDir.y?n:{...n,nextDir:a}}function E(n){const a=new Set(n.map(t=>`${t.x},${t.y}`));let e;do e={x:Math.floor(Math.random()*u),y:Math.floor(Math.random()*u)};while(a.has(`${e.x},${e.y}`));return e}const r=20,y=u*r;function M(n,a){const e=n.getContext("2d");e.fillStyle="#0a0a0f",e.fillRect(0,0,n.width,n.height),e.strokeStyle="rgba(255,255,255,0.03)",e.lineWidth=1;for(let t=0;t<=u;t++)e.beginPath(),e.moveTo(t*r,0),e.lineTo(t*r,y),e.stroke(),e.beginPath(),e.moveTo(0,t*r),e.lineTo(y,t*r),e.stroke();if(a.snake.forEach(({x:t,y:o},d)=>{const s=d/a.snake.length;e.fillStyle=`hsl(120, 80%, ${60-s*35}%)`,e.fillRect(t*r+1,o*r+1,r-2,r-2)}),a.snake.length>0){e.fillStyle="#7fff00";const{x:t,y:o}=a.snake[0];e.fillRect(t*r+1,o*r+1,r-2,r-2)}e.fillStyle="#ff4444",e.beginPath(),e.arc(a.food.x*r+r/2,a.food.y*r+r/2,r/2-2,0,Math.PI*2),e.fill()}const _={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}};function B(n,a){function e(t){if(t.target.tagName==="INPUT"||t.target.tagName==="TEXTAREA"||t.target.closest("dialog[open]"))return;const o=_[t.key];!o||(t.preventDefault(),!n().alive)||a(s=>k(s,o))}return document.addEventListener("keydown",e),()=>document.removeEventListener("keydown",e)}function P(n,a,e){const t=document.createElement("div");return t.className="touch-controls",t.innerHTML=`
    <div class="dpad-row">
      <button class="dpad-btn" data-x="0" data-y="-1">↑</button>
    </div>
    <div class="dpad-row">
      <button class="dpad-btn" data-x="-1" data-y="0">←</button>
      <button class="dpad-btn" data-x="0" data-y="1">↓</button>
      <button class="dpad-btn" data-x="1" data-y="0">→</button>
    </div>`,t.querySelectorAll(".dpad-btn").forEach(o=>{o.addEventListener("touchstart",d=>{d.preventDefault();const s={x:+o.dataset.x,y:+o.dataset.y};e(i=>k(i,s))},{passive:!1})}),n.appendChild(t),()=>t.remove()}function R(n){let a=C(),e=null,t=0,o=0,d=!1,s=null,i=null;n.innerHTML=`
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
    </div>`;const m=document.getElementById("snake-canvas"),w=document.getElementById("snake-over");function x(){return a}function g(l){a=l(a)}s=B(x,g),i=P(n.querySelector(".game-area"),x,g);function h(l){const c=l-t;if(t=l,!d){if(o+=c,o>=a.speed&&(o-=a.speed,a=T(a),document.getElementById("score-val").textContent=a.score.toLocaleString("de-DE"),document.getElementById("length-val").textContent=a.snake.length,!a.alive)){S();return}M(m,a)}e=requestAnimationFrame(h)}async function S(){d=!0,cancelAnimationFrame(e),e=null;const l=Math.max(5,Math.floor((Date.now()-a.startTime)/1e3));w.classList.remove("hidden"),document.getElementById("final-score").textContent=a.score.toLocaleString("de-DE");const c=document.getElementById("save-status");if(await D()){c.textContent="Score wird gespeichert…";try{await L("snake",a.score,l),c.textContent="✓ Score gespeichert!",await b(document.getElementById("leaderboard-area"),"snake")}catch(v){c.textContent="⚠ "+v.message}}else{const v=document.createElement("span");v.textContent="Zum Speichern bitte ";const f=document.createElement("button");f.className="link-btn",f.textContent="anmelden",f.addEventListener("click",()=>I(()=>import("./auth-modal-CbLfjJW5.js"),__vite__mapDeps([0,1,2])).then(A=>A.initAuthModal().open())),c.append(v,f)}}document.getElementById("restart-btn").addEventListener("click",()=>{p(),R(n)}),b(document.getElementById("leaderboard-area"),"snake"),t=performance.now(),e=requestAnimationFrame(h);function p(){cancelAnimationFrame(e),e=null,s==null||s(),i==null||i()}return p}export{R as mount};
