# Checklist for You (The Only Human Steps)

## Accounts you must create (once)
1) Database: Neon or Supabase Postgres
   - Get DATABASE_URL

2) Email sending (magic links):
   - EITHER Resend OR Postmark OR SMTP
   - Get API key / SMTP creds
   - Decide EMAIL_FROM

3) Stripe:
   - Get STRIPE_SECRET_KEY
   - Create price for "Listing publish 30 days" -> STRIPE_PRICE_ID_PUBLISH
   - Create webhook endpoint -> STRIPE_WEBHOOK_SECRET

4) Hosting:
   - Vercel account
   - Add env vars in Vercel

## Local setup commands (after Codex generates code)
1) Copy .env.example -> .env and fill values
2) pnpm i
3) pnpm prisma:migrate
4) pnpm prisma:seed
5) pnpm dev
6) Stripe CLI forward webhooks to localhost (optional but recommended)

## What you paste into Codex
- The full contents of CODEX_AUTOPILOT_PROMPT.txt

## What you should NOT do
- Don’t add images to git.
- Don’t hardcode secrets in code.
- Don’t change the monetization model mid-build.
