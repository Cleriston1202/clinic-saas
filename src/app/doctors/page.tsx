"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Doctor } from "@/types/database";

export default function DoctorsPage() {
  const router = useRouter();
  const { accessToken, loading } = useSupabaseSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");

  const loadDoctors = async (token: string) => {
    const response = await fetch("/api/doctors", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await response.text());
    setDoctors(await response.json());
  };

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      router.push("/login");
      return;
    }

    loadDoctors(accessToken).catch(console.error);
  }, [accessToken, loading, router]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;

    const response = await fetch("/api/doctors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name, specialty }),
    });

    if (!response.ok) {
      alert(await response.text());
      return;
    }

    setName("");
    setSpecialty("");
    await loadDoctors(accessToken);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <AppNav />
      <h1 className="mb-4 text-2xl font-semibold">Médicos</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <form onSubmit={handleCreate} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Criar médico</h2>
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Nome do médico" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Especialidade" value={specialty} onChange={(e) => setSpecialty(e.target.value)} required />
          <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">Criar médico</button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">Lista de médicos</h2>
          <div className="space-y-2">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="rounded-md border border-slate-200 px-3 py-2">
                <p className="text-sm font-medium text-slate-900">{doctor.name}</p>
                <p className="text-sm text-slate-500">{doctor.specialty}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
