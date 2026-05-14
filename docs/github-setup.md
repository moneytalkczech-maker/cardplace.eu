# GitHub setup

## 1. Vytvořit repozitář na GitHubu

1. Jdi na https://github.com/new
2. Název: `cardbid`
3. Viditelnost: private/public dle preference
4. **NEVYTVAŘET** README, .gitignore ani licenci (už existuje)
5. Kliknout "Create repository"

## 2. Propojit lokální repo s GitHubem

```bash
# Nastavit remote (URL z GitHubu)
git remote add origin https://github.com/your-username/cardbid.git

# Ověřit
git remote -v

# Pushnout main branch
git push -u origin main
```

## 3. Branch protection (doporučeno)

V GitHub → Settings → Branches → Add rule:
- **Branch name pattern**: `main`
- ✅ Require pull request before merging
- ✅ Require approvals (1)
- ✅ Dismiss stale pull request approvals
- ✅ Require status checks (CI)

## 4. Secrets pro CI

V GitHub → Settings → Secrets and variables → Actions:

| Secret | Hodnota |
|--------|---------|
| `JWT_SECRET` | náhodný řetězec |
| `REFRESH_TOKEN_SECRET` | jiný náhodný řetězec |
| `STRIPE_SECRET_KEY` | ze Stripe dashboardu |
| `STRIPE_WEBHOOK_SECRET` | ze Stripe CLI |
| `RESEND_API_KEY` | z Resend dashboardu |
| `SENTRY_DSN` | ze Sentry projektu |

## 5. Deployment

Projekt obsahuje:
- `deploy.sh` – automatický deploy na VPS
- `deploy/` – nginx config, systemd service, setup skript

### Prerekvizity
```bash
# Nainstalovat gh CLI
winget install GitHub.cli
# nebo
npm install -g gh

# Přihlásit se
gh auth login
```

### Nasazení
```bash
# První nasazení (VPS)
sudo ./deploy/setup-vps.sh your-domain.com

# Každý další deploy
./deploy.sh
```

## 6. Užitečné příkazy

```bash
# Zkontrolovat status
git status

# Vytvořit feature branch
git checkout -b feat/your-feature

# Commit a push
git add -A
git commit -m "feat: popis změny"
git push -u origin feat/your-feature

# Vytvořit PR (přes gh CLI)
gh pr create --fill

# Mergnout PR
gh pr merge --squash
```
