import { getGameSettings, invalidateGameSettings, GAME_LABELS } from '../../ui/game-availability.js';
import { refreshNavLinkAvailability } from '../../ui/nav.js';
import { supabase } from '../../api/supabase.js';
import { logAuditAction } from '../../api/admin.js';

export function mount(container) {
  let destroyed = false;

  (async () => {
    let settings;
    try {
      settings = await getGameSettings();
    } catch (err) {
      if (destroyed) return;
      renderError(container, err);
      return;
    }
    if (destroyed) return;
    renderTable(container, settings);
  })();

  return () => { destroyed = true; };
}

function renderError(container, err) {
  const p = document.createElement('p');
  p.className = 'admin-error';
  p.textContent = `Fehler beim Laden: ${err?.message ?? err}`;
  container.appendChild(p);
}

function renderTable(container, settings) {
  const section = document.createElement('section');
  section.className = 'admin-tab admin-tab-games';

  const grid = document.createElement('div');
  grid.className = 'admin-games';

  for (const [game, label] of Object.entries(GAME_LABELS)) {
    const row = buildRow(game, label, settings[game] ?? { enabled: true, disabled_message: null });
    grid.appendChild(row);
  }

  section.appendChild(grid);
  container.appendChild(section);
}

function buildRow(game, label, { enabled, disabled_message }) {
  const row = document.createElement('div');
  row.className = 'admin-games-row';

  // Label
  const labelEl = document.createElement('span');
  labelEl.className = 'admin-games-label';
  labelEl.textContent = label;

  // Checkbox
  const toggleWrap = document.createElement('label');
  toggleWrap.className = 'admin-games-toggle';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = enabled;
  const toggleText = document.createElement('span');
  toggleText.textContent = 'aktiviert';
  toggleWrap.append(checkbox, toggleText);

  // Message input
  const messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.className = 'admin-games-message';
  messageInput.placeholder = 'Deaktivierungs-Nachricht (optional)';
  messageInput.maxLength = 200;
  messageInput.value = disabled_message ?? '';

  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-ghost';
  saveBtn.textContent = 'Speichern';

  // Status
  const statusEl = document.createElement('span');
  statusEl.className = 'admin-games-status';

  saveBtn.addEventListener('click', () => {
    handleSave(game, checkbox.checked, messageInput.value, saveBtn, statusEl);
  });

  // Status zurücksetzen, sobald der User wieder editiert (Dirty-Flag)
  const resetStatus = () => {
    if (statusEl.textContent) {
      statusEl.textContent = '';
      statusEl.className = 'admin-games-status';
    }
  };
  checkbox.addEventListener('change', resetStatus);
  messageInput.addEventListener('input', resetStatus);

  row.append(labelEl, toggleWrap, messageInput, saveBtn, statusEl);
  return row;
}

async function handleSave(game, enabled, message, saveBtn, statusEl) {
  saveBtn.disabled = true;
  statusEl.textContent = 'Speichere …';
  statusEl.className = 'admin-games-status admin-games-status-loading';

  // updated_by bewusst nicht aus dem Client gesetzt — gehört serverseitig
  // (Trigger in einer späteren Migration). Bleibt NULL bis dahin.
  const { error } = await supabase
    .from('game_settings')
    .update({
      enabled,
      disabled_message: (message ?? '').trim() || null,
    })
    .eq('game', game);

  saveBtn.disabled = false;

  if (error) {
    statusEl.textContent = error.code === '42501'
      ? 'Keine Admin-Berechtigung.'
      : `Fehler: ${error.message}`;
    statusEl.className = 'admin-games-status admin-games-status-error';
    return;
  }

  try {
    await logAuditAction('toggle_game', {
      targetType: 'game',
      targetId: game,
      payload: { enabled, disabled_message: (message ?? '').trim() || null },
    });
  } catch (err) {
    // Audit-Failure soll den User-flow nicht abbrechen — nur loggen
    console.warn('Audit-Eintrag fehlgeschlagen', err);
  }

  invalidateGameSettings();
  refreshNavLinkAvailability();
  statusEl.textContent = 'Gespeichert ✓';
  statusEl.className = 'admin-games-status admin-games-status-success';
}
