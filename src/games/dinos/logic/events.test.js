import { describe, it, expect } from 'vitest';
import { createState, MUTAGEN_SIGMA_MULT } from './state.js';
import { EVENTS, pickEvent, applyEvent } from './events.js';
import { step } from './step.js';
import { PHASE } from './state.js';

describe('events — pickEvent', () => {
  it('liefert null, wenn der Threshold-Wurf > 0.3 ist', () => {
    const s = createState({ mode: 'turn', seed: 1 });
    // konstanter rng > 0.3 ⇒ kein Event
    const rng = () => 0.5;
    expect(pickEvent(s, rng)).toBeNull();
  });

  it('liefert eine eventId aus der gewichteten Auswahl, wenn rng <= 0.3', () => {
    const s = createState({ mode: 'turn', seed: 1 });
    // rng-Sequenz: 0.1 (passt threshold) → 0.0 (erstes Bucket trifft sicher)
    const seq = [0.1, 0.0];
    let i = 0;
    const rng = () => seq[i++] ?? 0;
    const id = pickEvent(s, rng);
    expect(id).not.toBeNull();
    expect(EVENTS[id]).toBeDefined();
  });

  it('filtert Events nach Spieler-Biom (drought_river nur in river)', () => {
    let s = createState({ mode: 'turn', seed: 1 });
    s = { ...s, player: { ...s.player, biome: 'plain' } };
    // Konstanter rng = 0 → würde immer das erste passende Bucket nehmen.
    const rng = () => 0;
    // Mehrfach ziehen — drought_river darf nicht erscheinen, da Biom 'plain' ist.
    const seen = new Set();
    for (let k = 0; k < 20; k++) {
      const id = pickEvent({ ...s, rngCounter: k }, rng);
      if (id) seen.add(id);
    }
    expect(seen.has('drought_river')).toBe(false);
  });
});

describe('events — applyEvent (auto)', () => {
  it('drought_river reduziert plant.abundance im River-Biom um 40%', () => {
    let s = createState({ mode: 'turn', seed: 7 });
    const before = s.populations.plant.river.map(p => p.genes.abundance);
    s = applyEvent(s, 'drought_river', null, () => 0);
    const after = s.populations.plant.river.map(p => p.genes.abundance);
    for (let i = 0; i < before.length; i++) {
      expect(after[i]).toBeCloseTo(before[i] * 0.6, 5);
    }
  });

  it('predator_migration erhöht aggression der Predatoren im Spieler-Biom um 0.05', () => {
    let s = createState({ mode: 'turn', seed: 7 });
    const biome = s.player.biome;
    const before = s.populations.predator[biome].map(p => p.genes.aggression);
    s = applyEvent(s, 'predator_migration', null, () => 0);
    const after = s.populations.predator[biome].map(p => p.genes.aggression);
    for (let i = 0; i < before.length; i++) {
      expect(after[i]).toBeCloseTo(Math.min(1, before[i] + 0.05), 5);
    }
  });

  it('clampt aggression bei 1.0', () => {
    let s = createState({ mode: 'turn', seed: 7 });
    const biome = s.player.biome;
    const preds = s.populations.predator[biome].map(p => ({ ...p, genes: { ...p.genes, aggression: 0.99 } }));
    s = {
      ...s,
      populations: { ...s.populations, predator: { ...s.populations.predator, [biome]: preds } },
    };
    s = applyEvent(s, 'predator_migration', null, () => 0);
    for (const p of s.populations.predator[biome]) {
      expect(p.genes.aggression).toBeLessThanOrEqual(1);
    }
  });
});

describe('events — applyEvent (choice)', () => {
  it('setzt pendingChoice, wenn keine choiceId angegeben ist', () => {
    let s = createState({ mode: 'turn', seed: 7 });
    s = applyEvent(s, 'mutagen_pool', null, () => 0);
    expect(s.events.pendingChoice).not.toBeNull();
    expect(s.events.pendingChoice.id).toBe('mutagen_pool');
    expect(s.events.pendingChoice.choices.length).toBe(2);
  });

  it('mutagen_pool/drink setzt mutagenNextGen, leert pendingChoice', () => {
    let s = createState({ mode: 'turn', seed: 7 });
    s = applyEvent(s, 'mutagen_pool', null, () => 0);
    s = applyEvent(s, 'mutagen_pool', 'drink', () => 0);
    expect(s.events.mutagenNextGen).toBe(true);
    expect(s.events.pendingChoice).toBeNull();
  });

  it('lost_juveniles/adopt fügt bis zu 5 Tiere hinzu (mit RNG für Position)', () => {
    let s = createState({ mode: 'turn', seed: 7 });
    const before = s.player.herd.length;
    s = applyEvent(s, 'lost_juveniles', null, () => 0);
    s = applyEvent(s, 'lost_juveniles', 'adopt', () => 0.5);
    const added = s.player.herd.length - before;
    expect(added).toBeGreaterThan(0);
    expect(added).toBeLessThanOrEqual(5);
    // alle neuen Tiere haben gültige Positionen
    for (const ind of s.player.herd.slice(before)) {
      expect(ind.pos.x).toBeGreaterThanOrEqual(0);
      expect(ind.pos.y).toBeGreaterThanOrEqual(0);
    }
  });

  it('lost_juveniles/leave ändert die Herde nicht', () => {
    let s = createState({ mode: 'turn', seed: 7 });
    const before = s.player.herd.length;
    s = applyEvent(s, 'lost_juveniles', null, () => 0);
    s = applyEvent(s, 'lost_juveniles', 'leave', () => 0);
    expect(s.player.herd.length).toBe(before);
    expect(s.events.pendingChoice).toBeNull();
  });
});

describe('events — Mutagen-Tümpel-Override in Mutation-Phase', () => {
  it('mutagenNextGen wird nach der Generations-Finalisierung wieder gecleart', () => {
    // Generations-Übergang in Turn-Mode triggern, mit gesetztem Flag.
    let s = createState({ mode: 'turn', seed: 7 });
    s = { ...s, events: { ...s.events, mutagenNextGen: true } };
    // Direkt zu EVALUATING springen und durchlaufen lassen.
    s = { ...s, phase: PHASE.EVALUATING, phaseProgress: 0 };
    // step im turn-Mode läuft die GA-Phasen synchron durch
    s = step(s, 0, null);
    expect(s.events.mutagenNextGen).toBe(false);
    expect(s.phase).toBe(PHASE.SIMULATING);
    expect(s.generation).toBe(1);
  });

  it('MUTAGEN_SIGMA_MULT ist ein positiver Multiplikator > 1', () => {
    expect(MUTAGEN_SIGMA_MULT).toBeGreaterThan(1);
  });
});

describe('events — Determinismus', () => {
  it('Zwei identische Seeds erzeugen denselben Generations-Übergang inklusive Event-Pick', () => {
    const s1 = step({ ...createState({ mode: 'turn', seed: 99 }), phase: PHASE.EVALUATING }, 0, null);
    const s2 = step({ ...createState({ mode: 'turn', seed: 99 }), phase: PHASE.EVALUATING }, 0, null);
    expect(s1.events.pendingChoice).toEqual(s2.events.pendingChoice);
    expect(s1.events.mutagenNextGen).toBe(s2.events.mutagenNextGen);
    expect(s1.rngCounter).toBe(s2.rngCounter);
  });
});
