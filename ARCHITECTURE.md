# Architecture — MK Marketplace

## High-Level

Frontend:

- Next.js App Router
- Server Components where possible

Backend:

- Route Handlers
- Prisma ORM

Database:

- Supabase Postgres

Auth:

- Supabase Auth (magic link)

Storage:

- Supabase Storage

Payments:

- Stripe (Phase 2)

---

## Core Models

User

- id
- email
- name?
- role (USER|ADMIN)
- bannedAt?
- createdAt

Category

- id
- name
- slug
- parentId?
- isActive

City

- id
- name
- slug

Listing

- id
- sellerId
- title
- description
- priceCents
- currency
- categoryId
- cityId
- condition (NEW|USED|REFURBISHED)
- status (DRAFT|ACTIVE|INACTIVE|REMOVED)
- activeUntil?
- createdAt
- updatedAt

ListingImage

- id
- listingId
- url

Report

- id
- reporterUserId
- targetType (LISTING|USER)
- targetId
- reason
- status (OPEN|CLOSED)
- createdAt
- closedAt?

AdminAction

- id
- adminId
- actionType
- targetType
- targetId
- notes?
- createdAt

---

## Expiration Logic (Phase 1)

Query rule:

- Only show listings where:
  status = ACTIVE
  AND activeUntil > now

Optional cleanup endpoint:

- /api/admin/cleanup-expired

---

## Publish Flow (Phase 2)

1. Seller clicks Publish
2. Create Stripe Checkout session
3. Webhook verifies signature
4. Activate listing
5. Set activeUntil = now + 30 days
6. Renewal extends activeUntil = max(now, currentUntil) + 30d
