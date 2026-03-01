export type Role = 'AGENT' | 'CLIENT' | 'ADMIN';

export type SubscriptionTier = 'STARTER' | 'PROFESSIONAL' | 'AGENCY';

export type PropertyType = 'FLAT' | 'DUPLEX' | 'ROOM' | 'BUNGALOW' | 'TERRACED';

export type ListingStatus =
  | 'AVAILABLE'
  | 'PENDING_RECONFIRMATION'
  | 'HIDDEN'
  | 'PAUSED'
  | 'RENTED'
  | 'DELETED';

export type ListingTier = 'BASIC' | 'VERIFIED';

export type CrossPostStatus =
  | 'OPEN'
  | 'AGENT_A_WINS'
  | 'AGENT_B_WINS'
  | 'BOTH_PAUSED'
  | 'DISMISSED';

export type DetectionMethod = 'ADDRESS_MATCH' | 'PHOTO_HASH' | 'BOTH';

export type NotificationChannel = 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP';

export type InspectionStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type VideoWalkthroughStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type AdminActionType =
  | 'APPROVE_VIDEO_WALKTHROUGH'
  | 'REJECT_VIDEO_WALKTHROUGH'
  | 'SUSPEND_AGENT'
  | 'REINSTATE_AGENT'
  | 'FLAG_LISTING'
  | 'UNFLAG_LISTING'
  | 'DISMISS_REVIEW'
  | 'RESOLVE_COMPLAINT'
  | 'FORCE_HIDE_LISTING'
  | 'APPROVE_AGENT_VERIFICATION';

export type CredibilityTier = 'UNRATED' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type ComplaintStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface JWTPayload {
  sub: string; // user id
  phone: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Legacy reputation events (kept for backward compat)
export type ReputationEvent =
  | 'review_5_star'
  | 'review_4_star'
  | 'review_3_star'
  | 'review_2_star'
  | 'review_1_star'
  | 'cross_post_violation';

// SureLeads credibility events
export type CredibilityEvent =
  | 'review_submitted'
  | 'reconfirmation_on_time'
  | 'reconfirmation_missed'
  | 'inspection_responded'
  | 'inspection_no_show'
  | 'complaint_opened'
  | 'complaint_resolved_against'
  | 'complaint_dismissed'
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'badge_verified'
  | 'weekly_account_age_update'
  | 'cross_post_violation';

export type ReconfirmationMethod = 'AGENT_ACTION' | 'AUTO_MISSED';

export type ComplaintCategory = 'NO_SHOW' | 'MISREPRESENTATION' | 'FRAUD' | 'OTHER';

// ─── Credibility Score Breakdown ──────────────────────────────────────────────

export interface CredibilityBreakdown {
  total: number;
  tier: CredibilityTier;
  components: {
    reviewScore: number;         // max 350
    reconfirmationScore: number; // max 250
    responseScore: number;       // max 200
    complaintPenalty: number;    // negative, floor -150
    accountScore: number;        // max 50
    subscriptionBonus: number;   // 0 | 25 | 50
  };
}

// ─── Price Insight Response ───────────────────────────────────────────────────

export interface PriceInsightResult {
  available: true;
  city: string;
  area: string;
  propertyType: PropertyType;
  bedrooms: number;
  medianRentPerYear: number;
  p25RentPerYear: number;
  p75RentPerYear: number;
  minRentPerYear: number;
  maxRentPerYear: number;
  listingCount: number;
  confidenceScore: number;
  calculatedAt: string;
}

export interface PriceInsightUnavailable {
  available: false;
  reason: 'insufficient_data' | 'area_not_found' | 'auth_required';
}

export type PriceInsightResponse = PriceInsightResult | PriceInsightUnavailable;
