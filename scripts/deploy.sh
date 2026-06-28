#!/usr/bin/env bash
#
# Server-side deploy for Resource Centre.
#
# Workflow:
#   1) From your Mac, sync source up (build artifacts are rebuilt here, NOT shipped):
#        rsync -av \
#          --exclude node_modules --exclude '.next' --exclude '.turbo' \
#          --exclude 'apps/*/dist' --exclude '.git' \
#          --exclude '.env' --exclude 'apps/*/.env' \
#          ./ root@102.68.86.216:/var/www/resourcecentre/
#   2) SSH to the server and run:  bash scripts/deploy.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."
echo "▶ Deploying from $(pwd)"

echo "==> 1/7 install deps"
pnpm install

echo "==> 2/7 prisma client"
pnpm db:generate

echo "==> 3/7 apply migrations (safe, non-interactive)"
# NB: `pnpm deploy` is a built-in command, so call prisma directly (not the script).
pnpm --filter @rc/db exec prisma migrate deploy

echo "==> 4/7 build shared @rc/db entry (so the compiled API can require it)"
pnpm --filter @rc/db build

echo "==> 5/7 seed catalogue (upsert — does not wipe data)"
pnpm db:seed

echo "==> 6/7 rebuild apps (clean API dist to avoid stale compiled files)"
rm -rf apps/api/dist apps/admin/dist
pnpm --filter @rc/api build
pnpm --filter @rc/web build
pnpm --filter @rc/api search:reindex || echo "(reindex skipped/failed — non-fatal)"

echo "==> 7/7 restart"
pm2 restart all && pm2 save

echo "✅ Deploy complete. Verify: curl -s https://resourcecentre.co.ke/api/health/ready"
