-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminActionType" ADD VALUE 'OVERRIDE_CREDIBILITY_SCORE';
ALTER TYPE "AdminActionType" ADD VALUE 'PROMOTE_LISTING_TIER';
ALTER TYPE "AdminActionType" ADD VALUE 'DEMOTE_LISTING_TIER';

-- AlterTable
ALTER TABLE "agent_profiles" ADD COLUMN     "scoreOverriddenAt" TIMESTAMP(3),
ADD COLUMN     "scoreOverriddenBy" TEXT,
ADD COLUMN     "scoreOverride" INTEGER,
ADD COLUMN     "scoreOverrideNote" TEXT;
