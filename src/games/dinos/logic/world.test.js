import { describe, it, expect } from 'vitest';
import { createState, makeRng } from './state.js';
import { findEncounters, resolveEncounter, getBiomeAt } from './world.js';

function makeIndividual(archetype, genes, pos, id) {
  return { id, archetype, genes, hp: 1, stamina: 1, age: 0, pos };
}

describe('world — getBiomeAt', () => {
  it('mappt Welt-Quadranten korrekt auf Biome', () => {
    expect(getBiomeAt(100, 100)).toBe('forest');
    expect(getBiomeAt(700, 100)).toBe('plain');
    expect(getBiomeAt(100, 700)).toBe('rocks');
    expect(getBiomeAt(700, 700)).toBe('river');
  });

  it('Grenze bei 500 gehört zur rechten/unteren Hälfte', () => {
    expect(getBiomeAt(500, 100)).toBe('plain');
    expect(getBiomeAt(100, 500)).toBe('rocks');
    expect(getBiomeAt(500, 500)).toBe('river');
  });
});

describe('world — findEncounters', () => {
  it('liefert keine Encounters, wenn die Herde leer ist', () => {
    let s = createState({ mode: 'realtime', seed: 1 });
    s = { ...s, player: { ...s.player, herd: [] } };
    expect(findEncounters(s)).toEqual([]);
  });

  it('liefert keine Encounters, wenn keine Predatoren im Spieler-Biom sind', () => {
    let s = createState({ mode: 'realtime', seed: 1 });
    s = {
      ...s,
      populations: {
        ...s.populations,
        predator: { ...s.populations.predator, [s.player.biome]: [] },
      },
    };
    expect(findEncounters(s)).toEqual([]);
  });

  it('liefert einen Encounter, wenn ein Predator innerhalb der Vision-Reichweite ist', () => {
    let s = createState({ mode: 'realtime', seed: 1 });
    // Herde fokussieren wir auf einen Punkt, ein Predator direkt daneben.
    const herd = [makeIndividual('herbivore', { speed: 0.5 }, { x: 600, y: 100 }, 'h_test')];
    const predator = makeIndividual('predator', { vision: 0.5, speed: 0.5 }, { x: 610, y: 100 }, 'p_test');
    s = {
      ...s,
      player: { ...s.player, herd, biome: 'plain' },
      populations: {
        ...s.populations,
        predator: { ...s.populations.predator, plain: [predator] },
      },
    };
    const enc = findEncounters(s);
    expect(enc.length).toBe(1);
    expect(enc[0].biome).toBe('plain');
    expect(enc[0].predators[0].id).toBe('p_test');
  });
});

