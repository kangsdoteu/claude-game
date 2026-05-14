import { supabase } from '../../api/supabase.js';
import { refreshMaintenanceBanner } from '../../ui/maintenance-banner.js';

export function mount(container) {
  let destroyed = false;
  const cleanups = [];

  const section = document.createElement('section');
  section.className = 'admin-tab admin-tab-announcements';

  const wrapper = document.createElement('div');
  wrapper.className = 'admin-announcements';

  // ── Create form ──────────────────────────────────────────────────────────

  const createForm = document.createElement('div');
  createForm.className = 'admin-announcements-row';

  const newTextarea = document.createElement('textarea');
  newTextarea.placeholder = 'Nachricht (max. 500 Zeichen)';
  newTextarea.maxLength = 500;

  const newSeverity = document.createElement('select');
  for (const [val, label] of [['info', 'Info'], ['warning', 'Warnung'], ['critical', 'Kritisch']]) {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    newSeverity.appendChild(opt);
  }

  const newActiveLabel = document.createElement('label');
  const newActiveCheck = document.createElement('input');
  newActiveCheck.type = 'checkbox';
  newActiveCheck.checked = true;
  const newActiveText = document.createElement('span');
  newActiveText.textContent = 'Aktiv';
  newActiveLabel.append(newActiveCheck, newActiveText);

  const newExpires = document.createElement('input');
  newExpires.type = 'datetime-local';
  newExpires.title = 'Ablaufdatum (optional)';

  const createBtn = document.createElement('button');
  createBtn.className = 'btn-primary';
  createBtn.textContent = 'Anlegen';

  const createStatus = document.createElement('span');
  createStatus.className = 'admin-games-status';

  const createHandler = async () => {
    const message = newTextarea.value.trim();
    if (!message) {
      createStatus.textContent = 'Nachricht darf nicht leer sein.';
      createStatus.className = 'admin-games-status admin-games-status-error';
      return;
    }
    createBtn.disabled = true;
    createStatus.textContent = 'Speichere …';
    createStatus.className = 'admin-games-status admin-games-status-loading';

    const payload = {
      message,
      severity: newSeverity.value,
      active: newActiveCheck.checked,
      expires_at: newExpires.value ? new Date(newExpires.value).toISOString() : null,
      // created_by intentionally NOT sent — defense-in-depth, analog games.js
    };

    const { data, error } = await supabase
      .from('site_announcements')
      .insert(payload)
      .select()
      .single();

    createBtn.disabled = false;

    if (error) {
      createStatus.textContent = error.code === '42501'
        ? 'Keine Admin-Berechtigung.'
        : `Fehler: ${error.message}`;
      createStatus.className = 'admin-games-status admin-games-status-error';
      return;
    }

    createStatus.textContent = 'Angelegt ✓';
    createStatus.className = 'admin-games-status admin-games-status-success';
    newTextarea.value = '';
    newExpires.value = '';
    newActiveCheck.checked = true;

    await refreshMaintenanceBanner();
    if (!destroyed) appendRow(list, data);
  };
  createBtn.addEventListener('click', createHandler);
  cleanups.push(() => createBtn.removeEventListener('click', createHandler));

  const resetCreate = () => {
    if (createStatus.textContent) {
      createStatus.textContent = '';
      createStatus.className = 'admin-games-status';
    }
  };
  newTextarea.addEventListener('input', resetCreate);
  cleanups.push(() => newTextarea.removeEventListener('input', resetCreate));

  createForm.append(newTextarea, newSeverity, newActiveLabel, newExpires, createBtn, createStatus);

  // ── List ─────────────────────────────────────────────────────────────────

  const list = document.createElement('div');
  list.className = 'admin-announcements-list';

  wrapper.append(createForm, list);
  section.appendChild(wrapper);
  container.appendChild(section);

  // ── Load ─────────────────────────────────────────────────────────────────

  (async () => {
    const loadingEl = document.createElement('p');
    loadingEl.className = 'admin-loading';
    loadingEl.textContent = 'Lade Ankündigungen …';
    list.appendChild(loadingEl);

    const { data, error } = await supabase
      .from('site_announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (destroyed) return;
    loadingEl.remove();

    if (error) {
      const errEl = document.createElement('p');
      errEl.className = 'admin-error';
      errEl.textContent = error.code === '42501'
        ? 'Keine Admin-Berechtigung.'
        : `Fehler: ${error.message}`;
      list.appendChild(errEl);
      return;
    }

    if (!data || data.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'admin-empty';
      empty.textContent = 'Keine Ankündigungen vorhanden.';
      list.appendChild(empty);
      return;
    }

    for (const a of data) appendRow(list, a);
  })();

  function appendRow(listEl, a) {
    const row = document.createElement('div');
    row.className = 'admin-announcements-row';
    row.dataset.id = String(a.id);

    const textarea = document.createElement('textarea');
    textarea.value = a.message;
    textarea.maxLength = 500;

    const severitySelect = document.createElement('select');
    for (const [val, label] of [['info', 'Info'], ['warning', 'Warnung'], ['critical', 'Kritisch']]) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = label;
      if (val === a.severity) opt.selected = true;
      severitySelect.appendChild(opt);
    }

    const activeLabel = document.createElement('label');
    const activeCheck = document.createElement('input');
    activeCheck.type = 'checkbox';
    activeCheck.checked = a.active;
    const activeText = document.createElement('span');
    activeText.textContent = 'Aktiv';
    activeLabel.append(activeCheck, activeText);

    const expiresInput = document.createElement('input');
    expiresInput.type = 'datetime-local';
    if (a.expires_at) {
      expiresInput.value = new Date(a.expires_at).toISOString().slice(0, 16);
    }

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-ghost';
    saveBtn.textContent = 'Speichern';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-ghost';
    deleteBtn.style.color = 'var(--danger)';
    deleteBtn.textContent = 'Löschen';

    const statusEl = document.createElement('span');
    statusEl.className = 'admin-games-status';

    const resetStatus = () => {
      if (statusEl.textContent) {
        statusEl.textContent = '';
        statusEl.className = 'admin-games-status';
      }
    };
    textarea.addEventListener('input', resetStatus);
    severitySelect.addEventListener('change', resetStatus);
    activeCheck.addEventListener('change', resetStatus);
    expiresInput.addEventListener('change', resetStatus);

    const saveHandler = async () => {
      const message = textarea.value.trim();
      if (!message) {
        statusEl.textContent = 'Nachricht darf nicht leer sein.';
        statusEl.className = 'admin-games-status admin-games-status-error';
        return;
      }
      saveBtn.disabled = true;
      statusEl.textContent = 'Speichere …';
      statusEl.className = 'admin-games-status admin-games-status-loading';

      const { error } = await supabase
        .from('site_announcements')
        .update({
          message,
          severity: severitySelect.value,
          active: activeCheck.checked,
          expires_at: expiresInput.value ? new Date(expiresInput.value).toISOString() : null,
        })
        .eq('id', a.id);

      saveBtn.disabled = false;

      if (error) {
        statusEl.textContent = error.code === '42501'
          ? 'Keine Admin-Berechtigung.'
          : `Fehler: ${error.message}`;
        statusEl.className = 'admin-games-status admin-games-status-error';
        return;
      }

      statusEl.textContent = 'Gespeichert ✓';
      statusEl.className = 'admin-games-status admin-games-status-success';
      await refreshMaintenanceBanner();
    };
    saveBtn.addEventListener('click', saveHandler);

    const deleteHandler = async () => {
      if (!confirm('Wirklich löschen?')) return;
      deleteBtn.disabled = true;
      statusEl.textContent = 'Lösche …';
      statusEl.className = 'admin-games-status admin-games-status-loading';

      const { error } = await supabase
        .from('site_announcements')
        .delete()
        .eq('id', a.id);

      if (error) {
        deleteBtn.disabled = false;
        statusEl.textContent = error.code === '42501'
          ? 'Keine Admin-Berechtigung.'
          : `Fehler: ${error.message}`;
        statusEl.className = 'admin-games-status admin-games-status-error';
        return;
      }

      await refreshMaintenanceBanner();
      row.remove();
    };
    deleteBtn.addEventListener('click', deleteHandler);

    // Track listeners for cleanup
    cleanups.push(() => {
      saveBtn.removeEventListener('click', saveHandler);
      deleteBtn.removeEventListener('click', deleteHandler);
      textarea.removeEventListener('input', resetStatus);
      severitySelect.removeEventListener('change', resetStatus);
      activeCheck.removeEventListener('change', resetStatus);
      expiresInput.removeEventListener('change', resetStatus);
    });

    row.append(textarea, severitySelect, activeLabel, expiresInput, saveBtn, deleteBtn, statusEl);
    listEl.appendChild(row);
  }

  return function destroy() {
    destroyed = true;
    for (const fn of cleanups) fn();
    cleanups.length = 0;
  };
}
