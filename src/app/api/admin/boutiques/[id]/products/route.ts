import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { BoutiqueProductSummary } from "@/types";

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
  const candidates = [
    row.thumbnail,
    row.primary_image,
    row.featured_image,
    row.image,
    firstImage,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const includeAll = req.nextUrl.searchParams.get("includeAll") !== "false";
  const supabase = getAdminSupabase();

  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "Supabase not configured" },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,price,image,thumbnail,primary_image,featured_image,images,category_id,collection_name,status,is_draft,created_at,updated_at,categories(id,name)",
    )
    .or(`boutique_id.eq.${id},primary_boutique_id.eq.${id}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }

  const products: BoutiqueProductSummary[] = (data ?? [])
    .filter((row) => {
      if (String(row.status ?? "").toLowerCase() === "deleted") return false;
      if (includeAll) return true;
      if (row.is_draft === true) return false;
      const status = String(row.status ?? "active").toLowerCase();
      return !["draft", "archived", "inactive"].includes(status);
    })
    .map((row) => {
      const rawCategory = row.categories as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null;
      const categoryRow = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
      return {
        id: String(row.id),
        name: String(row.name ?? ""),
        price: Number(row.price ?? 0),
        image: resolveProductImage(row as Record<string, unknown>),
        category_id: row.category_id ? String(row.category_id) : null,
        category: categoryRow
          ? { id: String(categoryRow.id), name: String(categoryRow.name) }
          : null,
        collection: row.collection_name ? String(row.collection_name) : null,
        collection_name: row.collection_name ? String(row.collection_name) : null,
        trending: false,
        video_url: null,
        video_thumbnail: null,
        status: row.status ? String(row.status) : "active",
        is_draft: Boolean(row.is_draft),
        created_at: row.created_at ? String(row.created_at) : null,
        updated_at: row.updated_at ? String(row.updated_at) : null,
      };
    });

  return NextResponse.json({ success: true, data: products });
}
