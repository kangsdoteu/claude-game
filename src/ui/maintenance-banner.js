import { supabase } from '../api/supabase.js';

let cache = null;
let inflight = null;
let cacheEpoch = 0;
let currentHost = null;
const TTL_MS = 60_000;
const DISMISS_PREFIX = 'mb:dismissed:';
const FAIL_OPEN = [];

export async function initMaintenanceBanner(host) {
  currentHost = host;
  await renderBanner();
}

export function invalidateMaintenanceBanner() {
  cache = null;
  inflight = null;
  cacheEpoch++;
}

export async function refreshMaintenanceBanner() {
  invalidateMaintenanceBanner();
  if (currentHost) await renderBanner();
}

async function fetchAnnouncements() {
  if (cache && Date.now() < cache.expiresAt) return cache.data;
  if (inflight) return inflight;
  const myEpoch = cacheEpoch;
  inflight = (async () => {
    try {
      const { data, error } = await supabase
        .from('site_announcements')
        .select('id, message, severity, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error || !data) return FAIL_OPEN;
      if (myEpoch === cacheEpoch) cache = { data, expiresAt: Date.now() + TTL_MS };
      return data;
    } catch { return FAIL_OPEN; }
  })();
  try { return await inflight; } finally { inflight = null; }
}

async function renderBanner() {
  // Remove existing
  const existing = currentHost.querySelector('.maintenance-banner');
  if (existing) existing.remove();

  const list = await fetchAnnouncements();
  if (!list || list.length === 0) return;

  // Find first non-dismissed
  let chosen = null;
  for (const a of list) {
    if (!localStorage.getItem(DISMISS_PREFIX + a.id)) { chosen = a; break; }
  }
  if (!chosen) return;

  const banner = document.createElement('div');
  banner.className = `maintenance-banner maintenance-banner--${chosen.severity}`;
  banner.setAttribute('role', 'status');

  const msg = document.createElement('span');
  msg.className = 'maintenance-banner-msg';
  msg.textContent = chosen.message;

  const dismiss = document.createElement('button');
  dismiss.className = 'maintenance-banner-dismiss';
  dismiss.setAttribute('aria-label', 'Schließen');
  dismiss.textContent = '×';
  dismiss.addEventListener('click', () => {
    localStorage.setItem(DISMISS_PREFIX + chosen.id, '1');
    banner.remove();
  });

  banner.append(msg, dismiss);

  // Insert between nav and main (#app)
  const app = currentHost.querySelector('#app');
  if (app) currentHost.insertBefore(banner, app);
  else currentHost.appendChild(banner);
}
