import type { ApiResponse, MarketplaceUser, UserDetails } from "@/types";

export async function listUsers() {
  const res = await fetch("/api/admin/users");
  const json = (await res.json()) as ApiResponse<MarketplaceUser[]> & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(json.message ?? "Failed to load users");
  }
  return json.data;
}

export async function getUserDetails(id: string) {
  const res = await fetch(`/api/admin/users/${id}`);
  const json = (await res.json()) as ApiResponse<UserDetails> & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(json.message ?? "Failed to load customer details");
  }
  return json.data;
}

export async function setCustomerAccountStatus(
  id: string,
  action: "terminate" | "reactivate",
) {
  const res = await fetch(`/api/admin/users/${id}/terminate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const json = (await res.json()) as ApiResponse<{ id: string; is_terminated: boolean }> & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(json.message ?? "Failed to update account status");
  }
  return json.data;
}
