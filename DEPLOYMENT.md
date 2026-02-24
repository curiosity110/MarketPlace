# Deployment (Recommended Default)

## Recommended hosting
- App: Vercel
- DB: Neon or Supabase Postgres
- Images: Cloudflare R2 or AWS S3
- Email: Resend / Postmark / SMTP
- Payments: Stripe

## Steps
1. Create DB and get DATABASE_URL
2. Create email provider and set credentials
3. Create Stripe keys and webhook endpoint (test + live later)
4. Set Vercel env vars from .env.example
5. Deploy via Vercel Git integration

## Production checklist
- Turn on HTTPS (Vercel default)
- Verify Stripe webhook works in production
- Confirm email deliverability (SPF/DKIM with your domain)
- Add rate limiting to auth and payment endpoints
- Add admin user bootstrap flow
