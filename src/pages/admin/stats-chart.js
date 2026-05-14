// Pure helpers

export function niceMax(raw) {
  if (raw <= 0) return 5;
  const steps = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
  for (const s of steps) {
    if (s >= raw) return s;
  }
  // Beyond 50000: round up to next multiple of 10000
  return Math.ceil(raw / 10000) * 10000;
}

export function transformLongToWide(rows, days, gameTypes) {
  // rows: [{ day: '2026-05-14', game: 'tetris', scores: 3, ... }, ...]   (from admin_stats_daily_fn)
  // days: ['2026-04-15', ..., '2026-05-14'] ascending
  // gameTypes: ['tetris', 'snake', ...]
  // returns: { tetris: [0, 3, ...], snake: [...], ... }
  const map = {};
  for (const row of rows) {
    // RPC liefert `day` als Date-Object (in JS-Land typisch als ISO-String)
    const dayKey = typeof row.day === 'string' ? row.day : new Date(row.day).toISOString().slice(0, 10);
    const key = `${dayKey}|${row.game}`;
    map[key] = Number(row.scores ?? 0);
  }
  const result = {};
  for (const gt of gameTypes) {
    result[gt] = days.map(d => map[`${d}|${gt}`] ?? 0);
  }
  return result;
}

export function formatGermanShortDate(iso) {
  // '2026-05-14' → '14.05.'
  const [, m, d] = iso.split('-');
  return `${d}.${m}.`;
}

export function createStackedLineChart({ canvas, days, series, gameOrder, colors }) {
  const PAD_TOP = 20;
  const PAD_RIGHT = 12;
  const PAD_BOTTOM = 32;
  const PAD_LEFT = 44;
  const GRID_LINES = 5;

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Cached size, set by resizeCanvas() and re-used by every drawChart().
  // Resize läuft NUR bei render() (ResizeObserver / initial Mount), nicht bei jedem Hover.
  let cachedW = 0;
  let cachedH = 0;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cachedW = rect.width;
    cachedH = rect.height;
  }

  function drawChart(hoverX) {
    const ctx = canvas.getContext('2d');
    const W = cachedW;
    const H = cachedH;
    if (W === 0 || H === 0) return;
    ctx.clearRect(0, 0, W, H);
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const chartH = H - PAD_TOP - PAD_BOTTOM;

    const colorBorderSubtle = cssVar('--border-subtle');
    const colorTextMuted = cssVar('--text-muted');

    // Compute per-day totals for Y max
    const n = days.length;
    const totals = Array.from({ length: n }, (_, i) =>
      gameOrder.reduce((sum, g) => sum + (series[g]?.[i] ?? 0), 0)
    );
    const rawMax = n === 0 ? 0 : Math.max(...totals);
    const yMax = niceMax(rawMax);

    // Helpers: data → pixel
    function xOf(i) {
      if (n <= 1) return PAD_LEFT + chartW / 2;
      return PAD_LEFT + (i / (n - 1)) * chartW;
    }
    function yOf(val) {
      return PAD_TOP + chartH - (val / yMax) * chartH;
    }

    // Grid lines + Y labels
    ctx.strokeStyle = colorBorderSubtle;
    ctx.fillStyle = colorTextMuted;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.lineWidth = 1;
    for (let g = 0; g <= GRID_LINES; g++) {
      const val = (g / GRID_LINES) * yMax;
      const py = yOf(val);
      ctx.beginPath();
      ctx.moveTo(PAD_LEFT, py);
      ctx.lineTo(PAD_LEFT + chartW, py);
      ctx.stroke();
      ctx.fillText(String(Math.round(val)), PAD_LEFT - 4, py + 4);
    }

    // X-axis labels: first, every 5 days, last
    ctx.textAlign = 'center';
    if (n > 0) {
      const labelIndices = new Set([0, n - 1]);
      for (let i = 0; i < n; i++) {
        if (i % 5 === 0) labelIndices.add(i);
      }
      for (const i of labelIndices) {
        const px = xOf(i);
        ctx.fillText(formatGermanShortDate(days[i]), px, PAD_TOP + chartH + 18);
      }
    }

    // Empty-data guard
    const isEmpty = n === 0 || totals.every(t => t === 0);

    if (isEmpty) {
      ctx.fillStyle = colorTextMuted;
      ctx.textAlign = 'center';
      ctx.font = '14px sans-serif';
      ctx.fillText('Keine Daten in den letzten 30 Tagen', PAD_LEFT + chartW / 2, PAD_TOP + chartH / 2);
      return;
    }

    // Stacked areas + lines
    for (let gi = 0; gi < gameOrder.length; gi++) {
      const game = gameOrder[gi];
      const color = colors[game] ?? '#888';

      // Compute cumulative stacked Y for this layer and all layers below
      const cumulTop = Array.from({ length: n }, (_, i) =>
        gameOrder.slice(0, gi + 1).reduce((sum, g) => sum + (series[g]?.[i] ?? 0), 0)
      );
      const cumulBot = Array.from({ length: n }, (_, i) =>
        gameOrder.slice(0, gi).reduce((sum, g) => sum + (series[g]?.[i] ?? 0), 0)
      );

      // Filled area
      ctx.beginPath();
      // top edge left→right
      for (let i = 0; i < n; i++) {
        const px = xOf(i);
        const py = yOf(cumulTop[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      // bottom edge right→left
      for (let i = n - 1; i >= 0; i--) {
        ctx.lineTo(xOf(i), yOf(cumulBot[i]));
      }
      ctx.closePath();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Stroke (top edge only)
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const px = xOf(i);
        const py = yOf(cumulTop[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Hover indicator
    if (hoverX !== null && n > 0) {
      // Snap to nearest day
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < n; i++) {
        const dist = Math.abs(xOf(i) - hoverX);
        if (dist < bestDist) { bestDist = dist; best = i; }
      }
      const px = xOf(best);

      ctx.strokeStyle = colorTextMuted;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(px, PAD_TOP);
      ctx.lineTo(px, PAD_TOP + chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      const total = totals[best];
      const label = `Σ ${total.toLocaleString('de-DE')} am ${formatGermanShortDate(days[best])}`;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = colorTextMuted;
      ctx.fillText(label, PAD_LEFT + chartW, PAD_TOP + 14);
    }
  }

  let currentHoverX = null;

  return {
    render() {
      resizeCanvas();
      drawChart(currentHoverX);
    },
    setHover(x) {
      currentHoverX = x;
      drawChart(currentHoverX);
    },
    destroy() {
      // no-op: mouse/resize listeners registered by caller
    },
  };
}
