#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/cardbid"
REPO_URL="https://github.com/your-org/cardbid.git"
BRANCH="main"
NODE_VERSION="22"

echo "=== CardBid Deploy ==="

# Ensure running as non-root with sudo
if [ "$EUID" -eq 0 ]; then
  echo "Please run as a regular user with sudo privileges"
  exit 1
fi

cd "$APP_DIR" || { git clone "$REPO_URL" "$APP_DIR"; cd "$APP_DIR"; }

echo "[1/7] Pulling latest code..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "[2/7] Installing dependencies..."
cd server && npm ci --omit=dev && cd ..
cd client && npm ci && cd ..

echo "[3/7] Building client..."
cd client && npm run build && cd ..

echo "[4/7] Building server..."
cd server && npm run build && cd ..

echo "[5/7] Running database migrations..."
cd server && npx prisma migrate deploy && cd ..

echo "[6/7] Restarting services..."
sudo systemctl daemon-reload
sudo systemctl restart cardbid-server
sudo systemctl reload nginx

echo "[7/7] Health check..."
sleep 3
if curl -sf http://localhost:4000/api/health > /dev/null 2>&1; then
  echo "✓ Server is healthy"
else
  echo "✗ Server health check failed — rolling back..."
  git revert HEAD --no-edit
  sudo systemctl restart cardbid-server
  exit 1
fi

echo "=== Deploy complete ==="