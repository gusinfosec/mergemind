# MergeMind API — RiverStone Deploy

> **MIGRATED Aug 11, 2026** — API moved from Railway (`mergemind-production.up.railway.app`,
> which was already dead/404) to riverstone. Now served at **`https://api.mergemind.dev`**.

## What runs here

The **`api/`** folder (TypeScript Express): license key store, `POST /api/validate-key`,
admin key management (`/api/admin/keys`), Stripe checkout + webhook, health at `/`.

## Deploy layout (mirrors vendorsafe)

| Path (riverstone) | What |
|---|---|
| `~/projects/mergemind/` | Source (rsynced from this repo) |
| `~/mergemind/docker-compose.yml` | Compose (build context `../projects/mergemind/api`) |
| `~/mergemind/api.env` | Secrets (mode 600) |
| `~/mergemind/data/` | License key store — **persisted volume** mounted at `/data` |

Container: `mergemind-api`, bound to **`127.0.0.1:3004` → `:3000`** (3003 is taken by reportsafe).

## Redeploy after code changes

```bash
rsync -az --delete --exclude node_modules --exclude dist --exclude .git ./ riverstone:~/projects/mergemind/
ssh riverstone 'cd ~/mergemind && docker compose up -d --build'
```

## Env vars (`~/mergemind/api.env`)

| Var | Value |
|---|---|
| `PORT` | `3000` |
| `APP_URL` | `https://api.mergemind.dev` |
| `KEYS_DB_PATH` | `/data/keys.json` (persisted volume) |
| `ADMIN_SECRET` | hex — used for `x-admin-secret` on admin routes |
| `STRIPE_SECRET_KEY` | shared CGT live key |
| `STRIPE_WEBHOOK_SECRET` | whsec — **Aug 11: recreated with the new endpoint** (matches `we_1U3LXEFnIuEgeFxObRhchTq8`) |
| `PRICE_LICENSE` | `price_1TRfl1FnIuEgeFxOKGsbD1Ph` |
| `SITE_URL` | `https://mergemind.dev` — checkout success/cancel redirects (never the API host) |
| `RESEND_API_KEY` | shared CGT Resend key (same as compliance-ai/review-site) — **license email delivery** |
| `EMAIL_FROM` | `noreply@cyberglobal.ai` — domain must be verified in Resend |

## ⚠️ Known state (verified Sep 11, 2026)

**`STRIPE_SECRET_KEY` in `~/mergemind/api.env` is EXPIRED.** `GET /v1/balance`
returns `Expired API Key provided: sk_live_…ES9Sop`, and every other service on
riverstone carries a different, working key (tail `Jkye7` / `B9uqN` / `FTohX` /
`GzEIV` / `o1Idw`).

What this does **not** break — verified, not assumed:

- **The customer purchase path still works.** Live purchases go through the Stripe
  Payment Link (`buy.stripe.com/…`) and are verified by `stripe.webhooks.constructEvent`,
  which is a *local* HMAC check and makes no Stripe API call. Probed against the live
  endpoint: valid signature → `200`, tampered → `400`, unsigned → `400`.
- **License key delivery works.** Resend domain `cyberglobal.ai` is `verified` and
  `EMAIL_FROM=noreply@cyberglobal.ai`.

What it does break: any code path that calls the Stripe API — currently only
`api/src/routes/billing.ts` (`checkout.sessions.create`), which the website no longer
uses (it links straight to the Payment Link). Fix before building refunds, a billing
portal or server-created checkout sessions.

To fix: put a working live key in `~/mergemind/api.env`, then
`docker compose up -d --force-recreate` (a plain `restart` does not re-read `env_file`).

## Stripe webhook (Aug 11, 2026)

- **Endpoint `we_1U3LXEFnIuEgeFxObRhchTq8`** (created via API) →
  `https://api.mergemind.dev/api/stripe/webhook`
- Event: `checkout.session.completed` · API version: `2026-04-22.dahlia`
  (matches inboxsafe; account is at the 3-unique-version limit)
- Secret: `whsec_...` in `~/mergemind/api.env` — regenerated at creation, already
  set. Signed test event verified end-to-end (license issued, then test key
  removed from `~/mergemind/data/keys.json`).
- ⚠️ After changing `api.env`, run `docker compose up -d --force-recreate`
  (a plain `docker restart` does NOT re-read `env_file`).

> ⚠️ `ADMIN_SECRET` and the Stripe keys were regenerated/pulled from the shared CGT account
> during the Aug 11 migration because the Railway env was unrecoverable.
> The Stripe webhook endpoint itself did not exist on the account before Aug 11 —
> it was created during this migration (see below).

## Public URL (`api.mergemind.dev`)

- Cloudflare **Zero Trust → Networks → Tunnels** → cloudflared tunnel → **Public Hostname**:
  - Hostname: `api.mergemind.dev` → Service: **HTTP → `mergemind-api:3000`**
- cloudflared container is attached to `mergemind_default` network
  (re-attach after recreating cloudflared: `docker network connect mergemind_default cloudflared`)
- `src/action.js`, `README.md`, `.github/workflows/pr-describer.yml`, and `api/.env.example`
  already default to `https://api.mergemind.dev/api/validate-key`.

## License key delivery (email, added Sep 2026)

On `checkout.session.completed` the webhook now:

1. Creates the license record in `keys.json` (as before).
2. Emails the key to the buyer via **Resend** (`RESEND_API_KEY` / `EMAIL_FROM`).
3. Records delivery status on the record (`delivery.sentAt` or `delivery.error`) —
   visible via `GET /api/admin/keys`.

Email failures never fail the webhook (Stripe would retry and mint a duplicate
key). If `RESEND_API_KEY`/`EMAIL_FROM` are unset, the webhook logs a warning and
marks `delivery.error` — the key is still retrievable via the admin API.

Buyers land on **`https://mergemind.dev/success`** after checkout (see `web/success.html`)
which explains the email + setup steps. `GET /api/checkout` is fixed to `mode: payment`
for the one-time license and redirects to `SITE_URL` (not the API host).

## Smoke test (from riverstone)

```bash
curl -s http://127.0.0.1:3004/                                   # OK
curl -s -X POST http://127.0.0.1:3004/api/validate-key \
  -H 'Content-Type: application/json' -d '{"key":"x"}'           # valid:false
```

## Rollback

- Stop the container: `ssh riverstone 'cd ~/mergemind && docker compose down'`
- Point `MERGEMIND_VALIDATION_URL` defaults back to Railway if it ever comes back.
