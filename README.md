# CardPlace.eu — Trading Card Marketplace

Modern e-auction platform for collecting trading cards (Pokémon, MTG, sports cards, etc.) built with Next.js 14, Express, PostgreSQL, and AI-powered card scanning via Claude Vision.

## Tech Stack

- **Frontend**: Next.js 14 App Router, TypeScript, TailwindCSS, Socket.io
- **Backend**: Express.js, TypeScript, Prisma ORM, PostgreSQL
- **AI**: Claude 3.5 Sonnet (vision API for card scanning)
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Docker, Render.com

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Local Development

**1. Environment Setup**

```bash
cd server && cp .env.example .env.local
cd ../nextjs && cp .env.local.example .env.local
```

Fill in required env vars:
- `DATABASE_URL` (PostgreSQL)
- `JWT_SECRET`, `REFRESH_TOKEN_SECRET` (generate with `openssl rand -hex 32`)
- `ANTHROPIC_API_KEY` (for AI scanner)
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` (optional)
- `RESEND_API_KEY` (optional for emails)

**2. Database**

```bash
cd server
npm install
npx prisma migrate dev
npx prisma db seed  # if seed exists
```

**3. Run Services**

```bash
# Terminal 1: Backend
cd server && npm run dev  # http://localhost:3001

# Terminal 2: Frontend
cd nextjs && npm run dev  # http://localhost:3000
```

### Running Tests

```bash
cd server
npm run test              # Run all tests
npm run test:watch       # Watch mode
```

Test files:
- `src/test/api.test.ts` — Auth, auctions, card sync
- `src/test/profile-collection.test.ts` — Profile, collection, wanted, follow, notifications
- `src/test/payments-admin.test.ts` — Payment flow, admin endpoints

## Project Structure

```
.
├── server/
│   ├── src/
│   │   ├── controllers/     # 15 controllers (auth, auctions, profiles, etc.)
│   │   ├── routes/          # 17 route handlers
│   │   ├── middleware/      # Auth, error handling, validation
│   │   ├── utils/           # Cache, fees, email, trust scoring
│   │   ├── test/            # 550+ lines of integration tests
│   │   └── index.ts         # Express server + Socket.io
│   ├── prisma/
│   │   └── schema.prisma    # 30 models (User, Auction, Bid, Notification, etc.)
│   └── package.json
│
├── nextjs/
│   ├── app/
│   │   ├── (auth)/          # Login, register, password reset, email verification
│   │   ├── auctions/        # Browse (infinite scroll), create, detail
│   │   ├── cards/           # Database browser, sets, card detail
│   │   ├── admin/           # 20+ admin pages (dashboard, users, auctions, stats, AI control)
│   │   ├── users/[id]/      # Public profile with follow, reviews, auctions
│   │   ├── scan/            # AI card scanner (Claude Vision)
│   │   ├── settings/        # Profile, password, avatar, delete account
│   │   ├── profile/         # My auctions, bids, watchlist, VIP, referral
│   │   ├── collection/      # User's collection with value tracking
│   │   ├── wanted/          # Wanted cards list (wishlist)
│   │   ├── legal/           # Terms, privacy, fees, auction rules, cookies, prohibited items
│   │   ├── contact/         # Contact form
│   │   ├── faq/             # FAQ
│   │   ├── error.tsx        # Global error boundary
│   │   └── not-found.tsx    # 404 page
│   ├── components/
│   │   ├── layout/          # Navbar, Footer, AdminLayout, LegalLayout
│   │   ├── profile/         # ProfileView (6 tabs: auctions, bids, watchlist, reviews, referral, settings)
│   │   └── ui/              # NotificationBell, Toast, ConfirmDialog, RankBadge, CookieConsent
│   ├── hooks/               # useTranslation, useCountdown
│   ├── lib/                 # API client (auctions, auth, cards, follow, payments, etc.)
│   ├── locales/             # Czech (cs.ts) and English (en.ts) — 563 keys each
│   ├── store/               # Zustand: authStore
│   └── types/               # TypeScript types (Auction, Bid, User, Notification, etc.)
```

## Key Features

### Marketplace
- **Browse auctions** with infinite scroll, filters (status, category), search, sorting
- **Create auction** with optional image upload, auto-closing, minimum increment
- **Real-time bidding** via Socket.io — live price updates, outbid notifications
- **Watchlist** — track favorite auctions
- **One-click purchase** — buy now option when available

### AI Scanner
- **Card identification** via Claude Vision — upload photo → get name, rarity, estimated price
- **Prefill auction form** from scan results
- **Multi-language OCR** for international cards

### User System
- **Email verification** — link in verification email
- **OAuth** — Google login via `/api/auth/google/callback`
- **Follow system** — follow sellers, get notified of their new auctions
- **Trust scoring** — reputation system (incremented on sales, reviews)
- **Referral program** — unique code, claim credits for successful referrals
- **Daily credits** — one free credit/day for featured auctions

### Collections & Wishlist
- **Collection management** — add cards to personal collection with condition (NM, LP, MP, HP, PO, D)
- **Collection value tracking** — total estimated collection worth
- **Wanted cards** — public wishlist to find sellers

### Monetization
- **VIP subscription** — monthly/yearly recurring, featured auctions
- **Verified seller badge** — one-time purchase for credibility
- **Auction boost** — spend 1 credit to feature auction
- **Platform fees** — phase-based (0% → 5% as platform scales)

### Admin Panel
- **User management** — roles (admin, moderator, user), verification, banning
- **Auction moderation** — cancel, feature toggle, view reports
- **Report system** — user-submitted flags for fake/scam auctions
- **Audit log** — track all admin actions
- **Statistics** — users, auctions, bids, transactions, collections
- **Email templates** — customize notification emails
- **Legal documents** — terms, privacy, fees — edit in UI
- **AI modules** — support, pricing review, risk assessment, legal checks

### Notifications
- **Real-time** via Socket.io for outbids during session
- **Polling** (30s interval) for background updates
- **Email notifications** for payment received, auction won, outbid, verification
- **In-app bell** with unread count

## API Overview

### Authentication
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login (returns JWT)
- `POST /api/auth/refresh` — Refresh token (rate limited 5/min)
- `GET /api/auth/me` — Current user
- `GET /api/auth/google/callback` — OAuth callback
- `POST /api/auth/logout` — Invalidate token

### Auctions
- `GET /api/auctions` — List with filters, search, sort (cursor-based pagination)
- `GET /api/auctions/:id` — Detail (includes current bids, watchlist status)
- `POST /api/auctions` — Create (rate limited 3/day for free, 5/day for VIP)
- `POST /api/auctions/:id/bid` — Place bid (increments current price by min increment)
- `POST /api/auctions/:id/boost` — Toggle featured (1 credit)
- `POST /api/auctions/:id/watch` — Add/remove from watchlist

### Cards
- `GET /api/cards/search` — Search database by name/set
- `POST /api/cards/sync` — Sync user's card collection with external sources

### Users
- `GET /api/users/:id/public` — Public profile (username, rank, trust score, avatar)
- `GET /api/users/my-auctions` — Authenticated user's auctions
- `GET /api/users/notifications` — Unread notifications
- `POST /api/users/daily-credit` — Claim free credit (once per day)

### Follow
- `POST /api/follow/:id` — Toggle follow
- `GET /api/follow/:id/check` — Check if following
- `GET /api/follow/:id/followers` — List followers
- `GET /api/follow/:id/following` — List following

### Collection & Wanted
- `POST /api/collection` — Add card to collection
- `GET /api/collection/:userId` — View user's collection
- `PATCH /api/collection/:id` — Update quantity
- `DELETE /api/collection/:id` — Remove card
- `GET /api/wanted` — List all wanted cards (public)
- `POST /api/wanted` — Create wanted card entry
- `DELETE /api/wanted/:id` — Remove wanted entry

### Payments
- `POST /api/payments/create-checkout` — Stripe checkout
- `GET /api/payments/config` — Publishable key
- `POST /api/payments/review` — Submit auction review/rating

### Reports
- `POST /api/reports` — Report auction (fake, scam, stolen_image, etc.)

### Admin
- `GET /api/admin/stats` — Platform stats
- `GET /api/admin/users` — User list
- `PATCH /api/admin/users/:id/role` — Change role
- `PATCH /api/admin/users/:id/verify` — Toggle verification
- `GET /api/admin/audit-log` — Admin action history

## Deployment

### Docker Compose (Local)

```bash
docker-compose up
```

### Render.com (Production)

1. **Create PostgreSQL database** on Render
2. **Push to GitHub** (repo must be public or accessible to Render)
3. **Create Web Service** with build command:
   ```
   cd server && npm install && npx prisma migrate deploy && npm run build
   ```
4. **Set environment variables**:
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://cardplace.eu`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `ANTHROPIC_API_KEY` (for Next.js frontend)
   - `RESEND_API_KEY`, `EMAIL_FROM`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

