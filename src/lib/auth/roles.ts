import type { AdminRole } from "@/types";

const ALLOWED_ROLES: AdminRole[] = ["super_admin", "admin"];

export function isAdminRole(role: string | undefined): role is AdminRole {
  return !!role && ALLOWED_ROLES.includes(role as AdminRole);
}
