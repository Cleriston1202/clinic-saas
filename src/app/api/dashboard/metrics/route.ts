import { NextRequest, NextResponse } from "next/server";
import { getUserAndClinic } from "@/app/api/_utils";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });

function isoRange(start: Date, end: Date) {
  return { start: start.toISOString(), end: end.toISOString() };
}

function dayBounds() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return isoRange(start, end);
}

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return isoRange(start, end);
}

function weekBounds() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return isoRange(start, end);
}

function trailingMonthsBounds(months: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return isoRange(start, end);
}

function buildWeeklyAppointments(rows: Array<{ start_time: string }>) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const totals = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(weekStart);
    current.setDate(weekStart.getDate() + index);
    return {
      label: weekdayFormatter.format(current).replace(".", ""),
      value: 0,
    };
  });

  rows.forEach((appointment) => {
    const appointmentDate = new Date(appointment.start_time);
    const jsDay = appointmentDate.getDay();
    const index = jsDay === 0 ? 6 : jsDay - 1;
    if (totals[index]) {
      totals[index].value += 1;
    }
  });

  return totals;
}

function buildStatusBreakdown(rows: Array<{ status: string }>) {
  const labels = {
    scheduled: "Agendadas",
    confirmed: "Confirmadas",
    completed: "Concluidas",
    canceled: "Canceladas",
  } as const;

  const colors = {
    scheduled: "#0f766e",
    confirmed: "#2563eb",
    completed: "#7c3aed",
    canceled: "#dc2626",
  } as const;

  const totals = {
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    canceled: 0,
  };

  rows.forEach((appointment) => {
    if (appointment.status in totals) {
      totals[appointment.status as keyof typeof totals] += 1;
    }
  });

  return (Object.keys(totals) as Array<keyof typeof totals>).map((status) => ({
    label: labels[status],
    value: totals[status],
    color: colors[status],
  }));
}

function buildRevenueTrend(rows: Array<{ amount: number | string; created_at: string }>, months: number) {
  const now = new Date();
  const series = Array.from({ length: months }, (_, index) => {
    const current = new Date(now.getFullYear(), now.getMonth() - (months - 1) + index, 1);
    return {
      key: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`,
      label: monthFormatter.format(current).replace(".", ""),
      value: 0,
    };
  });

  const indexByMonth = new Map(series.map((item, index) => [item.key, index]));

  rows.forEach((payment) => {
    const current = new Date(payment.created_at);
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
    const index = indexByMonth.get(key);
    if (index !== undefined) {
      series[index].value += Number(payment.amount);
    }
  });

  return series.map(({ label, value }) => ({ label, value: Number(value.toFixed(2)) }));
}

export async function GET(request: NextRequest) {
  const context = await getUserAndClinic(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  if (!context.profile.clinic_id) {
    return NextResponse.json({ error: "Clinic profile not initialized." }, { status: 400 });
  }

  let adminSupabase: ReturnType<typeof createSupabaseAdminClient> | null = null;
  try {
    adminSupabase = createSupabaseAdminClient();
  } catch {
    adminSupabase = null;
  }

  const clinicId = context.profile.clinic_id;
  const supabase = adminSupabase ?? context.supabase;
  const today = dayBounds();
  const month = monthBounds();
  const week = weekBounds();
  const trailingMonths = trailingMonthsBounds(6);
  const now = new Date().toISOString();

  const [{ count: totalPatients }, { count: appointmentsToday }, { count: upcomingAppointments }, { count: canceledAppointments }, paymentsResult, weeklyAppointmentsResult, monthlyAppointmentsResult] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .gte("start_time", today.start)
      .lte("start_time", today.end),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .gte("start_time", now)
      .neq("status", "canceled"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("status", "canceled")
      .gte("start_time", month.start)
      .lte("start_time", month.end),
    supabase
      .from("payments")
      .select("amount, created_at")
      .eq("clinic_id", clinicId)
      .eq("status", "paid")
      .gte("created_at", trailingMonths.start)
      .lte("created_at", trailingMonths.end),
    supabase
      .from("appointments")
      .select("start_time")
      .eq("clinic_id", clinicId)
      .neq("status", "canceled")
      .gte("start_time", week.start)
      .lte("start_time", week.end),
    supabase
      .from("appointments")
      .select("status")
      .eq("clinic_id", clinicId)
      .gte("start_time", month.start)
      .lte("start_time", month.end),
  ]);

  const paymentRows = paymentsResult.data ?? [];
  const revenueThisMonth = paymentRows
    .filter((payment) => payment.created_at >= month.start && payment.created_at <= month.end)
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return NextResponse.json({
    totalPatients: totalPatients ?? 0,
    appointmentsToday: appointmentsToday ?? 0,
    upcomingAppointments: upcomingAppointments ?? 0,
    revenueThisMonth,
    canceledAppointments: canceledAppointments ?? 0,
    weeklyAppointments: buildWeeklyAppointments(weeklyAppointmentsResult.data ?? []),
    statusBreakdown: buildStatusBreakdown(monthlyAppointmentsResult.data ?? []),
    revenueTrend: buildRevenueTrend(paymentRows, 6),
  });
}
