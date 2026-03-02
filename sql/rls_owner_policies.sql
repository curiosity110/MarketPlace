-- Owner isolation policies for Supabase/Postgres.
-- NOTE:
-- This project stores internal owner IDs from the "User" table, not auth.uid().
-- Policies map JWT email -> "User".id to enforce owner access safely.

ALTER TABLE "Listing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_owner_select ON "Listing";
DROP POLICY IF EXISTS listing_owner_insert ON "Listing";
DROP POLICY IF EXISTS listing_owner_update ON "Listing";
DROP POLICY IF EXISTS listing_owner_delete ON "Listing";
DROP POLICY IF EXISTS listing_public_active_select ON "Listing";

DROP POLICY IF EXISTS category_owner_select ON "Category";
DROP POLICY IF EXISTS category_owner_insert ON "Category";
DROP POLICY IF EXISTS category_owner_update ON "Category";
DROP POLICY IF EXISTS category_owner_delete ON "Category";
DROP POLICY IF EXISTS category_public_active_select ON "Category";

CREATE POLICY listing_owner_select ON "Listing"
FOR SELECT
USING (
  "ownerId" = (
    SELECT u.id
    FROM "User" AS u
    WHERE lower(u.email) = lower(auth.jwt()->>'email')
    LIMIT 1
  )
);

CREATE POLICY listing_owner_insert ON "Listing"
FOR INSERT
WITH CHECK (
  "ownerId" = (
    SELECT u.id
    FROM "User" AS u
    WHERE lower(u.email) = lower(auth.jwt()->>'email')
    LIMIT 1
  )
);

CREATE POLICY listing_owner_update ON "Listing"
FOR UPDATE
USING (
  "ownerId" = (
    SELECT u.id
    FROM "User" AS u
    WHERE lower(u.email) = lower(auth.jwt()->>'email')
    LIMIT 1
  )
)
WITH CHECK (
  "ownerId" = (
    SELECT u.id
    FROM "User" AS u
    WHERE lower(u.email) = lower(auth.jwt()->>'email')
    LIMIT 1
  )
);

CREATE POLICY listing_owner_delete ON "Listing"
FOR DELETE
USING (
  "ownerId" = (
    SELECT u.id
    FROM "User" AS u
    WHERE lower(u.email) = lower(auth.jwt()->>'email')
    LIMIT 1
  )
);

-- Public browse policy for active listings.
CREATE POLICY listing_public_active_select ON "Listing"
FOR SELECT
USING ("status" = 'ACTIVE');

CREATE POLICY category_owner_select ON "Category"
FOR SELECT
USING (
  "ownerId" = (
    SELECT u.id
    FROM "User" AS u
    WHERE lower(u.email) = lower(auth.jwt()->>'email')
    LIMIT 1
  )
);

CREATE POLICY category_owner_insert ON "Category"
FOR INSERT
WITH CHECK (
  "ownerId" = (
    SELECT u.id
    FROM "User" AS u
    WHERE lower(u.email) = lower(auth.jwt()->>'email')
    LIMIT 1
  )
);

CREATE POLICY category_owner_update ON "Category"
FOR UPDATE
USING (
  "ownerId" = (
    SELECT u.id
    FROM "User" AS u
    WHERE lower(u.email) = lower(auth.jwt()->>'email')
    LIMIT 1
  )
)
WITH CHECK (
  "ownerId" = (
    SELECT u.id
    FROM "User" AS u
    WHERE lower(u.email) = lower(auth.jwt()->>'email')
    LIMIT 1
  )
);

CREATE POLICY category_owner_delete ON "Category"
FOR DELETE
USING (
  "ownerId" = (
    SELECT u.id
    FROM "User" AS u
    WHERE lower(u.email) = lower(auth.jwt()->>'email')
    LIMIT 1
  )
);

-- Public category catalog policy.
CREATE POLICY category_public_active_select ON "Category"
FOR SELECT
USING ("isActive" = true);
