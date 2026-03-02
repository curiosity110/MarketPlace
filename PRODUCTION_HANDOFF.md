# Production Handoff

## Current Status

- Posting is login-only.
  - Route protection: `middleware.ts`
  - Server-side guard: `src/lib/auth.ts`
- Role model is now expanded and enforced:
  - Roles: `BUYER`, `SELLER`, `STAFF`, `ADMIN`, `CEO`
  - `STAFF/CEO/ADMIN` can access control center.
  - Only `ADMIN` can assign roles in admin dashboard.
- Seller experience is split cleanly:
  - `/sell` redirects to `/sell/analytics?create=1`.
  - `/sell/analytics` is the main seller dashboard for `SELLER/STAFF/CEO` with create popup.
  - `/profile` is the dedicated profile management page.
- First published listing is free for 30 days.
- Any next publish requires payment flow (`stripe-dummy` currently).
  - Create flow: `src/app/sell/page.tsx`
  - Edit flow (draft -> active): `src/app/sell/[id]/edit/page.tsx`
- Listing publish now enforces:
  - Required seller phone with country select (default Macedonia).
  - Macedonian format support: `070...`, `+389...`, `00389...`.
  - Only `EUR` and `MKD` are allowed currencies.
- Listing contact behavior:
  - Seller phone is directly visible on listing details (`/listing/[id]`).
  - Contact request endpoint is currently a redirect stub (no gated phone-reveal workflow).
- Sold-money tracking is live:
  - Seller can mark active listing as sold.
  - `Sale` record is created with gross, platform fee, and net.
  - Seller and admin revenue screens are connected to sold totals.
- Browse is live against active listings and seeded data.
  - Main page: `src/app/browse/page.tsx`
  - Card UI: `src/components/listing-card.tsx`

## Seeder

- Seeder creates 3 active listings per category from tester account and supports reset.
  - `prisma/seed.js`
- Environment knobs:
  - `SEED_RESET=true`
  - `SEED_TESTER_EMAIL`
  - `SEED_TESTER_NAME`
  - `SEED_TESTER_PHONE`
  - `SEED_FAKE_SELLERS` (default `10`)
  - `SEED_FAKE_SELLER_DOMAIN`

Run:

```bash
pnpm prisma migrate deploy
pnpm prisma generate
pnpm prisma:seed
pnpm build
pnpm start
```

## Promote One User To ADMIN (No UI)

Exact run command (bash):

```bash
ALLOW_MAKE_ADMIN=true ADMIN_EMAIL=admin@example.com pnpm make:admin
```

PowerShell equivalent:

```powershell
$env:ALLOW_MAKE_ADMIN="true"; $env:ADMIN_EMAIL="admin@example.com"; pnpm make:admin
```

## Owner Isolation Backfill

Run after applying migrations if older rows exist:

```bash
pnpm backfill:owner
```

What it does:
- Sets `Listing.ownerId = Listing.sellerId` when missing.
- Sets missing `Category.ownerId` to the first `ADMIN/CEO` user (or first user fallback).

## Supabase Auth + Callback

- Browser client: `src/lib/supabase/browser.ts`
- Server client: `src/lib/supabase/server.ts`
- Callback route: `/auth/callback` (`src/app/auth/callback/route.ts`)
- Backward-compatible redirect from `/api/auth/callback` to `/auth/callback`
- Server auth actions: `src/app/(auth)/actions.ts`

Required env values:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## RLS SQL (Owner Policies)

SQL file:

`sql/rls_owner_policies.sql`

Apply after schema migration and owner backfill.

Note: this project maps Supabase JWT email to internal `"User".id` for policy checks.

## Supabase Cookie Reset (If You See "Invalid Compact JWS")

If you change Supabase project keys/URL and uploads or auth start failing with `Invalid Compact JWS`:

1. Clear browser cookies for `localhost` (or your dev host).
2. Restart `pnpm dev`.
3. Login again to refresh Supabase session cookies.

## Manual Verification Checklist

1. Password signup:
   - Open `/register`
   - Submit email + password
   - If confirm-email is ON and no session is returned, UI must show check-email message.
2. Password login:
   - Confirm user in email
   - Login with password from `/login`
   - Expect redirect to `next` path or browse/dashboard path.
3. Magic link:
   - From `/login`, click `Send magic link`
   - Open mail and complete `/auth/callback`
   - Expect redirect to `/browse` (or safe `next`).
4. Tenant isolation:
   - Login as user A, create listing(s)
   - Login as user B, verify dashboard/profile show only B-owned listings
   - Check `/debug/tenant` for owner-scoped counts and sample records.
5. Locale switch:
   - Toggle MK/EN in navbar
   - Verify auth status/error messages switch language.

## Information Needed From You

- Production sender email/domain verified in Resend (exact From address), if email notifications are enabled.
- Final payment provider choice:
  - Keep dummy Stripe or switch to real Stripe.
- Marketplace legal content:
  - Terms, privacy policy, moderation policy, refund rules.
- Final admin account emails.
- Brand text for transactional emails (tone + language MKD/EN).

## What Is Left To Make It Fully Production

1. Replace dummy payments with real Stripe Checkout + webhook.
   - Main publish enforcement: `src/app/sell/page.tsx`
   - Draft->active publish enforcement: `src/app/sell/[id]/edit/page.tsx`
2. Add durable email templates (HTML + localization), if enabling outbound email.
   - `src/lib/notifications.ts` (or equivalent provider integration point)
3. Add anti-abuse controls:
   - Rate limits on auth/chat/contact request/report endpoints.
   - Captcha on registration and high-risk forms.
4. Add observability:
   - Sentry (server + client), structured request logs, uptime checks.
5. Add SEO + growth pages:
   - Static city/category landing pages and sitemap expansion.
6. Add a dedicated production smoke test script:
   - Auth flow, listing publish, browse visibility, listing detail render, admin access checks.

## Global-Level Recommendations

1. i18n rollout: Macedonian + English UI with shared key system.
2. Trust layer: verified seller badges, listing quality score, moderation queue SLA.
3. Conversion layer: saved searches + instant alerts + WhatsApp/email intent follow-up.
4. Ops layer: admin audit dashboard for abuse, payments, support backlog.
5. Performance layer: image optimization, edge caching, and DB index review every month.
