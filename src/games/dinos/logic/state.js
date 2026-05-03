// ============================================================
// state.js — Tuning-Konstanten, RNG, createState
// Keine Abhängigkeiten zu Schwester-Modulen (Wurzel-Modul).
// ============================================================

// — Welt + Archetypen —
export const ARCHETYPES = ['predator', 'herbivore', 'plant'];
export const BIOMES     = ['forest', 'plain', 'river', 'rocks'];

// — Welt-Geometrie —
// Welt = 1000×1000 Einheiten, 4 Quadranten à 500×500 (siehe world.js#BIOME_LAYOUT).
export const WORLD_SIZE = 1000;
export const BIOME_SIZE = 500;
// Ursprünge (x,y des oberen-linken Eckpunkts) je Biom — Quelle der Wahrheit für Position-Init und Renderer.
export const BIOME_ORIGIN = Object.freeze({
  forest: { x: 0,   y: 0   },
  plain:  { x: 500, y: 0   },
  rocks:  { x: 0,   y: 500 },
  river:  { x: 500, y: 500 },
});

export const GENE_SCHEMAS = Object.freeze({
  predator:  ['speed', 'size', 'armor', 'aggression', 'pack_size', 'vision', 'stamina'],
  herbivore: ['speed', 'stamina', 'size', 'vigilance', 'forage_efficiency', 'herd_cohesion'],
  plant:     ['growth_rate', 'toxicity', 'abundance', 'seed_dispersal'],
});

// Initial-Verteilung: Mittelwert-Abweichung vom Standardwert 0.5 (zentraler Grenzwertsatz).
// Schlüssel: archetype.gen → Ziel-Mittelwert. Nicht aufgeführte Gene haben Mittelwert 0.5.
export const INITIAL_GENE_BIAS = Object.freeze({
  predator:  { aggression: 0.35, pack_size: 0.35 },
  herbivore: {},
  plant:     { toxicity: 0.1 },
});

// — Populations —
export const POP_PER_BIOME = Object.freeze({
  predator:  12,
  herbivore: 18,
  plant:     30,
  player:    25,
});
export const HARD_ENTITY_CAP = 250;

// — Tick & Turn —
export const TICK_REALTIME_DEFAULT_S  = 60;
export const TICK_REALTIME_MIN_S      = 30;
export const TURN_MIN_ACTIONS_PER_GEN = 3;

// — GA-Operatoren —
export const BLX_ALPHA      = 0.3;
export const MUTATION_SIGMA = 0.08;
export const MUTATION_P     = 0.15;
export const TOURNAMENT_K   = 3;
export const ELITISM_COUNT  = 1;

// — Mutagener-Tümpel-Override —
export const MUTAGEN_SIGMA_MULT = 3;

// — Phase-Maschine —
export const PHASE = Object.freeze({
  SIMULATING: 'simulating',
  EVALUATING: 'evaluating',
  SELECTING:  'selecting',
  BREEDING:   'breeding',
  MUTATING:   'mutating',
  SPAWNING:   'spawning',
});

export const PHASE_BUDGET_INDIVIDUALS = Object.freeze({
  evaluating: 60,
  selecting:  60,
  breeding:   30,
  mutating:   60,
  spawning:   30,
});

// — Score-Aggregation —
export const SCORE_WEIGHT_GENERATIONS = 10;
export const SCORE_WEIGHT_BIOMES      = 5;
export const SCORE_PEAKPOP_DIVISOR    = 50;

// ============================================================
// Mulberry32 — deterministischer PRNG, Public Domain
// ============================================================
export function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Kanonische Variante für serialisierbaren State: Counter-Style.
// Replay = (seed, action_log) → identische Run, da kein Closure-State.
export function nextRandom(state) {
  const seed  = (state.seed ^ state.rngCounter) >>> 0;
  const value = makeRng(seed)();
  return [{ ...state, rngCounter: (state.rngCounter + 1) >>> 0 }, value];
}

// ============================================================
// Hilfs-Funktionen (nur hier verwendet)
// ============================================================

// Erzeugt einen normalisierten Float über zentralen Grenzwertsatz.
// Ziel-Mittelwert mu (Standard 0.5), drei gleichverteilte Zufallszahlen addiert.
function cltSample(rng, mu) {
  const raw = (rng() + rng() + rng()) / 3;
  // raw liegt in (0,1) mit Mittelwert ~0.5; Verschiebung um (mu - 0.5)
  return Math.min(1, Math.max(0, raw + (mu - 0.5)));
}

// Erzeugt ein einzelnes Tier-Objekt.
function createIndividual(archetype, id, rng) {
  const schema = GENE_SCHEMAS[archetype];
  const bias   = INITIAL_GENE_BIAS[archetype] || {};
  const genes  = {};
  for (const gene of schema) {
    const mu = bias[gene] !== undefined ? bias[gene] : 0.5;
    genes[gene] = cltSample(rng, mu);
  }
  return {
    id,
    archetype,
    genes,
    hp:      1,
    stamina: 1,
    age:     0,
    pos: { x: 0, y: 0 },
  };
}

