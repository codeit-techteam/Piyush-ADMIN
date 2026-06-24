import { api } from "@/lib/api";
import type {
  ApiResponse,
  Boutique,
  BoutiqueDetails,
  BoutiqueProductSummary,
  PatchBoutiqueAdminPayload,
  UpdateBoutiquePayload,
} from "@/types";

export async function listBoutiques() {
  console.info("[boutiques:debug] Fetching boutiques from", "/boutiques");
  const { data } = await api.get<ApiResponse<Boutique[]>>("/boutiques", { params: { includeAll: "true" } });
  console.info("[boutiques:debug] API response", data);
  return data.data;
}

export async function getBoutiqueDetails(id: string) {
  try {
    const { data } = await api.get<ApiResponse<BoutiqueDetails>>(`/boutiques/${id}/details`);
    return data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const routeMissing =
      message.includes("Route not found") ||
      message.includes("/details") ||
      message.toLowerCase().includes("404");

    if (!routeMissing) {
      throw error;
    }

    const { data } = await api.get<ApiResponse<Record<string, unknown>>>(`/boutiques/${id}`);
    const legacy = data.data;
    return {
      id: String(legacy.id ?? id),
      name: typeof legacy.name === "string" ? legacy.name : "",
      location: typeof legacy.location === "string" ? legacy.location : null,
      rating: typeof legacy.rating === "number" ? legacy.rating : null,
      image: typeof legacy.image === "string" ? legacy.image : null,
      description: typeof legacy.description === "string" ? legacy.description : "",
      address:
        typeof legacy.full_address === "string"
          ? legacy.full_address
          : typeof legacy.address === "string"
            ? legacy.address
            : typeof legacy.location === "string"
              ? legacy.location
              : "",
      full_address:
        typeof legacy.full_address === "string"
          ? legacy.full_address
          : typeof legacy.address === "string"
            ? legacy.address
            : typeof legacy.location === "string"
              ? legacy.location
              : "",
      phone_number:
        typeof legacy.phone_number === "string"
          ? legacy.phone_number
          : typeof legacy.phone === "string"
            ? legacy.phone
            : typeof legacy.contact_number === "string"
              ? legacy.contact_number
              : null,
      whatsapp_number:
        typeof legacy.whatsapp_number === "string"
          ? legacy.whatsapp_number
          : typeof legacy.whatsapp === "string"
            ? legacy.whatsapp
            : null,
      instagram_url:
        typeof legacy.instagram_url === "string"
          ? legacy.instagram_url
          : typeof legacy.instagram === "string"
            ? legacy.instagram
            : null,
      website_url: typeof legacy.website_url === "string" ? legacy.website_url : null,
      logo_url: typeof legacy.logo_url === "string" ? legacy.logo_url : null,
      banner_images: (() => {
        const g = Array.isArray(legacy.gallery_images) ? legacy.gallery_images.map(String) : [];
        const b = Array.isArray(legacy.banner_images) ? legacy.banner_images.map(String) : [];
        return g.length ? g : b;
      })(),
      gallery_images: (() => {
        const g = Array.isArray(legacy.gallery_images) ? legacy.gallery_images.map(String) : [];
        const b = Array.isArray(legacy.banner_images) ? legacy.banner_images.map(String) : [];
        return g.length ? g : b;
      })(),
      opening_time: typeof legacy.opening_time === "string" ? legacy.opening_time : null,
      closing_time: typeof legacy.closing_time === "string" ? legacy.closing_time : null,
      working_days: Array.isArray(legacy.working_days)
        ? legacy.working_days.map(String)
        : [],
      reviews_count:
        typeof legacy.reviews_count === "number"
          ? legacy.reviews_count
          : Number(legacy.reviews_count ?? 0),
      is_active:
        typeof legacy.is_active === "boolean"
          ? legacy.is_active
          : legacy.status !== "inactive",
      is_verified:
        typeof legacy.is_verified === "boolean"
          ? legacy.is_verified
          : Boolean(legacy.verified),
      collections: Array.isArray(legacy.collections)
        ? legacy.collections
            .filter((row): row is { id?: unknown; name?: unknown; slug?: unknown } => Boolean(row))
            .map((row) => ({
              id: String(row.id ?? ""),
              name: String(row.name ?? ""),
              slug: String(row.slug ?? ""),
            }))
        : [],
      linked_product_ids: Array.isArray(legacy.linked_product_ids)
        ? legacy.linked_product_ids.map(String)
        : [],
      phone:
        typeof legacy.phone === "string"
          ? legacy.phone
          : typeof legacy.contact_number === "string"
            ? legacy.contact_number
            : "",
      verified: Boolean(legacy.verified),
      featured: Boolean(legacy.featured),
      status: legacy.status === "inactive" ? "inactive" : "active",
      contact_number:
        typeof legacy.contact_number === "string"
          ? legacy.contact_number
          : typeof legacy.phone === "string"
            ? legacy.phone
            : null,
      whatsapp: typeof legacy.whatsapp === "string" ? legacy.whatsapp : null,
      instagram: typeof legacy.instagram === "string" ? legacy.instagram : null,
      opening_hours: typeof legacy.opening_hours === "string" ? legacy.opening_hours : null,
      created_at: typeof legacy.created_at === "string" ? legacy.created_at : null,
      updated_at: typeof legacy.updated_at === "string" ? legacy.updated_at : null,
      deleted_at: typeof legacy.deleted_at === "string" ? legacy.deleted_at : null,
      verification_status:
        typeof legacy.verification_status === "string"
          ? (legacy.verification_status as BoutiqueDetails["verification_status"])
          : "PENDING",
      admin_note: typeof legacy.admin_note === "string" ? legacy.admin_note : null,
      verification_rejected_reason:
        typeof legacy.verification_rejected_reason === "string"
          ? legacy.verification_rejected_reason
          : null,
      verified_at: typeof legacy.verified_at === "string" ? legacy.verified_at : null,
      is_featured:
        typeof legacy.is_featured === "boolean"
          ? legacy.is_featured
          : Boolean(legacy.featured),
      store_status:
        typeof legacy.store_status === "string"
          ? (legacy.store_status as BoutiqueDetails["store_status"])
          : null,
      is_self_managed: Boolean(legacy.is_self_managed),
      jeweller_user_id:
        typeof legacy.jeweller_user_id === "string" ? legacy.jeweller_user_id : null,
      owner_name: typeof legacy.owner_name === "string" ? legacy.owner_name : null,
      member_id: typeof legacy.member_id === "string" ? legacy.member_id : null,
      is_onboarding_done: Boolean(legacy.is_onboarding_done),
      products_count:
        typeof legacy.products_count === "number" ? legacy.products_count : null,
    } satisfies BoutiqueDetails;
  }
}

