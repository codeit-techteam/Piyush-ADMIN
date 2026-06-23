import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/auth/roles";
import type { AdminUser } from "@/types";

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  const appRole = (data.user.app_metadata?.role as string | undefined) ?? "";

  if (!isAdminRole(appRole)) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: data.user.user_metadata?.full_name,
    role: appRole,
  };
}
