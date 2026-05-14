import { signOut, onAuthChange } from '../api/auth.js';
import { supabase } from '../api/supabase.js';
import { getRouteAvailability } from './game-availability.js';

let unsubscribe = null;

export function initNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = `
    <div class="nav-brand"><a href="#/">🎮 GameHub</a></div>
    <div class="nav-links">
      <a href="#/tetris" data-route="tetris">Tetris</a>
      <a href="#/snake" data-route="snake">Snake</a>
      <a href="#/dinos" data-route="dinos">Dino-Evo</a>
    </div>
    <div class="nav-auth" id="nav-auth"></div>`;

  function renderAuthArea(session) {
    const area = document.getElementById('nav-auth');
    if (!area) return;
    if (session?.user) {
      const name = session.user.user_metadata?.display_name ?? session.user.email.split('@')[0];
      area.innerHTML = `<span class="nav-user">👤 <strong></strong></span><button id="nav-logout" class="btn-ghost">Abmelden</button>`;
      area.querySelector('strong').textContent = name;
      area.querySelector('#nav-logout').addEventListener('click', signOut);
    } else {
      area.innerHTML = `<button id="nav-login" class="btn-primary">Anmelden</button>`;
      area.querySelector('#nav-login').addEventListener('click', () => {
        import('./auth-modal.js').then(m => m.initAuthModal().open());
      });
    }
  }

  if (unsubscribe) unsubscribe();
  unsubscribe = onAuthChange(session => renderAuthArea(session));

  // Initial render from current session
  supabase.auth.getSession().then(({ data }) => renderAuthArea(data.session));

  refreshNavLinkAvailability();
}

// Re-evaluates the disabled state of each game nav link against the current
// game_settings cache. Safe to call repeatedly — exported so the admin Games
// tab can refresh the nav after a toggle without a page reload.
export function refreshNavLinkAvailability() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const links = nav.querySelectorAll('.nav-links a[data-route]');
  links.forEach(link => {
    const route = link.dataset.route;
    (async () => {
      const avail = await getRouteAvailability(route);
      if (avail.enabled) {
        link.classList.remove('nav-link--disabled');
        link.removeAttribute('title');
      } else {
        link.classList.add('nav-link--disabled');
        if (avail.disabled_message) link.title = avail.disabled_message;
        else link.removeAttribute('title');
      }
    })();
  });
}
