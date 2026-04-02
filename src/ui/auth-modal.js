import { signIn, signUp } from '../api/auth.js';

let modal = null;

export function initAuthModal() {
  if (modal) return { open: () => modal.showModal() };

  modal = document.getElementById('auth-modal');
  modal.innerHTML = `
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
    </div>`;

  let mode = 'login';

  modal.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      mode = tab.dataset.tab;
      modal.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      modal.querySelector('[type=submit]').textContent = mode === 'login' ? 'Anmelden' : 'Registrieren';
      modal.querySelector('#name-label').classList.toggle('hidden', mode === 'login');
      clearMsg();
    });
  });

  modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

  modal.querySelector('#auth-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email    = fd.get('email').trim();
    const password = fd.get('password');
    const name     = fd.get('displayName')?.trim();
    const btn      = e.target.querySelector('[type=submit]');

    btn.disabled = true;
    btn.textContent = 'Laden…';
    clearMsg();

    try {
      if (mode === 'login') {
        await signIn(email, password);
        modal.close();
      } else {
        await signUp(email, password, name || email.split('@')[0]);
        showMsg('Erfolgreich registriert! Du bist jetzt eingeloggt.', 'success');
        setTimeout(() => modal.close(), 1500);
      }
    } catch (err) {
      showMsg(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = mode === 'login' ? 'Anmelden' : 'Registrieren';
    }
  });

  function showMsg(text, type) {
    const el = modal.querySelector('#auth-msg');
    el.textContent = text;
    el.className = 'auth-msg ' + type;
    el.hidden = false;
  }
  function clearMsg() {
    const el = modal.querySelector('#auth-msg');
    el.hidden = true;
  }

  return { open: () => modal.showModal() };
}
