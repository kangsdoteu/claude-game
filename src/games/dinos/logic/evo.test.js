import { describe, it, expect } from 'vitest';
import { makeRng } from './state.js';
import { selectParents, crossoverBLX, mutate } from './evo.js';

// Hilfsfunktion: erzeugt ein minimales Tier-Objekt mit gegebenen Gen-Werten
function makeIndividual(genes, id = 'test') {
  return { id, archetype: 'herbivore', genes, hp: 1, stamina: 1, age: 0, pos: { x: 0, y: 0 } };
}

describe('crossoverBLX', () => {
  it('mit alpha=0 liegt Kindgenom im konvexen Hülle der Eltern', () => {
    const rng = makeRng(1);
    const pA  = makeIndividual({ speed: 0.3, stamina: 0.2 }, 'a');
    const pB  = makeIndividual({ speed: 0.7, stamina: 0.8 }, 'b');
    const child = crossoverBLX(pA, pB, 0, rng);
    // alpha=0: lo=min(a,b), hi=max(a,b) → Kind exakt in [min,max]
    expect(child.genes.speed).toBeGreaterThanOrEqual(0.3);
    expect(child.genes.speed).toBeLessThanOrEqual(0.7);
    expect(child.genes.stamina).toBeGreaterThanOrEqual(0.2);
    expect(child.genes.stamina).toBeLessThanOrEqual(0.8);
  });

  it('mit alpha>0 kann Kind außerhalb der Eltern-Range liegen (aber in [0,1])', () => {
    // Viele Kinder erzeugen und prüfen ob Klemmung wirkt
    const rng  = makeRng(42);
    const pA   = makeIndividual({ speed: 0.45 }, 'a');
    const pB   = makeIndividual({ speed: 0.55 }, 'b');
    let sawOutside = false;
    for (let i = 0; i < 50; i++) {
      const child = crossoverBLX(pA, pB, 0.5, rng);
      const v = child.genes.speed;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      if (v < 0.45 || v > 0.55) sawOutside = true;
    }
    // Mit alpha=0.5 soll mindestens ein Kind außerhalb [0.45, 0.55] landen
    expect(sawOutside).toBe(true);
  });

  it('Kind hat archetype des ersten Elternteils und hp=1, age=0', () => {
    const rng   = makeRng(7);
    const pA    = makeIndividual({ speed: 0.5 }, 'a');
    pA.archetype = 'predator';
    const pB    = makeIndividual({ speed: 0.5 }, 'b');
    pB.archetype = 'predator';
    const child = crossoverBLX(pA, pB, 0.3, rng);
    expect(child.archetype).toBe('predator');
    expect(child.hp).toBe(1);
    expect(child.age).toBe(0);
  });

  it('identische Eltern → identisches Kind', () => {
    const rng = makeRng(5);
    const pA  = makeIndividual({ speed: 0.4, stamina: 0.6 }, 'a');
    const pB  = makeIndividual({ speed: 0.4, stamina: 0.6 }, 'b');
    const child = crossoverBLX(pA, pB, 0.3, rng);
    expect(child.genes.speed).toBe(0.4);
    expect(child.genes.stamina).toBe(0.6);
  });
});

describe('mutate', () => {
  it('p=0 lässt Genom unverändert', () => {
    const rng    = makeRng(1);
    const genome = { speed: 0.4, stamina: 0.7, size: 0.3 };
    const result = mutate(genome, 0.08, 0, rng);
    expect(result).toEqual(genome);
  });

  it('p=1 verändert mindestens ein Gen (deterministisch mit fester Seed)', () => {
    const rng    = makeRng(123);
    const genome = { speed: 0.4, stamina: 0.7, size: 0.3 };
    const result = mutate(genome, 0.08, 1, rng);
    // Mit p=1 werden alle Gene mutiert → mindestens eines muss sich geändert haben
    const changed = Object.keys(genome).some(k => result[k] !== genome[k]);
    expect(changed).toBe(true);
  });

  it('mutiierte Gen-Werte liegen in [0,1]', () => {
    const rng    = makeRng(999);
    const genome = { speed: 0.01, stamina: 0.99, size: 0.5 };
    for (let i = 0; i < 20; i++) {
      const result = mutate(genome, 0.5, 1, rng); // großes sigma → Klemmung nötig
      for (const v of Object.values(result)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('selectParents', () => {
  it('ist deterministisch via injizierte rng', () => {
    const pop     = Array.from({ length: 10 }, (_, i) =>
      makeIndividual({ speed: i * 0.1 }, `ind_${i}`)
    );
    const fitFn   = (ind) => ind.genes.speed;
    const [a1, b1] = selectParents(pop, fitFn, 3, makeRng(7));
    const [a2, b2] = selectParents(pop, fitFn, 3, makeRng(7));
    expect(a1.id).toBe(a2.id);
    expect(b1.id).toBe(b2.id);
  });

  it('bei monotoner Fitness wird häufiger der Top-Kandidat gewählt', () => {
    const pop   = Array.from({ length: 10 }, (_, i) =>
      makeIndividual({ speed: i / 9 }, `ind_${i}`)
    );
    const fitFn = (ind) => ind.genes.speed;
    const rng   = makeRng(42);

    const countTopA = {};
    const N = 200;
    for (let i = 0; i < N; i++) {
      const [a] = selectParents(pop, fitFn, 3, rng);
      countTopA[a.id] = (countTopA[a.id] ?? 0) + 1;
    }
    // ind_9 (Fitness 1.0) sollte am häufigsten gewählt werden
    const topId = Object.entries(countTopA).sort((a, b) => b[1] - a[1])[0][0];
    expect(topId).toBe('ind_9');
  });

  it('gibt zwei Elternteile zurück', () => {
    const pop   = [makeIndividual({ speed: 0.5 }, 'x')];
    const fitFn = () => 1;
    const [a, b] = selectParents(pop, fitFn, 1, makeRng(1));
    expect(a).toBeDefined();
    expect(b).toBeDefined();
  });
});
