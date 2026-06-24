import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { MarketplaceUser } from "@/types";

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function GET() {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "Supabase not configured" },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("users_profile")
    .select("id, full_name, name, phone, email, profile_image, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }

  const { data: appointmentRows, error: appointmentsError } = await supabase
    .from("appointments")
    .select("user_id")
    .is("deleted_at", null);

  if (appointmentsError) {
    return NextResponse.json(
      { success: false, message: appointmentsError.message },
      { status: 500 },
    );
  }

  const appointmentCounts = new Map<string, number>();
  for (const row of appointmentRows ?? []) {
    const userId = String(row.user_id);
    appointmentCounts.set(userId, (appointmentCounts.get(userId) ?? 0) + 1);
  }

  const users: MarketplaceUser[] = (data ?? []).map((row) => {
    const id = String(row.id);
    return {
      id,
      name: String(row.full_name ?? row.name ?? "Unknown Customer"),
      phone: row.phone ? String(row.phone) : null,
      email: row.email ? String(row.email) : null,
      profile_image: row.profile_image ? String(row.profile_image) : null,
      created_at: row.created_at ? String(row.created_at) : null,
      appointments_count: appointmentCounts.get(id) ?? 0,
    };
  });

  return NextResponse.json({ success: true, data: users });
}
