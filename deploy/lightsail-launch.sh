#!/bin/bash
# Paste this into Lightsail → Create instance → "Add launch script".
# It runs once, as root, on the server's first boot (about 10 minutes until the site is up).
#
# PRIVATE repo: paste a read-only GitHub token below (Settings → Developer settings → Fine-grained tokens:
# only this repository, Contents = Read-only). PUBLIC repo: leave it empty.
GITHUB_TOKEN=""
REPO="github.com/shivavashishtha/campusly.git"

apt-get update -y && apt-get install -y git
if [ -n "$GITHUB_TOKEN" ]; then URL="https://x-access-token:${GITHUB_TOKEN}@${REPO}"; else URL="https://${REPO}"; fi
git clone "$URL" /opt/campusly
chmod 600 /opt/campusly/.git/config   # the token is kept here so `campusly-update` can pull later
bash /opt/campusly/deploy/install.sh > /var/log/campusly-install.log 2>&1
