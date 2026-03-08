"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { DashboardMetrics } from "@/types/database";

const initialMetrics: DashboardMetrics = {
  totalPatients: 0,
  appointmentsToday: 0,
  upcomingAppointments: 0,
  revenueThisMonth: 0,
};

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, loading } = useSupabaseSession();
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      router.push("/login");
      return;
    }

    fetch("/api/dashboard/metrics", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      })
      .then(setMetrics)
      .catch(console.error);
  }, [accessToken, loading, router]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <AppNav />
      <h1 className="mb-4 text-2xl font-semibold">Painel</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total de pacientes" value={String(metrics.totalPatients)} />
        <MetricCard label="Consultas de hoje" value={String(metrics.appointmentsToday)} />
        <MetricCard label="Próximas consultas" value={String(metrics.upcomingAppointments)} />
        <MetricCard label="Receita do mês" value={`R$ ${metrics.revenueThisMonth.toFixed(2)}`} />
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
