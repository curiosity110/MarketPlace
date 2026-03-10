# AGENTS.md

## Cursor Cloud specific instructions

### Overview

MK Marketplace (`market-place-mkd`) is a single Next.js 16 monolith (App Router + Turbopack) for an online classifieds platform targeting Macedonia. All frontend, API routes, and cron jobs live in one codebase.

**Stack:** Next.js 16, React 19, TypeScript, Prisma 6, Supabase (Auth + Storage), Tailwind CSS 4, pnpm 10.

### Key commands

| Task | Command |
|---|---|
| Dev server | `pnpm dev` (binds `0.0.0.0:3000`) |
| Lint | `pnpm lint` |
| Build | `pnpm build` |
| Prisma generate | `pnpm prisma generate` (also runs on `postinstall` and `predev`) |
| DB migrations | `pnpm db:migrate` |
| Seed DB | `pnpm prisma:seed` |

### Environment & database

- All required secrets (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`) are injected as environment variables and override `.env` file values.
- The remote Supabase PostgreSQL database already has all migrations applied. Running `pnpm db:migrate` is safe (idempotent).
- If a local PostgreSQL is needed: install `postgresql`, start the service, create the `marketplace` database, and run `pnpm db:migrate`.

### Gotchas

- **Lint has 3 pre-existing errors** in `src/components/browse-filters.tsx` and `src/features/create-listing/create-listing-form-new.tsx` (React hooks rules). These are not blocking.
- **`@prisma/client` build script warning:** pnpm shows a warning about ignored build scripts for `@prisma/client`. This is harmless because `pnpm prisma generate` runs explicitly via `postinstall`.
- The `package.json#prisma` config key triggers a deprecation warning from Prisma 6 (will be removed in Prisma 7). Informational only.
- `pnpm install` automatically triggers `postinstall` -> `pnpm prisma generate`, so the Prisma client is always freshly generated after dependency installs.
