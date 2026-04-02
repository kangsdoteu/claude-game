import { getLeaderboard } from '../api/scores.js';

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
  ['tetris', 'snake'].forEach(game => {
    const btn = document.createElement('button');
    btn.setAttribute('role', 'tab');
    btn.textContent = game.charAt(0).toUpperCase() + game.slice(1);
    btn.dataset.game = game;
    if (game === activeGame) btn.classList.add('active');
    tabs.appendChild(btn);
  });
  section.appendChild(tabs);

  const content = document.createElement('div');
  content.id = 'lb-content';
  section.appendChild(content);
  container.appendChild(section);

  async function loadTable(game) {
    content.textContent = 'Lade…';
    try {
      const scores = await getLeaderboard(game, 10);
      renderTable(content, scores);
    } catch {
      content.textContent = 'Fehler beim Laden.';
    }
  }

  tabs.querySelectorAll('[role=tab]').forEach(tab => {
    tab.addEventListener('click', async () => {
      tabs.querySelectorAll('[role=tab]').forEach(t => t.classList.toggle('active', t === tab));
      await loadTable(tab.dataset.game);
    });
  });

  await loadTable(activeGame);
}

function renderTable(container, scores) {
  container.innerHTML = '';
  if (!scores.length) {
    const p = document.createElement('p');
    p.className = 'lb-empty';
    p.textContent = 'Noch keine Einträge.';
    container.appendChild(p);
    return;
  }

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
