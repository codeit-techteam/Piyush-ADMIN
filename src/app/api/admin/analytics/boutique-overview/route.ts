import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeBoutiqueOverviewStats } from "@/lib/analytics/boutique-overview-stats";

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
  const query = {
    range: searchParams.get("range") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  };

  try {
    const data = await computeBoutiqueOverviewStats(supabase, query);
    return NextResponse.json({
      success: true,
      data,
      message: "Boutique overview stats fetched",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load boutique overview";
    console.error("[boutique-overview] route error:", message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
