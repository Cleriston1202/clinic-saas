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
  const [message, setMessage] = useState("");

  const filteredPatients = useMemo(
    () => patients.filter((patient) => patient.name.toLowerCase().includes(search.toLowerCase())),
    [patients, search],
  );

  const loadPatients = useCallback(async (token: string) => {
    try {
      const data = await patientService.list(token, search || undefined);
      setPatients(data);
      setMessage("");
    } catch (error) {
      const next = error instanceof Error ? error.message : "Falha ao carregar pacientes.";
      setMessage(next);
      if (next.includes("Clinic profile not initialized.")) {
        router.push("/settings");
      }
    }
  }, [search]);

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      router.push("/login");
      return;
    }

    loadPatients(accessToken);
  }, [accessToken, loading, loadPatients, router]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <AppNav />
      <h1 className="mb-4 text-2xl font-semibold">Pacientes</h1>
      {message ? <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p> : null}

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <PatientForm
          submitLabel={selected ? "Atualizar paciente" : "Criar paciente"}
          initialValue={selected ?? undefined}
          onSubmit={async (payload) => {
            if (!accessToken) return;
            try {
              if (selected) {
                await patientService.update(accessToken, selected.id, payload);
                setSelected(null);
              } else {
                await patientService.create(accessToken, payload);
              }
              setMessage("");
              await loadPatients(accessToken);
            } catch (error) {
              const next = error instanceof Error ? error.message : "Falha ao salvar paciente.";
              setMessage(next);
              if (next.includes("Clinic profile not initialized.")) {
                router.push("/settings");
              }
            }
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
