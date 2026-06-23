import { api } from "@/lib/api";
import type { ApiResponse } from "@/types";

/**
 * Shared types for every CMS / dynamic-content section managed from the
 * Admin Panel. The backend returns slightly different shapes per table
 * but they share a common subset, so we model the union here.
 */
export interface CmsLinkedProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
  status: "active" | "draft" | "archived" | string;
  is_trending?: boolean;
  discount_percentage?: number | null;
  sort_order?: number;
}

export interface CmsBase {
  id: string;
  title?: string;
  name?: string;
  slug?: string | null;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  banner_image?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  products?: CmsLinkedProduct[];
  product_ids?: string[];
}

export interface OccasionRow extends CmsBase {
  title: string;
  collection_slug?: string | null;
}

export interface CollectionRow extends CmsBase {
  title: string;
  is_trending: boolean;
  is_featured: boolean;
}

export interface CategoryRow extends CmsBase {
  name: string;
  category_image_url?: string | null;
}

export interface MenuCategoryRow extends CmsBase {
  title: string;
  icon: string | null;
  badge: string | null;
  collection_slug: string | null;
}

export interface FeaturedSectionRow extends CmsBase {
  title: string;
  layout: string;
}

export interface OfferRow extends CmsBase {
  title: string;
  badge: string | null;
  discount_text: string | null;
  cta_label: string | null;
  cta_target: string | null;
  starts_at: string | null;
  expires_at: string | null;
  collections?: Array<{ id: string; title?: string | null; image?: string | null; slug?: string | null }>;
  collection_ids?: string[];
}

export interface GiftCollectionRow extends CmsBase {
  title: string;
}

export interface RelationshipRow extends CmsBase {
  title: string;
  collection_slug: string | null;
}

export type CmsPayload = Record<string, unknown>;

function endpointFor(section: string) {
  switch (section) {
    case "occasions":
      return "/occasions";
    case "collections":
      return "/collections";
    case "categories":
      return "/categories";
    case "menu":
      return "/menu-categories";
    case "featured":
      return "/featured-sections";
    case "offers":
      return "/offers";
    case "gifts":
      return "/gift-collections";
    case "relationship":
      return "/relationship-sections";
    default:
      throw new Error(`Unknown CMS section: ${section}`);
  }
}

export async function listCmsItems<T = CmsBase>(
  section: string,
  params?: Record<string, string | boolean>,
) {
  const url = endpointFor(section);
  const { data } = await api.get<ApiResponse<T[]>>(url, {
    params: { include_inactive: true, ...(params ?? {}) },
  });
  return (data.data ?? []) as T[];
}

export async function getCmsItem<T = CmsBase>(section: string, id: string) {
  const url = `${endpointFor(section)}/${id}`;
  const { data } = await api.get<ApiResponse<T>>(url);
  return data.data as T;
}

export async function createCmsItem<T = CmsBase>(
  section: string,
  payload: CmsPayload,
) {
  const url = endpointFor(section);
  const { data } = await api.post<ApiResponse<T>>(url, payload);
  return data.data as T;
}

export async function updateCmsItem<T = CmsBase>(
  section: string,
  id: string,
  payload: CmsPayload,
) {
  const url = `${endpointFor(section)}/${id}`;
  const { data } = await api.put<ApiResponse<T>>(url, payload);
  return data.data as T;
}

export async function deleteCmsItem(section: string, id: string) {
  const url = `${endpointFor(section)}/${id}`;
  const { data } = await api.delete<ApiResponse<{ id: string }>>(url);
  return data.data;
}

export async function reorderCmsItems(section: string, items: Array<{ id: string }>) {
  const url = `${endpointFor(section)}/reorder`;
  await api.post<ApiResponse<null>>(url, { items });
}

export interface CmsImageUploadResult {
  url: string;
  path: string;
  size: number;
  mime: string;
  folder: string;
}

export async function uploadCmsImage(
  file: File,
  folder: string,
  onProgress?: (progress: number) => void,
): Promise<CmsImageUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const { data } = await api.post<ApiResponse<CmsImageUploadResult>>(
    "/uploads/cms-image",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
      onUploadProgress: (event) => {
        if (!event.total || !onProgress) return;
        const progress = Math.min(
          100,
          Math.round((event.loaded * 100) / event.total),
        );
        onProgress(progress);
      },
    },
  );
  return data.data;
}

export type DiscoverFeaturedProductRow = CmsLinkedProduct & {
  row_id: string;
  sort_order: number;
  is_active: boolean;
};

export async function listDiscoverFeaturedProducts() {
  const { data } = await api.get<ApiResponse<DiscoverFeaturedProductRow[]>>(
    "/featured-products",
    { params: { include_inactive: "true" } },
  );
  return (data.data ?? []) as DiscoverFeaturedProductRow[];
}

export async function syncDiscoverFeaturedProducts(productIds: string[]) {
  const { data } = await api.put<ApiResponse<DiscoverFeaturedProductRow[]>>(
    "/featured-products/sync",
    { product_ids: productIds },
  );
  return (data.data ?? []) as DiscoverFeaturedProductRow[];
}

export async function reorderDiscoverFeaturedProducts(
  items: Array<{ id: string }>,
) {
  await api.post<ApiResponse<null>>("/featured-products/reorder", { items });
}

export async function updateDiscoverFeaturedRow(
  id: string,
  payload: { is_active?: boolean },
) {
  const { data } = await api.put<ApiResponse<Record<string, unknown>>>(
    `/featured-products/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteDiscoverFeaturedRow(id: string) {
  const { data } = await api.delete<ApiResponse<{ id: string }>>(
    `/featured-products/${id}`,
  );
  return data.data;
}
