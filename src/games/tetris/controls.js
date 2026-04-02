const DAS_DELAY  = 170;
const DAS_REPEAT = 50;

export function bindControls(loop, getState, dispatch) {
  let dasKey = null;
  let dasTimer = null;

  const keyMap = {
    ArrowLeft:  'moveLeft',
    ArrowRight: 'moveRight',
    ArrowDown:  'softDrop',
    ArrowUp:    'rotate',
    ' ':        'hardDrop',
    z:          'rotate',
    c:          'hold',
    Shift:      'hold',
    a:          'moveLeft',
    d:          'moveRight',
    s:          'softDrop',
    w:          'rotate',
  };

  const dasKeys = new Set(['ArrowLeft','ArrowRight','a','d']);

  function onKeyDown(e) {
    if (e.repeat) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.closest('dialog[open]')) return;
    const action = keyMap[e.key];
    if (!action) return;
    e.preventDefault();
    dispatch(action);

    if (dasKeys.has(e.key)) {
      clearTimeout(dasTimer); clearInterval(dasTimer);
      dasKey = e.key;
      dasTimer = setTimeout(() => {
        dasTimer = setInterval(() => dispatch(keyMap[dasKey]), DAS_REPEAT);
      }, DAS_DELAY);
    }
  }

  function onKeyUp(e) {
    if (e.key === dasKey) {
      clearTimeout(dasTimer); clearInterval(dasTimer);
      dasKey = null;
    }
  }

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup',   onKeyUp);

  return function cleanup() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup',   onKeyUp);
    clearTimeout(dasTimer); clearInterval(dasTimer);
  };
}

export function bindTouchControls(container, dispatch) {
  const dpad = document.createElement('div');
  dpad.className = 'touch-controls';
  dpad.innerHTML = `
    <div class="dpad-row">
      <button class="dpad-btn" data-action="rotate">↑ Drehen</button>
    </div>
    <div class="dpad-row">
      <button class="dpad-btn" data-action="moveLeft">←</button>
      <button class="dpad-btn" data-action="softDrop">↓</button>
      <button class="dpad-btn" data-action="moveRight">→</button>
    </div>
    <div class="dpad-row">
      <button class="dpad-btn wide" data-action="hardDrop">⬇ Drop</button>
      <button class="dpad-btn wide" data-action="hold">Hold</button>
    </div>`;

  dpad.querySelectorAll('.dpad-btn').forEach(btn => {
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      dispatch(btn.dataset.action);
    }, { passive: false });
  });

  container.appendChild(dpad);
  return () => dpad.remove();
}
