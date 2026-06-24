import { api } from "@/lib/api";
import type { ApiResponse, Product, ProductWritePayload } from "@/types";

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item)).filter(Boolean);
}

function mapSpecifications(raw: unknown): Product["specifications"] {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    metal: o.metal != null ? String(o.metal) : undefined,
    approxWeight: o.approxWeight != null ? String(o.approxWeight) : undefined,
    diamondCarat: o.diamondCarat != null ? String(o.diamondCarat) : undefined,
    dimensions: o.dimensions != null ? String(o.dimensions) : undefined,
  };
}

function mapPriceBreakup(
  raw: unknown,
): Product["price_breakup"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const num = (v: unknown) =>
    v == null || v === "" ? undefined : Number(v as number | string);
  return {
    gold: num(o.gold),
    gemstone: num(o.gemstone),
    makingCharge: num(o.makingCharge ?? o.making),
    gst: num(o.gst),
    total: num(o.total),
  };
}

function mapProductRow(row: Record<string, unknown>): Product {
  const categoryName =
    typeof row.category === "object" && row.category && "name" in row.category
      ? String((row.category as { name?: string }).name ?? "Uncategorized")
      : "Uncategorized";
  const boutiqueName =
    typeof row.boutique === "object" && row.boutique && "name" in row.boutique
      ? String((row.boutique as { name?: string }).name ?? "Unknown boutique")
      : "Unknown boutique";

  const relationImages = Array.isArray(row.product_images)
    ? [...row.product_images]
        .map((item, index) =>
          typeof item === "object" && item
            ? {
                id: String((item as { id?: string }).id ?? ""),
                image_url: String(
                  (item as { image_url?: string }).image_url ?? "",
                ),
                is_primary: Boolean(
                  (item as { is_primary?: boolean }).is_primary,
                ),
                sort_order: Number(
                  (item as { sort_order?: number }).sort_order ?? index,
                ),
              }
            : null,
        )
        .filter(
          (
            item,
          ): item is {
            id: string;
            image_url: string;
            is_primary: boolean;
            sort_order: number;
          } => Boolean(item?.image_url),
        )
        .sort((a, b) => a.sort_order - b.sort_order)
    : [];

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    status:
      row.status === "draft" ||
      row.status === "archived" ||
      row.status === "active" ||
      row.status === "ACTIVE" ||
      row.status === "FLAGGED" ||
      row.status === "SUSPENDED" ||
      row.status === "PENDING_CORRECTION" ||
      row.status === "DRAFT" ||
      row.status === "ARCHIVED"
        ? (row.status as Product["status"])
        : "ACTIVE",
    category: categoryName,
    category_name: categoryName,
    category_id: typeof row.category_id === "string" ? row.category_id : null,
    boutique_id: typeof row.boutique_id === "string" ? row.boutique_id : null,
    primary_boutique_id:
      typeof row.primary_boutique_id === "string"
        ? row.primary_boutique_id
        : typeof row.boutique_id === "string"
          ? row.boutique_id
          : null,
    boutique_name: boutiqueName,
    price: Number(row.price ?? 0),
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date().toISOString(),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
    image:
      typeof row.thumbnail_image === "string"
        ? row.thumbnail_image
        : typeof row.primary_image === "string"
          ? row.primary_image
          : typeof row.image === "string"
            ? row.image
            : null,
    thumbnail_image:
      typeof row.thumbnail_image === "string" ? row.thumbnail_image : null,
    primary_image:
      typeof row.primary_image === "string" ? row.primary_image : null,
    video_url: typeof row.video_url === "string" ? row.video_url : null,
    video_thumbnail:
      typeof row.video_thumbnail === "string" ? row.video_thumbnail : null,
    description: typeof row.description === "string" ? row.description : null,
    is_trending: Boolean(row.is_trending ?? row.trending),
    trending: Boolean(row.trending ?? row.is_trending),
    images: Array.isArray(row.images) ? row.images.map(String) : [],
    gallery_images: Array.isArray(row.gallery_images)
      ? row.gallery_images.map(String)
      : [],
    product_images: relationImages,
    rating: typeof row.rating === "number" ? row.rating : null,
    reviews_count: (() => {
      if (typeof row.reviews_count === "number") {
        return Number.isFinite(row.reviews_count) ? row.reviews_count : 0;
      }
      const n = Number(row.reviews_count ?? 0);
      return Number.isFinite(n) ? n : 0;
    })(),
    discount_percentage:
      row.discount_percentage == null ||
      row.discount_percentage === ""
        ? null
        : Number(row.discount_percentage),
    available_sizes: asStringArray(row.available_sizes),
    available_metals: asStringArray(row.available_metals),
    specifications: mapSpecifications(row.specifications),
    price_breakup: mapPriceBreakup(row.price_breakup),
    gender: typeof row.gender === "string" ? row.gender : null,
    occasion: typeof row.occasion === "string" ? row.occasion : null,
    style: typeof row.style === "string" ? row.style : null,
    collection_name:
      typeof row.collection_name === "string" ? row.collection_name : null,
    owner_jeweller_id:
      typeof row.owner_jeweller_id === "string" ? row.owner_jeweller_id : null,
    last_admin_action_at:
      typeof row.last_admin_action_at === "string" ? row.last_admin_action_at : null,
  };
}

