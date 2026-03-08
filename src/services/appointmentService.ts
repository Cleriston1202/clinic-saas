import { Appointment, AppointmentStatus } from "@/types/database";

async function request<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export const appointmentService = {
  list: (accessToken: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const suffix = params.size ? `?${params.toString()}` : "";
    return request<Appointment[]>(`/api/appointments${suffix}`, accessToken);
  },

  create: (
    accessToken: string,
    payload: Pick<Appointment, "patient_id" | "doctor_id" | "start_time" | "end_time" | "notes">,
  ) =>
    request<Appointment>("/api/appointments", accessToken, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (
    accessToken: string,
    id: string,
    payload: Partial<Pick<Appointment, "start_time" | "end_time" | "notes"> & { status: AppointmentStatus }>,
  ) =>
    request<Appointment>(`/api/appointments/${id}`, accessToken, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
