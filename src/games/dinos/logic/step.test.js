import { describe, it, expect } from 'vitest';
import { createState } from './state.js';
import { step } from './step.js';
import { PHASE, TICK_REALTIME_DEFAULT_S, TURN_MIN_ACTIONS_PER_GEN, HARD_ENTITY_CAP, ARCHETYPES, BIOMES } from './state.js';

// Hilfsfunktion: zählt alle Entities im State (ohne Player-Herd)
function countEntities(state) {
  let total = 0;
  for (const archetype of ARCHETYPES) {
    for (const biome of BIOMES) {
      total += state.populations[archetype][biome].length;
    }
  }
  return total;
}

describe('step — Immutabilitäts-Vertrag', () => {
  it('step(state, 0, null) mutiert das übergebene State-Objekt NICHT', () => {
    const initial = createState({ mode: 'realtime', seed: 42 });
    const frozen  = JSON.stringify(initial);
    step(initial, 0, null);
    expect(JSON.stringify(initial)).toBe(frozen);
  });

  it('gibt bei !alive sofort den gleichen State zurück', () => {
    const s    = { ...createState({ mode: 'realtime', seed: 1 }), alive: false };
    const result = step(s, 1, null);
    expect(result).toBe(s);
  });
});

describe('step — Determinismus', () => {
  it('step(state, dt, null) ist deterministisch: gleicher Input → identischer Output', () => {
    const s    = createState({ mode: 'realtime', seed: 7 });
    const r1   = step(s, 0.016, null);
    const r2   = step(s, 0.016, null);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});

describe('step — Phasen-Übergänge (Realtime)', () => {
  it('dt-Akkumulation jenseits TICK_REALTIME_DEFAULT_S setzt phase=EVALUATING', () => {
    let s = createState({ mode: 'realtime', seed: 1 });
    s = step(s, 0, 'start');
    // dt groß genug, um den Schwellenwert in einem Schritt zu überschreiten
    const result = step(s, TICK_REALTIME_DEFAULT_S + 1, null);
    expect(result.phase).toBe(PHASE.EVALUATING);
  });

  it('dt-Akkumulation unter Schwellenwert lässt phase=SIMULATING', () => {
    let s = createState({ mode: 'realtime', seed: 1 });
    s = step(s, 0, 'start');
    const result = step(s, TICK_REALTIME_DEFAULT_S * 0.5, null);
    expect(result.phase).toBe(PHASE.SIMULATING);
  });
});

describe('step — Phasen-Übergänge (Turn-Mode)', () => {
  it('endTurn vor TURN_MIN_ACTIONS_PER_GEN ist No-Op für Phase', () => {
    let s = createState({ mode: 'turn', seed: 1 });
    s = step(s, 0, 'start');
    // Noch keine Aktionen → endTurn darf Phase nicht wechseln
    const result = step(s, 0, 'endTurn');
    expect(result.phase).toBe(PHASE.SIMULATING);
  });

  it('Turn-Mode: endTurn nach TURN_MIN_ACTIONS_PER_GEN durchläuft alle GA-Phasen synchron', () => {
    let s = createState({ mode: 'turn', seed: 2 });
    s = step(s, 0, 'start');
    // Genug Aktionen ansammeln
    for (let i = 0; i < TURN_MIN_ACTIONS_PER_GEN; i++) {
      s = step(s, 0, 'split'); // jede Aktion zählt
    }
    expect(s.player.actionsThisGeneration).toBeGreaterThanOrEqual(TURN_MIN_ACTIONS_PER_GEN);
    // endTurn → sollte nach synchronem GA-Durchlauf wieder bei SIMULATING landen
    const result = step(s, 0, 'endTurn');
    expect(result.phase).toBe(PHASE.SIMULATING);
    // Generation muss um 1 gestiegen sein
    expect(result.generation).toBe(1);
  });
});

describe('step — Action-Handler', () => {
  it('start setzt started=true und startTime', () => {
    const s      = createState({ mode: 'realtime', seed: 1 });
    const result = step(s, 0, 'start');
    expect(result.started).toBe(true);
    expect(result.startTime).not.toBeNull();
  });

  it('start ist idempotent', () => {
    const s   = createState({ mode: 'realtime', seed: 1 });
    const r1  = step(s, 0, 'start');
    const r2  = step(r1, 0, 'start');
    expect(r2.startTime).toBe(r1.startTime);
  });

  it('unbekannte Action gibt State unverändert zurück', () => {
    const s    = createState({ mode: 'realtime', seed: 1 });
    const r    = step(s, 0, 'thisShouldBeIgnored');
    expect(JSON.stringify(r)).toBe(JSON.stringify(step(s, 0, null)));
  });
});

describe('step — HARD_ENTITY_CAP', () => {
  it('nach Spawning sind nie mehr als HARD_ENTITY_CAP Entities in populations', () => {
    // Turn-Mode durchläuft eine vollständige Generation
    let s = createState({ mode: 'turn', seed: 5 });
    s = step(s, 0, 'start');
    for (let i = 0; i < TURN_MIN_ACTIONS_PER_GEN; i++) {
      s = step(s, 0, 'split');
    }
    const result = step(s, 0, 'endTurn');
    expect(result.phase).toBe(PHASE.SIMULATING);
    const total = countEntities(result);
    expect(total).toBeLessThanOrEqual(HARD_ENTITY_CAP);
  });
});
