import { api } from "@/lib/api";
import type {
  ApiResponse,
  Boutique,
  BoutiqueDetails,
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

export async function deleteBoutique(id: string) {
  const { data } = await api.delete<ApiResponse<{ id: string; status: string; deleted_at: string }>>(
    `/boutiques/${id}`,
  );
  return data.data;
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
