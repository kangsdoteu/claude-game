import { initNav } from './ui/nav.js';

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

async function init() {
  initNav();
  window.addEventListener('hashchange', router);
  await router();
}

init();
