// ============================================================
// evo.js — GA-Operatoren: Tournament-Selection, BLX-α, Mutation
// Reine Funktionen; rng wird immer als Parameter injiziert.
// Keine Abhängigkeiten zu step.js / world.js / events.js.
// ============================================================

// Box-Muller-Transform: erzeugt eine normalverteilte Zahl N(0, sigma).
// Benötigt zwei gleichverteilte Zufallszahlen aus [0,1).
function gauss(rng, sigma) {
  // Verwirft u=0, da log(0) undefiniert
  let u, v;
  do { u = rng(); } while (u === 0);
  v = rng();
  return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(v) {
  return Math.min(1, Math.max(0, v));
}

// Führt zwei unabhängige k-Tournament-Runs aus und gibt [parentA, parentB] zurück.
// Bei gleicher rng-Sequenz ist das Ergebnis deterministisch.
// A und B dürfen identisch sein (kein Verbot).
export function selectParents(population, fitnessFn, k, rng) {
  function tournament() {
    // Zieht k Kandidaten mit Zurücklegen
    let best = null;
    let bestFit = -Infinity;
    for (let i = 0; i < k; i++) {
      const idx = Math.floor(rng() * population.length);
      const candidate = population[idx];
      const fit = fitnessFn(candidate);
      if (fit > bestFit) {
        bestFit = fit;
        best = candidate;
      }
    }
    return best;
  }
  return [tournament(), tournament()];
}

// BLX-α-Crossover auf Float-Genomen.
// pro Gen: lo = min(a,b) - α*|a-b|, hi = max(a,b) + α*|a-b|
// Kind-Gen = clamp(lo + rng()*(hi-lo), 0, 1)
// Gibt ein neues Tier-Objekt zurück (ohne pos — Caller setzt pos).
export function crossoverBLX(parentA, parentB, alpha, rng) {
  const genes = {};
  for (const gene of Object.keys(parentA.genes)) {
    const a   = parentA.genes[gene];
    const b   = parentB.genes[gene];
    const lo  = Math.min(a, b) - alpha * Math.abs(a - b);
    const hi  = Math.max(a, b) + alpha * Math.abs(a - b);
    // Wenn lo === hi (identische Eltern), wird der Wert direkt übernommen
    const val = lo === hi ? a : lo + rng() * (hi - lo);
    genes[gene] = clamp(val);
  }
  return {
    archetype: parentA.archetype,
    genes,
    hp:      1,
    stamina: 1,
    age:     0,
    // pos wird vom Caller (step.spawning) gesetzt
  };
}

// Gauß-Mutation pro Gen mit Wahrscheinlichkeit p.
// Gibt ein neues Genome-Objekt zurück (clamped [0,1]).
export function mutate(genome, sigma, p, rng) {
  const mutated = {};
  for (const gene of Object.keys(genome)) {
    if (rng() < p) {
      mutated[gene] = clamp(genome[gene] + gauss(rng, sigma));
    } else {
      mutated[gene] = genome[gene];
    }
  }
  return mutated;
}
