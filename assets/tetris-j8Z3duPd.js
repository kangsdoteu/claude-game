const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-modal-CNs0vPjz.js","assets/index-CgoAAGTd.js","assets/index-Lics-Kz6.css"])))=>i.map(i=>d[i]);
import{a as q,_ as V}from"./index-CgoAAGTd.js";import{r as P,s as Z,i as j}from"./leaderboard-B8-5zKqY.js";const E=10,S=20,k={I:{id:1,color:"#00f0f0",shape:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]]},O:{id:2,color:"#f0f000",shape:[[1,1],[1,1]]},T:{id:3,color:"#a000f0",shape:[[0,1,0],[1,1,1],[0,0,0]]},S:{id:4,color:"#00f000",shape:[[0,1,1],[1,1,0],[0,0,0]]},Z:{id:5,color:"#f00000",shape:[[1,1,0],[0,1,1],[0,0,0]]},J:{id:6,color:"#0000f0",shape:[[1,0,0],[1,1,1],[0,0,0]]},L:{id:7,color:"#f0a000",shape:[[0,0,1],[1,1,1],[0,0,0]]}},z=["#111","#00f0f0","#f0f000","#a000f0","#00f000","#f00000","#0000f0","#f0a000"],G=[800,720,630,550,470,380,300,220,130,100];function C(){const t=["I","O","T","S","Z","J","L"];for(let n=t.length-1;n>0;n--){const e=Math.floor(Math.random()*(n+1));[t[n],t[e]]=[t[e],t[n]]}return t}function J(){return Array.from({length:S},()=>new Array(E).fill(0))}function B(t){const n=k[t];return{id:n.id,color:n.color,shape:n.shape.map(e=>[...e]),x:Math.floor((E-n.shape[0].length)/2),y:0}}function X(){let t=C(),n=C();const[e,...o]=t;t=o;const r=B(e),a=T(t,n);return{board:J(),current:r,next:a,held:null,holdUsed:!1,bag:t,nextBag:n,score:0,level:0,lines:0,alive:!0,started:!1,startTime:null}}function T(t,n){return B(t.length?t[0]:n[0])}function U(t){let n=t.bag,e=t.nextBag;n.length||(n=e,e=C());const[o,...r]=n;return n=r,n.length||(n=e,e=C()),{piece:B(o),bag:n,nextBag:e}}function $(t){const n=t.length,e=t.map(o=>[...o]);for(let o=0;o<n;o++)for(let r=0;r<o;r++)[e[o][r],e[r][o]]=[e[r][o],e[o][r]];return e.forEach(o=>o.reverse()),e}function y(t,n,e,o){for(let r=0;r<n.length;r++)for(let a=0;a<n[r].length;a++){if(!n[r][a])continue;const s=e+a,l=o+r;if(s<0||s>=E||l>=S||l>=0&&t[l][s])return!0}return!1}const Q=[[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1]];function M(t,n){if(!t.alive)return t;let{current:e,board:o}=t;switch(n){case"moveLeft":if(!y(o,e.shape,e.x-1,e.y))return{...t,current:{...e,x:e.x-1}};break;case"moveRight":if(!y(o,e.shape,e.x+1,e.y))return{...t,current:{...e,x:e.x+1}};break;case"softDrop":return y(o,e.shape,e.x,e.y+1)?N(t):{...t,current:{...e,y:e.y+1},score:t.score+1};case"hardDrop":{let r=0;for(;!y(o,e.shape,e.x,e.y+r+1);)r++;return N({...t,current:{...e,y:e.y+r},score:t.score+r*2})}case"rotate":{const r=$(e.shape);for(const[a,s]of Q)if(!y(o,r,e.x+a,e.y+s))return{...t,current:{...e,shape:r,x:e.x+a,y:e.y+s}};break}case"hold":{if(t.holdUsed)break;const r=t.held,a={id:e.id,color:e.color,shape:k[Object.keys(k).find(i=>k[i].id===e.id)].shape.map(i=>[...i])};if(r){const i=B(Object.keys(k).find(f=>k[f].id===r.id));return y(o,i.shape,i.x,i.y)?{...t,alive:!1}:{...t,current:i,held:a,holdUsed:!0}}const{piece:s,bag:l,nextBag:c}=U(t);return y(o,s.shape,s.x,s.y)?{...t,alive:!1}:{...t,current:s,next:T(l,c),bag:l,nextBag:c,held:a,holdUsed:!0}}}return t}function N(t){const{current:n,board:e}=t,o=e.map(u=>[...u]);for(let u=0;u<n.shape.length;u++)for(let p=0;p<n.shape[u].length;p++)n.shape[u][p]&&n.y+u>=0&&(o[n.y+u][n.x+p]=n.id);const a=o.filter(u=>u.every(p=>p!==0)).length,s=o.filter(u=>u.some(p=>p===0)),c=[...Array.from({length:a},()=>new Array(E).fill(0)),...s],i=[0,100,300,500,800],f=t.lines+a,x=Math.floor(f/10),d=t.score+i[a]*(t.level+1),{piece:h,bag:b,nextBag:L}=U(t);return y(c,h.shape,h.x,h.y)?{...t,board:c,score:d,lines:f,level:x,alive:!1}:{...t,board:c,current:h,next:T(b,L),bag:b,nextBag:L,holdUsed:!1,score:d,lines:f,level:x}}function ee(t){return t.started?t:{...t,started:!0,startTime:Date.now()}}function te(t){let n=0;for(;!y(t.board,t.current.shape,t.current.x,t.current.y+n+1);)n++;return t.current.y+n}function ne(t){return G[Math.min(t,9)]}const v=30,F=E*v,W=S*v;function K(t,n){const e=t.getContext("2d");e.clearRect(0,0,t.width,t.height),e.fillStyle="#0d0d14",e.fillRect(0,0,t.width,t.height),e.strokeStyle="rgba(255,255,255,0.04)",e.lineWidth=1;for(let r=0;r<=E;r++)e.beginPath(),e.moveTo(r*v,0),e.lineTo(r*v,W),e.stroke();for(let r=0;r<=S;r++)e.beginPath(),e.moveTo(0,r*v),e.lineTo(F,r*v),e.stroke();for(let r=0;r<S;r++)for(let a=0;a<E;a++)n.board[r][a]&&I(e,a,r,z[n.board[r][a]]);const o=te(n);o!==n.current.y&&n.current.shape.forEach((r,a)=>r.forEach((s,l)=>{s&&I(e,n.current.x+l,o+a,n.current.color,.2)})),n.current.shape.forEach((r,a)=>r.forEach((s,l)=>{s&&I(e,n.current.x+l,n.current.y+a,n.current.color)}))}function I(t,n,e,o,r=1){t.globalAlpha=r,t.fillStyle=o,t.fillRect(n*v+1,e*v+1,v-2,v-2),r>.5&&(t.fillStyle="rgba(255,255,255,0.18)",t.fillRect(n*v+1,e*v+1,v-2,5)),t.globalAlpha=1}function H(t,n){if(!t||!n)return;const e=t.getContext("2d"),o=24;e.clearRect(0,0,t.width,t.height),e.fillStyle="#0d0d14",e.fillRect(0,0,t.width,t.height);const r=n.shape,a=Math.floor((t.width/o-r[0].length)/2),s=Math.floor((t.height/o-r.length)/2);r.forEach((l,c)=>l.forEach((i,f)=>{i&&(e.fillStyle=n.color,e.fillRect((a+f)*o+1,(s+c)*o+1,o-2,o-2),e.fillStyle="rgba(255,255,255,0.18)",e.fillRect((a+f)*o+1,(s+c)*o+1,o-2,5))}))}const re=170,oe=50,ae=80,se=50;function de(t,n,e){let o=null,r=null;const a={ArrowLeft:"moveLeft",ArrowRight:"moveRight",ArrowDown:"softDrop",ArrowUp:"rotate"," ":"hardDrop",z:"rotate",c:"hold",Shift:"hold",a:"moveLeft",d:"moveRight",s:"softDrop",w:"rotate"},s=new Set(["ArrowLeft","ArrowRight","a","d"]),l=new Set(["ArrowDown","s"]),c=new Set(["p","P","Escape"]);function i(d,h,b){clearTimeout(r),clearInterval(r),o=d,r=setTimeout(()=>{r=setInterval(()=>e(a[o]),b)},h)}function f(d){var b;if(d.target.tagName==="INPUT"||d.target.tagName==="TEXTAREA"||d.target.closest("dialog[open]")||d.repeat)return;if(c.has(d.key)){d.preventDefault(),(b=t.pause)==null||b.call(t);return}const h=a[d.key];h&&(d.preventDefault(),e(h),s.has(d.key)?i(d.key,re,oe):l.has(d.key)&&i(d.key,ae,se))}function x(d){d.key===o&&(clearTimeout(r),clearInterval(r),o=null)}return document.addEventListener("keydown",f),document.addEventListener("keyup",x),function(){document.removeEventListener("keydown",f),document.removeEventListener("keyup",x),clearTimeout(r),clearInterval(r)}}function le(t,n){const e=document.createElement("div");return e.className="touch-controls",e.innerHTML=`
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
    </div>`,e.querySelectorAll(".dpad-btn").forEach(o=>{o.addEventListener("touchstart",r=>{r.preventDefault(),n(o.dataset.action)},{passive:!1})}),t.appendChild(e),()=>e.remove()}function ie(t){let n=X(),e=null,o=0,r=0,a=!1,s=!1,l=null,c=null;t.innerHTML=`
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
          <canvas id="tetris-canvas" width="${F}" height="${W}"></canvas>
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
            <div class="stat-box controls-help">
              <div class="stat-label">Steuerung</div>
              <dl class="controls-list">
                <dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Bewegen</dd>
                <dt><kbd>↓</kbd> <kbd>S</kbd></dt><dd>Soft-Drop</dd>
                <dt><kbd>Leertaste</kbd></dt><dd>Hard-Drop</dd>
                <dt><kbd>↑</kbd> <kbd>Z</kbd> <kbd>W</kbd></dt><dd>Drehen</dd>
                <dt><kbd>C</kbd> <kbd>Shift</kbd></dt><dd>Hold</dd>
                <dt><kbd>P</kbd> <kbd>Esc</kbd></dt><dd>Pause</dd>
              </dl>
            </div>
          </div>
          <div id="leaderboard-area"></div>
        </aside>
      </div>
    </div>`;const i=document.getElementById("tetris-canvas"),f=document.getElementById("next-canvas"),x=document.getElementById("hold-canvas"),d=document.getElementById("tetris-over"),h=document.getElementById("tetris-start"),b=document.getElementById("tetris-pause");function L(){s||(a=!a,b.classList.toggle("hidden",!a))}function u(){const m=n.score.toLocaleString("de-DE"),g=n.level+1,w=n.lines;document.getElementById("score-val").textContent=m,document.getElementById("level-val").textContent=g,document.getElementById("lines-val").textContent=w,document.getElementById("score-val-strip").textContent=m,document.getElementById("level-val-strip").textContent=g,document.getElementById("lines-val-strip").textContent=w,H(f,n.next),H(x,n.held)}function p(m){a||s||m==="hold"&&!n.started||(n.started||(n=ee(n),h.classList.add("hidden")),n=M(n,m),K(i,n),u(),n.alive||O())}l=de({pause:L},()=>n,p),c=le(t.querySelector(".game-page"),p);function R(m){if(!a&&!s){const g=m-o;if(n.started){r+=g;const w=ne(n.level);if(r>=w&&(r-=w,n=M(n,"softDrop"),!n.alive)){O();return}}K(i,n),u()}o=m,e=requestAnimationFrame(R)}async function O(){s=!0,cancelAnimationFrame(e),e=null;const m=Math.max(5,Math.floor((Date.now()-(n.startTime??Date.now()))/1e3));d.classList.remove("hidden"),document.getElementById("final-score").textContent=n.score.toLocaleString("de-DE");const g=document.getElementById("save-status");if(await q()){g.textContent="Score wird gespeichert…";try{await Z("tetris",n.score,m),g.textContent="✓ Score gespeichert!",j("tetris"),await P(document.getElementById("leaderboard-area"),"tetris")}catch(A){g.textContent="⚠ "+A.message}}else{const A=document.createElement("span");A.textContent="Zum Speichern bitte ";const D=document.createElement("button");D.className="link-btn",D.textContent="anmelden",D.addEventListener("click",()=>V(()=>import("./auth-modal-CNs0vPjz.js"),__vite__mapDeps([0,1,2])).then(Y=>Y.initAuthModal().open())),g.append(A,D)}}document.getElementById("restart-btn").addEventListener("click",()=>{_(),ie(t)}),P(document.getElementById("leaderboard-area"),"tetris"),o=performance.now(),e=requestAnimationFrame(R);function _(){cancelAnimationFrame(e),e=null,l==null||l(),c==null||c()}return _}export{ie as mount};
