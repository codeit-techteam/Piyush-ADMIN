import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeSearchKeywordDrilldown } from "@/lib/analytics/customer-insight-stats";

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
  const keyword = searchParams.get("keyword") ?? "";

  if (!keyword.trim()) {
    return NextResponse.json(
      { success: false, message: "keyword is required" },
      { status: 400 },
    );
  }

  try {
    const data = await computeSearchKeywordDrilldown(supabase, {
      keyword,
      range: searchParams.get("range") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    return NextResponse.json({
      success: true,
      data,
      message: "Search keyword drilldown fetched",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load search keyword drilldown";
    console.error("[search-drilldown] route error:", message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
