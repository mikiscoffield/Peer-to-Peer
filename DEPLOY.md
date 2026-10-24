# Switch Render to a free Static Site

The source is ready, but changing GitHub files does not change the existing Render Web Service into a Static Site. Create a separate Static Site; keep the old service until the new app is verified.

1. Render Dashboard → **New → Static Site** (not Web Service).
2. Connect **mikiscoffield/Peer-to-Peer**, branch **main**.
3. Name: **lykun-static** (or another available name).
4. Build command: `npm ci --ignore-scripts && npm test && npm run build`.
5. Publish directory: `dist`.
6. No start command, backend credentials or database are needed. Do not copy your old admin, Supabase or bot secrets into the Static Site. Confirm the dashboard shows the free option before creating it.
7. Deploy and copy its assigned HTTPS `*.onrender.com` URL. The new address will normally differ from the old web service URL. No custom domain purchase is needed.

Alternatively create a new Blueprint from `render.yaml`, which defines the static service and security/cache headers. Do not blindly replace/delete an existing Blueprint-managed service during this migration. For a manually created Static Site, copy the headers from render.yaml into Render's Headers settings if available. Do not add X-Frame-Options DENY or SAMEORIGIN: Telegram Web needs to embed the app.

## Test before changing Telegram
- New site loads on mobile and desktop; the network dropdown populates from `/config.json`.
- Choose a network and 6 USDT: expect 1,093.20 ETB at the default rate.
- PAY NOW displays telebirr 0953610009, holder Lykun, plus the buyer-paid network fee disclosure.
- The Telegram button opens @ChristianAbe with the purchase details; attach screenshots manually in Telegram.
- No wallet format check or website upload is required. `/admin` and `/api/*` are not part of this Static Site.
- Verify the site in Telegram before sharing it publicly. Static hosting does not have the web-service inactivity wake-up delay, but quotas and availability limits still apply.

## Connect @cheapusdtbot
1. @BotFather → `/setmenubutton` → @cheapusdtbot.
2. Enter the **new Static Site HTTPS URL** and button text **Buy USDT**.
3. `/mybots` → @cheapusdtbot → Bot Settings → Configure Mini App / Main Mini App: update that URL too if configured. UI labels may vary.
4. Reopen the bot and test. Update any ads or other links that point directly to the old website.
5. Only after this succeeds, optionally suspend/delete the old Render Web Service through its dashboard. Preserve any historical receipt data. Do not delete Supabase data simply because the new app does not use it.

## Updating the rate
Edit `public/config.json` in GitHub, change `rate`, and commit to main. Render auto-deploys if enabled. Existing Render `USDT_ETB_RATE` environment settings no longer apply. Never put secret values in public config or the publish directory.

Free-tier terms and quotas change; verify current details and financial-service eligibility in the provider's dashboard. A static deployment does not guarantee advertising approval or unlimited availability.
