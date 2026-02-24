# TASKS (Codex checks these off)

## Repo/Tooling
- [x] Scaffold Next.js App Router + TypeScript + Tailwind + shadcn/ui
- [x] Add next-themes toggle (dark/light)
- [ ] Add ESLint + Prettier + lint-staged
- [ ] Add .editorconfig + .gitattributes + .gitignore
- [ ] Add CI workflow (lint + test)

## Database (Prisma)
- [x] Create prisma/schema.prisma from ARCHITECTURE.md
- [x] Add migrations
- [x] Seed: categories + Macedonian cities + admin user

## Auth (Email Magic Link)
- [x] Auth.js setup + Prisma adapter
- [ ] Email provider config (Resend/Postmark/SMTP)
- [x] Session includes user.role
- [x] Admin-only gate for /admin

## Listings
- [x] Listing model + images
- [x] Create listing UI (draft)
- [x] Browse UI: filters (category, city, price), sort, search
- [x] Listing details page

## Pay-per-listing Publish
- [ ] Stripe Checkout route (listingId)
- [ ] Stripe webhook route (signature verified, raw body)
- [ ] Payment record saved + idempotency
- [ ] Activate listing for 30 days on payment success
- [ ] Renewal = same flow
- [x] Expiration handling (query filters + optional cleanup job)

## Moderation
- [x] Report listing/user
- [x] Admin queue
- [x] Remove listing / ban user / audit log

## Production
- [ ] Rate limits
- [ ] Zod validation everywhere
- [ ] Basic tests + E2E smoke tests
- [ ] DEPLOYMENT.md finalized
