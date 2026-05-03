// ============================================================
// step.js — Haupt-Reducer: step(state, dt, action) → newState
// Externe Reinheit: state-Argument wird nie mutiert.
// Interne Working-Copy-Mutation erlaubt (CLAUDE.md State-Updates).
// ============================================================
import {
  PHASE, PHASE_BUDGET_INDIVIDUALS,
  ARCHETYPES, BIOMES,
  POP_PER_BIOME, HARD_ENTITY_CAP,
  WORLD_SIZE, BIOME_SIZE, BIOME_ORIGIN,
  TICK_REALTIME_DEFAULT_S, TURN_MIN_ACTIONS_PER_GEN,
  ELITISM_COUNT, TOURNAMENT_K, BLX_ALPHA, MUTATION_SIGMA, MUTATION_P,
  MUTAGEN_SIGMA_MULT,
  makeRng, nextRandom,
} from './state.js';
import { selectParents, crossoverBLX, mutate } from './evo.js';
import { findEncounters, resolveEncounter, getBiomeAt } from './world.js';
import { pickEvent, applyEvent } from './events.js';

// ============================================================
// Action-Handler
// ============================================================
function applyAction(state, action) {
  if (action === null || action === undefined) return state;

  if (action === 'start') {
    if (state.started) return state;
    // tick-basiert, nicht wall-clock — Date.now() ist in logic/ verboten (CLAUDE.md).
    return { ...state, started: true, startTime: state.tick };
  }

  // Ab hier gilt: Aktion zählt für actionsThisGeneration
  let next = state;

  if (action === 'fight' || action === 'flee') {
    if (next.encounters.length === 0) return next;
    const [encounter, ...rest] = next.encounters;

    // Lokale RNG mit Counter-Tracking — der Resolver zieht 2–4 Werte (gauss × 2),
    // die wir nach dem Aufruf in state.rngCounter zurückrechnen müssen, sonst
    // bricht Determinismus.
    const [s2] = nextRandom(next);
    const localRng = makeRng((s2.seed ^ s2.rngCounter) >>> 0);
    let rngCalls = 0;
    const tracked = () => { rngCalls++; return localRng(); };

    const { newState, outcome } = resolveEncounter(encounter, s2, tracked, action);

    next = {
      ...newState,
      rngCounter: (newState.rngCounter + rngCalls) >>> 0,
      encounters: rest,
      // Cooldown: Flucht hält länger an als Stand-und-Kampf, weil die Herde Distanz
      // gewinnt. Verhindert, dass findEncounters den Modal direkt wieder auslöst.
      encounterCooldown: action === 'flee' ? 15 : 8,
      player: {
        ...newState.player,
        pendingAction: action,
        lastEncounterOutcome: outcome,
        actionsThisGeneration: newState.player.actionsThisGeneration + 1,
      },
    };
    return next;
  }

  if (action === 'endTurn') {
    if (
      next.mode === 'turn' &&
      next.phase === PHASE.SIMULATING &&
      next.player.actionsThisGeneration >= TURN_MIN_ACTIONS_PER_GEN
    ) {
      return { ...next, phase: PHASE.EVALUATING, phaseProgress: 0 };
    }
    // Bug #39: kein Increment, wenn das Mindest nicht erreicht ist — sonst kann
    // dreimal Q den Button freischalten, ohne dass der Spieler eine echte Aktion
    // (Wegpunkt/Pace) ausgeführt hat.
    return next;
  }

  if (action === 'split' || action === 'regroup') {
    next = {
      ...next,
      player: {
        ...next.player,
        pendingAction: action,
        actionsThisGeneration: next.player.actionsThisGeneration + 1,
      },
    };
    return next;
  }

  if (typeof action === 'object') {
    if (action.type === 'setWaypoint') {
      return {
        ...next,
        player: {
          ...next.player,
          waypoint: { x: action.x, y: action.y },
          actionsThisGeneration: next.player.actionsThisGeneration + 1,
        },
      };
    }
    if (action.type === 'setPace') {
      return {
        ...next,
        player: {
          ...next.player,
          pace: action.pace,
          actionsThisGeneration: next.player.actionsThisGeneration + 1,
        },
      };
    }
    if (action.type === 'eventChoice') {
      // 'lost_juveniles/adopt' verbraucht 2 RNG-Zahlen pro neuem Tier (Position).
      // Tracked-Wrapper sorgt dafür, dass rngCounter konsistent fortgeschrieben wird.
      const localRng = makeRng((next.seed ^ next.rngCounter) >>> 0);
      let rngCalls = 0;
      const tracked = () => { rngCalls++; return localRng(); };
      next = applyEvent(next, next.events.pendingChoice?.id, action.id, tracked);
      return {
        ...next,
        rngCounter: (next.rngCounter + rngCalls) >>> 0,
        player: {
          ...next.player,
          actionsThisGeneration: next.player.actionsThisGeneration + 1,
        },
      };
    }
  }

  // Unbekannte Action: defensiv ignorieren
  return state;
}

