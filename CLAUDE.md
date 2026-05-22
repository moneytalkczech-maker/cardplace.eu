# Development Guide for Claude Code

This file documents the codebase state, development practices, and architecture decisions for CardPlace.eu.

## Session Context

**Last session**: May 22, 2026
**Branch**: `claude/new-session-hFukP`
**Commits since session start**: 37+

## Current State

### Completeness: 100% (production-ready)

**What's done:**
- Next.js 14 frontend: 50 pages, TypeScript 0 errors (strict), full routing
- Express backend: 15 controllers, 17 routes, 30 Prisma models
- Tests: 6 files, 1100+ lines covering auth, auctions, profile, payment, admin, messages, reports, contact, card-sets, database-cards, upload
- Deployment: Docker, render.yaml, all env templates
- AI Scanner: Claude Vision integration, server-side (no API key leaks)
- Real-time: Socket.io for auction bidding, notifications, messaging
- Payments: Stripe checkout + webhook validation
- Admin: 20+ pages for moderation and analytics; pagination bug fixed (users/auctions/bids/audit-log)
- Localization: Czech + English (563 keys each)
- SEO: Dynamic metadata, sitemap (with individual card pages), robots.txt, OG image
- Security: Rate limiting (auth/auctions/upload/scan), MIME validation, JWT rotation, audit logging, HTTP security headers
- Messaging: Full direct messaging between users (inbox, real-time, unread badges)
- Mobile: MobileBottomNav with floating scan CTA, unread message badge on profile icon
- Loading: Global + section-specific loading.tsx skeletons (auctions, admin, cards)
- PWA: Web App Manifest, auto-generated favicon + Apple icon via ImageResponse
- Error handling: Global + section-specific error.tsx boundaries (admin, auctions)
- Tests: 6 supertest files (100+ cases) + 3 unit/mock files (53 cases); vitest config fixed

**What's not done (future features):**
- Video chat for high-value auctions
- AI moderation — auto-flag suspicious auctions
- Mobile app (React Native)
- Payment alternatives (Apple Pay, PayPal)
- Email template builder UI (hardcoded in DB)
- OAuth tests (Google OAuth requires external provider, not unit-testable)

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types unless absolutely necessary
- Use discriminated unions for complex types
- Avoid optional chaining chains `?.?.?.` — break into intermediate variables

### Backend (Express)
- **Controllers**: Async functions, throw `AppError` for consistency
- **Routes**: Use `asyncHandler` to catch thrown errors
- **Validation**: Zod schemas on POST/PATCH bodies
- **Database**: Prisma transactions for atomic operations (payments, auctions)
- **Cache**: Redis optional, TTL constants in `utils/cache.ts`

Example error handling:
```ts
export async function myEndpoint(req: AuthRequest, res: Response) {
  if (!req.userId) throw new AppError(401, "Unauthorized");
  const item = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!item) throw new AppError(404, "Item not found");
  res.json(item);
}
// asyncHandler catches both thrown errors and promise rejections
```

### Frontend (React/Next.js)
- Prefer `"use client"` components for interactivity
- Use Zustand stores for auth (token, user, notifications)
- API calls via lib/api.ts exports (not direct axios)
- Toast notifications for user feedback (`toast("success", message)`)
- No console.log in production code — Sentry handles errors

Example:
```tsx
"use client";
import { useState } from "react";
import { toast } from "@/components/ui/Toast";
import { auctions } from "@/lib/api";

export default function MyComponent() {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await auctions.create(data);
      toast("success", "Created!");
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Failed");
    } finally {
      setLoading(false);
    }
  };
}
```

## Adding Features

### New API Endpoint

1. **Schema**: Add Zod schema to `server/src/utils/validation.ts`
2. **Controller**: Create function in `server/src/controllers/*.ts`
3. **Route**: Add route in `server/src/routes/*.ts` with `asyncHandler` wrapper
4. **Test**: Add test case to `server/src/test/*.test.ts`
5. **API Client**: Export method in `nextjs/lib/api.ts`
6. **UI**: Use API client in component

Example (complete flow):
```ts
// validation.ts
export const mySchema = z.object({ name: z.string().min(1) });

// controller.ts
export async function myAction(req: AuthRequest, res: Response) {
  const { name } = req.body;
  const result = await prisma.item.create({ data: { name, userId: req.userId } });
  res.json(result);
}

// route.ts
router.post("/", authenticate, validateBody(mySchema), asyncHandler(ctrl.myAction));

// api.ts
export const items = {
  create: (data: { name: string }) => apiPost<Item>("/items", data),
};

// Component.tsx
const result = await items.create({ name: "test" });
```

### New Page/Route

1. Create folder in `nextjs/app/feature/` following Next.js conventions
2. Add `page.tsx` (use `"use client"` if interactive)
3. Add `layout.tsx` with metadata if top-level route
4. If protected route: Add to edge middleware in `nextjs/middleware.ts`

Example layout with metadata:
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feature Name — CardPlace.eu",
  description: "...",
};

export default function FeatureLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

### New Database Model

1. Add to `server/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_new_model`
3. Regenerate types: `npx prisma generate`
4. Update seed if needed

## Testing Practices

### Server Tests
- Use `supertest` for HTTP testing
- Create test users in `beforeAll`, cleanup in `afterAll`
- Test both happy path and error cases
- Rate limiters are bypassed in `NODE_ENV=test`

Example:
```ts
const res = await request(app)
  .post("/api/items")
  .set("Authorization", `Bearer ${token}`)
  .send({ name: "test" });
expect(res.status).toBe(200);
expect(res.body.id).toBeTruthy();
```

