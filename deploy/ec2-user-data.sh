#!/bin/bash
# Paste this into EC2 → Launch instance → Advanced details → "User data".
# It runs once, as root, on the server's first boot (about 10 minutes until the site is up).
# Progress: /var/log/cloud-init-output.log, then /var/log/campusly-install.log ("CAMPUSLY READY" at the end).
#
# The repo is PUBLIC, so leave GITHUB_TOKEN empty. Only if YOUR copy is private: paste a read-only token
# (Settings → Developer settings → Fine-grained tokens: only that repository, Contents = Read-only).
GITHUB_TOKEN=""
REPO="github.com/shivavashishtha/campusly.git"

export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a
# Ubuntu runs its own security updates on first boot; wait for them instead of failing on the apt lock.
apt-get -o DPkg::Lock::Timeout=900 update -y && apt-get -o DPkg::Lock::Timeout=900 install -y git
if [ -n "$GITHUB_TOKEN" ]; then URL="https://x-access-token:${GITHUB_TOKEN}@${REPO}"; else URL="https://${REPO}"; fi
git clone "$URL" /opt/campusly
chmod 600 /opt/campusly/.git/config   # the token is kept here so `campusly-update` can pull later
bash /opt/campusly/deploy/install.sh > /var/log/campusly-install.log 2>&1