// Befüllt alle Populationen mit deterministisch erzeugten Individuen.
function createPopulations(rng) {
  const populations = {};
  let idxCounter = 0;
  for (const archetype of ARCHETYPES) {
    populations[archetype] = {};
    const count = POP_PER_BIOME[archetype];
    for (const biome of BIOMES) {
      populations[archetype][biome] = [];
      for (let i = 0; i < count; i++) {
        const id = `${archetype[0]}_0_${idxCounter++}`;
        populations[archetype][biome].push(createIndividual(archetype, id, rng));
      }
    }
  }
  return populations;
}

// Erzeugt den Spieler-Herd (25 Herbivore im Start-Biom 'plain').
function createPlayerHerd(rng) {
  const herd = [];
  for (let i = 0; i < POP_PER_BIOME.player; i++) {
    const id = `h_player_${i}`;
    herd.push(createIndividual('herbivore', id, rng));
  }
  return herd;
}

// ============================================================
// createState
// ============================================================
export function createState({ mode, seed }) {
  const rng = makeRng(seed >>> 0);
  // Rng-Counter startet nach der Populations-Initialisierung. Wir tracken,
  // wie viele Calls die Populations-Erzeugung brauchte, indem wir eine
  // separate lokale rng-Instanz verwenden und den Counter manuell hochzählen.
  // Einfachste deterministisch-serialisierbare Lösung: lokale rng für Init,
  // rngCounter beginnt bei dem Wert, den wir nach Init hochgezählt haben.

  // Lokaler Call-Counter: pro cltSample 3 Calls × Genzahl × Individuen.
  // Zuverlässiger: wir zählen explizit mit einem Wrapper.
  let rngCallCount = 0;
  const trackedRng = () => { rngCallCount++; return rng(); };

  const populations = createPopulationsTracked(trackedRng);
  const playerHerd  = createPlayerHerdTracked(trackedRng);

  return {
    mode,
    seed:           seed >>> 0,
    rngCounter:     rngCallCount,
    tick:           0,
    generation:     0,
    phase:          PHASE.SIMULATING,
    phaseProgress:  0,
    pendingGeneration: null,
    populations,
    player: {
      biome:                'plain',
      herd:                 playerHerd,
      pendingAction:        null,
      // Letztes Encounter-Outcome (für UI „du hast 2 verloren, Feind 1") — null bis fight/flee feuert.
      lastEncounterOutcome: null,
      actionsThisGeneration: 0,
      waypoint:             null,
      pace:                 'walk',
    },
    events: {
      active:         [],
      pendingChoice:  null,
      // True für genau eine Generation, wenn der Spieler im Mutagen-Tümpel-Event
      // „Trinken" gewählt hat — phaseMutating multipliziert dann σ mit MUTAGEN_SIGMA_MULT.
      // phaseSpawning cleart den Flag bei der Generations-Finalisierung.
      mutagenNextGen: false,
    },
    encounters: [],
    // Sekunden, in denen findEncounters unterdrückt wird — gesetzt nach fight/flee,
    // damit der Modal nicht jeden Frame erneut auftaucht, wenn Predatoren in Reichweite bleiben.
    encounterCooldown: 0,
    metrics: {
      peakPop:              0,
      biomesExplored:       ['plain'],
      generationsSurvived:  0,
    },
    alive:     true,
    started:   false,
    startTime: null,
  };
}

// Varianten mit getracktem rng für createState-intern
function createPopulationsTracked(rng) {
  const populations = {};
  let idxCounter = 0;
  for (const archetype of ARCHETYPES) {
    populations[archetype] = {};
    const count = POP_PER_BIOME[archetype];
    for (const biome of BIOMES) {
      populations[archetype][biome] = [];
      for (let i = 0; i < count; i++) {
        const id = `${archetype[0]}_0_${idxCounter++}`;
        populations[archetype][biome].push(createIndividualTracked(archetype, id, rng, biome));
      }
    }
  }
  return populations;
}

function createPlayerHerdTracked(rng) {
  const herd = [];
  for (let i = 0; i < POP_PER_BIOME.player; i++) {
    const id = `h_player_${i}`;
    herd.push(createIndividualTracked('herbivore', id, rng, 'plain'));
  }
  return herd;
}

function createIndividualTracked(archetype, id, rng, biome) {
  const schema = GENE_SCHEMAS[archetype];
  const bias   = INITIAL_GENE_BIAS[archetype] || {};
  const genes  = {};
  for (const gene of schema) {
    const mu = bias[gene] !== undefined ? bias[gene] : 0.5;
    // cltSample inline, um getracktes rng zu nutzen
    const raw = (rng() + rng() + rng()) / 3;
    genes[gene] = Math.min(1, Math.max(0, raw + (mu - 0.5)));
  }
  // Position innerhalb des Biom-Quadranten zufällig wählen — sorgt für sichtbare
  // Streuung im Renderer und macht visionRange-basiertes findEncounters realistisch.
  const origin = BIOME_ORIGIN[biome] ?? { x: 0, y: 0 };
  return {
    id,
    archetype,
    genes,
    hp:      1,
    stamina: 1,
    age:     0,
    pos: {
      x: origin.x + rng() * BIOME_SIZE,
      y: origin.y + rng() * BIOME_SIZE,
    },
  };
}
