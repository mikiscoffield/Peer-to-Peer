# Update: Telegram-only receipts

For the current customer flow, deploy the latest **main** commit on your existing Render service (Manual Deploy → Deploy latest commit if auto-deploy is off). No new Supabase or admin setup is needed. Screenshots go directly to @ChristianAbe through Telegram; users attach them manually. Existing database/admin configuration can remain to access historical records, but new orders and screenshots are not saved by the website.

Test 6 USDT → 1,093.20 ETB, confirm the large payment amount and telebirr details, then open the Telegram button and attach a harmless test photo. Test an arbitrary wallet address to verify that no address format/network matching blocks payment.

For @cheapusdtbot: @BotFather → `/setmenubutton` → select @cheapusdtbot → button text **Buy USDT** → your Render HTTPS URL. Then configure the Main Mini App URL under `/mybots` if desired. Never send your bot token in chat.

The previous instructions below describe the optional historical receipt storage and initial hosting setup. Automatic receipt notifications from the website no longer apply because website uploads are disabled.

---

# Publish Lykun as a Telegram Mini App

This path uses Render Free + Supabase Free + Render's HTTPS `*.onrender.com` address. A custom domain is optional and usually costs money. Free quotas, pauses and provider policies can change: check the current dashboards and eligibility for your business before accepting customers. Do not choose paid plans or enable paid upgrades for this walkthrough.

## 1. Create your Telegram bot
Open the verified @BotFather in Telegram. Send `/newbot`, choose a display name (for example Lykun Exchange), then a unique username ending in `bot`. Keep the bot token private. Do not paste it into this chat, GitHub, frontend files or screenshots. You can set the token later in Render's secret environment settings. Open your new bot and tap Start.

## 2. Create durable private storage
1. Sign in at https://supabase.com/dashboard and create a project on the **Free** plan. Store the database password securely; the app does not use it directly.
2. Open SQL Editor, create a query, paste all of `deploy/supabase.sql`, and run it. It creates the orders table and a **private** receipts bucket. Do not make the bucket public or add anonymous access policies.
3. Find the project API settings. Copy the project URL (`https://PROJECT.supabase.co`) and the **legacy service_role API key** for server-side use. UI labels may differ. Never use the anon key here. Keep the service role key private; it has privileged project access.

## 3. Deploy the GitHub repository on Render
1. Sign in at https://dashboard.render.com using GitHub. Grant access to `mikiscoffield/Peer-to-Peer`.
2. Choose New → Blueprint and select that repository, branch `main`. Render reads `render.yaml`.
3. Confirm the web service is on the **Free** plan and no paid resources are selected.
4. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` with the values from step 2. These go only into Render environment settings.
5. Deploy. The blueprint runs `npm ci --ignore-scripts && npm test`, starts `npm start`, and generates an `ADMIN_TOKEN`.
6. Copy the HTTPS service URL Render assigns, for example `https://lykun-exchange-xxxx.onrender.com`. This is your free hosting address; no separate domain purchase or DNS setup is required.
7. View `ADMIN_TOKEN` privately in the service environment settings and save it in a password manager. Visit your service URL plus `/admin`, then enter the token. Do not put it in a URL.

If using a manual Web Service instead of Blueprint: choose Node, branch main, Free instance, the same build/start commands, Node 24, and set a long random ADMIN_TOKEN yourself, plus the two Supabase variables and USDT_ETB_RATE=182.2.

## 4. Test before connecting Telegram
- Open the deployed site on your phone. Choose a network and enter 6 USDT: expect **1,093.20 ETB**.
- Verify your actual telebirr account is 0953610009, holder Lykun.
- Use a harmless test picture rather than making a real payment. Submit with a valid test receiving address.
- Open `/admin`: confirm the record and picture are visible only after authentication. Verify the row and object in Supabase as well.
- Restart the Render service; confirm the order and screenshot remain accessible.
- With no admin token, `/api/admin/orders` must return authentication required.
- The first request after inactivity may be slow on a free host. Storage quota and database pauses can interrupt service. Monitor both dashboards. The admin page shows the most recent 1,000 orders.

## 5. Connect the app in Telegram
1. In @BotFather, send `/setmenubutton` and select your bot.
2. Set the button text to **Buy USDT** and the web app URL to your Render HTTPS URL.
3. In BotFather's `/mybots` → your bot → Bot Settings, find Configure Mini App / Main Mini App (labels can change) and set the same URL if you want an **Open App** button on the bot profile.
4. Open your bot on your phone, tap Start, then tap Buy USDT. Test the whole flow inside Telegram.
5. Share `https://t.me/YOUR_BOT_USERNAME`. Once the Main Mini App is configured, test `https://t.me/YOUR_BOT_USERNAME?startapp` before sharing that direct app link.

## 6. Optional Telegram receipt notifications
Direct customer messages to @ChristianAbe already work without a bot token. Automatic admin notifications require your bot token and your numeric Telegram chat ID.

To obtain the ID without giving a third-party bot your credentials: send a new message to your bot, then on your own trusted computer use an interactive terminal prompt (token is hidden, never hard-coded):
```python
import getpass, json, urllib.request
key = getpass.getpass('Bot token: ')
with urllib.request.urlopen('https://api.telegram.org/bot'+key+'/getUpdates') as r:
    updates = json.load(r)
for item in updates.get('result', []):
    chat = item.get('message', {}).get('chat', {})
    if chat:
        print(chat.get('id'), chat.get('username', '(no username)'))
```
Choose your own private chat ID. In Render, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID`, then redeploy. Submit another harmless test receipt and confirm it arrives. Never publish the token; regenerate it in BotFather if exposed. If you already use a bot webhook, getUpdates may not work; use a dedicated new bot or obtain the ID from your existing bot integration without deleting its webhook.

## 7. Operational settings
- Update `USDT_ETB_RATE` in Render when your listed rate changes; redeploy to apply.
- Set `ENABLED_NETWORKS` to only the networks you can actually fulfill. Defaults are provisional major networks, not a current Binance API listing.
- Confirm actual network support, transfer fees, delivery timing, refunds and legal/privacy terms before going public. Payments and USDT delivery remain manual.
- Supabase service-role access belongs only to the backend. Never paste it into browser code.
- Periodically delete expired receipt objects and matching order rows according to your published retention policy; monitor storage usage and back up appropriately.
- Current upload throttling is per server socket IP. Reverse proxies can group customers behind one IP, so a busy production service needs trusted proxy-aware shared rate limiting. Do not simply trust arbitrary forwarded headers.
- Free hosting is suitable for a small pilot; it does not guarantee continuous availability. Hosting providers may restrict financial services. Verify their current terms and applicable requirements before accepting payments.
