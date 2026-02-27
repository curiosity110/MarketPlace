# Production Handoff

## Current Status

- Posting is login-only.
  - Route protection: `middleware.ts`
  - Server-side guard: `src/lib/auth.ts`
- First published listing is free for 30 days.
- Any next publish requires payment flow (`stripe-dummy` currently).
  - Create flow: `src/app/sell/page.tsx`
  - Edit flow (draft -> active): `src/app/sell/[id]/edit/page.tsx`
- Email notifications are integrated via Resend.
  - `src/lib/notifications.ts`
- Contact request and phone reveal flow is implemented.
  - Buyer request endpoint: `src/app/api/contact-requests/route.ts`
  - Listing-side UI: `src/app/listing/[id]/page.tsx`
  - Seller moderation UI: `src/app/sell/page.tsx`

## Seeder

- Seeder now creates 3 active listings per category from tester account and supports reset.
  - `prisma/seed.js`
- Environment knobs:
  - `SEED_RESET=true`
  - `SEED_TESTER_EMAIL`
  - `SEED_TESTER_NAME`
  - `SEED_TESTER_PHONE`

Run:

```bash
pnpm prisma migrate deploy
pnpm prisma:seed
```

## Information Needed From You

- Production sender email/domain verified in Resend (exact From address).
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
2. Add durable email templates (HTML + localization).
   - `src/lib/notifications.ts`
3. Add anti-abuse controls:
   - Rate limits on auth/chat/contact request/report endpoints.
   - Captcha on registration and high-risk forms.
4. Add observability:
   - Sentry (server + client), structured request logs, uptime checks.
5. Add SEO + growth pages:
   - Static city/category landing pages and sitemap expansion.

## Global-Level Recommendations

1. i18n rollout: Macedonian + English UI with shared key system.
2. Trust layer: verified seller badges, listing quality score, moderation queue SLA.
3. Conversion layer: saved searches + instant alerts + WhatsApp/email intent follow-up.
4. Ops layer: admin audit dashboard for abuse, payments, support backlog.
5. Performance layer: image optimization, edge caching, and DB index review every month.
