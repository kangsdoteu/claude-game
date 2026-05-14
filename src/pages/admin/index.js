import { ensureAdmin } from './auth-gate.js';

const TABS = [
  { name: 'users',         label: 'Nutzer' },
  { name: 'games',         label: 'Spiele' },
  { name: 'stats',         label: 'Statistiken' },
  { name: 'moderation',    label: 'Moderation' },
  { name: 'audit',         label: 'Audit-Log' },
  { name: 'announcements', label: 'Banner' },
];

export function mount(container) {
  let active = true;
  let currentTabName = null;
  let currentTabDestroy = null;
  const tabBtnListeners = [];

  (async () => {
    const user = await ensureAdmin();
    if (!active || !user) return;

    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'admin';

    // Header
    const header = document.createElement('header');
    header.className = 'admin-header';

    const h1 = document.createElement('h1');
    h1.textContent = 'Admin-Bereich';

    const small = document.createElement('small');
    small.className = 'admin-user';
    small.textContent = 'Angemeldet als ';
    const emailSpan = document.createElement('span');
    emailSpan.textContent = user.email;
    small.appendChild(emailSpan);

    header.append(h1, small);

    // Tab bar
    const nav = document.createElement('nav');
    nav.className = 'admin-tabs';
    nav.setAttribute('role', 'tablist');

    // Tab content area
    const content = document.createElement('div');
    content.className = 'admin-tab-content';
    content.id = 'admin-tab-content';

    async function switchTab(name) {
      if (name === currentTabName) return;

      if (currentTabDestroy) {
        currentTabDestroy();
        currentTabDestroy = null;
      }
      content.innerHTML = '';
      currentTabName = name;

      // Update active button state
      nav.querySelectorAll('.admin-tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === name;
        btn.classList.toggle('active', isActive);
        if (isActive) {
          btn.setAttribute('aria-current', 'page');
        } else {
          btn.removeAttribute('aria-current');
        }
      });

      if (!active) return;

      const imports = {
        users:         () => import('./users.js'),
        games:         () => import('./games.js'),
        stats:         () => import('./stats.js'),
        moderation:    () => import('./moderation.js'),
        audit:         () => import('./audit.js'),
        announcements: () => import('./announcements.js'),
      };
      const mod = await imports[name]();
      if (!active) return;
      currentTabDestroy = mod.mount(content);
    }

    TABS.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'admin-tab-btn';
      btn.dataset.tab = tab.name;
      btn.textContent = tab.label;
      btn.type = 'button';

      const handler = () => switchTab(tab.name);
      btn.addEventListener('click', handler);
      tabBtnListeners.push({ btn, handler });

      nav.appendChild(btn);
    });

    wrapper.append(header, nav, content);
    container.appendChild(wrapper);

    // Mount default tab
    await switchTab('users');
  })();

  return function destroy() {
    active = false;
    if (currentTabDestroy) {
      currentTabDestroy();
      currentTabDestroy = null;
    }
    tabBtnListeners.forEach(({ btn, handler }) => {
      btn.removeEventListener('click', handler);
    });
    tabBtnListeners.length = 0;
  };
}
