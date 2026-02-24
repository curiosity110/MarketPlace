# TASKS (Codex checks these off)

## Repo/Tooling
- [ ] Scaffold Next.js App Router + TypeScript + Tailwind + shadcn/ui
- [ ] Add next-themes toggle (dark/light)
- [ ] Add ESLint + Prettier + lint-staged
- [ ] Add .editorconfig + .gitattributes + .gitignore
- [ ] Add CI workflow (lint + test)

## Database (Prisma)
- [ ] Create prisma/schema.prisma from ARCHITECTURE.md
- [ ] Add migrations
- [ ] Seed: categories + Macedonian cities + admin user

## Auth (Email Magic Link)
- [ ] Auth.js setup + Prisma adapter
- [ ] Email provider config (Resend/Postmark/SMTP)
- [ ] Session includes user.role
- [ ] Admin-only gate for /admin

## Listings
- [ ] Listing model + images
- [ ] Create listing UI (draft)
- [ ] Browse UI: filters (category, city, price), sort, search
- [ ] Listing details page

## Pay-per-listing Publish
- [ ] Stripe Checkout route (listingId)
- [ ] Stripe webhook route (signature verified, raw body)
- [ ] Payment record saved + idempotency
- [ ] Activate listing for 30 days on payment success
- [ ] Renewal = same flow
- [ ] Expiration handling (query filters + optional cleanup job)

## Moderation
- [ ] Report listing/user
- [ ] Admin queue
- [ ] Remove listing / ban user / audit log

## Production
- [ ] Rate limits
- [ ] Zod validation everywhere
- [ ] Basic tests + E2E smoke tests
- [ ] DEPLOYMENT.md finalized
