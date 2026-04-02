const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-modal-CbDLVnIa.js","assets/index-Cuo8J4Js.js","assets/index-IZQovrY2.css"])))=>i.map(i=>d[i]);
import{g as U,_ as H}from"./index-Cuo8J4Js.js";import{r as B,s as q}from"./leaderboard-NlByvmLu.js";const p=10,x=20,y={I:{id:1,color:"#00f0f0",shape:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]]},O:{id:2,color:"#f0f000",shape:[[1,1],[1,1]]},T:{id:3,color:"#a000f0",shape:[[0,1,0],[1,1,1],[0,0,0]]},S:{id:4,color:"#00f000",shape:[[0,1,1],[1,1,0],[0,0,0]]},Z:{id:5,color:"#f00000",shape:[[1,1,0],[0,1,1],[0,0,0]]},J:{id:6,color:"#0000f0",shape:[[1,0,0],[1,1,1],[0,0,0]]},L:{id:7,color:"#f0a000",shape:[[0,0,1],[1,1,1],[0,0,0]]}},F=["#111","#00f0f0","#f0f000","#a000f0","#00f000","#f00000","#0000f0","#f0a000"],V=[800,720,630,550,470,380,300,220,130,100];function C(){const t=["I","O","T","S","Z","J","L"];for(let n=t.length-1;n>0;n--){const e=Math.floor(Math.random()*(n+1));[t[n],t[e]]=[t[e],t[n]]}return t}function W(){return Array.from({length:x},()=>new Array(p).fill(0))}function k(t){const n=y[t];return{id:n.id,color:n.color,shape:n.shape.map(e=>[...e]),x:Math.floor((p-n.shape[0].length)/2),y:0}}function Y(){let t=C(),n=C();const e=k(t.shift()),o=k(t.length?t[0]:n[0]);return{board:W(),current:e,next:o,held:null,holdUsed:!1,bag:t,nextBag:n,score:0,level:0,lines:0,alive:!0,startTime:Date.now()}}function O(t){let{bag:n,nextBag:e}=t;n.length||(n=e,e=C());const o=n.shift();return n.length||(n=e,e=C()),{piece:k(o),bag:n,nextBag:e,nextPieceKey:n[0]??e[0]}}function j(t){const n=t.length,e=t.map(o=>[...o]);for(let o=0;o<n;o++)for(let r=0;r<o;r++)[e[o][r],e[r][o]]=[e[r][o],e[o][r]];return e.forEach(o=>o.reverse()),e}function v(t,n,e,o){for(let r=0;r<n.length;r++)for(let a=0;a<n[r].length;a++){if(!n[r][a])continue;const l=e+a,i=o+r;if(l<0||l>=p||i>=x||i>=0&&t[i][l])return!0}return!1}const G=[[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1]];function R(t,n){if(!t.alive)return t;let{current:e,board:o}=t;switch(n){case"moveLeft":if(!v(o,e.shape,e.x-1,e.y))return{...t,current:{...e,x:e.x-1}};break;case"moveRight":if(!v(o,e.shape,e.x+1,e.y))return{...t,current:{...e,x:e.x+1}};break;case"softDrop":return v(o,e.shape,e.x,e.y+1)?T(t):{...t,current:{...e,y:e.y+1},score:t.score+1};case"hardDrop":{let r=0;for(;!v(o,e.shape,e.x,e.y+r+1);)r++;return T({...t,current:{...e,y:e.y+r},score:t.score+r*2})}case"rotate":{const r=j(e.shape);for(const[a,l]of G)if(!v(o,r,e.x+a,e.y+l))return{...t,current:{...e,shape:r,x:e.x+a,y:e.y+l}};break}case"hold":{if(t.holdUsed)break;const r=t.held,a={id:e.id,color:e.color,shape:y[Object.keys(y).find(i=>y[i].id===e.id)].shape.map(i=>[...i])},l=r?k(Object.keys(y).find(i=>y[i].id===r.id)):O(t).piece;return v(o,l.shape,l.x,l.y)?{...t,alive:!1}:{...t,current:l,held:a,holdUsed:!0}}}return t}function T(t){const{current:n,board:e}=t,o=e.map(c=>[...c]);for(let c=0;c<n.shape.length;c++)for(let s=0;s<n.shape[c].length;s++)n.shape[c][s]&&n.y+c>=0&&(o[n.y+c][n.x+s]=n.id);const a=o.filter(c=>c.every(s=>s!==0)).length,l=o.filter(c=>c.some(s=>s===0)),f=[...Array.from({length:a},()=>new Array(p).fill(0)),...l],d=[0,100,300,500,800],h=t.lines+a,E=Math.floor(h/10),b=t.score+d[a]*(t.level+1),{piece:m,bag:w,nextBag:S}=O({...t,bag:[...t.bag],nextBag:[...t.nextBag]});return v(f,m.shape,m.x,m.y)?{...t,board:f,score:b,lines:h,level:E,alive:!1}:{...t,board:f,current:m,bag:w,nextBag:S,holdUsed:!1,score:b,lines:h,level:E}}function Z(t){let n=0;for(;!v(t.board,t.current.shape,t.current.x,t.current.y+n+1);)n++;return t.current.y+n}function z(t){return V[Math.min(t,9)]}const u=30,P=p*u,N=x*u;function M(t,n){const e=t.getContext("2d");e.clearRect(0,0,t.width,t.height),e.fillStyle="#0d0d14",e.fillRect(0,0,t.width,t.height),e.strokeStyle="rgba(255,255,255,0.04)",e.lineWidth=1;for(let r=0;r<=p;r++)e.beginPath(),e.moveTo(r*u,0),e.lineTo(r*u,N),e.stroke();for(let r=0;r<=x;r++)e.beginPath(),e.moveTo(0,r*u),e.lineTo(P,r*u),e.stroke();for(let r=0;r<x;r++)for(let a=0;a<p;a++)n.board[r][a]&&I(e,a,r,F[n.board[r][a]]);const o=Z(n);o!==n.current.y&&n.current.shape.forEach((r,a)=>r.forEach((l,i)=>{l&&I(e,n.current.x+i,o+a,n.current.color,.2)})),n.current.shape.forEach((r,a)=>r.forEach((l,i)=>{l&&I(e,n.current.x+i,n.current.y+a,n.current.color)}))}function I(t,n,e,o,r=1){t.globalAlpha=r,t.fillStyle=o,t.fillRect(n*u+1,e*u+1,u-2,u-2),r>.5&&(t.fillStyle="rgba(255,255,255,0.18)",t.fillRect(n*u+1,e*u+1,u-2,5)),t.globalAlpha=1}function _(t,n){if(!t||!n)return;const e=t.getContext("2d"),o=24;e.clearRect(0,0,t.width,t.height),e.fillStyle="#0d0d14",e.fillRect(0,0,t.width,t.height);const r=n.shape,a=Math.floor((t.width/o-r[0].length)/2),l=Math.floor((t.height/o-r.length)/2);r.forEach((i,f)=>i.forEach((d,h)=>{d&&(e.fillStyle=n.color,e.fillRect((a+h)*o+1,(l+f)*o+1,o-2,o-2),e.fillStyle="rgba(255,255,255,0.18)",e.fillRect((a+h)*o+1,(l+f)*o+1,o-2,5))}))}const J=170,$=50;function X(t,n,e){let o=null,r=null;const a={ArrowLeft:"moveLeft",ArrowRight:"moveRight",ArrowDown:"softDrop",ArrowUp:"rotate"," ":"hardDrop",z:"rotate",c:"hold",Shift:"hold",a:"moveLeft",d:"moveRight",s:"softDrop",w:"rotate"},l=new Set(["ArrowLeft","ArrowRight","a","d"]);function i(d){if(d.repeat)return;const h=a[d.key];h&&(d.preventDefault(),e(h),l.has(d.key)&&(clearTimeout(r),clearInterval(r),o=d.key,r=setTimeout(()=>{r=setInterval(()=>e(a[o]),$)},J)))}function f(d){d.key===o&&(clearTimeout(r),clearInterval(r),o=null)}return document.addEventListener("keydown",i),document.addEventListener("keyup",f),function(){document.removeEventListener("keydown",i),document.removeEventListener("keyup",f),clearTimeout(r),clearInterval(r)}}function Q(t,n){const e=document.createElement("div");return e.className="touch-controls",e.innerHTML=`
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
    </div>`,e.querySelectorAll(".dpad-btn").forEach(o=>{o.addEventListener("touchstart",r=>{r.preventDefault(),n(o.dataset.action)},{passive:!1})}),t.appendChild(e),()=>e.remove()}function ee(t){let n=Y(),e=null,o=0,r=0,a=!1,l=null,i=null;t.innerHTML=`
    <div class="game-page">
      <div class="game-layout">
        <div class="game-area">
          <canvas id="tetris-canvas" width="${P}" height="${N}"></canvas>
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
    </div>`;const f=document.getElementById("tetris-canvas"),d=document.getElementById("next-canvas"),h=document.getElementById("hold-canvas"),E=document.getElementById("tetris-over");function b(){document.getElementById("score-val").textContent=n.score.toLocaleString("de-DE"),document.getElementById("level-val").textContent=n.level+1,document.getElementById("lines-val").textContent=n.lines,_(d,n.next),_(h,n.held)}function m(s){a||(n=R(n,s),M(f,n),b(),n.alive||S())}l=X({},()=>n,m),i=Q(t.querySelector(".game-area"),m);function w(s){if(!a){const g=s-o;r+=g;const D=z(n.level);if(r>=D&&(r-=D,n=R(n,"softDrop"),!n.alive)){S();return}M(f,n),b()}o=s,e=requestAnimationFrame(w)}async function S(){a=!0,cancelAnimationFrame(e),e=null;const s=Math.max(5,Math.floor((Date.now()-n.startTime)/1e3));E.classList.remove("hidden"),document.getElementById("final-score").textContent=n.score.toLocaleString("de-DE");const g=document.getElementById("save-status");if(await U()){g.textContent="Score wird gespeichert…";try{await q("tetris",n.score,s),g.textContent="✓ Score gespeichert!",await B(document.getElementById("leaderboard-area"),"tetris")}catch(L){g.textContent="⚠ "+L.message}}else{const L=document.createElement("span");L.textContent="Zum Speichern bitte ";const A=document.createElement("button");A.className="link-btn",A.textContent="anmelden",A.addEventListener("click",()=>H(()=>import("./auth-modal-CbDLVnIa.js"),__vite__mapDeps([0,1,2])).then(K=>K.initAuthModal().open())),g.append(L,A)}}document.getElementById("restart-btn").addEventListener("click",()=>{c(),ee(t)}),B(document.getElementById("leaderboard-area"),"tetris"),o=performance.now(),e=requestAnimationFrame(w);function c(){cancelAnimationFrame(e),e=null,l==null||l(),i==null||i()}return c}export{ee as mount};
