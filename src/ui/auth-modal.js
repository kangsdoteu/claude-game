import { signIn, signUp, resetPassword } from '../api/auth.js';

let modal = null;

export function initAuthModal() {
  if (modal) return { open: openModal };

  modal = document.getElementById('auth-modal');
  modal.innerHTML = `
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
    </div>`;

  let mode = 'login';

  function setMode(next) {
    mode = next;

    const title        = modal.querySelector('#auth-modal-title');
    const tabs         = modal.querySelectorAll('.tab');
    const nameLabel    = modal.querySelector('#name-label');
    const nameInput    = nameLabel.querySelector('input');
    const passwordLabel = modal.querySelector('#password-label');
    const passwordInput = passwordLabel.querySelector('input');
    const submitBtn    = modal.querySelector('[type=submit]');
    const forgotLink   = modal.querySelector('.auth-forgot');
    const backLink     = modal.querySelector('.auth-back');

    // Tab highlight — forgot is not a visible tab so no tab stays active in that mode
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === next));

    if (next === 'login') {
      title.textContent = 'Anmelden';
      submitBtn.textContent = 'Anmelden';
      nameLabel.classList.add('hidden');
      nameInput.removeAttribute('required');
      passwordLabel.classList.remove('hidden');
      passwordInput.required = true;
      passwordInput.setAttribute('autocomplete', 'current-password');
      forgotLink.hidden = false;
      backLink.hidden = true;
    } else if (next === 'register') {
      title.textContent = 'Registrieren';
      submitBtn.textContent = 'Registrieren';
      nameLabel.classList.remove('hidden');
      nameInput.required = true;
      passwordLabel.classList.remove('hidden');
      passwordInput.required = true;
      passwordInput.setAttribute('autocomplete', 'new-password');
      forgotLink.hidden = true;
      backLink.hidden = true;
    } else if (next === 'forgot') {
      title.textContent = 'Passwort zurücksetzen';
      submitBtn.textContent = 'Reset-Link senden';
      nameLabel.classList.add('hidden');
      nameInput.removeAttribute('required');
      passwordLabel.classList.add('hidden');
      passwordInput.required = false;
      passwordInput.setAttribute('autocomplete', 'new-password');
      forgotLink.hidden = true;
      backLink.hidden = false;
    }

    clearMsg();
  }

  modal.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => setMode(tab.dataset.tab));
  });

  modal.querySelector('.auth-forgot').addEventListener('click', () => setMode('forgot'));
  modal.querySelector('.auth-back').addEventListener('click', () => setMode('login'));

  modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

  // Reset to login mode whenever the dialog is closed
  modal.addEventListener('close', () => setMode('login'));

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
      } else if (mode === 'register') {
        await signUp(email, password, name || email.split('@')[0]);
        showMsg('Erfolgreich registriert! Du bist jetzt eingeloggt.', 'success');
        setTimeout(() => modal.close(), 1500);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        showMsg('Falls die Adresse existiert, wurde ein Reset-Link gesendet.', 'success');
        e.target.querySelector('[name=email]').value = '';
        // Leave modal open — user can close manually
        btn.disabled = false;
        btn.textContent = 'Reset-Link senden';
        return;
      }
    } catch (err) {
      showMsg(err.message, 'error');
    } finally {
      btn.disabled = false;
      const labels = { login: 'Anmelden', register: 'Registrieren', forgot: 'Reset-Link senden' };
      btn.textContent = labels[mode];
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

  function openModal() {
    modal.showModal();
    // Auto-focus the email field after the dialog is painted — native <dialog> handles focus trap
    requestAnimationFrame(() => {
      modal.querySelector('input[name="email"]').focus();
    });
  }

  return { open: openModal };
}
