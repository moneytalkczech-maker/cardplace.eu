# Deploy

## Prerekvizity — VPS (Ubuntu 22.04+)
```bash
# One-time setup
sudo chmod +x deploy/setup-vps.sh
sudo ./deploy/setup-vps.sh your-domain.com
```

## Nasazení
```bash
# Každý deploy
./deploy.sh
```

## SSL renewal (automatické)
Certbot je nastaven v crontabu na automatické obnovení každé 3:00 ráno.

## Struktura
```
deploy/
  setup-vps.sh        — jednorázové nastavení serveru
  nginx.conf          — reverse proxy s SSL
  cardplace-server.service  — systemd service
deploy.sh             — deploy skript
```

## Manuální kroky (jen první deploy)

1. Nastavit environment v `/opt/cardplace/server/.env`:
```env
JWT_SECRET=<strong-random-secret>
REFRESH_TOKEN_SECRET=<different-strong-random-secret>
CORS_ORIGIN=https://your-domain.com
PORT=4000
NODE_ENV=production
SENTRY_DSN=https://xxx@sentry.io/xxx  # volitelné
LOG_LEVEL=info
```

2. Zkontrolovat že service běží:
```bash
sudo systemctl status cardplace-server
sudo systemctl status nginx
```