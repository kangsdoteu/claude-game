const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-modal-DqaHq-1_.js","assets/index-DurTxyMH.js","assets/index-Bhv0n2Ht.css"])))=>i.map(i=>d[i]);
import{g as q,_ as V}from"./index-DurTxyMH.js";import{r as _,s as W,i as j}from"./leaderboard-C_MKienO.js";const E=10,S=20,w={I:{id:1,color:"#00f0f0",shape:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]]},O:{id:2,color:"#f0f000",shape:[[1,1],[1,1]]},T:{id:3,color:"#a000f0",shape:[[0,1,0],[1,1,1],[0,0,0]]},S:{id:4,color:"#00f000",shape:[[0,1,1],[1,1,0],[0,0,0]]},Z:{id:5,color:"#f00000",shape:[[1,1,0],[0,1,1],[0,0,0]]},J:{id:6,color:"#0000f0",shape:[[1,0,0],[1,1,1],[0,0,0]]},L:{id:7,color:"#f0a000",shape:[[0,0,1],[1,1,1],[0,0,0]]}},z=["#111","#00f0f0","#f0f000","#a000f0","#00f000","#f00000","#0000f0","#f0a000"],G=[800,720,630,550,470,380,300,220,130,100];function D(){const t=["I","O","T","S","Z","J","L"];for(let n=t.length-1;n>0;n--){const e=Math.floor(Math.random()*(n+1));[t[n],t[e]]=[t[e],t[n]]}return t}function Z(){return Array.from({length:S},()=>new Array(E).fill(0))}function T(t){const n=w[t];return{id:n.id,color:n.color,shape:n.shape.map(e=>[...e]),x:Math.floor((E-n.shape[0].length)/2),y:0}}function J(){let t=D(),n=D();const e=T(t.shift()),o=T(t.length?t[0]:n[0]);return{board:Z(),current:e,next:o,held:null,holdUsed:!1,bag:t,nextBag:n,score:0,level:0,lines:0,alive:!0,started:!1,startTime:null}}function U(t){let{bag:n,nextBag:e}=t;n.length||(n=e,e=D());const o=n.shift();return n.length||(n=e,e=D()),{piece:T(o),bag:n,nextBag:e,nextPieceKey:n[0]??e[0]}}function X(t){const n=t.length,e=t.map(o=>[...o]);for(let o=0;o<n;o++)for(let r=0;r<o;r++)[e[o][r],e[r][o]]=[e[r][o],e[o][r]];return e.forEach(o=>o.reverse()),e}function g(t,n,e,o){for(let r=0;r<n.length;r++)for(let a=0;a<n[r].length;a++){if(!n[r][a])continue;const s=e+a,i=o+r;if(s<0||s>=E||i>=S||i>=0&&t[i][s])return!0}return!1}const $=[[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1]];function P(t,n){if(!t.alive)return t;let{current:e,board:o}=t;switch(n){case"moveLeft":if(!g(o,e.shape,e.x-1,e.y))return{...t,current:{...e,x:e.x-1}};break;case"moveRight":if(!g(o,e.shape,e.x+1,e.y))return{...t,current:{...e,x:e.x+1}};break;case"softDrop":return g(o,e.shape,e.x,e.y+1)?M(t):{...t,current:{...e,y:e.y+1},score:t.score+1};case"hardDrop":{let r=0;for(;!g(o,e.shape,e.x,e.y+r+1);)r++;return M({...t,current:{...e,y:e.y+r},score:t.score+r*2})}case"rotate":{const r=X(e.shape);for(const[a,s]of $)if(!g(o,r,e.x+a,e.y+s))return{...t,current:{...e,shape:r,x:e.x+a,y:e.y+s}};break}case"hold":{if(t.holdUsed)break;const r=t.held,a={id:e.id,color:e.color,shape:w[Object.keys(w).find(i=>w[i].id===e.id)].shape.map(i=>[...i])},s=r?T(Object.keys(w).find(i=>w[i].id===r.id)):U(t).piece;return g(o,s.shape,s.x,s.y)?{...t,alive:!1}:{...t,current:s,held:a,holdUsed:!0}}}return t}function M(t){const{current:n,board:e}=t,o=e.map(c=>[...c]);for(let c=0;c<n.shape.length;c++)for(let v=0;v<n.shape[c].length;v++)n.shape[c][v]&&n.y+c>=0&&(o[n.y+c][n.x+v]=n.id);const a=o.filter(c=>c.every(v=>v!==0)).length,s=o.filter(c=>c.some(v=>v===0)),d=[...Array.from({length:a},()=>new Array(E).fill(0)),...s],m=[0,100,300,500,800],f=t.lines+a,y=Math.floor(f/10),l=t.score+m[a]*(t.level+1),{piece:h,bag:p,nextBag:C}=U({...t,bag:[...t.bag],nextBag:[...t.nextBag]});return g(d,h.shape,h.x,h.y)?{...t,board:d,score:l,lines:f,level:y,alive:!1}:{...t,board:d,current:h,bag:p,nextBag:C,holdUsed:!1,score:l,lines:f,level:y}}function Q(t){return t.started?t:{...t,started:!0,startTime:Date.now()}}function ee(t){let n=0;for(;!g(t.board,t.current.shape,t.current.x,t.current.y+n+1);)n++;return t.current.y+n}function te(t){return G[Math.min(t,9)]}const u=30,F=E*u,H=S*u;function N(t,n){const e=t.getContext("2d");e.clearRect(0,0,t.width,t.height),e.fillStyle="#0d0d14",e.fillRect(0,0,t.width,t.height),e.strokeStyle="rgba(255,255,255,0.04)",e.lineWidth=1;for(let r=0;r<=E;r++)e.beginPath(),e.moveTo(r*u,0),e.lineTo(r*u,H),e.stroke();for(let r=0;r<=S;r++)e.beginPath(),e.moveTo(0,r*u),e.lineTo(F,r*u),e.stroke();for(let r=0;r<S;r++)for(let a=0;a<E;a++)n.board[r][a]&&R(e,a,r,z[n.board[r][a]]);const o=ee(n);o!==n.current.y&&n.current.shape.forEach((r,a)=>r.forEach((s,i)=>{s&&R(e,n.current.x+i,o+a,n.current.color,.2)})),n.current.shape.forEach((r,a)=>r.forEach((s,i)=>{s&&R(e,n.current.x+i,n.current.y+a,n.current.color)}))}function R(t,n,e,o,r=1){t.globalAlpha=r,t.fillStyle=o,t.fillRect(n*u+1,e*u+1,u-2,u-2),r>.5&&(t.fillStyle="rgba(255,255,255,0.18)",t.fillRect(n*u+1,e*u+1,u-2,5)),t.globalAlpha=1}function K(t,n){if(!t||!n)return;const e=t.getContext("2d"),o=24;e.clearRect(0,0,t.width,t.height),e.fillStyle="#0d0d14",e.fillRect(0,0,t.width,t.height);const r=n.shape,a=Math.floor((t.width/o-r[0].length)/2),s=Math.floor((t.height/o-r.length)/2);r.forEach((i,d)=>i.forEach((m,f)=>{m&&(e.fillStyle=n.color,e.fillRect((a+f)*o+1,(s+d)*o+1,o-2,o-2),e.fillStyle="rgba(255,255,255,0.18)",e.fillRect((a+f)*o+1,(s+d)*o+1,o-2,5))}))}const ne=170,re=50,oe=80,ae=50;function se(t,n,e){let o=null,r=null;const a={ArrowLeft:"moveLeft",ArrowRight:"moveRight",ArrowDown:"softDrop",ArrowUp:"rotate"," ":"hardDrop",z:"rotate",c:"hold",Shift:"hold",a:"moveLeft",d:"moveRight",s:"softDrop",w:"rotate"},s=new Set(["ArrowLeft","ArrowRight","a","d"]),i=new Set(["ArrowDown","s"]),d=new Set(["p","P","Escape"]);function m(l,h,p){clearTimeout(r),clearInterval(r),o=l,r=setTimeout(()=>{r=setInterval(()=>e(a[o]),p)},h)}function f(l){var p;if(l.target.tagName==="INPUT"||l.target.tagName==="TEXTAREA"||l.target.closest("dialog[open]")||l.repeat)return;if(d.has(l.key)){l.preventDefault(),(p=t.pause)==null||p.call(t);return}const h=a[l.key];h&&(l.preventDefault(),e(h),s.has(l.key)?m(l.key,ne,re):i.has(l.key)&&m(l.key,oe,ae))}function y(l){l.key===o&&(clearTimeout(r),clearInterval(r),o=null)}return document.addEventListener("keydown",f),document.addEventListener("keyup",y),function(){document.removeEventListener("keydown",f),document.removeEventListener("keyup",y),clearTimeout(r),clearInterval(r)}}function ie(t,n){const e=document.createElement("div");return e.className="touch-controls",e.innerHTML=`
    <div class="dpad-row">
      <button class="dpad-btn" data-action="rotate">↑ Drehen</button>
    </div>
    <div class="dpad-row">
      <button class="dpad-btn" data-action="moveLeft">←</button>
      <button class="dpad-btn" data-action="softDrop">↓</button>
      <button class="dpad-btn" data-action="moveRight">→</button>
    </div>
    <div class="dpad-row">
      <button class="dpad-btn wide" data-action="hardDrop">⬇ Drop</button>
      <button class="dpad-btn wide" data-action="hold">Hold</button>
    </div>`,e.querySelectorAll(".dpad-btn").forEach(o=>{o.addEventListener("touchstart",r=>{r.preventDefault(),n(o.dataset.action)},{passive:!1})}),t.appendChild(e),()=>e.remove()}function le(t){let n=J(),e=null,o=0,r=0,a=!1,s=!1,i=null,d=null;t.innerHTML=`
    <div class="game-page">
      <div class="game-layout">
        <div class="game-area">
          <canvas id="tetris-canvas" width="${F}" height="${H}"></canvas>
          <div class="start-overlay" id="tetris-start">
            <h2>Tetris</h2>
            <p>Drücke eine Taste zum Starten</p>
          </div>
          <div class="pause-overlay hidden" id="tetris-pause">⏸ Pause</div>
          <div class="game-over-overlay hidden" id="tetris-over">
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
              <div class="stat-label">Level</div>
              <div class="stat-value" id="level-val">1</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Lines</div>
              <div class="stat-value" id="lines-val">0</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Nächstes</div>
              <canvas id="next-canvas" width="96" height="96"></canvas>
            </div>
            <div class="stat-box">
              <div class="stat-label">Hold (C)</div>
              <canvas id="hold-canvas" width="96" height="96"></canvas>
            </div>
          </div>
          <div id="leaderboard-area"></div>
        </aside>
      </div>
    </div>`;const m=document.getElementById("tetris-canvas"),f=document.getElementById("next-canvas"),y=document.getElementById("hold-canvas"),l=document.getElementById("tetris-over"),h=document.getElementById("tetris-start"),p=document.getElementById("tetris-pause");function C(){s||(a=!a,p.classList.toggle("hidden",!a))}function c(){document.getElementById("score-val").textContent=n.score.toLocaleString("de-DE"),document.getElementById("level-val").textContent=n.level+1,document.getElementById("lines-val").textContent=n.lines,K(f,n.next),K(y,n.held)}function v(b){a||s||b==="hold"&&!n.started||(n.started||(n=Q(n),h.classList.add("hidden")),n=P(n,b),N(m,n),c(),n.alive||B())}i=se({pause:C},()=>n,v),d=ie(t.querySelector(".game-area"),v);function k(b){if(!a&&!s){const x=b-o;if(n.started){r+=x;const I=te(n.level);if(r>=I&&(r-=I,n=P(n,"softDrop"),!n.alive)){B();return}}N(m,n),c()}o=b,e=requestAnimationFrame(k)}async function B(){s=!0,cancelAnimationFrame(e),e=null;const b=Math.max(5,Math.floor((Date.now()-(n.startTime??Date.now()))/1e3));l.classList.remove("hidden"),document.getElementById("final-score").textContent=n.score.toLocaleString("de-DE");const x=document.getElementById("save-status");if(await q()){x.textContent="Score wird gespeichert…";try{await W("tetris",n.score,b),x.textContent="✓ Score gespeichert!",j("tetris"),await _(document.getElementById("leaderboard-area"),"tetris")}catch(L){x.textContent="⚠ "+L.message}}else{const L=document.createElement("span");L.textContent="Zum Speichern bitte ";const A=document.createElement("button");A.className="link-btn",A.textContent="anmelden",A.addEventListener("click",()=>V(()=>import("./auth-modal-DqaHq-1_.js"),__vite__mapDeps([0,1,2])).then(Y=>Y.initAuthModal().open())),x.append(L,A)}}document.getElementById("restart-btn").addEventListener("click",()=>{O(),le(t)}),_(document.getElementById("leaderboard-area"),"tetris"),o=performance.now(),e=requestAnimationFrame(k);function O(){cancelAnimationFrame(e),e=null,i==null||i(),d==null||d()}return O}export{le as mount};
