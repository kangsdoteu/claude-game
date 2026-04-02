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

export function bindControls(getState, setState) {
  function onKeyDown(e) {
    const dir = DIR_MAP[e.key];
    if (!dir) return;
    e.preventDefault();
    const state = getState();
    if (!state.alive) return;
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
      setState(s => {
        if (dir.x === -s.dir.x && dir.y === -s.dir.y) return s;
        return { ...s, nextDir: dir };
      });
    }, { passive: false });
  });

  container.appendChild(dpad);
  return () => dpad.remove();
}
