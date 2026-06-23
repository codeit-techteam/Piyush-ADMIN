import { api } from "@/lib/api";
import type { AdminAppointment, ApiResponse, AppointmentStatus } from "@/types";

export type AppointmentListFilters = {
  status?: AppointmentStatus | "all";
  boutiqueId?: string;
};

export async function listAppointmentsAdmin(filters?: AppointmentListFilters) {
  const params: Record<string, string> = {};
  if (filters?.status && filters.status !== "all") {
    params.status = filters.status;
  }
  if (filters?.boutiqueId) {
    params.boutiqueId = filters.boutiqueId;
  }

  const { data } = await api.get<ApiResponse<AdminAppointment[]>>("/appointments/admin", {
    params,
  });
  return data.data ?? [];
}

export async function updateAppointmentStatusAdmin(
  appointmentId: string,
  status: AppointmentStatus,
) {
  const { data } = await api.patch<ApiResponse<AdminAppointment>>(
    `/appointments/admin/${encodeURIComponent(appointmentId)}`,
    { status },
  );
  return data.data;
}
