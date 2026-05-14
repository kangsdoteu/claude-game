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

export async function logAuditAction(action, { targetType = null, targetId = null, payload = null } = {}) {
  const { data, error } = await supabase.rpc('admin_log_action', {
    p_action: action,
    p_target_type: targetType,
    p_target_id: targetId,
    p_payload: payload,
  });
  if (error) handleError(error);
  return data;
}

export async function listAuditLog({ limit = 100, offset = 0 } = {}) {
  const { data, error } = await supabase.rpc('admin_list_audit_log', {
    p_limit: limit,
    p_offset: offset,
  });
  if (error) handleError(error);
  return data ?? [];
}

export async function deleteScore(scoreId, reason = null) {
  const { error } = await supabase.rpc('admin_delete_score', {
    p_score_id: scoreId,
    p_reason: reason,
  });
  if (error) handleError(error);
}

export async function banUser(userId, reason = null) {
  const { error } = await supabase.rpc('admin_ban_user', {
    p_user_id: userId,
    p_reason: reason,
  });
  if (error) handleError(error);
}

export async function unbanUser(userId) {
  const { error } = await supabase.rpc('admin_unban_user', {
    p_user_id: userId,
  });
  if (error) handleError(error);
}

export async function rateLimitRecent(hours = 1) {
  const { data, error } = await supabase.rpc('admin_rate_limit_recent', {
    p_hours: hours,
  });
  if (error) handleError(error);
  return data ?? [];
}

export async function listRecentScores({ limit = 50, offset = 0, game = null } = {}) {
  let query = supabase
    .from('scores')
    .select('id, game, score, duration_seconds, created_at, user_id, profiles(display_name)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (game) query = query.eq('game', game);
  const { data, error } = await query;
  if (error) handleError(error);
  return data ?? [];
}
