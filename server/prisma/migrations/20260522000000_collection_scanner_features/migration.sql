-- AlterTable: add new fields to CollectionItem
ALTER TABLE "CollectionItem" ADD COLUMN IF NOT EXISTS "marketValue" DOUBLE PRECISION;
ALTER TABLE "CollectionItem" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "CollectionItem" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "CollectionItem" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable: CollectionValueSnapshot
CREATE TABLE IF NOT EXISTS "CollectionValueSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "totalCards" INTEGER NOT NULL,
    "uniqueCards" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionValueSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CollectionValueSnapshot_userId_idx" ON "CollectionValueSnapshot"("userId");
CREATE INDEX IF NOT EXISTS "CollectionValueSnapshot_userId_createdAt_idx" ON "CollectionValueSnapshot"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "CollectionValueSnapshot" ADD CONSTRAINT "CollectionValueSnapshot_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
