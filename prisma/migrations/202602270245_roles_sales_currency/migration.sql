-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'MKD');

-- CreateEnum
CREATE TYPE "Role_new" AS ENUM ('BUYER', 'SELLER', 'STAFF', 'ADMIN', 'CEO');

-- Alter role default and values
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
ALTER COLUMN "role" TYPE "Role_new"
USING (
  CASE
    WHEN "role"::text = 'USER' THEN 'SELLER'
    WHEN "role"::text = 'ADMIN' THEN 'ADMIN'
    ELSE 'SELLER'
  END
)::"Role_new";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'SELLER';
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

-- Alter listing currency to strict enum
ALTER TABLE "Listing" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "Listing"
ALTER COLUMN "currency" TYPE "Currency"
USING (
  CASE
    WHEN upper("currency") = 'MKD' THEN 'MKD'
    ELSE 'EUR'
  END
)::"Currency";
ALTER TABLE "Listing" ALTER COLUMN "currency" SET DEFAULT 'EUR';

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL,
    "platformFeeCents" INTEGER NOT NULL DEFAULT 0,
    "netAmountCents" INTEGER NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_listingId_key" ON "Sale"("listingId");

-- CreateIndex
CREATE INDEX "Sale_sellerId_soldAt_idx" ON "Sale"("sellerId", "soldAt");

-- CreateIndex
CREATE INDEX "Sale_soldAt_idx" ON "Sale"("soldAt");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
