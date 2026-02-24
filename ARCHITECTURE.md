# Architecture (Pay-per-listing Marketplace)

## High level
- Frontend: Next.js (App Router) with minimal pages
- Backend: Next.js Route Handlers (server-side) + Prisma
- DB: Postgres
- Auth: Supabase Auth (magic link)
- Payments: Stripe Checkout + Webhooks ( THIS CAN BE SKIPPED NOT OF MUCH IMPORTANCE FOR PHASE 1)
- Images: Object storage (S3/R2). Store URLs in DB.

## Key constraints
- Macedonia-only marketplace -> Listings have `cityId` (seeded) and optional `area`.
- Pay per listing publish: each listing has `status` + `activeUntil`.
- Off-platform contact: no escrow; moderation only.

## Entities (Prisma models)
**User**
- id, email, name?, role (USER|ADMIN), createdAt
- bannedAt?

**Category**
- id, name, slug, parentId? (optional), isActive

**City**
- id, name, slug

**Listing**
- id, sellerId (User)
- title, description
- priceCents, currency
- categoryId, cityId
- condition (NEW|USED|REFURBISHED)
- status (DRAFT|INACTIVE|ACTIVE|REMOVED)
- activeUntil (DateTime?)  // computed by payment
- createdAt, updatedAt

**ListingImage**
- id, listingId, url

**Payment**
- id, listingId, userId
- amountCents, currency
- stripeCheckoutSessionId (unique), stripePaymentIntentId?
- status (PENDING|SUCCEEDED|FAILED)
- createdAt

**Report**
- id, reporterUserId
- targetType (LISTING|USER)
- targetId
- reason, details?
- status (OPEN|CLOSED)
- createdAt, closedAt?

**AdminAction**
- id, adminId
- actionType (LISTING_REMOVED|USER_BANNED|REPORT_CLOSED|...)
- targetType, targetId
- notes?
- createdAt

## Publish flow (core)
1. Seller creates listing (DRAFT).
2. Click "Publish" -> server creates Stripe Checkout session with metadata { listingId, userId }.
3. Stripe webhook `checkout.session.completed` -> verify signature -> find listing/payment -> mark Payment SUCCEEDED -> set Listing:
   - status=ACTIVE
   - activeUntil = now + 30 days
4. Listing queries only show ACTIVE listings with activeUntil > now.
5. Renewal repeats steps 2–4 and extends activeUntil (recommended: set to max(now, activeUntil)+30d).

## Expiration handling
- Primary: query filter hides expired.
- Optional: daily job endpoint (protected) that flips expired ACTIVE listings to INACTIVE.

## Categories (recommended)
Start with ~10 top-level categories and allow tags (simple string array) later if needed.
Top-level:
- Electronics
- Vehicles & Parts
- Home & Garden
- Fashion
- Sports
- Beauty & Health
- Jobs & Services
- Kids & Baby
- Real Estate
- Other

## Filters & Search
- Search: title/description ILIKE (fast to ship)
- Filters: category, city, price range, condition
- Sort: newest, price asc/desc

## Minimal routes
Public:
- / (browse)
- /listing/[id]
- /login
- /sell (my listings; requires auth)
Admin:
- /admin (requires role ADMIN)

API:
- /api/listings (GET/POST)
- /api/listings/[id] (GET/PATCH/DELETE)
- /api/payments/checkout (POST)
- /api/webhooks/stripe (POST)
- /api/reports (POST)
- /api/admin/reports (GET/PATCH)
- /api/admin/users/[id]/ban (POST)
- /api/admin/listings/[id]/remove (POST)
