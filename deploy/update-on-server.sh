#!/usr/bin/env bash
# Release the latest code from git, on the server itself. Run as root:
#
#   bash /opt/duazikr-api/deploy/update-on-server.sh --import  # first release: load db/data/content.sql
#   bash /opt/duazikr-api/deploy/update-on-server.sh --seed    # first release alternative: seed.json content
#   bash /opt/duazikr-api/deploy/update-on-server.sh           # later updates
#
# Expects /opt/duazikr-api to be a git clone of the backend repo and deploy/server-setup.sh to have run.
# --import REPLACES all categories, duas and ads on the server with the exported file; --seed only adds
# missing rows but would re-add seed duas deleted in the admin panel. Use either on the first release only.
set -euo pipefail

APP_DIR=/opt/duazikr-api
APP_USER=duazikr
SERVICE=duazikr-api
BRANCH="${BRANCH:-main}"
SEED_CMD=""
IMPORT=false
case "${1:-}" in
  --seed) SEED_CMD="npm run db:seed &&" ;;
  --import) IMPORT=true ;;
  "") ;;
  *) echo "unknown option: $1"; exit 1 ;;
esac

[[ $EUID -eq 0 ]] || { echo "Run as root"; exit 1; }
cd "$APP_DIR"

echo "==> Fetching $BRANCH"
# Git runs as root (which holds the repo credentials); .env is untracked and never touched.
git -c safe.directory="$APP_DIR" fetch -q origin "$BRANCH"
git -c safe.directory="$APP_DIR" reset -q --hard "origin/$BRANCH"
git -c safe.directory="$APP_DIR" log --oneline -1
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

echo "==> Installing, building, migrating"
runuser -u "$APP_USER" -- env HOME="/home/$APP_USER" bash -c "set -e
  npm ci --no-audit --no-fund --loglevel=error
  npm run build --silent
  npm run db:migrate --silent
  $SEED_CMD true
  npm prune --omit=dev --no-audit --no-fund --loglevel=error"

if $IMPORT; then
  DB_NAME=$(grep -E '^DB_NAME=' "$APP_DIR/.env" | cut -d= -f2)
  echo "==> Importing db/data/content.sql into $DB_NAME (replaces categories, duas, ads)"
  mysql "$DB_NAME" < "$APP_DIR/db/data/content.sql"
  mysql -N "$DB_NAME" -e "SELECT CONCAT((SELECT COUNT(*) FROM duas), ' duas, ', (SELECT COUNT(*) FROM categories), ' categories, ', (SELECT COUNT(*) FROM ads), ' ads')"
fi

echo "==> Restarting $SERVICE"
systemctl restart "$SERVICE"
for _ in $(seq 1 20); do
  curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1 && break
  sleep 1
done
if curl -fsS http://127.0.0.1:8000/health >/dev/null; then
  echo "Service healthy"
else
  journalctl -u "$SERVICE" -n 40 --no-pager
  exit 1
fi
