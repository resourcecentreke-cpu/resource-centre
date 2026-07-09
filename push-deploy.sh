#!/usr/bin/env bash
#
# Proper-path deploy: commit everything and push to GitHub.
# CI runs, then .github/workflows/deploy.yml auto-deploys to the VPS
# (once the DEPLOY_* secrets are set — see notes printed at the end).
#
# Run from anywhere:  bash ~/Claude/Projects/Resourcecentre/push-deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

# 1. Clear a stale index.lock (only if no git process is actually running).
if [ -f .git/index.lock ]; then
  if pgrep -x git >/dev/null 2>&1; then
    echo "✋ A git process is running — close it first, then re-run."; exit 1
  fi
  rm -f .git/index.lock
  echo "✓ Removed stale .git/index.lock"
fi

# 2. Make sure origin points at a real repo, not the placeholder.
REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [[ "$REMOTE" == *"YOUR_USERNAME"* || -z "$REMOTE" ]]; then
  echo "Current remote is a placeholder: $REMOTE"
  read -rp "Paste your GitHub repo URL (e.g. https://github.com/mutai/resource-centre.git): " NEW_REMOTE
  git remote set-url origin "$NEW_REMOTE" 2>/dev/null || git remote add origin "$NEW_REMOTE"
  echo "✓ origin → $NEW_REMOTE"
fi

# 3. Commit everything (monetization work + pending product-image updates).
git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit — working tree already clean."
else
  git commit -m "Monetization: affiliate /go redirects with click tracking, AdSense on all high-traffic pages, sponsored listings strip + public API, /advertise page with seller plans

- New /api/go/:offerId redirect appends per-seller affiliate codes (AFFILIATE_QUERY_JSON / AFFILIATE_WRAPPER_JSON env) and logs OFFER_CLICK events
- OfferDTO gains id + goUrl; product page Buy/View links now monetized
- AdSlot added to product, search, category, deals and phones pages
- Public GET /api/sponsored endpoint + labelled SponsoredStrip on homepage
- /advertise page: Basic/Premium/Enterprise plans (matches API PLAN_PRICES) + placement types, linked in footer
- Also includes pending product-image and catalogue updates"
  echo "✓ Committed"
fi

# 4. Push (CI → auto-deploy).
git push -u origin main
echo
echo "✓ Pushed. GitHub Actions will now run CI, then Deploy."
echo
echo "If this is the first push, add these repo secrets so Deploy can reach the server"
echo "(GitHub → Settings → Secrets and variables → Actions):"
echo "  DEPLOY_HOST     102.68.86.216"
echo "  DEPLOY_USER     root"
echo "  DEPLOY_PATH     /var/www/resourcecentre"
echo "  DEPLOY_SSH_KEY  (private key; setup steps in .github/workflows/deploy.yml)"
echo
echo "Watch progress in the repo's Actions tab, then verify:"
echo "  https://resourcecentre.co.ke/api/health/ready"
