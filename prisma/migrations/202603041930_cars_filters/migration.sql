CREATE TABLE IF NOT EXISTS "CarMake" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CarMake_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CarMake_slug_key"
  ON "CarMake"("slug");

CREATE TABLE IF NOT EXISTS "CarModel" (
  "id" TEXT NOT NULL,
  "makeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CarModel_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CarModel_makeId_fkey'
  ) THEN
    ALTER TABLE "CarModel"
      ADD CONSTRAINT "CarModel_makeId_fkey"
      FOREIGN KEY ("makeId") REFERENCES "CarMake"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "CarModel_makeId_slug_key"
  ON "CarModel"("makeId", "slug");
CREATE INDEX IF NOT EXISTS "CarModel_makeId_name_idx"
  ON "CarModel"("makeId", "name");

ALTER TABLE "Listing"
  ADD COLUMN IF NOT EXISTS "carMakeId" TEXT,
  ADD COLUMN IF NOT EXISTS "carModelId" TEXT,
  ADD COLUMN IF NOT EXISTS "carYear" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Listing_carMakeId_fkey'
  ) THEN
    ALTER TABLE "Listing"
      ADD CONSTRAINT "Listing_carMakeId_fkey"
      FOREIGN KEY ("carMakeId") REFERENCES "CarMake"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Listing_carModelId_fkey'
  ) THEN
    ALTER TABLE "Listing"
      ADD CONSTRAINT "Listing_carModelId_fkey"
      FOREIGN KEY ("carModelId") REFERENCES "CarModel"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Listing_carMakeId_idx"
  ON "Listing"("carMakeId");
CREATE INDEX IF NOT EXISTS "Listing_carModelId_idx"
  ON "Listing"("carModelId");
CREATE INDEX IF NOT EXISTS "Listing_carYear_idx"
  ON "Listing"("carYear");
