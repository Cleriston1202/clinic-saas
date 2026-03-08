"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

interface ClinicPayload {
  id: string;
  name: string;
  plan: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { accessToken, loading } = useSupabaseSession();
  const [clinic, setClinic] = useState<ClinicPayload | null>(null);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("starter");
  const [message, setMessage] = useState("");

  const parseError = (raw: string) => {
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      return parsed.error ?? raw;
    } catch {
      return raw;
    }
  };

  const loadClinic = async (token: string) => {
    const response = await fetch("/api/settings/clinic", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(parseError(await response.text()));

    const data = await response.json();
    if (data.clinic) {
      setClinic(data.clinic);
      setName(data.clinic.name);
      setPlan(data.clinic.plan);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      router.push("/login");
      return;
    }

    loadClinic(accessToken).catch((error: unknown) => {
      const next = error instanceof Error ? error.message : "Falha ao carregar configuracoes da clinica.";
      setMessage(next);
      if (next.includes("Clinic profile not initialized")) {
        router.push("/settings");
      }
    });
  }, [accessToken, loading, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;

    const response = await fetch("/api/settings/clinic", {
      method: clinic ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name, plan }),
    });

    if (!response.ok) {
      setMessage(parseError(await response.text()));
      return;
    }

    setMessage("Salvo com sucesso.");
    await loadClinic(accessToken);
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-6">
      <AppNav />
      <h1 className="mb-4 text-2xl font-semibold">Configurações</h1>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Perfil da clínica</h2>
        <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Nome da clínica" value={name} onChange={(e) => setName(e.target.value)} required />
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="starter">Iniciante</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Empresarial</option>
        </select>
        <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">Salvar configurações</button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </form>
    </main>
  );
}
