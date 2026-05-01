const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-modal-SYBlstN3.js","assets/index-C6Yrokzr.js","assets/index-Bhv0n2Ht.css"])))=>i.map(i=>d[i]);
import{g as Y,_ as q}from"./index-C6Yrokzr.js";import{r as O,s as V,i as W}from"./leaderboard-CNvs22gQ.js";const b=10,S=20,w={I:{id:1,color:"#00f0f0",shape:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]]},O:{id:2,color:"#f0f000",shape:[[1,1],[1,1]]},T:{id:3,color:"#a000f0",shape:[[0,1,0],[1,1,1],[0,0,0]]},S:{id:4,color:"#00f000",shape:[[0,1,1],[1,1,0],[0,0,0]]},Z:{id:5,color:"#f00000",shape:[[1,1,0],[0,1,1],[0,0,0]]},J:{id:6,color:"#0000f0",shape:[[1,0,0],[1,1,1],[0,0,0]]},L:{id:7,color:"#f0a000",shape:[[0,0,1],[1,1,1],[0,0,0]]}},j=["#111","#00f0f0","#f0f000","#a000f0","#00f000","#f00000","#0000f0","#f0a000"],G=[800,720,630,550,470,380,300,220,130,100];function C(){const t=["I","O","T","S","Z","J","L"];for(let n=t.length-1;n>0;n--){const e=Math.floor(Math.random()*(n+1));[t[n],t[e]]=[t[e],t[n]]}return t}function Z(){return Array.from({length:S},()=>new Array(b).fill(0))}function T(t){const n=w[t];return{id:n.id,color:n.color,shape:n.shape.map(e=>[...e]),x:Math.floor((b-n.shape[0].length)/2),y:0}}function z(){let t=C(),n=C();const e=T(t.shift()),o=T(t.length?t[0]:n[0]);return{board:Z(),current:e,next:o,held:null,holdUsed:!1,bag:t,nextBag:n,score:0,level:0,lines:0,alive:!0,startTime:Date.now()}}function K(t){let{bag:n,nextBag:e}=t;n.length||(n=e,e=C());const o=n.shift();return n.length||(n=e,e=C()),{piece:T(o),bag:n,nextBag:e,nextPieceKey:n[0]??e[0]}}function J(t){const n=t.length,e=t.map(o=>[...o]);for(let o=0;o<n;o++)for(let r=0;r<o;r++)[e[o][r],e[r][o]]=[e[r][o],e[o][r]];return e.forEach(o=>o.reverse()),e}function g(t,n,e,o){for(let r=0;r<n.length;r++)for(let a=0;a<n[r].length;a++){if(!n[r][a])continue;const l=e+a,i=o+r;if(l<0||l>=b||i>=S||i>=0&&t[i][l])return!0}return!1}const X=[[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1]];function _(t,n){if(!t.alive)return t;let{current:e,board:o}=t;switch(n){case"moveLeft":if(!g(o,e.shape,e.x-1,e.y))return{...t,current:{...e,x:e.x-1}};break;case"moveRight":if(!g(o,e.shape,e.x+1,e.y))return{...t,current:{...e,x:e.x+1}};break;case"softDrop":return g(o,e.shape,e.x,e.y+1)?P(t):{...t,current:{...e,y:e.y+1},score:t.score+1};case"hardDrop":{let r=0;for(;!g(o,e.shape,e.x,e.y+r+1);)r++;return P({...t,current:{...e,y:e.y+r},score:t.score+r*2})}case"rotate":{const r=J(e.shape);for(const[a,l]of X)if(!g(o,r,e.x+a,e.y+l))return{...t,current:{...e,shape:r,x:e.x+a,y:e.y+l}};break}case"hold":{if(t.holdUsed)break;const r=t.held,a={id:e.id,color:e.color,shape:w[Object.keys(w).find(i=>w[i].id===e.id)].shape.map(i=>[...i])},l=r?T(Object.keys(w).find(i=>w[i].id===r.id)):K(t).piece;return g(o,l.shape,l.x,l.y)?{...t,alive:!1}:{...t,current:l,held:a,holdUsed:!0}}}return t}function P(t){const{current:n,board:e}=t,o=e.map(c=>[...c]);for(let c=0;c<n.shape.length;c++)for(let v=0;v<n.shape[c].length;v++)n.shape[c][v]&&n.y+c>=0&&(o[n.y+c][n.x+v]=n.id);const a=o.filter(c=>c.every(v=>v!==0)).length,l=o.filter(c=>c.some(v=>v===0)),d=[...Array.from({length:a},()=>new Array(b).fill(0)),...l],m=[0,100,300,500,800],f=t.lines+a,y=Math.floor(f/10),s=t.score+m[a]*(t.level+1),{piece:h,bag:p,nextBag:L}=K({...t,bag:[...t.bag],nextBag:[...t.nextBag]});return g(d,h.shape,h.x,h.y)?{...t,board:d,score:s,lines:f,level:y,alive:!1}:{...t,board:d,current:h,bag:p,nextBag:L,holdUsed:!1,score:s,lines:f,level:y}}function $(t){let n=0;for(;!g(t.board,t.current.shape,t.current.x,t.current.y+n+1);)n++;return t.current.y+n}function Q(t){return G[Math.min(t,9)]}const u=30,U=b*u,F=S*u;function M(t,n){const e=t.getContext("2d");e.clearRect(0,0,t.width,t.height),e.fillStyle="#0d0d14",e.fillRect(0,0,t.width,t.height),e.strokeStyle="rgba(255,255,255,0.04)",e.lineWidth=1;for(let r=0;r<=b;r++)e.beginPath(),e.moveTo(r*u,0),e.lineTo(r*u,F),e.stroke();for(let r=0;r<=S;r++)e.beginPath(),e.moveTo(0,r*u),e.lineTo(U,r*u),e.stroke();for(let r=0;r<S;r++)for(let a=0;a<b;a++)n.board[r][a]&&R(e,a,r,j[n.board[r][a]]);const o=$(n);o!==n.current.y&&n.current.shape.forEach((r,a)=>r.forEach((l,i)=>{l&&R(e,n.current.x+i,o+a,n.current.color,.2)})),n.current.shape.forEach((r,a)=>r.forEach((l,i)=>{l&&R(e,n.current.x+i,n.current.y+a,n.current.color)}))}function R(t,n,e,o,r=1){t.globalAlpha=r,t.fillStyle=o,t.fillRect(n*u+1,e*u+1,u-2,u-2),r>.5&&(t.fillStyle="rgba(255,255,255,0.18)",t.fillRect(n*u+1,e*u+1,u-2,5)),t.globalAlpha=1}function N(t,n){if(!t||!n)return;const e=t.getContext("2d"),o=24;e.clearRect(0,0,t.width,t.height),e.fillStyle="#0d0d14",e.fillRect(0,0,t.width,t.height);const r=n.shape,a=Math.floor((t.width/o-r[0].length)/2),l=Math.floor((t.height/o-r.length)/2);r.forEach((i,d)=>i.forEach((m,f)=>{m&&(e.fillStyle=n.color,e.fillRect((a+f)*o+1,(l+d)*o+1,o-2,o-2),e.fillStyle="rgba(255,255,255,0.18)",e.fillRect((a+f)*o+1,(l+d)*o+1,o-2,5))}))}const ee=170,te=50,ne=80,re=50;function oe(t,n,e){let o=null,r=null;const a={ArrowLeft:"moveLeft",ArrowRight:"moveRight",ArrowDown:"softDrop",ArrowUp:"rotate"," ":"hardDrop",z:"rotate",c:"hold",Shift:"hold",a:"moveLeft",d:"moveRight",s:"softDrop",w:"rotate"},l=new Set(["ArrowLeft","ArrowRight","a","d"]),i=new Set(["ArrowDown","s"]),d=new Set(["p","P","Escape"]);function m(s,h,p){clearTimeout(r),clearInterval(r),o=s,r=setTimeout(()=>{r=setInterval(()=>e(a[o]),p)},h)}function f(s){var p;if(s.target.tagName==="INPUT"||s.target.tagName==="TEXTAREA"||s.target.closest("dialog[open]")||s.repeat)return;if(d.has(s.key)){s.preventDefault(),(p=t.pause)==null||p.call(t);return}const h=a[s.key];h&&(s.preventDefault(),e(h),l.has(s.key)?m(s.key,ee,te):i.has(s.key)&&m(s.key,ne,re))}function y(s){s.key===o&&(clearTimeout(r),clearInterval(r),o=null)}return document.addEventListener("keydown",f),document.addEventListener("keyup",y),function(){document.removeEventListener("keydown",f),document.removeEventListener("keyup",y),clearTimeout(r),clearInterval(r)}}function ae(t,n){const e=document.createElement("div");return e.className="touch-controls",e.innerHTML=`
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
    </div>`,e.querySelectorAll(".dpad-btn").forEach(o=>{o.addEventListener("touchstart",r=>{r.preventDefault(),n(o.dataset.action)},{passive:!1})}),t.appendChild(e),()=>e.remove()}function le(t){let n=z(),e=null,o=0,r=0,a=!1,l=!1,i=null,d=null;t.innerHTML=`
    <div class="game-page">
      <div class="game-layout">
        <div class="game-area">
          <canvas id="tetris-canvas" width="${U}" height="${F}"></canvas>
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
    </div>`;const m=document.getElementById("tetris-canvas"),f=document.getElementById("next-canvas"),y=document.getElementById("hold-canvas"),s=document.getElementById("tetris-over"),h=document.getElementById("tetris-pause");function p(){l||(a=!a,h.classList.toggle("hidden",!a))}function L(){document.getElementById("score-val").textContent=n.score.toLocaleString("de-DE"),document.getElementById("level-val").textContent=n.level+1,document.getElementById("lines-val").textContent=n.lines,N(f,n.next),N(y,n.held)}function c(E){a||l||(n=_(n,E),M(m,n),L(),n.alive||k())}i=oe({pause:p},()=>n,c),d=ae(t.querySelector(".game-area"),c);function v(E){if(!a&&!l){const x=E-o;r+=x;const I=Q(n.level);if(r>=I&&(r-=I,n=_(n,"softDrop"),!n.alive)){k();return}M(m,n),L()}o=E,e=requestAnimationFrame(v)}async function k(){l=!0,cancelAnimationFrame(e),e=null;const E=Math.max(5,Math.floor((Date.now()-n.startTime)/1e3));s.classList.remove("hidden"),document.getElementById("final-score").textContent=n.score.toLocaleString("de-DE");const x=document.getElementById("save-status");if(await Y()){x.textContent="Score wird gespeichert…";try{await V("tetris",n.score,E),x.textContent="✓ Score gespeichert!",W("tetris"),await O(document.getElementById("leaderboard-area"),"tetris")}catch(A){x.textContent="⚠ "+A.message}}else{const A=document.createElement("span");A.textContent="Zum Speichern bitte ";const D=document.createElement("button");D.className="link-btn",D.textContent="anmelden",D.addEventListener("click",()=>q(()=>import("./auth-modal-SYBlstN3.js"),__vite__mapDeps([0,1,2])).then(H=>H.initAuthModal().open())),x.append(A,D)}}document.getElementById("restart-btn").addEventListener("click",()=>{B(),le(t)}),O(document.getElementById("leaderboard-area"),"tetris"),o=performance.now(),e=requestAnimationFrame(v);function B(){cancelAnimationFrame(e),e=null,i==null||i(),d==null||d()}return B}export{le as mount};
