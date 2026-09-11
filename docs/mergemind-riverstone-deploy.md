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

## Stripe key (fixed Sep 11, 2026)

`STRIPE_SECRET_KEY` in `~/mergemind/api.env` **was expired** (`sk_live_…ES9Sop`,
`Expired API Key provided`); it has been replaced with the working live key the
rest of the fleet uses (`…zEIV`), and the container recreated with
`docker compose up -d --force-recreate` (a plain `restart` does **not** re-read
`env_file`). A backup of the previous file is kept next to it as
`api.env.bak-<timestamp>`.

Verified after the swap: `POST /api/checkout` went from
`{"error":"Expired API Key provided…"}` to a real
`https://checkout.stripe.com/c/pay/cs_live_…` session URL.

Worth knowing for the next rotation: **the customer purchase path never needed
this key.** Live purchases go through the Stripe Payment Link and are verified by
`stripe.webhooks.constructEvent`, which is a *local* HMAC check that makes no
Stripe API call. Probed directly: valid signature → `200`, tampered → `400`,
unsigned → `400`. So a dead key breaks server-created checkout, refunds and any
future billing portal — but not the link a customer clicks.

Also verified: Resend domain `cyberglobal.ai` is `verified`, `EMAIL_FROM=noreply@cyberglobal.ai`.

## Analytics retention (added Sep 11, 2026)

The site's visit analytics land in the shared Cyber Global Supabase `events`
table (all products share it; the `product` column separates them). The privacy
policy commits to keeping events for **up to 24 months**, so riverstone also runs:

| Path | What |
|---|---|
| `~/scripts/cgt-analytics-prune.sh` | Deletes `events` rows older than the window |
| `~/.config/systemd/user/cgt-analytics-prune.{service,timer}` | Weekly trigger (`Persistent=true`) |
| `~/.config/cgt-analytics.env` | `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (mode 600) |
| `~/logs/cgt-analytics-prune.log` | One line per run: cutoff + rows deleted |

The service-role key is required because RLS blocks anon deletes; it lives in its
own file rather than borrowing another product's env. Delete the timer if the
retention clause in `web/privacy.html` §5 ever changes.

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
