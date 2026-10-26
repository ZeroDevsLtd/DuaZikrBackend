#!/usr/bin/env bash
# Export all content (categories, duas, translations, ads) from the database in .env to a SQL file
# that replaces the content on another server. Users, tokens, favorites and devices are not included.
#
#   npm run db:export                 # writes db/data/content.sql
#   npm run db:export -- other.sql
#
# Import on the server (REPLACES its categories, duas and ads):
#   mysql dua_zikr_v2 < db/data/content.sql
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="${1:-db/data/content.sql}"
mkdir -p "$(dirname "$OUT")"
eval "$(grep -E '^DB_(HOST|PORT|USER|PASSWORD|NAME)=' .env | sed 's/^/export /')"

TABLES=(categories category_translations duas dua_translations ads)
DUMP=$(command -v mariadb-dump || command -v mysqldump)

{
  echo "-- Dua & Zikr content export from $DB_NAME at $(date -u +%FT%TZ)"
  echo "-- Replaces all categories, duas, translations and ads. Users and devices are untouched."
  echo "SET NAMES utf8mb4;"
  echo "SET FOREIGN_KEY_CHECKS = 0;"
  for t in "${TABLES[@]}"; do echo "DELETE FROM \`$t\`;"; done
  MYSQL_PWD="$DB_PASSWORD" "$DUMP" -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" \
    --no-create-info --complete-insert --single-transaction --skip-triggers --no-tablespaces \
    --default-character-set=utf8mb4 --skip-comments --skip-add-locks --skip-disable-keys \
    "$DB_NAME" "${TABLES[@]}" |
    # Newer MariaDB dumps start with a sandbox-mode line that older MySQL/MariaDB clients reject.
    grep -v '^/\*M!999999'
  echo "SET FOREIGN_KEY_CHECKS = 1;"
} > "$OUT"

echo "Wrote $OUT"
for t in "${TABLES[@]}"; do
  printf '  %-22s %s rows\n' "$t" "$(MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -N -e "SELECT COUNT(*) FROM \`$t\`" "$DB_NAME" 2>/dev/null)"
done
