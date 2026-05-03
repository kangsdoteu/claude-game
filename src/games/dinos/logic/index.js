// Public surface of dinos/logic. Renderer and controls MUST import only from
// here (./logic), never from sibling files. See CLAUDE.md "Modulgrenzen".

// State + RNG
export { createState, makeRng, nextRandom } from './state.js';
export {
  ARCHETYPES, GENE_SCHEMAS, INITIAL_GENE_BIAS,
  POP_PER_BIOME, HARD_ENTITY_CAP, BIOMES,
  WORLD_SIZE, BIOME_SIZE, BIOME_ORIGIN,
  TICK_REALTIME_MIN_S, TICK_REALTIME_DEFAULT_S,
  TURN_MIN_ACTIONS_PER_GEN,
  BLX_ALPHA, MUTATION_SIGMA, MUTATION_P, TOURNAMENT_K, ELITISM_COUNT,
  PHASE, PHASE_BUDGET_INDIVIDUALS,
  MUTAGEN_SIGMA_MULT,
  SCORE_WEIGHT_GENERATIONS, SCORE_WEIGHT_BIOMES, SCORE_PEAKPOP_DIVISOR,
} from './state.js';

// Reducer
export { step } from './step.js';

// Evo-Operatoren (für Tests + step-internen Gebrauch reexportiert)
export { selectParents, crossoverBLX, mutate } from './evo.js';

// World (Read-Queries; Encounter-Resolver darf step.js intern nutzen)
export { getBiomeAt, findEncounters, resolveEncounter } from './world.js';

// Events
export { pickEvent, applyEvent, EVENTS } from './events.js';
