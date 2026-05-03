// ============================================================
// events.js — Event-Daten und -Auflösung
// Effekte sind Funktionsreferenzen in einer Daten-Map (kein eval/new Function).
// Importiert state.js (BIOME_ORIGIN, BIOME_SIZE).
// Kein Import von step/evo/world.
// ============================================================
import { BIOME_ORIGIN, BIOME_SIZE } from './state.js';

// EVENTS: Map<eventId, EventDefinition>
// Vier Starter-Events: 2 auto (Trockenheit, Räubermigration) + 2 choice
// (Mutagener Tümpel, Verirrte Jungtiere). Effekte sind pure Funktionen
// (state, rng) → newState. Side-effect-frei außerhalb der Rückgabe.
export const EVENTS = Object.freeze({
  drought_river: {
    id:     'drought_river',
    label:  'Trockenheit am Fluss',
    biome:  'river',
    weight: 2,
    kind:   'auto',
    effect(state, _rng) {
      // -40 % abundance bei allen Pflanzen im River-Biom.
      const plants = state.populations.plant.river.map(p => ({
        ...p,
        genes: { ...p.genes, abundance: Math.max(0, (p.genes.abundance ?? 0.5) * 0.6) },
      }));
      return {
        ...state,
        populations: {
          ...state.populations,
          plant: { ...state.populations.plant, river: plants },
        },
      };
    },
  },

  predator_migration: {
    id:     'predator_migration',
    label:  'Räubermigration',
    biome:  null,
    weight: 1,
    kind:   'auto',
    effect(state, _rng) {
      // +0.05 aggression bei Predatoren im aktuellen Spieler-Biom.
      const b = state.player.biome;
      const preds = state.populations.predator[b].map(p => ({
        ...p,
        genes: { ...p.genes, aggression: Math.min(1, (p.genes.aggression ?? 0.5) + 0.05) },
      }));
      return {
        ...state,
        populations: {
          ...state.populations,
          predator: { ...state.populations.predator, [b]: preds },
        },
      };
    },
  },

  mutagen_pool: {
    id:     'mutagen_pool',
    label:  'Mutagener Tümpel',
    biome:  null,
    weight: 1,
    kind:   'choice',
    choices: [
      {
        id: 'drink', label: 'Trinken',
        // Setzt Flag — phaseMutating der nächsten Generation liest es und
        // erhöht σ um MUTAGEN_SIGMA_MULT (×3). Wird in phaseSpawning gecleart.
        effect(state, _rng) {
          return {
            ...state,
            events: { ...state.events, mutagenNextGen: true },
          };
        },
      },
      {
        id: 'pass', label: 'Verzichten',
        effect(state, _rng) { return state; },
      },
    ],
  },

  lost_juveniles: {
    id:     'lost_juveniles',
    label:  'Verirrte Jungtiere',
    biome:  null,
    weight: 1,
    kind:   'choice',
    choices: [
      {
        id: 'adopt', label: 'Aufnehmen',
        effect(state, rng) {
          // Genau 5 Junge zur Spieler-Herde ergänzen. HARD_ENTITY_CAP ist eine
          // Per-Slot-Schranke (siehe step.js#phaseSpawning) und hat keine
          // sinnvolle Bedeutung als globaler Total-Cap — zudem überschreitet
          // der Default-Welt-State (265) ihn bereits. player.herd unterliegt
          // GA-bedingt keinem Wachstums-Risiko.
          const slots = 5;
          const origin  = BIOME_ORIGIN[state.player.biome] ?? BIOME_ORIGIN.plain;
          const baseId  = `juv_${state.generation}_`;
          const newOnes = [];
          for (let i = 0; i < slots; i++) {
            // Schwache Jungtiere: reduzierte Stamina, mittelmäßige Gene.
            newOnes.push({
              id:        baseId + i,
              archetype: 'herbivore',
              genes: {
                speed:             0.4,
                stamina:           0.3,
                size:              0.4,
                vigilance:         0.4,
                forage_efficiency: 0.5,
                herd_cohesion:     0.5,
              },
              hp:      1,
              stamina: 0.7,
              age:     0,
              pos: {
                x: origin.x + rng() * BIOME_SIZE,
                y: origin.y + rng() * BIOME_SIZE,
              },
            });
          }
          return {
            ...state,
            player: { ...state.player, herd: [...state.player.herd, ...newOnes] },
          };
        },
      },
      {
        id: 'leave', label: 'Vorbeiziehen lassen',
        effect(state, _rng) { return state; },
      },
    ],
  },
});

// Gewichtete Auswahl unter biom-passenden Events.
// Gibt eventId oder null zurück (null = kein Event diese Generation).
// Wahrscheinlichkeit ~30 % gemäß Phase-0-Spec.
export function pickEvent(state, rng) {
  // Globaler Threshold zuerst — vereinfacht die Kalibrierung gegenüber
  // weight/(weight+const)-Variante (war bei 4 Events ~70 % statt 30 %).
  if (rng() > 0.3) return null;

  const playerBiome = state.player.biome;
  const candidates  = Object.values(EVENTS).filter(
    ev => ev.biome === null || ev.biome === playerBiome
  );
  if (!candidates.length) return null;

  const totalWeight = candidates.reduce((sum, ev) => sum + ev.weight, 0);
  let r = rng() * totalWeight;
  for (const ev of candidates) {
    r -= ev.weight;
    if (r <= 0) return ev.id;
  }
  return candidates[candidates.length - 1].id;
}

// Wendet ein Event auf den State an.
// kind='auto':   effect direkt angewendet, choiceId ignoriert.
// kind='choice', choiceId=null: pendingChoice setzen, kein effect-Run.
// kind='choice', choiceId gesetzt: pending auflösen, effect aufrufen.
// rng wird an effect weitergereicht — aktuell nur 'lost_juveniles/adopt' braucht es,
// auto-Events ziehen keine Zufallszahl. Aufrufer trackt Verbrauch im rngCounter.
export function applyEvent(state, eventId, choiceId, rng) {
  const ev = EVENTS[eventId];
  if (!ev) return state;

  if (ev.kind === 'auto') {
    return ev.effect(state, rng);
  }

  // kind === 'choice'
  if (choiceId === null || choiceId === undefined) {
    return {
      ...state,
      events: {
        ...state.events,
        pendingChoice: { id: eventId, choices: ev.choices },
      },
    };
  }

  const choice = ev.choices.find(c => c.id === choiceId);
  if (!choice) return state;

  // pendingChoice nach dem Effekt clearen, damit Effekte (z.B. drink → mutagenNextGen)
  // ihre Felder unter events nicht durch unseren Spread-Reset verlieren.
  const next = choice.effect(state, rng);
  return {
    ...next,
    events: {
      ...next.events,
      pendingChoice: null,
    },
  };
}
