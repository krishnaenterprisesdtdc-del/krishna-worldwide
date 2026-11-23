# Krishna Worldwide – Cloudflare Pages deployment

## Files
```
index.html, styles.css, app.js     website
_headers                           security headers
owner/index.html, owner/owner.js   hidden owner page  ->  yoursite.com/owner/
functions/_lib.js                  shared helpers
functions/api/feedback.js          saves customer feedback
functions/api/track.js             parcel tracking lookup
functions/api/chat.js              "Ask Krishna AI" (Claude)
functions/api/admin.js             owner API (feedback list, tracking update)
```

## Deploy
1. Create a Cloudflare Pages project (upload this folder, or connect a GitHub repo). No build command; output directory is the root (`/`).
2. Cloudflare dashboard -> Workers & Pages -> KV -> **Create namespace** (name: `krw`).
3. Your Pages project -> Settings -> Functions -> **KV namespace bindings** -> add variable name `KRW_KV` pointing to that namespace (set for Production and Preview).
4. Settings -> Variables and Secrets (encrypt them):
   - `ADMIN_PASSWORD`  – a long strong password for /owner/
   - `ANTHROPIC_API_KEY` – for the Ask Krishna AI chat (optional; chat shows a call/WhatsApp message without it)
5. Redeploy once so the bindings take effect.

## Using it
- Owner page: `https://yoursite.com/owner/` (no link anywhere on the site). View/delete feedback and update tracking IDs there.
- Test tracking with demo ID `KRW1001`.
- Feedback is stored privately in KV and is not shown publicly.
