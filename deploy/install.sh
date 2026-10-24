#!/usr/bin/env bash
# One-time server setup on Ubuntu 24.04 (run as root by ec2-user-data.sh).
# Installs Node 22 + Caddy (automatic HTTPS), seeds the demo, builds, and starts the app.
# Log: /var/log/campusly-install.log    Done when it prints "CAMPUSLY READY".
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# First-boot security updates hold the apt lock; every apt call waits for it (up to 15 min) instead of failing.
APT="apt-get -o DPkg::Lock::Timeout=900"
# Scripts we don't control (NodeSource) call apt-get directly, so also wait for the lock ourselves.
wait_apt() { while fuser /var/lib/dpkg/lock-frontend /var/lib/apt/lists/lock >/dev/null 2>&1; do sleep 5; done; }
APP=/opt/campusly

# 2 GB swap: the build needs more memory than the smallest plans have.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

$APT update -y
$APT install -y ca-certificates curl gnupg openssl debian-keyring debian-archive-keyring apt-transport-https

# Node.js 22 (from NodeSource) + pnpm via corepack
wait_apt
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
$APT install -y nodejs
corepack enable

# Caddy: web server that gets and renews the HTTPS certificate by itself
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
$APT update -y && $APT install -y caddy

# App user, data folder, and the session secret (generated here, never leaves the server)
id campusly >/dev/null 2>&1 || useradd --system --create-home --home-dir /home/campusly --shell /usr/sbin/nologin campusly
mkdir -p /var/lib/campusly /etc/campusly
chown -R campusly: /var/lib/campusly "$APP"
chmod 600 "$APP/.git/config"
[ -f /etc/campusly/secret ] || { openssl rand -hex 32 > /etc/campusly/secret; chmod 600 /etc/campusly/secret; }

# Services: configure (works out the web address on every boot) → app → Caddy
install -m 644 "$APP/deploy/campusly-configure.service" /etc/systemd/system/
install -m 644 "$APP/deploy/campusly.service" /etc/systemd/system/
install -m 755 "$APP/deploy/update.sh" /usr/local/bin/campusly-update
install -m 755 "$APP/deploy/reset-demo.sh" /usr/local/bin/campusly-reset-demo
systemctl daemon-reload
systemctl enable campusly-configure campusly caddy
systemctl start campusly-configure

# Install, seed the demo schools, build
as_app() { sudo -u campusly --preserve-env=COREPACK_ENABLE_DOWNLOAD_PROMPT bash -c "set -a; . /etc/campusly/env; set +a; cd $APP && $1"; }
as_app "NODE_ENV=development pnpm install --frozen-lockfile"  # build tools are devDependencies
as_app "pnpm seed"
as_app "pnpm build"

systemctl restart campusly caddy
echo "CAMPUSLY READY: $(grep APP_URL /etc/campusly/env)"
