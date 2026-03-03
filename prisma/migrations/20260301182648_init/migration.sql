-- CreateEnum
CREATE TYPE "Role" AS ENUM ('AGENT', 'CLIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'PROFESSIONAL', 'AGENCY');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('FLAT', 'DUPLEX', 'ROOM', 'BUNGALOW', 'TERRACED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('AVAILABLE', 'PENDING_RECONFIRMATION', 'HIDDEN', 'PAUSED', 'RENTED', 'DELETED');

-- CreateEnum
CREATE TYPE "ListingTier" AS ENUM ('BASIC', 'VERIFIED');

-- CreateEnum
CREATE TYPE "CrossPostStatus" AS ENUM ('OPEN', 'AGENT_A_WINS', 'AGENT_B_WINS', 'BOTH_PAUSED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "DetectionMethod" AS ENUM ('ADDRESS_MATCH', 'PHOTO_HASH', 'BOTH');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'SMS', 'EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "VideoWalkthroughStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdminActionType" AS ENUM ('APPROVE_VIDEO_WALKTHROUGH', 'REJECT_VIDEO_WALKTHROUGH', 'SUSPEND_AGENT', 'REINSTATE_AGENT', 'FLAG_LISTING', 'UNFLAG_LISTING', 'DISMISS_REVIEW', 'RESOLVE_COMPLAINT', 'FORCE_HIDE_LISTING', 'APPROVE_AGENT_VERIFICATION');

-- CreateEnum
CREATE TYPE "CredibilityTier" AS ENUM ('UNRATED', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "passwordHash" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" TIMESTAMP(3),
    "suspendedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cacNumber" TEXT,
    "agencyName" TEXT,
    "primaryCity" TEXT NOT NULL,
    "servedCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "profilePhoto" TEXT,
    "reputationScore" INTEGER NOT NULL DEFAULT 500,
    "credibilityScore" INTEGER NOT NULL DEFAULT 0,
    "credibilityTier" "CredibilityTier" NOT NULL DEFAULT 'UNRATED',
    "credibilityUpdatedAt" TIMESTAMP(3),
    "scoreReviewAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoreReconfirmationRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "scoreResponseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoreComplaintsCount" INTEGER NOT NULL DEFAULT 0,
    "scoreAccountAgeDays" INTEGER NOT NULL DEFAULT 0,
    "totalInspectionRequests" INTEGER NOT NULL DEFAULT 0,
    "respondedInspections" INTEGER NOT NULL DEFAULT 0,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'STARTER',
    "subscriptionExpiresAt" TIMESTAMP(3),
    "isVerifiedBadge" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_bank_accounts" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "paystackRecipientCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "addressLine" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "rentPerYear" BIGINT NOT NULL,
    "inspectionFee" BIGINT NOT NULL,
    "photos" TEXT[],
    "photoHashes" TEXT[],
    "status" "ListingStatus" NOT NULL DEFAULT 'AVAILABLE',
    "tier" "ListingTier" NOT NULL DEFAULT 'BASIC',
    "isCrossPostFlagged" BOOLEAN NOT NULL DEFAULT false,
    "isAdminFlagged" BOOLEAN NOT NULL DEFAULT false,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "lastReconfirmedAt" TIMESTAMP(3),
    "nextReconfirmationDue" TIMESTAMP(3),
    "reconfirmationMissedCount" INTEGER NOT NULL DEFAULT 0,
    "hiddenAt" TIMESTAMP(3),
    "pendingReconfirmationAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "inspectionFeeId" TEXT,
    "inspectionId" TEXT,
    "reviewerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flaggedReason" TEXT,
    "flaggedAt" TIMESTAMP(3),
    "flaggedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_posting_flags" (
    "id" TEXT NOT NULL,
    "listingAId" TEXT NOT NULL,
    "listingBId" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "detectionMethod" "DetectionMethod" NOT NULL,
    "status" "CrossPostStatus" NOT NULL DEFAULT 'OPEN',
    "mandateAUrl" TEXT,
    "mandateBUrl" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cross_posting_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reputation_logs" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconfirmation_records" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "wasOnTime" BOOLEAN NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'AGENT_ACTION',
    "agentId" TEXT NOT NULL,

    CONSTRAINT "reconfirmation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_walkthroughs" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "status" "VideoWalkthroughStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_walkthroughs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "area_price_indices" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "medianRentPerYear" BIGINT NOT NULL,
    "p25RentPerYear" BIGINT NOT NULL,
    "p75RentPerYear" BIGINT NOT NULL,
    "minRentPerYear" BIGINT NOT NULL,
    "maxRentPerYear" BIGINT NOT NULL,
    "listingCount" INTEGER NOT NULL,
    "agentCount" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isDominatedMarket" BOOLEAN NOT NULL DEFAULT false,
    "dataQualityFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trendDirection" TEXT,
    "priceChangePercent" DOUBLE PRECISION,
    "previousMedianRentPerYear" BIGINT,
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "nextCalculationDue" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "area_price_indices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'REQUESTED',
    "proposedDate" TIMESTAMP(3),
    "confirmedDate" TIMESTAMP(3),
    "inspectionFeeKobo" BIGINT NOT NULL,
    "feePaidAt" TIMESTAMP(3),
    "feeRefundedAt" TIMESTAMP(3),
    "notes" TEXT,
    "agentNotes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "actionType" "AdminActionType" NOT NULL,
    "targetListingId" TEXT,
    "targetAgentId" TEXT,
    "targetReviewId" TEXT,
    "targetComplaintId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "complainantId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "listingId" TEXT,
    "inspectionId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credibility_logs" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "componentKey" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "oldScore" INTEGER NOT NULL,
    "newScore" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credibility_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_userId_key" ON "agent_profiles"("userId");

-- CreateIndex
CREATE INDEX "agent_profiles_userId_idx" ON "agent_profiles"("userId");

-- CreateIndex
CREATE INDEX "agent_profiles_primaryCity_idx" ON "agent_profiles"("primaryCity");

-- CreateIndex
CREATE INDEX "agent_profiles_credibilityScore_idx" ON "agent_profiles"("credibilityScore");

-- CreateIndex
CREATE INDEX "agent_profiles_credibilityTier_idx" ON "agent_profiles"("credibilityTier");

-- CreateIndex
CREATE INDEX "agent_profiles_primaryCity_credibilityTier_idx" ON "agent_profiles"("primaryCity", "credibilityTier");

-- CreateIndex
CREATE INDEX "agent_bank_accounts_agentId_idx" ON "agent_bank_accounts"("agentId");

-- CreateIndex
CREATE INDEX "listings_city_idx" ON "listings"("city");

-- CreateIndex
CREATE INDEX "listings_area_idx" ON "listings"("area");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_agentId_idx" ON "listings"("agentId");

-- CreateIndex
CREATE INDEX "listings_propertyType_idx" ON "listings"("propertyType");

-- CreateIndex
CREATE INDEX "listings_tier_idx" ON "listings"("tier");

-- CreateIndex
CREATE INDEX "listings_city_tier_status_idx" ON "listings"("city", "tier", "status");

-- CreateIndex
CREATE INDEX "listings_area_tier_status_idx" ON "listings"("area", "tier", "status");

-- CreateIndex
CREATE INDEX "listings_nextReconfirmationDue_idx" ON "listings"("nextReconfirmationDue");

-- CreateIndex
CREATE INDEX "listings_agentId_status_idx" ON "listings"("agentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_inspectionId_key" ON "reviews"("inspectionId");

-- CreateIndex
CREATE INDEX "reviews_agentId_idx" ON "reviews"("agentId");

-- CreateIndex
CREATE INDEX "reviews_listingId_idx" ON "reviews"("listingId");

-- CreateIndex
CREATE INDEX "cross_posting_flags_listingAId_idx" ON "cross_posting_flags"("listingAId");

-- CreateIndex
CREATE INDEX "cross_posting_flags_listingBId_idx" ON "cross_posting_flags"("listingBId");

-- CreateIndex
CREATE INDEX "cross_posting_flags_status_idx" ON "cross_posting_flags"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "reputation_logs_agentId_idx" ON "reputation_logs"("agentId");

-- CreateIndex
CREATE INDEX "reconfirmation_records_listingId_idx" ON "reconfirmation_records"("listingId");

-- CreateIndex
CREATE INDEX "reconfirmation_records_agentId_idx" ON "reconfirmation_records"("agentId");

-- CreateIndex
CREATE INDEX "reconfirmation_records_confirmedAt_idx" ON "reconfirmation_records"("confirmedAt");

-- CreateIndex
CREATE UNIQUE INDEX "video_walkthroughs_listingId_key" ON "video_walkthroughs"("listingId");

-- CreateIndex
CREATE INDEX "video_walkthroughs_status_idx" ON "video_walkthroughs"("status");

-- CreateIndex
CREATE INDEX "area_price_indices_city_area_idx" ON "area_price_indices"("city", "area");

-- CreateIndex
CREATE INDEX "area_price_indices_city_propertyType_idx" ON "area_price_indices"("city", "propertyType");

-- CreateIndex
CREATE INDEX "area_price_indices_isPublished_idx" ON "area_price_indices"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "area_price_indices_city_area_propertyType_bedrooms_key" ON "area_price_indices"("city", "area", "propertyType", "bedrooms");

-- CreateIndex
CREATE INDEX "inspections_listingId_idx" ON "inspections"("listingId");

-- CreateIndex
CREATE INDEX "inspections_clientId_idx" ON "inspections"("clientId");

-- CreateIndex
CREATE INDEX "inspections_agentId_idx" ON "inspections"("agentId");

-- CreateIndex
CREATE INDEX "inspections_status_idx" ON "inspections"("status");

-- CreateIndex
CREATE INDEX "inspections_requestedAt_idx" ON "inspections"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "admin_actions_targetReviewId_key" ON "admin_actions"("targetReviewId");

-- CreateIndex
CREATE INDEX "admin_actions_adminId_idx" ON "admin_actions"("adminId");

-- CreateIndex
CREATE INDEX "admin_actions_targetAgentId_idx" ON "admin_actions"("targetAgentId");

-- CreateIndex
CREATE INDEX "admin_actions_targetListingId_idx" ON "admin_actions"("targetListingId");

-- CreateIndex
CREATE INDEX "admin_actions_actionType_idx" ON "admin_actions"("actionType");

-- CreateIndex
CREATE INDEX "admin_actions_createdAt_idx" ON "admin_actions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_inspectionId_key" ON "complaints"("inspectionId");

-- CreateIndex
CREATE INDEX "complaints_agentId_idx" ON "complaints"("agentId");

-- CreateIndex
CREATE INDEX "complaints_complainantId_idx" ON "complaints"("complainantId");

-- CreateIndex
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

-- CreateIndex
CREATE INDEX "credibility_logs_agentId_idx" ON "credibility_logs"("agentId");

-- CreateIndex
CREATE INDEX "credibility_logs_createdAt_idx" ON "credibility_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_bank_accounts" ADD CONSTRAINT "agent_bank_accounts_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cross_posting_flags" ADD CONSTRAINT "cross_posting_flags_listingAId_fkey" FOREIGN KEY ("listingAId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cross_posting_flags" ADD CONSTRAINT "cross_posting_flags_listingBId_fkey" FOREIGN KEY ("listingBId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reputation_logs" ADD CONSTRAINT "reputation_logs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconfirmation_records" ADD CONSTRAINT "reconfirmation_records_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_walkthroughs" ADD CONSTRAINT "video_walkthroughs_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_targetListingId_fkey" FOREIGN KEY ("targetListingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_targetAgentId_fkey" FOREIGN KEY ("targetAgentId") REFERENCES "agent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_targetReviewId_fkey" FOREIGN KEY ("targetReviewId") REFERENCES "reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_targetComplaintId_fkey" FOREIGN KEY ("targetComplaintId") REFERENCES "complaints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_complainantId_fkey" FOREIGN KEY ("complainantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credibility_logs" ADD CONSTRAINT "credibility_logs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
