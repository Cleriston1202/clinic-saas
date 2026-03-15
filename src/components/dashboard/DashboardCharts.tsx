import { ReactNode } from "react";
import { DashboardChartPoint } from "@/types/database";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
}

interface ChartCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

interface BarChartProps {
  data: DashboardChartPoint[];
  color?: string;
}

interface LineChartProps {
  data: DashboardChartPoint[];
}

interface DonutChartProps {
  data: DashboardChartPoint[];
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_92%,var(--surface-soft)_8%)] px-4 text-center text-sm text-[var(--muted)]">
      {message}
    </div>
  );
}

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div className="surface-card rounded-2xl p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[var(--text)]">{value}</p>
      {hint ? <p className="mt-2 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <section className="surface-card rounded-3xl p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
          <p className="text-sm text-[var(--muted)]">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function BarChart({ data, color = "#0f766e" }: BarChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  if (maxValue === 0) {
    return <EmptyChartState message="Ainda nao ha consultas suficientes para montar este grafico." />;
  }

  return (
    <div className="grid h-64 grid-cols-7 items-end gap-3">
      {data.map((item) => {
        const height = `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 10 : 0)}%`;
        return (
          <div key={item.label} className="flex h-full flex-col items-center justify-end gap-2">
            <span className="text-xs font-medium text-[var(--text)]">{item.value}</span>
            <div className="flex h-full w-full items-end rounded-full bg-[color:color-mix(in_srgb,var(--surface)_65%,#d7efe4_35%)] px-1 py-1">
              <div className="w-full rounded-full" style={{ height, background: `linear-gradient(180deg, ${color} 0%, #0b5f58 100%)` }} />
            </div>
            <span className="text-xs text-[var(--muted)]">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function LineChart({ data }: LineChartProps) {
  const width = 640;
  const height = 240;
  const padding = 24;
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  if (maxValue === 0) {
    return <EmptyChartState message="Ainda nao ha receita suficiente para mostrar tendencia." />;
  }

  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((item, index) => {
    const x = padding + stepX * index;
    const y = height - padding - (item.value / maxValue) * (height - padding * 2);
    return { ...item, x, y };
  });

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath = [`M ${points[0]?.x ?? padding} ${height - padding}`, ...points.map((point) => `L ${point.x} ${point.y}`), `L ${points[points.length - 1]?.x ?? width - padding} ${height - padding}`, "Z"].join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full overflow-visible">
        <defs>
          <linearGradient id="revenueArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + ((height - padding * 2) / 3) * line;
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#d4e4d8" strokeDasharray="4 4" />;
        })}
        <path d={areaPath} fill="url(#revenueArea)" />
        <polyline fill="none" stroke="#0f766e" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" points={linePoints} />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" fill="#ffffff" stroke="#0f766e" strokeWidth="3" />
          </g>
        ))}
      </svg>

      <div className="mt-3 grid grid-cols-6 gap-3">
        {data.map((item) => (
          <div key={item.label} className="rounded-2xl bg-[color:color-mix(in_srgb,var(--surface)_72%,#e2f2eb_28%)] px-3 py-2 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">{currencyFormatter.format(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({ data }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <EmptyChartState message="Nao houve consultas neste mes para distribuir por status." />;
  }

  let currentStop = 0;
  const gradient = data
    .map((item) => {
      const start = currentStop;
      currentStop += item.value / total;
      return `${item.color ?? "#0f766e"} ${start * 100}% ${currentStop * 100}%`;
    })
    .join(", ");

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-center">
      <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--surface)_96%,#f6faf7_4%)] text-center shadow-[inset_0_0_0_1px_rgba(212,228,216,0.85)]">
          <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Total</span>
          <strong className="mt-1 text-3xl text-[var(--text)]">{total}</strong>
        </div>
      </div>

      <div className="grid gap-3">
        {data.map((item) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.label} className="rounded-2xl bg-[color:color-mix(in_srgb,var(--surface)_78%,#eff7f2_22%)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color ?? "#0f766e" }} />
                  <span className="text-sm font-medium text-[var(--text)]">{item.label}</span>
                </div>
                <div className="text-right">
                  <strong className="text-sm text-[var(--text)]">{item.value}</strong>
                  <p className="text-xs text-[var(--muted)]">{percentage}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}