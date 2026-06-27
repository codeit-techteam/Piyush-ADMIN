import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isAwaitingAdminReview,
  resolveJewellerDocumentUrlWithClient,
} from "@/lib/jeweller-documents";
import type { BusinessDocument, StoreReviewDetails } from "@/types";

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

type BoutiqueRow = Record<string, unknown>;
type AdminSupabase = SupabaseClient;

async function syncBoutiqueAssetUrls(
  supabase: AdminSupabase,
  boutique: BoutiqueRow,
  supabaseUrl: string,
) {
  const id = String(boutique.id);
  const updates: Record<string, string> = {};

  const logoResolved = resolveJewellerDocumentUrlWithClient(
    supabase,
    typeof boutique.logo_url === "string" ? boutique.logo_url : null,
    supabaseUrl,
  );
  if (logoResolved && logoResolved !== boutique.logo_url) {
    updates.logo_url = logoResolved;
  }

  const coverResolved = resolveJewellerDocumentUrlWithClient(
    supabase,
    typeof boutique.cover_image_url === "string" ? boutique.cover_image_url : null,
    supabaseUrl,
  );
  if (coverResolved && coverResolved !== boutique.cover_image_url) {
    updates.cover_image_url = coverResolved;
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from("boutiques").update(updates).eq("id", id);
    Object.assign(boutique, updates);
  }
}

async function syncBusinessDocumentUrls(
  supabase: AdminSupabase,
  documents: BusinessDocument[],
  supabaseUrl: string,
) {
  for (const doc of documents) {
    const resolved = resolveJewellerDocumentUrlWithClient(
      supabase,
      doc.file_url,
      supabaseUrl,
    );
    if (!resolved || resolved === doc.file_url) continue;

    const { error } = await supabase
      .from("business_documents")
      .update({ file_url: resolved, updated_at: new Date().toISOString() })
      .eq("id", doc.id);

    if (!error) {
      doc.file_url = resolved;
    }
  }
}

