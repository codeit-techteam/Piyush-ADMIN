export type AnalyticsPreset = "today" | "7d" | "30d" | "custom";
export type DashboardLayer = "platform" | "boutique" | "customer";
export type ChartTrend = "up" | "down" | "flat";

export interface DateRangeQuery {
  range?: AnalyticsPreset;
  from?: string;
  to?: string;
  boutiqueId?: string;
}

export interface ChartPoint {
  date: string;
  value: number;
  previousValue?: number;
  difference?: number;
  growthPercent?: number;
  trend?: ChartTrend;
}

export type AnalyticsSeriesPoint = ChartPoint;

export interface ProductTrend {
  productId: string;
  productName: string;
  views: number;
  percentage: number;
  boutiqueId: string;
  boutiqueName: string;
  image?: string | null;
  price?: number | null;
}

export interface ProductPercentage {
  id: string;
  label: string;
  count: number;
  percentage: number;
  image?: string | null;
  growthPercent?: number;
  boutiqueId?: string;
  boutiqueName?: string;
}

export interface RankedItem {
  id: string;
  label: string;
  count: number;
  percentage?: number;
  meta?: {
    lastSearchDate?: string;
    [key: string]: unknown;
  };
}

export interface CustomerInsightProduct {
  productId: string;
  productName: string;
  views?: number;
  percentage?: number;
  boutiqueId?: string;
  boutiqueName?: string;
  image?: string | null;
  price?: number | null;
}

export interface CustomerInsightBoutique {
  boutiqueId: string;
  boutiqueName: string;
  views: number;
  percentage?: number;
}

export interface SearchKeywordDrilldownResponse {
  keyword: string;
  searchCount: number;
  range: { from: string; to: string; preset: string };
  relatedProducts: CustomerInsightProduct[];
  topViewedProducts: CustomerInsightProduct[];
  topBoutiques: CustomerInsightBoutique[];
}

export interface CategoryDetailDrilldownResponse {
  category: string;
  views: number;
  wishlistCount: number;
  range: { from: string; to: string; preset: string };
  topProducts: CustomerInsightProduct[];
  topBoutiques: CustomerInsightBoutique[];
}

export interface CustomerInsightDrilldownQuery extends DateRangeQuery {
  keyword?: string;
  category?: string;
}

export interface BoutiquePendingStep {
  key: string;
  label: string;
  status: "pending" | "completed";
  priority: "high" | "medium" | "low";
}

export interface BoutiquePendingAction {
  boutiqueId: string;
  boutiqueName: string;
  gstUploaded: boolean;
  panUploaded: boolean;
  hallmarkUploaded: boolean;
  productsUploaded: number;
  requiredProducts: number;
  storeStatus: string;
  verificationStatus: string;
  hasPendingActions: boolean;
  pendingSteps: BoutiquePendingStep[];
}

export interface ProductDrilldownResponse {
  date: string;
  boutiqueId: string;
  boutiqueName: string;
  totalViews: number;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: ProductTrend[];
  topInsight: {
    productName: string;
    percentage: number;
    views: number;
    recommendedAction: string;
  } | null;
}

export interface CustomerAnalytics {
  range: { from: string; to: string; preset: string };
  cards: {
    totalCustomers: number;
    newUsers: number;
    wishlistActivity: number;
  };
  charts: {
    userActivityTimeline: ChartPoint[];
    wishlistGrowth: ChartPoint[];
  };
  sections: {
    topSearchKeywords: RankedItem[];
    mostViewedCategories?: RankedItem[];
  };
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
    userGrowth: ChartPoint[];
    boutiqueApprovalTrends: ChartPoint[];
    productUploadTrends: ChartPoint[];
    appointmentTrends: ChartPoint[];
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
    productViewTrends: ChartPoint[];
    appointmentTrends: ChartPoint[];
    revenueAnalytics: ChartPoint[];
    customerEngagement: ChartPoint[];
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

export interface DrilldownQuery {
  boutiqueId: string;
  date: string;
  page?: number;
  limit?: number;
  sort?: "viewsDesc" | "viewsAsc";
}
