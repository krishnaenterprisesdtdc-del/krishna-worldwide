import { json, clean, rateLimit } from '../_lib.js';

// POST /api/feedback  -> stores customer feedback in KV (binding: KRW_KV)
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  // Honeypot: bots fill the hidden field. Pretend success.
  if (body.website) return json({ ok: true });

  const name = clean(body.name, 60);
  const contact = clean(body.contact, 80);
  const message = clean(body.message, 800);
  const rating = Number(body.rating);

  if (!name) return json({ error: 'Please enter your name.' }, 400);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: 'Please select a rating from 1 to 5.' }, 400);
  if (message.length < 3) return json({ error: 'Please write your feedback.' }, 400);

  if (!env.KRW_KV) return json({ error: 'Feedback storage is not set up yet.' }, 503);
  if (!(await rateLimit(env, request, 'fb', 5, 3600))) return json({ error: 'Too many submissions. Please try later.' }, 429);

  const id = `fb:${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  await env.KRW_KV.put(id, JSON.stringify({ name, contact, rating, message, at: new Date().toISOString() }));
  return json({ ok: true });
}
