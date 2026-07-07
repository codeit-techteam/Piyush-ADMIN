import type {
  NotificationRulePriority,
  NotificationRuleType,
  NotificationStyle,
  NotificationTargetType,
  TargetAudienceConfig,
  TargetAudienceMode,
} from "@/lib/api/services/notification-rules";

export const RULE_TYPE_LABELS: Record<NotificationRuleType, string> = {
  new_product: "New Product Launch",
  price_drop: "Price Drop Alert",
  new_collection: "New Collection Alert",
  nearby_boutique: "Nearby Boutique Joined",
  trending_product: "Trending Product Alert",
  festival_campaign: "Festival Campaign",
  wishlist_reminder: "Wishlist Reminder",
  appointment_reminder: "Appointment Reminder",
  recently_viewed_reminder: "Recently Viewed Reminder",
  boutique_recommendation: "Boutique Recommendation",
};

export const RULE_TYPES: NotificationRuleType[] = [
  "new_product",
  "price_drop",
  "new_collection",
  "nearby_boutique",
  "trending_product",
  "festival_campaign",
  "wishlist_reminder",
  "appointment_reminder",
  "recently_viewed_reminder",
  "boutique_recommendation",
];

export const AUDIENCE_MODE_LABELS: Record<TargetAudienceMode, string> = {
  all: "All Customers",
  selected: "Selected Customers",
  city: "City",
  boutique_followers: "Boutique Followers",
  wishlist_users: "Wishlist Users",
  category_interested: "Category Interested Users",
  keyword_interested: "Keyword Interested Users",
};

export const AUDIENCE_MODES: TargetAudienceMode[] = [
  "all",
  "selected",
  "city",
  "boutique_followers",
  "wishlist_users",
  "category_interested",
  "keyword_interested",
];

export const PRIORITY_LABELS: Record<NotificationRulePriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const PRIORITIES: NotificationRulePriority[] = ["low", "medium", "high"];

export const TARGET_TYPE_LABELS: Record<NotificationTargetType, string> = {
  none: "None",
  product: "Product",
  collection: "Collection",
  boutique: "Boutique",
  category: "Category",
  url: "External URL",
};

export const TARGET_TYPES: NotificationTargetType[] = [
  "none",
  "product",
  "collection",
  "boutique",
  "category",
  "url",
];

export const NOTIFICATION_STYLE_LABELS: Record<NotificationStyle, string> = {
  default: "Default",
  large_image: "Large Image (Marketplace)",
  banner: "Full Banner",
};

export const NOTIFICATION_STYLES: NotificationStyle[] = ["default", "large_image", "banner"];

/** Suggested CTA copy per target type — admin can still type any custom text. */
export const CTA_TEXT_SUGGESTIONS: Record<NotificationTargetType, string[]> = {
  none: [],
  product: ["Buy Now", "View Product", "Shop Now"],
  collection: ["Explore Collection", "Shop Collection", "View Collection"],
  boutique: ["Explore Boutique", "View Boutique", "Visit Boutique"],
  category: ["Explore", "Shop Now", "View All"],
  url: ["View Offer", "Learn More", "Contact Jeweller"],
};

/**
 * Client-side preview of the deep link the backend will auto-generate for a
 * given target — shown read-only in the form before saving. The backend
 * (`buildDeepLink` in notificationTargets.js) is the source of truth.
 */
export function buildDeepLinkPreview(targetType: NotificationTargetType, targetId: string | null): string | null {
  if (!targetId) return null;
  switch (targetType) {
    case "product":
      return `/products/${targetId}`;
    case "collection":
      return `/collections/${targetId}`;
    case "boutique":
      return `/boutiques/${targetId}`;
    case "category":
      return `/category/${targetId}`;
    case "url":
      return targetId;
    default:
      return null;
  }
}

export function describeTargetAudience(audience: TargetAudienceConfig | undefined | null): string {
  if (!audience) return AUDIENCE_MODE_LABELS.all;
  switch (audience.mode) {
    case "selected":
      return `${audience.selectedUserIds?.length ?? 0} selected customer(s)`;
    case "city":
      return audience.city ? `City: ${audience.city}` : "City (not set)";
    case "boutique_followers":
      return "Boutique Followers";
    case "wishlist_users":
      return "Wishlist Users";
    case "category_interested":
      return "Category Interested Users";
    case "keyword_interested":
      return audience.keyword ? `Keyword: "${audience.keyword}"` : "Keyword Interested Users";
    case "all":
    default:
      return AUDIENCE_MODE_LABELS.all;
  }
}