// ============================================================
// Fitness-Funktion (einfaches Skelett für Phase 1)
// Wird von phaseEvaluating verwendet.
// ============================================================
function defaultFitness(individual) {
  // Rohfitness: Gewichtung aus mehreren Genen
  const g = individual.genes;
  let fit = 0;
  if (g.speed            !== undefined) fit += g.speed * 0.3;
  if (g.stamina          !== undefined) fit += g.stamina * 0.3;
  if (g.armor            !== undefined) fit += g.armor * 0.2;
  if (g.aggression       !== undefined) fit += g.aggression * 0.2;
  if (g.forage_efficiency !== undefined) fit += g.forage_efficiency * 0.4;
  if (g.vigilance        !== undefined) fit += g.vigilance * 0.2;
  if (g.growth_rate      !== undefined) fit += g.growth_rate * 0.5;
  fit -= individual.age * 0.01;
  return Math.max(0, fit);
}

// ============================================================
// Hilfsfunktion: Cursor durch alle (archetype, biome)-Paare
// ============================================================
const ALL_SLOTS = [];
for (const archetype of ARCHETYPES) {
  for (const biome of BIOMES) {
    ALL_SLOTS.push({ archetype, biome });
  }
}

function slotIndex(archetype, biome) {
  return ALL_SLOTS.findIndex(s => s.archetype === archetype && s.biome === biome);
}

// Path-wise Klon des pendingGeneration-Buffers. Verhindert, dass Phasen den
// Caller-State (state.pendingGeneration) durch in-place push/array-write mutieren.
// Cost ist trivial: 12 Slots × kleine Arrays.
function clonePendingGeneration(pg) {
  const out = { cursor: pg.cursor, fitnesses: {}, parents: {}, children: {} };
  for (const a of ARCHETYPES) {
    out.fitnesses[a] = {};
    out.parents[a]   = {};
    out.children[a]  = {};
    for (const b of BIOMES) {
      out.fitnesses[a][b] = [...pg.fitnesses[a][b]];
      out.parents[a][b]   = [...pg.parents[a][b]];
      out.children[a][b]  = [...pg.children[a][b]];
    }
  }
  return out;
}

// ============================================================
// Phasen-Implementierungen
// Jede Funktion bekommt state, gibt newState zurück.
// PHASE_BUDGET_INDIVIDUALS steuert, wie viele Individuen pro Frame verarbeitet werden.
// ============================================================

// Bewegungs-Helfer (deterministisch, kein RNG).
function clampWorld(pos) {
  return {
    x: Math.max(0, Math.min(WORLD_SIZE - 1, pos.x)),
    y: Math.max(0, Math.min(WORLD_SIZE - 1, pos.y)),
  };
}

function moveTowards(pos, target, maxStep) {
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const distSq = dx * dx + dy * dy;
  if (distSq < 0.5) return pos;
  const dist = Math.sqrt(distSq);
  const stepLen = Math.min(dist, maxStep);
  return clampWorld({
    x: pos.x + (dx / dist) * stepLen,
    y: pos.y + (dy / dist) * stepLen,
  });
}

