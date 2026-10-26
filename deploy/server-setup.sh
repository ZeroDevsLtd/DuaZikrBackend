#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 22.04 / 24.04 VPS for the Dua & Zikr API.
# Installs Node.js 22, MariaDB, nginx, Let's Encrypt (certbot) and a firewall; creates the database,
# the .env file, a systemd service and nightly database backups. Safe to re-run.
#
# Run as root on the VPS:
#   bash server-setup.sh api.example.com you@example.com
#
# The subdomain's DNS A record must already point to this server, or the HTTPS step is skipped
# (re-run later, or run: certbot --nginx -d <domain> --redirect).
set -euo pipefail

DOMAIN="${1:?usage: server-setup.sh <domain> <letsencrypt-email>}"
EMAIL="${2:?usage: server-setup.sh <domain> <letsencrypt-email>}"
APP_USER=duazikr
APP_DIR=/opt/duazikr-api
SERVICE=duazikr-api
DB_NAME=dua_zikr_v2
DB_USER=dua_zikr
BACKUP_DIR=/var/backups/duazikr
CRED_FILE=/root/duazikr-credentials.txt

[[ $EUID -eq 0 ]] || { echo "Run as root (sudo -i)"; exit 1; }

echo "==> Installing packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q curl ca-certificates gnupg openssl rsync nginx mariadb-server certbot python3-certbot-nginx ufw

if ! command -v node >/dev/null || [[ "$(node -v)" != v22* ]]; then
  echo "==> Installing Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -q nodejs
fi
echo "node $(node -v), npm $(npm -v)"

echo "==> App user and directories"
id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir "/home/$APP_USER" --shell /usr/sbin/nologin "$APP_USER"
mkdir -p "$APP_DIR" "$BACKUP_DIR"
chown "$APP_USER:$APP_USER" "$APP_DIR"
chmod 700 "$BACKUP_DIR"

systemctl enable --now mariadb

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "==> Creating database and .env"
  DB_PASS=$(openssl rand -hex 24)
  ADMIN_PASS=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-24)
  SESSION_SECRET=$(openssl rand -hex 32)
  mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
CREATE USER IF NOT EXISTS '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
ALTER USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
ALTER USER '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
  cat > "$APP_DIR/.env" <<ENV
PORT=8000
HOST=127.0.0.1
NODE_ENV=production
PUBLIC_URL=https://$DOMAIN
TRUST_PROXY=true

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_NAME=$DB_NAME

ADMIN_USERNAME=admin
ADMIN_PASSWORD=$ADMIN_PASS
SESSION_SECRET=$SESSION_SECRET

CORS_ORIGINS=https://$DOMAIN
ENV
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  install -m 600 /dev/null "$CRED_FILE"
  cat > "$CRED_FILE" <<CREDS
Dua & Zikr API ($DOMAIN) - created $(date -u +%F)
Admin panel:    https://$DOMAIN/admin/
Admin user:     admin
Admin password: $ADMIN_PASS
DB user/pass:   $DB_USER / $DB_PASS   (database $DB_NAME, localhost only)
All settings:   $APP_DIR/.env
CREDS
  echo "Credentials saved to $CRED_FILE (root only)"
else
  echo "==> $APP_DIR/.env exists, keeping it"
fi

echo "==> systemd service"
cat > "/etc/systemd/system/$SERVICE.service" <<UNIT
[Unit]
Description=Dua & Zikr API
After=network.target mariadb.service
Wants=mariadb.service

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable "$SERVICE" >/dev/null
# Started by deploy.sh once the code is uploaded.

echo "==> nginx"
cat > "/etc/nginx/sites-available/$SERVICE" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    client_max_body_size 2m;
    server_tokens off;

    gzip on;
    gzip_types application/json text/css application/javascript;
    gzip_min_length 1024;

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        # Overwrite (not append) so clients cannot spoof their IP for rate limiting.
        proxy_set_header X-Forwarded-For \$remote_addr;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 30s;
    }
}
NGINX
ln -sf "/etc/nginx/sites-available/$SERVICE" "/etc/nginx/sites-enabled/$SERVICE"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Firewall"
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null
ufw status | head -5

echo "==> Nightly database backup (02:30, kept 14 days, in $BACKUP_DIR)"
cat > /etc/cron.d/duazikr-backup <<CRON
30 2 * * * root mysqldump --single-transaction --routines $DB_NAME | gzip > $BACKUP_DIR/$DB_NAME-\$(date +\%F).sql.gz && find $BACKUP_DIR -name '*.sql.gz' -mtime +14 -delete
CRON
chmod 644 /etc/cron.d/duazikr-backup

echo "==> HTTPS certificate"
if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect; then
  echo "HTTPS enabled for $DOMAIN"
else
  echo "WARNING: certificate not issued. Check that $DOMAIN points to this server, then run:"
  echo "  certbot --nginx -d $DOMAIN --redirect"
fi

echo
echo "Server ready. Next, from your computer: ./deploy/deploy.sh root@<server-ip> $DOMAIN --seed"
