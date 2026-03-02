-- Owner isolation policies for Supabase/Postgres.
-- ownerId is expected to store Supabase auth.uid() as text.

ALTER TABLE "Listing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS user_self_select ON "User";
DROP POLICY IF EXISTS user_self_insert ON "User";
DROP POLICY IF EXISTS user_self_update ON "User";

CREATE POLICY listing_owner_select ON "Listing"
FOR SELECT
USING ("ownerId" = auth.uid()::text);

CREATE POLICY listing_owner_insert ON "Listing"
FOR INSERT
WITH CHECK ("ownerId" = auth.uid()::text);

CREATE POLICY listing_owner_update ON "Listing"
FOR UPDATE
USING ("ownerId" = auth.uid()::text)
WITH CHECK ("ownerId" = auth.uid()::text);

CREATE POLICY listing_owner_delete ON "Listing"
FOR DELETE
USING ("ownerId" = auth.uid()::text);

-- Public browse policy for active listings.
CREATE POLICY listing_public_active_select ON "Listing"
FOR SELECT
USING ("status" = 'ACTIVE');

CREATE POLICY category_owner_select ON "Category"
FOR SELECT
USING ("ownerId" = auth.uid()::text);

CREATE POLICY category_owner_insert ON "Category"
FOR INSERT
WITH CHECK ("ownerId" = auth.uid()::text);

CREATE POLICY category_owner_update ON "Category"
FOR UPDATE
USING ("ownerId" = auth.uid()::text)
WITH CHECK ("ownerId" = auth.uid()::text);

CREATE POLICY category_owner_delete ON "Category"
FOR DELETE
USING ("ownerId" = auth.uid()::text);

-- Public category catalog policy.
CREATE POLICY category_public_active_select ON "Category"
FOR SELECT
USING ("isActive" = true);

CREATE POLICY user_self_select ON "User"
FOR SELECT
USING ("supabaseAuthId" = auth.uid()::text);

CREATE POLICY user_self_insert ON "User"
FOR INSERT
WITH CHECK ("supabaseAuthId" = auth.uid()::text);

CREATE POLICY user_self_update ON "User"
FOR UPDATE
USING ("supabaseAuthId" = auth.uid()::text)
WITH CHECK ("supabaseAuthId" = auth.uid()::text);
