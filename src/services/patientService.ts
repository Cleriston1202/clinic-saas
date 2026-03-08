import { Patient } from "@/types/database";

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

export const patientService = {
  list: (accessToken: string, search?: string) =>
    request<Patient[]>(`/api/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`, accessToken),

  create: (accessToken: string, payload: Omit<Patient, "id" | "clinic_id" | "created_at">) =>
    request<Patient>("/api/patients", accessToken, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (accessToken: string, id: string, payload: Partial<Pick<Patient, "name" | "phone" | "email" | "birth_date">>) =>
    request<Patient>(`/api/patients/${id}`, accessToken, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
