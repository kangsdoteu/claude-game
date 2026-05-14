import { listAuditLog } from '../../api/admin.js';

const LIMIT = 50;

function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const hh    = String(d.getHours()).padStart(2, '0');
  const mm    = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hh}:${mm}`;
}

function truncatePayload(payload) {
  if (payload === null || payload === undefined) return '';
  const str = JSON.stringify(payload);
  return str.length > 80 ? str.slice(0, 80) + '…' : str;
}

function buildRow(entry, listeners) {
  const tr = document.createElement('tr');

  // Zeitstempel
  const tdTime = document.createElement('td');
  tdTime.textContent = formatDateTime(entry.created_at);
  tr.appendChild(tdTime);

  // Admin
  const tdAdmin = document.createElement('td');
  tdAdmin.textContent = entry.admin_display_name ?? '—';
  tr.appendChild(tdAdmin);

  // Aktion
  const tdAction = document.createElement('td');
  tdAction.textContent = entry.action ?? '—';
  tr.appendChild(tdAction);

  // Ziel
  const tdTarget = document.createElement('td');
  const parts = [entry.target_type, entry.target_id].filter(Boolean);
  tdTarget.textContent = parts.length ? parts.join(':') : '—';
  tr.appendChild(tdTarget);

  // Payload — klickbar
  const tdPayload = document.createElement('td');
  const hasPayload = entry.payload !== null && entry.payload !== undefined;

  if (hasPayload) {
    const summary = document.createElement('span');
    summary.className = 'admin-audit-payload';
    summary.textContent = truncatePayload(entry.payload);

    let expanded = false;
    let preEl = null;

    function onPayloadClick() {
      expanded = !expanded;
      if (expanded) {
        preEl = document.createElement('pre');
        preEl.className = 'admin-audit-payload-expanded';
        preEl.textContent = JSON.stringify(entry.payload, null, 2);
        tdPayload.appendChild(preEl);
      } else if (preEl) {
        preEl.remove();
        preEl = null;
      }
    }

    summary.addEventListener('click', onPayloadClick);
    listeners.push({ el: summary, type: 'click', fn: onPayloadClick });
    tdPayload.appendChild(summary);
  } else {
    tdPayload.textContent = '—';
  }

  tr.appendChild(tdPayload);
  return tr;
}

export function mount(container) {
  let active = true;
  let currentOffset = 0;
  let lastPageSize = 0;
  let allRows = [];
  const listeners = [];

  // --- Build skeleton DOM ---
  const section = document.createElement('section');
  section.className = 'admin-audit';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'admin-audit-toolbar';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Filter nach Aktion, Admin oder Ziel …';
  searchInput.className = 'admin-audit-search';
  searchInput.title = 'Filter wirkt nur auf aktuelle Seite';

  const pageInfo = document.createElement('span');
  pageInfo.className = 'admin-audit-page-info';

  toolbar.appendChild(searchInput);
  toolbar.appendChild(pageInfo);

  // Table
  const tableWrap = document.createElement('div');
  tableWrap.className = 'admin-table-wrap';

  const table = document.createElement('table');
  table.className = 'admin-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const label of ['Zeitstempel', 'Admin', 'Aktion', 'Ziel', 'Details']) {
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
  pagination.className = 'admin-audit-pagination';

  const btnBack = document.createElement('button');
  btnBack.textContent = '← Zurück';
  btnBack.disabled = true;

  const pageIndicator = document.createElement('span');
  pageIndicator.className = 'admin-audit-page-indicator';

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
    td.colSpan = 5;
    td.className = cls;
    td.textContent = text;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  function applyFilter(query) {
    const q = query.trim().toLowerCase();
    tbody.innerHTML = '';

    const visible = q
      ? allRows.filter(({ entry }) =>
          (entry.action ?? '').toLowerCase().includes(q) ||
          (entry.admin_display_name ?? '').toLowerCase().includes(q) ||
          (entry.target_type ?? '').toLowerCase().includes(q) ||
          (entry.target_id ?? '').toLowerCase().includes(q)
        )
      : allRows;

    if (visible.length === 0) {
      setTbodyMessage('Keine Einträge auf dieser Seite.', 'admin-empty');
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

    setTbodyMessage('Lade Audit-Log …', 'admin-loading');

    let data;
    try {
      data = await listAuditLog({ limit: LIMIT, offset });
    } catch (err) {
      if (!active) return;
      setTbodyMessage(`Konnte Audit-Log nicht laden: ${err.message}`, 'admin-error');
      return;
    }

    if (!active) return;

    lastPageSize = data.length;

    if (data.length === 0) {
      setTbodyMessage('Keine Einträge auf dieser Seite.', 'admin-empty');
    } else {
      allRows = data.map(entry => ({ entry, row: buildRow(entry, listeners) }));
      tbody.innerHTML = '';
      for (const { row } of allRows) {
        tbody.appendChild(row);
      }
    }

    const from = offset + 1;
    const to   = offset + data.length;
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
    for (const { el, type, fn } of listeners) {
      el.removeEventListener(type, fn);
    }
    listeners.length = 0;
  };
}
