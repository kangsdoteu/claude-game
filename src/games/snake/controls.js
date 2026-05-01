import { start } from './logic.js';

const DIR_MAP = {
  ArrowUp:    { x:  0, y: -1 },
  ArrowDown:  { x:  0, y:  1 },
  ArrowLeft:  { x: -1, y:  0 },
  ArrowRight: { x:  1, y:  0 },
  w: { x:  0, y: -1 },
  s: { x:  0, y:  1 },
  a: { x: -1, y:  0 },
  d: { x:  1, y:  0 },
};

const PAUSE_KEYS = new Set(['p','P','Escape']);

export function bindControls(callbacks, getState, setState) {
  function onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.closest('dialog[open]')) return;
    if (e.repeat) return;
    if (PAUSE_KEYS.has(e.key)) {
      e.preventDefault();
      callbacks.pause?.();
      return;
    }
    const dir = DIR_MAP[e.key];
    if (!dir) return;
    e.preventDefault();
    const state = getState();
    if (!state.alive) return;
    setState(start);
    setState(s => {
      // Prevent 180° turn
      if (dir.x === -s.dir.x && dir.y === -s.dir.y) return s;
      return { ...s, nextDir: dir };
    });
  }

  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}

export function bindTouchControls(container, getState, setState) {
  const dpad = document.createElement('div');
  dpad.className = 'touch-controls';
  dpad.innerHTML = `
    <div class="dpad-row">
      <button class="dpad-btn" data-x="0" data-y="-1">↑</button>
    </div>
    <div class="dpad-row">
      <button class="dpad-btn" data-x="-1" data-y="0">←</button>
      <button class="dpad-btn" data-x="0" data-y="1">↓</button>
      <button class="dpad-btn" data-x="1" data-y="0">→</button>
    </div>`;

  dpad.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      const dir = { x: +btn.dataset.x, y: +btn.dataset.y };
      setState(start);
      setState(s => {
        if (dir.x === -s.dir.x && dir.y === -s.dir.y) return s;
        return { ...s, nextDir: dir };
      });
    }, { passive: false });
  });

  container.appendChild(dpad);
  return () => dpad.remove();
}
