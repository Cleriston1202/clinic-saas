import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface AvailableSlot {
  startIso: string;
  endIso: string;
  label: string;
}

const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 18;
const SLOT_STEP_MINUTES = 30;

function formatTime(date: Date) {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export async function getAvailableSlots(clinicId: string, professionalId: string, date: string, durationMinutes: number): Promise<AvailableSlot[]> {
  const supabase = createSupabaseAdminClient();

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("start_time,end_time,status")
    .eq("clinic_id", clinicId)
    .or(`professional_id.eq.${professionalId},doctor_id.eq.${professionalId}`)
    .gte("start_time", dayStart.toISOString())
    .lte("start_time", dayEnd.toISOString())
    .in("status", ["scheduled", "confirmed"]);

  if (error) {
    throw new Error(error.message);
  }

  const blocked = (appointments ?? []).map((item) => ({
    start: new Date(item.start_time),
    end: new Date(item.end_time),
  }));

  const slots: AvailableSlot[] = [];
  const cursor = new Date(`${date}T${String(BUSINESS_START_HOUR).padStart(2, "0")}:00:00`);
  const dayLimit = new Date(`${date}T${String(BUSINESS_END_HOUR).padStart(2, "0")}:00:00`);

  while (cursor < dayLimit) {
    const start = new Date(cursor);
    const end = new Date(start.getTime() + durationMinutes * 60_000);

    if (end <= dayLimit) {
      const isBlocked = blocked.some((existing) => intervalsOverlap(start, end, existing.start, existing.end));
      if (!isBlocked && start.getTime() > Date.now()) {
        slots.push({
          startIso: start.toISOString(),
          endIso: end.toISOString(),
          label: `${formatTime(start)} - ${formatTime(end)}`,
        });
      }
    }

    cursor.setMinutes(cursor.getMinutes() + SLOT_STEP_MINUTES);
  }

  return slots;
}
