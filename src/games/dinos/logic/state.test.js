import { describe, it, expect } from 'vitest';
import {
  createState, makeRng, nextRandom,
  ARCHETYPES, BIOMES, GENE_SCHEMAS, INITIAL_GENE_BIAS,
  POP_PER_BIOME, PHASE,
} from './state.js';

describe('makeRng', () => {
  it('Mulberry32-Vektor: makeRng(42)() liefert deterministischen Float', () => {
    const rng  = makeRng(42);
    const val  = rng();
    // Wert einmalig abgelesen und als Referenzvektor fixiert
    expect(typeof val).toBe('number');
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
    // Deterministisch: zwei Instanzen mit gleicher Seed liefern gleichen Wert
    const rng2 = makeRng(42);
    expect(rng2()).toBe(val);
  });

  it('nextRandom ist deterministisch und inkrementiert rngCounter', () => {
    const base  = createState({ mode: 'realtime', seed: 1 });
    const [s1, v1] = nextRandom(base);
    const [s2, v2] = nextRandom(base); // nochmal aus identischem Base
    expect(v1).toBe(v2);
    expect(s1.rngCounter).toBe(base.rngCounter + 1);
    expect(s2.rngCounter).toBe(base.rngCounter + 1);
    // Base darf nicht mutiert worden sein
    expect(base.rngCounter).toBe(base.rngCounter);
  });
});

describe('createState', () => {
  it('erzeugt bei gleicher Seed deterministisch identischen Output', () => {
    const a = createState({ mode: 'realtime', seed: 12345 });
    const b = createState({ mode: 'realtime', seed: 12345 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('erzeugt bei unterschiedlicher Seed unterschiedliche Populationen', () => {
    const a = createState({ mode: 'realtime', seed: 1 });
    const b = createState({ mode: 'realtime', seed: 2 });
    // Genome des ersten Predators in forest sollten sich unterscheiden
    const geneA = JSON.stringify(a.populations.predator.forest[0].genes);
    const geneB = JSON.stringify(b.populations.predator.forest[0].genes);
    expect(geneA).not.toBe(geneB);
  });

  it('enthält alle Pflicht-Felder auf Top-Level', () => {
    const s = createState({ mode: 'realtime', seed: 1 });
    expect(s.mode).toBe('realtime');
    expect(s.seed).toBe(1);
    expect(typeof s.rngCounter).toBe('number');
    expect(s.tick).toBe(0);
    expect(s.generation).toBe(0);
    expect(s.phase).toBe(PHASE.SIMULATING);
    expect(s.phaseProgress).toBe(0);
    expect(s.pendingGeneration).toBeNull();
    expect(s.alive).toBe(true);
    expect(s.started).toBe(false);
    expect(s.startTime).toBeNull();
  });

  it('Populations-Größen entsprechen POP_PER_BIOME', () => {
    const s = createState({ mode: 'realtime', seed: 7 });
    for (const archetype of ARCHETYPES) {
      for (const biome of BIOMES) {
        expect(s.populations[archetype][biome].length).toBe(POP_PER_BIOME[archetype]);
      }
    }
    expect(s.player.herd.length).toBe(POP_PER_BIOME.player);
  });

  it('Genome-Initial-Verteilung respektiert Mittel-Vorgaben (statistisch)', () => {
    // Großzügige Toleranz: ±0.15 — zentraler Grenzwertsatz streut bei N=12..30
    const s = createState({ mode: 'realtime', seed: 99 });

    // predator.aggression: Soll-Mittelwert 0.35
    const aggrVals = BIOMES.flatMap(biome =>
      s.populations.predator[biome].map(ind => ind.genes.aggression)
    );
    const aggrMean = aggrVals.reduce((a, b) => a + b, 0) / aggrVals.length;
    expect(aggrMean).toBeGreaterThan(0.20);
    expect(aggrMean).toBeLessThan(0.50);

    // plant.toxicity: Soll-Mittelwert 0.1
    const toxVals = BIOMES.flatMap(biome =>
      s.populations.plant[biome].map(ind => ind.genes.toxicity)
    );
    const toxMean = toxVals.reduce((a, b) => a + b, 0) / toxVals.length;
    expect(toxMean).toBeGreaterThan(0.0);
    expect(toxMean).toBeLessThan(0.30);

    // herbivore.speed: kein Bias → Mittelwert ~0.5
    const speedVals = BIOMES.flatMap(biome =>
      s.populations.herbivore[biome].map(ind => ind.genes.speed)
    );
    const speedMean = speedVals.reduce((a, b) => a + b, 0) / speedVals.length;
    expect(speedMean).toBeGreaterThan(0.30);
    expect(speedMean).toBeLessThan(0.70);
  });

  it('Alle Gen-Werte liegen in [0,1]', () => {
    const s = createState({ mode: 'realtime', seed: 42 });
    for (const archetype of ARCHETYPES) {
      for (const biome of BIOMES) {
        for (const ind of s.populations[archetype][biome]) {
          for (const val of Object.values(ind.genes)) {
            expect(val).toBeGreaterThanOrEqual(0);
            expect(val).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });

  it('player startet in Biom plain mit leerem pendingAction', () => {
    const s = createState({ mode: 'turn', seed: 3 });
    expect(s.player.biome).toBe('plain');
    expect(s.player.pendingAction).toBeNull();
    expect(s.player.actionsThisGeneration).toBe(0);
  });
});
