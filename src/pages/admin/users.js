import { listUsers } from '../../api/admin.js';

const LIMIT = 50;

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('de-DE');
}

function buildRow(user) {
  const tr = document.createElement('tr');

  const cells = [
    { text: user.display_name ?? '—', cls: null },
    { text: user.email ?? '—', cls: null },
    { text: formatDate(user.registered_at), cls: null },
    { text: formatDate(user.last_sign_in_at), cls: null },
    { text: String(user.score_count ?? 0), cls: 'col-num' },
    { text: formatDate(user.last_score_at), cls: 'col-num' },
    { text: user.is_admin ? '✓' : '', cls: null },
  ];

  for (const { text, cls } of cells) {
    const td = document.createElement('td');
    td.textContent = text;
    if (cls) td.className = cls;
    tr.appendChild(td);
  }

  return tr;
}

export function mount(container) {
  let active = true;
  let currentOffset = 0;
  let lastPageSize = 0;
  let allRows = []; // rows from current page for client-side filter

  // --- Build skeleton DOM ---
  const section = document.createElement('section');
  section.className = 'admin-users';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'admin-users-toolbar';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Filter nach Name oder E-Mail …';
  searchInput.className = 'admin-users-search';
  searchInput.title = 'Filter wirkt nur auf aktuelle Seite';

  const pageInfo = document.createElement('span');
  pageInfo.className = 'admin-users-page-info';

  toolbar.appendChild(searchInput);
  toolbar.appendChild(pageInfo);

  // Table wrapper (for mobile overflow)
  const tableWrap = document.createElement('div');
  tableWrap.className = 'admin-table-wrap';

  const table = document.createElement('table');
  table.className = 'admin-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const label of ['Name', 'E-Mail', 'Registriert', 'Zuletzt aktiv', 'Scores', 'Letzter Score', 'Admin']) {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);

  const tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);

  // Pagination
  const pagination = document.createElement('div');
  pagination.className = 'admin-users-pagination';

  const btnBack = document.createElement('button');
  btnBack.textContent = '← Zurück';
  btnBack.disabled = true;

  const pageIndicator = document.createElement('span');
  pageIndicator.className = 'admin-users-page-indicator';

  const btnNext = document.createElement('button');
  btnNext.textContent = 'Weiter →';
  btnNext.disabled = true;

  pagination.appendChild(btnBack);
  pagination.appendChild(pageIndicator);
  pagination.appendChild(btnNext);

  section.appendChild(toolbar);
  section.appendChild(tableWrap);
  section.appendChild(pagination);
  container.appendChild(section);

  // --- Helpers ---
  function setTbodyMessage(text, cls) {
    tbody.innerHTML = '';
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.className = cls;
    td.textContent = text;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  function applyFilter(query) {
    const q = query.trim().toLowerCase();
    tbody.innerHTML = '';

    const visible = q
      ? allRows.filter(({ user }) =>
          (user.display_name ?? '').toLowerCase().includes(q) ||
          (user.email ?? '').toLowerCase().includes(q)
        )
      : allRows;

    if (visible.length === 0) {
      setTbodyMessage('Keine Nutzer auf dieser Seite.', 'admin-empty');
      return;
    }

    for (const { row } of visible) {
      tbody.appendChild(row);
    }
  }

  async function loadPage(offset) {
    currentOffset = offset;
    searchInput.value = '';
    btnBack.disabled = true;
    btnNext.disabled = true;
    allRows = [];

    const currentPage = Math.floor(offset / LIMIT) + 1;
    pageIndicator.textContent = `Seite ${currentPage}`;
    pageInfo.textContent = '';

    setTbodyMessage('Lade Nutzer …', 'admin-loading');

    let data;
    try {
      data = await listUsers({ limit: LIMIT, offset });
    } catch (err) {
      if (!active) return;
      setTbodyMessage(`Konnte Nutzer nicht laden: ${err.message}`, 'admin-error');
      return;
    }

    if (!active) return;

    lastPageSize = data.length;

    if (data.length === 0) {
      setTbodyMessage('Keine Nutzer auf dieser Seite.', 'admin-empty');
    } else {
      allRows = data.map(user => ({ user, row: buildRow(user) }));
      tbody.innerHTML = '';
      for (const { row } of allRows) {
        tbody.appendChild(row);
      }
    }

    const from = offset + 1;
    const to = offset + data.length;
    pageInfo.textContent = data.length > 0 ? `${from}–${to}` : '';
    pageIndicator.textContent = `Seite ${currentPage}`;

    btnBack.disabled = offset === 0;
    btnNext.disabled = lastPageSize < LIMIT;
  }

  // --- Event handlers ---
  function onSearch(e) {
    applyFilter(e.target.value);
  }

  function onBack() {
    if (currentOffset === 0) return;
    loadPage(currentOffset - LIMIT);
  }

  function onNext() {
    if (lastPageSize < LIMIT) return;
    loadPage(currentOffset + LIMIT);
  }

  searchInput.addEventListener('input', onSearch);
  btnBack.addEventListener('click', onBack);
  btnNext.addEventListener('click', onNext);

  // Initial load
  loadPage(0);

  return function destroy() {
    active = false;
    searchInput.removeEventListener('input', onSearch);
    btnBack.removeEventListener('click', onBack);
    btnNext.removeEventListener('click', onNext);
  };
}
