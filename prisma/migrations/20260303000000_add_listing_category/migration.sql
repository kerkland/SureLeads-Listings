-- CreateEnum
CREATE TYPE "ListingCategory" AS ENUM ('FOR_RENT', 'FOR_SALE', 'SHORT_LET');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN "category" "ListingCategory" NOT NULL DEFAULT 'FOR_RENT';

-- CreateIndex
CREATE INDEX "listings_category_idx" ON "listings"("category");
