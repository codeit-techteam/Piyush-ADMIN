"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserDetails } from "@/lib/api/services/users";

export function useUserDetails(userId: string) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: () => getUserDetails(userId),
    enabled: Boolean(userId),
  });
}
