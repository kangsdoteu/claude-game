import { getUser } from '../../api/auth.js';
import { isAdmin } from '../../api/admin.js';

// Returns user if admin, otherwise redirects to home and returns null.
export async function ensureAdmin() {
  const user = await getUser();
  if (!user) { location.hash = '#/'; return null; }
  const ok = await isAdmin();
  if (!ok) { location.hash = '#/'; return null; }
  return user;
}
