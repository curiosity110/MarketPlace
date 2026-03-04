DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SaleMethod') THEN
    CREATE TYPE "SaleMethod" AS ENUM ('CASH', 'BANK', 'CARD', 'OTHER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PurchaseRequestStatus') THEN
    CREATE TYPE "PurchaseRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
  END IF;
END $$;

ALTER TABLE "Sale"
  ADD COLUMN IF NOT EXISTS "soldPriceCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "buyerName" TEXT,
  ADD COLUMN IF NOT EXISTS "buyerPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "buyerAuthUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "method" "SaleMethod",
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "PurchaseRequest" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "sellerAuthUserId" TEXT NOT NULL,
  "buyerAuthUserId" TEXT,
  "buyerIpHash" TEXT,
  "buyerName" TEXT,
  "buyerPhone" TEXT,
  "message" TEXT,
  "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PurchaseRequest_listingId_fkey'
  ) THEN
    ALTER TABLE "PurchaseRequest"
      ADD CONSTRAINT "PurchaseRequest_listingId_fkey"
      FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "PurchaseRequest_listingId_buyerAuthUserId_key"
  ON "PurchaseRequest"("listingId", "buyerAuthUserId");
CREATE INDEX IF NOT EXISTS "PurchaseRequest_sellerAuthUserId_status_createdAt_idx"
  ON "PurchaseRequest"("sellerAuthUserId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "PurchaseRequest_listingId_status_createdAt_idx"
  ON "PurchaseRequest"("listingId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "PurchaseRequest_listingId_buyerIpHash_createdAt_idx"
  ON "PurchaseRequest"("listingId", "buyerIpHash", "createdAt");
CREATE INDEX IF NOT EXISTS "PurchaseRequest_buyerAuthUserId_idx"
  ON "PurchaseRequest"("buyerAuthUserId");

CREATE TABLE IF NOT EXISTS "RateLimitEvent" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RateLimitEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RateLimitEvent_key_action_createdAt_idx"
  ON "RateLimitEvent"("key", "action", "createdAt");
CREATE INDEX IF NOT EXISTS "RateLimitEvent_action_createdAt_idx"
  ON "RateLimitEvent"("action", "createdAt");

CREATE TABLE IF NOT EXISTS "ListingReport" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "reporterAuthUserId" TEXT,
  "reporterIpHash" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ListingReport_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ListingReport_listingId_fkey'
  ) THEN
    ALTER TABLE "ListingReport"
      ADD CONSTRAINT "ListingReport_listingId_fkey"
      FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ListingReport_listingId_createdAt_idx"
  ON "ListingReport"("listingId", "createdAt");
CREATE INDEX IF NOT EXISTS "ListingReport_reporterAuthUserId_createdAt_idx"
  ON "ListingReport"("reporterAuthUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "ListingReport_reporterIpHash_createdAt_idx"
  ON "ListingReport"("reporterIpHash", "createdAt");
