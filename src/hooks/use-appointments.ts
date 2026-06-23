"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAppointmentsAdmin,
  updateAppointmentStatusAdmin,
  type AppointmentListFilters,
} from "@/lib/api/services/appointments";
import type { AppointmentStatus } from "@/types";

export function useAppointments(filters?: AppointmentListFilters) {
  return useQuery({
    queryKey: ["appointments", "admin", filters?.status ?? "all", filters?.boutiqueId ?? ""],
    queryFn: () => listAppointmentsAdmin(filters),
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: AppointmentStatus;
    }) => updateAppointmentStatusAdmin(appointmentId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments", "admin"] });
    },
  });
}