export async function listProducts(params?: { q?: string; status?: string }) {
  const { data } = await api.get<ApiResponse<Array<Record<string, unknown>>>>(
    "/products",
    { params: { ...params, include_inactive: true } },
  );
  return (data.data ?? []).map(mapProductRow) satisfies Product[];
}

export async function getProductById(id: string) {
  const { data } = await api.get<ApiResponse<Record<string, unknown>>>(
    `/products/${id}`,
  );
  return mapProductRow(data.data ?? {});
}

export async function createProduct(payload: ProductWritePayload) {
  const { data } = await api.post<ApiResponse<Product>>("/products", payload);
  return data.data;
}

export async function updateProduct(id: string, payload: ProductWritePayload) {
  const { data } = await api.put<ApiResponse<Product>>(
    `/products/${id}`,
    payload,
  );
  return data.data;
}

export async function setProductCustomerVisibility(
  id: string,
  product: Product,
  visible: boolean,
) {
  const payload: ProductWritePayload = {
    name: product.name,
    price: product.price,
    status: visible ? "active" : "archived",
  };

  if (product.category_id != null) {
    payload.category_id = product.category_id;
  }
  if (product.boutique_id != null) {
    payload.boutique_id = product.boutique_id;
  }
  if (product.description != null) {
    payload.description = product.description;
  }
  if (product.image != null) {
    payload.image = product.image;
  }

  return updateProduct(id, payload);
}

export async function deleteProduct(id: string) {
  const { data } = await api.delete<ApiResponse<{ id: string }>>(
    `/products/${id}`,
  );
  return data.data;
}

interface UploadOptions {
  productId?: string;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

export async function uploadProductImage(file: File, options?: UploadOptions) {
  const formData = new FormData();
  formData.append("file", file);
  if (options?.productId) {
    formData.append("productId", options.productId);
  }
  const { data } = await api.post<
    ApiResponse<{
      url: string;
      path: string;
      size: number;
      mime: string;
    }>
  >("/uploads/product-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 300000,
    signal: options?.signal,
    onUploadProgress: (event) => {
      if (!event.total || !options?.onProgress) return;
      const progress = Math.min(
        100,
        Math.round((event.loaded * 100) / event.total),
      );
      options.onProgress(progress);
    },
  });
  return data.data;
}

export async function uploadProductVideo(file: File, options?: UploadOptions) {
  const formData = new FormData();
  formData.append("file", file);
  if (options?.productId) {
    formData.append("productId", options.productId);
  }
  const { data } = await api.post<
    ApiResponse<{
      url: string;
      path: string;
      size: number;
      mime: string;
    }>
  >("/uploads/product-video", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 300000,
    signal: options?.signal,
    onUploadProgress: (event) => {
      if (!event.total || !options?.onProgress) return;
      const progress = Math.min(
        100,
        Math.round((event.loaded * 100) / event.total),
      );
      options.onProgress(progress);
    },
  });
  return data.data;
}
