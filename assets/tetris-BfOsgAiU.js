const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-modal-DxCDuf9M.js","assets/index-_fBGyYWH.js","assets/index-YJyARh-L.css"])))=>i.map(i=>d[i]);
import{g as q,_ as V}from"./index-_fBGyYWH.js";import{r as _,s as W,i as j}from"./leaderboard-nxGQXlLc.js";const E=10,L=20,S={I:{id:1,color:"#00f0f0",shape:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]]},O:{id:2,color:"#f0f000",shape:[[1,1],[1,1]]},T:{id:3,color:"#a000f0",shape:[[0,1,0],[1,1,1],[0,0,0]]},S:{id:4,color:"#00f000",shape:[[0,1,1],[1,1,0],[0,0,0]]},Z:{id:5,color:"#f00000",shape:[[1,1,0],[0,1,1],[0,0,0]]},J:{id:6,color:"#0000f0",shape:[[1,0,0],[1,1,1],[0,0,0]]},L:{id:7,color:"#f0a000",shape:[[0,0,1],[1,1,1],[0,0,0]]}},z=["#111","#00f0f0","#f0f000","#a000f0","#00f000","#f00000","#0000f0","#f0a000"],G=[800,720,630,550,470,380,300,220,130,100];function C(){const t=["I","O","T","S","Z","J","L"];for(let n=t.length-1;n>0;n--){const e=Math.floor(Math.random()*(n+1));[t[n],t[e]]=[t[e],t[n]]}return t}function Z(){return Array.from({length:L},()=>new Array(E).fill(0))}function I(t){const n=S[t];return{id:n.id,color:n.color,shape:n.shape.map(e=>[...e]),x:Math.floor((E-n.shape[0].length)/2),y:0}}function J(){let t=C(),n=C();const e=I(t.shift()),o=I(t.length?t[0]:n[0]);return{board:Z(),current:e,next:o,held:null,holdUsed:!1,bag:t,nextBag:n,score:0,level:0,lines:0,alive:!0,started:!1,startTime:null}}function U(t){let{bag:n,nextBag:e}=t;n.length||(n=e,e=C());const o=n.shift();return n.length||(n=e,e=C()),{piece:I(o),bag:n,nextBag:e,nextPieceKey:n[0]??e[0]}}function X(t){const n=t.length,e=t.map(o=>[...o]);for(let o=0;o<n;o++)for(let r=0;r<o;r++)[e[o][r],e[r][o]]=[e[r][o],e[o][r]];return e.forEach(o=>o.reverse()),e}function b(t,n,e,o){for(let r=0;r<n.length;r++)for(let a=0;a<n[r].length;a++){if(!n[r][a])continue;const s=e+a,i=o+r;if(s<0||s>=E||i>=L||i>=0&&t[i][s])return!0}return!1}const $=[[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1]];function M(t,n){if(!t.alive)return t;let{current:e,board:o}=t;switch(n){case"moveLeft":if(!b(o,e.shape,e.x-1,e.y))return{...t,current:{...e,x:e.x-1}};break;case"moveRight":if(!b(o,e.shape,e.x+1,e.y))return{...t,current:{...e,x:e.x+1}};break;case"softDrop":return b(o,e.shape,e.x,e.y+1)?P(t):{...t,current:{...e,y:e.y+1},score:t.score+1};case"hardDrop":{let r=0;for(;!b(o,e.shape,e.x,e.y+r+1);)r++;return P({...t,current:{...e,y:e.y+r},score:t.score+r*2})}case"rotate":{const r=X(e.shape);for(const[a,s]of $)if(!b(o,r,e.x+a,e.y+s))return{...t,current:{...e,shape:r,x:e.x+a,y:e.y+s}};break}case"hold":{if(t.holdUsed)break;const r=t.held,a={id:e.id,color:e.color,shape:S[Object.keys(S).find(i=>S[i].id===e.id)].shape.map(i=>[...i])},s=r?I(Object.keys(S).find(i=>S[i].id===r.id)):U(t).piece;return b(o,s.shape,s.x,s.y)?{...t,alive:!1}:{...t,current:s,held:a,holdUsed:!0}}}return t}function P(t){const{current:n,board:e}=t,o=e.map(d=>[...d]);for(let d=0;d<n.shape.length;d++)for(let h=0;h<n.shape[d].length;h++)n.shape[d][h]&&n.y+d>=0&&(o[n.y+d][n.x+h]=n.id);const a=o.filter(d=>d.every(h=>h!==0)).length,s=o.filter(d=>d.some(h=>h===0)),c=[...Array.from({length:a},()=>new Array(E).fill(0)),...s],p=[0,100,300,500,800],f=t.lines+a,x=Math.floor(f/10),l=t.score+p[a]*(t.level+1),{piece:v,bag:y,nextBag:T}=U({...t,bag:[...t.bag],nextBag:[...t.nextBag]});return b(c,v.shape,v.x,v.y)?{...t,board:c,score:l,lines:f,level:x,alive:!1}:{...t,board:c,current:v,bag:y,nextBag:T,holdUsed:!1,score:l,lines:f,level:x}}function Q(t){return t.started?t:{...t,started:!0,startTime:Date.now()}}function ee(t){let n=0;for(;!b(t.board,t.current.shape,t.current.x,t.current.y+n+1);)n++;return t.current.y+n}function te(t){return G[Math.min(t,9)]}const u=30,H=E*u,F=L*u;function N(t,n){const e=t.getContext("2d");e.clearRect(0,0,t.width,t.height),e.fillStyle="#0d0d14",e.fillRect(0,0,t.width,t.height),e.strokeStyle="rgba(255,255,255,0.04)",e.lineWidth=1;for(let r=0;r<=E;r++)e.beginPath(),e.moveTo(r*u,0),e.lineTo(r*u,F),e.stroke();for(let r=0;r<=L;r++)e.beginPath(),e.moveTo(0,r*u),e.lineTo(H,r*u),e.stroke();for(let r=0;r<L;r++)for(let a=0;a<E;a++)n.board[r][a]&&k(e,a,r,z[n.board[r][a]]);const o=ee(n);o!==n.current.y&&n.current.shape.forEach((r,a)=>r.forEach((s,i)=>{s&&k(e,n.current.x+i,o+a,n.current.color,.2)})),n.current.shape.forEach((r,a)=>r.forEach((s,i)=>{s&&k(e,n.current.x+i,n.current.y+a,n.current.color)}))}function k(t,n,e,o,r=1){t.globalAlpha=r,t.fillStyle=o,t.fillRect(n*u+1,e*u+1,u-2,u-2),r>.5&&(t.fillStyle="rgba(255,255,255,0.18)",t.fillRect(n*u+1,e*u+1,u-2,5)),t.globalAlpha=1}function K(t,n){if(!t||!n)return;const e=t.getContext("2d"),o=24;e.clearRect(0,0,t.width,t.height),e.fillStyle="#0d0d14",e.fillRect(0,0,t.width,t.height);const r=n.shape,a=Math.floor((t.width/o-r[0].length)/2),s=Math.floor((t.height/o-r.length)/2);r.forEach((i,c)=>i.forEach((p,f)=>{p&&(e.fillStyle=n.color,e.fillRect((a+f)*o+1,(s+c)*o+1,o-2,o-2),e.fillStyle="rgba(255,255,255,0.18)",e.fillRect((a+f)*o+1,(s+c)*o+1,o-2,5))}))}const ne=170,re=50,oe=80,ae=50;function se(t,n,e){let o=null,r=null;const a={ArrowLeft:"moveLeft",ArrowRight:"moveRight",ArrowDown:"softDrop",ArrowUp:"rotate"," ":"hardDrop",z:"rotate",c:"hold",Shift:"hold",a:"moveLeft",d:"moveRight",s:"softDrop",w:"rotate"},s=new Set(["ArrowLeft","ArrowRight","a","d"]),i=new Set(["ArrowDown","s"]),c=new Set(["p","P","Escape"]);function p(l,v,y){clearTimeout(r),clearInterval(r),o=l,r=setTimeout(()=>{r=setInterval(()=>e(a[o]),y)},v)}function f(l){var y;if(l.target.tagName==="INPUT"||l.target.tagName==="TEXTAREA"||l.target.closest("dialog[open]")||l.repeat)return;if(c.has(l.key)){l.preventDefault(),(y=t.pause)==null||y.call(t);return}const v=a[l.key];v&&(l.preventDefault(),e(v),s.has(l.key)?p(l.key,ne,re):i.has(l.key)&&p(l.key,oe,ae))}function x(l){l.key===o&&(clearTimeout(r),clearInterval(r),o=null)}return document.addEventListener("keydown",f),document.addEventListener("keyup",x),function(){document.removeEventListener("keydown",f),document.removeEventListener("keyup",x),clearTimeout(r),clearInterval(r)}}function ie(t,n){const e=document.createElement("div");return e.className="touch-controls",e.innerHTML=`
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
    </div>`,e.querySelectorAll(".dpad-btn").forEach(o=>{o.addEventListener("touchstart",r=>{r.preventDefault(),n(o.dataset.action)},{passive:!1})}),t.appendChild(e),()=>e.remove()}function le(t){let n=J(),e=null,o=0,r=0,a=!1,s=!1,i=null,c=null;t.innerHTML=`
    <div class="game-page">
      <!-- Mobile score strip (sticky, above canvas) -->
      <div class="sidebar-stats--strip">
        <div class="stat-box">
          <div class="stat-label">Score</div>
          <div class="stat-value" id="score-val-strip">0</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Level</div>
          <div class="stat-value" id="level-val-strip">1</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Lines</div>
          <div class="stat-value" id="lines-val-strip">0</div>
        </div>
      </div>
      <div class="game-layout">
        <div class="game-area">
          <canvas id="tetris-canvas" width="${H}" height="${F}"></canvas>
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
          <!-- Desktop sidebar stats (Score/Level/Lines) -->
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
          </div>
          <!-- Next + Hold: visible on desktop in sidebar, scrollable below fold on mobile -->
          <div class="sidebar-extras">
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
    </div>`;const p=document.getElementById("tetris-canvas"),f=document.getElementById("next-canvas"),x=document.getElementById("hold-canvas"),l=document.getElementById("tetris-over"),v=document.getElementById("tetris-start"),y=document.getElementById("tetris-pause");function T(){s||(a=!a,y.classList.toggle("hidden",!a))}function d(){const m=n.score.toLocaleString("de-DE"),g=n.level+1,w=n.lines;document.getElementById("score-val").textContent=m,document.getElementById("level-val").textContent=g,document.getElementById("lines-val").textContent=w,document.getElementById("score-val-strip").textContent=m,document.getElementById("level-val-strip").textContent=g,document.getElementById("lines-val-strip").textContent=w,K(f,n.next),K(x,n.held)}function h(m){a||s||m==="hold"&&!n.started||(n.started||(n=Q(n),v.classList.add("hidden")),n=M(n,m),N(p,n),d(),n.alive||R())}i=se({pause:T},()=>n,h),c=ie(t.querySelector(".game-page"),h);function B(m){if(!a&&!s){const g=m-o;if(n.started){r+=g;const w=te(n.level);if(r>=w&&(r-=w,n=M(n,"softDrop"),!n.alive)){R();return}}N(p,n),d()}o=m,e=requestAnimationFrame(B)}async function R(){s=!0,cancelAnimationFrame(e),e=null;const m=Math.max(5,Math.floor((Date.now()-(n.startTime??Date.now()))/1e3));l.classList.remove("hidden"),document.getElementById("final-score").textContent=n.score.toLocaleString("de-DE");const g=document.getElementById("save-status");if(await q()){g.textContent="Score wird gespeichert…";try{await W("tetris",n.score,m),g.textContent="✓ Score gespeichert!",j("tetris"),await _(document.getElementById("leaderboard-area"),"tetris")}catch(A){g.textContent="⚠ "+A.message}}else{const A=document.createElement("span");A.textContent="Zum Speichern bitte ";const D=document.createElement("button");D.className="link-btn",D.textContent="anmelden",D.addEventListener("click",()=>V(()=>import("./auth-modal-DxCDuf9M.js"),__vite__mapDeps([0,1,2])).then(Y=>Y.initAuthModal().open())),g.append(A,D)}}document.getElementById("restart-btn").addEventListener("click",()=>{O(),le(t)}),_(document.getElementById("leaderboard-area"),"tetris"),o=performance.now(),e=requestAnimationFrame(B);function O(){cancelAnimationFrame(e),e=null,i==null||i(),c==null||c()}return O}export{le as mount};
