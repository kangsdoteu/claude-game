import { initNav } from './ui/nav.js';
import { isSupabaseConfigured } from './api/supabase.js';

const app = document.getElementById('app');
let currentDestroy = null;

const routes = {
  '':       () => import('./pages/home.js'),
  'tetris': () => import('./pages/tetris.js'),
  'snake':  () => import('./pages/snake.js'),
};

async function router() {
  const hash = location.hash.replace('#/', '').split('?')[0] || '';
  const loader = routes[hash] ?? routes[''];

  // Destroy previous page: stops game loops, removes event listeners
  if (currentDestroy) {
    currentDestroy();
    currentDestroy = null;
  }
  app.innerHTML = '';

  const mod = await loader();
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
  window.addEventListener('hashchange', router);
  await router();
}

init();