function phaseSimulating(state, dt) {
  const newTick = state.tick + dt;

  // 1. Player-Herd zum Waypoint driften (deterministisch, kein RNG).
  let newHerd = state.player.herd;
  if (state.player.waypoint && newHerd.length > 0) {
    const wp     = state.player.waypoint;
    const paceK  = state.player.pace === 'run' ? 1.6 : 1.0;
    newHerd = newHerd.map(ind => {
      const speed   = ind.genes.speed ?? 0.5;
      const maxStep = (40 + speed * 60) * paceK * dt;
      return { ...ind, pos: moveTowards(ind.pos, wp, maxStep) };
    });
  }

  // 2. Player-Biom aus Herd-Mittelpunkt ableiten; biomesExplored ergänzen.
  let playerBiome      = state.player.biome;
  let biomesExplored   = state.metrics.biomesExplored;
  if (newHerd.length > 0) {
    let cx = 0, cy = 0;
    for (const ind of newHerd) { cx += ind.pos.x; cy += ind.pos.y; }
    cx /= newHerd.length; cy /= newHerd.length;
    playerBiome = getBiomeAt(cx, cy);
    if (!biomesExplored.includes(playerBiome)) {
      biomesExplored = [...biomesExplored, playerBiome];
    }
  }

  // 3. Predatoren im aktiven Biom verfolgen den nächstgelegenen Herd-Member.
  let newPops = state.populations;
  if (newHerd.length > 0) {
    newPops = { ...state.populations, predator: { ...state.populations.predator } };
    for (const biome of BIOMES) {
      const preds = newPops.predator[biome];
      if (!preds.length || biome !== playerBiome) continue;
      newPops.predator[biome] = preds.map(pred => {
        let best = newHerd[0], bestSq = Infinity;
        for (const h of newHerd) {
          const dx = h.pos.x - pred.pos.x, dy = h.pos.y - pred.pos.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestSq) { bestSq = d2; best = h; }
        }
        const speed   = pred.genes.speed ?? 0.5;
        const maxStep = (30 + speed * 50) * dt;
        return { ...pred, pos: moveTowards(pred.pos, best.pos, maxStep) };
      });
    }
  }

  // Cooldown nach fight/flee abklingen lassen.
  const newCooldown = Math.max(0, (state.encounterCooldown ?? 0) - dt);

  let s = {
    ...state,
    tick:        newTick,
    populations: newPops,
    encounterCooldown: newCooldown,
    player: {
      ...state.player,
      herd:  newHerd,
      biome: playerBiome,
    },
    metrics: { ...state.metrics, biomesExplored },
  };

  // 4. Encounter-Detection (nur wenn keine offenen Encounters warten und Cooldown abgelaufen ist).
  if (s.encounters.length === 0 && newCooldown <= 0) {
    const found = findEncounters(s);
    if (found.length > 0) {
      s = { ...s, encounters: found };
    }
  }

  // 5. Peak-Population tracken.
  let total = 0;
  for (const archetype of ARCHETYPES) {
    for (const biome of BIOMES) {
      total += s.populations[archetype][biome].length;
    }
  }
  total += s.player.herd.length;
  if (total > s.metrics.peakPop) {
    s = { ...s, metrics: { ...s.metrics, peakPop: total } };
  }

  // 6. Realtime-Übergang wenn tick-Schwellenwert erreicht.
  if (s.mode === 'realtime' && s.tick >= TICK_REALTIME_DEFAULT_S) {
    return { ...s, phase: PHASE.EVALUATING, phaseProgress: 0, tick: 0 };
  }

  return s;
}

