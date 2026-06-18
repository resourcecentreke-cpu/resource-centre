# Resource Centre — Full Platform Build Roadmap

**Goal:** evolve the current static price-compare page into a real product: a Kenyan electronics price-comparison platform with live data, accounts, price alerts, seller trust, reviews, an admin dashboard and revenue models.

**Working model:** built incrementally, one milestone at a time, as long as it takes. Each milestone produces **real, reviewable code in this repo** — verified within the session. Nothing is deployed automatically; you (or a developer) run it locally with Docker and deploy when a phase is ready. The code persists in your folder; only the build/test sandbox is temporary.

**Last updated:** 15 June 2026

---

## 1. Guiding principles

1. **Ship vertical slices.** Each phase ends with something runnable, not a pile of half-wired parts.
2. **The existing site keeps working** the whole time. We don't break what's live; the new frontend replaces it only at Phase 12.
3. **Indicative data → real data.** Today's prices are real but ratings/stock/history are modelled. The backend's job is to make every number real and fresh.
4. **Affordable to self-host in Kenya.** Default to tools that run on a single modest VPS first, scale later.
5. **Legal and safe.** Scraping, payments and personal data are handled carefully (see §8).

---

## 2. Confirmed tech stack (recommended defaults)

| Layer | Choice | Why |
|---|---|---|
| Monorepo | **Turborepo** + pnpm workspaces | One repo, shared types between front/back, fast caching |
| Frontend | **Next.js 15 (App Router) + React + TypeScript + Tailwind** | Your spec; SSR/SEO for product pages |
| Backend | **NestJS (Node + TypeScript)** | Your spec; modular, testable, good for teams |
| Database | **PostgreSQL 16** | Relational price/seller/offer data |
| ORM | **Prisma** | Type-safe schema + migrations, easiest to maintain |
| Search | **Meilisearch** | Lighter than Elasticsearch, instant typo-tolerant autocomplete, cheap to self-host |
| Cache + queues | **Redis + BullMQ** | Caching hot queries; background jobs for alerts/scraping |
| Auth | **JWT (access + refresh) + Argon2** hashing | Standard, no third-party lock-in |
| Email | **Nodemailer** via a provider adapter (start with a transactional SMTP) | Swap providers without code changes |
| SMS / WhatsApp | **Adapter interface**, first impl via a Kenyan gateway (e.g. Africa's Talking SMS) + WhatsApp Cloud API | Pluggable; start with what's cheapest |
| Payments | **M-Pesa Daraja API** (STK Push, C2B) | For sponsored listings + seller subscriptions |
| Infra (dev) | **Docker Compose** (postgres, redis, meilisearch, api, web) | One command to run everything |
| Infra (prod) | Single VPS to start → containerised; cloud later | Keep costs low pre-revenue |
| CI | GitHub Actions | Lint, typecheck, test, build on every push |

---

## 3. Target repository structure

```
Resourcecentre/
├─ apps/
│  ├─ web/                 # Next.js storefront (replaces current static site at Phase 12)
│  ├─ api/                 # NestJS backend (REST/GraphQL)
│  ├─ admin/              # Admin dashboard (Next.js, gated)
│  └─ workers/            # BullMQ workers: price ingestion, alert evaluation, notifications
├─ packages/
│  ├─ db/                  # Prisma schema, migrations, seed scripts
│  ├─ types/              # Shared TypeScript types/DTOs
│  ├─ config/             # Shared eslint/tsconfig/tailwind presets
│  └─ ui/                  # Shared React components
├─ legacy-static/         # The current index.html, preserved & still deployable
├─ docker-compose.yml
├─ turbo.json
├─ package.json
└─ ROADMAP.md
```

The current `public/index.html` moves to `legacy-static/` so it stays live on Firebase until the Next.js app is ready to take over.

---

## 4. Data model (first cut)

Core entities and their key relationships. Refined in Phase 1.

- **Category** — id, name, slug, parent_id (self-relation for sub-categories), icon.
- **Product** — id, name, slug, brand, category_id, spec_summary, structured specs (JSON), images (JSON), is_active, created_at. *(specs become structured columns/tables over time for filtering.)*
- **Seller** — id, name, slug, website, years_in_business, return_window_days, warranty_terms, is_verified, status (pending/active/suspended).
- **SellerMetric** — seller_id, customer_rating, delivery_performance, computed **trust_score**, updated_at.
- **Offer** — id, product_id, seller_id, price, currency, delivery_fee, in_stock (enum), product_url, last_seen_at. *(one row per product×seller; the heart of price comparison.)*
- **PriceHistory** — id, offer_id (or product_id+seller_id), price, recorded_at. *(append-only; powers the history graph + lowest/highest/avg.)*
- **DeliveryEstimate** — seller_id, city, days, fee.
- **User** — id, email, phone, password_hash, locale, created_at, verified.
- **Alert** — id, user_id, product_id, target_price, channels (email/sms/whatsapp), status, last_notified_at.
- **Review** — id, type (product|store), product_id?, seller_id?, user_id, rating, body, created_at, status (for moderation).
- **AdSlot / SponsoredListing** — seller_id, product_id?, placement, starts_at, ends_at, paid_status.
- **Subscription** — seller_id, plan (basic/premium/enterprise), status, mpesa_ref, renews_at.
- **SearchEvent / ClickEvent** — lightweight analytics for the admin dashboard.

---

## 5. Phase-by-phase milestones

Each phase notes its **goal**, **main tasks**, **what you can do at the end**, and a rough **size** (sessions/days — actuals will vary). Phases are ordered so each builds on the last.

### Phase 0 — Foundation & scaffold · ~1–2 days
- Turborepo + pnpm workspaces; `apps/web`, `apps/api`, `packages/db|types|config`.
- `docker-compose.yml` with postgres, redis, meilisearch.
- Shared ESLint/Prettier/tsconfig; root scripts (`dev`, `build`, `lint`, `test`).
- Move current site into `legacy-static/`.
- **Done:** `docker compose up` boots the infra; `pnpm dev` runs an empty Next.js page + a NestJS `/health` endpoint.

### Phase 1 — Database schema & migrations · ~1–2 days
- Prisma schema for all entities in §4; first migration.
- Seed categories + the 10 sellers with their metrics.
- **Done:** `prisma migrate` creates the DB; tables visible; seed runs clean.

### Phase 2 — Seed the catalogue · ~1 day
- Import the existing **61 products + offers** (from the current `DATA` array) into Postgres.
- Generate an initial PriceHistory baseline so graphs aren't empty.
- **Done:** real products/offers queryable in the DB.

### Phase 3 — Core API · ~2–3 days
- NestJS modules: Products, Categories, Offers/PriceCompare.
- Endpoints: list/filter products, product detail with sorted offers, category listings, "best price" + min/avg/high.
- Pagination, DTO validation, error handling, OpenAPI/Swagger docs.
- **Done:** the whole current frontend's data could be served from the API.

### Phase 4 — Search & autocomplete · ~1–2 days
- Meilisearch index; sync job from Postgres; typo-tolerant search + instant autocomplete endpoint.
- Search-by-model-number, facets (brand, price, category).
- **Done:** `/search?q=` returns ranked results in <50ms; autocomplete feed ready.

### Phase 5 — Accounts & auth · ~2 days
- Register/login, email verification, JWT access+refresh, password reset, Argon2 hashing, rate limiting.
- **Done:** users can sign up, log in, and hit protected routes.

### Phase 6 — Price alerts · ~2 days
- Create/list/delete alerts; a BullMQ repeating job evaluates offers vs targets.
- **Done:** when a seeded price drops below a target, an alert is flagged "triggered."

### Phase 7 — Notifications · ~2–3 days
- Channel adapter interface; **email** first (verification + alert emails), then **SMS** and **WhatsApp** adapters behind the same interface.
- Per-user channel preferences; opt-out/unsubscribe; delivery logging.
- **Done:** a triggered alert sends a real email; SMS/WhatsApp pluggable with provider keys.

### Phase 8 — Trust scores & reviews · ~2 days
- Trust-score service (years, ratings, delivery performance, returns, warranty → 0–100), recomputed on a schedule.
- Product + store reviews with moderation status; verified-buyer flag (where determinable).
- **Done:** trust scores and real reviews served via API; moderation queue exists.

### Phase 9 — Price ingestion & history *(the hard part)* · ~1–2 weeks, iterative
- Worker framework for per-seller **adapters** that fetch current prices (official APIs/affiliate feeds where available; compliant scraping otherwise — see §8).
- Normalisation + product matching (map a seller's listing to our Product).
- Scheduled runs; write Offers + append PriceHistory; stale-offer handling.
- Start with 2–3 sellers, add the rest one adapter at a time.
- **Done:** prices refresh automatically on a schedule; history graphs become real.

### Phase 10 — Payments (M-Pesa Daraja) · ~3–4 days
- Daraja STK Push for seller subscriptions + sponsored listings; C2B callbacks; reconciliation.
- Sandbox first, then production credentials.
- **Done:** a seller can pay for a plan/placement via M-Pesa in sandbox.

### Phase 11 — Admin dashboard · ~3–5 days
- Gated `apps/admin`: manage products (add/edit specs, upload images), approve/suspend/verify sellers, moderate reviews, manage sponsored slots, view analytics (most-searched, most-clicked stores, conversions).
- **Done:** non-technical admin can run the catalogue and sellers.

### Phase 12 — New frontend on live API + PWA · ~1–2 weeks
- Rebuild today's views in `apps/web` against the API (home, category+filters, product, compare, alerts, account).
- Keep the Sunrise look; add SSR for SEO, image optimisation.
- **PWA**: installable, offline shell, push notifications; **barcode scanner** (camera → model lookup).
- Cut DNS/hosting over from the static site.
- **Done:** the real platform replaces the static page.

### Phase 13 — Hardening, tests, CI/CD, launch · ~ongoing
- Unit/integration/e2e tests; GitHub Actions pipeline; observability (logs, error tracking, uptime); backups; security review; rate limits; GDPR-style data handling for KE.
- **Done:** repeatable deploys, monitored, backed up.

---

## 6. Suggested early sequence (first two weeks)

| Day | Milestone |
|---|---|
| 1 | Phase 0 scaffold |
| 2 | Phase 1 schema + migrations |
| 3 | Phase 2 seed catalogue |
| 4–5 | Phase 3 core API |
| 6 | Phase 4 search + autocomplete |
| 7–8 | Phase 5 auth |
| 9–10 | Phase 6 alerts |
| 11–12 | Phase 7 notifications (email) |
| 13–14 | Phase 8 trust + reviews |

Then settle into Phase 9 (ingestion) as the long-running track, with Phases 10–13 interleaved.

---

## 7. Local dev & environment

**Run everything:** `docker compose up` then `pnpm dev`.

**Services (compose):** postgres:5432, redis:6379, meilisearch:7700, api:4000, web:3000.

**Key environment variables (collected in `.env`, never committed):**
- `DATABASE_URL`, `REDIS_URL`, `MEILI_HOST`, `MEILI_MASTER_KEY`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `SMTP_*` (email), `SMS_API_KEY`/`SMS_USERNAME`, `WHATSAPP_TOKEN`/`WHATSAPP_PHONE_ID`
- `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL`
- `ADSENSE_CLIENT_ID`, affiliate codes

A `.env.example` ships each phase so you always know what's needed.

---

## 8. Risks, hard parts & legal notes

- **Price ingestion is the real work.** Prefer official store APIs / affiliate product feeds (Jumia and others offer them) over scraping. Where scraping is used, respect robots.txt and terms, rate-limit politely, cache, and be ready for site changes — adapters will need maintenance. This is why Phase 9 is open-ended and per-seller.
- **Product matching** (one seller's "Galaxy S26 Ultra 512GB" = our product) needs fuzzy logic and occasional manual mapping in the admin.
- **M-Pesa** requires a registered shortcode and Safaricom approval for production; build and demo in sandbox first.
- **Notifications** cost money per SMS/WhatsApp; email is cheapest — make channels opt-in and rate-limited.
- **Personal data** (emails, phones, alerts): store minimally, hash passwords, support deletion, send only what users opted into.
- **Reviews** need moderation to stay trustworthy and avoid seller manipulation.
- **My limitations:** I can write and unit-test code each session, but I can't keep a live server/DB running between sessions or perform the Safaricom/provider account signups — those steps are yours. I'll flag exactly when a credential or manual step is needed.

---

## 9. Definition of done (launch checklist)

- [ ] Real, auto-refreshing prices for the launch set of sellers
- [ ] Search + autocomplete + filters live
- [ ] Accounts, alerts (email at minimum), and at least one of SMS/WhatsApp
- [ ] Seller trust scores + moderated reviews
- [ ] Admin can manage products, sellers, reviews, sponsored slots
- [ ] M-Pesa subscriptions/sponsored listings working in production
- [ ] PWA installable; barcode scan; Swahili + English
- [ ] Tests + CI green; backups + monitoring in place
- [ ] Privacy policy, terms, and affiliate/ad disclosures published

---

## 10. How we'll work each day

1. You open Cowork and say **"continue"** (or pick a specific phase).
2. I implement that milestone in the repo, verify it in-session, and summarise what changed + anything you need to do (e.g. add a provider key).
3. You review the code, run it locally when a phase completes, and we move on.

Cadence can switch to a scheduled daily task any time you want it to run hands-off.
