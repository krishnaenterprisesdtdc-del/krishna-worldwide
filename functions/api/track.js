import { json, clean, rateLimit } from '../_lib.js';

// GET /api/track?id=KRW1001  -> looks up "track:<ID>" in KV (set from the owner page)
const DEMO = {
  KRW1001: { status: 'In Transit', note: 'Demo parcel: left Raipur hub', updated: '2026-11-22' },
};

export async function onRequestGet({ request, env }) {
  const id = clean(new URL(request.url).searchParams.get('id'), 30).toUpperCase();
  if (!/^[A-Z0-9-]{4,30}$/.test(id)) return json({ found: false });
  if (!(await rateLimit(env, request, 'trk', 40, 600))) return json({ found: false, error: 'Too many requests' }, 429);

  let rec = null;
  if (env.KRW_KV) {
    const raw = await env.KRW_KV.get('track:' + id);
    if (raw) { try { rec = JSON.parse(raw); } catch { rec = null; } }
  }
  if (!rec) rec = DEMO[id] || null;
  if (!rec) return json({ found: false });
  return json({ found: true, status: rec.status, note: rec.note || '', updated: rec.updated || '' });
}
