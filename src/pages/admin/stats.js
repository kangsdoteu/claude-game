import { statsActiveUsers, statsDaily, topPlayers } from '../../api/admin.js';
import {
  createStackedLineChart,
  transformLongToWide,
} from './stats-chart.js';

const GAME_ORDER = ['tetris', 'snake', 'dinos_realtime', 'dinos_turn'];
const GAME_LABELS = {
  tetris: 'Tetris',
  snake: 'Snake',
  dinos_realtime: 'Dinos (Echtzeit)',
  dinos_turn: 'Dinos (Züge)',
};
// CSS variable names for chart colors — read at render time
const GAME_COLOR_VARS = {
  tetris: '--accent',
  snake: '--accent2',
  dinos_realtime: '--danger',
  dinos_turn: '--text-muted',
};

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('de-DE');
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Generate an array of YYYY-MM-DD strings for the last `n` days (ascending, ending today)
function lastNDays(n) {
  // Pure UTC: DB-Seite (date_trunc + CURRENT_DATE) arbeitet ebenfalls UTC.
  // Lokale Date-Arithmetik würde spät abends in CEST einen falschen Tagesschlüssel liefern.
  const days = [];
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(todayUTC);
    d.setUTCDate(todayUTC.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function mount(container) {
  let active = true;
  let chart = null;
  let resizeObserver = null;
  const tabListeners = []; // { el, type, fn }
  let chartMouseMove = null;
  let chartMouseLeave = null;
  let canvasEl = null;
  let requestSeq = 0; // race guard for top-player tab clicks

  // ---- Build skeleton DOM ----
  const section = document.createElement('section');
  section.className = 'admin-stats';

  // KPI row
  const kpiRow = document.createElement('div');
  kpiRow.className = 'admin-stats-kpis';

  const kpiKeys = [
    { key: 'dau', label: 'DAU' },
    { key: 'wau', label: 'WAU' },
    { key: 'mau', label: 'MAU' },
  ];
  const kpiValueEls = {};
  for (const { key, label } of kpiKeys) {
    const card = document.createElement('div');
    card.className = 'admin-stats-kpi';

    const lbl = document.createElement('span');
    lbl.className = 'admin-stats-kpi-label';
    lbl.textContent = label;

    const val = document.createElement('span');
    val.className = 'admin-stats-kpi-value';
    val.textContent = '…';

    card.appendChild(lbl);
    card.appendChild(val);
    kpiRow.appendChild(card);
    kpiValueEls[key] = val;
  }

  // Chart section
  const chartSection = document.createElement('div');
  chartSection.className = 'admin-stats-section';

  const chartHeader = document.createElement('div');
  chartHeader.className = 'admin-stats-section-header';
  const chartTitle = document.createElement('h2');
  chartTitle.textContent = 'Scores pro Tag (letzte 30 Tage)';
  chartHeader.appendChild(chartTitle);

  canvasEl = document.createElement('canvas');
  canvasEl.className = 'admin-stats-chart-canvas';

  const legend = document.createElement('div');
  legend.className = 'admin-stats-chart-legend';
  for (const game of GAME_ORDER) {
    const item = document.createElement('span');
    item.className = 'admin-stats-legend-item';

    const dot = document.createElement('i');
    dot.className = 'dot';
    // color set after cssVar is readable (defer to after DOM insert)
    dot.dataset.colorVar = GAME_COLOR_VARS[game];

    const lbl = document.createElement('span');
    lbl.textContent = GAME_LABELS[game];

    item.appendChild(dot);
    item.appendChild(lbl);
    legend.appendChild(item);
  }

  chartSection.appendChild(chartHeader);
  chartSection.appendChild(canvasEl);
  chartSection.appendChild(legend);

  // Top-players section
  const topSection = document.createElement('div');
  topSection.className = 'admin-stats-section';

  const topHeader = document.createElement('div');
  topHeader.className = 'admin-stats-section-header';

  const topTitle = document.createElement('h2');
  topTitle.textContent = 'Top-Spieler';

  const tabList = document.createElement('div');
  tabList.className = 'admin-stats-top-tabs';
  tabList.setAttribute('role', 'tablist');

  const tabEls = {};
  for (const game of GAME_ORDER) {
    const btn = document.createElement('button');
    btn.className = 'admin-stats-top-tab' + (game === 'tetris' ? ' active' : '');
    btn.textContent = GAME_LABELS[game];
    btn.dataset.game = game;
    btn.setAttribute('role', 'tab');
    tabList.appendChild(btn);
    tabEls[game] = btn;
  }

  topHeader.appendChild(topTitle);
  topHeader.appendChild(tabList);

  const tableWrap = document.createElement('div');
  tableWrap.className = 'admin-table-wrap';

  const table = document.createElement('table');
  table.className = 'admin-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const label of ['#', 'Name', 'Score', 'Datum']) {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);

  topSection.appendChild(topHeader);
  topSection.appendChild(tableWrap);

  section.appendChild(kpiRow);
  section.appendChild(chartSection);
  section.appendChild(topSection);
  container.appendChild(section);

  // Now that DOM is inserted, set legend dot colors from CSS vars
  for (const dot of legend.querySelectorAll('.dot')) {
    dot.style.background = cssVar(dot.dataset.colorVar);
  }

  // ---- Helpers ----
  function setTbodyMessage(text, cls) {
    tbody.textContent = '';
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.className = cls;
    td.textContent = text;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  function buildTopRow(rank, entry) {
    const tr = document.createElement('tr');
    const cells = [
      String(rank),
      entry.display_name ?? '—',
      (entry.score ?? 0).toLocaleString('de-DE'),
      formatDate(entry.created_at),
    ];
    for (const text of cells) {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    }
    return tr;
  }

  function renderTopRows(data) {
    tbody.textContent = '';
    if (!data || data.length === 0) {
      setTbodyMessage('Keine Einträge vorhanden.', 'admin-empty');
      return;
    }
    data.forEach((entry, idx) => {
      tbody.appendChild(buildTopRow(idx + 1, entry));
    });
  }

  async function loadTopPlayers(game) {
    const seq = ++requestSeq;
    setTbodyMessage('Lade …', 'admin-loading');
    let data;
    try {
      data = await topPlayers(game, 10);
    } catch (err) {
      if (!active || requestSeq !== seq) return;
      setTbodyMessage(`Fehler: ${err.message}`, 'admin-error');
      return;
    }
    if (!active || requestSeq !== seq) return;
    renderTopRows(data);
  }

  // Tab click handler
  function onTabClick(e) {
    const btn = e.currentTarget;
    const game = btn.dataset.game;
    for (const g of GAME_ORDER) {
      tabEls[g].classList.toggle('active', g === game);
    }
    loadTopPlayers(game);
  }

  for (const game of GAME_ORDER) {
    const fn = onTabClick;
    tabEls[game].addEventListener('click', fn);
    tabListeners.push({ el: tabEls[game], type: 'click', fn });
  }

  // Chart mouse handlers
  chartMouseMove = (e) => { if (chart) chart.setHover(e.offsetX); };
  chartMouseLeave = () => { if (chart) chart.setHover(null); };
  canvasEl.addEventListener('mousemove', chartMouseMove);
  canvasEl.addEventListener('mouseleave', chartMouseLeave);

  // Initial loading states
  setTbodyMessage('Lade …', 'admin-loading');

  // Draw empty chart as placeholder while loading
  {
    const placeholderColors = {};
    for (const g of GAME_ORDER) placeholderColors[g] = cssVar(GAME_COLOR_VARS[g]);
    chart = createStackedLineChart({
      canvas: canvasEl,
      days: [],
      series: {},
      gameOrder: GAME_ORDER,
      colors: placeholderColors,
    });
    chart.render();
  }

  // ResizeObserver
  resizeObserver = new ResizeObserver(() => {
    if (chart) {
      chart.render();
    }
  });
  resizeObserver.observe(canvasEl);

  // ---- Parallel data fetch ----
  Promise.allSettled([
    statsActiveUsers(),
    statsDaily(30),
    topPlayers('tetris', 10),
  ]).then(([kpiResult, dailyResult, topResult]) => {
    if (!active) return;

    // KPIs
    if (kpiResult.status === 'fulfilled') {
      const d = kpiResult.value;
      kpiValueEls.dau.textContent = d?.dau != null ? Number(d.dau).toLocaleString('de-DE') : '—';
      kpiValueEls.wau.textContent = d?.wau != null ? Number(d.wau).toLocaleString('de-DE') : '—';
      kpiValueEls.mau.textContent = d?.mau != null ? Number(d.mau).toLocaleString('de-DE') : '—';
    } else {
      for (const key of ['dau', 'wau', 'mau']) kpiValueEls[key].textContent = 'Fehler';
    }

    // Chart
    if (dailyResult.status === 'fulfilled') {
      const rows = dailyResult.value;
      const days = lastNDays(30);
      const colors = {};
      for (const g of GAME_ORDER) colors[g] = cssVar(GAME_COLOR_VARS[g]);
      const series = transformLongToWide(rows, days, GAME_ORDER);

      if (chart) chart.destroy();
      chart = createStackedLineChart({ canvas: canvasEl, days, series, gameOrder: GAME_ORDER, colors });
      chart.render();
    } else {
      // Show error inside chart area
      const errBox = document.createElement('p');
      errBox.className = 'admin-error';
      errBox.textContent = `Chart-Fehler: ${dailyResult.reason?.message ?? 'Unbekannter Fehler'}`;
      chartSection.insertBefore(errBox, canvasEl);
    }

    // Top players (tetris preloaded)
    if (topResult.status === 'fulfilled') {
      renderTopRows(topResult.value);
    } else {
      setTbodyMessage(`Fehler: ${topResult.reason?.message ?? 'Unbekannter Fehler'}`, 'admin-error');
    }
  });

  return function destroy() {
    active = false;

    for (const { el, type, fn } of tabListeners) {
      el.removeEventListener(type, fn);
    }

    if (chartMouseMove) canvasEl.removeEventListener('mousemove', chartMouseMove);
    if (chartMouseLeave) canvasEl.removeEventListener('mouseleave', chartMouseLeave);

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (chart) {
      chart.destroy();
      chart = null;
    }
  };
}
