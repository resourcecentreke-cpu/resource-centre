# Resource Centre — Monorepo

Kenya electronics price-comparison platform. See **ROADMAP.md** for the full build plan.

## Stack
Turborepo · Next.js (web) · NestJS (api) · PostgreSQL + Prisma · Meilisearch · Redis/BullMQ.

## Layout
```
apps/web      Next.js storefront
apps/api      NestJS backend (REST)
apps/admin    Admin dashboard (Next.js, gated)
packages/db   Prisma schema, migrations, seed
packages/types Shared TypeScript types
packages/config Shared eslint/prettier/tailwind presets
legacy-static The original site (still deployable on Firebase)
```

## Quick start
```bash
cp .env.example .env          # fill values as phases need them
pnpm install                  # install workspace deps
docker compose up -d          # postgres + redis + meilisearch
pnpm dev                      # runs web (:3000) + api (:4000)
```
Open http://localhost:3000 — the landing page calls the API at `/api/health`.

## Status
**Phase 13 complete — platform build done.** Hardening: helmet, rate limiting (throttler), global exception filter. 8 Jest util suites. GitHub Actions CI (lint/typecheck/test/build). API + web Dockerfiles. LAUNCH.md go-live checklist.
