import { ensureAdmin } from './auth-gate.js';

export function mount(container) {
  let active = true;

  (async () => {
    const user = await ensureAdmin();
    if (!active || !user) return;

    container.innerHTML = '';

    const section = document.createElement('section');
    section.className = 'admin admin-placeholder';

    const h1 = document.createElement('h1');
    h1.textContent = 'Admin-Bereich';

    const p = document.createElement('p');
    p.textContent = 'Phase 1: Skelett. Tabs folgen in Phase 2.';

    const small = document.createElement('small');
    small.textContent = `Angemeldet als ${user.email}`;

    section.append(h1, p, small);
    container.appendChild(section);
  })();

  return function destroy() {
    active = false;
  };
}
