import { supabase } from './supabase.js';

let cachedIsAdmin = null;
let cacheUserId = null;

export function resetAdminCache() {
  cachedIsAdmin = null;
  cacheUserId = null;
}

export async function isAdmin() {
  // Cache per user-id; invalidate on user switch
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    cachedIsAdmin = false;
    cacheUserId = null;
    return false;
  }
  if (cacheUserId !== user.id) {
    cacheUserId = user.id;
    cachedIsAdmin = null;
  }
  if (cachedIsAdmin !== null) return cachedIsAdmin;

  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    cachedIsAdmin = false;
    return false;
  }
  cachedIsAdmin = data === true;
  return cachedIsAdmin;
}

function handleError(error) {
  if (error?.code === '42501') throw new Error('Keine Admin-Berechtigung.');
  throw error;
}

export async function listUsers({ limit = 100, offset = 0 } = {}) {
  const { data, error } = await supabase.rpc('admin_list_users', {
    p_limit: limit,
    p_offset: offset,
  });
  if (error) handleError(error);
  return data ?? [];
}

export async function statsDaily(days = 30) {
  const { data, error } = await supabase.rpc('admin_stats_daily_fn', {
    p_days: days,
  });
  if (error) handleError(error);
  return data ?? [];
}

export async function statsActiveUsers() {
  const { data, error } = await supabase.rpc('admin_stats_active_users_fn');
  if (error) handleError(error);
  return data ?? null;
}

export async function topPlayers(game, limit = 10) {
  const { data, error } = await supabase.rpc('admin_top_players', {
    p_game: game,
    p_limit: limit,
  });
  if (error) handleError(error);
  return data ?? [];
}
