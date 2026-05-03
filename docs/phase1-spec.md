# Phase 1 — Architektur-Spec für `src/games/dinos/logic/`

Bindend für `developer`. Spec basiert auf Issue-Body, Architektur-Review-Kommentar (4 Guidelines) und Phase-0-Brief. Jede Abweichung bei der Umsetzung erfordert Rücksprache, kein stillschweigendes Aufweichen.

---

## A. Sub-Modul-Schnittstellen

### A.0 Globale Regeln

- Alle `logic/`-Dateien sind **DOM-frei**, **Canvas-frei**, **`Math.random()`-frei**. Kein Import aus `pages/`, `ui/`, `api/`, `renderer.js`, `controls.js`. Bestätigt; verstößt eine Datei dagegen, ist sie kaputt.
- Externe Reinheit: jede exportierte Funktion, die `state` annimmt, gibt **neuen** State zurück; das Argument `state` darf nicht mutiert werden. Interne Working-Copy-Mutation ist erlaubt (siehe CLAUDE.md, Sektion „State-Updates").
- `index.js` ist die einzige Tür nach außen — `renderer.js` und `controls.js` importieren ausschließlich `from './logic'` (resolved auf `./logic/index.js`). Sub-Module direkt importieren ist verboten.

### A.1 `logic/index.js` — Reexport-Fassade

Reine Reexports, keine Implementierung. Pflicht-Symbole:

```js
// State + RNG
export { createState, makeRng, nextRandom } from './state.js';
export {
  // Tuning-Konstanten (vollständige Liste in Sektion F)
  ARCHETYPES, GENE_SCHEMAS, INITIAL_GENE_BIAS,
  POP_PER_BIOME, HARD_ENTITY_CAP, BIOMES,
  TICK_REALTIME_MIN_S, TICK_REALTIME_DEFAULT_S,
  TURN_MIN_ACTIONS_PER_GEN,
  BLX_ALPHA, MUTATION_SIGMA, MUTATION_P, TOURNAMENT_K, ELITISM_COUNT,
  PHASE, PHASE_BUDGET_INDIVIDUALS,
} from './state.js';

// Reducer
export { step } from './step.js';

// Evo-Operatoren (für Tests + step-internen Gebrauch reexportiert)
export { selectParents, crossoverBLX, mutate } from './evo.js';

// World (Read-Queries; Encounter-Resolver darf step.js intern nutzen)
export { getBiomeAt, findEncounters, resolveEncounter } from './world.js';

// Events
export { pickEvent, applyEvent, EVENTS } from './events.js';
```

Was **nicht** rein darf: Logik-Code, Default-Exports, Side-Effects beim Import.

Header-Kommentar in `index.js` (durchsetzbar nur per Konvention, daher hart dokumentiert):

```js
// Public surface of dinos/logic. Renderer and controls MUST import only from
// here (./logic), never from sibling files. See CLAUDE.md "Modulgrenzen".
```

### A.2 `logic/state.js` — State + RNG + Konstanten

**Verantwortlich für:**
- Tuning-Konstanten (Sektion F)
- Genome-Schema-Definitionen
- Mulberry32-RNG
- Initial-State-Konstruktion

**Public Exports:**

```js
// — Tuning (siehe F) —
export const ARCHETYPES                 // ['predator','herbivore','plant']
export const GENE_SCHEMAS               // { predator: [...keys], herbivore: [...], plant: [...] }
export const INITIAL_GENE_BIAS          // pro Archetyp.gene → mean (default 0.5)
export const BIOMES                     // ['forest','plain','river','rocks']
export const POP_PER_BIOME              // { predator: 12, herbivore: 18, plant: 30, player: 25 }
export const HARD_ENTITY_CAP            // 250
export const TICK_REALTIME_MIN_S        // 30 (späte Spielphasen-Floor)
export const TICK_REALTIME_DEFAULT_S    // 60
export const TURN_MIN_ACTIONS_PER_GEN   // 3
export const BLX_ALPHA                  // 0.3
export const MUTATION_SIGMA             // 0.08
export const MUTATION_P                 // 0.15
export const TOURNAMENT_K               // 3
export const ELITISM_COUNT              // 1 (pro Spezies)
export const PHASE                      // Enum (siehe B)
export const PHASE_BUDGET_INDIVIDUALS   // { evaluating: 60, selecting: 60, breeding: 30, mutating: 60, spawning: 30 }

// — RNG —
export function makeRng(seed)                         // → () => float in [0,1)
export function nextRandom(state)                     // → [newState, float]; advances rngCounter
// (interne Helfer wie randInt(rng, n), gauss(rng, mu, sigma) leben in evo.js, nicht hier)

// — State —
export function createState({ mode, seed })           // mode: 'realtime' | 'turn'
```

**`createState({ mode, seed })`** liefert das Initial-State-Objekt; vorgeschriebene Felder:

```js
{
  mode,                       // 'realtime' | 'turn'
  seed,                       // uint32 — input, nie verändern
  rngCounter,                 // uint32 — wird durch nextRandom() inkrementiert
  tick,                       // 0; in realtime: dt-akkumulator, in turn: action-counter
  generation,                 // 0
  phase,                      // PHASE.SIMULATING
  phaseProgress,              // 0  (Index ins aktuelle Pop-Array während Multi-Frame)
  pendingGeneration: null,    // Working-Buffer während eval/select/breed/mutate (siehe B)
  populations: {              // pro Archetyp pro Biom
    predator:  { forest: [...12], plain: [...12], river: [...12], rocks: [...12] },
    herbivore: { forest: [...18], plain: [...18], river: [...18], rocks: [...18] },
    plant:     { forest: [...30], plain: [...30], river: [...30], rocks: [...30] },
  },
  player: {
    biome: 'plain',           // Spieler startet in 'plain' (Lagune-Biom)
    herd:    [...25],         // Tiere mit Genom-Schema 'herbivore'
    pendingAction: null,      // 'fight'|'flee'|'forage'|'rest'|'split'|'regroup'|'move:<biome>'
    actionsThisGeneration: 0,
    waypoint: null,
    pace: 'walk',             // 'walk'|'run'
  },
  events: {
    active: [],               // [{ id, biome, ttl_generations }]
    pendingChoice: null,      // { id, choices: [...] } während Choice-Event auf Spieler wartet
  },
  encounters: [],             // ungelöste Encounter-Queue (für turn-Mode entscheidet Spieler erst)
  metrics: {
    peakPop: 0,
    biomesExplored: ['plain'],
    generationsSurvived: 0,
  },
  alive: true,
  started: false,
  startTime: null,            // Date.now() beim ersten start()-Call (analog Tetris/Snake)
}
```

**Tier-Objekt-Schema** (Element der `populations[archetype][biome]`-Arrays bzw. `player.herd`):

```js
{
  id: 'p_<gen>_<idx>',     // string, deterministisch aus rngCounter
  archetype,               // 'predator'|'herbivore'|'plant'
  genes,                   // { speed: 0.42, ... } — Schlüssel exakt aus GENE_SCHEMAS[archetype]
  hp,                      // float [0,1]
  stamina,                 // float [0,1]
  age,                     // generations
  pos: { x, y },           // float in Welt-Koordinaten (Biom-lokal)
}
```

**Mulberry32**:

```js
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
```

**`nextRandom(state)`** ist die kanonische Form für „Logic braucht eine Zufallszahl und gibt einen neuen State zurück" — `state.rngCounter` ist der Counter, kein RNG-Closure (Closures sind nicht serialisierbar, wir wollen Replay/JSON-Roundtrip):

```js
export function nextRandom(state) {
  const seed = (state.seed ^ state.rngCounter) >>> 0;
  const value = makeRng(seed)();          // 1 Aufruf, 10 ns — billiger als state-of-the-art Stream
  return [{ ...state, rngCounter: (state.rngCounter + 1) >>> 0 }, value];
}
```

Alternative für Hot-Loops innerhalb **einer** step()-Phase: lokalen Closure aus `(state.seed ^ state.rngCounter)` erzeugen, am Ende der Phase `rngCounter += n` setzen. Beide Varianten sind erlaubt, solange am Phasen-Ende der Counter konsistent ist. Empfehlung: für Tournament/Crossover/Mutation lokalen Closure (Performance), `nextRandom` für seltene Single-Picks (Event-Wahl).

**Was nicht rein darf:** `step()`-Logik, Genom-Operatoren, Encounter-Resolver, Event-Definitionen.

**Abhängigkeiten:** keine zu Schwester-Modulen. `state.js` ist Wurzel-Modul.

### A.3 `logic/step.js` — Reducer

**Public Export:**

```js
export function step(state, dt, action)   // → newState
```

**Vertrag:**
- `dt` ist Zeit-Delta in **Sekunden** (analog `step(state, dt, action)`-Konvention aus dem Design-Doc; der Caller, die Page, rechnet `(now - last) / 1000`). In `'turn'`-Mode wird `dt` als 0 erwartet/ignoriert.
- `action` ist `null | string | { type, payload? }`. Für Echtzeit-Mode meist `null`; nur bei Spielereingriff (Encounter-Wahl, Event-Choice, Bewegungs-Waypoint) gefüllt. Konkrete Action-Typen:

  | Action                      | Mode      | Effekt                                          |
  | --------------------------- | --------- | ----------------------------------------------- |
  | `'start'`                   | beide     | idempotent; setzt `started=true`, `startTime`   |
  | `{type:'setWaypoint', x,y}` | beide     | `player.waypoint`                                |
  | `{type:'setPace', pace}`    | beide     | `player.pace`                                    |
  | `'fight'` / `'flee'`        | beide     | löst nächsten Eintrag in `encounters` auf        |
  | `{type:'eventChoice', id}`  | beide     | beantwortet `events.pendingChoice`               |
  | `'split'` / `'regroup'`     | beide     | Player-Herd-Topologie                            |
  | `'endTurn'`                 | turn-only | erzwingt `phase`-Übergang `simulating→evaluating`, falls `actionsThisGeneration >= TURN_MIN_ACTIONS_PER_GEN` |

  Unbekannte Actions: ignorieren, State unverändert zurückgeben (defensiv, wie Tetris).

- Action mutiert `actionsThisGeneration++` (außer `'start'`).

**Phasen-State-Machine** (siehe Sektion B für Übergänge):

```js
PHASE = Object.freeze({
  SIMULATING: 'simulating',
  EVALUATING: 'evaluating',
  SELECTING:  'selecting',
  BREEDING:   'breeding',
  MUTATING:   'mutating',
  SPAWNING:   'spawning',
});
```

**Verhalten von `step()`:**
1. Wenn `!state.alive` → return state.
2. Wenn `action` → action-handler-Block aufrufen (kann phase wechseln).
3. Phase-Dispatch: `switch (state.phase)` → ruft die zugehörige interne Phase-Funktion (alle pure mit Working-Copy-Pattern). Jede Phase verarbeitet höchstens `PHASE_BUDGET_INDIVIDUALS[phase]` Individuen (Frame-Budget, siehe B).
4. Nach Phase-Schritt: prüfen, ob alle Individuen abgearbeitet → Phase-Übergang.
5. Sterbe-Bedingung (`player.herd.length === 0`) → `alive=false`, `metrics.generationsSurvived = state.generation`.

**Was nicht rein darf:** Crossover/Mutation-Implementierung (delegieren an `evo.js`), Encounter-Mathematik (delegieren an `world.js`), Event-Auflösung (delegieren an `events.js`).

**Working-Copy-Pattern** (CLAUDE.md-konform):

```js
function phaseBreeding(state) {
  // Erlaubt: flache Kopie der Top-Level-Felder, in der wir mutieren.
  const next = { ...state, populations: { ...state.populations } };
  next.populations.predator = { ...state.populations.predator };
  // ... biom-weise neue Arrays bauen, alten state niemals anfassen.
  return next;
}
```

**Abhängigkeiten:** importiert `evo.js`, `world.js`, `events.js`, `state.js` (Konstanten, `nextRandom`).

### A.4 `logic/evo.js` — GA-Operatoren

**Public Exports:**

```js
export function selectParents(population, fitnessFn, k, rng)
//   population: array of individuals
//   fitnessFn:  (individual, state?) => number
//   k:          tournament-Größe (=TOURNAMENT_K)
//   rng:        () => float in [0,1)
//   → [parentA, parentB]   (zwei unabhängige Tournaments; A und B dürfen identisch sein,
//                            developer entscheidet ob er das verbieten will — Empfehlung: nicht)

export function crossoverBLX(parentA, parentB, alpha, rng)
//   parentA/B:  individual mit .genes
//   alpha:      0.3 default
//   rng
//   → child:    { archetype: parentA.archetype, genes: {...}, hp:1, stamina:1, age:0, pos: {} }
//   → BLX-α-Formel pro Gen:
//        let lo = min(a,b) - alpha*|a-b|, hi = max(a,b) + alpha*|a-b|
//        gene = clamp(lo + rng()*(hi-lo), 0, 1)
//   pos wird vom Caller (step.spawning) gesetzt; evo.js liefert kein pos.

export function mutate(genome, sigma, p, rng)
//   genome: {speed, ...}
//   sigma:  0.08 default; mutagener-Tümpel-Override durch Caller
//   p:      0.15 default — Wahrscheinlichkeit pro Gen
//   rng
//   → mutiertes Genome (clamped [0,1])
//   → Box-Muller-Gauß intern (gauss(rng, 0, sigma))
```

**Abhängigkeiten:** keine zu `state.js`/`step.js`/`world.js`/`events.js`. Reine Funktions-Bibliothek. `rng` wird **immer als Parameter** injiziert — kein `Math.random()`, kein Modul-globales Closure.

**Was nicht rein darf:** Population-Containerwissen (welche Spezies wo), Frame-Budget-Logik, RNG-Konstruktion (kommt aus `state.js`/`step.js`), Fitness-Definition (Fitness ist Domain-Logik, lebt in `step.js`-Helfer).

### A.5 `logic/world.js` — Spatial + Encounter

**Public Exports:**

```js
export function getBiomeAt(x, y)
//   → 'forest'|'plain'|'river'|'rocks' anhand fester Welt-Layout-Tabelle.
//   Welt-Layout: 4 Quadranten (siehe unten); reine Lookup-Funktion.

export function findEncounters(state)
//   → array of { biome, predators: [...refs], herbivores: [...refs] }
//   Encounter = Spieler-Herde im selben Biom wie aktive Predator-Pop-Untergruppe,
//   Distanz-Schwelle (Vision-Range-abhängig).
//   Reine Read-Only-Query.

export function resolveEncounter(encounter, state, rng)
//   → { newState, outcome: { playerLosses, predatorLosses } }
//   Konkrete Resolver-Formel ist OUT-OF-SCOPE für Phase 1 (siehe Issue „Nicht im Scope").
//   In Phase 1 reicht ein Stub, der Outcome 0/0 zurückgibt — Vertragsform muss aber stehen.
```

**Biom-Layout** (fix, kein State):

```js
// Welt = 1000×1000 Einheiten, 2×2-Quadranten
const BIOME_LAYOUT = [
  [/* x<500,y<500 */ 'forest', /* x>=500,y<500 */ 'plain'],
  [/* x<500,y>=500 */ 'rocks', /* x>=500,y>=500 */ 'river'],
];
```

**Abhängigkeiten:** importiert nur `state.js` (für `BIOMES`-Konstante). Kein Import von `step.js`/`evo.js`/`events.js`.

**Was nicht rein darf:** GA-Operatoren, Phase-Übergangslogik, Event-Code.

### A.6 `logic/events.js` — Events als Daten

**Public Exports:**

```js
export const EVENTS
//   Map<eventId, EventDefinition>
//   EventDefinition: {
//     id, label, biome|null, weight, kind: 'auto'|'choice',
//     // Für 'auto': effect(state, rng) → newState
//     // Für 'choice': choices: [{ id, label, effect(state, rng) → newState }]
//   }
//   Konkrete Event-Implementierungen sind OUT-OF-SCOPE für Phase 1.
//   In Phase 1: leeres Object oder 1 Stub-Event (ID 'noop').

export function pickEvent(state, rng)
//   → eventId | null
//   Gewichtete Auswahl unter den biom-passenden Events; null = kein Event diese Generation.

export function applyEvent(state, eventId, choiceId)
//   → newState
//   Bei kind='auto': choiceId ignoriert, effect direkt angewendet.
//   Bei kind='choice' und choiceId=null: setzt state.events.pendingChoice, kein effect-Run.
//   Bei kind='choice' und choiceId gesetzt: löst pending auf, ruft choices[choiceId].effect.
```

**Wichtig (gegen Code-Ausführungs-Trick):** Effekte sind **Funktionsreferenzen in einer Daten-Map**, **kein** `eval`/`new Function`/Code-aus-DB. Daten-getrieben heißt: `EVENTS` ist die einzige Quelle der Wahrheit, Effekt-Funktionen sind compile-time lokal, kein Plugin-Mechanismus.

**Abhängigkeiten:** importiert `state.js` (Konstanten). Darf `BIOMES` lesen. Kein Import aus `step.js`/`evo.js`/`world.js` (sonst Zirkel).

---

## B. Phasen-State-Machine konkret

### B.1 State-Felder

- `state.phase` — aktueller PHASE-Wert
- `state.phaseProgress` — Index ins aktuelle Pop-Array (resetted bei Phase-Wechsel auf 0)
- `state.pendingGeneration` — Working-Buffer; entsteht bei Übergang `simulating→evaluating`, wird über mehrere Frames gefüllt, bei `simulating`-Rücksprung in `state.populations` übergeben und zurückgesetzt auf `null`.

Form von `pendingGeneration`:

```js
{
  fitnesses: { predator: { forest: [number,...], ... }, herbivore: {...}, plant: {...} },
  parents:   { predator: { forest: [[a,b],[a,b],...], ... }, ... },
  children:  { predator: { forest: [individual,...], ... }, ... },
  cursor:    { archetype: 'predator', biome: 'forest', i: 0 },  // wo wir gerade stehen
}
```

### B.2 Übergänge

```
SIMULATING ──(Echtzeit: tick+=dt erreicht TICK_REALTIME_DEFAULT_S)──▶ EVALUATING
SIMULATING ──(Turn: action='endTurn' && actions>=TURN_MIN_ACTIONS_PER_GEN)──▶ EVALUATING
EVALUATING ──(alle Fitness-Werte berechnet)──▶ SELECTING
SELECTING  ──(alle Eltern-Paare gewählt)──▶ BREEDING
BREEDING   ──(alle Kinder erzeugt)──▶ MUTATING
MUTATING   ──(alle Kinder mutiert)──▶ SPAWNING
SPAWNING   ──(neue Generation in populations geschrieben, pendingGeneration = null,
              generation++, metrics.generationsSurvived = generation)──▶ SIMULATING
```

In **EVALUATING** gilt zusätzlich: 1-Elitismus pro Spezies — der/die fitnesseste(n) Individuen werden direkt in `pendingGeneration.children` kopiert, die GA-Operatoren laufen nur auf den restlichen Plätzen.

### B.3 Frame-Budget

Architekt-Review-Schwelle: **>4 ms pro Phase = aufteilen**. Implementierung:

- Pro `step()`-Aufruf wird eine **nicht-simulating**-Phase mit `PHASE_BUDGET_INDIVIDUALS[phase]` Individuen abgearbeitet (counter, kein `performance.now()`-Loop — billiger und deterministisch).
- Default-Budgets aus Phase-0-Brief abgeleitet (Pop pro Spezies pro Biom = 12–30, gesamt ~240 Individuen pro Phase über alle Spezies+Biome):

  ```js
  PHASE_BUDGET_INDIVIDUALS = {
    [PHASE.EVALUATING]: 60,   // 4 Frames Worst-Case
    [PHASE.SELECTING]:  60,
    [PHASE.BREEDING]:   30,   // Crossover ist teuer (BLX-α + child-Allokation)
    [PHASE.MUTATING]:   60,
    [PHASE.SPAWNING]:   30,
  };
  ```

  Werte sind Schätzungen; nach erstem Profiling tunen, ohne Algorithmus-Eingriff (nur diese Konstanten).

- **Simulating-Phase** ist nicht individuen-budgetiert — sie verarbeitet Bewegung/Encounter/Stamina pro Frame komplett (begrenzt durch HARD_ENTITY_CAP=250).

### B.4 Übergangsbedingungen

| Phase        | Fertig wenn                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| simulating   | Realtime: `tick >= TICK_REALTIME_DEFAULT_S` · Turn: `endTurn` + `actions>=3`|
| evaluating   | für alle (archetype, biome) liegt `pendingGeneration.fitnesses[a][b]` vor   |
| selecting    | `pendingGeneration.parents[a][b].length === POP_PER_BIOME[a]`               |
| breeding     | `pendingGeneration.children[a][b].length === POP_PER_BIOME[a]`              |
| mutating     | gleicher Cursor-Durchlauf wie breeding, aber alle children mutiert          |
| spawning     | populations geschrieben, players-Herd ggf. um Mutationen ergänzt            |

### B.5 Empfehlung Turn-Mode

**Selbe Multi-Frame-Maschine, aber ohne `dt`-Trigger.** Der `endTurn`-Action setzt `phase=EVALUATING`. Danach laufen die Folgephasen **synchron in einem einzigen `step()`-Aufruf** (Schleife in step.js bis `phase===SIMULATING` wieder erreicht ist), weil im Turn-Mode kein Frame-Pacing existiert (Spieler sieht erst die nächste Generation, nicht die Berechnung).

Begründung: Im Turn-Mode wird typischerweise alle paar Sekunden (nicht alle 16 ms) gestept, ein 30 ms-Compute-Burst ist akzeptabel. Eine separate Code-Pfad-Implementierung würde die Code-Duplication kosten ohne UX-Gewinn. Implementierungs-Detail in `step.js`:

```js
export function step(state, dt, action) {
  let s = applyAction(state, action);
  s = advancePhase(s, dt);
  if (s.mode === 'turn' && s.phase !== PHASE.SIMULATING) {
    // run remaining GA phases in one go
    while (s.phase !== PHASE.SIMULATING && s.alive) {
      s = advancePhase(s, 0);
    }
  }
  return s;
}
```

Damit ist im Turn-Mode der GA effektiv ein Big-Bang, im Realtime-Mode multi-frame — bei identischem Phase-Code.

---

## C. RNG-Vertrag

### C.1 Implementierung

Mulberry32 (siehe A.2). Public-Domain, ~10 Zeilen, 32-Bit-State, statistisch ausreichend für GA-Tournament + BLX + Gauß. Keine Dep.

### C.2 Counter-Variante

`state.rngCounter` ist `uint32`. Jeder `nextRandom()`-Aufruf inkrementiert. Wrap-around nach 2^32 ist akzeptabel (Periode ist enorm — bei 100 RNG-Calls pro Frame und 60 fps = 1.7e7 sec = 199 Tage am Stück bis Wiederholung).

`state.seed` ist die unveränderliche Run-ID. Replay = `(seed, action_log) → identische Run`. Wir implementieren Replay nicht in Phase 1, aber das Schema lässt es zu.

### C.3 Determinismus erzwingen

**Konvention, kein Lint** — wir wollen keinen ESLint einführen (CLAUDE.md verbietet neue Tooling-Schichten ohne Notwendigkeit). Stattdessen:

1. **Konvention im CLAUDE.md ergänzen** (developer-Aufgabe nach Approval): „Innerhalb von `src/games/dinos/logic/` ist `Math.random()` verboten. Verwende `nextRandom(state)` oder einen lokalen `rng = makeRng(seed^counter)`-Closure."
2. **Tests**: Vitest-Suite enthält einen einfachen Determinismus-Smoke-Test: `step()` aus identischem `(state, dt, action)` muss byte-identischen State liefern. Wenn jemand `Math.random()` einschmuggelt, schlägt der Test fehl.
3. **PR-Review-Checkliste**: bei Änderungen unter `src/games/dinos/logic/` greppen reviewer manuell nach `Math.random` und `Date.now` (außer in `createState`).

Stärker durchsetzbar wäre ein 5-Zeilen-`vitest`-Custom-Matcher oder ein vorgeschalteter `pretest`-Grep — Empfehlung: erst beim ersten Vorfall.

### C.4 Vitest-Reseeds

Tests bekommen einen festen Seed, z. B. `createState({ mode: 'realtime', seed: 1 })`. Kein Test-Setup-Hook nötig, weil der RNG explizit über `state.seed` parametriert ist. **Keine globale Mock von `Math.random`** — wir vermeiden ja gerade `Math.random` in `logic/`. Falls Helfer in `evo.js` mal versehentlich `Math.random` benutzen würde, fällt das im Determinismus-Smoke-Test sofort auf.

---

## D. Modulgrenzen-Härtung

### D.1 Renderer/Controls → Logic

**Regel:** `src/games/dinos/renderer.js` und `src/games/dinos/controls.js` importieren nur `from './logic'` (kein direkter Sub-Modul-Pfad).

**Durchsetzung:**
- Header-Kommentar in `logic/index.js` (siehe A.1).
- Ergänzung in CLAUDE.md unter „Modulgrenzen respektieren": *„Innerhalb von `src/games/<spiel>/`, falls `logic` ein Verzeichnis ist: nur über `logic/index.js` importieren — nie direkt aus Sub-Modulen."*
- PR-Review-Stichprobe (grep `from './logic/`).

Stärkere Variante (nicht jetzt): Vite-Resolver-Plugin oder Custom-Test, der grep-artig den Bestand prüft. Nicht gerechtfertigt für ein 1-Spiel-Repo.

### D.2 Logic → Außenwelt

**Bestätigt:** `src/games/dinos/logic/*` darf **nichts** aus `src/pages/`, `src/ui/`, `src/api/` importieren. Keine `console.log` (außer temporär während Entwicklung — vor Commit raus, CLAUDE.md-Regel). Kein `Date.now()` außerhalb von `createState()` (folgt Tetris/Snake-`startTime`-Pattern).

### D.3 Sub-Modul-interne Abhängigkeitsgraph

```
state.js  ◀── (Wurzel, importiert nichts intern)
    ▲
    │
evo.js    ── (importiert nur state.js für Konstanten, optional gar nichts)
    ▲
    │
world.js  ── (importiert state.js für BIOMES)
    ▲
    │
events.js ── (importiert state.js, optional world.js für Biom-Filter)
    ▲
    │
step.js   ── (importiert state.js + evo.js + world.js + events.js)
    ▲
    │
index.js  ── (Reexport-only)
```

Keine Zirkel. `step.js` ist die einzige Datei mit allen vier Abhängigkeiten.

---

## E. Migration `004_dinos.sql` Review

> **Aktualität:** Die hier dokumentierten Werte (`score <= 200`, `score/duration <= 0.05`)
> sind die historischen Phase-0-Vorgaben. Sie wurden mit Issue #36 / `005_dinos_recalibrate.sql`
> auf `400` und `0.4` rekalibriert, weil die Phase-0-Score-Formel mit `0.05` mathematisch
> kollidierte (Einheitenfehler). Dieser Abschnitt bleibt als Snapshot des Phase-1-Reviews
> stehen; aktuelle DB-Werte stehen in `docs/dinos-status.md` unter „Verbindliche Werte".

Abgleich gegen `001_schema.sql` + `002_rls.sql` (eingespielter Bestand):

### E.1 Befunde

1. **`count_recent_scores`** existiert in `002_rls.sql` Zeile 17–26 mit Signatur `(p_user_id UUID, p_seconds INTEGER) → INTEGER`. Phase-0-Skelett ruft sie korrekt mit `(auth.uid(), 3600)` und `(auth.uid(), 60)`. Pass.
2. **Insert-Policy-Name** ist `"scores: insert own"` (mit Anführungszeichen, Doppelpunkt, Leerzeichen). Phase-0-Skelett nutzt exakt diesen Namen. Pass.
3. **Bestehende CHECK-Constraints** auf `scores` heißen `tetris_score_limit` und `snake_score_limit` (`001_schema.sql` Zeilen 21–22). Neue Constraints konsistent benannt: `dinos_realtime_score_limit`, `dinos_turn_score_limit`. Pass.
4. **`ALTER TYPE … ADD VALUE`**: Postgres-Constraint — muss **außerhalb einer Transaktion** laufen. Die Phase-0-Skelett-Datei ist statementbasiert, keine `BEGIN/COMMIT`-Klammer. Pass. Kritisch: Nach `ADD VALUE` muss **vor** Verwendung des neuen Wertes in CHECK-Klauseln **ein eigenständiges Statement-Ende** liegen — Postgres macht das ENUM-Add erst bei Transaktions-Commit sichtbar. Bei `;`-Trennung im SQL-Editor reicht das, beim psql-Skript-Modus auch.
5. **Missing in Skelett:** `dinos_realtime`/`dinos_turn` brauchen **Anführungszeichen** als ENUM-Literale: `'dinos_realtime'`, nicht `dinos_realtime`. Phase-0-Skelett zeigt sie unquoted im `ADD VALUE` (das ist okay) und im Vergleich (`game <> dinos_realtime` — das ist **falsch**, muss `game <> 'dinos_realtime'` sein, sonst PG sucht nach einer Spalte mit dem Namen). **Bei Implementierung darauf achten.**
6. **Auf `001_schema.sql`** Zeile 2 ergänzen (Vorlage):
   ```sql
   CREATE TYPE public.game_type AS ENUM ('tetris', 'snake', 'dinos_realtime', 'dinos_turn');
   ```
   und **Zeile 22 nach `snake_score_limit`** anhängen (Vorlage):
   ```sql
   CONSTRAINT dinos_realtime_score_limit CHECK (game <> 'dinos_realtime' OR score <= 200),
   CONSTRAINT dinos_turn_score_limit     CHECK (game <> 'dinos_turn'     OR score <= 5000)
   ```
7. **Auf `002_rls.sql`** WITH-CHECK-Klausel zwischen Zeile 36 (snake-Cap) und Zeile 39 (Plausibilität) ergänzen (Vorlage):
   ```sql
   AND (game <> 'dinos_realtime' OR score <= 200)
   AND (game <> 'dinos_turn'     OR score <= 5000)
   AND (game <> 'dinos_realtime' OR (score::float / duration_seconds) <= 0.05)
   ```
   Reihenfolge irrelevant für die Logik, aber gruppiert „Score-Caps" oben, „Plausibilität" unten zusammenhalten.

### E.2 DROP+CREATE-Atomizität

`DROP POLICY` + `CREATE POLICY` **müssen** in derselben Transaktion laufen, sonst gibt es ein Fenster, in dem keine Insert-Policy existiert → wegen Default-Deny von RLS sind dann **alle Inserts blockiert** (nicht offen — aber Production wird kurzzeitig bricked).

Phase-0-Skelett zeigt sie als zwei sequenzielle Statements ohne `BEGIN/COMMIT` — im Supabase-SQL-Editor läuft jedes Top-Level-Statement implizit in seiner eigenen Transaktion, also ist das Fenster real.

**Konflikt mit E.1.4** (`ALTER TYPE` darf **nicht** in Transaktion): Lösung — **zwei Migrations-Sektionen**, in derselben Datei, vom Operator **nacheinander** im SQL-Editor ausgeführt:

```sql
-- ============================================================================
-- 004_dinos.sql
-- WICHTIG: Datei in zwei Schritten ausführen:
--   Schritt 1: Section A (ALTER TYPE — KEINE Transaktion!)
--   Schritt 2: Section B (CHECK + RLS — in EINER Transaktion via BEGIN/COMMIT)
-- ============================================================================

-- ============================================================================
-- Section A — ENUM erweitern (außerhalb Transaktion ausführen)
-- ============================================================================
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'dinos_realtime';
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'dinos_turn';

-- ============================================================================
-- Section B — CHECK-Constraint + RLS-Policy (in EINER Transaktion)
-- ============================================================================
BEGIN;

ALTER TABLE public.scores
  ADD CONSTRAINT dinos_realtime_score_limit
    CHECK (game <> 'dinos_realtime' OR score <= 200),
  ADD CONSTRAINT dinos_turn_score_limit
    CHECK (game <> 'dinos_turn'     OR score <= 5000);

DROP POLICY "scores: insert own" ON public.scores;
CREATE POLICY "scores: insert own"
  ON public.scores FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (game <> 'tetris'         OR score <= 10000000)
    AND (game <> 'snake'          OR score <= 100000)
    AND (game <> 'dinos_realtime' OR score <= 200)
    AND (game <> 'dinos_turn'     OR score <= 5000)
    AND (game <> 'dinos_realtime' OR (score::float / duration_seconds) <= 0.05)
    AND (score::float / duration_seconds) <= 100000
    AND public.count_recent_scores(auth.uid(), 3600) < 10
    AND public.count_recent_scores(auth.uid(), 60)   < 2
  );

COMMIT;
```

**Hinweis zum Anti-Cheat aus dem Architektur-Review (Multi-Frame-Phase-Kommentar):** der dort vorgeschlagene `score * 30 <= duration_seconds + 10` ist **strikter** als `score/duration_seconds <= 0.05`. Phase-0-Brief hat sich für die `0.05`-Variante entschieden (lockerer, mit MIN_GEN_SECONDS=45 als Logic-Konstante). Beide Varianten konsistent — die Review-Variante war Diskussionsvorschlag, Phase-0 ist die Festlegung. Spec übernimmt Phase-0.

### E.3 Idempotenz

`ADD VALUE IF NOT EXISTS` (Postgres 12+) macht Section A re-runnable. Section B ist nicht idempotent (`ADD CONSTRAINT` failt beim zweiten Lauf); falls Re-Run nötig: vorher `ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS dinos_realtime_score_limit, DROP CONSTRAINT IF EXISTS dinos_turn_score_limit;` voranstellen. Empfehlung: nicht vorab idempotent machen, einmal-laufen-Disziplin wahren.

---

## F. Tuning-Konstanten zentral

Genau diese Symbole exportiert `state.js`. Werte sind die Phase-0-Brief-Festlegungen. **Späteres Balancing ändert nur diese Werte — kein Algorithmus-Eingriff.**

```js
// — Welt + Archetypen —
export const ARCHETYPES = ['predator', 'herbivore', 'plant'];
export const BIOMES     = ['forest', 'plain', 'river', 'rocks'];

export const GENE_SCHEMAS = Object.freeze({
  predator:  ['speed', 'size', 'armor', 'aggression', 'pack_size', 'vision', 'stamina'],
  herbivore: ['speed', 'stamina', 'size', 'vigilance', 'forage_efficiency', 'herd_cohesion'],
  plant:     ['growth_rate', 'toxicity', 'abundance', 'seed_dispersal'],
});

// Initial-Verteilung pro Gen: g = (rand()+rand()+rand())/3 + bias-shift
export const INITIAL_GENE_BIAS = Object.freeze({
  predator:  { aggression: 0.35, pack_size: 0.35 },   // restliche default 0.5
  herbivore: {},
  plant:     { toxicity: 0.1 },                        // tutorial-fenster
});

// — Populations —
export const POP_PER_BIOME = Object.freeze({
  predator:  12,
  herbivore: 18,
  plant:     30,
  player:    25,   // nur in Start-Biom
});
export const HARD_ENTITY_CAP = 250;

// — Tick & Turn —
export const TICK_REALTIME_DEFAULT_S = 60;   // Empfehlung: 45–60 s
export const TICK_REALTIME_MIN_S     = 30;   // späte Spielphasen-Floor (nicht DB-relevant)
export const TURN_MIN_ACTIONS_PER_GEN = 3;

// — GA-Operatoren —
export const BLX_ALPHA       = 0.3;
export const MUTATION_SIGMA  = 0.08;
export const MUTATION_P      = 0.15;
export const TOURNAMENT_K    = 3;
export const ELITISM_COUNT   = 1;            // pro Spezies (nicht pro Biom)

// — Mutagener-Tümpel-Override —
export const MUTAGEN_SIGMA_MULT = 3;         // σ ×3 = 0.24 für 1 Generation

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

// — Score-Aggregation (Hauptmetrik = generations*10 + biomes*5 + floor(peakPop/50)) —
export const SCORE_WEIGHT_GENERATIONS = 10;
export const SCORE_WEIGHT_BIOMES      = 5;
export const SCORE_PEAKPOP_DIVISOR    = 50;
```

---

## Out-of-Scope-Liste (für developer)

Damit dieses Briefing nicht überdehnt wird, **explizit nicht in Phase 1**:

- Konkrete Encounter-Resolver-Mathematik (`world.js#resolveEncounter` darf Stub sein, der `outcome:{playerLosses:0, predatorLosses:0}` liefert).
- Konkrete Event-Effekt-Funktionen (`events.js#EVENTS` darf leer sein oder ein `noop`-Event enthalten).
- Renderer-Architektur (separate Phase 3).
- Page-Lifecycle (`src/pages/dinos.js`) — separate Phase nach Logic-Skelett.
- Mode-Picker-UI, Mobile-Touch-Handling.
- Tatsächliche Pflanzen-Wachstums-Simulation (kann in `simulating`-Phase als TODO-Kommentar stehen).
- Player-Herd-Bewegungs-Pathfinding (Pikmin-Stil) — Stub-Movement reicht.

## Test-Strategie (Phase 1, scope-begrenzt auf `src/games/dinos/logic/**/*.test.js`)

Verbindliche Test-Fälle für developer:

1. **Determinismus-Smoke**: `step(state, 0, null)` zweimal aus identischem State → byte-identisches Resultat (JSON.stringify-Vergleich).
2. **Mulberry32-Vektor**: `makeRng(42)()` → bekannter Float (Wert via Referenz-Implementierung verifizieren, ein-Mal-ablesen).
3. **BLX-α-Range**: für `parentA.gene=0.3`, `parentB.gene=0.7`, `alpha=0.3` muss Kind ∈ [0.18, 0.82] (geclampt auf [0,1]).
4. **Mutate-No-Op-Bei-p=0**: `mutate(g, sigma, 0, rng)` → exakt gleiches Genom.
5. **Phase-Übergang Realtime**: `step()` mit `dt`-Akkumulation jenseits `TICK_REALTIME_DEFAULT_S` setzt `phase=EVALUATING`.
6. **Phase-Übergang Turn**: `endTurn`-Action vor Erreichen von `TURN_MIN_ACTIONS_PER_GEN` ist No-Op.
7. **HARD_ENTITY_CAP**: nach Spawning sind nie mehr als 250 bewegte Entitäten im State.

---

**Status:** Spec ist vollständig für Phase-1-Implementation. Approval durch Maintainer hier im Issue, dann übergibt `architect` an `developer`.
