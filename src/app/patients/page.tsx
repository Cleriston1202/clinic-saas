"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import PatientForm from "@/components/PatientForm";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { patientService } from "@/services/patientService";
import { Patient } from "@/types/database";

export default function PatientsPage() {
  const router = useRouter();
  const { accessToken, loading } = useSupabaseSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);

  const filteredPatients = useMemo(
    () => patients.filter((patient) => patient.name.toLowerCase().includes(search.toLowerCase())),
    [patients, search],
  );

  const loadPatients = useCallback(async (token: string) => {
    const data = await patientService.list(token, search || undefined);
    setPatients(data);
  }, [search]);

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      router.push("/login");
      return;
    }

    loadPatients(accessToken).catch(console.error);
  }, [accessToken, loading, loadPatients, router]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <AppNav />
      <h1 className="mb-4 text-2xl font-semibold">Pacientes</h1>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <PatientForm
          submitLabel={selected ? "Atualizar paciente" : "Criar paciente"}
          initialValue={selected ?? undefined}
          onSubmit={async (payload) => {
            if (!accessToken) return;
            if (selected) {
              await patientService.update(accessToken, selected.id, payload);
              setSelected(null);
            } else {
              await patientService.create(accessToken, payload);
            }
            await loadPatients(accessToken);
          }}
        />

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <input
            className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Buscar pacientes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="space-y-2">
            {filteredPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => setSelected(patient)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <p className="font-medium text-slate-900">{patient.name}</p>
                <p className="text-slate-500">{patient.phone ?? "Sem telefone"}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
