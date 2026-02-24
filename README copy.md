# MK Marketplace (Pay-per-listing) — Starter Pack

This repo is a **text-only** starter pack + execution protocol for building your Macedonia-only marketplace:

- Free register/login (email magic link)
- Free browse
- **Pay €2–3 per listing** to publish
- Listing active for **30 days**
- Expired listings become inactive; seller can pay again to renew
- Minimal UI, dark/light toggle
- Strong categories + filters + search
- Admin moderation (reports, bans)
- English first, **i18n-ready** for Macedonian later

## What you do (minimum human actions)
1. Create a GitHub repo (empty).
2. Download this starter pack and copy files into the repo.
3. Run locally:
   ```bash
   pnpm i
   pnpm dev
   ```
4. Create accounts + keys:
   - Postgres provider (Neon/Supabase)
   - Email provider (Resend/Postmark/SMTP)
   - Stripe account (test mode first)
5. Fill `.env` from `.env.example`.
6. Give **Codex** the prompt in `CODEX_AUTOPILOT_PROMPT.txt`.

That’s it. Everything else is planned so Codex can build end-to-end.

## Commands (after Codex generates code)
- Install: `pnpm i`
- DB migrate: `pnpm prisma:migrate`
- Seed: `pnpm prisma:seed`
- Dev: `pnpm dev`
- Test: `pnpm test`
- Lint: `pnpm lint`

## Repo philosophy
- No binaries committed. No images in git.
- Deterministic file structure.
- Every feature has:
  - DB schema
  - validation (Zod)
  - API route(s)
  - UI page(s)
  - tests
  - docs updates

See:
- `DECISIONS.md` (locked scope)
- `ROADMAP.md` (milestones)
- `TASKS.md` (checkbox execution list)
- `ARCHITECTURE.md` (system design)
- `STRIPE.md`, `DEPLOYMENT.md`, `I18N.md`
