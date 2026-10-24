#!/usr/bin/env bash
# Redeploy: `sudo campusly-update` — pulls the latest code from GitHub, rebuilds, restarts.
# Same server, same address, same data (new database tables are added automatically on start).
set -euo pipefail
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
as_app() { sudo -u campusly --preserve-env=COREPACK_ENABLE_DOWNLOAD_PROMPT bash -c "set -a; . /etc/campusly/env; set +a; cd /opt/campusly && $1"; }
as_app "git pull --ff-only"
as_app "NODE_ENV=development pnpm install --frozen-lockfile"  # build tools are devDependencies
as_app "pnpm build"
systemctl restart campusly
echo "Updated to $(as_app 'git log -1 --format=%h\ %s')"