function phaseEvaluating(state) {
  // Initialisierung des pendingGeneration-Buffers beim ersten Aufruf
  let pg = state.pendingGeneration;
  if (!pg) {
    pg = {
      fitnesses: {},
      parents:   {},
      children:  {},
      cursor:    { archetype: ARCHETYPES[0], biome: BIOMES[0], i: 0 },
    };
    for (const archetype of ARCHETYPES) {
      pg.fitnesses[archetype] = {};
      pg.parents[archetype]   = {};
      pg.children[archetype]  = {};
      for (const biome of BIOMES) {
        pg.fitnesses[archetype][biome] = [];
        pg.parents[archetype][biome]   = [];
        pg.children[archetype][biome]  = [];
      }
    }
  }

  const budget   = PHASE_BUDGET_INDIVIDUALS.evaluating;
  let processed  = 0;
  // Arbeitskopie des Cursors
  let { archetype, biome, i } = pg.cursor;

  const nextPg = clonePendingGeneration(pg);

  outer: while (processed < budget) {
    const pop = state.populations[archetype][biome];
    while (i < pop.length && processed < budget) {
      nextPg.fitnesses[archetype][biome][i] = defaultFitness(pop[i]);
      i++;
      processed++;
    }
    if (i >= pop.length) {
      // Nächsten Slot
      const slotIdx = slotIndex(archetype, biome);
      if (slotIdx + 1 >= ALL_SLOTS.length) {
        // Fertig
        nextPg.cursor = { archetype, biome, i };
        const nextState = { ...state, pendingGeneration: nextPg, phase: PHASE.SELECTING, phaseProgress: 0 };
        return nextState;
      }
      const next = ALL_SLOTS[slotIdx + 1];
      archetype = next.archetype;
      biome     = next.biome;
      i         = 0;
    }
  }

  nextPg.cursor = { archetype, biome, i };
  return { ...state, pendingGeneration: nextPg };
}

function phaseSelecting(state) {
  let pg        = state.pendingGeneration;
  const budget  = PHASE_BUDGET_INDIVIDUALS.selecting;
  let processed = 0;
  let { archetype, biome, i } = pg.cursor;

  // Lokale rng für Performance (Hot-Loop)
  const rng = makeRng((state.seed ^ state.rngCounter) >>> 0);

  const nextPg = clonePendingGeneration(pg);

  let rngCallsThisPhase = 0;

  while (processed < budget) {
    const pop      = state.populations[archetype][biome];
    const fits     = nextPg.fitnesses[archetype][biome];
    const count    = POP_PER_BIOME[archetype];
    const pairs    = nextPg.parents[archetype][biome];

    while (pairs.length < count && processed < budget) {
      const fitFn   = (ind) => fits[pop.indexOf(ind)] ?? 0;
      const [a, b]  = selectParents(pop, fitFn, TOURNAMENT_K, rng);
      // jeder selectParents-Aufruf zieht k*2 Zahlen (zwei Tournaments à k Picks)
      rngCallsThisPhase += TOURNAMENT_K * 2;
      pairs.push([a, b]);
      processed++;
    }

    if (pairs.length >= count) {
      const slotIdx = slotIndex(archetype, biome);
      if (slotIdx + 1 >= ALL_SLOTS.length) {
        nextPg.cursor = { archetype, biome, i: 0 };
        // Konsistenter Counter
        const newCounter = (state.rngCounter + rngCallsThisPhase) >>> 0;
        return { ...state, pendingGeneration: nextPg, phase: PHASE.BREEDING, phaseProgress: 0, rngCounter: newCounter };
      }
      const next = ALL_SLOTS[slotIdx + 1];
      archetype  = next.archetype;
      biome      = next.biome;
      i          = 0;
    }
  }

  nextPg.cursor = { archetype, biome, i };
  const newCounter = (state.rngCounter + rngCallsThisPhase) >>> 0;
  return { ...state, pendingGeneration: nextPg, rngCounter: newCounter };
}

