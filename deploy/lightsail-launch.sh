#!/bin/bash
# Paste this into Lightsail → Create instance → "Add launch script".
# It runs once, as root, on the server's first boot. Change REPO if you forked the project.
REPO="https://github.com/YOUR-GITHUB-USER/campusly.git"
apt-get update -y && apt-get install -y git
git clone "$REPO" /opt/campusly
bash /opt/campusly/deploy/install.sh > /var/log/campusly-install.log 2>&1
