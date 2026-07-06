import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeProductDrilldown } from "@/lib/analytics/product-drilldown-stats";

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function GET(req: NextRequest) {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "Supabase not configured" },
      { status: 500 },
    );
  }

  const { searchParams } = req.nextUrl;
  const boutiqueId = searchParams.get("boutiqueId") ?? "";
  const date = searchParams.get("date") ?? "";

  if (!boutiqueId || !date) {
    return NextResponse.json(
      { success: false, message: "boutiqueId and date are required" },
      { status: 400 },
    );
  }

  try {
    const data = await computeProductDrilldown(supabase, {
      boutiqueId,
      date,
      page: Number(searchParams.get("page") ?? "1") || 1,
      limit: Number(searchParams.get("limit") ?? "10") || 10,
      sort: (searchParams.get("sort") as "viewsDesc" | "viewsAsc") ?? "viewsDesc",
    });

    return NextResponse.json({
      success: true,
      data,
      message: "Product drilldown fetched",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load product drilldown";
    console.error("[product-drilldown] route error:", message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