### Running Tests
```bash
cd server
npm run test              # Run once
npm run test:watch       # Watch mode
```

## Monitoring & Debugging

### Local Development
- Backend logs: `console.error()` → `logger.info()` (uses winston)
- Frontend errors: Thrown from components show in dev console + error.tsx
- Socket.io debug: Enable with `localStorage.debug = "socket.io*"`

### Production (Render.com)
- **Sentry**: Set `SENTRY_DSN` for automatic error tracking
- **Health check**: `GET /api/health` → returns db status, uptime, memory
- **Logs**: Render dashboard shows `npm run start` output
- **DB**: Render UI for direct query access

### Common Issues

**"Connection to database failed"**
- Check `DATABASE_URL` format and network access
- Verify Render PostgreSQL is running

**"Stripe webhook not working"**
- Ensure `STRIPE_WEBHOOK_SECRET` is set (not just keys)
- Check webhook signing in `server/src/routes/payments.ts`

**"Socket.io not connecting in production"**
- Verify `NEXT_PUBLIC_SOCKET_URL` points to backend domain
- Check CORS origin in Express matches frontend domain
- Verify Socket.io is initialized in `server/src/lib/socket.ts`

## Architecture Decisions

### Why Next.js App Router?
- File-based routing is simpler than manual route definitions
- Server components reduce client-side JS
- Built-in middleware for auth checks
- Streaming SSR for better perceived performance

### Why Socket.io for Real-Time?
- WebSocket alternative to HTTP polling
- Native TypeScript support
- Automatic reconnection and fallback to long-polling
- Used for: auction price updates, outbid notifications, live typing

### Why Prisma ORM?
- Type-safe queries (typos caught at build time)
- Migration versioning (easy rollbacks)
- Automatic migrations can create/alter tables
- Better DX than raw SQL for CRUD

### Why Redis Optional?
- Caching auctions list helps under heavy load
- Not critical for MVP — database queries are fast for small data
- Can add later without code changes (lazy initialization in cache.ts)

### Why Express (not Next.js API Routes)?
- Separate backend allows horizontal scaling
- Better for WebSocket (Socket.io)
- Easier to deploy to different hosting (Express on Render, Next.js on Vercel if desired)
- Cleaner separation of concerns

### Why Claude Vision for Scanning?
- State-of-the-art card recognition
- Works with creased, damaged cards
- Handles multiple languages
- Safe API model (claude-sonnet-4-6 not in NEXT_PUBLIC)

## Performance Considerations

### Frontend
- ✅ Images via Next.js Image component (automatic optimization)
- ✅ Lazy loading of heavy components (admin pages, modals)
- ✅ Socket.io over polling for real-time (reduces server load)
- ✅ Infinite scroll (cursor-based) vs paginated pages

### Backend
- ✅ Database indexes on foreign keys (Prisma creates automatically)
- ✅ Redis caching for auctions list (30s TTL)
- ✅ Batch queries (e.g., Promise.all in /stats)
- ✅ Connection pooling (Prisma handles)

### What's Not Optimized (Low Impact)
- Admin pages: No virtualization of large lists (typically < 1000 rows)
- Email sending: Synchronous (doesn't block — Resend is fast)
- Card scanning: No queue system (single request → Claude)

## Next Steps for Future Sessions

1. **Messaging system** — Direct messages between buyer/seller (low priority)
2. **Advanced analytics** — Charts for platform trends, user activity
3. **AI moderation** — Auto-flag suspicious auctions using Claude
4. **Mobile app** — React Native reusing API
5. **Payment alternatives** — Apple Pay, PayPal alongside Stripe
6. **Email template builder** — UI for admin to edit templates without DB access

## Branch & PR Info

**Current branch**: `claude/new-session-hFukP`
**Base**: `master`
**PR #1**: "feat: Next.js 14 App Router migration — complete" (Draft)

Recent commits:
- `3c29bb6` test: add upload route tests with real PNG magic bytes validation
- `c13eabe` test: add tests for messages, reports, contact, card-sets, database-cards
- `c4632de` refactor: consolidate api imports in authStore
- `ac3c52d` feat: SEO metadata layouts + message requester button on wanted page
- `17a69ee` feat: add message-seller button + complete type definitions
- `fe005d6` feat: unread message badge + eliminate any types across frontend
- `6a03a98` feat: mobile bottom nav + fix silent catches in main pages
- `3b58803` fix: replace silent catch patterns in all 19 admin pages
- ...and 22 more

## Git Workflow

```bash
# Pull latest from origin
git fetch origin && git pull origin claude/new-session-hFukP

# Create feature branch
git checkout -b feature/my-feature

# Make changes, commit
git add . && git commit -m "feat: description"

# Push
git push -u origin feature/my-feature

# After merge, continue on branch for next feature
git checkout claude/new-session-hFukP
git pull origin claude/new-session-hFukP
```

## Environment Variables

### Server (`server/.env.local`)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/cardplace
JWT_SECRET=<32-char-hex>
REFRESH_TOKEN_SECRET=<32-char-hex>
CORS_ORIGIN=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
```

### Frontend (`nextjs/.env.local`)
```
EXPRESS_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Useful Commands

```bash
# Database
npx prisma studio                    # GUI for database
npx prisma migrate dev              # Create & run migration
npx prisma db seed                  # Run seed script

# Tests
npm run test                         # Single run
npm run test:watch                  # Watch mode

# Build
npm run build                        # Production build
npm run start                        # Run production build

# Format
npm run lint                         # Type check
npx prettier --write .              # Format code
```

---

**For questions**: Check README.md or see commit history for rationale (`git log --all --grep="feat:"`)
