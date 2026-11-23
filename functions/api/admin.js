import { json, clean, isAdmin, rateLimit } from '../_lib.js';

// Owner-only API (Authorization: Bearer <ADMIN_PASSWORD>)
//  GET  /api/admin            -> list feedback (newest first)
//  POST /api/admin {action:"track", id, status, note}   -> set tracking record
//  POST /api/admin {action:"delete_feedback", key}      -> delete one feedback
const STATUSES = ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];

async function guard({ request, env }) {
  // Limit wrong-password guessing: 10 attempts per 15 min per IP.
  if (!isAdmin(request, env)) {
    if (!(await rateLimit(env, request, 'adm', 10, 900))) return json({ error: 'Too many attempts. Try later.' }, 429);
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!env.KRW_KV) return json({ error: 'KV not configured' }, 503);
  return null;
}

export async function onRequestGet(ctx) {
  const denied = await guard(ctx);
  if (denied) return denied;
  const list = await ctx.env.KRW_KV.list({ prefix: 'fb:', limit: 500 });
  const items = [];
  for (const k of list.keys) {
    const raw = await ctx.env.KRW_KV.get(k.name);
    if (raw) { try { items.push({ key: k.name, ...JSON.parse(raw) }); } catch {} }
  }
  items.sort((a, b) => (a.at < b.at ? 1 : -1));
  return json({ feedback: items });
}

export async function onRequestPost(ctx) {
  const denied = await guard(ctx);
  if (denied) return denied;
  let b;
  try { b = await ctx.request.json(); } catch { return json({ error: 'Invalid request' }, 400); }

  if (b.action === 'track') {
    const id = clean(b.id, 30).toUpperCase();
    const status = STATUSES.includes(b.status) ? b.status : null;
    if (!/^[A-Z0-9-]{4,30}$/.test(id) || !status) return json({ error: 'Bad ID or status' }, 400);
    await ctx.env.KRW_KV.put('track:' + id, JSON.stringify({
      status, note: clean(b.note, 160), updated: new Date().toISOString().slice(0, 10),
    }));
    return json({ ok: true });
  }
  if (b.action === 'delete_feedback') {
    const key = String(b.key || '');
    if (!/^fb:[0-9]+-[a-f0-9-]{8}$/.test(key)) return json({ error: 'Bad key' }, 400);
    await ctx.env.KRW_KV.delete(key);
    return json({ ok: true });
  }
  return json({ error: 'Unknown action' }, 400);
}
