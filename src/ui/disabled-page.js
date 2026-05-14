import { ROUTE_LABELS } from './game-availability.js';

export function renderDisabledPage(container, route, disabledMessage) {
  container.innerHTML = '';
  const section = document.createElement('section');
  section.className = 'disabled-page';

  const h1 = document.createElement('h1');
  h1.textContent = `${ROUTE_LABELS[route] ?? 'Dieses Spiel'} ist aktuell nicht verfügbar`;

  const p = document.createElement('p');
  p.textContent = disabledMessage || 'Das Spiel ist vorübergehend deaktiviert.';

  const a = document.createElement('a');
  a.href = '#/';
  a.className = 'disabled-page-btn';
  a.textContent = 'Zurück zur Startseite';

  section.append(h1, p, a);
  container.appendChild(section);

  return function destroy() {};
}
