import { rateLimitRecent, banUser, listRecentScores, deleteScore, listUsers, unbanUser, logAuditAction } from '../../api/admin.js';

// Audit-Wrapper: Failure darf User-Flow nie abbrechen
async function audit(action, opts) {
  try { await logAuditAction(action, opts); }
  catch (err) { console.warn('Audit-Eintrag fehlgeschlagen', err); }
}

const GAME_LABELS = {
  tetris:         'Tetris',
  snake:          'Snake',
  dinos_realtime: 'Dinos RT',
  dinos_turn:     'Dinos Turn',
};

const SCORE_GAMES = [null, 'tetris', 'snake', 'dinos_realtime', 'dinos_turn'];
const SCORE_GAME_LABELS = ['Alle', 'Tetris', 'Snake', 'Dinos RT', 'Dinos Turn'];
const SCORE_LIMIT = 50;

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleString('de-DE');
}

function formatDuration(secs) {
  if (!secs && secs !== 0) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function makeSectionHeader(title) {
  const header = el('div', 'admin-mod-section-header');
  const h2 = el('h2');
  h2.textContent = title;
  header.appendChild(h2);
  return header;
}

function makeEmptyRow(text, colSpan) {
  const tr = el('tr');
  const td = el('td', 'admin-mod-empty');
  td.colSpan = colSpan;
  td.textContent = text;
  tr.appendChild(td);
  return tr;
}

function makeTable(headers) {
  const wrap = el('div', 'admin-table-wrap');
  const table = el('table', 'admin-table');
  const thead = el('thead');
  const headerRow = el('tr');
  for (const label of headers) {
    const th = el('th');
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  const tbody = el('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  return { wrap, tbody };
}

export function mount(container) {
  let active = true;
  const listeners = [];

  function on(target, event, handler) {
    target.addEventListener(event, handler);
    listeners.push({ target, event, handler });
  }

  // ============================================================
  // Root
  // ============================================================
  const root = el('div', 'admin-moderation');
  container.appendChild(root);

  // ============================================================
  // Section 1: Verdächtige Aktivität (Phase 10)
  // ============================================================
  const secActivity = el('div', 'admin-mod-section');
  const activityHeader = makeSectionHeader('Verdächtige Aktivität (letzte Stunde)');

  const btnRefreshActivity = el('button', 'btn-ghost admin-mod-action-btn');
  btnRefreshActivity.textContent = 'Neu laden';
  activityHeader.appendChild(btnRefreshActivity);

  secActivity.appendChild(activityHeader);

  const { wrap: actWrap, tbody: actTbody } = makeTable(['Spieler', 'Scores', 'Letzter Score', 'Aktion']);
  secActivity.appendChild(actWrap);
  root.appendChild(secActivity);

  // Inline-Ban-Form state per row (userId → form-el or null)
  let banForms = {};

  async function loadActivity() {
    actTbody.innerHTML = '';
    const loadRow = makeEmptyRow('Lade …', 4);
    loadRow.firstChild.className = 'admin-loading';
    actTbody.appendChild(loadRow);

    let data;
    try {
      data = await rateLimitRecent(1);
    } catch (err) {
      if (!active) return;
      actTbody.innerHTML = '';
      actTbody.appendChild(makeEmptyRow(`Fehler: ${err.message}`, 4));
      return;
    }
    if (!active) return;

    banForms = {};
    actTbody.innerHTML = '';

    if (data.length === 0) {
      actTbody.appendChild(makeEmptyRow('Keine auffällige Aktivität.', 4));
      return;
    }

    for (const row of data) {
      renderActivityRow(row);
    }
  }

  function renderActivityRow(row) {
    const tr = el('tr');
    tr.dataset.userId = row.user_id;

    const tdName = el('td');
    tdName.textContent = row.display_name ?? '—';
    const tdCount = el('td', 'col-num');
    tdCount.textContent = String(row.score_count);
    const tdLast = el('td');
    tdLast.textContent = formatDate(row.last_at);

    const tdAction = el('td');
    const banBtn = el('button', 'btn-ghost admin-mod-action-btn admin-mod-action-btn--danger');
    banBtn.textContent = 'Bannen';

    on(banBtn, 'click', () => {
      if (banForms[row.user_id]) return;
      const formEl = buildInlineBanForm(row.user_id, tr, tdAction, banBtn, () => loadActivity());
      banForms[row.user_id] = formEl;
    });

    tdAction.appendChild(banBtn);
    tr.appendChild(tdName);
    tr.appendChild(tdCount);
    tr.appendChild(tdLast);
    tr.appendChild(tdAction);
    actTbody.appendChild(tr);
  }

  function buildInlineBanForm(userId, tr, tdAction, banBtn, onSuccess) {
    banBtn.disabled = true;

    // Insert extra row below for the inline form
    const formTr = el('tr');
    formTr.className = 'admin-mod-ban-form-row';
    const formTd = el('td');
    formTd.colSpan = 4;
    formTd.style.padding = '0.5rem 0.75rem';

    const input = el('input');
    input.type = 'text';
    input.placeholder = 'Grund (optional, max. 500 Zeichen)';
    input.maxLength = 500;
    input.style.cssText = 'width:100%;max-width:400px;padding:0.35rem 0.5rem;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);font:inherit;margin-right:0.5rem;';

    const confirmBtn = el('button', 'btn-ghost admin-mod-action-btn admin-mod-action-btn--danger');
    confirmBtn.textContent = 'Bestätigen';
    confirmBtn.style.marginRight = '0.4rem';

    const cancelBtn = el('button', 'btn-ghost admin-mod-action-btn');
    cancelBtn.textContent = 'Abbrechen';

    const statusSpan = el('span');
    statusSpan.style.cssText = 'margin-left:0.5rem;font-size:0.85rem;';

    formTd.appendChild(input);
    formTd.appendChild(confirmBtn);
    formTd.appendChild(cancelBtn);
    formTd.appendChild(statusSpan);
    formTr.appendChild(formTd);

    if (tr.nextSibling) {
      actTbody.insertBefore(formTr, tr.nextSibling);
    } else {
      actTbody.appendChild(formTr);
    }

    function cleanup() {
      delete banForms[userId];
      banBtn.disabled = false;
      formTr.remove();
    }

    on(cancelBtn, 'click', cleanup);

    on(confirmBtn, 'click', async () => {
      confirmBtn.disabled = true;
      cancelBtn.disabled = true;
      statusSpan.textContent = 'Wird gespeichert …';
      statusSpan.style.color = 'var(--text-muted)';
      const reason = input.value.trim() || null;
      try {
        await banUser(userId, reason);
        await audit('ban_user', { targetType: 'user', targetId: userId, payload: { reason } });
        statusSpan.textContent = 'Gesperrt.';
        statusSpan.style.color = 'var(--success)';
        setTimeout(() => {
          if (!active) return;
          cleanup();
          onSuccess();
        }, 800);
      } catch (err) {
        statusSpan.textContent = `Fehler: ${err.message}`;
        statusSpan.style.color = 'var(--danger)';
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
      }
    });

    return formTr;
  }

  on(btnRefreshActivity, 'click', loadActivity);

  // ============================================================
  // Section 2: Letzte Scores (Phase 8)
  // ============================================================
  const secScores = el('div', 'admin-mod-section');
  const scoresHeader = makeSectionHeader('Letzte Scores');

  // Game-Tabs
  const gameTabs = el('div', 'admin-mod-game-tabs');
  let selectedGame = null;
  let scoreOffset = 0;
  let lastScorePageSize = 0;

  const gameTabBtns = SCORE_GAMES.map((game, i) => {
    const btn = el('button', 'admin-mod-game-tab' + (game === selectedGame ? ' active' : ''));
    btn.textContent = SCORE_GAME_LABELS[i];
    btn.dataset.game = game ?? '';
    gameTabs.appendChild(btn);
    return btn;
  });

  scoresHeader.appendChild(gameTabs);
  secScores.appendChild(scoresHeader);

  const { wrap: scoreWrap, tbody: scoreTbody } = makeTable(['Datum', 'Spieler', 'Spiel', 'Score', 'Dauer', 'Aktion']);
  secScores.appendChild(scoreWrap);

  // Pagination
  const scorePagination = el('div', 'admin-users-pagination');
  const scoreBtnBack = el('button');
  scoreBtnBack.textContent = '← Zurück';
  scoreBtnBack.disabled = true;
  const scorePageIndicator = el('span', 'admin-users-page-indicator');
  const scoreBtnNext = el('button');
  scoreBtnNext.textContent = 'Weiter →';
  scoreBtnNext.disabled = true;
  scorePagination.appendChild(scoreBtnBack);
  scorePagination.appendChild(scorePageIndicator);
  scorePagination.appendChild(scoreBtnNext);
  secScores.appendChild(scorePagination);
  root.appendChild(secScores);

  async function loadScores(offset) {
    scoreOffset = offset;
    scoreTbody.innerHTML = '';
    scoreBtnBack.disabled = true;
    scoreBtnNext.disabled = true;

    const page = Math.floor(offset / SCORE_LIMIT) + 1;
    scorePageIndicator.textContent = `Seite ${page}`;

    const loadRow = makeEmptyRow('Lade …', 6);
    loadRow.firstChild.className = 'admin-loading';
    scoreTbody.appendChild(loadRow);

    let data;
    try {
      data = await listRecentScores({ limit: SCORE_LIMIT, offset, game: selectedGame });
    } catch (err) {
      if (!active) return;
      scoreTbody.innerHTML = '';
      scoreTbody.appendChild(makeEmptyRow(`Fehler: ${err.message}`, 6));
      return;
    }
    if (!active) return;

    lastScorePageSize = data.length;
    scoreTbody.innerHTML = '';

    if (data.length === 0) {
      scoreTbody.appendChild(makeEmptyRow('Keine Scores.', 6));
    } else {
      for (const score of data) {
        scoreTbody.appendChild(buildScoreRow(score));
      }
    }

    scoreBtnBack.disabled = offset === 0;
    scoreBtnNext.disabled = lastScorePageSize < SCORE_LIMIT;
  }

  function buildScoreRow(score) {
    const tr = el('tr');
    const displayName = score.profiles?.display_name ?? '—';
    const gameLabel = GAME_LABELS[score.game] ?? score.game;

    const cells = [
      formatDate(score.created_at),
      displayName,
      gameLabel,
      String(score.score),
      formatDuration(score.duration_seconds),
    ];

    for (const text of cells) {
      const td = el('td');
      td.textContent = text;
      tr.appendChild(td);
    }

    const tdAction = el('td');
    const delBtn = el('button', 'btn-ghost admin-mod-action-btn admin-mod-action-btn--danger');
    delBtn.textContent = 'Löschen';

    on(delBtn, 'click', async () => {
      const reason = window.prompt('Grund für Löschung (optional):');
      if (reason === null) return; // abgebrochen
      delBtn.disabled = true;
      try {
        const trimmedReason = reason.trim() || null;
        await deleteScore(score.id, trimmedReason);
        await audit('delete_score', { targetType: 'score', targetId: score.id, payload: { reason: trimmedReason } });
        tr.remove();
      } catch (err) {
        delBtn.disabled = false;
        window.alert(`Fehler: ${err.message}`);
      }
    });

    tdAction.appendChild(delBtn);
    tr.appendChild(tdAction);
    return tr;
  }

  // Tab-Klick
  for (let i = 0; i < gameTabBtns.length; i++) {
    const btn = gameTabBtns[i];
    const game = SCORE_GAMES[i];
    on(btn, 'click', () => {
      for (const b of gameTabBtns) b.classList.remove('active');
      btn.classList.add('active');
      selectedGame = game;
      loadScores(0);
    });
  }

  on(scoreBtnBack, 'click', () => {
    if (scoreOffset === 0) return;
    loadScores(scoreOffset - SCORE_LIMIT);
  });
  on(scoreBtnNext, 'click', () => {
    if (lastScorePageSize < SCORE_LIMIT) return;
    loadScores(scoreOffset + SCORE_LIMIT);
  });

  // ============================================================
  // Section 3: Gebannte Nutzer
  // ============================================================
  const secBanned = el('div', 'admin-mod-section');
  const bannedHeader = makeSectionHeader('Gesperrte Nutzer');

  const btnRefreshBanned = el('button', 'btn-ghost admin-mod-action-btn');
  btnRefreshBanned.textContent = 'Neu laden';
  bannedHeader.appendChild(btnRefreshBanned);

  secBanned.appendChild(bannedHeader);

  const { wrap: bannedWrap, tbody: bannedTbody } = makeTable(['Spieler', 'Gesperrt am', 'Grund', 'Aktion']);
  secBanned.appendChild(bannedWrap);
  root.appendChild(secBanned);

  async function loadBanned() {
    bannedTbody.innerHTML = '';
    const loadRow = makeEmptyRow('Lade …', 4);
    loadRow.firstChild.className = 'admin-loading';
    bannedTbody.appendChild(loadRow);

    let data;
    try {
      // Fetch a large set and filter client-side – efficient for < 1000 users
      data = await listUsers({ limit: 1000, offset: 0 });
    } catch (err) {
      if (!active) return;
      bannedTbody.innerHTML = '';
      bannedTbody.appendChild(makeEmptyRow(`Fehler: ${err.message}`, 4));
      return;
    }
    if (!active) return;

    const banned = data.filter(u => u.banned_at);
    bannedTbody.innerHTML = '';

    if (banned.length === 0) {
      bannedTbody.appendChild(makeEmptyRow('Keine gesperrten Nutzer.', 4));
      return;
    }

    for (const user of banned) {
      bannedTbody.appendChild(buildBannedRow(user));
    }
  }

  function buildBannedRow(user) {
    const tr = el('tr');
    tr.dataset.userId = user.id;

    const tdName = el('td');
    tdName.textContent = user.display_name ?? '—';
    const tdAt = el('td');
    tdAt.textContent = formatDate(user.banned_at);
    const tdReason = el('td');
    tdReason.textContent = user.banned_reason ?? '—';

    const tdAction = el('td');
    const unbanBtn = el('button', 'btn-ghost admin-mod-action-btn');
    unbanBtn.textContent = 'Entsperren';

    on(unbanBtn, 'click', async () => {
      unbanBtn.disabled = true;
      try {
        await unbanUser(user.id);
        await audit('unban_user', { targetType: 'user', targetId: user.id });
        tr.remove();
        // If table is now empty, show placeholder
        if (bannedTbody.children.length === 0) {
          bannedTbody.appendChild(makeEmptyRow('Keine gesperrten Nutzer.', 4));
        }
      } catch (err) {
        unbanBtn.disabled = false;
        window.alert(`Fehler: ${err.message}`);
      }
    });

    tdAction.appendChild(unbanBtn);
    tr.appendChild(tdName);
    tr.appendChild(tdAt);
    tr.appendChild(tdReason);
    tr.appendChild(tdAction);
    return tr;
  }

  on(btnRefreshBanned, 'click', loadBanned);

  // ============================================================
  // Initial loads
  // ============================================================
  loadActivity();
  loadScores(0);
  loadBanned();

  // ============================================================
  // Destroy
  // ============================================================
  return function destroy() {
    active = false;
    for (const { target, event, handler } of listeners) {
      target.removeEventListener(event, handler);
    }
  };
}