5. **Deploy Next.js** as separate Web Service:
   ```
   cd nextjs && npm install && npm run build
   ```

6. **DNS**: Point `cardplace.eu` A records to Render IPs

## Monitoring

- **Sentry** (optional): Set `SENTRY_DSN` for error tracking
- **Health check**: `GET /api/health` returns db status, uptime, memory
- **Redis cache** (optional): Set `REDIS_URL` for auction list caching

## Security

- ✅ Rate limiting on auth (register 5/h, login 10/15m, refresh 5/1m)
- ✅ Rate limiting on uploads, follow, wanted creation
- ✅ MIME validation + magic byte check for images
- ✅ JWT refresh token rotation (old token revoked on refresh)
- ✅ Edge middleware for protected routes (admin, collection, settings)
- ✅ Helmet security headers
- ✅ CORS properly configured
- ✅ No API keys in `NEXT_PUBLIC_*` env vars
- ✅ Audit logging for admin actions

## Performance

- **Infinite scroll** on auction listings with cursor-based pagination
- **Redis caching** for auctions list (30s TTL)
- **Socket.io** for real-time updates (avoiding polling overhead)
- **Image optimization** via Next.js Image component
- **Lazy loading** of admin sections and modals
- **Server-side rendering** for home page SEO

## Translation

Support for Czech (cs) and English (en) via `useTranslation` hook:

```tsx
const { t, locale, setLocale } = useTranslation();
<p>{t("detail.boost")}</p>  // Gets translated string
setLocale("en")              // Switch to English (triggers reload)
```

## Support

- **FAQ**: `/faq`
- **Contact form**: `/contact`
- **Email**: info@cardplace.eu
- **GitHub Issues**: [moneytalkczech-maker/cardplace.eu](https://github.com/moneytalkczech-maker/cardplace.eu)

---

**Last updated**: May 2026 | **Commits on branch**: 20+ | **Test coverage**: 550+ lines