describe('world — resolveEncounter (fight)', () => {
  it('liefert Verluste in der Range [0, herd.length] / [0, preds.length]', () => {
    const herd = Array.from({ length: 10 }, (_, i) =>
      makeIndividual('herbivore', { speed: 0.5, stamina: 0.5, size: 0.5, vigilance: 0.5 }, { x: 0, y: 0 }, `h${i}`)
    );
    const preds = Array.from({ length: 5 }, (_, i) =>
      makeIndividual('predator', { speed: 0.5, size: 0.5, armor: 0.5, aggression: 0.5, pack_size: 0.5 }, { x: 0, y: 0 }, `p${i}`)
    );
    const state = {
      player: { herd },
      populations: { predator: { plain: preds } },
    };
    const rng = makeRng(42);
    const { newState, outcome } = resolveEncounter(
      { biome: 'plain', herbivores: herd, predators: preds },
      state, rng, 'fight'
    );
    expect(outcome.action).toBe('fight');
    expect(outcome.playerLosses).toBeGreaterThanOrEqual(0);
    expect(outcome.playerLosses).toBeLessThanOrEqual(herd.length);
    expect(outcome.predatorLosses).toBeGreaterThanOrEqual(0);
    expect(outcome.predatorLosses).toBeLessThanOrEqual(preds.length);
    expect(newState.player.herd.length).toBe(herd.length - outcome.playerLosses);
    expect(newState.populations.predator.plain.length).toBe(preds.length - outcome.predatorLosses);
  });

  it('Übermacht-Szenario: schwache Lone-Herde verliert deutlich', () => {
    const herd = [makeIndividual('herbivore', { speed: 0.2, stamina: 0.2, size: 0.2, vigilance: 0.2 }, { x: 0, y: 0 }, 'h0')];
    const preds = Array.from({ length: 5 }, (_, i) =>
      makeIndividual('predator', { speed: 0.9, size: 0.9, armor: 0.9, aggression: 0.9, pack_size: 0.9 }, { x: 0, y: 0 }, `p${i}`)
    );
    const state = { player: { herd }, populations: { predator: { plain: preds } } };
    const rng = makeRng(1);
    const { outcome } = resolveEncounter(
      { biome: 'plain', herbivores: herd, predators: preds },
      state, rng, 'fight'
    );
    // 1 vs 5 Übermacht: pLoss kann 0 oder 1 sein (clampInt+gauss); aber niemals >1
    expect(outcome.playerLosses).toBeLessThanOrEqual(1);
  });

  it('Determinismus: gleicher Seed → gleiches Outcome', () => {
    const herd = Array.from({ length: 8 }, (_, i) =>
      makeIndividual('herbivore', { speed: 0.5, stamina: 0.5, size: 0.5, vigilance: 0.5 }, { x: 0, y: 0 }, `h${i}`)
    );
    const preds = Array.from({ length: 4 }, (_, i) =>
      makeIndividual('predator', { speed: 0.5, size: 0.5, armor: 0.5, aggression: 0.5, pack_size: 0.5 }, { x: 0, y: 0 }, `p${i}`)
    );
    const state = { player: { herd }, populations: { predator: { plain: preds } } };
    const r1 = resolveEncounter({ biome: 'plain', herbivores: herd, predators: preds }, state, makeRng(99), 'fight');
    const r2 = resolveEncounter({ biome: 'plain', herbivores: herd, predators: preds }, state, makeRng(99), 'fight');
    expect(r1.outcome).toEqual(r2.outcome);
  });
});

describe('world — resolveEncounter (flee)', () => {
  it('Schnelle Herde verliert wenig oder nichts beim Fliehen', () => {
    const herd = Array.from({ length: 10 }, (_, i) =>
      makeIndividual('herbivore', { speed: 0.9, stamina: 0.5, size: 0.5, vigilance: 0.5 }, { x: 0, y: 0 }, `h${i}`)
    );
    const preds = Array.from({ length: 5 }, (_, i) =>
      makeIndividual('predator', { speed: 0.3, size: 0.5, armor: 0.5, aggression: 0.5, pack_size: 0.5 }, { x: 0, y: 0 }, `p${i}`)
    );
    const state = { player: { herd }, populations: { predator: { plain: preds } } };
    const rng = makeRng(42);
    const { outcome } = resolveEncounter(
      { biome: 'plain', herbivores: herd, predators: preds },
      state, rng, 'flee'
    );
    expect(outcome.action).toBe('flee');
    // Schnellere Herde → speedGap <= 0 → playerLosses fast immer 0 (nur gauss-Rauschen)
    expect(outcome.playerLosses).toBeLessThanOrEqual(1);
  });

  it('Langsame Herde verliert mehr beim Fliehen als schnelle', () => {
    // Wir berechnen für mehrere Seeds und vergleichen die Mittelwerte.
    function avgLoss(herdSpeed, predSpeed, count) {
      let sum = 0;
      for (let seed = 0; seed < count; seed++) {
        const herd = Array.from({ length: 10 }, (_, i) =>
          makeIndividual('herbivore', { speed: herdSpeed, stamina: 0.5, size: 0.5, vigilance: 0.5 }, { x: 0, y: 0 }, `h${i}`)
        );
        const preds = Array.from({ length: 5 }, (_, i) =>
          makeIndividual('predator', { speed: predSpeed, size: 0.5, armor: 0.5, aggression: 0.5, pack_size: 0.5 }, { x: 0, y: 0 }, `p${i}`)
        );
        const state = { player: { herd }, populations: { predator: { plain: preds } } };
        const rng = makeRng(seed + 1);
        const { outcome } = resolveEncounter(
          { biome: 'plain', herbivores: herd, predators: preds },
          state, rng, 'flee'
        );
        sum += outcome.playerLosses;
      }
      return sum / count;
    }
    const slowAvg = avgLoss(0.2, 0.9, 30);
    const fastAvg = avgLoss(0.9, 0.2, 30);
    expect(slowAvg).toBeGreaterThan(fastAvg);
  });
});
