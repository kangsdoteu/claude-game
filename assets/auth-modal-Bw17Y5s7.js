import{a as u,b as g}from"./index-B5DMQJ9B.js";let e=null;function h(){if(e)return{open:()=>e.showModal()};e=document.getElementById("auth-modal"),e.innerHTML=`
    <div class="modal-box">
      <button class="modal-close" aria-label="Schließen">✕</button>
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
                 placeholder="3-30 Zeichen, Buchstaben/Zahlen/_/-"
                 autocomplete="username" />
        </label>
        <label>Passwort
          <input type="password" name="password" required minlength="6"
                 autocomplete="current-password" />
        </label>
        <div id="auth-msg" role="alert" class="auth-msg" hidden></div>
        <button type="submit" class="btn-primary">Anmelden</button>
      </form>
    </div>`;let n="login";e.querySelectorAll(".tab").forEach(t=>{t.addEventListener("click",()=>{n=t.dataset.tab,e.querySelectorAll(".tab").forEach(a=>a.classList.toggle("active",a===t)),e.querySelector("[type=submit]").textContent=n==="login"?"Anmelden":"Registrieren",e.querySelector("#name-label").classList.toggle("hidden",n==="login"),i()})}),e.querySelector(".modal-close").addEventListener("click",()=>e.close()),e.addEventListener("click",t=>{t.target===e&&e.close()}),e.querySelector("#auth-form").addEventListener("submit",async t=>{var d;t.preventDefault();const a=new FormData(t.target),l=a.get("email").trim(),r=a.get("password"),c=(d=a.get("displayName"))==null?void 0:d.trim(),s=t.target.querySelector("[type=submit]");s.disabled=!0,s.textContent="Laden…",i();try{n==="login"?(await u(l,r),e.close()):(await g(l,r,c||l.split("@")[0]),o("Erfolgreich registriert! Du bist jetzt eingeloggt.","success"),setTimeout(()=>e.close(),1500))}catch(m){o(m.message,"error")}finally{s.disabled=!1,s.textContent=n==="login"?"Anmelden":"Registrieren"}});function o(t,a){const l=e.querySelector("#auth-msg");l.textContent=t,l.className="auth-msg "+a,l.hidden=!1}function i(){const t=e.querySelector("#auth-msg");t.hidden=!0}return{open:()=>e.showModal()}}export{h as initAuthModal};
