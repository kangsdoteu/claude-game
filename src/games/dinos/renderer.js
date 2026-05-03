// ============================================================
// renderer.js — Top-Down-Canvas für das aktive Biom.
// Liest aus State, mutiert nichts. Imports nur über logic/index.js.
// ============================================================
import { BIOME_ORIGIN, BIOME_SIZE } from './logic/index.js';

export const CANVAS_SIZE = 600;

// Pro Biom ein dezenter Hintergrundton; Akzent-Linien für die Quadranten-Mitte.
const BIOME_TINT = {
  forest: '#1f3a26',
  plain:  '#3a3a1c',
  river:  '#1c2e3a',
  rocks:  '#2e2e2e',
};

// Welt → Canvas-Koordinaten für das gegebene Biom.
function project(pos, biome) {
  const origin = BIOME_ORIGIN[biome];
  return {
    x: ((pos.x - origin.x) / BIOME_SIZE) * CANVAS_SIZE,
    y: ((pos.y - origin.y) / BIOME_SIZE) * CANVAS_SIZE,
  };
}

function isInBiome(pos, biome) {
  const o = BIOME_ORIGIN[biome];
  return pos.x >= o.x && pos.x < o.x + BIOME_SIZE
      && pos.y >= o.y && pos.y < o.y + BIOME_SIZE;
}

export function render(canvas, state) {
  const ctx    = canvas.getContext('2d');
  const biome  = state.player.biome;

  // Hintergrund
  ctx.fillStyle = BIOME_TINT[biome] ?? '#222';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Subtiles Raster
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth   = 1;
  for (let i = 1; i < 5; i++) {
    const p = (i / 5) * CANVAS_SIZE;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, CANVAS_SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(CANVAS_SIZE, p); ctx.stroke();
  }

  // Pflanzen (grüne Punkte)
  const plants = state.populations.plant[biome] ?? [];
  ctx.fillStyle = '#5cb85c';
  for (const p of plants) {
    const { x, y } = project(p.pos, biome);
    const size = 2 + (p.genes.abundance ?? 0.5) * 3;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Herbivore (cyan)
  const herbs = state.populations.herbivore[biome] ?? [];
  ctx.fillStyle = '#5bc0de';
  for (const h of herbs) {
    const { x, y } = project(h.pos, biome);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Predatoren (rote Dreiecke)
  const preds = state.populations.predator[biome] ?? [];
  ctx.fillStyle = '#d9534f';
  for (const p of preds) {
    const { x, y } = project(p.pos, biome);
    const s = 4 + (p.genes.size ?? 0.5) * 4;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x - s, y + s);
    ctx.lineTo(x + s, y + s);
    ctx.closePath();
    ctx.fill();
  }

  // Player-Herd (gold), nur wenn im aktiven Biom
  ctx.fillStyle   = '#f0ad4e';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1;
  for (const h of state.player.herd) {
    if (!isInBiome(h.pos, biome)) continue;
    const { x, y } = project(h.pos, biome);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Waypoint-Marker (Fadenkreuz), wenn im aktiven Biom
  if (state.player.waypoint && isInBiome(state.player.waypoint, biome)) {
    const { x, y } = project(state.player.waypoint, biome);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y);
    ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 14);
    ctx.stroke();
  }

  // Encounter-Indikator: roter Rahmen blinkt, wenn ungelöste Encounter wartet
  if (state.encounters.length > 0) {
    ctx.strokeStyle = '#d9534f';
    ctx.lineWidth   = 4;
    ctx.strokeRect(2, 2, CANVAS_SIZE - 4, CANVAS_SIZE - 4);
  }
}

// Liefert Welt-Koordinaten für einen Klick auf das Canvas im gegebenen Biom.
// Wird von controls.js benötigt, damit dort BIOME_ORIGIN nicht doppelt importiert wird.
export function canvasToWorld(canvasX, canvasY, biome) {
  const origin = BIOME_ORIGIN[biome];
  return {
    x: origin.x + (canvasX / CANVAS_SIZE) * BIOME_SIZE,
    y: origin.y + (canvasY / CANVAS_SIZE) * BIOME_SIZE,
  };
}
