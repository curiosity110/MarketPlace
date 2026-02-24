# ROADMAP

## Milestone 0 — Repo + Protocol (Done when committed)
- [ ] All docs in this starter pack are in repo
- [ ] Codex prompt exists and is locked
- [ ] No binaries in git policy documented
- [ ] .env.example exists

## Milestone 1 — Auth + DB Foundation
- [ ] Next.js + TypeScript project scaffolded
- [ ] Prisma schema created + migrations working
- [ ] Auth.js email magic link login/logout
- [ ] RBAC: USER + ADMIN
- [ ] Protected routes middleware/server checks

## Milestone 2 — Listings
- [ ] Categories + cities seeded
- [ ] Listing create/edit draft
- [ ] Listing browse + search + filters + sort
- [ ] Listing details page
- [ ] Images upload (object storage; no git images)

## Milestone 3 — Pay-to-Publish (Core Business Model)
- [ ] Stripe product/price configured (EUR)
- [ ] Checkout session for a specific listingId
- [ ] Stripe webhook verified + idempotent
- [ ] On payment success: listing becomes ACTIVE, activeUntil = now + 30d
- [ ] Renewal flow works
- [ ] Expired listings hidden and/or marked inactive

## Milestone 4 — Admin Moderation
- [ ] /admin protected
- [ ] Reports queue (listing/user)
- [ ] Actions: remove listing, ban user, audit log

## Milestone 5 — Production Readiness
- [ ] Rate limiting on auth + publish endpoints
- [ ] Input validation everywhere (Zod)
- [ ] Error monitoring (Sentry) optional but recommended
- [ ] E2E tests for critical flows
- [ ] DEPLOYMENT.md validated on Vercel
