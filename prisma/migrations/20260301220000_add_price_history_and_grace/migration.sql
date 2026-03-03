-- AlterTable: add graceExpiresAt to listings
ALTER TABLE "listings" ADD COLUMN "graceExpiresAt" TIMESTAMP(3);

-- CreateTable: listing_price_history
CREATE TABLE "listing_price_history" (
    "id"             TEXT NOT NULL,
    "listingId"      TEXT NOT NULL,
    "oldRentPerYear" BIGINT NOT NULL,
    "newRentPerYear" BIGINT NOT NULL,
    "changedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy"      TEXT NOT NULL,
    "source"         TEXT NOT NULL DEFAULT 'RECONFIRMATION',

    CONSTRAINT "listing_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_price_history_listingId_idx" ON "listing_price_history"("listingId");

-- CreateIndex
CREATE INDEX "listing_price_history_changedAt_idx" ON "listing_price_history"("changedAt");

-- AddForeignKey
ALTER TABLE "listing_price_history" ADD CONSTRAINT "listing_price_history_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
