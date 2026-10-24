#!/usr/bin/env bash
# `sudo campusly-reset-demo` — wipes the demo data and re-seeds it (e.g. before each class).
set -euo pipefail
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
systemctl stop campusly
sudo -u campusly --preserve-env=COREPACK_ENABLE_DOWNLOAD_PROMPT bash -c "set -a; . /etc/campusly/env; set +a; cd /opt/campusly && pnpm seed:reset"
systemctl start campusly
echo "Demo data reset."
