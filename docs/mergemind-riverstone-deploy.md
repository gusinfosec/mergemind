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
- `src/action.js`, `README.md`, `.github/workflows/pr-ai-describer.yml`, and `api/.env.example`
  already default to `https://api.mergemind.dev/api/validate-key`.

## Smoke test (from riverstone)

```bash
curl -s http://127.0.0.1:3004/                                   # OK
curl -s -X POST http://127.0.0.1:3004/api/validate-key \
  -H 'Content-Type: application/json' -d '{"key":"x"}'           # valid:false
```

## Rollback

- Stop the container: `ssh riverstone 'cd ~/mergemind && docker compose down'`
- Point `MERGEMIND_VALIDATION_URL` defaults back to Railway if it ever comes back.
