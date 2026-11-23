// Shared helpers for Cloudflare Pages Functions (files starting with "_" are not routes).

export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const clean = (s, max) =>
  String(s ?? '').replace(/[<>]/g, '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

// Constant-time string compare
export function safeEqual(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function isAdmin(request, env) {
  const h = request.headers.get('Authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  return !!env.ADMIN_PASSWORD && safeEqual(token, env.ADMIN_PASSWORD);
}

// Simple per-IP rate limit using KV (best effort). Returns true if allowed.
export async function rateLimit(env, request, bucket, limit, windowSec) {
  if (!env.KRW_KV) return true;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `rl:${bucket}:${ip}`;
  const cur = parseInt((await env.KRW_KV.get(key)) || '0', 10);
  if (cur >= limit) return false;
  await env.KRW_KV.put(key, String(cur + 1), { expirationTtl: Math.max(60, windowSec) });
  return true;
}
