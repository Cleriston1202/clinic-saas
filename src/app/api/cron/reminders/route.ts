import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

type PersonRelation = { name?: string; phone?: string | null } | Array<{ name?: string; phone?: string | null }>;
type DoctorRelation = { name?: string } | Array<{ name?: string }>;

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatReminderMessage(patientName: string, doctorName: string, dateValue: Date) {
  const date = dateValue.toLocaleDateString();
  const time = dateValue.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `Olá ${patientName}, este é um lembrete da sua consulta com Dr. ${doctorName} em ${date} às ${time}.`;
}

function isWithinWindow(startTime: string, targetHours: number) {
  const appointmentMs = new Date(startTime).getTime();
  const now = Date.now();
  const diffMinutes = Math.floor((appointmentMs - now) / (1000 * 60));
  const targetMinutes = targetHours * 60;
  return diffMinutes >= targetMinutes && diffMinutes < targetMinutes + 10;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const windowEnd = new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString();

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("id,start_time,patient:patients(name,phone),doctor:doctors!appointments_professional_id_fkey(name)")
    .neq("status", "canceled")
    .lte("start_time", windowEnd);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let sent = 0;
  const failures: string[] = [];

  for (const appointment of appointments ?? []) {
    const shouldSend24 = isWithinWindow(appointment.start_time, 24);
    const shouldSend2 = isWithinWindow(appointment.start_time, 2);
    if (!shouldSend24 && !shouldSend2) continue;

    const patient = firstRelation(appointment.patient as PersonRelation | null);
    const doctor = firstRelation(appointment.doctor as DoctorRelation | null);
    const patientName = patient?.name ?? "Paciente";
    const doctorName = doctor?.name ?? "Dentista";
    const phone = patient?.phone ?? "";
    const message = formatReminderMessage(patientName, doctorName, new Date(appointment.start_time));

    const result = await sendWhatsAppMessage({ to: phone, message });
    if (result.ok) sent += 1;
    else failures.push(`${appointment.id}: ${result.error}`);
  }

  return NextResponse.json({ checked: appointments?.length ?? 0, sent, failures });
}
