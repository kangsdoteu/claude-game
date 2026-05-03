// ============================================================
// world.js — Spatial-Queries + Encounter-Detection
// Importiert nur state.js (für BIOMES).
// ============================================================
import { BIOMES } from './state.js';

// Welt = 1000×1000 Einheiten, 2×2-Quadranten
// [row][col]: row 0 = y<500, row 1 = y>=500; col 0 = x<500, col 1 = x>=500
const BIOME_LAYOUT = [
  ['forest', 'plain'],
  ['rocks',  'river'],
];

// Gibt das Biom für Welt-Koordinate (x, y) zurück.
export function getBiomeAt(x, y) {
  const col = x < 500 ? 0 : 1;
  const row = y < 500 ? 0 : 1;
  return BIOME_LAYOUT[row][col];
}

// Minimale Vision-Distanz-Schwelle für Encounter-Erkennung.
// Basiert auf vision-Gen: je höher, desto größer der Wahrnehmungsradius.
const BASE_VISION_RANGE = 80;

function visionRange(individual) {
  const v = individual.genes.vision ?? 0.5;
  return BASE_VISION_RANGE * (0.5 + v);
}

function dist(posA, posB) {
  const dx = posA.x - posB.x;
  const dy = posA.y - posB.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Liefert ein Array von Encounter-Deskriptoren:
// { biome, predators: [...], herbivores: [...] }
// Encounter = Spieler-Herde im selben Biom wie Predator-Untergruppe,
// innerhalb der Vision-Reichweite.
// Reine Read-Only-Query auf state.
export function findEncounters(state) {
  const playerBiome = state.player.biome;
  const playerHerd  = state.player.herd;
  if (!playerHerd.length) return [];

  // Mittelpunkt der Spieler-Herde für Distanzberechnung
  const herdCenter = playerHerd.reduce(
    (acc, ind) => ({ x: acc.x + ind.pos.x / playerHerd.length, y: acc.y + ind.pos.y / playerHerd.length }),
    { x: 0, y: 0 }
  );

  const encounters = [];
  const predPop = state.populations.predator[playerBiome];
  if (!predPop || !predPop.length) return encounters;

  // Sucht Predatoren in Biom des Spielers, die nah genug sind
  const closeEnough = predPop.filter(pred => {
    const range = visionRange(pred);
    return dist(pred.pos, herdCenter) <= range;
  });

  if (closeEnough.length > 0) {
    encounters.push({
      biome:      playerBiome,
      predators:  closeEnough,
      herbivores: playerHerd,
    });
  }
  return encounters;
}

// PHASE 2 STUB: Resolver-Formel ist out-of-scope für Phase 1.
// Vertragsform steht, Implementierung folgt in Phase 2 — bis dahin liefert
// dieser Stub einen No-Op-Outcome zurück. Aufrufer in step.js sollten das
// im Kopf behalten (kein realer Schaden, keine HP-Verluste).
export function resolveEncounter(encounter, state, rng) {
  return {
    newState: state,
    outcome: { playerLosses: 0, predatorLosses: 0 },
  };
}