export async function updateBoutique(id: string, payload: UpdateBoutiquePayload) {
  const { data } = await api.put<ApiResponse<BoutiqueDetails>>(`/boutiques/${id}`, payload);
  return data.data;
}

export async function patchBoutiqueAdmin(id: string, payload: PatchBoutiqueAdminPayload) {
  const { data } = await api.patch<ApiResponse<BoutiqueDetails>>(`/boutiques/${id}`, payload);
  return data.data;
}

export async function listBoutiqueProducts(id: string, includeAll = true) {
  const params = new URLSearchParams({
    includeAll: includeAll ? "true" : "false",
  });
  const res = await fetch(`/api/admin/boutiques/${id}/products?${params.toString()}`);
  const json = (await res.json()) as ApiResponse<BoutiqueProductSummary[]> & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(json.message ?? "Failed to load boutique products");
  }
  return json.data;
}

export async function deleteBoutique(id: string) {
  const { data } = await api.delete<ApiResponse<{ id: string; status: string; deleted_at: string }>>(
    `/boutiques/${id}`,
  );
  return data.data;
}

function toUpdatePayload(
  boutique: BoutiqueDetails,
  overrides: Partial<UpdateBoutiquePayload>,
): UpdateBoutiquePayload {
  const phone =
    boutique.phone ??
    boutique.phone_number ??
    boutique.contact_number ??
    "0000000000";

  return {
    name: boutique.name,
    description: boutique.description ?? null,
    address: boutique.address ?? null,
    full_address: boutique.full_address ?? boutique.address ?? null,
    phone,
    phone_number: boutique.phone_number ?? boutique.contact_number ?? phone,
    location: boutique.location ?? boutique.address ?? "",
    rating: boutique.rating ?? 0,
    image: boutique.image ?? null,
    logo_url: boutique.logo_url ?? null,
    banner_images: boutique.banner_images,
    gallery_images: boutique.gallery_images,
    verified: boutique.verified ?? boutique.is_verified ?? false,
    is_verified: boutique.is_verified ?? boutique.verified ?? false,
    featured: boutique.featured ?? boutique.is_featured ?? false,
    status: boutique.status ?? "active",
    is_active: boutique.is_active !== false,
    contact_number: boutique.contact_number ?? phone,
    whatsapp: boutique.whatsapp ?? boutique.whatsapp_number ?? "",
    whatsapp_number: boutique.whatsapp_number ?? boutique.whatsapp ?? null,
    instagram: boutique.instagram ?? boutique.instagram_url ?? "",
    instagram_url: boutique.instagram_url ?? boutique.instagram ?? null,
    website_url: boutique.website_url ?? null,
    opening_hours: boutique.opening_hours ?? null,
    opening_time: boutique.opening_time ?? null,
    closing_time: boutique.closing_time ?? null,
    working_days: boutique.working_days,
    store_status: boutique.store_status ?? undefined,
    is_onboarding_done: boutique.is_onboarding_done,
    ...overrides,
  };
}

