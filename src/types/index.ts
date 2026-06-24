export type AdminRole = "super_admin" | "admin" | "editor";

export interface AdminUser {
  id: string;
  email: string;
  fullName?: string;
  role: AdminRole;
  isBlocked?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalBoutiques: number;
  totalProducts: number;
  totalCollections: number;
}

export interface MarketplaceUser {
  id: string;
  name: string;
  phone: string | null;
  profile_image: string | null;
  created_at: string | null;
}

export interface ProductSpecifications {
  metal?: string;
  approxWeight?: string;
  diamondCarat?: string;
  dimensions?: string;
}

export interface ProductPriceBreakupWrite {
  gold?: number | null;
  gemstone?: number | null;
  makingCharge?: number | null;
  gst?: number | null;
  total?: number | null;
}

export interface Product {
  id: string;
  name: string;
  status:
    | "draft"
    | "active"
    | "archived"
    | "ACTIVE"
    | "FLAGGED"
    | "SUSPENDED"
    | "PENDING_CORRECTION"
    | "DRAFT"
    | "ARCHIVED";
  category: string;
  category_name?: string;
  category_id?: string | null;
  boutique_id?: string | null;
  primary_boutique_id?: string | null;
  boutique_name?: string;
  owner_jeweller_id?: string | null;
  last_admin_action_at?: string | null;
  price: number;
  rating?: number | null;
  reviews_count?: number;
  discount_percentage?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  image?: string | null;
  thumbnail_image?: string | null;
  primary_image?: string | null;
  video_url?: string | null;
  video_thumbnail?: string | null;
  description?: string | null;
  is_trending?: boolean;
  trending?: boolean;
  images: string[];
  gallery_images?: string[];
  available_sizes?: string[];
  available_metals?: string[];
  specifications?: ProductSpecifications;
  price_breakup?: ProductPriceBreakupWrite;
  gender?: string | null;
  occasion?: string | null;
  style?: string | null;
  collection_name?: string | null;
  product_images?: Array<{
    id: string;
    image_url: string;
    is_primary?: boolean;
    sort_order?: number;
  }>;
}

export interface ProductWritePayload {
  name: string;
  price: number;
  category_id?: string | null;
  boutique_id?: string | null;
  primary_boutique_id?: string | null;
  image?: string | null;
  thumbnail_image?: string | null;
  primary_image?: string | null;
  video_url?: string | null;
  video_thumbnail?: string | null;
  description?: string | null;
  is_trending?: boolean;
  trending?: boolean;
  status?: "draft" | "active" | "archived";
  images?: string[];
  product_images?: Array<{
    image_url: string;
    is_primary?: boolean;
    sort_order?: number;
  }>;
  rating?: number | null;
  reviews_count?: number;
  discount_percentage?: number | null;
  available_sizes?: string[];
  available_metals?: string[];
  specifications?: ProductSpecifications;
  price_breakup?: ProductPriceBreakupWrite;
  gender?: string | null;
  occasion?: string | null;
  style?: string | null;
  collection_name?: string | null;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export type StoreApprovalStatus = "pending" | "review" | "approved" | "rejected";

export type BoutiqueVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface BusinessDocument {
  id: string;
  boutique_id: string;
  type: string;
  name: string;
  file_url: string;
  license_no: string | null;
  status: string;
  verified_at?: string | null;
  created_at?: string | null;
}

export interface StoreReviewOwnerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  profile_image: string | null;
}

export interface StoreReviewDetails {
  id: string;
  name: string;
  store_status: StoreApprovalStatus | null;
  is_self_managed: boolean;
  jeweller_user_id: string | null;
  owner_name: string | null;
  member_id: string | null;
  store_tagline: string | null;
  contact_number: string | null;
  phone_number: string | null;
  phone: string | null;
  whatsapp: string | null;
  whatsapp_number: string | null;
  email: string | null;
  address: string | null;
  full_address: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  website_url: string | null;
  instagram: string | null;
  instagram_url: string | null;
  opening_time: string | null;
  closing_time: string | null;
  opening_hours: string | null;
  working_days: string[];
  onboarding_step: number | null;
  is_onboarding_done: boolean;
  logo_url: string | null;
  cover_image_url: string | null;
  image: string | null;
  banner_images: string[];
  gallery_images: string[];
  documents: BusinessDocument[];
  ownerProfile: StoreReviewOwnerProfile | null;
  created_at: string | null;
  updated_at: string | null;
  canReview: boolean;
  products_count: number;
  verification_status?: BoutiqueVerificationStatus;
  verification_rejected_reason?: string | null;
}

