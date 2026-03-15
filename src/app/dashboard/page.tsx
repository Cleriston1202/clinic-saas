"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { BarChart, ChartCard, DonutChart, LineChart, MetricCard } from "@/components/dashboard/DashboardCharts";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { DashboardChartPoint, DashboardMetrics } from "@/types/database";

const initialMetrics: DashboardMetrics = {
  totalPatients: 0,
  appointmentsToday: 0,
  upcomingAppointments: 0,
  revenueThisMonth: 0,
  canceledAppointments: 0,
  weeklyAppointments: [],
  statusBreakdown: [],
  revenueTrend: [],
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const parseError = (raw: string) => {
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    return parsed.error ?? raw;
  } catch {
    return raw;
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, loading } = useSupabaseSession();
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [message, setMessage] = useState("");
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  const loadMetrics = useCallback(async (token: string) => {
    setIsLoadingMetrics(true);

    try {
      const response = await fetch("/api/dashboard/metrics", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(parseError(await response.text()));
      }

      const data = (await response.json()) as DashboardMetrics;
      setMetrics(data);
      setMessage("");
    } catch (error: unknown) {
      const next = error instanceof Error ? error.message : "Falha ao carregar metricas.";
      setMessage(next);
      if (next.includes("Clinic profile not initialized")) {
        router.push("/settings");
      }
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [router]);

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      router.push("/login");
      return;
    }

    loadMetrics(accessToken);
  }, [accessToken, loading, loadMetrics, router]);

  const bestWeekday = bestPoint(metrics.weeklyAppointments, "Sem dados");
  const bestStatus = bestPoint(metrics.statusBreakdown, "Sem dados");
  const bestRevenueMonth = bestPoint(metrics.revenueTrend, "Sem dados");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <AppNav />

      <section className="mb-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="surface-card rounded-[2rem] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Visao geral</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--text)]">Painel da clinica</h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
            Acompanhe a carga da agenda, a distribuicao dos atendimentos e a evolucao da receita sem sair da tela principal.
          </p>
        </div>

        <div className="surface-card rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,118,110,0.14),rgba(11,95,88,0.04))] p-6">
          <p className="text-sm text-[var(--muted)]">Receita do mes</p>
          <p className="mt-2 text-4xl font-semibold text-[var(--text)]">{currencyFormatter.format(metrics.revenueThisMonth)}</p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {isLoadingMetrics ? "Atualizando dados da clinica..." : "Baseado nos pagamentos marcados como pagos."}
          </p>
        </div>
      </section>

      {message ? <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total de pacientes" value={String(metrics.totalPatients)} hint="Base total cadastrada na clinica" />
        <MetricCard label="Consultas de hoje" value={String(metrics.appointmentsToday)} hint="Atendimentos previstos para hoje" />
        <MetricCard label="Proximas consultas" value={String(metrics.upcomingAppointments)} hint="Todas as consultas futuras nao canceladas" />
        <MetricCard label="Receita do mes" value={currencyFormatter.format(metrics.revenueThisMonth)} hint="Somatorio de pagamentos recebidos" />
        <MetricCard label="Consultas canceladas" value={String(metrics.canceledAppointments)} hint="Cancelamentos registrados no mes atual" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ChartCard title="Agenda da semana" subtitle="Volume de consultas por dia da semana atual.">
          <BarChart data={metrics.weeklyAppointments} />
        </ChartCard>

        <ChartCard title="Status do mes" subtitle="Distribuicao dos atendimentos registrados neste mes.">
          <DonutChart data={metrics.statusBreakdown} />
        </ChartCard>
      </section>

      <section className="mt-6">
        <ChartCard title="Tendencia de receita" subtitle="Evolucao dos pagamentos recebidos nos ultimos seis meses.">
          <LineChart data={metrics.revenueTrend} />
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="surface-card rounded-3xl p-5">
          <p className="text-sm text-[var(--muted)]">Melhor dia da semana</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text)]">{bestWeekday.label}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{bestWeekday.value} consultas previstas no pico semanal.</p>
        </div>
        <div className="surface-card rounded-3xl p-5">
          <p className="text-sm text-[var(--muted)]">Status predominante</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text)]">{bestStatus.label}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{bestStatus.value} consultas concentradas neste status.</p>
        </div>
        <div className="surface-card rounded-3xl p-5">
          <p className="text-sm text-[var(--muted)]">Melhor mes recente</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text)]">{bestRevenueMonth.label}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{currencyFormatter.format(bestRevenueMonth.value)} foi o melhor resultado na janela recente.</p>
        </div>
      </section>

      <p className="mt-4 text-xs text-[var(--muted)]">{isLoadingMetrics ? "Sincronizando indicadores..." : "Indicadores atualizados com base nos dados da clinica."}</p>
    </main>
  );
}

function bestPoint(points: DashboardChartPoint[], emptyLabel: string) {
  if (points.length === 0) {
    return { label: emptyLabel, value: 0 };
  }

  return points.reduce((best, current) => (current.value > best.value ? current : best), points[0]);
}
