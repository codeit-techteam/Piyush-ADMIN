import type { BoutiqueCompletionMeta } from "@/lib/boutique-completion";

export async function fetchBoutiqueCompletionMeta(
  boutiqueIds: string[],
): Promise<Record<string, BoutiqueCompletionMeta>> {
  if (boutiqueIds.length === 0) {
    return {};
  }

  const res = await fetch(
    `/api/admin/boutique-completion?ids=${encodeURIComponent(boutiqueIds.join(","))}`,
  );
  const json = (await res.json()) as {
    success: boolean;
    data?: Record<string, BoutiqueCompletionMeta>;
    message?: string;
  };

  if (!res.ok || !json.success) {
    throw new Error(json.message ?? "Failed to load boutique completion data");
  }

  return json.data ?? {};
}
