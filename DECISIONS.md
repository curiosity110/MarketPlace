# Locked Decisions (Do Not Re-litigate)

## Scope

- Marketplace for **North Macedonia only**
- Users contact off-platform
- No built-in chat for MVP
- Moderation only (reports + bans)

## Monetization Model (Phase 2)

- Free register/login (Supabase magic link)
- Free browse
- Pay €3 per listing to publish
- Listing active for 30 days
- Expired listings become INACTIVE
- Seller can pay again to renew
- No subscriptions
- No auto-renew

## Phase Plan

PHASE 1:

- Auth
- Listings CRUD
- Browse + search + filters
- Admin moderation
- Expiration logic (without payment)

PHASE 2:

- Stripe checkout
- Webhook activation
- Renewal logic

## UI Philosophy

- Minimal
- Fast
- Clean
- Dark/light toggle
- No overdesign
- Single-page feel via fast routing

## Tech Stack (Locked)

- Next.js App Router + TypeScript
- Tailwind
- Prisma
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Stripe (Phase 2)
- Zod validation
