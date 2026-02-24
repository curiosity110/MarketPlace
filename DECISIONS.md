# Locked Decisions (Do Not Re-litigate)

## Market + Scope

- Marketplace is for **North Macedonia only** (cities list seeded).
- Users can contact **off-platform** (no built-in chat for MVP).

## Monetization (Locked)

- Free register/login.
- Free browse.
- **To publish a listing:** pay **€2–3** **per listing**.
- Payment unlocks **that specific listing**.
- Listing is active for **30 days** from payment success.
- After expiration listing becomes **inactive**.
- Seller can pay again to **renew**.
- No subscriptions, no auto-renew.

## Product UX

- Minimal UI, readable, clean.
- Dark/light toggle.
- “Single-page feel” (fast navigation) but normal routes are allowed.

## Language Strategy

- Build in English first.
- System is i18n-ready from day 1 so Macedonian can be added later by filling translations.

## Enforcement & Consequences

- Since contact is off-platform, platform enforcement is **moderation-only**:
  - report listing/user
  - admin reviews
  - remove listing / ban user
  - optional reputation later (not MVP)

## Tech Stack (Default)

- Next.js App Router + TypeScript
- Prisma + PostgreSQL
- Supabase Auth (magic link)
- Stripe Checkout + Webhooks
- Tailwind + shadcn/ui + next-themes
- Vercel deploy (default)
