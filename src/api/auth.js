import { supabase } from './supabase.js';

const ERROR_MAP = {
  'Invalid login credentials': 'Ungültige E-Mail oder Passwort.',
  'User already registered': 'Diese E-Mail ist bereits registriert.',
  'Email not confirmed': 'Bitte bestätige zuerst deine E-Mail.',
  'Password should be at least 6 characters': 'Passwort muss mindestens 6 Zeichen haben.',
};

function mapError(msg) {
  return ERROR_MAP[msg] ?? msg;
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(mapError(error.message));
}

export async function signUp(email, password, displayName) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw new Error(mapError(error.message));
}

export async function signOut() {
  await supabase.auth.signOut();
}

// Use for UI state only (not security-critical)
export function getSession() {
  return supabase.auth.getSession().then(({ data }) => data.session);
}

// Use for security-critical checks (validates server-side)
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Returns unsubscribe function — call it on page destroy
export function onAuthChange(cb) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => cb(session));
  return () => subscription.unsubscribe();
}
