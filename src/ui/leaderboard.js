import { getLeaderboard } from '../api/scores.js';

const cache = new Map();
const TTL_MS = 60_000;

export function invalidate(game) {
  cache.delete(game);
}

export async function renderLeaderboard(container, activeGame = 'tetris') {
  container.innerHTML = '';

  const section = document.createElement('section');
  section.className = 'leaderboard';

  const title = document.createElement('h3');
  title.textContent = 'Bestenliste';
  section.appendChild(title);

  const tabs = document.createElement('div');
  tabs.className = 'lb-tabs';
  tabs.setAttribute('role', 'tablist');
  const TAB_LABELS = {
    tetris:         'Tetris',
    snake:          'Snake',
    dinos_realtime: 'Dino-Evo (RT)',
    dinos_turn:     'Dino-Evo (Turn)',
  };
  ['tetris', 'snake', 'dinos_realtime', 'dinos_turn'].forEach(game => {
    const btn = document.createElement('button');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('type', 'button');
    btn.textContent = TAB_LABELS[game] ?? game;
    btn.dataset.game = game;
    if (game === activeGame) btn.classList.add('active');
    tabs.appendChild(btn);
  });
  section.appendChild(tabs);

  const content = document.createElement('div');
  content.id = 'lb-content';
  section.appendChild(content);
  container.appendChild(section);

  function setState(view, payload) {
    content.innerHTML = '';
    if (view === 'loading') {
      renderSkeleton(content);
    } else if (view === 'error') {
      renderError(content, payload);
    } else if (view === 'empty') {
      const p = document.createElement('p');
      p.className = 'lb-empty';
      p.textContent = 'Noch keine Einträge.';
      content.appendChild(p);
    } else if (view === 'data') {
      renderTable(content, payload);
    }
  }

  async function loadTable(game, { force = false } = {}) {
    const entry = cache.get(game);
    if (!force && entry && (Date.now() - entry.timestamp) < TTL_MS) {
      setState('data', entry.data);
      return;
    }

    setState('loading');
    try {
      const scores = await getLeaderboard(game, 10);
      cache.set(game, { data: scores, timestamp: Date.now() });
      if (scores.length === 0) {
        setState('empty');
      } else {
        setState('data', scores);
      }
    } catch {
      // Errors are not cached so retry always triggers a fresh fetch
      setState('error', {
        onRetry: () => loadTable(game, { force: true }),
      });
    }
  }

  tabs.querySelectorAll('[role=tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.querySelectorAll('[role=tab]').forEach(t => t.classList.toggle('active', t === tab));
      loadTable(tab.dataset.game);
    });
  });

  await loadTable(activeGame);
}

function renderSkeleton(container) {
  // aria-hidden keeps screen readers from reading placeholder content
  const table = document.createElement('table');
  table.className = 'lb-table lb-table--skeleton';
  table.setAttribute('aria-hidden', 'true');

  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  ['#', 'Spieler', 'Punkte', 'Datum'].forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const widths = ['--sk-narrow', '--sk-narrow', '--sk-wide', '--sk-medium'];
  for (let i = 0; i < 6; i++) {
    const tr = document.createElement('tr');
    widths.forEach(w => {
      const td = document.createElement('td');
      const span = document.createElement('span');
      span.className = `skeleton-bar ${w}`;
      td.appendChild(span);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);

  const status = document.createElement('p');
  status.className = 'lb-status';
  status.setAttribute('role', 'status');
  status.textContent = 'Lade…';
  container.appendChild(status);
}

function renderError(container, { onRetry }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'lb-error';

  const msg = document.createElement('p');
  msg.textContent = 'Fehler beim Laden.';
  wrapper.appendChild(msg);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'lb-retry';
  btn.textContent = 'Erneut versuchen';
  btn.addEventListener('click', onRetry);
  wrapper.appendChild(btn);

  container.appendChild(wrapper);
}

function renderTable(container, scores) {
  const medals = ['🥇', '🥈', '🥉'];
  const table = document.createElement('table');
  table.className = 'lb-table';

  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  ['#', 'Spieler', 'Punkte', 'Datum'].forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  scores.forEach((s, i) => {
    const tr = document.createElement('tr');
    if (i < 3) tr.className = `top-${i + 1}`;

    const rank = document.createElement('td');
    rank.textContent = medals[i] ?? String(i + 1);

    const player = document.createElement('td');
    player.textContent = s.display_name ?? '—';   // textContent = XSS-safe

    const score = document.createElement('td');
    score.textContent = s.score.toLocaleString('de-DE');

    const date = document.createElement('td');
    date.textContent = new Date(s.created_at).toLocaleDateString('de-DE');

    tr.append(rank, player, score, date);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}
