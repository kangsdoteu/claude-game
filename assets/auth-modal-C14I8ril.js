import{a as f,b as y,r as q}from"./index-CCnNP8hE.js";let e=null;function w(){if(e)return{open:h};e=document.getElementById("auth-modal"),e.innerHTML=`
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
        <button type="submit" class="btn-primary">Anmelden</button>
        <button type="button" class="link-btn auth-forgot" data-tab="forgot">Passwort vergessen?</button>
        <button type="button" class="link-btn auth-back" hidden>Zurück zum Login</button>
      </form>
    </div>`;let i="login";function u(t){i=t;const s=e.querySelector("#auth-modal-title"),n=e.querySelectorAll(".tab"),o=e.querySelector("#name-label"),d=o.querySelector("input"),a=e.querySelector("#password-label"),r=a.querySelector("input"),l=e.querySelector("[type=submit]"),m=e.querySelector(".auth-forgot"),b=e.querySelector(".auth-back");n.forEach(p=>p.classList.toggle("active",p.dataset.tab===t)),t==="login"?(s.textContent="Anmelden",l.textContent="Anmelden",o.classList.add("hidden"),d.removeAttribute("required"),a.classList.remove("hidden"),r.required=!0,r.setAttribute("autocomplete","current-password"),m.hidden=!1,b.hidden=!0):t==="register"?(s.textContent="Registrieren",l.textContent="Registrieren",o.classList.remove("hidden"),d.required=!0,a.classList.remove("hidden"),r.required=!0,r.setAttribute("autocomplete","new-password"),m.hidden=!0,b.hidden=!0):t==="forgot"&&(s.textContent="Passwort zurücksetzen",l.textContent="Reset-Link senden",o.classList.add("hidden"),d.removeAttribute("required"),a.classList.add("hidden"),r.required=!1,r.setAttribute("autocomplete","new-password"),m.hidden=!0,b.hidden=!1),g()}e.querySelectorAll(".tab").forEach(t=>{t.addEventListener("click",()=>u(t.dataset.tab))}),e.querySelector(".auth-forgot").addEventListener("click",()=>u("forgot")),e.querySelector(".auth-back").addEventListener("click",()=>u("login")),e.querySelector(".modal-close").addEventListener("click",()=>e.close()),e.addEventListener("click",t=>{t.target===e&&e.close()}),e.addEventListener("close",()=>{u("login"),e.querySelector('input[name="password"]').value="",e.querySelector('input[name="displayName"]').value=""}),e.querySelector("#auth-form").addEventListener("submit",async t=>{var r;t.preventDefault();const s=new FormData(t.target),n=s.get("email").trim(),o=s.get("password"),d=(r=s.get("displayName"))==null?void 0:r.trim(),a=t.target.querySelector("[type=submit]");a.disabled=!0,a.textContent="Laden…",g();try{if(i==="login")await f(n,o),e.close();else if(i==="register")await y(n,o,d||n.split("@")[0]),c("Erfolgreich registriert! Du bist jetzt eingeloggt.","success"),setTimeout(()=>e.close(),1500);else if(i==="forgot"){await q(n),c("Falls die Adresse existiert, wurde ein Reset-Link gesendet.","success"),t.target.querySelector("[name=email]").value="",a.disabled=!1,a.textContent="Reset-Link senden";return}}catch(l){c(l.message,"error")}finally{a.disabled=!1;const l={login:"Anmelden",register:"Registrieren",forgot:"Reset-Link senden"};a.textContent=l[i]}});function c(t,s){const n=e.querySelector("#auth-msg");n.textContent=t,n.className="auth-msg "+s,n.hidden=!1}function g(){const t=e.querySelector("#auth-msg");t.hidden=!0}function h(){e.showModal(),requestAnimationFrame(()=>{e.querySelector('input[name="email"]').focus()})}return{open:h}}export{w as initAuthModal};