function phaseBreeding(state) {
  let pg        = state.pendingGeneration;
  const budget  = PHASE_BUDGET_INDIVIDUALS.breeding;
  let processed = 0;
  let { archetype, biome, i } = pg.cursor;

  const rng = makeRng((state.seed ^ state.rngCounter) >>> 0);
  let rngCallsThisPhase = 0;

  const nextPg = clonePendingGeneration(pg);

  while (processed < budget) {
    const pop      = state.populations[archetype][biome];
    const fits     = nextPg.fitnesses[archetype][biome];
    const pairs    = nextPg.parents[archetype][biome];
    const children = nextPg.children[archetype][biome];
    const count    = POP_PER_BIOME[archetype];

    // Elitism: besten ELITISM_COUNT direkt übernehmen (nur einmal, beim ersten Schritt)
    if (children.length === 0 && ELITISM_COUNT > 0) {
      const sorted = [...pop].sort((a, b) => {
        const idxA = pop.indexOf(a);
        const idxB = pop.indexOf(b);
        return (fits[idxB] ?? 0) - (fits[idxA] ?? 0);
      });
      const genIdx  = state.generation;
      const slotIdx = slotIndex(archetype, biome);
      for (let e = 0; e < Math.min(ELITISM_COUNT, pop.length); e++) {
        // Eigene id vergeben — sonst kollidieren Eltern- und Kind-Generation.
        children.push({
          ...sorted[e],
          age: sorted[e].age + 1,
          id:  `${archetype[0]}_${genIdx + 1}_${slotIdx}_e${e}`,
        });
      }
    }

    while (children.length < count && processed < budget) {
      const pairIdx = children.length - ELITISM_COUNT;
      if (pairIdx < 0 || pairIdx >= pairs.length) break;
      const [pA, pB] = pairs[pairIdx];
      const child = crossoverBLX(pA, pB, BLX_ALPHA, rng);
      // BLX-α benötigt eine rng-Zahl pro Gen + 2 für Position
      rngCallsThisPhase += Object.keys(pA.genes).length + 2;
      const genIdx = state.generation;
      const slotIdx = slotIndex(archetype, biome);
      child.id  = `${archetype[0]}_${genIdx + 1}_${slotIdx}_${children.length}`;
      const origin = BIOME_ORIGIN[biome];
      child.pos = {
        x: origin.x + rng() * BIOME_SIZE,
        y: origin.y + rng() * BIOME_SIZE,
      };
      children.push(child);
      processed++;
    }

    if (children.length >= count) {
      const slotIdx = slotIndex(archetype, biome);
      if (slotIdx + 1 >= ALL_SLOTS.length) {
        nextPg.cursor = { archetype, biome, i: 0 };
        const newCounter = (state.rngCounter + rngCallsThisPhase) >>> 0;
        return { ...state, pendingGeneration: nextPg, phase: PHASE.MUTATING, phaseProgress: 0, rngCounter: newCounter };
      }
      const next = ALL_SLOTS[slotIdx + 1];
      archetype  = next.archetype;
      biome      = next.biome;
      i          = 0;
    }
  }

  nextPg.cursor = { archetype, biome, i };
  const newCounter = (state.rngCounter + rngCallsThisPhase) >>> 0;
  return { ...state, pendingGeneration: nextPg, rngCounter: newCounter };
}

function phaseMutating(state) {
  let pg        = state.pendingGeneration;
  const budget  = PHASE_BUDGET_INDIVIDUALS.mutating;
  let processed = 0;
  let { archetype, biome, i } = pg.cursor;

  const rng = makeRng((state.seed ^ state.rngCounter) >>> 0);
  let rngCallsThisPhase = 0;

  // Mutagen-Tümpel-Override: phaseSpawning der nächsten Generation cleart den Flag
  // wieder, sodass der Multiplikator nur eine Generation gilt.
  const sigma = state.events?.mutagenNextGen
    ? MUTATION_SIGMA * MUTAGEN_SIGMA_MULT
    : MUTATION_SIGMA;

  const nextPg = clonePendingGeneration(pg);

  while (processed < budget) {
    const children = nextPg.children[archetype][biome];
    const count    = children.length;

    while (i < count && processed < budget) {
      const child    = children[i];
      const mutGenes = mutate(child.genes, sigma, MUTATION_P, rng);
      // pro Gen: 1 rng() für p-Check + bis zu 2 für gauss (Box-Muller)
      rngCallsThisPhase += Object.keys(child.genes).length * 3;
      children[i] = { ...child, genes: mutGenes };
      i++;
      processed++;
    }

    if (i >= count) {
      const slotIdx = slotIndex(archetype, biome);
      if (slotIdx + 1 >= ALL_SLOTS.length) {
        nextPg.cursor = { archetype, biome, i };
        const newCounter = (state.rngCounter + rngCallsThisPhase) >>> 0;
        return { ...state, pendingGeneration: nextPg, phase: PHASE.SPAWNING, phaseProgress: 0, rngCounter: newCounter };
      }
      const next = ALL_SLOTS[slotIdx + 1];
      archetype  = next.archetype;
      biome      = next.biome;
      i          = 0;
    }
  }

  nextPg.cursor = { archetype, biome, i };
  const newCounter = (state.rngCounter + rngCallsThisPhase) >>> 0;
  return { ...state, pendingGeneration: nextPg, rngCounter: newCounter };
}

