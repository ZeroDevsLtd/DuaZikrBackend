#!/usr/bin/env bash
# Upload the code from this computer to the VPS, build it, run migrations and restart the service.
# Run from the project folder after deploy/server-setup.sh has been run on the server:
#
#   ./deploy/deploy.sh root@203.0.113.10 api.example.com --seed   # first deploy: also inserts seed content
#   ./deploy/deploy.sh root@203.0.113.10 api.example.com          # later updates
#
# --seed only adds rows that are missing, but it would re-add seed duas that were deleted in the
# admin panel, so use it on the first deploy only.
set -euo pipefail

TARGET="${1:?usage: deploy.sh <ssh-user@host> <domain> [--seed]}"
DOMAIN="${2:?usage: deploy.sh <ssh-user@host> <domain> [--seed]}"
SEED="${3:-}"
APP_DIR=/opt/duazikr-api
APP_USER=duazikr
SERVICE=duazikr-api

cd "$(dirname "$0")/.."

echo "==> Checking types locally"
npm run typecheck --silent

echo "==> Uploading to $TARGET:$APP_DIR"
rsync -az --delete \
  --exclude node_modules --exclude dist --exclude .env --exclude '.env.*' \
  --exclude .git --exclude .DS_Store --exclude legacy \
  ./ "$TARGET:$APP_DIR/"

SEED_CMD=""
[[ "$SEED" == "--seed" ]] && SEED_CMD="npm run db:seed &&"

echo "==> Installing, building and migrating on the server"
ssh "$TARGET" "set -e
  chown -R $APP_USER:$APP_USER $APP_DIR
  cd $APP_DIR
  runuser -u $APP_USER -- env HOME=/home/$APP_USER bash -c 'set -e
    npm ci --no-audit --no-fund --loglevel=error
    npm run build --silent
    npm run db:migrate --silent
    $SEED_CMD true
    npm prune --omit=dev --no-audit --no-fund --loglevel=error'
  systemctl restart $SERVICE
  for i in \$(seq 1 20); do
    curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1 && break
    sleep 1
  done
  curl -fsS http://127.0.0.1:8000/health >/dev/null || { journalctl -u $SERVICE -n 40 --no-pager; exit 1; }
  echo 'service healthy'"

echo "==> Checking https://$DOMAIN"
if curl -fsS "https://$DOMAIN/api/" >/dev/null; then
  echo "Live: https://$DOMAIN/api/  ·  admin: https://$DOMAIN/admin/"
else
  echo "WARNING: https://$DOMAIN/api/ not reachable yet (DNS or certificate). The service itself is running."
fi
