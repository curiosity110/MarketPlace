-- CreateEnum
CREATE TYPE "ContactRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactRequestStatus" NOT NULL DEFAULT 'PENDING',
    "sellerResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactRequest_listingId_requesterUserId_createdAt_idx" ON "ContactRequest"("listingId", "requesterUserId", "createdAt");
CREATE INDEX "ContactRequest_sellerUserId_status_createdAt_idx" ON "ContactRequest"("sellerUserId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
