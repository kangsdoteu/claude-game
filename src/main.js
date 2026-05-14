import { initNav } from './ui/nav.js';
import { isSupabaseConfigured } from './api/supabase.js';
import { getRouteAvailability } from './ui/game-availability.js';
import { renderDisabledPage } from './ui/disabled-page.js';
import { initMaintenanceBanner } from './ui/maintenance-banner.js';
import { initFooter } from './ui/footer.js';

const app = document.getElementById('app');
let currentDestroy = null;

const routes = {
  '':            () => import('./pages/home.js'),
  'tetris':      () => import('./pages/tetris.js'),
  'snake':       () => import('./pages/snake.js'),
  'dinos':       () => import('./pages/dinos.js'),
  'admin':       () => import('./pages/admin/index.js'),
  'datenschutz': () => import('./pages/datenschutz.js'),
};

const GAME_ROUTES = new Set(['tetris', 'snake', 'dinos']);

// Serialize router() so two rapid hashchanges can't run in parallel and
// race on `currentDestroy` / `app.innerHTML`. Each call queues onto the
// previous; the hash-token bail then ensures only the latest navigation
// actually mounts.
let routerQueue = Promise.resolve();
function router() {
  routerQueue = routerQueue.then(_router, _router);
  return routerQueue;
}

async function _router() {
  const hash = location.hash.replace('#/', '').split('?')[0] || '';
  const loader = routes[hash] ?? routes[''];

  // Destroy previous page: stops game loops, removes event listeners
  if (currentDestroy) {
    currentDestroy();
    currentDestroy = null;
  }
  app.innerHTML = '';

  // Race-Schutz: bei Hash-Wechsel während eines awaits brechen wir ab
  // und überlassen dem nächsten router()-Lauf das Rendering.
  const routerHash = location.hash;

  if (GAME_ROUTES.has(hash)) {
    const avail = await getRouteAvailability(hash);
    if (location.hash !== routerHash) return;
    if (avail && !avail.enabled) {
      currentDestroy = renderDisabledPage(app, hash, avail.disabled_message);
      return;
    }
  }

  const mod = await loader();
  if (location.hash !== routerHash) return;
  currentDestroy = mod.mount(app);
}

function renderConfigBanner() {
  const section = document.createElement('section');
  section.className = 'config-error';

  const heading = document.createElement('h1');
  heading.textContent = 'Konfiguration fehlt';

  const body = document.createElement('p');
  body.textContent =
    'Die Supabase-Zugangsdaten sind nicht gesetzt. Bitte `.env` aus `.env.example` anlegen und mit den eigenen Credentials befüllen. Details in der README.';

  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.textContent = 'VITE_SUPABASE_URL=...\nVITE_SUPABASE_ANON_KEY=...';
  pre.appendChild(code);

  section.appendChild(heading);
  section.appendChild(body);
  section.appendChild(pre);
  app.appendChild(section);
}

async function init() {
  if (!isSupabaseConfigured) {
    renderConfigBanner();
    return;
  }

  initNav();
  initMaintenanceBanner(document.body);
  initFooter(document.body);
  window.addEventListener('hashchange', router);
  await router();
}

init();
