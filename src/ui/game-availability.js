import { supabase } from '../api/supabase.js';

export const ROUTE_TO_GAME_TYPES = {
  tetris: ['tetris'],
  snake:  ['snake'],
  dinos:  ['dinos_realtime', 'dinos_turn'],
};

export const GAME_LABELS = {
  tetris:         'Tetris',
  snake:          'Snake',
  dinos_realtime: 'Dino-Evo (Echtzeit)',
  dinos_turn:     'Dino-Evo (Rundenbasiert)',
};

export const ROUTE_LABELS = {
  tetris: 'Tetris',
  snake:  'Snake',
  dinos:  'Dino-Evo',
};

let cache = null;     // { data, expiresAt }
let inflight = null;
let cacheEpoch = 0;
const TTL_MS = 30_000;

// Bei DB-Down: fail-open (alle Games enabled), damit App nicht sperrt
const FAIL_OPEN = {
  tetris:         { enabled: true, disabled_message: null },
  snake:          { enabled: true, disabled_message: null },
  dinos_realtime: { enabled: true, disabled_message: null },
  dinos_turn:     { enabled: true, disabled_message: null },
};

export async function getGameSettings() {
  if (cache && Date.now() < cache.expiresAt) return cache.data;
  if (inflight) return inflight;
  const myEpoch = cacheEpoch;
  inflight = (async () => {
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('game, enabled, disabled_message');
      if (error || !data) return FAIL_OPEN;
      const map = Object.fromEntries(
        data.map(r => [r.game, { enabled: r.enabled, disabled_message: r.disabled_message }])
      );
      // Stale-Write-Schutz: nur in Cache schreiben, wenn nicht zwischenzeitlich invalidated
      if (myEpoch === cacheEpoch) {
        cache = { data: map, expiresAt: Date.now() + TTL_MS };
      }
      return map;
    } catch {
      return FAIL_OPEN;
    }
  })();
  try { return await inflight; }
  finally { inflight = null; }
}

export async function getRouteAvailability(route) {
  const settings = await getGameSettings();
  const types = ROUTE_TO_GAME_TYPES[route] ?? [];
  for (const t of types) {
    if (!settings[t]?.enabled) {
      return { enabled: false, disabled_message: settings[t]?.disabled_message ?? null };
    }
  }
  return { enabled: true, disabled_message: null };
}

export function invalidateGameSettings() {
  cache = null;
  inflight = null;
  cacheEpoch++;
}
