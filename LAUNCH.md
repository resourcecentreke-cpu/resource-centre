# Launch Checklist — Resource Centre

Operational guide for taking the platform from "builds locally" to "live in production". Pair this with **ROADMAP.md** (architecture) and **README.md** (quick start).

## 1. Local bring-up (verify the whole stack)

```bash
cp .env.example .env          # fill secrets (see §3)
pnpm install
docker compose up -d          # postgres + redis + meilisearch
pnpm db:generate              # Prisma client
pnpm db:migrate               # create tables
pnpm db:seed                  # categories, sellers, 61 products, offers, history
pnpm --filter @rc/api search:reindex   # populate Meilisearch
pnpm dev                      # web :3000 · api :4000 · admin :3001
```

Smoke test: `GET /api/health/ready` returns `db: up`; the storefront home lists products; `/api/docs` shows Swagger.

## 2. Tests & CI

- `pnpm test` runs the Jest suites (price, M-Pesa, matching, trust, analytics, search, alerts, reviews).
- GitHub Actions (`.github/workflows/ci.yml`) runs install → prisma generate → lint → typecheck → test → build on every push/PR.
- Before launch, raise coverage on the service layer (currently the pure utils are covered; add integration tests against a throwaway Postgres).

## 3. Required credentials (production)

| Area | Variables | Where to get them |
|---|---|---|
| Database | `DATABASE_URL` | Managed Postgres (Neon, RDS, Railway…) |
| Cache/queues | `REDIS_URL` | Managed Redis |
| Search | `MEILI_HOST`, `MEILI_MASTER_KEY` | Self-host Meilisearch or Meilisearch Cloud |
| Auth | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Generate strong random secrets |
| Email | `SMTP_*`, `MAIL_FROM` | Transactional email provider |
| SMS | `SMS_API_KEY`, `SMS_USERNAME` | Africa's Talking (or chosen gateway) |
| WhatsApp | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | WhatsApp Cloud API |
| M-Pesa | `MPESA_*` | Safaricom Daraja — **needs go-live approval + registered shortcode** |
| Admin | `ADMIN_EMAILS` | Your admin account email(s) |
| Ads/affiliate | `ADSENSE_CLIENT_ID`, affiliate codes | AdSense + each store's programme |

Never commit `.env`. Use your platform's secret manager.

## 4. Deployment

- **API** and **web** ship with multi-stage `Dockerfile`s. Build and run behind a reverse proxy (TLS terminating).
- Run **one** worker process for BullMQ jobs (alerts evaluation, trust recompute, price ingestion) — the same API image works; ensure Redis is shared.
- `MPESA_CALLBACK_URL` must be a public HTTPS URL reaching `POST /api/payments/callback`.
- Set `CORS_ORIGIN` to the storefront origin.
- Point the storefront `API_BASE_URL` at the API; keep the `/api` rewrite for the browser.

## 5. Data & jobs

- **Price ingestion** (Phase 9): simulation adapter is on by default (`INGEST_SIMULATION=true`) — turn it off in production and configure real sources (`INGEST_FEED_URL` or per-store adapters). Respect robots.txt + rate limits; prefer official feeds/affiliate APIs.
- After each ingestion run, refresh search (`search:reindex`) — wire this as a follow-up job.
- Schedules: alerts every `ALERTS_INTERVAL_MS`, trust every `TRUST_RECOMPUTE_MS`, ingestion every `INGEST_INTERVAL_MS`.

## 6. Security & compliance

- Rate limiting (throttler) and security headers (helmet) are enabled; tune limits per route as needed.
- Passwords are Argon2-hashed; refresh tokens stored hashed and revocable.
- Personal data: store minimally, support account deletion, send only opted-in channels.
- Reviews go through moderation before appearing publicly.
- Publish a privacy policy, terms, and affiliate/ad disclosures.

## 7. Observability & backups

- [ ] Centralised logs + error tracking (e.g. Sentry) wired into the global exception filter.
- [ ] Uptime monitor on `/api/health/ready`.
- [ ] Automated daily Postgres backups + tested restore.
- [ ] Alerting on job failures (BullMQ failed counts).

## 8. Go-live checklist

- [ ] Real, auto-refreshing prices for the launch set of sellers
- [ ] Search + autocomplete + filters live
- [ ] Accounts, alerts (email min.), at least one of SMS/WhatsApp
- [ ] Seller trust scores + moderated reviews
- [ ] Admin can manage products, sellers, reviews, sponsored slots
- [ ] M-Pesa subscriptions/sponsored working in production
- [ ] PWA installable (add 192/512 PNG icons); barcode scan; Swahili + English
- [ ] CI green; backups + monitoring in place
- [ ] Privacy policy, terms, disclosures published
