# Lykun · ETB to USDT
Mobile-first Telegram mini app and a Node.js backend. No npm dependencies. Node 22+.

## Run
```sh
npm start
npm test
```
The server uses port 3000. For local screenshot testing, run `ADMIN_TOKEN=your-long-random-local-token npm start`, then visit `/admin` and enter that token. With no token, uploads are disabled and customers use the Telegram alternative. The token stays on the server and in admin-page memory, never browser storage.

## Launch configuration
Set environment variables using `.env.example` as a reference. Node does not automatically load that file; inject variables using your hosting service or `node --env-file=.env server.js` after creating your own private `.env`.

- `ADMIN_TOKEN`: long, random secret for the protected admin inbox. Generate with `openssl rand -hex 32`. Set securely in hosting settings.
- `DATA_DIR`: private persistent storage. Orders and receipt images are saved here; never serve it publicly. Configure backups, disk limits, and a retention/deletion policy.
- `USDT_ETB_RATE`: manually maintained listed rate (default 182.2). No live market feed is implied.
- `ENABLED_NETWORKS`: comma-separated supported IDs. The included major-network list is provisional, not a live Binance integration. Confirm current Binance USDT availability and your ability to fulfill each network. Disable unsupported networks before accepting payment.
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID`: optional notifications with receipt attachment. Create a bot through BotFather and start it from the receiving admin account. A username alone cannot authorize bot delivery. Orders remain available in the inbox if notification delivery fails. Email delivery is not implemented.

Deploy behind HTTPS with durable storage. Configure your Telegram bot's Mini App URL through BotFather. Both Telegram and ordinary browser flows work. No Telegram identity is trusted or used for authorization. Local files and active processes do not replace deployment. Review applicable requirements, account ownership, network list, legal terms, fees, refunds and delivery expectations before public launch. The telebirr symbol is a vector approximation; replace with an approved brand asset if available.

## Flow
Choose network, enter at least 6 USDT and a receiving address, review ETB total, then pay 0953610009 (Lykun). Upload a receipt or send it to @ChristianAbe. The app validates address shapes, not ownership, chain activity or cryptographic checksums. TON users must supply their receiving memo when required. Payments are pending manual review; this app neither verifies telebirr transfers nor sends USDT automatically.

## Security and operation
Receipts require admin bearer authentication and are never exposed as static files. Uploads have size/type/signature checks and a basic in-memory rate limit (10 attempts per socket IP/hour). Configure a trusted reverse proxy and production rate limiting before a public launch; do not trust arbitrary forwarded IP headers. Image signatures are not malware scanning. The simple inbox lists all orders and is intended for a small initial deployment. Restarting clears rate-limit counters. No secrets belong in source control. Run only one instance against the local file store. Add a database/object store for scaling.

## Free Telegram deployment
Follow [DEPLOY.md](DEPLOY.md) for Render Free hosting, a free HTTPS subdomain, private Supabase storage, and BotFather setup. `render.yaml` defines the service and `deploy/supabase.sql` defines private storage. Setting both Supabase variables enables durable storage instead of local files. The admin inbox lists the most recent 1,000 Supabase orders.
