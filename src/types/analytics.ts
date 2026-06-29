export type AnalyticsPreset = "today" | "7d" | "30d" | "custom";
export type DashboardLayer = "platform" | "boutique" | "customer";

export interface DateRangeQuery {
  range?: AnalyticsPreset;
  from?: string;
  to?: string;
  boutiqueId?: string;
}

export interface AnalyticsSeriesPoint {
  date: string;
  value: number;
}

export interface RankedItem {
  id: string;
  label: string;
  count: number;
  meta?: Record<string, unknown>;
}

export interface PlatformAnalytics {
  range: { from: string; to: string; preset: string };
  cards: {
    totalUsers: number;
    totalBoutiques: number;
    approvedBoutiques: number;
    pendingBoutiques: number;
    totalProducts: number;
    newUsers: number;
    totalAppointments: number;
  };
  charts: {
    userGrowth: AnalyticsSeriesPoint[];
    boutiqueApprovalTrends: AnalyticsSeriesPoint[];
    productUploadTrends: AnalyticsSeriesPoint[];
    appointmentTrends: AnalyticsSeriesPoint[];
  };
  sections: {
    topPerformingBoutiques: Array<{
      id: string;
      name: string;
      appointments: number;
      location?: string | null;
    }>;
    latestRegisteredBoutiques: Array<Record<string, unknown>>;
  };
}

export interface BoutiqueAnalytics {
  range: { from: string; to: string; preset: string };
  boutiqueId: string;
  cards: {
    totalProducts: number;
    totalCollectionViews: number;
    totalWishlistSaves: number;
    appointmentBookings: number;
    revenueGenerated: number;
    conversionRate: number;
    profileVisits: number;
    callClicks: number;
    whatsappClicks: number;
  };
  charts: {
    productViewTrends: AnalyticsSeriesPoint[];
    appointmentTrends: AnalyticsSeriesPoint[];
    revenueAnalytics: AnalyticsSeriesPoint[];
    customerEngagement: AnalyticsSeriesPoint[];
  };
  sections: {
    topPerformingProducts: RankedItem[];
    lowPerformingProducts: RankedItem[];
    recentlyAddedProducts: Array<Record<string, unknown>>;
    mostBookedCollections: RankedItem[];
    trafficSources: RankedItem[];
  };
  aiInsightsReady: boolean;
}

export interface CustomerAnalytics {
  range: { from: string; to: string; preset: string };
  cards: {
    totalCustomers: number;
    newUsers: number;
    wishlistActivity: number;
    searchTrends: number;
    recentlyViewedCount: number;
  };
  charts: {
    userActivityTimeline: AnalyticsSeriesPoint[];
    searchAnalytics: AnalyticsSeriesPoint[];
    wishlistGrowth: AnalyticsSeriesPoint[];
  };
  sections: {
    topSearchKeywords: RankedItem[];
    mostViewedCategories: RankedItem[];
  };
}

export interface BoutiqueAnalyticsOption {
  id: string;
  name: string;
  location?: string | null;
  status?: string;
  verified?: boolean;
}

export interface BoutiqueOverviewStat {
  boutiqueId: string;
  name: string;
  count: number;
}

export interface BoutiqueOverviewStats {
  range: { from: string; to: string; preset: string };
  cards: {
    mostViewed: BoutiqueOverviewStat | null;
    mostAppointments: BoutiqueOverviewStat | null;
    maxProducts: BoutiqueOverviewStat | null;
  };
}
