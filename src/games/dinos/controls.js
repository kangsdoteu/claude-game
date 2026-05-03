// ============================================================
// controls.js — Click-Waypoint, Tastatur-Aktionen, Cleanup-Vertrag.
// Imports nur über logic/index.js + renderer.js (für canvasToWorld).
// ============================================================
import { canvasToWorld } from './renderer.js';

// dispatch erwartet eine action, die vom Caller an step() weitergereicht wird.
// getState liefert den aktuellen State (für Encounter-Check und aktives Biom).
export function bindControls(canvas, dispatch, getState) {
  function onCanvasClick(e) {
    const state = getState();
    if (!state.alive || !state.started) return;
    // Waypoint nur setzen, wenn keine offene Encounter-Wahl ansteht (sonst soll der
    // Spieler erst F/R drücken — Klick darf das nicht überstimmen).
    if (state.encounters.length > 0) return;
    const rect = canvas.getBoundingClientRect();
    const cx   = ((e.clientX - rect.left) / rect.width)  * canvas.width;
    const cy   = ((e.clientY - rect.top)  / rect.height) * canvas.height;
    const wp   = canvasToWorld(cx, cy, state.player.biome);
    dispatch({ type: 'setWaypoint', x: wp.x, y: wp.y });
  }

  function onKeyDown(e) {
    // Globale Guard: in Inputs/Dialogen nichts schlucken (siehe CLAUDE.md).
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.closest('dialog[open]')) return;
    if (e.repeat) return;

    const state = getState();
    if (!state.alive) return;

    // Encounter-Hotkeys: nur aktiv, wenn etwas in der Queue steht.
    if (state.encounters.length > 0) {
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); dispatch('fight'); return; }
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); dispatch('flee');  return; }
      return;
    }

    // Turn-Mode: Q schließt einen Spielzug ab (nur Effekt, wenn Bedingungen passen).
    if ((e.key === 'q' || e.key === 'Q') && state.mode === 'turn') {
      e.preventDefault();
      dispatch('endTurn');
      return;
    }

    // Pace-Toggle (nützlich, bevor Encounter-Cluster erreicht wird).
    if (e.key === ' ') {
      e.preventDefault();
      dispatch({ type: 'setPace', pace: state.player.pace === 'run' ? 'walk' : 'run' });
      return;
    }
  }

  canvas.addEventListener('click', onCanvasClick);
  document.addEventListener('keydown', onKeyDown);

  return function cleanup() {
    canvas.removeEventListener('click', onCanvasClick);
    document.removeEventListener('keydown', onKeyDown);
  };
}
