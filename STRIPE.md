# Stripe Setup (Pay-per-listing)

## What you will build
- A **Checkout Session** per listing publish/renewal.
- A **Webhook** that activates the listing for 30 days on successful payment.

## Stripe dashboard steps (human)
1. Create Stripe account (test mode first).
2. Create a Product: "Listing publish (30 days)".
3. Create a Price (one-time): €2 or €3 (choose one for now; you can change later).
4. Add webhook endpoint in Stripe:
   - URL: https://YOUR_DOMAIN/api/webhooks/stripe
   - Events to send:
     - checkout.session.completed
     - checkout.session.expired (optional)
     - payment_intent.payment_failed (optional)

## Required environment variables
- STRIPE_SECRET_KEY=sk_test_...
- STRIPE_WEBHOOK_SECRET=whsec_...
- NEXT_PUBLIC_SITE_URL=https://yourdomain.com

## Critical implementation notes (Codex must follow)
- Webhook must verify signature using Stripe-Signature header and the webhook secret.
- Webhook must be **idempotent**:
  - Use stripeCheckoutSessionId unique constraint in Payment table.
  - If payment already processed, do nothing.
- Put { listingId, userId } in metadata of the checkout session.
- Extend activeUntil:
  - newUntil = max(now, existingActiveUntil) + 30 days

## Testing
- Use Stripe CLI to forward webhook events to localhost.
