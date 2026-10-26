# Deploying to a VPS

## Checklist for whoever deploys (person or AI assistant)

1. **First release: use Option A below, with `update-on-server.sh --import`** (not `--seed`).
   `db/data/content.sql` holds the exact content the team prepared.
2. **Check the server before changing it.** If it already runs other websites, a MySQL/MariaDB server,
   a firewall, or SSH on a port other than 22, do not run `server-setup.sh` unchanged (it removes the
   default nginx site, enables ufw for ports 22/80/443 only and installs MariaDB). Add only what this
   API needs, and ask the owner before touching existing services.
3. **Admin login:** after `server-setup.sh`, set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in
   `/opt/duazikr-api/.env` to the values the owner gives you, update `/root/duazikr-credentials.txt`,
   and restart the service. Never commit them or print them in logs.
4. **Done means:** `https://<subdomain>/api/getalldua/` returns 34 duas and 16 categories,
   `https://<subdomain>/admin/` login works, and `npm run smoke -- https://<subdomain>` passes
   (install dev dependencies first, `npm prune --omit=dev` after). Report back to the owner.

Target: Ubuntu 22.04 or 24.04 VPS (1 vCPU / 1 GB RAM is enough to start), API on a subdomain
such as `api.example.com`, with HTTPS.

What runs on the server: Node.js 22 (systemd service `duazikr-api`, listening on 127.0.0.1:8000),
MariaDB (localhost only), nginx (public, HTTPS via Let's Encrypt), ufw firewall (22, 80, 443),
nightly database backups.

## 1. Before you start

- Root SSH access to the VPS (`ssh root@<server-ip>` works). Using an SSH key is strongly recommended.
- DNS: create an **A record** for the subdomain pointing to the VPS IP (and AAAA if it has IPv6).
  If DNS is on Cloudflare, set it to **DNS only (grey cloud)** until the certificate is issued.
  Check with `dig +short api.example.com`.

## Option A: deploy from git on the server (recommended)

On the server, as root (the repo is private, so the server needs a GitHub deploy key or token):

```bash
git clone https://github.com/ZeroDevsLtd/DuaZikrBackend.git /opt/duazikr-api
bash /opt/duazikr-api/deploy/server-setup.sh api.example.com you@example.com
bash /opt/duazikr-api/deploy/update-on-server.sh --import    # first release: loads db/data/content.sql
bash /opt/duazikr-api/deploy/update-on-server.sh             # every later release (git pull + build + restart)
```

`db/data/content.sql` is an exact copy of the content (categories, duas, translations, ads) from the
database it was exported from. Refresh it with `npm run db:export`, commit and push. Importing it
**replaces** the server's content, so only use `--import` for the first release (or on purpose).

Then continue with step 4 below. Option B (steps 2–3) uploads from a computer with rsync instead.

## 2. Set up the server (once)

```bash
scp deploy/server-setup.sh root@<server-ip>:
ssh root@<server-ip> bash server-setup.sh api.example.com you@example.com
```

This installs everything, creates the database and `/opt/duazikr-api/.env` with random passwords,
and issues the HTTPS certificate. The admin password is saved on the server:

```bash
ssh root@<server-ip> cat /root/duazikr-credentials.txt
```

## 3. Deploy the code

From this project folder on your computer:

```bash
./deploy/deploy.sh root@<server-ip> api.example.com --seed   # first time (adds seed content)
```

## 4. Verify

```bash
npm run smoke -- https://api.example.com
```

The smoke test creates a throwaway user and deletes it again; it also adds one test device row.
Then open `https://api.example.com/admin/` and sign in.

## 5. Point the app to it

In the app's `app.json`, set `expo.extra.API_URL` to `https://api.example.com/api`, bump `version` /
`versionCode`, and build the release. In Play Console, set the account-deletion URL to
`https://api.example.com/delete-account`.

## Updating later

```bash
./deploy/deploy.sh root@<server-ip> api.example.com
```

Uploads changed files, installs dependencies, builds, applies new migrations from `db/migrations/`,
and restarts. `.env` on the server is never overwritten.

## Day-to-day

| Task | Command (on the server) |
|---|---|
| Live logs | `journalctl -u duazikr-api -f` |
| Restart | `systemctl restart duazikr-api` |
| Status | `systemctl status duazikr-api` |
| Backups | `ls /var/backups/duazikr/` (02:30 daily, kept 14 days) |
| Manual backup | `mysqldump --single-transaction dua_zikr_v2 \| gzip > /root/manual.sql.gz` |
| Restore | `gunzip -c <file>.sql.gz \| mysql dua_zikr_v2` |
| Change admin password | edit `ADMIN_PASSWORD` in `/opt/duazikr-api/.env`, then restart |

Copy backups off the server regularly (e.g. `scp root@<server-ip>:/var/backups/duazikr/*.gz .`);
backups on the same VPS do not survive losing the VPS.

## Cloudflare proxy (optional, later)

If you switch the DNS record to **Proxied (orange cloud)**, set SSL mode to **Full (strict)** and add
Cloudflare's IP ranges to nginx `set_real_ip_from` with `real_ip_header CF-Connecting-IP;`.
Otherwise every request appears to come from a Cloudflare IP and rate limits apply to everyone at once.
