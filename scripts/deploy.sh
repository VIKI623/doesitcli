#!/usr/bin/env bash
# Deploy doesitcli to the alicloud SWAS server.
#
# Builds locally, rsyncs the static dist + api source, then reloads PM2 and nginx.
# Idempotent — safe to run on every change.
set -euo pipefail

HOST="${HOST:-doesitcli}"
APP_DIR="/home/www/doesitcli"

cd "$(dirname "$0")/.."

echo "→ Building static site"
pnpm build

echo "→ Syncing dist/ to ${HOST}:${APP_DIR}/dist/"
rsync -az --delete dist/ "${HOST}:${APP_DIR}/dist/"

echo "→ Syncing API source to ${HOST}:${APP_DIR}/api/"
rsync -az --delete \
    --exclude node_modules --exclude '*.db' --exclude '*.db-*' --exclude .env \
    server/ "${HOST}:${APP_DIR}/api/"

echo "→ Installing API dependencies on remote"
ssh "$HOST" "cd ${APP_DIR}/api && npm install --omit=dev --silent"

echo "→ Reloading PM2 (or starting if first run)"
ssh "$HOST" "
    cd ${APP_DIR}/api
    if pm2 describe doesitcli-api > /dev/null 2>&1; then
        pm2 reload doesitcli-api
    else
        pm2 start deploy/ecosystem.config.cjs
        pm2 save
    fi
"

echo "→ Reloading nginx"
ssh "$HOST" "nginx -t && systemctl reload nginx"

echo "✓ Deployed"
