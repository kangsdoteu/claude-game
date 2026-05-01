import { signIn, signUp, resetPassword, resendSignupConfirmation } from '../api/auth.js';

let modal = null;

// Module-local timer handle — cleared on modal close so no leak on reopen
let resendCooldownTimer = null;

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
        <div id="resend-hint" hidden>
          <button type="button" id="resend-btn" class="link-btn">Bestätigungsmail erneut senden</button>
          <span id="resend-status" class="auth-msg" hidden></span>
        </div>
        <button type="submit" class="btn-primary">Anmelden</button>
        <button type="button" class="link-btn auth-forgot" data-tab="forgot">Passwort vergessen?</button>
        <button type="button" class="link-btn auth-back" hidden>Zurück zum Login</button>
      </form>
    </div>`;

  let mode = 'login';

  const resendHint   = modal.querySelector('#resend-hint');
  const resendBtn    = modal.querySelector('#resend-btn');
  const resendStatus = modal.querySelector('#resend-status');

  function showResend() {
    resendHint.hidden = false;
  }

  function hideResend() {
    resendHint.hidden = true;
    resendStatus.hidden = true;
    resendStatus.textContent = '';
    clearResendCooldown();
  }

  function clearResendCooldown() {
    if (resendCooldownTimer !== null) {
      clearTimeout(resendCooldownTimer);
      resendCooldownTimer = null;
    }
    resendBtn.disabled = false;
  }

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
      submitBtn.disabled = false;
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
      submitBtn.disabled = false;
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
      submitBtn.disabled = false;
      nameLabel.classList.add('hidden');
      nameInput.removeAttribute('required');
      passwordLabel.classList.add('hidden');
      passwordInput.required = false;
      passwordInput.setAttribute('autocomplete', 'new-password');
      forgotLink.hidden = true;
      backLink.hidden = false;
    }

    hideResend();
    clearMsg();
  }

  modal.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => setMode(tab.dataset.tab));
  });

  modal.querySelector('.auth-forgot').addEventListener('click', () => setMode('forgot'));
  modal.querySelector('.auth-back').addEventListener('click', () => setMode('login'));

  modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

  // Reset to login mode and clear sensitive fields whenever the dialog is closed.
  // Prevents a previous user's password from being visible when the modal is reopened
  // on a shared device. Email is intentionally kept for UX (accidental close recovery).
  modal.addEventListener('close', () => {
    setMode('login');
    modal.querySelector('input[name="password"]').value = '';
    modal.querySelector('input[name="displayName"]').value = '';
    clearResendCooldown();
    hideResend();
  });

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

    // Controls whether the finally-block restores the submit button
    let keepBtnDisabled = false;

    try {
      if (mode === 'login') {
        await signIn(email, password);
        modal.close();
      } else if (mode === 'register') {
        const result = await signUp(email, password, name || email.split('@')[0]);

        if (result.status === 'signed_in') {
          showMsg('Erfolgreich registriert! Du bist jetzt eingeloggt.', 'success');
          setTimeout(() => modal.close(), 1500);
        } else if (result.status === 'verification_required') {
          showMsg('Registrierung gestartet. Bitte bestätige den Link in der E-Mail.', 'success');
          btn.textContent = 'Wartet auf Bestätigung';
          // Store email in closure for resend handler, not read from live input
          const confirmedEmail = email;
          showResend();
          modal.querySelector('input[name="password"]').value = '';
          keepBtnDisabled = true;

          resendBtn.onclick = async () => {
            resendBtn.disabled = true;
            resendStatus.hidden = false;
            resendStatus.className = 'auth-msg';
            resendStatus.textContent = 'Sende…';
            try {
              await resendSignupConfirmation(confirmedEmail);
              resendStatus.textContent = 'E-Mail wurde erneut gesendet.';
              resendStatus.className = 'auth-msg success';
            } catch (resendErr) {
              resendStatus.textContent = resendErr.message;
              resendStatus.className = 'auth-msg error';
              resendBtn.disabled = false;
              return;
            }
            // 30-second cooldown after a successful resend
            resendCooldownTimer = setTimeout(() => {
              resendCooldownTimer = null;
              resendBtn.disabled = false;
            }, 30_000);
          };
        } else {
          // maybe_existing: neutral message, no resend (anti-enumeration)
          showMsg('Falls diese E-Mail noch nicht registriert ist, haben wir einen Bestätigungslink geschickt.', 'success');
        }
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
      if (err.code === 'email_not_confirmed') {
        const confirmedEmail = email;
        showResend();
        resendBtn.onclick = async () => {
          resendBtn.disabled = true;
          resendStatus.hidden = false;
          resendStatus.className = 'auth-msg';
          resendStatus.textContent = 'Sende…';
          try {
            await resendSignupConfirmation(confirmedEmail);
            resendStatus.textContent = 'E-Mail wurde erneut gesendet.';
            resendStatus.className = 'auth-msg success';
          } catch (resendErr) {
            resendStatus.textContent = resendErr.message;
            resendStatus.className = 'auth-msg error';
            resendBtn.disabled = false;
            return;
          }
          resendCooldownTimer = setTimeout(() => {
            resendCooldownTimer = null;
            resendBtn.disabled = false;
          }, 30_000);
        };
      }
    } finally {
      if (!keepBtnDisabled) {
        btn.disabled = false;
        const labels = { login: 'Anmelden', register: 'Registrieren', forgot: 'Reset-Link senden' };
        btn.textContent = labels[mode];
      }
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