export interface BoutiqueProductSummary {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category_id: string | null;
  category: { id: string; name: string } | null;
  collection: string | null;
  collection_name: string | null;
  trending: boolean;
  video_url: string | null;
  video_thumbnail: string | null;
  status?: string;
  is_draft?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Boutique {
  id: string;
  name: string;
  location: string | null;
  rating: number | null;
  image: string | null;
  // Jeweller onboarding fields
  store_status: StoreApprovalStatus | null;
  is_self_managed: boolean;
  jeweller_user_id: string | null;
  owner_name: string | null;
  member_id: string | null;
  store_tagline?: string | null;
  cover_image_url?: string | null;
  address?: string | null;
  full_address?: string | null;
  onboarding_step?: number | null;
  is_onboarding_done: boolean;
  contact_number: string | null;
  phone_number?: string | null;
  products_count: number | null;
  created_at?: string | null;
  status?: string;
  is_active?: boolean;
  verified?: boolean;
  is_verified?: boolean;
  featured?: boolean;
  is_featured?: boolean;
  verification_status?: BoutiqueVerificationStatus;
  admin_note?: string | null;
  verification_rejected_reason?: string | null;
  verified_at?: string | null;
  deleted_at?: string | null;
}

export type BoutiqueStatus = "active" | "inactive";

export interface BoutiqueDetails extends Boutique {
  description: string | null;
  address: string | null;
  full_address?: string | null;
  phone: string | null;
  phone_number?: string | null;
  verified: boolean;
  is_verified?: boolean;
  featured: boolean;
  status: BoutiqueStatus;
  contact_number: string | null;
  whatsapp: string | null;
  whatsapp_number?: string | null;
  instagram: string | null;
  instagram_url?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  banner_images?: string[];
  gallery_images?: string[];
  opening_time?: string | null;
  closing_time?: string | null;
  working_days?: string[];
  reviews_count?: number;
  is_active?: boolean;
  collections?: Array<{ id: string; name: string; slug: string }>;
  linked_product_ids?: string[];
  opening_hours: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  verification_status?: BoutiqueVerificationStatus;
  admin_note?: string | null;
  verification_rejected_reason?: string | null;
  verified_at?: string | null;
  is_featured?: boolean;
}

export interface PatchBoutiqueAdminPayload {
  is_verified?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  admin_note?: string | null;
  verification_status?: BoutiqueVerificationStatus;
  verification_rejected_reason?: string | null;
}

export interface UpdateBoutiquePayload {
  name: string;
  slug?: string | null;
  description: string | null;
  address: string | null;
  full_address?: string | null;
  phone: string | null;
  phone_number?: string | null;
  location: string;
  rating: number;
  image: string | null;
  logo_url?: string | null;
  banner_images?: string[];
  gallery_images?: string[];
  verified: boolean;
  is_verified?: boolean;
  featured: boolean;
  is_active?: boolean;
  status: BoutiqueStatus;
  contact_number: string | null;
  whatsapp: string | null;
  whatsapp_number?: string | null;
  instagram: string | null;
  instagram_url?: string | null;
  website_url?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  working_days?: string[];
  reviews_count?: number;
  collections?: Array<{ id?: string; name: string; slug?: string }>;
  linked_product_ids?: string[];
  product_assignments?: Array<{ product_id: string; collection_slug: string }>;
  opening_hours: string | null;
  store_status?: StoreApprovalStatus;
  is_onboarding_done?: boolean;
}

export type CallbackRequestStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "completed"
  | "closed";

export type CallbackTimeSlot = "morning" | "afternoon" | "evening";

export interface AdminCallbackRequest {
  id: string;
  referenceId: string;
  customerId: string | null;
  customerName: string | null;
  mobileNumber: string;
  preferredTimeSlot: CallbackTimeSlot;
  requirement: string;
  status: CallbackRequestStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export type SupportConversationStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "waiting_for_customer"
  | "resolved"
  | "closed";

export interface SupportAgent {
  id: string;
  name: string;
  email: string | null;
  status: "online" | "away" | "offline";
  department: string;
}

export interface AdminSupportConversation {
  id: string;
  customerId: string;
  customerName: string | null;
  ticketNumber: string;
  status: SupportConversationStatus;
  assignedAgentId: string | null;
  assignedAgent: SupportAgent | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSupportMessage {
  id: string;
  conversationId: string;
  senderType: "customer" | "agent" | "system";
  senderId: string | null;
  message: string;
  messageType: string;
  attachmentUrl: string | null;
  metadata: Record<string, unknown>;
  deliveryStatus: "sent" | "delivered" | "read";
  isRead: boolean;
  createdAt: string;
}

export interface SupportDashboardStats {
  openTickets: number;
  pendingReplies: number;
  resolvedTickets: number;
  averageResponseMinutes: number;
}

export interface AdminSupportConversationDetail {
  conversation: AdminSupportConversation;
  messages: AdminSupportMessage[];
}

export type AppointmentStatus = "upcoming" | "completed" | "cancelled";

export type AppointmentBadge = "upcoming" | "past" | "completed" | "cancelled";

export interface AdminAppointment {
  id: string;
  userId: string | null;
  boutiqueId: string | null;
  boutiqueName: string;
  boutiqueSlug: string | null;
  date: string;
  dateIso: string | null;
  time: string;
  status: AppointmentStatus;
  badge: AppointmentBadge;
  customerName: string | null;
  customerPhone: string | null;
  serviceRequested: string | null;
  consultationType?: string;
  notes: string | null;
  userDisplayName: string | null;
  userPhone: string | null;
  startsAt: string | null;
  createdAt: string | null;
}
