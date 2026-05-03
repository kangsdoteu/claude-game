// ============================================================
// events.js — Event-Daten und -Auflösung
// Konkrete Event-Effekte sind out-of-scope für Phase 1.
// Importiert state.js (für BIOMES). Kein Import von step/evo/world.
// ============================================================
import { BIOMES } from './state.js';

// EVENTS: Map<eventId, EventDefinition>
// Effekte sind Funktionsreferenzen (kein eval/new Function/Code-aus-DB).
// In Phase 1 nur ein noop-Stub-Event.
export const EVENTS = Object.freeze({
  noop: {
    id:     'noop',
    label:  'Ruhige Stunde',
    biome:  null,      // null = biom-unabhängig
    weight: 1,
    kind:   'auto',
    effect(state, _rng) { return state; },
  },
});

// Gewichtete Auswahl unter biom-passenden Events.
// Gibt eventId oder null zurück (null = kein Event diese Generation).
export function pickEvent(state, rng) {
  const playerBiome = state.player.biome;
  const candidates  = Object.values(EVENTS).filter(
    ev => ev.biome === null || ev.biome === playerBiome
  );
  if (!candidates.length) return null;

  const totalWeight = candidates.reduce((sum, ev) => sum + ev.weight, 0);
  // Schwellenwert: ~1/3 Chance, dass überhaupt ein Event passiert
  if (rng() > totalWeight / (totalWeight + 2)) return null;

  let r   = rng() * totalWeight;
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
export function applyEvent(state, eventId, choiceId) {
  const ev = EVENTS[eventId];
  if (!ev) return state;

  if (ev.kind === 'auto') {
    return ev.effect(state, null);
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

  return {
    ...choice.effect(state, null),
    events: {
      ...state.events,
      pendingChoice: null,
    },
  };
}
