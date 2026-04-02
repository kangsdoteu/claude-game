import { supabase } from './supabase.js';

// user_id intentionally NOT sent — uses DEFAULT auth.uid() in DB
export async function saveScore(game, score, durationSeconds) {
  const { data, error } = await supabase
    .from('scores')
    .insert({ game, score, duration_seconds: durationSeconds })
    .select()
    .single();

  if (error?.code === '42501') throw new Error('Score abgelehnt (Limit oder Rate-Limit).');
  if (error) throw error;
  return data;
}

export async function getLeaderboard(game, limit = 10) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('display_name, score, duration_seconds, created_at')
    .eq('game', game)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
