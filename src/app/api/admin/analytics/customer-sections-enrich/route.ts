import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enrichCustomerSections } from "@/lib/analytics/customer-insight-stats";
import type { CustomerAnalytics } from "@/types/analytics";

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "Supabase not configured" },
      { status: 500 },
    );
  }

  try {
    const body = (await req.json()) as {
      range?: string;
      from?: string;
      to?: string;
      sections?: CustomerAnalytics["sections"];
    };

    const data = await enrichCustomerSections(supabase, body, body.sections ?? {});

    return NextResponse.json({
      success: true,
      data,
      message: "Customer sections enriched",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to enrich customer sections";
    console.error("[customer-sections-enrich] route error:", message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
