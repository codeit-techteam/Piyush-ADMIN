import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasDocumentType, normalizeDocType } from "@/lib/boutique-completion";
import type { BoutiqueCompletionMeta } from "@/lib/boutique-completion";

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

function emptyMeta(): BoutiqueCompletionMeta {
  return {
    gstDocument: false,
    bisDocument: false,
    activeProductCount: 0,
  };
}

export async function GET(req: NextRequest) {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "Supabase not configured" },
      { status: 500 },
    );
  }

  const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
  const boutiqueIds = [...new Set(idsParam.split(",").map((id) => id.trim()).filter(Boolean))];

  if (boutiqueIds.length === 0) {
    return NextResponse.json({ success: true, data: {} });
  }

  const metaById = new Map<string, BoutiqueCompletionMeta>(
    boutiqueIds.map((id) => [id, emptyMeta()]),
  );

  const [{ data: businessDocs }, { data: verificationDocs }, { data: productRows }] =
    await Promise.all([
      supabase
        .from("business_documents")
        .select("boutique_id, type, file_url")
        .in("boutique_id", boutiqueIds),
      supabase
        .from("boutique_verification_documents")
        .select("boutique_id, doc_type, file_url")
        .in("boutique_id", boutiqueIds),
      supabase
        .from("products")
        .select("boutique_id")
        .in("boutique_id", boutiqueIds)
        .eq("is_draft", false)
        .eq("status", "active"),
    ]);

  for (const row of productRows ?? []) {
    const id = String(row.boutique_id);
    const entry = metaById.get(id);
    if (entry) {
      entry.activeProductCount += 1;
    }
  }

  for (const id of boutiqueIds) {
    const docs = [
      ...(businessDocs ?? [])
        .filter((row) => String(row.boutique_id) === id)
        .map((row) => ({
          type: normalizeDocType(String(row.type ?? "")),
          file_url: row.file_url ? String(row.file_url) : null,
        })),
      ...(verificationDocs ?? [])
        .filter((row) => String(row.boutique_id) === id)
        .map((row) => ({
          type: normalizeDocType(String(row.doc_type ?? "")),
          file_url: row.file_url ? String(row.file_url) : null,
        })),
    ];

    const entry = metaById.get(id);
    if (!entry) continue;

    entry.gstDocument = hasDocumentType(docs, "gst");
    entry.bisDocument = hasDocumentType(docs, "bis");
  }

  const data: Record<string, BoutiqueCompletionMeta> = {};
  for (const [id, meta] of metaById) {
    data[id] = meta;
  }

  return NextResponse.json({ success: true, data });
}