function resolveAssetUrl(
  supabase: AdminSupabase,
  value: unknown,
  supabaseUrl: string,
): string | null {
  return resolveJewellerDocumentUrlWithClient(
    supabase,
    typeof value === "string" ? value : null,
    supabaseUrl,
  );
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return NextResponse.json(
      { success: false, message: "Supabase URL not configured" },
      { status: 500 },
    );
  }

  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "Service role key not configured" },
      { status: 500 },
    );
  }

  const { data: boutique, error: boutiqueError } = await supabase
    .from("boutiques")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (boutiqueError) {
    return NextResponse.json(
      { success: false, message: boutiqueError.message },
      { status: 500 },
    );
  }

  if (!boutique) {
    return NextResponse.json(
      { success: false, message: "Store not found" },
      { status: 404 },
    );
  }

  if (!boutique.is_self_managed) {
    return NextResponse.json(
      { success: false, message: "This boutique is not a jeweller-managed store" },
      { status: 400 },
    );
  }

  await syncBoutiqueAssetUrls(supabase, boutique, supabaseUrl);

  const { data: verificationDocRows } = await supabase
    .from("boutique_verification_documents")
    .select("*")
    .eq("boutique_id", id)
    .order("doc_type", { ascending: true });

  let documents: BusinessDocument[] = [];
  let documentsFromBusinessTable = false;

  if (verificationDocRows && verificationDocRows.length > 0) {
    documents = verificationDocRows.map((row) => ({
      id: String(row.id),
      boutique_id: String(row.boutique_id),
      type: String(row.doc_type ?? "").toLowerCase(),
      name: String(row.doc_type ?? "").replace(/_/g, " "),
      file_url:
        resolveJewellerDocumentUrlWithClient(supabase, row.file_url, supabaseUrl) ?? "",
      license_no: null,
      status: String(row.status ?? "pending").toLowerCase(),
      verified_at: row.reviewed_at ? String(row.reviewed_at) : null,
      created_at: row.uploaded_at ? String(row.uploaded_at) : null,
    }));
  } else {
    documentsFromBusinessTable = true;
    const { data: docRows, error: docsError } = await supabase
      .from("business_documents")
      .select("*")
      .eq("boutique_id", id)
      .order("type", { ascending: true });

    if (docsError) {
      return NextResponse.json(
        { success: false, message: docsError.message },
        { status: 500 },
      );
    }

    documents = (docRows ?? []).map((row) => ({
      id: String(row.id),
      boutique_id: String(row.boutique_id),
      type: String(row.type ?? ""),
      name: String(row.name ?? ""),
      file_url:
        resolveJewellerDocumentUrlWithClient(supabase, row.file_url, supabaseUrl) ?? "",
      license_no: row.license_no ? String(row.license_no) : null,
      status: String(row.status ?? "pending"),
      verified_at: row.verified_at ? String(row.verified_at) : null,
      created_at: row.created_at ? String(row.created_at) : null,
    }));
  }

  if (documentsFromBusinessTable) {
    await syncBusinessDocumentUrls(supabase, documents, supabaseUrl);
  }

  const { count: productsCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("boutique_id", id)
    .neq("status", "deleted");

  let ownerProfile: StoreReviewDetails["ownerProfile"] = null;
  if (boutique.jeweller_user_id) {
    const { data: profile } = await supabase
      .from("users_profile")
      .select("id, full_name, name, email, phone, profile_image")
      .eq("id", boutique.jeweller_user_id)
      .maybeSingle();

    if (profile) {
      ownerProfile = {
        id: String(profile.id),
        full_name:
          (profile.full_name as string | null) ??
          (profile.name as string | null) ??
          null,
        email: (profile.email as string | null) ?? null,
        phone: (profile.phone as string | null) ?? null,
        profile_image: (profile.profile_image as string | null) ?? null,
      };
    }
  }

  const logoUrl = resolveAssetUrl(supabase, boutique.logo_url, supabaseUrl);
  const coverUrl = resolveAssetUrl(supabase, boutique.cover_image_url, supabaseUrl);
  const bannerImages = Array.isArray(boutique.banner_images)
    ? (boutique.banner_images as unknown[])
        .map((u) => resolveAssetUrl(supabase, String(u), supabaseUrl))
        .filter((u): u is string => Boolean(u))
    : [];
  const galleryImages = Array.isArray(boutique.gallery_images)
    ? (boutique.gallery_images as unknown[])
        .map((u) => resolveAssetUrl(supabase, String(u), supabaseUrl))
        .filter((u): u is string => Boolean(u))
    : [];

  const workingDays = Array.isArray(boutique.working_days)
    ? (boutique.working_days as unknown[]).map(String)
    : [];

  const payload: StoreReviewDetails = {
    id: String(boutique.id),
    name: String(boutique.name ?? ""),
    store_status: (boutique.store_status as StoreReviewDetails["store_status"]) ?? null,
    is_self_managed: Boolean(boutique.is_self_managed),
    jeweller_user_id: boutique.jeweller_user_id ? String(boutique.jeweller_user_id) : null,
    owner_name: boutique.owner_name ? String(boutique.owner_name) : null,
    member_id: boutique.member_id ? String(boutique.member_id) : null,
    store_tagline: boutique.store_tagline ? String(boutique.store_tagline) : null,
    contact_number: boutique.contact_number ? String(boutique.contact_number) : null,
    phone_number: boutique.phone_number ? String(boutique.phone_number) : null,
    phone: boutique.phone ? String(boutique.phone) : null,
    whatsapp: boutique.whatsapp ? String(boutique.whatsapp) : null,
    whatsapp_number: boutique.whatsapp_number ? String(boutique.whatsapp_number) : null,
    email: ownerProfile?.email ?? null,
    address: boutique.address ? String(boutique.address) : null,
    full_address: boutique.full_address ? String(boutique.full_address) : null,
    location: boutique.location ? String(boutique.location) : null,
    latitude: typeof boutique.latitude === "number" ? boutique.latitude : null,
    longitude: typeof boutique.longitude === "number" ? boutique.longitude : null,
    description: boutique.description ? String(boutique.description) : null,
    website_url: boutique.website_url ? String(boutique.website_url) : null,
    instagram: boutique.instagram ? String(boutique.instagram) : null,
    instagram_url: boutique.instagram_url ? String(boutique.instagram_url) : null,
    opening_time: boutique.opening_time ? String(boutique.opening_time) : null,
    closing_time: boutique.closing_time ? String(boutique.closing_time) : null,
    opening_hours: boutique.opening_hours ? String(boutique.opening_hours) : null,
    working_days: workingDays,
    onboarding_step:
      typeof boutique.onboarding_step === "number" ? boutique.onboarding_step : null,
    is_onboarding_done: Boolean(boutique.is_onboarding_done),
    logo_url: logoUrl,
    cover_image_url: coverUrl,
    image: resolveAssetUrl(supabase, boutique.image, supabaseUrl),
    banner_images: bannerImages.length ? bannerImages : coverUrl ? [coverUrl] : [],
    gallery_images: galleryImages.length ? galleryImages : bannerImages,
    documents,
    ownerProfile,
    created_at: boutique.created_at ? String(boutique.created_at) : null,
    updated_at: boutique.updated_at ? String(boutique.updated_at) : null,
    products_count: productsCount ?? 0,
    verification_status:
      (boutique.verification_status as StoreReviewDetails["verification_status"]) ?? "PENDING",
    verification_rejected_reason: boutique.verification_rejected_reason
      ? String(boutique.verification_rejected_reason)
      : null,
    canReview: isAwaitingAdminReview(
      boutique.verification_status ? String(boutique.verification_status) : null,
      boutique.store_status ? String(boutique.store_status) : null,
    ),
  };

  return NextResponse.json({ success: true, data: payload });
}
