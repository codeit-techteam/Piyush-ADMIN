import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function POST(
  req: NextRequest,
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

  const body = (await req.json().catch(() => ({}))) as { action?: "terminate" | "reactivate" };
  const action = body.action ?? "terminate";

  const { data: profile } = await supabase
    .from("users_profile")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { success: false, message: "Customer not found" },
      { status: 404 },
    );
  }

  if (action === "reactivate") {
    const { error } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: "none",
    });
    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({
      success: true,
      data: { id, is_terminated: false },
      message: "Customer account reactivated",
    });
  }

  const { error } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: "876000h",
  });

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: { id, is_terminated: true },
    message: "Customer account terminated — they can no longer sign in",
  });
}
