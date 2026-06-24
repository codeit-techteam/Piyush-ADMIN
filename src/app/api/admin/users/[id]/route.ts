import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { UserAppointmentSummary, UserDetails, UserWishlistItem } from "@/types";

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function resolveProductImage(row: Record<string, unknown>): string | null {
  const images = Array.isArray(row.images) ? row.images : [];
  const firstImage = images.map(String).find((url) => url.startsWith("http")) ?? null;
  const candidates = [row.thumbnail, row.primary_image, row.image, firstImage];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function isAuthUserBanned(bannedUntil: string | null | undefined): boolean {
  if (!bannedUntil) return false;
  const until = new Date(bannedUntil).getTime();
  return !Number.isNaN(until) && until > Date.now();
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = getAdminSupabase();

  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "Supabase not configured" },
      { status: 500 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("users_profile")
    .select("id, full_name, name, phone, email, profile_image, created_at")
    .eq("id", id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { success: false, message: profileError.message },
      { status: 500 },
    );
  }

  if (!profile) {
    return NextResponse.json(
      { success: false, message: "Customer not found" },
      { status: 404 },
    );
  }

  let isTerminated = false;
  try {
    const { data: authData } = await supabase.auth.admin.getUserById(id);
    isTerminated = isAuthUserBanned(authData.user?.banned_until);
  } catch {
    isTerminated = false;
  }

  const { data: appointmentRows, error: appointmentsError } = await supabase
    .from("appointments")
    .select(
      "id, boutique_id, date, time, type, notes, status, starts_at, created_at, boutiques(name)",
    )
    .eq("user_id", id)
    .is("deleted_at", null)
    .order("starts_at", { ascending: false, nullsFirst: false });

  if (appointmentsError) {
    return NextResponse.json(
      { success: false, message: appointmentsError.message },
      { status: 500 },
    );
  }

  const { data: wishlistRows, error: wishlistError } = await supabase
    .from("wishlist_items")
    .select("id, product_id, created_at, products(id, name, price, image, thumbnail, primary_image, images)")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  if (wishlistError) {
    return NextResponse.json(
      { success: false, message: wishlistError.message },
      { status: 500 },
    );
  }

  const appointments: UserAppointmentSummary[] = (appointmentRows ?? []).map((row) => {
    const boutique = row.boutiques as { name?: string } | { name?: string }[] | null;
    const boutiqueName = Array.isArray(boutique) ? boutique[0]?.name : boutique?.name;
    return {
      id: String(row.id),
      boutique_id: row.boutique_id ? String(row.boutique_id) : null,
      boutique_name: boutiqueName ? String(boutiqueName) : null,
      date: row.date ? String(row.date) : null,
      time: row.time ? String(row.time) : null,
      type: row.type ? String(row.type) : null,
      status: row.status ? String(row.status) : null,
      starts_at: row.starts_at ? String(row.starts_at) : null,
      created_at: row.created_at ? String(row.created_at) : null,
      notes: row.notes ? String(row.notes) : null,
    };
  });

  const wishlist: UserWishlistItem[] = (wishlistRows ?? []).map((row) => {
    const rawProduct = row.products as Record<string, unknown> | Record<string, unknown>[] | null;
    const product = Array.isArray(rawProduct) ? rawProduct[0] : rawProduct;
    return {
      id: String(row.id),
      product_id: String(row.product_id),
      created_at: row.created_at ? String(row.created_at) : null,
      product: product
        ? {
            id: String(product.id ?? row.product_id),
            name: String(product.name ?? "Unknown product"),
            price: Number(product.price ?? 0),
            image: resolveProductImage(product),
          }
        : null,
    };
  });

  const payload: UserDetails = {
    id: String(profile.id),
    name: String(profile.full_name ?? profile.name ?? "Unknown Customer"),
    phone: profile.phone ? String(profile.phone) : null,
    email: profile.email ? String(profile.email) : null,
    profile_image: profile.profile_image ? String(profile.profile_image) : null,
    created_at: profile.created_at ? String(profile.created_at) : null,
    appointments_count: appointments.length,
    is_terminated: isTerminated,
    appointments,
    wishlist,
  };

  return NextResponse.json({ success: true, data: payload });
}
