#!/usr/bin/env bash
# One-time VPS setup for CardPlace.eu
set -euo pipefail

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  echo "Usage: $0 your-domain.com"
  exit 1
fi

echo "=== CardPlace.eu VPS Setup ==="

# System dependencies
sudo apt-get update
sudo apt-get install -y curl git nginx certbot python3-certbot-nginx nodejs npm

# Create app user
sudo useradd --system --create-home -s /bin/bash cardplace 2>/dev/null || true

# Create app directory
sudo mkdir -p /opt/cardplace/server/data
sudo chown -R cardplace:cardplace /opt/cardplace

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# SSL certificate
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN"

# Copy service file
sudo cp deploy/cardplace-server.service /etc/systemd/system/
sudo systemctl daemon-reload

# Copy nginx config
sudo cp deploy/nginx.conf /etc/nginx/sites-available/cardplace
sudo sed -i "s/<%= domain %>/$DOMAIN/g" /etc/nginx/sites-available/cardplace
sudo ln -sf /etc/nginx/sites-available/cardplace /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Set up automatic SSL renewal
echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'" | sudo crontab -

# Firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "=== Setup complete ==="
echo "Next: run deploy.sh to deploy the app"
echo "Then: visit https://$DOMAIN"
