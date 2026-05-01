const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-modal-DQPQQLlE.js","assets/index-CyMEHxc3.js","assets/index-yjN35ree.css"])))=>i.map(i=>d[i]);
import{g as C,_ as T}from"./index-CyMEHxc3.js";import{r as b,s as M}from"./leaderboard-BSp_F-kC.js";const v=20;function P(){const e=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];return{snake:e,dir:{x:1,y:0},nextDir:{x:1,y:0},food:k(e),score:0,speed:150,alive:!0,startTime:Date.now()}}function _(e){if(!e.alive)return e;const n=e.nextDir,t=e.snake[0],a={x:t.x+n.x,y:t.y+n.y};if(a.x<0||a.x>=v||a.y<0||a.y>=v)return{...e,dir:n,alive:!1};if(e.snake.some(l=>l.x===a.x&&l.y===a.y))return{...e,dir:n,alive:!1};const o=[a,...e.snake],s=a.x===e.food.x&&a.y===e.food.y;s||o.pop();const d=s?e.score+10:e.score,i=s&&d%50===0?Math.max(60,e.speed-10):e.speed;return{...e,snake:o,dir:n,nextDir:n,food:s?k(o):e.food,score:d,speed:i}}function E(e,n){return n.x===-e.nextDir.x&&n.y===-e.nextDir.y?e:{...e,nextDir:n}}function k(e){const n=new Set(e.map(a=>`${a.x},${a.y}`));let t;do t={x:Math.floor(Math.random()*v),y:Math.floor(Math.random()*v)};while(n.has(`${t.x},${t.y}`));return t}const r=20,y=v*r;function B(e,n){const t=e.getContext("2d");t.fillStyle="#0a0a0f",t.fillRect(0,0,e.width,e.height),t.strokeStyle="rgba(255,255,255,0.03)",t.lineWidth=1;for(let a=0;a<=v;a++)t.beginPath(),t.moveTo(a*r,0),t.lineTo(a*r,y),t.stroke(),t.beginPath(),t.moveTo(0,a*r),t.lineTo(y,a*r),t.stroke();if(n.snake.forEach(({x:a,y:o},s)=>{const d=s/n.snake.length;t.fillStyle=`hsl(120, 80%, ${60-d*35}%)`,t.fillRect(a*r+1,o*r+1,r-2,r-2)}),n.snake.length>0){t.fillStyle="#7fff00";const{x:a,y:o}=n.snake[0];t.fillRect(a*r+1,o*r+1,r-2,r-2)}t.fillStyle="#ff4444",t.beginPath(),t.arc(n.food.x*r+r/2,n.food.y*r+r/2,r/2-2,0,Math.PI*2),t.fill()}const R={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}},N=new Set(["p","P","Escape"]);function $(e,n,t){function a(o){var i;if(o.target.tagName==="INPUT"||o.target.tagName==="TEXTAREA"||o.target.closest("dialog[open]")||o.repeat)return;if(N.has(o.key)){o.preventDefault(),(i=e.pause)==null||i.call(e);return}const s=R[o.key];!s||(o.preventDefault(),!n().alive)||t(l=>E(l,s))}return document.addEventListener("keydown",a),()=>document.removeEventListener("keydown",a)}function F(e,n,t){const a=document.createElement("div");return a.className="touch-controls",a.innerHTML=`
    <div class="dpad-row">
      <button class="dpad-btn" data-x="0" data-y="-1">↑</button>
    </div>
    <div class="dpad-row">
      <button class="dpad-btn" data-x="-1" data-y="0">←</button>
      <button class="dpad-btn" data-x="0" data-y="1">↓</button>
      <button class="dpad-btn" data-x="1" data-y="0">→</button>
    </div>`,a.querySelectorAll(".dpad-btn").forEach(o=>{o.addEventListener("touchstart",s=>{s.preventDefault();const d={x:+o.dataset.x,y:+o.dataset.y};t(i=>E(i,d))},{passive:!1})}),e.appendChild(a),()=>a.remove()}function q(e){let n=P(),t=null,a=0,o=0,s=!1,d=!1,i=null,l=null;e.innerHTML=`
    <div class="game-page">
      <div class="game-layout">
        <div class="game-area">
          <canvas id="snake-canvas" width="${y}" height="${y}"></canvas>
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
    </div>`;const S=document.getElementById("snake-canvas"),w=document.getElementById("snake-over"),A=document.getElementById("snake-pause");function D(){d||(s=!s,A.classList.toggle("hidden",!s))}function x(){return n}function g(c){s||d||(n=c(n))}i=$({pause:D},x,g),l=F(e.querySelector(".game-area"),x,g);function p(c){const u=c-a;if(a=c,!s&&!d){if(o+=u,o>=n.speed&&(o-=n.speed,n=_(n),document.getElementById("score-val").textContent=n.score.toLocaleString("de-DE"),document.getElementById("length-val").textContent=n.snake.length,!n.alive)){I();return}B(S,n)}t=requestAnimationFrame(p)}async function I(){d=!0,cancelAnimationFrame(t),t=null;const c=Math.max(5,Math.floor((Date.now()-n.startTime)/1e3));w.classList.remove("hidden"),document.getElementById("final-score").textContent=n.score.toLocaleString("de-DE");const u=document.getElementById("save-status");if(await C()){u.textContent="Score wird gespeichert…";try{await M("snake",n.score,c),u.textContent="✓ Score gespeichert!",await b(document.getElementById("leaderboard-area"),"snake")}catch(f){u.textContent="⚠ "+f.message}}else{const f=document.createElement("span");f.textContent="Zum Speichern bitte ";const m=document.createElement("button");m.className="link-btn",m.textContent="anmelden",m.addEventListener("click",()=>T(()=>import("./auth-modal-DQPQQLlE.js"),__vite__mapDeps([0,1,2])).then(L=>L.initAuthModal().open())),u.append(f,m)}}document.getElementById("restart-btn").addEventListener("click",()=>{h(),q(e)}),b(document.getElementById("leaderboard-area"),"snake"),a=performance.now(),t=requestAnimationFrame(p);function h(){cancelAnimationFrame(t),t=null,i==null||i(),l==null||l()}return h}export{q as mount};
