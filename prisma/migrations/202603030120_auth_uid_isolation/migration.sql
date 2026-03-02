-- Align app ownership with Supabase auth user IDs.

ALTER TABLE "User" ADD COLUMN "supabaseAuthId" TEXT;
CREATE UNIQUE INDEX "User_supabaseAuthId_key" ON "User"("supabaseAuthId");

-- ownerId is now auth UID and no longer a FK to public.User.id.
ALTER TABLE "Listing" DROP CONSTRAINT IF EXISTS "Listing_ownerId_fkey";
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_ownerId_fkey";

-- Fill User.supabaseAuthId by matching auth.users email.
UPDATE "User" AS u
SET "supabaseAuthId" = au.id::text
FROM auth.users AS au
WHERE lower(au.email) = lower(u.email)
  AND (u."supabaseAuthId" IS NULL OR u."supabaseAuthId" <> au.id::text);

-- Existing ownerId values currently point to User.id in some rows.
-- Rewrite owner columns to Supabase auth IDs where available.
UPDATE "Listing" AS l
SET "ownerId" = u."supabaseAuthId"
FROM "User" AS u
WHERE l."sellerId" = u."id"
  AND u."supabaseAuthId" IS NOT NULL;

UPDATE "Category" AS c
SET "ownerId" = u."supabaseAuthId"
FROM "User" AS u
WHERE c."ownerId" = u."id"
  AND u."supabaseAuthId" IS NOT NULL;
