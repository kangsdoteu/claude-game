import{a as C,b as E,r as L,c as x}from"./index-B0MAocew.js";let e=null,m=null;function M(){if(e)return{open:k};e=document.getElementById("auth-modal"),e.innerHTML=`
    <div class="modal-box">
      <button class="modal-close" aria-label="Schließen">✕</button>
      <h2 id="auth-modal-title">Anmelden</h2>
      <div class="modal-tabs" role="tablist">
        <button class="tab active" role="tab" data-tab="login">Anmelden</button>
        <button class="tab" role="tab" data-tab="register">Registrieren</button>
      </div>
      <form id="auth-form" novalidate>
        <label>E-Mail
          <input type="email" name="email" required autocomplete="email" />
        </label>
        <label id="name-label" class="hidden">Anzeigename
          <input type="text" name="displayName" minlength="3" maxlength="30"
                 pattern="[A-Za-z0-9_\\-]{3,30}"
                 title="3–30 Zeichen, nur Buchstaben, Zahlen, _ und -"
                 placeholder="3-30 Zeichen, Buchstaben/Zahlen/_/-"
                 autocomplete="username" />
        </label>
        <label id="password-label">Passwort
          <input type="password" name="password" required minlength="6"
                 autocomplete="current-password" />
        </label>
        <div id="auth-msg" role="alert" class="auth-msg" hidden></div>
        <div id="resend-hint" hidden>
          <button type="button" id="resend-btn" class="link-btn">Bestätigungsmail erneut senden</button>
          <span id="resend-status" class="auth-msg" hidden></span>
        </div>
        <button type="submit" class="btn-primary">Anmelden</button>
        <button type="button" class="link-btn auth-forgot" data-tab="forgot">Passwort vergessen?</button>
        <button type="button" class="link-btn auth-back" hidden>Zurück zum Login</button>
      </form>
    </div>`;let g="login";const y=e.querySelector("#resend-hint"),i=e.querySelector("#resend-btn"),s=e.querySelector("#resend-status");function q(){y.hidden=!1}function w(){y.hidden=!0,s.hidden=!0,s.textContent="",v()}function v(){m!==null&&(clearTimeout(m),m=null),i.disabled=!1}function p(t){g=t;const l=e.querySelector("#auth-modal-title"),n=e.querySelectorAll(".tab"),u=e.querySelector("#name-label"),f=u.querySelector("input"),a=e.querySelector("#password-label"),o=a.querySelector("input"),d=e.querySelector("[type=submit]"),r=e.querySelector(".auth-forgot"),c=e.querySelector(".auth-back");n.forEach(b=>b.classList.toggle("active",b.dataset.tab===t)),t==="login"?(l.textContent="Anmelden",d.textContent="Anmelden",d.disabled=!1,u.classList.add("hidden"),f.removeAttribute("required"),a.classList.remove("hidden"),o.required=!0,o.setAttribute("autocomplete","current-password"),r.hidden=!1,c.hidden=!0):t==="register"?(l.textContent="Registrieren",d.textContent="Registrieren",d.disabled=!1,u.classList.remove("hidden"),f.required=!0,a.classList.remove("hidden"),o.required=!0,o.setAttribute("autocomplete","new-password"),r.hidden=!0,c.hidden=!0):t==="forgot"&&(l.textContent="Passwort zurücksetzen",d.textContent="Reset-Link senden",d.disabled=!1,u.classList.add("hidden"),f.removeAttribute("required"),a.classList.add("hidden"),o.required=!1,o.setAttribute("autocomplete","new-password"),r.hidden=!0,c.hidden=!1),w(),S()}e.querySelectorAll(".tab").forEach(t=>{t.addEventListener("click",()=>p(t.dataset.tab))}),e.querySelector(".auth-forgot").addEventListener("click",()=>p("forgot")),e.querySelector(".auth-back").addEventListener("click",()=>p("login")),e.querySelector(".modal-close").addEventListener("click",()=>e.close()),e.addEventListener("click",t=>{t.target===e&&e.close()}),e.addEventListener("close",()=>{p("login"),e.querySelector('input[name="password"]').value="",e.querySelector('input[name="displayName"]').value="",v(),w()}),e.querySelector("#auth-form").addEventListener("submit",async t=>{var d;t.preventDefault();const l=new FormData(t.target),n=l.get("email").trim(),u=l.get("password"),f=(d=l.get("displayName"))==null?void 0:d.trim(),a=t.target.querySelector("[type=submit]");a.disabled=!0,a.textContent="Laden…",S();let o=!1;try{if(g==="login")await C(n,u),e.close();else if(g==="register"){const r=await E(n,u,f||n.split("@")[0]);if(r.status==="signed_in")h("Erfolgreich registriert! Du bist jetzt eingeloggt.","success"),setTimeout(()=>e.close(),1500);else if(r.status==="verification_required"){h("Registrierung gestartet. Bitte bestätige den Link in der E-Mail.","success"),a.textContent="Wartet auf Bestätigung";const c=n;q(),e.querySelector('input[name="password"]').value="",o=!0,i.onclick=async()=>{i.disabled=!0,s.hidden=!1,s.className="auth-msg",s.textContent="Sende…";try{await L(c),s.textContent="E-Mail wurde erneut gesendet.",s.className="auth-msg success"}catch(b){s.textContent=b.message,s.className="auth-msg error",i.disabled=!1;return}m=setTimeout(()=>{m=null,i.disabled=!1},3e4)}}else h("Falls diese E-Mail noch nicht registriert ist, haben wir einen Bestätigungslink geschickt.","success")}else if(g==="forgot"){await x(n),h("Falls die Adresse existiert, wurde ein Reset-Link gesendet.","success"),t.target.querySelector("[name=email]").value="",a.disabled=!1,a.textContent="Reset-Link senden";return}}catch(r){if(h(r.message,"error"),r.code==="email_not_confirmed"){const c=n;q(),i.onclick=async()=>{i.disabled=!0,s.hidden=!1,s.className="auth-msg",s.textContent="Sende…";try{await L(c),s.textContent="E-Mail wurde erneut gesendet.",s.className="auth-msg success"}catch(b){s.textContent=b.message,s.className="auth-msg error",i.disabled=!1;return}m=setTimeout(()=>{m=null,i.disabled=!1},3e4)}}}finally{if(!o){a.disabled=!1;const r={login:"Anmelden",register:"Registrieren",forgot:"Reset-Link senden"};a.textContent=r[g]}}});function h(t,l){const n=e.querySelector("#auth-msg");n.textContent=t,n.className="auth-msg "+l,n.hidden=!1}function S(){const t=e.querySelector("#auth-msg");t.hidden=!0}function k(){e.showModal(),requestAnimationFrame(()=>{e.querySelector('input[name="email"]').focus()})}return{open:k}}export{M as initAuthModal};
