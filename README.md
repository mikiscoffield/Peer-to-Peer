# Lykun · Static Telegram Mini App

A mobile-first ETB-to-USDT purchase interface. The production site is static: no running backend, database or secrets are required. Payment screenshots and order details are sent by the customer to @ChristianAbe on Telegram; payment review and USDT delivery remain manual.

## Local development
Node.js 22+; no npm dependencies.
```
npm ci --ignore-scripts
npm test
npm start
```
`npm start` builds the static assets and serves a local preview on port 3000 (override with PORT). `npm run build` publishes only customer-facing files into `dist/`.

## Rate and networks
Edit `public/config.json` and redeploy to change the rate (default 182.2 ETB/USDT) or network list. This file is public: never put keys or tokens in it. Render's old USDT_ETB_RATE and ENABLED_NETWORKS environment variables do not control the static site. The network list is provisional, not synchronized with Binance. Wallet/network matching is not validated. Minimum purchase is 6 USDT. Network fees are additional and buyer-paid. Delivery is usually under 15 minutes after payment confirmation, not guaranteed. Approved refunds have a 5% deduction; eligibility remains operator-managed.

## Deployment
See [DEPLOY.md](DEPLOY.md). `render.yaml` creates a new free Static Site named lykun-static. Static sites have no server process to sleep, but provider quotas, policies, outages and account restrictions still apply. Deploy only `dist/`, never the repository root.

## Historical backend
`server.js`, `storage.js`, `deploy/supabase.sql` and the old admin files are retained for historical receipt access and are not deployed in the static output. `npm run start:legacy` runs the old development server, whose production API is not used by the static app. Do not delete existing databases or historical data as part of migration. The static customer app uses no admin tokens, Supabase keys, or Telegram bot tokens.
