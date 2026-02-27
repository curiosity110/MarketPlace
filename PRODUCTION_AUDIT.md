# Production Audit (February 27, 2026)

## Build and quality status
- `pnpm lint`: PASS
- `pnpm build`: PASS
- `pnpm prisma migrate status`: PASS (database schema is up to date)
- `pnpm audit --prod`: PASS (no known vulnerabilities found)

## Key fixes in this pass
- Profile handle is now clean and predictable:
  - Removed random suffix behavior.
  - Public handle now uses `@username`.
  - If username is missing, fallback is based on email prefix.
- Profile username validation hardened:
  - 3-40 characters.
  - Allowed: lowercase letters, numbers, `.`, `_`, `-`.
  - Duplicate username prevention added (cannot save if already used).

## Runtime behavior checks
- `/browse` listing visibility issue previously fixed (empty min/max no longer force price `0` filter).
- Auth and seller routes compile and render under production build.
- API routes compile under production build.

## Remaining manual pre-launch checks (recommended)
- Verify signup/login callback flow against production Supabase project.
- Verify image upload against production Supabase storage bucket and CORS.
- Run one full seller flow manually:
  - Create listing (first free publish),
  - Create second listing (dummy Stripe validation),
  - Edit listing,
  - Browse listing visibility and filters.
- Confirm SMTP/provider setup for notification emails in production environment.
- Confirm final env values:
  - `DATABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - OpenAI key(s) used by AI endpoints.

## Ops recommendations before go-live
- Enable structured error logging and alerting for API and DB failures.
- Add rate limits for auth, messaging, and AI endpoints.
- Add daily automated backup verification for PostgreSQL.
- Add smoke E2E for login, create listing, browse, profile save.
