#!/usr/bin/env bash
# Runs on every boot, before the app. Works out the public web address and writes
# the app's settings + Caddy's config. Uses a free sslip.io name built from the
# server's public IP, unless /etc/campusly/domain holds your own domain.
set -euo pipefail
IP=$(curl -fsS --retry 5 https://checkip.amazonaws.com | tr -d '[:space:]')
HOST="campusly.${IP//./-}.sslip.io"
[ -s /etc/campusly/domain ] && HOST=$(tr -d '[:space:]' < /etc/campusly/domain)

umask 027
cat > /etc/campusly/env <<ENV
NODE_ENV=production
APP_URL=https://$HOST
BETTER_AUTH_URL=https://$HOST
BETTER_AUTH_SECRET=$(cat /etc/campusly/secret)
PGLITE_DIR=/var/lib/campusly/db
UPLOAD_DIR=/var/lib/campusly/uploads
DEMO_MODE=1
ENV
chown root:campusly /etc/campusly/env

# Caddy replaces any X-Forwarded-For sent by the visitor, so sign-in rate limits see the real IP.
cat > /etc/caddy/Caddyfile <<CADDY
$HOST {
  encode gzip
  reverse_proxy 127.0.0.1:3000
}
CADDY
echo "Campusly address: https://$HOST"
