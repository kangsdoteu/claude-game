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

// ============================================================
// Encounter-Resolver — deterministische Auflösung eines Aufeinandertreffens.
// ============================================================
// Stärke pro Tier: Genom-Wichtung + Klein-Bias (kein RNG hier).
// Werte gewählt so, dass eine Standard-Herde (~25 × ~0.18) ~4.5 Einheiten
// liefert, eine kleine Predator-Gruppe (~5 × ~0.20) ~1.0 — Default-Spiel
// produziert beim Kampf 0–2 Verluste pro Seite, beim Flucht 0–1 Verluste
// auf Spielerseite, fast nie auf Predator-Seite. Lone-Herd-vs-Übermacht
// triggert Game-Over (siehe Tests).

function herdStrength(h) {
  const g = h.genes;
  return (g.speed     ?? 0.5) * 0.30
       + (g.stamina   ?? 0.5) * 0.30
       + (g.size      ?? 0.5) * 0.20
       + (g.vigilance ?? 0.5) * 0.20;
}

function predStrength(p) {
  const g = p.genes;
  return (g.speed      ?? 0.5) * 0.30
       + (g.size       ?? 0.5) * 0.20
       + (g.armor      ?? 0.5) * 0.20
       + (g.aggression ?? 0.5) * 0.20
       + (g.pack_size  ?? 0.5) * 0.10;
}

// Box-Muller-Transform — eigene Kopie, um Zirkel mit evo.js zu vermeiden.
function gauss(rng, sigma) {
  let u;
  do { u = rng(); } while (u === 0);
  const v = rng();
  return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clampInt(n, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

// Auflösung eines Encounters. Verbraucht 2–4 RNG-Calls (gauss = 2 pro Seite).
// Aufrufer (step.js) muss den Counter um die tatsächlichen Calls erhöhen.
export function resolveEncounter(encounter, state, rng, action = 'fight') {
  const herd  = encounter.herbivores;
  const preds = encounter.predators;

  // Aggregierte Stärken
  const PS = herd.reduce((s, h)  => s + herdStrength(h),  0);
  const ES = preds.reduce((s, p) => s + predStrength(p), 0);
  const ratio = PS / (ES + 1e-6);

  let pLoss, eLoss;
  if (action === 'flee') {
    // Flucht: Verluste skalieren mit Speed-Differenz; oft 0, bei langsamen Herden mehr.
    const herdSpd = herd.reduce((s, h)  => s + (h.genes.speed ?? 0.5), 0) / Math.max(1, herd.length);
    const predSpd = preds.reduce((s, p) => s + (p.genes.speed ?? 0.5), 0) / Math.max(1, preds.length);
    const speedGap = Math.max(0, predSpd - herdSpd);
    pLoss = clampInt(speedGap * preds.length * 0.8 + gauss(rng, 0.4), 0, herd.length);
    eLoss = clampInt(gauss(rng, 0.2), 0, preds.length);
  } else {
    // Kampf: Verluste hängen vom Stärke-Verhältnis ab. Schwächere Seite blutet stärker.
    pLoss = clampInt(ES * 0.05 / Math.max(0.2, ratio) + gauss(rng, 0.5), 0, herd.length);
    eLoss = clampInt(PS * 0.04 * Math.min(2.5, ratio) + gauss(rng, 0.3), 0, preds.length);
  }

  // Opferauswahl: schwächste zuerst (deterministisch, kein zusätzlicher RNG-Verbrauch).
  const pVictims = [...herd ].sort((a, b) => herdStrength(a) - herdStrength(b)).slice(0, pLoss);
  const eVictims = [...preds].sort((a, b) => predStrength(a) - predStrength(b)).slice(0, eLoss);
  const pIds = new Set(pVictims.map(x => x.id));
  const eIds = new Set(eVictims.map(x => x.id));

  const newHerd         = state.player.herd.filter(h => !pIds.has(h.id));
  const biome           = encounter.biome;
  const newPredsInBiome = state.populations.predator[biome].filter(p => !eIds.has(p.id));

  const newState = {
    ...state,
    player: { ...state.player, herd: newHerd },
    populations: {
      ...state.populations,
      predator: { ...state.populations.predator, [biome]: newPredsInBiome },
    },
  };

  return {
    newState,
    outcome: { playerLosses: pLoss, predatorLosses: eLoss, action },
  };
}
