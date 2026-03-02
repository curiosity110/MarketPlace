-- Add owner isolation columns.
ALTER TABLE "Category" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Listing" ADD COLUMN "ownerId" TEXT;

-- Backfill listings from the existing seller relation.
UPDATE "Listing"
SET "ownerId" = "sellerId"
WHERE "ownerId" IS NULL;

-- Backfill categories to an existing admin (or earliest user) when possible.
WITH fallback_owner AS (
  SELECT "id"
  FROM "User"
  ORDER BY
    CASE
      WHEN "role" IN ('ADMIN', 'CEO') THEN 0
      ELSE 1
    END,
    "createdAt" ASC
  LIMIT 1
)
UPDATE "Category" AS c
SET "ownerId" = f."id"
FROM fallback_owner AS f
WHERE c."ownerId" IS NULL;

-- Make listing owner required once backfilled.
ALTER TABLE "Listing" ALTER COLUMN "ownerId" SET NOT NULL;

-- Add FKs and indexes.
ALTER TABLE "Category"
ADD CONSTRAINT "Category_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Listing"
ADD CONSTRAINT "Listing_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Category_ownerId_idx" ON "Category"("ownerId");
CREATE INDEX "Listing_ownerId_idx" ON "Listing"("ownerId");
