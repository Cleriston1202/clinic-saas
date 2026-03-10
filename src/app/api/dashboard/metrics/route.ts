import { NextRequest, NextResponse } from "next/server";
import { getUserAndClinic } from "@/app/api/_utils";

function dayBounds() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function GET(request: NextRequest) {
  const context = await getUserAndClinic(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const supabase = context.supabase;
  const today = dayBounds();
  const month = monthBounds();
  const now = new Date().toISOString();

  const [{ count: totalPatients }, { count: appointmentsToday }, { count: upcomingAppointments }, { count: canceledAppointments }, paymentsResult] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("start_time", today.start)
      .lte("start_time", today.end),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("start_time", now)
      .neq("status", "canceled"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "canceled")
      .gte("start_time", month.start)
      .lte("start_time", month.end),
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "paid")
      .gte("created_at", month.start)
      .lte("created_at", month.end),
  ]);

  const revenueThisMonth = (paymentsResult.data ?? []).reduce((sum, item) => sum + Number(item.amount), 0);

  return NextResponse.json({
    totalPatients: totalPatients ?? 0,
    appointmentsToday: appointmentsToday ?? 0,
    upcomingAppointments: upcomingAppointments ?? 0,
    revenueThisMonth,
    canceledAppointments: canceledAppointments ?? 0,
  });
}