export async function approveBoutiqueStore(id: string) {
  const boutique = await getBoutiqueDetails(id);
  return updateBoutique(
    id,
    toUpdatePayload(boutique, {
      store_status: "approved",
      is_onboarding_done: true,
      is_active: true,
      status: "active",
      verified: true,
      is_verified: true,
    }),
  );
}

export async function rejectBoutiqueStore(id: string) {
  const boutique = await getBoutiqueDetails(id);
  return updateBoutique(
    id,
    toUpdatePayload(boutique, {
      store_status: "rejected",
    }),
  );
}

export async function suspendBoutiqueStore(id: string) {
  const boutique = await getBoutiqueDetails(id);
  return updateBoutique(
    id,
    toUpdatePayload(boutique, {
      is_active: false,
      status: "inactive",
    }),
  );
}

export async function rereviewBoutiqueStore(id: string) {
  const boutique = await getBoutiqueDetails(id);
  return updateBoutique(
    id,
    toUpdatePayload(boutique, {
      store_status: "review",
    }),
  );
}

export async function notifyBoutiqueJeweller(
  payload: {
    jeweller_user_id: string;
    boutique_id: string;
    event: "approved" | "rejected";
    reason?: string;
  },
) {
  const notifyRes = await fetch("/api/admin/boutique-notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!notifyRes.ok) {
    console.warn("[boutiques] notification insert failed (non-fatal)");
  }
}

export type BoutiqueImageUploadKind = "cover" | "logo" | "gallery";

interface UploadBoutiqueImageOptions {
  boutiqueId: string;
  kind?: BoutiqueImageUploadKind;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

export async function uploadBoutiqueImage(file: File, options: UploadBoutiqueImageOptions) {
  const formData = new FormData();
  formData.append("boutiqueId", options.boutiqueId);
  formData.append("kind", options.kind ?? "gallery");
  formData.append("file", file);
  const { data } = await api.post<
    ApiResponse<{
      url: string;
      path: string;
      size: number;
      mime: string;
    }>
  >("/uploads/boutique-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 300000,
    signal: options.signal,
    onUploadProgress: (event) => {
      if (!event.total || !options.onProgress) return;
      const progress = Math.min(100, Math.round((event.loaded * 100) / event.total));
      options.onProgress(progress);
    },
  });
  return data.data;
}
