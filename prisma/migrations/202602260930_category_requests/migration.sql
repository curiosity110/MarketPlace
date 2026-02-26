-- CreateEnum
CREATE TYPE "CategoryRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CategoryRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "desiredName" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "status" "CategoryRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryRequest_status_idx" ON "CategoryRequest"("status");
CREATE INDEX "CategoryRequest_createdAt_idx" ON "CategoryRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "CategoryRequest" ADD CONSTRAINT "CategoryRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
