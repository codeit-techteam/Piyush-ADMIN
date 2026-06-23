import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/admin/boutique-notify
 * Inserts a custom notification for a jeweller when their store is rejected.
 * Uses the service role key to bypass RLS.
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment variables.
 */
export async function POST(req: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    // Graceful degradation: DB trigger already sends a generic rejection notification.
    return NextResponse.json(
      { success: false, message: "Service role key not configured — DB trigger notification still sent." },
      { status: 200 },
    );
  }

  let body: {
    jeweller_user_id: string;
    boutique_id: string;
    reason?: string;
    event?: "approved" | "rejected";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const { jeweller_user_id, boutique_id, reason, event = "rejected" } = body;
  if (!jeweller_user_id || !boutique_id) {
    return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
  }
  if (event === "rejected" && !reason?.trim()) {
    return NextResponse.json({ success: false, message: "Rejection reason is required" }, { status: 400 });
  }

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const isApproved = event === "approved";
  const { error } = await adminSupabase.rpc("deliver_notification", {
    p_user_id: jeweller_user_id,
    p_title: isApproved ? "Documents Approved" : "Store Review Feedback",
    p_message: isApproved
      ? "Your boutique verification documents have been approved. An admin can now verify your store."
      : reason!.trim(),
    p_type: "approval",
    p_action_type: "boutique",
    p_action_id: boutique_id,
    p_metadata: {
      boutiqueId: boutique_id,
      source_event: isApproved ? "boutique_documents_approved" : "boutique_review_feedback",
      route: "/(app)/boutique-profile",
    },
  });

  if (error) {
    console.error("[boutique-notify] Failed to insert notification:", error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
