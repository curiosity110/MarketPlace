-- CreateEnum
CREATE TYPE "CategoryFieldType" AS ENUM ('TEXT', 'NUMBER', 'SELECT', 'BOOLEAN');

-- CreateTable
CREATE TABLE "CategoryFieldTemplate" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "type" "CategoryFieldType" NOT NULL,
  "optionsJson" TEXT,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "CategoryFieldTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingFieldValue" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,

  CONSTRAINT "ListingFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryFieldTemplate_categoryId_key_key" ON "CategoryFieldTemplate"("categoryId", "key");
CREATE INDEX "CategoryFieldTemplate_categoryId_order_idx" ON "CategoryFieldTemplate"("categoryId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ListingFieldValue_listingId_key_key" ON "ListingFieldValue"("listingId", "key");
CREATE INDEX "ListingFieldValue_listingId_idx" ON "ListingFieldValue"("listingId");

-- AddForeignKey
ALTER TABLE "CategoryFieldTemplate" ADD CONSTRAINT "CategoryFieldTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingFieldValue" ADD CONSTRAINT "ListingFieldValue_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
