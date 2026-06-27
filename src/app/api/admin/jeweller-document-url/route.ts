import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  extractJewellerDocumentStoragePath,
  resolveJewellerDocumentUrlWithClient,
} from "@/lib/jeweller-documents";

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

/**
 * Resolve a jeweller document to a browser-openable public URL.
 * GET /api/admin/jeweller-document-url?file_url=...
 */
export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const fileUrl = req.nextUrl.searchParams.get("file_url");

  if (!supabaseUrl) {
    return NextResponse.json(
      { success: false, message: "Supabase URL not configured" },
      { status: 500 },
    );
  }

  if (!fileUrl?.trim()) {
    return NextResponse.json(
      { success: false, message: "file_url is required" },
      { status: 400 },
    );
  }

  const supabase = getAdminSupabase();
  const resolved = supabase
    ? resolveJewellerDocumentUrlWithClient(supabase, fileUrl, supabaseUrl)
    : null;

  const storagePath = extractJewellerDocumentStoragePath(fileUrl);

  if (!resolved || !storagePath) {
    return NextResponse.json(
      { success: false, message: "Could not resolve document URL" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      url: resolved,
      storagePath,
    },
  });
}