function phaseSpawning(state) {
  let pg        = state.pendingGeneration;
  const budget  = PHASE_BUDGET_INDIVIDUALS.spawning;
  let processed = 0;
  let { archetype, biome, i } = pg.cursor;

  // Arbeitskopie der Populations
  const newPops = { ...state.populations };
  for (const a of ARCHETYPES) {
    newPops[a] = { ...state.populations[a] };
  }

  while (processed < budget) {
    const children = pg.children[archetype][biome];

    // Neue Population schreiben (HARD_ENTITY_CAP beachten)
    if (i === 0) {
      newPops[archetype][biome] = children.slice(0, HARD_ENTITY_CAP);
    }

    i = children.length; // Slot als erledigt markieren

    const slotIdx = slotIndex(archetype, biome);
    if (slotIdx + 1 >= ALL_SLOTS.length) {
      // Alle Slots gespawned — Generation abschließen
      const newGen  = state.generation + 1;
      let finalState = {
        ...state,
        populations:       newPops,
        pendingGeneration: null,
        generation:        newGen,
        phase:             PHASE.SIMULATING,
        phaseProgress:     0,
        tick:              0,
        player: {
          ...state.player,
          actionsThisGeneration: 0,
        },
        // Mutagen-Flag zurücksetzen (er gilt nur für die soeben abgeschlossene
        // Generation der Mutation), Encounter-Cooldown ebenfalls neu starten.
        events: {
          ...state.events,
          mutagenNextGen: false,
        },
        metrics: {
          ...state.metrics,
          generationsSurvived: newGen,
        },
      };

      // Event-Trigger einmal pro Generations-Übergang: pickEvent zieht
      // genau eine RNG-Zahl (Threshold-Check) und ggf. weitere bei Auswahl.
      // Counter wird nach dem Aufruf konsistent fortgeschrieben.
      const localRng = makeRng((finalState.seed ^ finalState.rngCounter) >>> 0);
      let rngCalls = 0;
      const tracked = () => { rngCalls++; return localRng(); };
      const eventId = pickEvent(finalState, tracked);
      if (eventId) {
        finalState = applyEvent(finalState, eventId, null);
      }
      finalState = {
        ...finalState,
        rngCounter: (finalState.rngCounter + rngCalls) >>> 0,
      };
      return finalState;
    }
    const next = ALL_SLOTS[slotIdx + 1];
    archetype  = next.archetype;
    biome      = next.biome;
    i          = 0;
    processed++;
  }

  return { ...state, populations: newPops, pendingGeneration: { ...pg, cursor: { archetype, biome, i } } };
}

// ============================================================
// advancePhase — ein Phase-Schritt pro Aufruf
// ============================================================
function advancePhase(state, dt) {
  switch (state.phase) {
    case PHASE.SIMULATING:  return phaseSimulating(state, dt);
    case PHASE.EVALUATING:  return phaseEvaluating(state);
    case PHASE.SELECTING:   return phaseSelecting(state);
    case PHASE.BREEDING:    return phaseBreeding(state);
    case PHASE.MUTATING:    return phaseMutating(state);
    case PHASE.SPAWNING:    return phaseSpawning(state);
    default:                return state;
  }
}

// ============================================================
// Sterbe-Bedingung prüfen
// ============================================================
function checkAlive(state) {
  if (state.player.herd.length === 0) {
    return {
      ...state,
      alive: false,
      metrics: { ...state.metrics, generationsSurvived: state.generation },
    };
  }
  return state;
}

// ============================================================
// step — öffentlicher Reducer
// ============================================================
export function step(state, dt, action) {
  if (!state.alive) return state;

  let s = applyAction(state, action);
  s = advancePhase(s, dt ?? 0);
  s = checkAlive(s);

  // Turn-Mode: GA-Phasen in einem einzigen step() synchron durchlaufen,
  // da kein Frame-Pacing existiert (Spec B.5).
  if (s.mode === 'turn' && s.phase !== PHASE.SIMULATING && s.alive) {
    while (s.phase !== PHASE.SIMULATING && s.alive) {
      s = advancePhase(s, 0);
      s = checkAlive(s);
    }
  }

  return s;
}
